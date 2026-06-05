import { useSession } from "@client/lib/auth";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
	cn,
	colors,
	focus,
	interactive,
	layout,
	spacing,
	text,
} from "@/client/lib/design";

export const Route = createFileRoute("/collections/new")({
	component: CreateCollectionPage,
});

function CreateCollectionPage() {
	const { data: session, isPending } = useSession();
	const navigate = useNavigate();
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [isPublic, setIsPublic] = useState(true);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	if (isPending) return null;
	if (!session) {
		navigate({ to: "/login" });
		return null;
	}

	const handleCreate = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			const response = await fetch("/api/collections", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name,
					description: description || null,
					isPublic,
				}),
			});

			if (response.ok) {
				const data = (await response.json()) as { collection: { id: string } };
				window.location.href = `/collections/${data.collection.id}`;
			} else {
				const data = (await response.json()) as {
					error?: { message?: string };
				};
				setError(data.error?.message || "Failed to create collection");
			}
		} catch (_err) {
			setError("Network error");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className={spacing.page}>
			<div className={layout.container}>
				<div className="mb-8">
					<h1 className={cn(text.h1, colors.text.primary)}>
						Create Collection
					</h1>
					<p className={cn(text.base, colors.text.secondary)}>
						Group your favorite models into collections
					</p>
				</div>

				{error && (
					<div className="mb-6 bg-red-50 p-4">
						<p className={cn(text.small, "text-red-600")}>{error}</p>
					</div>
				)}

				<form onSubmit={handleCreate} className="max-w-2xl space-y-6">
					<div>
						<label
							htmlFor="name"
							className={cn(text.small, colors.text.secondary, "mb-1 block")}
						>
							Name *
						</label>
						<input
							id="name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Best Text-to-Image Models"
							className={cn("w-full border border-gray-200 px-3 py-2", focus)}
							required
						/>
					</div>

					<div>
						<label
							htmlFor="description"
							className={cn(text.small, colors.text.secondary, "mb-1 block")}
						>
							Description
						</label>
						<textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="A curated collection of the best text-to-image models..."
							rows={3}
							className={cn("w-full border border-gray-200 px-3 py-2", focus)}
						/>
					</div>

					<div className="flex items-center gap-2">
						<input
							id="isPublic"
							type="checkbox"
							checked={isPublic}
							onChange={(e) => setIsPublic(e.target.checked)}
							className="h-4 w-4"
						/>
						<label
							htmlFor="isPublic"
							className={cn(text.small, colors.text.secondary)}
						>
							Public (visible to everyone)
						</label>
					</div>

					<button
						type="submit"
						disabled={loading}
						className={cn(
							"px-6 py-3",
							colors.bg.inverse,
							colors.text.inverse,
							interactive.base,
							loading && "cursor-not-allowed opacity-50",
						)}
					>
						{loading ? "Creating..." : "Create Collection"}
					</button>
				</form>
			</div>
		</div>
	);
}
