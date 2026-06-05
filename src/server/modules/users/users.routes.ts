import { z } from "zod/v4";
import { StatusCodes } from "http-status-codes";
import { APIBuilder } from "@/server/core/api-builder";
import { database } from "@/server/middleware/database";
import { optionalAuth } from "@/server/middleware/auth-guard";
import {
	getCurrentUser,
	updateUserProfile,
	getUserModels,
	getUserFavorites,
	listUsers,
	updateUserRole,
	listAllModels,
	moderateModel,
} from "./users.handlers";
import {
	userResponseSchema,
	userListResponseSchema,
	updateUserProfileSchema,
	updateUserRoleSchema,
} from "./users.schema";
import { modelListResponseSchema } from "@/server/modules/models/models.schema";

export const createUsersModule = () => {
	const builder = new APIBuilder({
		middleware: [optionalAuth, database()],
	});

	// ===== User Profile Routes =====

	// Get current user (authenticated)
	builder
		.get("/users/me", getCurrentUser)
		.summary("Get current user")
		.description("Returns the currently authenticated user's profile")
		.tags("Users")
		.response(StatusCodes.OK, {
			description: "Current user profile",
			schema: userResponseSchema,
		})
		.response(StatusCodes.UNAUTHORIZED, {
			description: "Not authenticated",
		});

	// Update user profile (authenticated)
	builder
		.put("/users/me", updateUserProfile)
		.summary("Update user profile")
		.description("Updates the current user's name and image")
		.tags("Users")
		.body(updateUserProfileSchema)
		.response(StatusCodes.OK, {
			description: "Updated user profile",
			schema: userResponseSchema,
		})
		.response(StatusCodes.UNAUTHORIZED, {
			description: "Not authenticated",
		});

	// Get user's models (public)
	builder
		.get("/users/:id/models", getUserModels)
		.summary("Get user's models")
		.description("Returns all models published by a specific user")
		.tags("Users")
		.params({ id: z.string() })
		.response(StatusCodes.OK, {
			description: "User's models",
			schema: modelListResponseSchema,
		})
		.response(StatusCodes.NOT_FOUND, {
			description: "User not found",
		});

	// Get current user's favorites (authenticated)
	builder
		.get("/users/me/favorites", getUserFavorites)
		.summary("Get user's favorites")
		.description("Returns all models favorited by the current user")
		.tags("Users", "Favorites")
		.security([{ bearerAuth: [] }])
		.response(StatusCodes.OK, {
			description: "User's favorited models",
			schema: modelListResponseSchema,
		})
		.response(StatusCodes.UNAUTHORIZED, {
			description: "Not authenticated",
		});

	// ===== Admin Routes =====

	// List all users (admin)
	builder
		.get("/admin/users", listUsers)
		.summary("List all users")
		.description("Returns a paginated list of all users (admin only)")
		.tags("Admin")
		.response(StatusCodes.OK, {
			description: "Users list",
			schema: userListResponseSchema,
		})
		.response(StatusCodes.FORBIDDEN, {
			description: "Admin access required",
		});

	// Update user role (admin)
	builder
		.put("/admin/users/:id/role", updateUserRole)
		.summary("Update user role")
		.description("Updates a user's role (admin only)")
		.tags("Admin")
		.params({ id: z.string() })
		.body(updateUserRoleSchema)
		.response(StatusCodes.OK, {
			description: "Updated user",
			schema: userResponseSchema,
		})
		.response(StatusCodes.NOT_FOUND, {
			description: "User not found",
		})
		.response(StatusCodes.FORBIDDEN, {
			description: "Admin access required",
		});

	// List all models (admin)
	builder
		.get("/admin/models", listAllModels)
		.summary("List all models")
		.description("Returns a paginated list of all models including unpublished (admin only)")
		.tags("Admin")
		.response(StatusCodes.OK, {
			description: "Models list",
			schema: modelListResponseSchema,
		})
		.response(StatusCodes.FORBIDDEN, {
			description: "Admin access required",
		});

	// Moderate model (admin)
	builder
		.put("/admin/models/:id/status", moderateModel)
		.summary("Moderate model")
		.description("Changes a model's published status (admin only)")
		.tags("Admin")
		.params({ id: z.string() })
		.body(z.object({ isPublished: z.boolean() }))
		.response(StatusCodes.OK, {
			description: "Updated model",
		})
		.response(StatusCodes.NOT_FOUND, {
			description: "Model not found",
		})
		.response(StatusCodes.FORBIDDEN, {
			description: "Admin access required",
		});

	return builder;
};
