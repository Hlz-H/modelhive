import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
	cn,
	colors,
	interactive,
	layout,
	spacing,
	text,
} from "@/client/lib/design";
import { UserProfile } from "../components/auth/user-profile";

export const Route = createFileRoute("/profile")({
	component: ProfilePage,
});

interface Model {
	id: string;
	name: string;
	slug: string;
	type: string;
	createdAt: string;
}

interface Collection {
	id: string;
	name: string;
	description: string | null;
	isPublic: boolean;
	itemCount: number;
	createdAt: string;
}

function ProfilePage() {
	const [favorites, setFavorites] = useState<Model[]>([]);
	const [collections, setCollections] = useState<Collection[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingCollections, setLoadingCollections] = useState(true);

	useEffect(() => {
		const fetchFavorites = async () => {
			try {
				const response = await fetch("/api/users/me/favorites");
				if (response.ok) {
					const data = (await response.json()) as { models: Model[] };
					setFavorites(data.models);
				}
			} catch (err) {
				console.error("Failed to fetch favorites:", err);
			} finally {
				setLoading(false);
			}
		};
		fetchFavorites();
	}, []);

	useEffect(() => {
		const fetchCollections = async () => {
			try {
				const response = await fetch("/api/users/me/collections");
				if (response.ok) {
					const data = (await response.json()) as { collections: Collection[] };
					setCollections(data.collections);
				}
			} catch (err) {
				console.error("Failed to fetch collections:", err);
			} finally {
				setLoadingCollections(false);
			}
		};
		fetchCollections();
	}, []);

	return (
		<div className={spacing.page}>
			<div className={layout.container}>
				<UserProfile />

				{/* Collections Section */}
				<div className="mt-8">
					<div className="mb-4 flex items-center justify-between">
						<h2 className={cn(text.h2, colors.text.primary)}>My Collections</h2>
						<a
							href="/collections/new"
							className={cn(
								"border border-gray-200 px-4 py-2 text-sm",
								interactive.base,
							)}
						>
							+ New Collection
						</a>
					</div>
					{loadingCollections ? (
						<p className={text.base}>Loading...</p>
					) : collections.length === 0 ? (
						<p className={cn(text.base, colors.text.secondary, "mb-8")}>
							No collections yet.
						</p>
					) : (
						<div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
							{collections.map((c) => (
								<a
									key={c.id}
									href={`/collections/${c.id}`}
									className="border border-gray-200 p-4 transition-colors hover:border-gray-400"
								>
									<h3 className={cn(text.h3, colors.text.primary)}>{c.name}</h3>
									{c.description && (
										<p
											className={cn(
												text.small,
												colors.text.secondary,
												"mt-1 line-clamp-2",
											)}
										>
											{c.description}
										</p>
									)}
									<p className={cn(text.small, colors.text.secondary, "mt-2")}>
										{c.itemCount} items • {c.isPublic ? "Public" : "Private"}
									</p>
								</a>
							))}
						</div>
					)}
				</div>

				{/* Favorites Section */}
				<div className="mt-8">
					<h2 className={cn(text.h2, colors.text.primary, "mb-4")}>
						My Favorites
					</h2>
					{loading ? (
						<p className={text.base}>Loading...</p>
					) : favorites.length === 0 ? (
						<p className={cn(text.base, colors.text.secondary)}>
							No favorites yet. Browse models and click the heart button to save
							your favorites.
						</p>
					) : (
						<div className="space-y-2">
							{favorites.map((model) => (
								<a
									key={model.id}
									href={`/models/${model.slug}`}
									className={cn(
										"flex items-center justify-between border border-gray-200 p-4 transition-colors hover:border-gray-400",
									)}
								>
									<div>
										<h3 className={cn(text.h3, colors.text.primary)}>
											{model.name}
										</h3>
										<p className={cn(text.small, colors.text.secondary)}>
											{model.type} •{" "}
											{new Date(model.createdAt).toLocaleDateString()}
										</p>
									</div>
									<span className={text.small}>View →</span>
								</a>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
