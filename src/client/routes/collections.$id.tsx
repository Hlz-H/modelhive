import { useSession } from "@client/lib/auth";
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

export const Route = createFileRoute("/collections/$id")({
	component: CollectionDetailPage,
});

interface ModelItem {
	id: string;
	modelId: string;
	note: string | null;
	createdAt: string;
}

interface Collection {
	id: string;
	name: string;
	description: string | null;
	userId: string;
	isPublic: boolean;
	createdAt: string;
}

function CollectionDetailPage() {
	const { id } = Route.useParams();
	const { data: session } = useSession();
	const [collection, setCollection] = useState<Collection | null>(null);
	const [items, setItems] = useState<ModelItem[]>([]);
	const [models, setModels] = useState<
		Record<
			string,
			{ name: string; slug: string; type: string; imageUrl: string | null }
		>
	>({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		const fetchCollection = async () => {
			try {
				const response = await fetch(`/api/collections/${id}`);
				if (response.ok) {
					const data = (await response.json()) as {
						collection: Collection;
						items: ModelItem[];
					};
					setCollection(data.collection);
					setItems(data.items);

					// Fetch model details for each item
					const modelData: Record<string, any> = {};
					await Promise.all(
						data.items.map(async (item) => {
							try {
								const res = await fetch(`/api/models/${item.modelId}`);
								if (res.ok) {
									const model = (await res.json()) as { model: any };
									modelData[item.modelId] = model.model;
								}
							} catch {}
						}),
					);
					setModels(modelData);
				} else {
					setError("Collection not found");
				}
			} catch {
				setError("Failed to load collection");
			} finally {
				setLoading(false);
			}
		};
		fetchCollection();
	}, [id]);

	const isOwner = session?.user?.id === collection?.userId;

	const handleRemoveItem = async (itemId: string) => {
		if (!confirm("Remove this model from the collection?")) return;
		try {
			const response = await fetch(`/api/collections/${id}/items/${itemId}`, {
				method: "DELETE",
			});
			if (response.ok) {
				setItems((prev) => prev.filter((i) => i.id !== itemId));
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

	if (error || !collection) {
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
					<h1 className={cn(text.h1, colors.text.primary)}>
						{collection.name}
					</h1>
					{collection.description && (
						<p className={cn(text.base, colors.text.secondary, "mt-2")}>
							{collection.description}
						</p>
					)}
					<p className={cn(text.small, colors.text.secondary, "mt-1")}>
						{items.length} models • {collection.isPublic ? "Public" : "Private"}{" "}
						• Created {new Date(collection.createdAt).toLocaleDateString()}
					</p>
				</div>

				{items.length === 0 ? (
					<div className="py-12 text-center">
						<p className={cn(text.h3, colors.text.secondary, "mb-4")}>
							No models yet
						</p>
						<p className={cn(text.base, colors.text.secondary)}>
							Browse models and add them to this collection.
						</p>
					</div>
				) : (
					<div className="space-y-3">
						{items.map((item) => {
							const model = models[item.modelId];
							if (!model) return null;
							return (
								<div
									key={item.id}
									className="flex items-center justify-between border border-gray-200 p-4"
								>
									<a
										href={`/models/${model.slug}`}
										className="flex flex-1 items-center gap-4"
									>
										{model.imageUrl && (
											<img
												src={model.imageUrl}
												alt={model.name}
												className="h-12 w-12 object-cover"
											/>
										)}
										<div>
											<h3 className={cn(text.h3, colors.text.primary)}>
												{model.name}
											</h3>
											<p className={cn(text.small, colors.text.secondary)}>
												{model.type}
											</p>
											{item.note && (
												<p className={cn(text.small, "mt-1 text-gray-500")}>
													{item.note}
												</p>
											)}
										</div>
									</a>
									{isOwner && (
										<button
											type="button"
											onClick={() => handleRemoveItem(item.id)}
											className={cn(
												"border border-red-200 px-3 py-1 text-red-600 text-sm",
												interactive.base,
											)}
										>
											Remove
										</button>
									)}
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
