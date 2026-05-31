import type { ModuleDefinition } from "../../core/module-loader";
import { createModelsModule } from "./models.routes";
import { categories, models } from "./models.table";

// Export public APIs
export * from "./models.schema";
export { categories, models } from "./models.table";

const modelsModule: ModuleDefinition = {
	name: "models",
	basePath: "",
	createModule: createModelsModule,
	metadata: {
		version: "1.0.0",
		tags: ["Models", "Categories"],
		security: ["public", "authenticated"],
	},
	tables: {
		categories,
		models,
	},
};

export default modelsModule;
