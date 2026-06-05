import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { cn, colors, layout, spacing, text, interactive, focus } from "@/client/lib/design";

export const Route = createFileRoute("/")({
	component: HomePage,
});

interface Tag {
	id: string;
	name: string;
	slug: string;
}

interface Model {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	type: string;
	imageUrl: string | null;
	createdAt: string;
	tags: Tag[];
	favoriteCount: number;
}

function HomePage() {
	const [models, setModels] = useState<Model[]>([]);
	const [tags, setTags] = useState<Tag[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [selectedTag, setSelectedTag] = useState("");
	const [sort, setSort] = useState("newest");

	const fetchModels = async () => {
		try {
			const params = new URLSearchParams();
			if (search) params.set("search", search);
			if (selectedTag) params.set("tag", selectedTag);
			if (sort) params.set("sort", sort);
			const url = `/api/models?${params.toString()}`;
			const response = await fetch(url);
			if (response.ok) {
				const data = await response.json() as { models: Model[] };
				setModels(data.models);
			}
		} catch (err) {
			console.error("Failed to fetch models:", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchModels();
	}, [search, selectedTag, sort]);

	useEffect(() => {
		const fetchTags = async () => {
			try {
				const response = await fetch("/api/tags");
				if (response.ok) {
					const data = await response.json() as { tags: Tag[] };
					setTags(data.tags);
				}
			} catch (err) {
				console.error("Failed to fetch tags:", err);
			}
		};
		fetchTags();
	}, []);

	const handleFavorite = async (e: React.MouseEvent, modelId: string) => {
		e.preventDefault();
		e.stopPropagation();
		try {
			const response = await fetch(`/api/models/${modelId}/favorite`, {
				method: "POST",
			});
			if (response.ok) {
				fetchModels();
			}
		} catch (err) {
			console.error("Failed to toggle favorite:", err);
		}
	};

	return (
		<div className={spacing.page}>
			<div className={layout.container}>
				{/* Header */}
				<div className="mb-8">
					<h1 className={cn(text.h1, colors.text.primary, "mb-4")}>
						ModelHive
					</h1>
					<p className={cn(text.base, colors.text.secondary, "mb-6")}>
						Discover and share AI models, 3D models, and more
					</p>

					{/* Search & Sort */}
					<div className="flex flex-wrap gap-4 mb-4">
						<input
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search models..."
							className={cn("flex-1 min-w-[200px] max-w-md border border-gray-200 px-4 py-2", focus)}
						/>
						<select
							value={sort}
							onChange={(e) => setSort(e.target.value)}
							className={cn("border border-gray-200 px-3 py-2", focus)}
						>
							<option value="newest">Newest</option>
							<option value="popular">Most Popular</option>
						</select>
					</div>

					{/* Tags Filter */}
					{tags.length > 0 && (
						<div className="flex flex-wrap gap-2">
							<button
								type="button"
								onClick={() => setSelectedTag("")}
								className={cn(
									"px-3 py-1 text-sm border transition-colors",
									!selectedTag
										? "border-gray-800 bg-gray-800 text-white"
										: "border-gray-200 hover:border-gray-400",
								)}
							>
								All
							</button>
							{tags.map((tag) => (
								<button
									key={tag.id}
									type="button"
									onClick={() => setSelectedTag(tag.slug)}
									className={cn(
										"px-3 py-1 text-sm border transition-colors",
										selectedTag === tag.slug
											? "border-gray-800 bg-gray-800 text-white"
											: "border-gray-200 hover:border-gray-400",
									)}
								>
									{tag.name}
								</button>
							))}
						</div>
					)}
				</div>

				{/* Models Grid */}
				{loading ? (
					<p className={text.base}>Loading...</p>
				) : models.length === 0 ? (
					<div className="py-12 text-center">
						<p className={cn(text.h3, colors.text.secondary, "mb-4")}>
							No models yet
						</p>
						<p className={cn(text.base, colors.text.secondary)}>
							Be the first to{" "}
							<a href="/dashboard/models/new" className={cn(colors.text.primary, "underline")}>
								create a model
							</a>
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{models.map((model) => (
							<a
								key={model.id}
								href={`/models/${model.slug}`}
								className="border border-gray-200 p-6 transition-colors hover:border-gray-400 flex flex-col"
							>
								{model.imageUrl && (
									<img
										src={model.imageUrl}
										alt={model.name}
										className="mb-4 w-full h-48 object-cover"
									/>
								)}
								<div className="flex-1">
									<h3 className={cn(text.h3, "mb-2")}>{model.name}</h3>
									<p className={cn(text.small, colors.text.secondary, "mb-2")}>
										{model.type}
									</p>
									{model.description && (
										<p className={cn(text.base, colors.text.secondary, "mb-3")}>
											{model.description.substring(0, 100)}
											{model.description.length > 100 ? "..." : ""}
										</p>
									)}
									{/* Tags */}
									{model.tags.length > 0 && (
										<div className="flex flex-wrap gap-1 mb-3">
											{model.tags.map((tag) => (
												<span
													key={tag.id}
													className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600"
												>
													{tag.name}
												</span>
											))}
										</div>
									)}
								</div>
								{/* Favorite count */}
								<div className="flex items-center gap-1 mt-2">
									<button
										type="button"
										onClick={(e) => handleFavorite(e, model.id)}
										className={cn(
											"flex items-center gap-1 px-2 py-1 text-sm transition-colors",
											interactive.base,
										)}
									>
										<span>{model.favoriteCount > 0 ? "❤️" : "🤍"}</span>
										<span className={cn(text.small, colors.text.secondary)}>
											{model.favoriteCount}
										</span>
									</button>
								</div>
							</a>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
