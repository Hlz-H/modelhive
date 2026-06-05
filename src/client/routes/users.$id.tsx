import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useSession } from "@client/lib/auth";
import { cn, colors, interactive, layout, spacing, text } from "@/client/lib/design";

export const Route = createFileRoute("/users/$id")({
	component: UserProfilePage,
});

interface UserProfile {
	id: string;
	name: string;
	image: string | null;
}

interface Model {
	id: string;
	name: string;
	slug: string;
	type: string;
	imageUrl: string | null;
	createdAt: string;
}

interface Collection {
	id: string;
	name: string;
	description: string | null;
	isPublic: boolean;
	createdAt: string;
}

function UserProfilePage() {
	const { id } = Route.useParams();
	const { data: session } = useSession();
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [models, setModels] = useState<Model[]>([]);
	const [collections, setCollections] = useState<Collection[]>([]);
	const [isFollowing, setIsFollowing] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		const fetchProfile = async () => {
			try {
				const response = await fetch(`/api/users/${id}`);
				if (response.ok) {
					const data = (await response.json()) as {
						user: UserProfile;
						models: Model[];
						collections: Collection[];
					};
					setProfile(data.user);
					setModels(data.models);
					setCollections(data.collections);
				} else {
					setError("User not found");
				}
			} catch {
				setError("Failed to load profile");
			} finally {
				setLoading(false);
			}
		};
		fetchProfile();
	}, [id]);

	useEffect(() => {
		if (!session || !id) return;
		const checkFollow = async () => {
			try {
				const response = await fetch(`/api/users/${id}/follow-check`);
				if (response.ok) {
					const data = (await response.json()) as { isFollowing: boolean };
					setIsFollowing(data.isFollowing);
				}
			} catch {}
		};
		checkFollow();
	}, [session, id]);

	const handleFollowToggle = async () => {
		try {
			const response = await fetch(`/api/users/${id}/follow`, {
				method: "POST",
			});
			if (response.ok) {
				const data = (await response.json()) as { following: boolean };
				setIsFollowing(data.following);
			}
		} catch {}
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

	if (error || !profile) {
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
				{/* Profile Header */}
				<div className="mb-8 flex items-start gap-6">
					{profile.image && (
						<img
							src={profile.image}
							alt={profile.name}
							className="h-20 w-20 rounded-full object-cover"
						/>
					)}
					<div className="flex-1">
						<h1 className={cn(text.h1, colors.text.primary)}>
							{profile.name}
						</h1>
						{session && session.user.id !== id && (
							<button
								type="button"
								onClick={handleFollowToggle}
								className={cn(
									"mt-3 px-6 py-2 text-sm border",
									isFollowing
										? "border-gray-200"
										: "border-gray-800 bg-gray-800 text-white",
									interactive.base,
								)}
							>
								{isFollowing ? "Following" : "Follow"}
							</button>
						)}
					</div>
				</div>

				{/* Models */}
				<div className="mb-8">
					<h2 className={cn(text.h2, colors.text.primary, "mb-4")}>
						Models ({models.length})
					</h2>
					{models.length === 0 ? (
						<p className={cn(text.base, colors.text.secondary)}>
							No models yet
						</p>
					) : (
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
							{models.map((model) => (
								<a
									key={model.id}
									href={`/models/${model.slug}`}
									className="border border-gray-200 p-4 transition-colors hover:border-gray-400"
								>
									{model.imageUrl && (
										<img
											src={model.imageUrl}
											alt={model.name}
											className="mb-3 h-32 w-full object-cover"
										/>
									)}
									<h3 className={cn(text.h3)}>{model.name}</h3>
									<p className={cn(text.small, colors.text.secondary)}>
										{model.type}
									</p>
								</a>
							))}
						</div>
					)}
				</div>

				{/* Collections */}
				{collections.length > 0 && (
					<div>
						<h2 className={cn(text.h2, colors.text.primary, "mb-4")}>
							Collections ({collections.length})
						</h2>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
							{collections.map((c) => (
								<a
									key={c.id}
									href={`/collections/${c.id}`}
									className="border border-gray-200 p-4 transition-colors hover:border-gray-400"
								>
									<h3 className={cn(text.h3)}>{c.name}</h3>
									{c.description && (
										<p className={cn(text.small, colors.text.secondary, "mt-1")}>
											{c.description}
										</p>
									)}
								</a>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
