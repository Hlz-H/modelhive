import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { collectionItems, collections } from "./collections.table";

export const collectionNameSchema = z
	.string()
	.min(1)
	.max(200)
	.meta({ example: "Best Text-to-Image Models" })
	.describe("Collection name");

export const selectCollectionSchema = createSelectSchema(collections, {
	id: z.string(),
	name: collectionNameSchema,
});

export const insertCollectionSchema = createInsertSchema(collections, {
	name: collectionNameSchema,
}).omit({
	id: true,
	userId: true,
	createdAt: true,
	updatedAt: true,
});

export const updateCollectionSchema = insertCollectionSchema.partial();

export const selectCollectionItemSchema = createSelectSchema(collectionItems, {
	id: z.string(),
	collectionId: z.string(),
	modelId: z.string(),
});

export const insertCollectionItemSchema = z.object({
	modelId: z.string().min(1),
	note: z.string().optional(),
});

export const collectionResponseSchema = z.object({
	collection: selectCollectionSchema,
});

export const collectionListResponseSchema = z.object({
	collections: z.array(selectCollectionSchema),
	total: z.number().int().optional(),
	page: z.number().int().optional(),
	limit: z.number().int().optional(),
});

export const collectionItemResponseSchema = z.object({
	item: selectCollectionItemSchema,
});

export const collectionItemListResponseSchema = z.object({
	items: z.array(selectCollectionItemSchema),
});

export type SelectCollection = z.infer<typeof selectCollectionSchema>;
export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type UpdateCollection = z.infer<typeof updateCollectionSchema>;
export type SelectCollectionItem = z.infer<typeof selectCollectionItemSchema>;
