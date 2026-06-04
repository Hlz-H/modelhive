import { eq, like, and, desc, count, sql } from "drizzle-orm";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { StatusCodes } from "http-status-codes";
import type { BaseContext } from "@/server/lib/worker-types";
import { models, categories } from "./models.table";
import type { InsertCategory, InsertModel, UpdateModel } from "./models.schema";

// ===== Category Handlers =====

export const getAllCategories = async (c: Context<BaseContext>) => {
	const db = c.get("db");
	const allCategories = await db
		.select()
		.from(categories)
		.orderBy(categories.name);

	return c.json({ categories: allCategories }, StatusCodes.OK);
};

export const createCategory = async (
	c: Context<BaseContext>,
	input: { body?: InsertCategory },
) => {
	if (!input.body) {
		throw new HTTPException(StatusCodes.BAD_REQUEST, {
			message: "Request body is required",
		});
	}

	const db = c.get("db");
	const user = c.get("user");

	if (!user || user.role !== "admin") {
		throw new HTTPException(StatusCodes.FORBIDDEN, {
			message: "Admin access required",
		});
	}

	const [newCategory] = await db
		.insert(categories)
		.values(input.body)
		.returning();

	return c.json({ category: newCategory }, StatusCodes.CREATED);
};

export const seedCategories = async (c: Context<BaseContext>) => {
	const db = c.get("db");

	// Default categories
	const defaultCategories = [
		{ name: "AI Model", slug: "ai-model", description: "Artificial intelligence and machine learning models" },
		{ name: "3D Model", slug: "3d-model", description: "3D models and meshes for rendering and games" },
		{ name: "Design", slug: "design", description: "Design assets, templates, and resources" },
		{ name: "Other", slug: "other", description: "Other types of models" },
	];

	const created = [];

	for (const cat of defaultCategories) {
		// Check if already exists
		const existing = await db.query.categories.findFirst({
			where: eq(categories.slug, cat.slug),
		});

		if (!existing) {
			const [newCat] = await db
				.insert(categories)
				.values(cat)
				.returning();
			created.push(newCat);
		}
	}

	return c.json({ 
		message: `Seeded ${created.length} categories`,
		categories: created,
	}, StatusCodes.OK);
};

// ===== Model Handlers =====

export const getModels = async (c: Context<BaseContext>) => {
	const db = c.get("db");
	const query = c.req.query();
	const search = query.search || "";
	const typeFilter = query.type || "";
	const categoryFilter = query.category || "";
	const page = Math.max(1, parseInt(query.page || "1"));
	const limit = Math.min(50, Math.max(1, parseInt(query.limit || "20")));
	const offset = (page - 1) * limit;

	const conditions = [];

	// Only show published models for public
	conditions.push(eq(models.isPublished, true));

	if (search) {
		conditions.push(like(models.name, `%${search}%`));
	}
	if (typeFilter) {
		conditions.push(eq(models.type, typeFilter));
	}
	if (categoryFilter) {
		conditions.push(eq(models.categoryId, categoryFilter));
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined;

	const [modelList, totalResult] = await Promise.all([
		db
			.select()
			.from(models)
			.where(where)
			.orderBy(desc(models.createdAt))
			.limit(limit)
			.offset(offset),
		db
			.select({ total: count() })
			.from(models)
			.where(where),
	]);

	const total = totalResult[0]?.total || 0;

	return c.json(
		{
			models: modelList,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		},
		StatusCodes.OK,
	);
};

export const getModelBySlug = async (
	c: Context<BaseContext>,
	input: { params?: { slug: string } },
) => {
	const slug = input.params?.slug;
	if (!slug) {
		throw new HTTPException(StatusCodes.BAD_REQUEST, {
			message: "Slug parameter is required",
		});
	}

	const db = c.get("db");

	const model = await db.query.models.findFirst({
		where: and(eq(models.slug, slug), eq(models.isPublished, true)),
	});

	if (!model) {
		throw new HTTPException(StatusCodes.NOT_FOUND, {
			message: "Model not found",
		});
	}

	// Increment view count (fire and forget)
	db.update(models)
		.set({ viewCount: sql`view_count + 1` })
		.where(eq(models.id, model.id))
		.run();

	return c.json({ model }, StatusCodes.OK);
};

export const createModel = async (
	c: Context<BaseContext>,
	input: { body?: InsertModel },
) => {
	if (!input.body) {
		throw new HTTPException(StatusCodes.BAD_REQUEST, {
			message: "Request body is required",
		});
	}

	const db = c.get("db");
	const user = c.get("user");

	if (!user) {
		throw new HTTPException(StatusCodes.UNAUTHORIZED, {
			message: "User not authenticated",
		});
	}

	const [newModel] = await db
		.insert(models)
		.values({
			...input.body,
			userId: user.id,
		})
		.returning();

	return c.json({ model: newModel }, StatusCodes.CREATED);
};

export const updateModel = async (
	c: Context<BaseContext>,
	input: { params?: { id: string }; body?: UpdateModel },
) => {
	const id = input.params?.id;
	if (!id) {
		throw new HTTPException(StatusCodes.BAD_REQUEST, {
			message: "ID parameter is required",
		});
	}

	if (!input.body) {
		throw new HTTPException(StatusCodes.BAD_REQUEST, {
			message: "Request body is required",
		});
	}

	const db = c.get("db");
	const user = c.get("user");

	if (!user) {
		throw new HTTPException(StatusCodes.UNAUTHORIZED, {
			message: "User not authenticated",
		});
	}

	const existing = await db.query.models.findFirst({
		where: eq(models.id, id),
	});

	if (!existing) {
		throw new HTTPException(StatusCodes.NOT_FOUND, {
			message: "Model not found",
		});
	}

	// Only owner or admin can update
	if (existing.userId !== user.id && user.role !== "admin") {
		throw new HTTPException(StatusCodes.FORBIDDEN, {
			message: "You do not have permission to update this model",
		});
	}

	const [updatedModel] = await db
		.update(models)
		.set({
			...input.body,
			updatedAt: sql`(CURRENT_TIMESTAMP)`,
		})
		.where(eq(models.id, id))
		.returning();

	return c.json({ model: updatedModel }, StatusCodes.OK);
};

export const deleteModel = async (
	c: Context<BaseContext>,
	input: { params?: { id: string } },
) => {
	const id = input.params?.id;
	if (!id) {
		throw new HTTPException(StatusCodes.BAD_REQUEST, {
			message: "ID parameter is required",
		});
	}

	const db = c.get("db");
	const user = c.get("user");

	if (!user) {
		throw new HTTPException(StatusCodes.UNAUTHORIZED, {
			message: "User not authenticated",
		});
	}

	const existing = await db.query.models.findFirst({
		where: eq(models.id, id),
	});

	if (!existing) {
		throw new HTTPException(StatusCodes.NOT_FOUND, {
			message: "Model not found",
		});
	}

	// Only owner or admin can delete
	if (existing.userId !== user.id && user.role !== "admin") {
		throw new HTTPException(StatusCodes.FORBIDDEN, {
			message: "You do not have permission to delete this model",
		});
	}

	await db.delete(models).where(eq(models.id, id));

	return new Response(null, { status: StatusCodes.NO_CONTENT });
};
