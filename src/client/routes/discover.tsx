import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
	cn,
	colors,
	focus,
	interactive,
	layout,
	spacing,
	text,
} from "@/client/lib/design";
import { ModelViewer } from "@/client/components/model/model-viewer";
import { useSession } from "@/client/lib/auth";

interface IcosaFormat {
	formatType: string;
	isPreferredForDownload: boolean;
	isPreferredForGalleryViewer: boolean;
	root: { url: string };
}

interface IcosaAsset {
	assetId: string;
	displayName: string;
	description: string | null;
	authorName: string;
	thumbnail: { url: string };
	triangleCount: number;
	license: string;
	formats: IcosaFormat[];
	url: string;
}

interface IcosaResponse {
	assets: IcosaAsset[];
	totalSize?: number;
	nextPageToken?: string;
}

export const Route = createFileRoute("/discover")({
	component: DiscoverPage,
});

const FORMAT_OPTIONS = [
	{ value: "", label: "All Formats" },
	{ value: "GLTF2", label: "glTF 2.0" },
	{ value: "GLB", label: "GLB" },
	{ value: "OBJ", label: "OBJ" },
	{ value: "GLTF1", label: "glTF 1.0" },
];
const SORT_OPTIONS = [
	{ value: "BEST", label: "Best Match" },
	{ value: "NEWEST", label: "Newest" },
];
const COMPLEXITY_OPTIONS = [
	{ value: "", label: "Any Complexity" },
	{ value: "LOW", label: "Low" },
	{ value: "MEDIUM", label: "Medium" },
	{ value: "HIGH", label: "High" },
];
const LICENCE_OPTIONS = [
	{ value: "", label: "Any License" },
	{ value: "REMIXABLE", label: "Remixable" },
	{ value: "CREATIVE_COMMONS_BY", label: "CC BY" },
	{ value: "CREATIVE_COMMONS_BY_NC", label: "CC BY-NC" },
];

