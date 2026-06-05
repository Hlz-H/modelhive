import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { StatusCodes } from "http-status-codes";
import type { BaseContext } from "@/server/lib/worker-types";
import { models } from "@/server/modules/models/models.table";
import { icosaImportSchema } from "./external.schema";

const ICOSA_BASE = "https://api.icosa.gallery/v1";

export const searchIcosaAssets = async (c: Context<BaseContext>) => {
	const query = c.req.query();
	const q = query.q;
	if (!q) {
		throw new HTTPException(StatusCodes.BAD_REQUEST, {
			message: "Search query 'q' is required",
		});
	}

	const params = new URLSearchParams({ q });
	if (query.format) params.set("format", query.format);

	const response = await fetch(`${ICOSA_BASE}/assets?${params.toString()}`, {
		headers: { Accept: "application/json" },
	});

	if (!response.ok) {
		throw new HTTPException(response.status as any, {
			message: "Icosa API request failed",
		});
	}

	const data = await response.json();
	return c.json(data, StatusCodes.OK);
};

export const getIcosaAsset = async (
	c: Context<BaseContext>,
	input: { params?: { id: string } },
) => {
	const id = input.params?.id;
	if (!id) {
		throw new HTTPException(StatusCodes.BAD_REQUEST, {
			message: "Asset ID is required",
		});
	}

	const response = await fetch(`${ICOSA_BASE}/assets/${id}`, {
		headers: { Accept: "application/json" },
	});

	if (!response.ok) {
		throw new HTTPException(response.status as any, {
			message: "Icosa asset not found",
		});
	}

	const data = await response.json();
	return c.json(data, StatusCodes.OK);
};

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 200);
}

export const importIcosaAsset = async (
	c: Context<BaseContext>,
	input: { body?: Record<string, unknown> },
) => {
	const user = c.get("user");
	if (!user) {
		throw new HTTPException(StatusCodes.UNAUTHORIZED, {
			message: "Authentication required",
		});
	}

	const parsed = icosaImportSchema.safeParse(input.body);
	if (!parsed.success) {
		throw new HTTPException(StatusCodes.BAD_REQUEST, {
			message: "Invalid import data",
			cause: { issues: parsed.error.issues },
		});
	}

	const data = parsed.data;
	const db = c.get("db");

	let slug = slugify(data.displayName);
	if (!slug) slug = `icosa-${data.assetId}`;

	// Ensure slug uniqueness
	let uniqueSlug = slug;
	let suffix = 1;
	while (true) {
		const existing = await db.query.models.findFirst({
			where: eq(models.slug, uniqueSlug),
		});
		if (!existing) break;
		uniqueSlug = `${slug}-${suffix}`;
		suffix++;
	}

	const description = data.description
		? `${data.description}\n\nImported from Icosa Gallery (https://icosa.gallery/view/${data.assetId})`
		: `Imported from Icosa Gallery (https://icosa.gallery/view/${data.assetId})`;

	const [newModel] = await db
		.insert(models)
		.values({
			name: data.displayName,
			slug: uniqueSlug,
			type: "3d-model",
			description,
			imageUrl: data.thumbnailUrl || null,
			fileUrl: data.gltfUrl || null,
			externalUrl: `https://icosa.gallery/view/${data.assetId}`,
			license: data.license || null,
			userId: user.id,
			isPublished: true,
		})
		.returning();

	return c.json({ model: newModel }, StatusCodes.CREATED);
};

export const proxyManyfoldRequest = async (c: Context<BaseContext>) => {
	const manyfoldUrl = c.env.MANYFOLD_URL;
	const manyfoldToken = c.env.MANYFOLD_TOKEN;

	if (!manyfoldUrl) {
		return c.json(
			{
				error: "Manyfold not configured",
				message: "MANYFOLD_URL is not set. Manyfold integration will be available once deployed.",
			},
			StatusCodes.SERVICE_UNAVAILABLE,
		);
	}

	// The module is mounted at /api/external, so c.req.path is /api/external/manyfold/...
	// Strip the prefix to get the Manyfold API path
	const path = c.req.path.replace(/^\/api\/external\/manyfold/, "/api");
	const method = c.req.method;
	const headers: Record<string, string> = {
		Accept: "application/json",
	};
	if (manyfoldToken) {
		headers["Authorization"] = `Bearer ${manyfoldToken}`;
	}

	let body: string | undefined;
	if (method !== "GET" && method !== "HEAD") {
		body = await c.req.text();
		if (body) headers["Content-Type"] = "application/json";
	}

	try {
		const response = await fetch(`${manyfoldUrl}${path}`, {
			method,
			headers,
			body,
		});

		const data = response.headers.get("content-type")?.includes("application/json")
			? await response.json()
			: await response.text();

		return c.json(data, response.status as any);
	} catch (err) {
		return c.json(
			{
				error: "Manyfold connection failed",
				message: `Could not connect to Manyfold at ${manyfoldUrl}`,
			},
			StatusCodes.SERVICE_UNAVAILABLE,
		);
	}
};

export const proxyManyfoldFile = async (
	c: Context<BaseContext>,
	input: { params?: { id: string; fileId?: string } },
) => {
	const manyfoldUrl = c.env.MANYFOLD_URL;
	const manyfoldToken = c.env.MANYFOLD_TOKEN;

	if (!manyfoldUrl) {
		return c.json(
			{ error: "Manyfold not configured" },
			StatusCodes.SERVICE_UNAVAILABLE,
		);
	}

	const modelId = input.params?.id;
	const fileId = input.params?.fileId;
	if (!modelId) {
		throw new HTTPException(StatusCodes.BAD_REQUEST, {
			message: "Model ID is required",
		});
	}

	let url = `${manyfoldUrl}/api/models/${modelId}/files`;
	if (fileId) url += `/${fileId}`;

	const headers: Record<string, string> = {};
	if (manyfoldToken) {
		headers["Authorization"] = `Bearer ${manyfoldToken}`;
	}

	try {
		const response = await fetch(url, { headers });
		const contentType = response.headers.get("content-type") || "application/octet-stream";
		const buffer = await response.arrayBuffer();
		return new Response(buffer, {
			status: response.status,
			headers: { "Content-Type": contentType },
		});
	} catch {
		return c.json(
			{ error: "Manyfold connection failed" },
			StatusCodes.SERVICE_UNAVAILABLE,
		);
	}
};
