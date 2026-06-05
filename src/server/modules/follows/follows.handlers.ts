import { and, eq, count } from "drizzle-orm";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { StatusCodes } from "http-status-codes";
import type { BaseContext } from "@/server/lib/worker-types";
import { follows } from "./follows.table";

export const toggleFollow = async (
	c: Context<BaseContext>,
	input: { params?: { id: string } },
) => {
	const followingId = input.params?.id;
	if (!followingId) {
		throw new HTTPException(StatusCodes.BAD_REQUEST, {
			message: "User ID is required",
		});
	}

	const db = c.get("db");
	const user = c.get("user");

	if (!user) {
		throw new HTTPException(StatusCodes.UNAUTHORIZED, {
			message: "Not authenticated",
		});
	}

	if (user.id === followingId) {
		throw new HTTPException(StatusCodes.BAD_REQUEST, {
			message: "Cannot follow yourself",
		});
	}

	const existing = await db.query.follows.findFirst({
		where: and(
			eq(follows.followerId, user.id),
			eq(follows.followingId, followingId),
		),
	});

	if (existing) {
		await db.delete(follows).where(eq(follows.id, existing.id));
		return c.json({ following: false });
	}

	await db.insert(follows).values({ followerId: user.id, followingId }).run();
	return c.json({ following: true }, StatusCodes.CREATED);
};

export const getFollowers = async (
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

	const rows = await db
		.select({
			id: follows.followerId,
		})
		.from(follows)
		.where(eq(follows.followingId, userId));

	const userIds = rows.map((r) => r.id);

	return c.json({ followers: userIds }, StatusCodes.OK);
};

export const getFollowing = async (
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

	const rows = await db
		.select({
			id: follows.followingId,
		})
		.from(follows)
		.where(eq(follows.followerId, userId));

	const userIds = rows.map((r) => r.id);

	return c.json({ following: userIds }, StatusCodes.OK);
};

export const getFollowStats = async (
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

	const [followersResult] = await db
		.select({ count: count() })
		.from(follows)
		.where(eq(follows.followingId, userId));

	const [followingResult] = await db
		.select({ count: count() })
		.from(follows)
		.where(eq(follows.followerId, userId));

	return c.json(
		{
			followersCount: followersResult?.count || 0,
			followingCount: followingResult?.count || 0,
		},
		StatusCodes.OK,
	);
};

export const checkFollow = async (
	c: Context<BaseContext>,
	input: { params?: { id: string } },
) => {
	const followingId = input.params?.id;
	if (!followingId) {
		throw new HTTPException(StatusCodes.BAD_REQUEST, {
			message: "User ID is required",
		});
	}

	const db = c.get("db");
	const user = c.get("user");

	if (!user) {
		return c.json({ isFollowing: false });
	}

	const existing = await db.query.follows.findFirst({
		where: and(
			eq(follows.followerId, user.id),
			eq(follows.followingId, followingId),
		),
	});

	return c.json({ isFollowing: !!existing });
};
