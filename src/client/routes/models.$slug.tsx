import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { cn, colors, layout, spacing, text } from "@/client/lib/design";

export const Route = createFileRoute("/models/$slug")({
	component: ModelDetailPage,
});

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
}

function ModelDetailPage() {
	const { slug } = Route.useParams();
	const [model, setModel] = useState<Model | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		const fetchModel = async () => {
			try {
				const response = await fetch(`/api/models/${slug}`);
				if (response.ok) {
					const data = await response.json() as { model: Model };
					setModel(data.model);
				} else {
					setError("Model not found");
				}
			} catch (err) {
				setError("Failed to load model");
			} finally {
				setLoading(false);
			}
		};

		fetchModel();
	}, [slug]);

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

							{model.externalUrl && (
								<a
									href={model.externalUrl}
									target="_blank"
									rel="noopener noreferrer"
									className={cn(
										"mt-6 flex w-full items-center justify-center px-4 py-3",
										colors.bg.inverse,
										colors.text.inverse,
									)}
								>
									View External Link
								</a>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
