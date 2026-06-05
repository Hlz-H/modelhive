import { and, count, desc, eq, like } from "drizzle-orm";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { StatusCodes } from "http-status-codes";
import type { BaseContext } from "@/server/lib/worker-types";
import type { InsertCollection, UpdateCollection } from "./collections.schema";
import { collectionItems, collections } from "./collections.table";

async function checkCollectionOwner(
	c: Context<BaseContext>,
	collectionId: string,
) {
	const db = c.get("db");
	const user = c.get("user");
	const collection = await db.query.collections.findFirst({
		where: eq(collections.id, collectionId),
	});
	if (!collection) {
		throw new HTTPException(StatusCodes.NOT_FOUND, {
			message: "Collection not found",
		});
	}
	if (collection.userId !== user?.id && user?.role !== "admin") {
		throw new HTTPException(StatusCodes.FORBIDDEN, {
			message: "Not authorized",
		});
	}
	return collection;
}

export const getCollections = async (c: Context<BaseContext>) => {
	const db = c.get("db");
	const query = c.req.query();
	const search = query.search || "";
	const page = Math.max(1, parseInt(query.page || "1", 10));
	const limit = Math.min(50, Math.max(1, parseInt(query.limit || "20", 10)));
	const offset = (page - 1) * limit;

	const conditions = [eq(collections.isPublic, true)];
	if (search) {
		conditions.push(like(collections.name, `%${search}%`));
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined;

	const [list, totalResult] = await Promise.all([
		db
			.select()
			.from(collections)
			.where(where)
			.orderBy(desc(collections.createdAt))
			.limit(limit)
			.offset(offset),
		db.select({ total: count() }).from(collections).where(where),
	]);

	const total = totalResult[0]?.total || 0;
	return c.json(
		{
			collections: list,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		},
		StatusCodes.OK,
	);
};

export const getCollectionById = async (
	c: Context<BaseContext>,
	input: { params?: { id: string } },
) => {
	const collectionId = input.params?.id;
	if (!collectionId) {
		throw new HTTPException(StatusCodes.BAD_REQUEST, {
			message: "Collection ID is required",
		});
	}

	const db = c.get("db");
	const collection = await db.query.collections.findFirst({
		where: eq(collections.id, collectionId),
	});

	if (!collection) {
		throw new HTTPException(StatusCodes.NOT_FOUND, {
			message: "Collection not found",
		});
	}

	const items = await db
		.select()
		.from(collectionItems)
		.where(eq(collectionItems.collectionId, collectionId))
		.orderBy(desc(collectionItems.createdAt));

	return c.json({ collection, items }, StatusCodes.OK);
};

export const createCollection = async (
	c: Context<BaseContext>,
	input: { body?: InsertCollection },
) => {
	if (!input.body) {
		throw new HTTPException(StatusCodes.BAD_REQUEST, {
			message: "Body is required",
		});
	}

	const db = c.get("db");
	const user = c.get("user");
	if (!user) {
		throw new HTTPException(StatusCodes.UNAUTHORIZED, {
			message: "Not authenticated",
		});
	}

	const [newCollection] = await db
		.insert(collections)
		.values({ ...input.body, userId: user.id })
		.returning();

	return c.json({ collection: newCollection }, StatusCodes.CREATED);
};

export const updateCollection = async (
	c: Context<BaseContext>,
	input: { params?: { id: string }; body?: UpdateCollection },
) => {
	const collectionId = input.params?.id;
	if (!collectionId || !input.body) {
		throw new HTTPException(StatusCodes.BAD_REQUEST, {
			message: "ID and body are required",
		});
	}

	const db = c.get("db");
	await checkCollectionOwner(c, collectionId);

	const [updated] = await db
		.update(collections)
		.set({ ...input.body, updatedAt: new Date().toISOString() })
		.where(eq(collections.id, collectionId))
		.returning();

	return c.json({ collection: updated }, StatusCodes.OK);
};

export const deleteCollection = async (
	c: Context<BaseContext>,
	input: { params?: { id: string } },
) => {
	const collectionId = input.params?.id;
	if (!collectionId) {
		throw new HTTPException(StatusCodes.BAD_REQUEST, {
			message: "Collection ID is required",
		});
	}

	const db = c.get("db");
	await checkCollectionOwner(c, collectionId);

	await db.delete(collections).where(eq(collections.id, collectionId));

	return new Response(null, { status: StatusCodes.NO_CONTENT });
};

export const getUserCollections = async (
	c: Context<BaseContext>,
	input: { params?: { id: string } },
) => {
	const userId = input.params?.id;
	if (!userId) {
		throw new HTTPException(StatusCodes.BAD_REQUEST, {
			message: "User ID is required",
		});
	}

	const db = c.get("db");
	const currentUser = c.get("user");
	const isOwner = currentUser?.id === userId;

	const conditions = [eq(collections.userId, userId)];
	if (!isOwner) {
		conditions.push(eq(collections.isPublic, true));
	}

	const list = await db
		.select()
		.from(collections)
		.where(and(...conditions))
		.orderBy(desc(collections.createdAt));

	return c.json({ collections: list }, StatusCodes.OK);
};

export const getMyCollections = async (c: Context<BaseContext>) => {
	const user = c.get("user");
	if (!user) {
		throw new HTTPException(StatusCodes.UNAUTHORIZED, {
			message: "Not authenticated",
		});
	}

	const db = c.get("db");
	const list = await db
		.select()
		.from(collections)
		.where(eq(collections.userId, user.id))
		.orderBy(desc(collections.createdAt));

	return c.json({ collections: list }, StatusCodes.OK);
};

export const addCollectionItem = async (
	c: Context<BaseContext>,
	input: { params?: { id: string }; body?: { modelId: string; note?: string } },
) => {
	const collectionId = input.params?.id;
	if (!collectionId || !input.body?.modelId) {
		throw new HTTPException(StatusCodes.BAD_REQUEST, {
			message: "Collection ID and modelId are required",
		});
	}

	const db = c.get("db");
	await checkCollectionOwner(c, collectionId);

	const [item] = await db
		.insert(collectionItems)
		.values({
			collectionId,
			modelId: input.body.modelId,
			note: input.body.note,
		})
		.returning();

	return c.json({ item }, StatusCodes.CREATED);
};

export const removeCollectionItem = async (
	c: Context<BaseContext>,
	input: { params?: { id: string; itemId: string } },
) => {
	const { id: collectionId, itemId } = input.params || {};
	if (!collectionId || !itemId) {
		throw new HTTPException(StatusCodes.BAD_REQUEST, {
			message: "Collection ID and Item ID are required",
		});
	}

	const db = c.get("db");
	await checkCollectionOwner(c, collectionId);

	await db
		.delete(collectionItems)
		.where(
			and(
				eq(collectionItems.id, itemId),
				eq(collectionItems.collectionId, collectionId),
			),
		);

	return new Response(null, { status: StatusCodes.NO_CONTENT });
};
