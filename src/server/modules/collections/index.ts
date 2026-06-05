import type { ModuleDefinition } from "../../core/module-loader";
import { createCollectionsModule } from "./collections.routes";
import { collectionItems, collections } from "./collections.table";

export * from "./collections.schema";
export { collectionItems, collections } from "./collections.table";

const collectionsModule: ModuleDefinition = {
	name: "collections",
	basePath: "",
	createModule: createCollectionsModule,
	metadata: {
		version: "1.0.0",
		tags: ["Collections"],
		security: ["public", "authenticated"],
	},
	tables: {
		collections,
		collectionItems,
	},
};

export default collectionsModule;
