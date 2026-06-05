import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { user } from "@/server/modules/auth/auth.table";

// ===== User Schemas =====

export const userIdSchema = z
	.string()
	.min(1)
	.meta({ example: "usr_001" })
	.describe("User ID");

export const selectUserSchema = createSelectSchema(user, {
	id: userIdSchema,
});

export const updateUserProfileSchema = z.object({
	name: z.string().min(1).max(100).optional(),
	image: z.string().url().optional(),
});

export const updateUserRoleSchema = z.object({
	role: z.enum(["user", "admin"]),
});

// Response schemas
export const userResponseSchema = z.object({
	user: selectUserSchema,
});

export const userListResponseSchema = z.object({
	users: z.array(selectUserSchema),
	total: z.number().int().optional(),
	page: z.number().int().optional(),
	limit: z.number().int().optional(),
});

// Type exports
export type SelectUser = z.infer<typeof selectUserSchema>;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
export type UpdateUserRole = z.infer<typeof updateUserRoleSchema>;