function DiscoverPage() {
	const navigate = useNavigate();
	const { data: session } = useSession();
	const [query, setQuery] = useState("");
	const [search, setSearch] = useState("");
	const [assets, setAssets] = useState<IcosaAsset[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [nextPageToken, setNextPageToken] = useState<string | null>(null);
	const [totalSize, setTotalSize] = useState(0);
	const [pageHistory, setPageHistory] = useState<string[]>([]);
	const [format, setFormat] = useState("");
	const [sort, setSort] = useState("BEST");
	const [licence, setLicence] = useState("");
	const [maxComplexity, setMaxComplexity] = useState("");
	const [previewAsset, setPreviewAsset] = useState<{
		id: string;
		name: string;
		gltfUrl: string;
	} | null>(null);
	const [previewLoading, setPreviewLoading] = useState(false);
	const [previewError, setPreviewError] = useState("");
	const [importing, setImporting] = useState<Set<string>>(new Set());
	const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
	const [importMsg, setImportMsg] = useState<{
		id: string;
		type: "success" | "error";
		text: string;
		modelSlug?: string;
	} | null>(null);

	const buildUrl = (pageToken?: string) => {
		const params = new URLSearchParams({ q: search });
		if (format) params.set("format", format);
		if (sort) params.set("orderBy", sort);
		if (licence) params.set("licence", licence);
		if (maxComplexity) params.set("maxComplexity", maxComplexity);
		if (pageToken) params.set("pageToken", pageToken);
		return `/api/external/icosa/assets?${params.toString()}`;
	};

	const fetchAssets = async (pageToken?: string) => {
		if (!search.trim()) return;
		setLoading(true);
		setError("");
		try {
			const response = await fetch(buildUrl(pageToken));
			if (response.ok) {
				const data = (await response.json()) as IcosaResponse;
				setAssets(data.assets || []);
				setNextPageToken(data.nextPageToken || null);
				setTotalSize(data.totalSize || 0);
			} else {
				setError("Search failed. Please try again.");
			}
		} catch {
			setError("Failed to connect to Icosa Gallery.");
		} finally {
			setLoading(false);
		}
	};

	const goToPage = (pageToken?: string) => {
		if (pageToken) setPageHistory((prev) => [...prev, pageToken]);
		fetchAssets(pageToken);
	};

	const goBack = () => {
		if (pageHistory.length <= 1) return;
		const prev = pageHistory.slice(0, -1);
		const prevToken = prev.length > 0 ? prev[prev.length - 1] : undefined;
		setPageHistory(prev);
		fetchAssets(prevToken);
	};

	const openPreview = (e: React.MouseEvent, asset: IcosaAsset) => {
		e.preventDefault();
		e.stopPropagation();
		setPreviewLoading(true);
		setPreviewError("");

		const gltfFormat = asset.formats?.find(
			(f) =>
				f.root?.url &&
				(f.formatType === "GLTF2" || f.formatType === "GLTF1" || f.formatType === "GLB"),
		) || asset.formats?.find((f) => f.root?.url);

		if (gltfFormat?.root?.url) {
			setPreviewAsset({
				id: asset.assetId,
				name: asset.displayName,
				gltfUrl: gltfFormat.root.url,
			});
			setPreviewLoading(false);
		} else {
			setPreviewError("No previewable format available for this model.");
			setPreviewLoading(false);
		}
	};

	const closePreview = () => {
		setPreviewAsset(null);
		setPreviewError("");
	};

	const importAsset = async (e: React.MouseEvent, asset: IcosaAsset) => {
		e.preventDefault();
		e.stopPropagation();

		if (!session?.user) {
			navigate({ to: "/login" });
			return;
		}

		setImporting((prev) => new Set(prev).add(asset.assetId));
		setImportMsg(null);

		const gltfFormat = asset.formats?.find(
			(f) =>
				f.root?.url &&
				(f.formatType === "GLTF2" || f.formatType === "GLTF1" || f.formatType === "GLB"),
		) || asset.formats?.find((f) => f.root?.url);

		try {
			const response = await fetch("/api/external/icosa/import", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					assetId: asset.assetId,
					displayName: asset.displayName,
					description: asset.description || "",
					authorName: asset.authorName,
					thumbnailUrl: asset.thumbnail?.url || "",
					license: asset.license,
					gltfUrl: gltfFormat?.root?.url || "",
				}),
			});
			if (response.ok) {
				const data = (await response.json()) as { model: { slug: string } };
				setImportedIds((prev) => new Set(prev).add(asset.assetId));
				setImportMsg({
					id: asset.assetId,
					type: "success",
					text: "Imported successfully!",
					modelSlug: data.model.slug,
				});
			} else {
				const err = (await response.json()) as { error?: { message?: string } };
				setImportMsg({
					id: asset.assetId,
					type: "error",
					text: err.error?.message || "Import failed",
				});
			}
		} catch {
			setImportMsg({
				id: asset.assetId,
				type: "error",
				text: "Failed to import",
			});
		} finally {
			setImporting((prev) => {
				const next = new Set(prev);
				next.delete(asset.assetId);
				return next;
			});
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setSearch(query);
		setPageHistory([]);
	};

	useEffect(() => {
		if (search) {
			setPageHistory([]);
			fetchAssets();
		}
	}, [search, format, sort, licence, maxComplexity]);

	const formatLicense = (license: string) =>
		license
			.replace(/_/g, " ")
			.replace(/\b\w/g, (c) => c.toUpperCase());

	return (
		<div className={spacing.page}>
			<div className={layout.container}>
				<div className="mb-8">
					<h1 className={cn(text.h1, colors.text.primary, "mb-4")}>Discover</h1>
					<p className={cn(text.base, colors.text.secondary, "mb-6")}>
						Search 3D models from{" "}
						<a
							href="https://icosa.gallery"
							target="_blank"
							rel="noopener noreferrer"
							className="underline hover:text-gray-900"
						>
							Icosa Gallery
						</a>
					</p>

					<form onSubmit={handleSubmit} className="mb-4 flex gap-3">
						<input
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search 3D models..."
							className={cn(
								"min-w-[200px] max-w-md flex-1 border border-gray-200 px-4 py-2",
								focus,
							)}
						/>
						<button
							type="submit"
							className={cn(
								interactive.button.primary,
								"flex items-center gap-2",
							)}
						>
							Search
						</button>
					</form>

					{/* Filters */}
					{search && (
						<div className="mb-6 flex flex-wrap gap-3">
							<select
								value={format}
								onChange={(e) => setFormat(e.target.value)}
								className={cn("border border-gray-200 px-3 py-1.5 text-sm", focus)}
							>
								{FORMAT_OPTIONS.map((o) => (
									<option key={o.value} value={o.value}>{o.label}</option>
								))}
							</select>
							<select
								value={sort}
								onChange={(e) => setSort(e.target.value)}
								className={cn("border border-gray-200 px-3 py-1.5 text-sm", focus)}
							>
								{SORT_OPTIONS.map((o) => (
									<option key={o.value} value={o.value}>{o.label}</option>
								))}
							</select>
							<select
								value={licence}
								onChange={(e) => setLicence(e.target.value)}
								className={cn("border border-gray-200 px-3 py-1.5 text-sm", focus)}
							>
								{LICENCE_OPTIONS.map((o) => (
									<option key={o.value} value={o.value}>{o.label}</option>
								))}
							</select>
							<select
								value={maxComplexity}
								onChange={(e) => setMaxComplexity(e.target.value)}
								className={cn("border border-gray-200 px-3 py-1.5 text-sm", focus)}
							>
								{COMPLEXITY_OPTIONS.map((o) => (
									<option key={o.value} value={o.value}>{o.label}</option>
								))}
							</select>
						</div>
					)}
				</div>

				{error && (
					<p className={cn(text.base, "text-red-600 mb-4")}>{error}</p>
				)}

				{loading ? (
					<p className={text.base}>Loading...</p>
				) : !search ? (
					<div className="py-12 text-center">
						<p className={cn(text.h3, colors.text.secondary, "mb-4")}>
							Search for 3D models
						</p>
						<p className={cn(text.base, colors.text.secondary)}>
							Enter a search term above to browse models from Icosa Gallery
						</p>
					</div>
				) : assets.length === 0 ? (
					<p className={cn(text.base, colors.text.secondary)}>
						No results found for "{search}"
					</p>
				) : (
					<>
					{totalSize > 0 && (
						<p className={cn(text.small, colors.text.secondary, "mb-4")}>
							{totalSize.toLocaleString()} results
						</p>
					)}
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{assets.map((asset) => (
							<div
								key={asset.assetId}
								className="flex flex-col border border-gray-200 p-6 transition-colors hover:border-gray-400"
							>
								{asset.thumbnail?.url && (
									<img
										src={asset.thumbnail.url}
										alt={asset.displayName}
										className="mb-4 h-48 w-full object-cover"
									/>
								)}
								<div className="flex-1">
									<h3 className={cn(text.h3, "mb-1")}>{asset.displayName}</h3>
									<p className={cn(text.tiny, colors.text.secondary, "mb-2")}>
										by {asset.authorName}
									</p>
									{asset.description && (
										<p className={cn(text.small, colors.text.secondary, "mb-3")}>
											{asset.description.substring(0, 100)}
											{asset.description.length > 100 ? "..." : ""}
										</p>
									)}
									{asset.formats && asset.formats.length > 0 && (
										<div className="mb-2 flex flex-wrap gap-1">
											{asset.formats
												.filter((f) => f.isPreferredForDownload)
												.slice(0, 3)
												.map((f) => (
													<span
														key={f.formatType}
														className="bg-gray-100 px-2 py-0.5 text-gray-600 text-xs"
													>
														{f.formatType}
													</span>
												))}
										</div>
									)}
								</div>
								<div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
									{asset.triangleCount > 0 && (
										<span>{asset.triangleCount.toLocaleString()} triangles</span>
									)}
									<span>{formatLicense(asset.license)}</span>
								</div>
								<div className="mt-3 flex gap-2">
									<button
										type="button"
										onClick={(e) => openPreview(e, asset)}
										className={cn(
											"flex-1 border border-gray-300 px-3 py-1.5 text-sm transition-colors hover:bg-gray-50",
										)}
									>
										Preview
									</button>
									<button
										type="button"
										onClick={(e) => importAsset(e, asset)}
										disabled={importing.has(asset.assetId)}
										className={cn(
											"flex-1 border px-3 py-1.5 text-sm transition-colors",
											importedIds.has(asset.assetId)
												? "border-green-500 bg-green-50 text-green-700"
												: "border-gray-300 hover:bg-gray-50",
										)}
									>
										{importing.has(asset.assetId)
											? "Importing..."
											: importedIds.has(asset.assetId)
												? "Imported"
												: "Import"}
									</button>
									<a
										href={`https://icosa.gallery/view/${asset.assetId}`}
										target="_blank"
										rel="noopener noreferrer"
										className={cn(
											"flex-1 border border-gray-300 px-3 py-1.5 text-sm text-center transition-colors hover:bg-gray-50",
										)}
									>
										Open
									</a>
								</div>
								{importMsg && importMsg.id === asset.assetId && (
									<div
										className={cn(
											"mt-2 text-xs",
											importMsg.type === "success"
												? "text-green-600"
												: "text-red-600",
										)}
									>
										{importMsg.type === "success" ? (
											<a
												href={`/models/${importMsg.modelSlug}`}
												className="underline"
											>
												{importMsg.text} View model
											</a>
										) : (
											importMsg.text
										)}
									</div>
								)}
							</div>
						))}
					</div>
					{/* Pagination */}
					{totalSize > 0 && (
						<div className="mt-8 flex items-center justify-center gap-3">
							<button
								type="button"
								disabled={pageHistory.length === 0}
								onClick={goBack}
								className={cn(
									"border border-gray-200 px-4 py-2 text-sm transition-colors hover:bg-gray-50",
									pageHistory.length === 0 && "cursor-not-allowed opacity-50",
								)}
							>
								Previous
							</button>
							<span className={cn(text.small, colors.text.secondary)}>
								Page {pageHistory.length + 1}
							</span>
							<button
								type="button"
								disabled={!nextPageToken}
								onClick={() => goToPage(nextPageToken!)}
								className={cn(
									"border border-gray-200 px-4 py-2 text-sm transition-colors hover:bg-gray-50",
									!nextPageToken && "cursor-not-allowed opacity-50",
								)}
							>
								Next
							</button>
						</div>
					)}
					</>
				)}

				{/* Preview Modal */}
				{(previewAsset || previewLoading) && (
					<div
						className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
						onClick={closePreview}
					>
						<div
							className="flex w-full max-w-4xl flex-col bg-white"
							onClick={(e) => e.stopPropagation()}
						>
							<div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
								<h2 className={cn(text.h3, colors.text.primary)}>
									{previewAsset?.name || "Loading..."}
								</h2>
								<button
									type="button"
									onClick={closePreview}
									className={cn(
										"text-gray-400 transition-colors hover:text-gray-600 text-xl leading-none",
									)}
								>
									&times;
								</button>
							</div>
							<div className="relative h-[60vh] w-full">
								{previewLoading && (
									<div className="absolute inset-0 flex items-center justify-center bg-gray-100">
										<p className="text-gray-500 text-sm">Loading model details...</p>
									</div>
								)}
								{previewError && (
									<div className="absolute inset-0 flex items-center justify-center bg-gray-100">
										<p className="text-red-500 text-sm">{previewError}</p>
									</div>
								)}
								{previewAsset && !previewLoading && !previewError && (
									<ModelViewer gltfUrl={previewAsset.gltfUrl} className="h-full w-full" />
								)}
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
