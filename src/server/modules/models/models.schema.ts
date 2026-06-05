import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { categories, models, modelVersions, tags } from "./models.table";

// ===== Categories =====

export const categoryIdSchema = z
	.string()
	.min(1)
	.meta({ example: "cat_001" })
	.describe("Category ID");
export const categoryNameSchema = z
	.string()
	.min(1)
	.max(100)
	.meta({ example: "AI Models" })
	.describe("Category name");
export const categorySlugSchema = z
	.string()
	.min(1)
	.max(100)
	.meta({ example: "ai-models" })
	.describe("Category slug");

export const selectCategorySchema = createSelectSchema(categories, {
	id: categoryIdSchema,
	name: categoryNameSchema,
	slug: categorySlugSchema,
});

export const insertCategorySchema = createInsertSchema(categories, {
	name: categoryNameSchema,
	slug: categorySlugSchema,
}).omit({
	id: true,
	createdAt: true,
});

export const updateCategorySchema = insertCategorySchema.partial();

export const categoryResponseSchema = z.object({
	category: selectCategorySchema,
});

export const categoryListResponseSchema = z.object({
	categories: z.array(selectCategorySchema),
});

// ===== Models =====

export const modelIdSchema = z
	.string()
	.min(1)
	.meta({ example: "mdl_001" })
	.describe("Model ID");
export const modelNameSchema = z
	.string()
	.min(1)
	.max(200)
	.meta({ example: "GPT-4o" })
	.describe("Model name");
export const modelSlugSchema = z
	.string()
	.min(1)
	.max(200)
	.meta({ example: "gpt-4o" })
	.describe("Model slug");
export const modelTypeSchema = z
	.enum(["ai-model", "3d-model", "design", "dataset", "other"])
	.describe("Model type");

export const selectModelSchema = createSelectSchema(models, {
	id: modelIdSchema,
	name: modelNameSchema,
	slug: modelSlugSchema,
	type: modelTypeSchema,
});

export const insertModelSchema = createInsertSchema(models, {
	name: modelNameSchema,
	slug: modelSlugSchema,
	type: modelTypeSchema,
	rowsCount: z.number().int().positive().optional(),
	license: z.string().max(100).optional(),
	language: z.string().max(50).optional(),
	datasetSize: z.number().int().positive().optional(),
}).omit({
	id: true,
	userId: true,
	createdAt: true,
	updatedAt: true,
	viewCount: true,
});

export const updateModelSchema = insertModelSchema.partial();

// Response schemas
export const modelResponseSchema = z.object({
	model: selectModelSchema,
});

export const modelListResponseSchema = z.object({
	models: z.array(selectModelSchema),
	total: z.number().int().optional(),
});

// ===== Tags =====

export const tagNameSchema = z
	.string()
	.min(1)
	.max(50)
	.meta({ example: "text-generation" })
	.describe("Tag name");
export const tagSlugSchema = z
	.string()
	.min(1)
	.max(50)
	.meta({ example: "text-generation" })
	.describe("Tag slug");

export const selectTagSchema = createSelectSchema(tags, {
	id: z.string(),
	name: tagNameSchema,
	slug: tagSlugSchema,
});

export const tagResponseSchema = z.object({
	tag: selectTagSchema,
});

export const tagListResponseSchema = z.object({
	tags: z.array(selectTagSchema),
});

// ===== Model Versions =====

export const versionSchema = z
	.string()
	.meta({ example: "1.0.0" })
	.describe("Version string");

export const selectModelVersionSchema = createSelectSchema(modelVersions, {
	id: z.string(),
	modelId: z.string(),
	version: versionSchema,
});

export const insertModelVersionSchema = createInsertSchema(modelVersions, {
	version: versionSchema,
}).omit({
	id: true,
	modelId: true,
	downloadCount: true,
	createdAt: true,
});

export const updateModelVersionSchema = insertModelVersionSchema.partial();

export const versionResponseSchema = z.object({
	version: selectModelVersionSchema,
});

export const versionListResponseSchema = z.object({
	versions: z.array(selectModelVersionSchema),
});

// Extended model response with tags and favorite count
export const modelWithDetailsSchema = selectModelSchema.extend({
	favoriteCount: z.number().int().default(0),
	tags: z.array(selectTagSchema).default([]),
});

export const modelWithDetailsResponseSchema = z.object({
	model: modelWithDetailsSchema,
});

export const modelListWithDetailsResponseSchema = z.object({
	models: z.array(modelWithDetailsSchema),
	total: z.number().int().optional(),
	page: z.number().int().optional(),
	limit: z.number().int().optional(),
	totalPages: z.number().int().optional(),
});

// Type exports
export type SelectCategory = z.infer<typeof selectCategorySchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type UpdateCategory = z.infer<typeof updateCategorySchema>;
export type SelectModel = z.infer<typeof selectModelSchema>;
export type InsertModel = z.infer<typeof insertModelSchema>;
export type UpdateModel = z.infer<typeof updateModelSchema>;
export type SelectTag = z.infer<typeof selectTagSchema>;
export type SelectModelVersion = z.infer<typeof selectModelVersionSchema>;
export type InsertModelVersion = z.infer<typeof insertModelVersionSchema>;
export type UpdateModelVersion = z.infer<typeof updateModelVersionSchema>;
