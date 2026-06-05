import type { ModuleDefinition } from "../../core/module-loader";
import { createCommentsModule } from "./comments.routes";
import { comments } from "./comments.table";

export * from "./comments.schema";
export { comments } from "./comments.table";

const commentsModule: ModuleDefinition = {
	name: "comments",
	basePath: "",
	createModule: createCommentsModule,
	metadata: {
		version: "1.0.0",
		tags: ["Comments"],
		security: ["public", "authenticated"],
	},
	tables: {
		comments,
	},
};

export default commentsModule;
