import { createFileRoute } from "@tanstack/react-router";
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
}

export const Route = createFileRoute("/discover")({
	component: DiscoverPage,
});

function DiscoverPage() {
	const [query, setQuery] = useState("");
	const [search, setSearch] = useState("");
	const [assets, setAssets] = useState<IcosaAsset[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [previewAsset, setPreviewAsset] = useState<{
		id: string;
		name: string;
		gltfUrl: string;
	} | null>(null);
	const [previewLoading, setPreviewLoading] = useState(false);
	const [previewError, setPreviewError] = useState("");

	const fetchAssets = async (q: string) => {
		if (!q.trim()) return;
		setLoading(true);
		setError("");
		try {
			const response = await fetch(`/api/external/icosa/assets?q=${encodeURIComponent(q)}`);
			if (response.ok) {
				const data = (await response.json()) as IcosaResponse;
				setAssets(data.assets || []);
			} else {
				setError("Search failed. Please try again.");
			}
		} catch {
			setError("Failed to connect to Icosa Gallery.");
		} finally {
			setLoading(false);
		}
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

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setSearch(query);
	};

	useEffect(() => {
		if (search) fetchAssets(search);
	}, [search]);

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

					<form onSubmit={handleSubmit} className="mb-6 flex gap-3">
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
							</div>
						))}
					</div>
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
