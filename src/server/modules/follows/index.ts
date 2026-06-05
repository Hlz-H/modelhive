import type { ModuleDefinition } from "../../core/module-loader";
import { createFollowsModule } from "./follows.routes";
import { follows } from "./follows.table";

export * from "./follows.schema";
export { follows } from "./follows.table";

const followsModule: ModuleDefinition = {
	name: "follows",
	basePath: "",
	createModule: createFollowsModule,
	metadata: {
		version: "1.0.0",
		tags: ["Follows"],
		security: ["public", "authenticated"],
	},
	tables: {
		follows,
	},
};

export default followsModule;
