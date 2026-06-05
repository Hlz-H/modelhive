import { z } from "zod/v4";

export type InsertComment = z.infer<typeof insertCommentSchema>;

export const insertCommentSchema = z.object({
	content: z.string().min(1).max(2000),
});

export const updateCommentSchema = z.object({
	content: z.string().min(1).max(2000),
});

export const commentResponseSchema = z.object({
	id: z.string(),
	modelId: z.string(),
	userId: z.string(),
	content: z.string(),
	createdAt: z.string(),
});

export const commentsListSchema = z.object({
	comments: z.array(commentResponseSchema),
});
