import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { cn, colors, layout, spacing, text, interactive, focus } from "@/client/lib/design";

export const Route = createFileRoute("/models/$slug")({
	component: ModelDetailPage,
});

interface Tag {
	id: string;
	name: string;
	slug: string;
}

interface ModelVersion {
	id: string;
	version: string;
	fileUrl: string | null;
	changelog: string | null;
	downloadCount: number;
	createdAt: string;
}

interface Model {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	type: string;
	imageUrl: string | null;
	externalUrl: string | null;
	version: string;
	createdAt: string;
	tags: Tag[];
	favoriteCount: number;
}

function ModelDetailPage() {
	const { slug } = Route.useParams();
	const [model, setModel] = useState<Model | null>(null);
	const [versions, setVersions] = useState<ModelVersion[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const fetchModel = async () => {
		try {
			const [modelRes, versionsRes] = await Promise.all([
				fetch(`/api/models/${slug}`),
				fetch(`/api/models/${slug}/versions`),
			]);
			if (modelRes.ok) {
				const data = await modelRes.json() as { model: Model };
				setModel(data.model);
			} else {
				setError("Model not found");
			}
			if (versionsRes.ok) {
				const data = await versionsRes.json() as { versions: ModelVersion[] };
				setVersions(data.versions);
			}
		} catch (err) {
			setError("Failed to load model");
		} finally {
			setLoading(false);
		}
	};

	const handleDownload = async (versionId: string) => {
		try {
			await fetch(`/api/models/${model?.id}/versions/${versionId}/download`, {
				method: "POST",
			});
			setVersions((prev) =>
				prev.map((v) =>
					v.id === versionId ? { ...v, downloadCount: v.downloadCount + 1 } : v,
				),
			);
		} catch (err) {
			console.error("Failed to track download:", err);
		}
	};

	useEffect(() => {
		fetchModel();
	}, [slug]);

	const handleFavorite = async () => {
		if (!model) return;
		try {
			const response = await fetch(`/api/models/${model.id}/favorite`, {
				method: "POST",
			});
			if (response.ok) {
				const data = await response.json() as { favorited: boolean };
				setModel({
					...model,
					favoriteCount: data.favorited
						? model.favoriteCount + 1
						: model.favoriteCount - 1,
				});
			}
		} catch (err) {
			console.error("Failed to toggle favorite:", err);
		}
	};

	if (loading) {
		return (
			<div className={spacing.page}>
				<div className={layout.container}>
					<p className={text.base}>Loading...</p>
				</div>
			</div>
		);
	}

	if (error || !model) {
		return (
			<div className={spacing.page}>
				<div className={layout.container}>
					<p className={cn(text.base, "text-red-600")}>{error}</p>
				</div>
			</div>
		);
	}

	return (
		<div className={spacing.page}>
			<div className={layout.container}>
				<div className="mb-8">
					<h1 className={cn(text.h1, colors.text.primary)}>{model.name}</h1>
					<p className={cn(text.base, colors.text.secondary)}>
						{model.type} • v{model.version}
					</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					<div className="lg:col-span-2">
						{model.imageUrl && (
							<img
								src={model.imageUrl}
								alt={model.name}
								className="w-full mb-6"
							/>
						)}
						{model.description && (
							<div className="prose">
								<p className={text.base}>{model.description}</p>
							</div>
						)}

						{/* Tags */}
						{model.tags.length > 0 && (
							<div className="mt-6">
								<h3 className={cn(text.h3, "mb-3")}>Tags</h3>
								<div className="flex flex-wrap gap-2">
									{model.tags.map((tag) => (
										<span
											key={tag.id}
											className="px-3 py-1 text-sm bg-gray-100 text-gray-700"
										>
											{tag.name}
										</span>
									))}
								</div>
							</div>
						)}
					</div>

					<div>
						<div className="border border-gray-200 p-6">
							<h3 className={cn(text.h3, "mb-4")}>Details</h3>
							<dl className="space-y-2">
								<div>
									<dt className={text.small}>Type</dt>
									<dd className={text.base}>{model.type}</dd>
								</div>
								<div>
									<dt className={text.small}>Version</dt>
									<dd className={text.base}>{model.version}</dd>
								</div>
								<div>
									<dt className={text.small}>Created</dt>
									<dd className={text.base}>
										{new Date(model.createdAt).toLocaleDateString()}
									</dd>
								</div>
							</dl>

							{/* Favorite button */}
							<button
								type="button"
								onClick={handleFavorite}
								className={cn(
									"mt-4 flex w-full items-center justify-center gap-2 px-4 py-3 border border-gray-200",
									interactive.base,
									focus,
								)}
							>
								<span>{model.favoriteCount > 0 ? "❤️" : "🤍"}</span>
								<span>{model.favoriteCount} {model.favoriteCount === 1 ? "Favorite" : "Favorites"}</span>
							</button>

							{model.externalUrl && (
								<a
									href={model.externalUrl}
									target="_blank"
									rel="noopener noreferrer"
									className={cn(
										"mt-4 flex w-full items-center justify-center px-4 py-3",
										colors.bg.inverse,
										colors.text.inverse,
									)}
								>
									View External Link
								</a>
							)}
						</div>

						{/* Versions */}
						{versions.length > 0 && (
							<div className="border border-gray-200 p-6 mt-6">
								<h3 className={cn(text.h3, "mb-4")}>Versions</h3>
								<div className="space-y-3">
									{versions.map((v) => (
										<div key={v.id} className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
											<div className="flex items-center justify-between mb-1">
												<span className={cn(text.base, "font-medium")}>v{v.version}</span>
												<span className={cn(text.small, colors.text.secondary)}>
													{v.downloadCount} downloads
												</span>
											</div>
											{v.changelog && (
												<p className={cn(text.small, colors.text.secondary, "mb-2")}>
													{v.changelog}
												</p>
											)}
											{v.fileUrl && (
												<a
													href={v.fileUrl}
													target="_blank"
													rel="noopener noreferrer"
													onClick={() => handleDownload(v.id)}
													className={cn(
														"inline-flex items-center gap-1 px-3 py-1 text-sm border border-gray-200",
														interactive.base,
													)}
												>
													Download
												</a>
											)}
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
