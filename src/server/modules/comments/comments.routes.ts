import { z } from "zod/v4";
import { StatusCodes } from "http-status-codes";
import { APIBuilder } from "@/server/core/api-builder";
import { database } from "@/server/middleware/database";
import { optionalAuth } from "@/server/middleware/auth-guard";
import {
	getModelComments,
	createComment,
	deleteComment,
} from "./comments.handlers";
import {
	insertCommentSchema,
	commentsListSchema,
} from "./comments.schema";

export const createCommentsModule = () => {
	const builder = new APIBuilder({
		middleware: [optionalAuth, database()],
	});

	// List comments for a model
	builder
		.get("/models/:id/comments", getModelComments)
		.summary("Get model comments")
		.description("Returns all comments for a model")
		.tags("Comments")
		.params({ id: z.string() })
		.response(StatusCodes.OK, {
			description: "Comments retrieved",
			schema: commentsListSchema,
		});

	// Create comment
	builder
		.post("/models/:id/comments", createComment)
		.summary("Create comment")
		.description("Adds a comment to a model (authenticated)")
		.tags("Comments")
		.security([{ bearerAuth: [] }])
		.params({ id: z.string() })
		.body(insertCommentSchema)
		.response(StatusCodes.CREATED, {
			description: "Comment created",
		})
		.response(StatusCodes.UNAUTHORIZED, {
			description: "Not authenticated",
		});

	// Delete comment
	builder
		.delete("/models/:id/comments/:commentId", deleteComment)
		.summary("Delete comment")
		.description("Deletes a comment (owner or admin only)")
		.tags("Comments")
		.security([{ bearerAuth: [] }])
		.params({ id: z.string(), commentId: z.string() })
		.response(StatusCodes.NO_CONTENT, {
			description: "Comment deleted",
		})
		.response(StatusCodes.FORBIDDEN, {
			description: "Not authorized",
		});

	return builder;
};
