import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { cn, colors, layout, spacing, text } from "@/client/lib/design";

export const Route = createFileRoute("/")({
	component: HomePage,
});

interface Model {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	type: string;
	imageUrl: string | null;
	createdAt: string;
}

function HomePage() {
	const [models, setModels] = useState<Model[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");

	useEffect(() => {
		const fetchModels = async () => {
			try {
				const url = search
					? `/api/models?search=${encodeURIComponent(search)}`
					: "/api/models";
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

		fetchModels();
	}, [search]);

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

					{/* Search */}
					<input
						type="text"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search models..."
						className="w-full max-w-md border border-gray-200 px-4 py-2"
					/>
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
								className="border border-gray-200 p-6 transition-colors hover:border-gray-400"
							>
								{model.imageUrl && (
									<img
										src={model.imageUrl}
										alt={model.name}
										className="mb-4 w-full h-48 object-cover"
									/>
								)}
								<h3 className={cn(text.h3, "mb-2")}>{model.name}</h3>
								<p className={cn(text.small, colors.text.secondary, "mb-2")}>
									{model.type}
								</p>
								{model.description && (
									<p className={cn(text.base, colors.text.secondary)}>
										{model.description.substring(0, 100)}
										{model.description.length > 100 ? "..." : ""}
									</p>
								)}
							</a>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
