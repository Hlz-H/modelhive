import { useSession } from "@client/lib/auth";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
	cn,
	colors,
	focus,
	interactive,
	layout,
	spacing,
	text,
} from "@/client/lib/design";

export const Route = createFileRoute("/models/$slug")({
	component: ModelDetailPage,
});

interface Tag {
	id: string;
	name: string;
	slug: string;
}

interface Comment {
	id: string;
	modelId: string;
	userId: string;
	content: string;
	createdAt: string;
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
	userId: string;
	rowsCount: number | null;
	license: string | null;
	language: string | null;
	datasetSize: number | null;
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
				const data = (await modelRes.json()) as { model: Model };
				setModel(data.model);
			} else {
				setError("Model not found");
			}
			if (versionsRes.ok) {
				const data = (await versionsRes.json()) as { versions: ModelVersion[] };
				setVersions(data.versions);
			}
		} catch (_err) {
			setError("Failed to load model");
		} finally {
			setLoading(false);
		}
	};

	const [showCollectionPicker, setShowCollectionPicker] = useState(false);
	const [collections, setCollections] = useState<{ id: string; name: string; isPublic: boolean }[]>([]);
	const [isFollowing, setIsFollowing] = useState(false);
	const [followLoading, setFollowLoading] = useState(false);
	const [comments, setComments] = useState<Comment[]>([]);
	const [commentInput, setCommentInput] = useState("");
	const [commentLoading, setCommentLoading] = useState(false);
	const { data: session } = useSession();
	const collectionPickerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (showCollectionPicker && session) {
			fetch("/api/users/me/collections")
				.then(
					(r) =>
						r.json() as Promise<{
							collections?: { id: string; name: string; isPublic: boolean }[];
						}>,
				)
				.then((data) => setCollections(data.collections || []))
				.catch(() => {});
		}
	}, [showCollectionPicker, session]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				collectionPickerRef.current &&
				!collectionPickerRef.current.contains(event.target as Node)
			) {
				setShowCollectionPicker(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleAddToCollection = async (collectionId: string) => {
		try {
			const response = await fetch(`/api/collections/${collectionId}/items`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ modelId: model!.id }),
			});
			if (response.ok) {
				setShowCollectionPicker(false);
			} else {
				const data = (await response.json()) as {
					error?: { message?: string };
				};
				alert(data.error?.message || "Failed to add to collection");
			}
		} catch {
			alert("Network error");
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

	const fetchComments = async () => {
		if (!model?.id) return;
		try {
			const response = await fetch(`/api/models/${model.id}/comments`);
			if (response.ok) {
				const data = (await response.json()) as { comments: Comment[] };
				setComments(data.comments);
			}
		} catch {}
	};

	const handlePostComment = async () => {
		if (!model || !commentInput.trim() || commentLoading) return;
		setCommentLoading(true);
		try {
			const response = await fetch(`/api/models/${model.id}/comments`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ content: commentInput.trim() }),
			});
			if (response.ok) {
				setCommentInput("");
				fetchComments();
			}
		} catch {} finally {
			setCommentLoading(false);
		}
	};

	const handleDeleteComment = async (commentId: string) => {
		if (!model || !confirm("Delete this comment?")) return;
		try {
			const response = await fetch(
				`/api/models/${model.id}/comments/${commentId}`,
				{ method: "DELETE" },
			);
			if (response.ok) {
				setComments((prev) => prev.filter((c) => c.id !== commentId));
			}
		} catch {}
	};

	useEffect(() => {
		fetchModel();
	}, [slug]);

	useEffect(() => {
		if (model?.id) fetchComments();
	}, [model?.id]);

	useEffect(() => {
		const checkFollow = async () => {
			if (!session || !model?.userId) return;
			try {
				const response = await fetch(`/api/users/${model.userId}/follow-check`);
				if (response.ok) {
					const data = (await response.json()) as { isFollowing: boolean };
					setIsFollowing(data.isFollowing);
				}
			} catch {}
		};
		checkFollow();
	}, [session, model?.userId]);

	const handleFollowToggle = async () => {
		if (!model || followLoading) return;
		setFollowLoading(true);
		try {
			const response = await fetch(`/api/users/${model.userId}/follow`, {
				method: "POST",
			});
			if (response.ok) {
				const data = (await response.json()) as { following: boolean };
				setIsFollowing(data.following);
			}
		} catch {} finally {
			setFollowLoading(false);
		}
	};

	const handleFavorite = async () => {
		if (!model) return;
		try {
			const response = await fetch(`/api/models/${model.id}/favorite`, {
				method: "POST",
			});
			if (response.ok) {
				const data = (await response.json()) as { favorited: boolean };
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

				<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
					<div className="lg:col-span-2">
						{model.imageUrl && (
							<img
								src={model.imageUrl}
								alt={model.name}
								className="mb-6 w-full"
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
											className="bg-gray-100 px-3 py-1 text-gray-700 text-sm"
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
								{model.type === "dataset" && (
									<>
										{model.rowsCount != null && (
											<div>
												<dt className={text.small}>Rows</dt>
												<dd className={text.base}>
													{model.rowsCount.toLocaleString()}
												</dd>
											</div>
										)}
										{model.datasetSize != null && (
											<div>
												<dt className={text.small}>Size</dt>
												<dd className={text.base}>
													{model.datasetSize >= 1073741824
														? `${(model.datasetSize / 1073741824).toFixed(1)} GB`
														: model.datasetSize >= 1048576
															? `${(model.datasetSize / 1048576).toFixed(1)} MB`
															: `${(model.datasetSize / 1024).toFixed(1)} KB`}
												</dd>
											</div>
										)}
										{model.license && (
											<div>
												<dt className={text.small}>License</dt>
												<dd className={text.base}>{model.license}</dd>
											</div>
										)}
										{model.language && (
											<div>
												<dt className={text.small}>Language</dt>
												<dd className={text.base}>{model.language}</dd>
											</div>
										)}
									</>
								)}
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
								<div>
									<dt className={text.small}>Creator</dt>
									<dd className={text.base}>
										<a
											href={`/users/${model.userId}`}
											className={cn("underline", colors.text.secondary)}
										>
											View Profile
										</a>
									</dd>
								</div>
							</dl>

							{session && session.user.id !== model.userId && (
								<button
									type="button"
									onClick={handleFollowToggle}
									disabled={followLoading}
									className={cn(
										"mt-4 flex w-full items-center justify-center px-4 py-3 border text-sm",
										isFollowing
											? "border-gray-200"
											: "border-gray-800 bg-gray-800 text-white",
										interactive.base,
										followLoading && "opacity-50 cursor-not-allowed",
									)}
								>
									{isFollowing ? "Following" : "Follow"}
								</button>
							)}

							{/* Favorite button */}
							<button
								type="button"
								onClick={handleFavorite}
								className={cn(
									"mt-4 flex w-full items-center justify-center gap-2 border border-gray-200 px-4 py-3",
									interactive.base,
									focus,
								)}
							>
								<span> {model.favoriteCount > 0 ? "❤️" : "🤍"}</span>
								<span>
									{model.favoriteCount}{" "}
									{model.favoriteCount === 1 ? "Favorite" : "Favorites"}
								</span>
							</button>

							{session && (
								<div className="relative" ref={collectionPickerRef}>
									<button
										type="button"
										onClick={() =>
											setShowCollectionPicker(!showCollectionPicker)
										}
										className={cn(
											"mt-4 flex w-full items-center justify-center gap-2 border border-gray-200 px-4 py-3",
											interactive.base,
											focus,
										)}
									>
										+ Add to Collection
									</button>

									{showCollectionPicker && (
										<div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto border border-gray-200 bg-white shadow-lg">
											{collections.length === 0 ? (
												<div className="p-3 text-center text-gray-500 text-sm">
													<p className="mb-2">No collections yet</p>
													<a
														href="/collections/new"
														className={cn("underline", colors.text.secondary)}
													>
														Create one
													</a>
												</div>
											) : (
												collections.map((c) => (
													<button
														key={c.id}
														type="button"
														onClick={() => handleAddToCollection(c.id)}
														className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
													>
														{c.name}
													</button>
												))
											)}
										</div>
									)}
								</div>
							)}

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
							<div className="mt-6 border border-gray-200 p-6">
								<h3 className={cn(text.h3, "mb-4")}>Versions</h3>
								<div className="space-y-3">
									{versions.map((v) => (
										<div
											key={v.id}
											className="border-gray-100 border-b pb-3 last:border-b-0 last:pb-0"
										>
											<div className="mb-1 flex items-center justify-between">
												<span className={cn(text.base, "font-medium")}>
													v{v.version}
												</span>
												<span className={cn(text.small, colors.text.secondary)}>
													{v.downloadCount} downloads
												</span>
											</div>
											{v.changelog && (
												<p
													className={cn(
														text.small,
														colors.text.secondary,
														"mb-2",
													)}
												>
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
														"inline-flex items-center gap-1 border border-gray-200 px-3 py-1 text-sm",
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
				{/* Comments Section */}
				<div className="mt-12 border-t border-gray-200 pt-8">
					<h2 className={cn(text.h2, colors.text.primary, "mb-6")}>
						Comments ({comments.length})
					</h2>

					{session ? (
						<div className="mb-8 flex gap-3">
							<textarea
								value={commentInput}
								onChange={(e) => setCommentInput(e.target.value)}
								placeholder="Share your thoughts..."
								rows={3}
								className={cn(
									"flex-1 border border-gray-200 px-3 py-2 text-sm",
									focus,
								)}
							/>
							<button
								type="button"
								onClick={handlePostComment}
								disabled={commentLoading || !commentInput.trim()}
								className={cn(
									"self-end px-6 py-2 text-sm",
									colors.bg.inverse,
									colors.text.inverse,
									interactive.base,
									(commentLoading || !commentInput.trim()) &&
										"cursor-not-allowed opacity-50",
								)}
							>
								{commentLoading ? "Posting..." : "Post"}
							</button>
						</div>
					) : (
						<p className={cn(text.small, colors.text.secondary, "mb-8")}>
							<a href="/login" className="underline">
								Log in
							</a>{" "}
							to leave a comment
						</p>
					)}

					{comments.length === 0 ? (
						<p className={cn(text.base, colors.text.secondary)}>
							No comments yet. Be the first to share your thoughts!
						</p>
					) : (
						<div className="space-y-4">
							{comments.map((comment) => (
								<div
									key={comment.id}
									className="border border-gray-200 p-4"
								>
									<div className="mb-1 flex items-center justify-between">
										<span className={cn(text.small, colors.text.secondary)}>
											User {comment.userId.substring(0, 8)}
										</span>
										<div className="flex items-center gap-2">
											<span className={cn(text.small, colors.text.secondary)}>
												{new Date(comment.createdAt).toLocaleDateString()}
											</span>
											{session?.user?.id === comment.userId && (
												<button
													type="button"
													onClick={() => handleDeleteComment(comment.id)}
													className={cn(
														"text-xs text-red-500 hover:text-red-700",
													)}
												>
													Delete
												</button>
											)}
										</div>
									</div>
									<p className={cn(text.base, "whitespace-pre-wrap")}>
										{comment.content}
									</p>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
