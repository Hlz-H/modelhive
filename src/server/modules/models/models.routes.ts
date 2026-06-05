import { StatusCodes } from "http-status-codes";
import { z } from "zod/v4";
import { APIBuilder } from "@/server/core/api-builder";
import { optionalAuth } from "@/server/middleware/auth-guard";
import { database } from "@/server/middleware/database";
import {
	addModelTags,
	createCategory,
	createModel,
	createModelVersion,
	createTag,
	deleteModel,
	deleteModelVersion,
	deleteTag,
	getAllCategories,
	getAllTags,
	getModelBySlug,
	getModelFavorites,
	getModelVersions,
	getModels,
	incrementDownloadCount,
	removeModelTag,
	seedCategories,
	serveFile,
	toggleFavorite,
	updateModel,
	updateModelVersion,
	updateTag,
	uploadFile,
} from "./models.handlers";
import {
	categoryListResponseSchema,
	insertCategorySchema,
	insertModelSchema,
	insertModelVersionSchema,
	modelIdSchema,
	modelListResponseSchema,
	modelResponseSchema,
	tagListResponseSchema,
	tagResponseSchema,
	updateModelSchema,
	updateModelVersionSchema,
	versionListResponseSchema,
	versionResponseSchema,
} from "./models.schema";

export const createModelsModule = () => {
	const builder = new APIBuilder({
		middleware: [optionalAuth, database()],
	});

	// ===== Categories =====

	// Get all categories (public)
	builder
		.get("/categories", getAllCategories)
		.summary("Get all categories")
		.description("Retrieves a list of all model categories")
		.tags("Categories")
		.response(StatusCodes.OK, {
			description: "Categories retrieved successfully",
			schema: categoryListResponseSchema,
		});

	// Create category (admin)
	builder
		.post("/categories", createCategory)
		.summary("Create category")
		.description("Creates a new model category (admin only)")
		.tags("Categories")
		.body(insertCategorySchema)
		.response(StatusCodes.CREATED, {
			description: "Category created successfully",
		})
		.response(StatusCodes.FORBIDDEN, {
			description: "Admin access required",
		});

	// Seed default categories
	builder
		.post("/categories/seed", seedCategories)
		.summary("Seed default categories")
		.description("Creates default model categories if they don't exist")
		.tags("Categories")
		.response(StatusCodes.OK, {
			description: "Categories seeded successfully",
		});

	// ===== Models (Public) =====

	// List models (public, with search/filter)
	builder
		.get("/models", getModels)
		.summary("List models")
		.description(
			"Retrieves a paginated list of published models with search and filter support",
		)
		.tags("Models")
		.response(StatusCodes.OK, {
			description: "Models retrieved successfully",
			schema: modelListResponseSchema,
		});

	// Get model by slug (public)
	builder
		.get("/models/:slug", getModelBySlug)
		.summary("Get model by slug")
		.description("Retrieves a specific model by its slug")
		.tags("Models")
		.params({ slug: z.string() })
		.response(StatusCodes.OK, {
			description: "Model retrieved successfully",
			schema: modelResponseSchema,
		})
		.response(StatusCodes.NOT_FOUND, {
			description: "Model not found",
		});

	// ===== Models (Authenticated) =====

	// Create model (authenticated)
	builder
		.post("/models", createModel)
		.summary("Create model")
		.description("Creates a new model")
		.tags("Models")
		.security([{ bearerAuth: [] }])
		.body(insertModelSchema)
		.response(StatusCodes.CREATED, {
			description: "Model created successfully",
			schema: modelResponseSchema,
		})
		.response(StatusCodes.UNAUTHORIZED, {
			description: "User not authenticated",
		});

	// Update model (owner or admin)
	builder
		.put("/models/:id", updateModel)
		.summary("Update model")
		.description("Updates an existing model (owner or admin only)")
		.tags("Models")
		.security([{ bearerAuth: [] }])
		.params({ id: modelIdSchema })
		.body(updateModelSchema)
		.response(StatusCodes.OK, {
			description: "Model updated successfully",
			schema: modelResponseSchema,
		})
		.response(StatusCodes.NOT_FOUND, {
			description: "Model not found",
		})
		.response(StatusCodes.FORBIDDEN, {
			description: "Not authorized to update this model",
		});

	// Delete model (owner or admin)
	builder
		.delete("/models/:id", deleteModel)
		.summary("Delete model")
		.description("Deletes a model by ID (owner or admin only)")
		.tags("Models")
		.security([{ bearerAuth: [] }])
		.params({ id: modelIdSchema })
		.response(StatusCodes.NO_CONTENT, {
			description: "Model deleted successfully",
		})
		.response(StatusCodes.NOT_FOUND, {
			description: "Model not found",
		})
		.response(StatusCodes.FORBIDDEN, {
			description: "Not authorized to delete this model",
		});

	// ===== Tags =====

	// List all tags (public)
	builder
		.get("/tags", getAllTags)
		.summary("List all tags")
		.description("Retrieves a list of all tags")
		.tags("Tags")
		.response(StatusCodes.OK, {
			description: "Tags retrieved successfully",
			schema: tagListResponseSchema,
		});

	// Create tag (admin)
	builder
		.post("/tags", createTag)
		.summary("Create tag")
		.description("Creates a new tag (admin only)")
		.tags("Tags")
		.security([{ bearerAuth: [] }])
		.body(z.object({ name: z.string(), slug: z.string() }))
		.response(StatusCodes.CREATED, {
			description: "Tag created successfully",
			schema: tagResponseSchema,
		})
		.response(StatusCodes.FORBIDDEN, {
			description: "Admin access required",
		});

	// Update tag (admin)
	builder
		.put("/tags/:id", updateTag)
		.summary("Update tag")
		.description("Updates a tag name or slug (admin only)")
		.tags("Tags")
		.security([{ bearerAuth: [] }])
		.params({ id: z.string() })
		.body(z.object({ name: z.string().optional(), slug: z.string().optional() }))
		.response(StatusCodes.OK, {
			description: "Tag updated",
			schema: tagResponseSchema,
		})
		.response(StatusCodes.FORBIDDEN, {
			description: "Admin access required",
		});

	// Delete tag (admin)
	builder
		.delete("/tags/:id", deleteTag)
		.summary("Delete tag")
		.description("Deletes a tag (admin only)")
		.tags("Tags")
		.security([{ bearerAuth: [] }])
		.params({ id: z.string() })
		.response(StatusCodes.NO_CONTENT, {
			description: "Tag deleted",
		})
		.response(StatusCodes.FORBIDDEN, {
			description: "Admin access required",
		});

	// Add tags to model (owner/admin)
	builder
		.post("/models/:id/tags", addModelTags)
		.summary("Add tags to model")
		.description("Adds tags to a model by tag name (owner or admin only)")
		.tags("Tags")
		.security([{ bearerAuth: [] }])
		.params({ id: modelIdSchema })
		.body(z.object({ tags: z.array(z.string()) }))
		.response(StatusCodes.CREATED, {
			description: "Tags added successfully",
		})
		.response(StatusCodes.FORBIDDEN, {
			description: "Not authorized",
		});

	// Remove tag from model (owner/admin)
	builder
		.delete("/models/:id/tags/:tagId", removeModelTag)
		.summary("Remove tag from model")
		.description("Removes a tag from a model (owner or admin only)")
		.tags("Tags")
		.security([{ bearerAuth: [] }])
		.params({ id: modelIdSchema, tagId: z.string() })
		.response(StatusCodes.NO_CONTENT, {
			description: "Tag removed successfully",
		})
		.response(StatusCodes.FORBIDDEN, {
			description: "Not authorized",
		});

	// ===== File Upload =====

	// Upload file (authenticated)
	builder
		.post("/upload", uploadFile)
		.summary("Upload file")
		.description("Uploads a file to cloud storage (authenticated)")
		.tags("Files")
		.security([{ bearerAuth: [] }])
		.response(StatusCodes.CREATED, {
			description: "File uploaded successfully",
		})
		.response(StatusCodes.UNAUTHORIZED, {
			description: "Not authenticated",
		});

	// Serve file (public)
	builder
		.get("/files/:key", serveFile)
		.summary("Serve file")
		.description("Serves an uploaded file by its key")
		.tags("Files")
		.response(StatusCodes.OK, {
			description: "File served",
		})
		.response(StatusCodes.NOT_FOUND, {
			description: "File not found",
		});

	// ===== Model Versions =====

	// List versions (public)
	builder
		.get("/models/:id/versions", getModelVersions)
		.summary("List model versions")
		.description("Returns all versions for a model")
		.tags("Versions")
		.params({ id: modelIdSchema })
		.response(StatusCodes.OK, {
			description: "Versions retrieved",
			schema: versionListResponseSchema,
		});

	// Create version (owner/admin)
	builder
		.post("/models/:id/versions", createModelVersion)
		.summary("Create model version")
		.description("Creates a new version for a model (owner or admin only)")
		.tags("Versions")
		.security([{ bearerAuth: [] }])
		.params({ id: modelIdSchema })
		.body(insertModelVersionSchema)
		.response(StatusCodes.CREATED, {
			description: "Version created",
			schema: versionResponseSchema,
		})
		.response(StatusCodes.FORBIDDEN, {
			description: "Not authorized",
		});

	// Update version (owner/admin)
	builder
		.put("/models/:id/versions/:versionId", updateModelVersion)
		.summary("Update model version")
		.description("Updates a version of a model (owner or admin only)")
		.tags("Versions")
		.security([{ bearerAuth: [] }])
		.params({ id: modelIdSchema, versionId: z.string() })
		.body(updateModelVersionSchema)
		.response(StatusCodes.OK, {
			description: "Version updated",
			schema: versionResponseSchema,
		})
		.response(StatusCodes.FORBIDDEN, {
			description: "Not authorized",
		});

	// Delete version (owner/admin)
	builder
		.delete("/models/:id/versions/:versionId", deleteModelVersion)
		.summary("Delete model version")
		.description("Deletes a version of a model (owner or admin only)")
		.tags("Versions")
		.security([{ bearerAuth: [] }])
		.params({ id: modelIdSchema, versionId: z.string() })
		.response(StatusCodes.NO_CONTENT, {
			description: "Version deleted",
		})
		.response(StatusCodes.FORBIDDEN, {
			description: "Not authorized",
		});

	// Increment download count (public)
	builder
		.post("/models/:id/versions/:versionId/download", incrementDownloadCount)
		.summary("Increment download count")
		.description("Increments the download count for a model version")
		.tags("Versions")
		.params({ id: modelIdSchema, versionId: z.string() })
		.response(StatusCodes.OK, {
			description: "Download count incremented",
		});

	// ===== Favorites =====

	// Toggle favorite (authenticated)
	builder
		.post("/models/:id/favorite", toggleFavorite)
		.summary("Toggle favorite")
		.description("Toggles the favorite status for a model (authenticated)")
		.tags("Favorites")
		.security([{ bearerAuth: [] }])
		.params({ id: modelIdSchema })
		.response(StatusCodes.OK, {
			description: "Favorite toggled",
		})
		.response(StatusCodes.UNAUTHORIZED, {
			description: "Not authenticated",
		});

	// Get favorite count (public)
	builder
		.get("/models/:id/favorites", getModelFavorites)
		.summary("Get favorite count")
		.description("Returns the number of favorites for a model")
		.tags("Favorites")
		.params({ id: modelIdSchema })
		.response(StatusCodes.OK, {
			description: "Favorite count retrieved",
		});

	return builder;
};
