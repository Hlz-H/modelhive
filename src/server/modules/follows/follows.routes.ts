import { z } from "zod/v4";
import { StatusCodes } from "http-status-codes";
import { APIBuilder } from "@/server/core/api-builder";
import { database } from "@/server/middleware/database";
import { optionalAuth } from "@/server/middleware/auth-guard";
import {
	toggleFollow,
	getFollowers,
	getFollowing,
	getFollowStats,
	checkFollow,
} from "./follows.handlers";

export const createFollowsModule = () => {
	const builder = new APIBuilder({
		middleware: [optionalAuth, database()],
	});

	// Toggle follow/unfollow
	builder
		.post("/users/:id/follow", toggleFollow)
		.summary("Toggle follow")
		.description("Follow or unfollow a user")
		.tags("Follows")
		.security([{ bearerAuth: [] }])
		.params({ id: z.string() })
		.response(StatusCodes.OK, {
			description: "Follow toggled",
		});

	// Get followers
	builder
		.get("/users/:id/followers", getFollowers)
		.summary("Get followers")
		.description("Returns list of user IDs that follow this user")
		.tags("Follows")
		.params({ id: z.string() })
		.response(StatusCodes.OK, {
			description: "Followers list",
		});

	// Get following
	builder
		.get("/users/:id/following", getFollowing)
		.summary("Get following")
		.description("Returns list of user IDs this user follows")
		.tags("Follows")
		.params({ id: z.string() })
		.response(StatusCodes.OK, {
			description: "Following list",
		});

	// Get follow stats
	builder
		.get("/users/:id/follow-stats", getFollowStats)
		.summary("Get follow stats")
		.description("Returns follower and following counts")
		.tags("Follows")
		.params({ id: z.string() })
		.response(StatusCodes.OK, {
			description: "Follow stats",
		});

	// Check if current user follows
	builder
		.get("/users/:id/follow-check", checkFollow)
		.summary("Check follow status")
		.description("Check if the current user is following this user")
		.tags("Follows")
		.security([{ bearerAuth: [] }])
		.params({ id: z.string() })
		.response(StatusCodes.OK, {
			description: "Follow status",
		});

	return builder;
};
