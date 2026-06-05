import { sql } from "drizzle-orm";
import { text, sqliteTable } from "drizzle-orm/sqlite-core";
import { user } from "../auth/auth.table";
import { models } from "../models/models.table";

function generateId(): string {
	return crypto.randomUUID();
}

export const comments = sqliteTable("comments", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => generateId()),
	modelId: text("model_id")
		.notNull()
		.references(() => models.id, { onDelete: "cascade" }),
	userId: text("user_id")
		.notNull()
		.references(() => user.id),
	content: text("content").notNull(),
	createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});
