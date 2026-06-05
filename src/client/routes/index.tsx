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
	userId: string;
}

function HomePage() {
	const [models, setModels] = useState<Model[]>([]);
	const [tags, setTags] = useState<Tag[]>([]);
	const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [selectedTag, setSelectedTag] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("");
	const [typeFilter, setTypeFilter] = useState("");
	const [sort, setSort] = useState("newest");
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);

	const fetchModels = async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams();
			if (search) params.set("search", search);
			if (selectedTag) params.set("tag", selectedTag);
			if (selectedCategory) params.set("category", selectedCategory);
			if (typeFilter) params.set("type", typeFilter);
			if (sort) params.set("sort", sort);
			params.set("page", String(page));
			const url = `/api/models?${params.toString()}`;
			const response = await fetch(url);
			if (response.ok) {
				const data = (await response.json()) as { models: Model[]; totalPages: number };
				setModels(data.models);
				setTotalPages(data.totalPages || 1);
			}
		} catch (err) {
			console.error("Failed to fetch models:", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		setPage(1);
	}, [search, selectedTag, selectedCategory, typeFilter, sort]);

	useEffect(() => {
		fetchModels();
	}, [search, selectedTag, selectedCategory, typeFilter, sort, page]);

	useEffect(() => {
		const fetchTags = async () => {
			try {
				const response = await fetch("/api/tags");
				if (response.ok) {
					const data = (await response.json()) as { tags: Tag[] };
					setTags(data.tags);
				}
			} catch (err) {
				console.error("Failed to fetch tags:", err);
			}
		};
		fetchTags();
	}, []);

	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const response = await fetch("/api/categories");
				if (response.ok) {
					const data = (await response.json()) as { categories: { id: string; name: string; slug: string }[] };
					setCategories(data.categories);
				}
			} catch {}
		};
		fetchCategories();
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

					{/* Search & Filters */}
					<div className="mb-4 flex flex-wrap gap-4">
						<input
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search models..."
							className={cn(
								"min-w-[200px] max-w-md flex-1 border border-gray-200 px-4 py-2",
								focus,
							)}
						/>
						<select
							value={typeFilter}
							onChange={(e) => setTypeFilter(e.target.value)}
							className={cn("border border-gray-200 px-3 py-2", focus)}
						>
							<option value="">All Types</option>
							<option value="ai-model">AI Model</option>
							<option value="3d-model">3D Model</option>
							<option value="design">Design</option>
							<option value="other">Other</option>
						</select>
						<select
							value={sort}
							onChange={(e) => setSort(e.target.value)}
							className={cn("border border-gray-200 px-3 py-2", focus)}
						>
							<option value="newest">Newest</option>
							<option value="popular">Most Popular</option>
						</select>
					</div>

					{/* Category & Tags Filter */}
					<div className="mb-4 flex flex-wrap gap-2">
						{categories.length > 0 && (
							<>
								{categories.map((cat) => (
									<button
										key={cat.id}
										type="button"
										onClick={() =>
											setSelectedCategory(
												selectedCategory === cat.slug ? "" : cat.slug,
											)
										}
										className={cn(
											"border px-3 py-1 text-sm transition-colors",
											selectedCategory === cat.slug
												? "border-gray-800 bg-gray-800 text-white"
												: "border-gray-200 hover:border-gray-400",
										)}
									>
										{cat.name}
									</button>
								))}
								<span className="w-px bg-gray-200 mx-1" />
							</>
						)}
						<button
							type="button"
							onClick={() => setSelectedTag("")}
							className={cn(
								"border px-3 py-1 text-sm transition-colors",
								!selectedTag
									? "border-gray-800 bg-gray-800 text-white"
									: "border-gray-200 hover:border-gray-400",
							)}
						>
							All Tags
						</button>
						{tags.map((tag) => (
							<button
								key={tag.id}
								type="button"
								onClick={() => setSelectedTag(tag.slug)}
								className={cn(
									"border px-3 py-1 text-sm transition-colors",
									selectedTag === tag.slug
										? "border-gray-800 bg-gray-800 text-white"
										: "border-gray-200 hover:border-gray-400",
								)}
							>
								{tag.name}
							</button>
						))}
					</div>
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
							<a
								href="/dashboard/models/new"
								className={cn(colors.text.primary, "underline")}
							>
								create a model
							</a>
						</p>
					</div>
				) : (
					<>
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
							{models.map((model) => (
								<a
									key={model.id}
									href={`/models/${model.slug}`}
									className="flex flex-col border border-gray-200 p-6 transition-colors hover:border-gray-400"
								>
									{model.imageUrl && (
										<img
											src={model.imageUrl}
											alt={model.name}
											className="mb-4 h-48 w-full object-cover"
										/>
									)}
									<div className="flex-1">
										<h3 className={cn(text.h3, "mb-2")}>{model.name}</h3>
									<p className={cn(text.small, colors.text.secondary, "mb-2")}>
										{model.type}
									</p>
									<p className={cn(text.small, "mb-2")}>
										<a
											href={`/users/${model.userId}`}
											className="text-gray-400 hover:text-gray-600"
										>
											by User
										</a>
									</p>
									{model.description && (
											<p className={cn(text.base, colors.text.secondary, "mb-3")}>
												{model.description.substring(0, 100)}
												{model.description.length > 100 ? "..." : ""}
											</p>
										)}
										{/* Tags */}
										{model.tags.length > 0 && (
											<div className="mb-3 flex flex-wrap gap-1">
												{model.tags.map((tag) => (
													<span
														key={tag.id}
														className="bg-gray-100 px-2 py-0.5 text-gray-600 text-xs"
													>
														{tag.name}
													</span>
												))}
											</div>
										)}
									</div>
									{/* Favorite count */}
									<div className="mt-2 flex items-center gap-1">
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
						{/* Pagination */}
						{totalPages > 1 && (
							<div className="mt-8 flex items-center justify-center gap-2">
								<button
									type="button"
									disabled={page <= 1}
									onClick={() => setPage((p) => Math.max(1, p - 1))}
									className={cn(
										"border border-gray-200 px-4 py-2 text-sm",
										interactive.base,
										page <= 1 && "opacity-50 cursor-not-allowed",
									)}
								>
									Previous
								</button>
								<span className={cn(text.small, colors.text.secondary)}>
									Page {page} of {totalPages}
								</span>
								<button
									type="button"
									disabled={page >= totalPages}
									onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
									className={cn(
										"border border-gray-200 px-4 py-2 text-sm",
										interactive.base,
										page >= totalPages && "opacity-50 cursor-not-allowed",
									)}
								>
									Next
								</button>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
}
