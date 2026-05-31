import type { ModuleDefinition } from "../../core/module-loader";
import { createUsersModule } from "./users.routes";
import { user } from "@/server/modules/auth/auth.table";

// Export public APIs
export * from "./users.schema";

const usersModule: ModuleDefinition = {
	name: "users",
	basePath: "",
	createModule: createUsersModule,
	metadata: {
		version: "1.0.0",
		tags: ["Users", "Admin"],
		security: ["public", "authenticated", "admin"],
	},
	tables: {},
};

export default usersModule;
