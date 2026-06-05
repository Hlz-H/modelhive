import { z } from "zod/v4";

export const icosaSearchSchema = z.object({
	q: z.string().min(1),
	format: z.string().optional(),
});

export const icosaSearchResponseSchema = z.object({
	assets: z.array(z.unknown()),
});

export const icosaAssetResponseSchema = z.object({
	asset: z.unknown(),
});

export const icosaImportSchema = z.object({
	assetId: z.string().min(1),
	displayName: z.string().min(1).max(200),
	description: z.string().max(500).optional(),
	authorName: z.string().optional(),
	thumbnailUrl: z.string().url().optional(),
	license: z.string().max(100).optional(),
	gltfUrl: z.string().url().optional(),
});
