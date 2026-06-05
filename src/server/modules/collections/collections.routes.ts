import { StatusCodes } from "http-status-codes";
import { z } from "zod/v4";
import { APIBuilder } from "@/server/core/api-builder";
import { optionalAuth } from "@/server/middleware/auth-guard";
import { database } from "@/server/middleware/database";
import {
	getCollections,
	getCollectionById,
	createCollection,
	updateCollection,
	deleteCollection,
	getUserCollections,
	getMyCollections,
	addCollectionItem,
	reorderCollectionItems,
	removeCollectionItem,
} from "./collections.handlers";
import {
	collectionListResponseSchema,
	collectionResponseSchema,
	insertCollectionSchema,
	updateCollectionSchema,
} from "./collections.schema";

export const createCollectionsModule = () => {
	const builder = new APIBuilder({
		middleware: [optionalAuth, database()],
	});

	// List public collections
	builder
		.get("/collections", getCollections)
		.summary("List collections")
		.description("Returns a paginated list of public collections")
		.tags("Collections")
		.response(StatusCodes.OK, {
			description: "Collections retrieved",
			schema: collectionListResponseSchema,
		});

	// Get collection by ID
	builder
		.get("/collections/:id", getCollectionById)
		.summary("Get collection")
		.description("Returns a collection with its items")
		.tags("Collections")
		.params({ id: z.string() })
		.response(StatusCodes.OK, {
			description: "Collection retrieved",
		})
		.response(StatusCodes.NOT_FOUND, {
			description: "Collection not found",
		});

	// Create collection
	builder
		.post("/collections", createCollection)
		.summary("Create collection")
		.description("Creates a new collection (authenticated)")
		.tags("Collections")
		.security([{ bearerAuth: [] }])
		.body(insertCollectionSchema)
		.response(StatusCodes.CREATED, {
			description: "Collection created",
			schema: collectionResponseSchema,
		})
		.response(StatusCodes.UNAUTHORIZED, {
			description: "Not authenticated",
		});

	// Update collection
	builder
		.put("/collections/:id", updateCollection)
		.summary("Update collection")
		.description("Updates a collection (owner only)")
		.tags("Collections")
		.security([{ bearerAuth: [] }])
		.params({ id: z.string() })
		.body(updateCollectionSchema)
		.response(StatusCodes.OK, {
			description: "Collection updated",
			schema: collectionResponseSchema,
		})
		.response(StatusCodes.FORBIDDEN, {
			description: "Not authorized",
		});

	// Delete collection
	builder
		.delete("/collections/:id", deleteCollection)
		.summary("Delete collection")
		.description("Deletes a collection (owner only)")
		.tags("Collections")
		.security([{ bearerAuth: [] }])
		.params({ id: z.string() })
		.response(StatusCodes.NO_CONTENT, {
			description: "Collection deleted",
		})
		.response(StatusCodes.FORBIDDEN, {
			description: "Not authorized",
		});

	// Get user's collections
	builder
		.get("/users/:id/collections", getUserCollections)
		.summary("Get user's collections")
		.description("Returns collections by user ID (public only)")
		.tags("Collections")
		.params({ id: z.string() })
		.response(StatusCodes.OK, {
			description: "User's collections",
		});

	// Get my collections
	builder
		.get("/users/me/collections", getMyCollections)
		.summary("Get my collections")
		.description("Returns current user's collections (includes private)")
		.tags("Collections")
		.security([{ bearerAuth: [] }])
		.response(StatusCodes.OK, {
			description: "My collections",
		})
		.response(StatusCodes.UNAUTHORIZED, {
			description: "Not authenticated",
		});

	// Add item to collection
	builder
		.post("/collections/:id/items", addCollectionItem)
		.summary("Add item to collection")
		.description("Adds a model to a collection (owner only)")
		.tags("Collections")
		.security([{ bearerAuth: [] }])
		.params({ id: z.string() })
		.body(z.object({ modelId: z.string(), note: z.string().optional() }))
		.response(StatusCodes.CREATED, {
			description: "Item added",
		})
		.response(StatusCodes.FORBIDDEN, {
			description: "Not authorized",
		});

	// Reorder items
	builder
		.put("/collections/:id/items/reorder", reorderCollectionItems)
		.summary("Reorder collection items")
		.description("Updates the positions of items in a collection (owner only)")
		.tags("Collections")
		.security([{ bearerAuth: [] }])
		.params({ id: z.string() })
		.body(
			z.object({
				items: z.array(
					z.object({ id: z.string(), position: z.number() }),
				),
			}),
		)
		.response(StatusCodes.OK, {
			description: "Items reordered",
		})
		.response(StatusCodes.FORBIDDEN, {
			description: "Not authorized",
		});

	// Remove item from collection
	builder
		.delete("/collections/:id/items/:itemId", removeCollectionItem)
		.summary("Remove item from collection")
		.description("Removes a model from a collection (owner only)")
		.tags("Collections")
		.security([{ bearerAuth: [] }])
		.params({ id: z.string(), itemId: z.string() })
		.response(StatusCodes.NO_CONTENT, {
			description: "Item removed",
		})
		.response(StatusCodes.FORBIDDEN, {
			description: "Not authorized",
		});

	return builder;
};
