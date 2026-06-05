import { z } from "zod/v4";

export const insertFollowSchema = z.object({
	followingId: z.string(),
});

export const followResponseSchema = z.object({
	following: z.boolean(),
});

export const followerUserSchema = z.object({
	id: z.string(),
	name: z.string(),
	image: z.string().nullable(),
});

export const followersListSchema = z.object({
	followers: z.array(followerUserSchema),
});

export const followingListSchema = z.object({
	following: z.array(followerUserSchema),
});
