import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "../auth/auth.table";
import { models } from "../models/models.table";

function generateId(): string {
	return crypto.randomUUID();
}

export const collections = sqliteTable("collections", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => generateId()),
	name: text("name").notNull(),
	description: text("description"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id),
	isPublic: integer("is_public", { mode: "boolean" }).notNull().default(true),
	createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const collectionItems = sqliteTable("collection_items", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => generateId()),
	collectionId: text("collection_id")
		.notNull()
		.references(() => collections.id, { onDelete: "cascade" }),
	modelId: text("model_id")
		.notNull()
		.references(() => models.id, { onDelete: "cascade" }),
	note: text("note"),
	position: integer("position").notNull().default(0),
	createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});
