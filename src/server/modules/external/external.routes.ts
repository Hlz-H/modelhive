import { z } from "zod/v4";
import { StatusCodes } from "http-status-codes";
import { APIBuilder } from "@/server/core/api-builder";
import { optionalAuth } from "@/server/middleware/auth-guard";
import { database } from "@/server/middleware/database";
import {
	searchIcosaAssets,
	getIcosaAsset,
	importIcosaAsset,
	proxyManyfoldRequest,
	proxyManyfoldFile,
} from "./external.handlers";
import { icosaImportSchema, icosaSearchSchema } from "./external.schema";

export const createExternalModule = () => {
	const builder = new APIBuilder({
		middleware: [optionalAuth, database()],
	});

	// Search Icosa assets
	builder
		.get("/icosa/assets", searchIcosaAssets)
		.summary("Search Icosa assets")
		.description("Search for 3D models on Icosa Gallery")
		.tags("External/Icosa")
		.query(icosaSearchSchema)
		.response(StatusCodes.OK, {
			description: "Search results",
		});

	// Get Icosa asset by ID
	builder
		.get("/icosa/assets/:id", getIcosaAsset)
		.summary("Get Icosa asset")
		.description("Get a specific asset from Icosa Gallery by ID")
		.tags("External/Icosa")
		.params({ id: z.string() })
		.response(StatusCodes.OK, {
			description: "Asset details",
		})
		.response(StatusCodes.NOT_FOUND, {
			description: "Asset not found",
		});

	// Import Icosa asset as ModelHive model
	builder
		.post("/icosa/import", importIcosaAsset)
		.summary("Import Icosa asset")
		.description("Import an Icosa Gallery asset as a new model in ModelHive")
		.tags("External/Icosa")
		.security([{ bearerAuth: [] }])
		.body(icosaImportSchema)
		.response(StatusCodes.CREATED, {
			description: "Model created",
		})
		.response(StatusCodes.UNAUTHORIZED, {
			description: "Authentication required",
		})
		.response(StatusCodes.BAD_REQUEST, {
			description: "Invalid import data",
		});

	// Proxy Manyfold models API
	builder
		.get("/manyfold/models", proxyManyfoldRequest)
		.summary("List Manyfold models")
		.description("Proxy to Manyfold /api/models endpoint")
		.tags("External/Manyfold")
		.response(StatusCodes.OK, {
			description: "Models list",
		})
		.response(StatusCodes.SERVICE_UNAVAILABLE, {
			description: "Manyfold not configured",
		});

	// Proxy Manyfold model files
	builder
		.get("/manyfold/models/:id/files", proxyManyfoldFile)
		.summary("Get Manyfold model files")
		.description("Proxy to Manyfold /api/models/:id/files endpoint")
		.tags("External/Manyfold")
		.params({ id: z.string() })
		.response(StatusCodes.OK, {
			description: "File list",
		})
		.response(StatusCodes.SERVICE_UNAVAILABLE, {
			description: "Manyfold not configured",
		});

	return builder;
};
