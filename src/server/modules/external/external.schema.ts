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
