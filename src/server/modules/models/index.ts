import type { ModuleDefinition } from "../../core/module-loader";
import { createModelsModule } from "./models.routes";
import { categories, models, tags, modelTags, favorites } from "./models.table";

// Export public APIs
export * from "./models.schema";
export { categories, models, tags, modelTags, favorites } from "./models.table";

const modelsModule: ModuleDefinition = {
	name: "models",
	basePath: "",
	createModule: createModelsModule,
	metadata: {
		version: "1.0.0",
		tags: ["Models", "Categories", "Tags", "Favorites"],
		security: ["public", "authenticated"],
	},
	tables: {
		categories,
		models,
		tags,
		modelTags,
		favorites,
	},
};

export default modelsModule;
