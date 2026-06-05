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

interface IcosaAsset {
	assetId: string;
	displayName: string;
	description: string | null;
	authorName: string;
	thumbnail: { url: string };
	triangleCount: number;
	license: string;
	formats: { formatType: string; isPreferredForDownload: boolean }[];
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
							<a
								key={asset.assetId}
								href={`https://icosa.gallery/view/${asset.assetId}`}
								target="_blank"
								rel="noopener noreferrer"
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
							</a>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
