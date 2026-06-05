import { createFileRoute } from "@tanstack/react-router";
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

export const Route = createFileRoute("/models/new")({
	component: CreateModelPage,
});

function CreateModelPage() {
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [description, setDescription] = useState("");
	const [type, setType] = useState("ai-model");
	const [imageUrl, setImageUrl] = useState("");
	const [externalUrl, setExternalUrl] = useState("");
	const [tagsInput, setTagsInput] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleCreate = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			const response = await fetch("/api/models", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name,
					slug,
					description: description || null,
					type,
					imageUrl: imageUrl || null,
					externalUrl: externalUrl || null,
				}),
			});

			const responseText = await response.text();

			if (response.ok) {
				const data = JSON.parse(responseText);
				const modelId = data.model.slug;

				// Add tags if any
				if (tagsInput.trim()) {
					const tags = tagsInput
						.split(",")
						.map((t) => t.trim())
						.filter(Boolean);
					if (tags.length > 0) {
						await fetch(`/api/models/${data.model.id}/tags`, {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ tags }),
						});
					}
				}

				window.location.href = `/models/${modelId}`;
			} else {
				try {
					const data = JSON.parse(responseText);
					setError(data.error?.message || `Error ${response.status}`);
				} catch {
					setError(
						`Error ${response.status}: ${responseText.substring(0, 100)}`,
					);
				}
			}
		} catch (err) {
			setError(`Network error: ${err}`);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className={spacing.page}>
			<div className={layout.container}>
				<div className="mb-8">
					<h1 className={cn(text.h1, colors.text.primary)}>Create Model</h1>
					<p className={cn(text.base, colors.text.secondary)}>
						Add a new model to ModelHive
					</p>
				</div>

				{error && (
					<div className="mb-6 bg-red-50 p-4">
						<p className={cn(text.small, "text-red-600")}>{error}</p>
					</div>
				)}

				<form
					onSubmit={handleCreate}
					action="javascript:void(0)"
					className="max-w-2xl space-y-6"
				>
					<div>
						<label
							htmlFor="name"
							className={cn(text.small, colors.text.secondary, "mb-1 block")}
						>
							Model Name *
						</label>
						<input
							id="name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="GPT-4o"
							className={cn("w-full border border-gray-200 px-3 py-2", focus)}
							required
						/>
					</div>

					<div>
						<label
							htmlFor="slug"
							className={cn(text.small, colors.text.secondary, "mb-1 block")}
						>
							Slug *
						</label>
						<input
							id="slug"
							type="text"
							value={slug}
							onChange={(e) => setSlug(e.target.value)}
							placeholder="gpt-4o"
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
							placeholder="Describe your model..."
							rows={4}
							className={cn("w-full border border-gray-200 px-3 py-2", focus)}
						/>
					</div>

					<div>
						<label
							htmlFor="type"
							className={cn(text.small, colors.text.secondary, "mb-1 block")}
						>
							Type
						</label>
						<select
							id="type"
							value={type}
							onChange={(e) => setType(e.target.value)}
							className={cn("w-full border border-gray-200 px-3 py-2", focus)}
						>
							<option value="ai-model">AI Model</option>
							<option value="3d-model">3D Model</option>
							<option value="design">Design</option>
							<option value="other">Other</option>
						</select>
					</div>

					<div>
						<label
							htmlFor="imageUrl"
							className={cn(text.small, colors.text.secondary, "mb-1 block")}
						>
							Image URL
						</label>
						<input
							id="imageUrl"
							type="url"
							value={imageUrl}
							onChange={(e) => setImageUrl(e.target.value)}
							placeholder="https://example.com/image.jpg"
							className={cn("w-full border border-gray-200 px-3 py-2", focus)}
						/>
					</div>

					<div>
						<label
							htmlFor="tags"
							className={cn(text.small, colors.text.secondary, "mb-1 block")}
						>
							Tags
						</label>
						<input
							id="tags"
							type="text"
							value={tagsInput}
							onChange={(e) => setTagsInput(e.target.value)}
							placeholder="text-generation, image-classification (comma separated)"
							className={cn("w-full border border-gray-200 px-3 py-2", focus)}
						/>
					</div>

					<div>
						<label
							htmlFor="externalUrl"
							className={cn(text.small, colors.text.secondary, "mb-1 block")}
						>
							External URL
						</label>
						<input
							id="externalUrl"
							type="url"
							value={externalUrl}
							onChange={(e) => setExternalUrl(e.target.value)}
							placeholder="https://example.com"
							className={cn("w-full border border-gray-200 px-3 py-2", focus)}
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						className={cn(
							"flex items-center px-6 py-3",
							colors.bg.inverse,
							colors.text.inverse,
							interactive.base,
							focus,
							loading && "cursor-not-allowed opacity-50",
						)}
					>
						{loading ? "Creating..." : "Create Model"}
					</button>
				</form>
			</div>
		</div>
	);
}
