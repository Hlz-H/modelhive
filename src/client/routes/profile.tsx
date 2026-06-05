import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { UserProfile } from "../components/auth/user-profile";
import { cn, colors, layout, spacing, text } from "@/client/lib/design";

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

function ProfilePage() {
	const [favorites, setFavorites] = useState<Model[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchFavorites = async () => {
			try {
				const response = await fetch("/api/users/me/favorites");
				if (response.ok) {
					const data = await response.json() as { models: Model[] };
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

	return (
		<div className={spacing.page}>
			<div className={layout.container}>
				<UserProfile />

				{/* Favorites Section */}
				<div className="mt-8">
					<h2 className={cn(text.h2, colors.text.primary, "mb-4")}>
						My Favorites
					</h2>
					{loading ? (
						<p className={text.base}>Loading...</p>
					) : favorites.length === 0 ? (
						<p className={cn(text.base, colors.text.secondary)}>
							No favorites yet. Browse models and click the heart button to save your favorites.
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
											{model.type} • {new Date(model.createdAt).toLocaleDateString()}
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
