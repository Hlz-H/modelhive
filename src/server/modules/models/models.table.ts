import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "../auth/auth.table";

// Categories table for organizing models
// Generate a random UUID v4 string
function generateId(): string {
	return crypto.randomUUID();
}

export const categories = sqliteTable("categories", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => generateId()),
	name: text("name").notNull().unique(),
	slug: text("slug").notNull().unique(),
	description: text("description"),
	createdAt: text("created_at")
		.notNull()
		.default(sql`(CURRENT_TIMESTAMP)`),
});

// Models table - generic model entity
export const models = sqliteTable("models", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => generateId()),
	name: text("name").notNull(),
	slug: text("slug").notNull().unique(),
	description: text("description"),
	// Model type: ai-model, 3d-model, design, other
	type: text("type").notNull().default("other"),
	// Cover image URL
	imageUrl: text("image_url"),
	// Model file URL
	fileUrl: text("file_url"),
	// External reference link
	externalUrl: text("external_url"),
	// Version string
	version: text("version").default("1.0.0"),
	// Owner reference
	userId: text("user_id")
		.notNull()
		.references(() => user.id),
	// Category reference
	categoryId: text("category_id").references(() => categories.id),
	// Published status
	isPublished: integer("is_published", { mode: "boolean" })
		.notNull()
		.default(true),
	// View counter
	viewCount: integer("view_count").notNull().default(0),
	// Timestamps
	createdAt: text("created_at")
		.notNull()
		.default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: text("updated_at")
		.notNull()
		.default(sql`(CURRENT_TIMESTAMP)`),
});

// Tags table
export const tags = sqliteTable("tags", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => generateId()),
	name: text("name").notNull().unique(),
	slug: text("slug").notNull().unique(),
	createdAt: text("created_at")
		.notNull()
		.default(sql`(CURRENT_TIMESTAMP)`),
});

// Model-Tag junction table
export const modelTags = sqliteTable("model_tags", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => generateId()),
	modelId: text("model_id")
		.notNull()
		.references(() => models.id, { onDelete: "cascade" }),
	tagId: text("tag_id")
		.notNull()
		.references(() => tags.id, { onDelete: "cascade" }),
});

// Model Versions table
export const modelVersions = sqliteTable("model_versions", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => generateId()),
	modelId: text("model_id")
		.notNull()
		.references(() => models.id, { onDelete: "cascade" }),
	version: text("version").notNull(),
	fileUrl: text("file_url"),
	changelog: text("changelog"),
	downloadCount: integer("download_count").notNull().default(0),
	createdAt: text("created_at")
		.notNull()
		.default(sql`(CURRENT_TIMESTAMP)`),
});

// Favorites table
export const favorites = sqliteTable("favorites", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => generateId()),
	userId: text("user_id")
		.notNull()
		.references(() => user.id),
	modelId: text("model_id")
		.notNull()
		.references(() => models.id, { onDelete: "cascade" }),
	createdAt: text("created_at")
		.notNull()
		.default(sql`(CURRENT_TIMESTAMP)`),
});
