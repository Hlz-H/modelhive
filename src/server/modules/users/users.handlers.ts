import { count, desc, eq, inArray } from "drizzle-orm";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { StatusCodes } from "http-status-codes";
import type { BaseContext } from "@/server/lib/worker-types";
import { user } from "@/server/modules/auth/auth.table";
import { favorites, models } from "@/server/modules/models/models.table";
import type { UpdateUserProfile, UpdateUserRole } from "./users.schema";

// ===== User Profile Handlers =====

export const getCurrentUser = async (c: Context<BaseContext>) => {
	const currentUser = c.get("user");

	if (!currentUser) {
		throw new HTTPException(StatusCodes.UNAUTHORIZED, {
			message: "Not authenticated",
		});
	}

	return c.json({ user: currentUser }, StatusCodes.OK);
};

export const updateUserProfile = async (
	c: Context<BaseContext>,
	input: { body?: UpdateUserProfile },
) => {
	if (!input.body) {
		throw new HTTPException(StatusCodes.BAD_REQUEST, {
			message: "Request body is required",
		});
	}

	const currentUser = c.get("user");

	if (!currentUser) {
		throw new HTTPException(StatusCodes.UNAUTHORIZED, {
			message: "Not authenticated",
		});
	}

	const db = c.get("db");

	const [updatedUser] = await db
		.update(user)
		.set({
			...input.body,
			updatedAt: new Date(),
		})
		.where(eq(user.id, currentUser.id))
		.returning();

	return c.json({ user: updatedUser }, StatusCodes.OK);
};

export const getUserModels = async (
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

	const userModels = await db
		.select()
		.from(models)
		.where(eq(models.userId, userId))
		.orderBy(desc(models.createdAt));

	return c.json({ models: userModels }, StatusCodes.OK);
};

export const getUserFavorites = async (c: Context<BaseContext>) => {
	const db = c.get("db");
	const currentUser = c.get("user");

	if (!currentUser) {
		throw new HTTPException(StatusCodes.UNAUTHORIZED, {
			message: "Not authenticated",
		});
	}

	// Get all model IDs the user has favorited
	const userFavorites = await db
		.select({
			modelId: favorites.modelId,
		})
		.from(favorites)
		.where(eq(favorites.userId, currentUser.id))
		.orderBy(desc(favorites.createdAt));

	if (userFavorites.length === 0) {
		return c.json({ models: [] }, StatusCodes.OK);
	}

	const modelIds = userFavorites.map((f) => f.modelId);

	const userModels = await db
		.select()
		.from(models)
		.where(inArray(models.id, modelIds));

	return c.json({ models: userModels }, StatusCodes.OK);
};

// ===== Admin Handlers =====

export const listUsers = async (c: Context<BaseContext>) => {
	const db = c.get("db");
	const query = c.req.query();
	const page = Math.max(1, parseInt(query.page || "1", 10));
	const limit = Math.min(50, Math.max(1, parseInt(query.limit || "20", 10)));
	const offset = (page - 1) * limit;

	const [userList, totalResult] = await Promise.all([
		db
			.select()
			.from(user)
			.orderBy(desc(user.createdAt))
			.limit(limit)
			.offset(offset),
		db.select({ total: count() }).from(user),
	]);

	const total = totalResult[0]?.total || 0;

	return c.json(
		{
			users: userList,
			total,
			page,
			limit,
		},
		StatusCodes.OK,
	);
};

export const updateUserRole = async (
	c: Context<BaseContext>,
	input: { params?: { id: string }; body?: UpdateUserRole },
) => {
	const userId = input.params?.id;
	if (!userId) {
		throw new HTTPException(StatusCodes.BAD_REQUEST, {
			message: "User ID is required",
		});
	}

	if (!input.body) {
		throw new HTTPException(StatusCodes.BAD_REQUEST, {
			message: "Request body is required",
		});
	}

	const db = c.get("db");

	const [updatedUser] = await db
		.update(user)
		.set({
			role: input.body.role,
			updatedAt: new Date(),
		})
		.where(eq(user.id, userId))
		.returning();

	if (!updatedUser) {
		throw new HTTPException(StatusCodes.NOT_FOUND, {
			message: "User not found",
		});
	}

	return c.json({ user: updatedUser }, StatusCodes.OK);
};

export const listAllModels = async (c: Context<BaseContext>) => {
	const db = c.get("db");
	const query = c.req.query();
	const page = Math.max(1, parseInt(query.page || "1", 10));
	const limit = Math.min(50, Math.max(1, parseInt(query.limit || "20", 10)));
	const offset = (page - 1) * limit;

	const [modelList, totalResult] = await Promise.all([
		db
			.select()
			.from(models)
			.orderBy(desc(models.createdAt))
			.limit(limit)
			.offset(offset),
		db.select({ total: count() }).from(models),
	]);

	const total = totalResult[0]?.total || 0;

	return c.json(
		{
			models: modelList,
			total,
			page,
			limit,
		},
		StatusCodes.OK,
	);
};

export const moderateModel = async (
	c: Context<BaseContext>,
	input: { params?: { id: string }; body?: { isPublished: boolean } },
) => {
	const modelId = input.params?.id;
	if (!modelId) {
		throw new HTTPException(StatusCodes.BAD_REQUEST, {
			message: "Model ID is required",
		});
	}

	if (!input.body) {
		throw new HTTPException(StatusCodes.BAD_REQUEST, {
			message: "Request body is required",
		});
	}

	const db = c.get("db");

	const [updatedModel] = await db
		.update(models)
		.set({
			isPublished: input.body.isPublished,
		})
		.where(eq(models.id, modelId))
		.returning();

	if (!updatedModel) {
		throw new HTTPException(StatusCodes.NOT_FOUND, {
			message: "Model not found",
		});
	}

	return c.json({ model: updatedModel }, StatusCodes.OK);
};
