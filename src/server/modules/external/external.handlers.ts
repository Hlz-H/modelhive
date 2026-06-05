import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { StatusCodes } from "http-status-codes";
import type { BaseContext } from "@/server/lib/worker-types";

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
