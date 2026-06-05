import { sql } from "drizzle-orm";
import { text, sqliteTable } from "drizzle-orm/sqlite-core";
import { user } from "../auth/auth.table";

function generateId(): string {
	return crypto.randomUUID();
}

export const follows = sqliteTable("follows", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => generateId()),
	followerId: text("follower_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	followingId: text("following_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});
