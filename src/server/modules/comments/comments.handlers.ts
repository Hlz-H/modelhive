import { eq, desc } from "drizzle-orm";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { StatusCodes } from "http-status-codes";
import type { BaseContext } from "@/server/lib/worker-types";
import { comments } from "./comments.table";
import type { InsertComment } from "./comments.schema";

export const getModelComments = async (
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

	const commentList = await db
		.select()
		.from(comments)
		.where(eq(comments.modelId, modelId))
		.orderBy(desc(comments.createdAt));

	return c.json({ comments: commentList }, StatusCodes.OK);
};

export const createComment = async (
	c: Context<BaseContext>,
	input: { params?: { id: string }; body?: InsertComment },
) => {
	const modelId = input.params?.id;
	if (!modelId || !input.body) {
		throw new HTTPException(StatusCodes.BAD_REQUEST, {
			message: "Model ID and body are required",
		});
	}

	const db = c.get("db");
	const user = c.get("user");

	if (!user) {
		throw new HTTPException(StatusCodes.UNAUTHORIZED, {
			message: "Not authenticated",
		});
	}

	const [newComment] = await db
		.insert(comments)
		.values({
			content: input.body.content,
			modelId,
			userId: user.id,
		})
		.returning();

	return c.json({ comment: newComment }, StatusCodes.CREATED);
};

export const deleteComment = async (
	c: Context<BaseContext>,
	input: { params?: { id: string; commentId: string } },
) => {
	const { id: modelId, commentId } = input.params || {};
	if (!modelId || !commentId) {
		throw new HTTPException(StatusCodes.BAD_REQUEST, {
			message: "Model ID and Comment ID are required",
		});
	}

	const db = c.get("db");
	const user = c.get("user");

	if (!user) {
		throw new HTTPException(StatusCodes.UNAUTHORIZED, {
			message: "Not authenticated",
		});
	}

	const existing = await db.query.comments.findFirst({
		where: eq(comments.id, commentId),
	});

	if (!existing) {
		throw new HTTPException(StatusCodes.NOT_FOUND, {
			message: "Comment not found",
		});
	}

	if (existing.userId !== user.id && user.role !== "admin") {
		throw new HTTPException(StatusCodes.FORBIDDEN, {
			message: "Not authorized to delete this comment",
		});
	}

	await db.delete(comments).where(eq(comments.id, commentId));

	return new Response(null, { status: StatusCodes.NO_CONTENT });
};
