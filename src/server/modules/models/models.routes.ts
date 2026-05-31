import { StatusCodes } from "http-status-codes";
import { APIBuilder } from "@/server/core/api-builder";
import { database } from "@/server/middleware/database";
import {
	getAllCategories,
	getModels,
	getModelBySlug,
	createModel,
	updateModel,
	deleteModel,
} from "./models.handlers";
import {
	insertModelSchema,
	modelIdSchema,
	modelListResponseSchema,
	modelResponseSchema,
	modelSlugSchema,
	updateModelSchema,
	categoryListResponseSchema,
	insertCategorySchema,
	selectCategorySchema,
} from "./models.schema";

export const createModelsModule = () => {
	const builder = new APIBuilder({
		middleware: [database()],
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

	// ===== Models (Public) =====

	// List models (public, with search/filter)
	builder
		.get("/models", getModels)
		.summary("List models")
		.description("Retrieves a paginated list of published models with search and filter support")
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

	return builder;
};
