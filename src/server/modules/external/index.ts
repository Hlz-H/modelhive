import type { ModuleDefinition } from "../../core/module-loader";
import { createExternalModule } from "./external.routes";

const externalModule: ModuleDefinition = {
	name: "external",
	basePath: "/external",
	createModule: createExternalModule,
	metadata: {
		version: "1.0.0",
		tags: ["External"],
		security: ["public"],
	},
};

export default externalModule;
