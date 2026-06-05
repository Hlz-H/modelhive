import { eq, like, and, desc, count, sql, inArray } from "drizzle-orm";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { StatusCodes } from "http-status-codes";
import type { BaseContext } from "@/server/lib/worker-types";
import { models, categories, tags, modelTags, favorites } from "./models.table";
import type { InsertCategory, InsertModel, UpdateModel, SelectTag } from "./models.schema";

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
	const tagFilter = query.tag || "";
	const sort = query.sort || "newest";
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
	if (tagFilter) {
		const tagModelIds = db
			.select({ modelId: modelTags.modelId })
			.from(modelTags)
			.innerJoin(tags, eq(modelTags.tagId, tags.id))
			.where(eq(tags.slug, tagFilter));
		conditions.push(inArray(models.id, tagModelIds));
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined;

	const orderBy = sort === "popular" ? desc(models.viewCount) : desc(models.createdAt);

	const [modelList, totalResult] = await Promise.all([
		db
			.select()
			.from(models)
			.where(where)
			.orderBy(orderBy)
			.limit(limit)
			.offset(offset),
		db
			.select({ total: count() })
			.from(models)
			.where(where),
	]);

	const total = totalResult[0]?.total || 0;

	// Enrich models with tags and favorite counts
	const modelIds = modelList.map((m) => m.id);

	let modelTagsMap: Record<string, SelectTag[]> = {};
	if (modelIds.length > 0) {
		const tagRows = await db
			.select({
				modelId: modelTags.modelId,
				id: tags.id,
				name: tags.name,
				slug: tags.slug,
				createdAt: tags.createdAt,
			})
			.from(modelTags)
			.innerJoin(tags, eq(modelTags.tagId, tags.id))
			.where(inArray(modelTags.modelId, modelIds));

		modelTagsMap = {};
		for (const row of tagRows) {
			if (!modelTagsMap[row.modelId]) {
				modelTagsMap[row.modelId] = [];
			}
			modelTagsMap[row.modelId].push({
				id: row.id,
				name: row.name,
				slug: row.slug,
				createdAt: row.createdAt,
			});
		}

		const favCounts = await db
			.select({
				modelId: favorites.modelId,
				count: count(),
			})
			.from(favorites)
			.where(inArray(favorites.modelId, modelIds))
			.groupBy(favorites.modelId);

		const favCountMap: Record<string, number> = {};
		for (const row of favCounts) {
			favCountMap[row.modelId] = row.count;
		}

		const enrichedModels = modelList.map((m) => ({
			...m,
			tags: modelTagsMap[m.id] || [],
			favoriteCount: favCountMap[m.id] || 0,
		}));

		return c.json(
			{
				models: enrichedModels,
				total,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
			},
			StatusCodes.OK,
		);
	}

	return c.json(
		{
			models: modelList.map((m) => ({ ...m, tags: [], favoriteCount: 0 })),
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

	// Fetch tags for this model
	const modelTagRows = await db
		.select({
			id: tags.id,
			name: tags.name,
			slug: tags.slug,
			createdAt: tags.createdAt,
		})
		.from(modelTags)
		.innerJoin(tags, eq(modelTags.tagId, tags.id))
		.where(eq(modelTags.modelId, model.id));

	// Fetch favorite count
	const [favResult] = await db
		.select({ count: count() })
		.from(favorites)
		.where(eq(favorites.modelId, model.id));

	return c.json(
		{
			model: {
				...model,
				tags: modelTagRows,
				favoriteCount: favResult?.count || 0,
			},
		},
		StatusCodes.OK,
	);
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

// ===== Tag Handlers =====

export const getAllTags = async (c: Context<BaseContext>) => {
	const db = c.get("db");
	const allTags = await db
		.select()
		.from(tags)
		.orderBy(tags.name);

	return c.json({ tags: allTags }, StatusCodes.OK);
};

export const createTag = async (
	c: Context<BaseContext>,
	input: { body?: { name: string; slug: string } },
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

	const [newTag] = await db
		.insert(tags)
		.values(input.body)
		.returning();

	return c.json({ tag: newTag }, StatusCodes.CREATED);
};

export const addModelTags = async (
	c: Context<BaseContext>,
	input: { params?: { id: string }; body?: { tags: string[] } },
) => {
	const modelId = input.params?.id;
	if (!modelId || !input.body?.tags?.length) {
		throw new HTTPException(StatusCodes.BAD_REQUEST, {
			message: "Model ID and tags array are required",
		});
	}

	const db = c.get("db");
	const user = c.get("user");

	if (!user) {
		throw new HTTPException(StatusCodes.UNAUTHORIZED, {
			message: "Not authenticated",
		});
	}

	// Check ownership
	const model = await db.query.models.findFirst({
		where: eq(models.id, modelId),
	});

	if (!model) {
		throw new HTTPException(StatusCodes.NOT_FOUND, {
			message: "Model not found",
		});
	}

	if (model.userId !== user.id && user.role !== "admin") {
		throw new HTTPException(StatusCodes.FORBIDDEN, {
			message: "Not authorized to modify this model",
		});
	}

	const tagIds: string[] = [];
	for (const tagName of input.body.tags) {
		const slug = tagName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

		// Find existing tag or create new one
		let tag = await db.query.tags.findFirst({
			where: eq(tags.slug, slug),
		});

		if (!tag) {
			[tag] = await db.insert(tags).values({ name: tagName, slug }).returning();
		}

		// Check if model already has this tag
		const existing = await db.query.modelTags.findFirst({
			where: and(eq(modelTags.modelId, modelId), eq(modelTags.tagId, tag.id)),
		});

		if (!existing) {
			await db.insert(modelTags).values({ modelId, tagId: tag.id }).run();
		}

		tagIds.push(tag.id);
	}

	return c.json({ tagIds }, StatusCodes.CREATED);
};

export const removeModelTag = async (
	c: Context<BaseContext>,
	input: { params?: { id: string; tagId: string } },
) => {
	const modelId = input.params?.id;
	const tagId = input.params?.tagId;

	if (!modelId || !tagId) {
		throw new HTTPException(StatusCodes.BAD_REQUEST, {
			message: "Model ID and Tag ID are required",
		});
	}

	const db = c.get("db");
	const user = c.get("user");

	if (!user) {
		throw new HTTPException(StatusCodes.UNAUTHORIZED, {
			message: "Not authenticated",
		});
	}

	const model = await db.query.models.findFirst({
		where: eq(models.id, modelId),
	});

	if (!model) {
		throw new HTTPException(StatusCodes.NOT_FOUND, {
			message: "Model not found",
		});
	}

	if (model.userId !== user.id && user.role !== "admin") {
		throw new HTTPException(StatusCodes.FORBIDDEN, {
			message: "Not authorized to modify this model",
		});
	}

	await db
		.delete(modelTags)
		.where(and(eq(modelTags.modelId, modelId), eq(modelTags.tagId, tagId)));

	return new Response(null, { status: StatusCodes.NO_CONTENT });
};

// ===== Favorite Handlers =====

export const toggleFavorite = async (
	c: Context<BaseContext>,
	input: { params?: { id: string } },
) => {
	const modelId = input.params?.id;
	if (!modelId) {
		throw new HTTPException(StatusCodes.BAD_REQUEST, {
			message: "Model ID is required",
		});
	}

	const db = c.get("db");
	const user = c.get("user");

	if (!user) {
		throw new HTTPException(StatusCodes.UNAUTHORIZED, {
			message: "Not authenticated",
		});
	}

	// Check model exists
	const model = await db.query.models.findFirst({
		where: eq(models.id, modelId),
	});

	if (!model) {
		throw new HTTPException(StatusCodes.NOT_FOUND, {
			message: "Model not found",
		});
	}

	// Check if already favorited
	const existing = await db.query.favorites.findFirst({
		where: and(eq(favorites.userId, user.id), eq(favorites.modelId, modelId)),
	});

	if (existing) {
		await db.delete(favorites).where(eq(favorites.id, existing.id));
		return c.json({ favorited: false });
	}

	await db.insert(favorites).values({ userId: user.id, modelId }).run();
	return c.json({ favorited: true }, StatusCodes.CREATED);
};

export const getModelFavorites = async (
	c: Context<BaseContext>,
	input: { params?: { id: string } },
) => {
	const modelId = input.params?.id;
	if (!modelId) {
		throw new HTTPException(StatusCodes.BAD_REQUEST, {
			message: "Model ID is required",
		});
	}

	const db = c.get("db");

	const [result] = await db
		.select({ count: count() })
		.from(favorites)
		.where(eq(favorites.modelId, modelId));

	return c.json({ count: result?.count || 0 }, StatusCodes.OK);
};
