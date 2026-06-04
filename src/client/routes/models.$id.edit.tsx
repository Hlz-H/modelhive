import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSession } from "@client/lib/auth";
import { cn, colors, focus, interactive, layout, spacing, text } from "@/client/lib/design";

export const Route = createFileRoute("/models/$id/edit")({
	component: EditModelPage,
});

interface Category {
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
	fileUrl: string | null;
	externalUrl: string | null;
	version: string;
	categoryId: string | null;
	isPublished: boolean;
}

function EditModelPage() {
	const { id } = Route.useParams();
	const { data: session, isPending } = useSession();
	const navigate = useNavigate();
	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	// Form fields
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [description, setDescription] = useState("");
	const [type, setType] = useState("ai-model");
	const [imageUrl, setImageUrl] = useState("");
	const [fileUrl, setFileUrl] = useState("");
	const [externalUrl, setExternalUrl] = useState("");
	const [version, setVersion] = useState("1.0.0");
	const [categoryId, setCategoryId] = useState("");
	const [isPublished, setIsPublished] = useState(true);

	useEffect(() => {
		// 等待 session 加载完成
		if (isPending) return;
		
		if (!session) {
			navigate({ to: "/login" });
			return;
		}

		const fetchData = async () => {
			try {
				// Fetch categories
				const catRes = await fetch("/api/categories");
				if (catRes.ok) {
					const catData = await catRes.json() as { categories: Category[] };
					setCategories(catData.categories);
				}

				// Fetch model by ID (using admin endpoint or user's models)
				// For now, we'll use the user's models list
				const modelsRes = await fetch(`/api/users/${session.user.id}/models`);
				if (modelsRes.ok) {
					const modelsData = await modelsRes.json() as { models: Model[] };
					const model = modelsData.models.find((m: Model) => m.id === id);
					if (model) {
						setName(model.name);
						setSlug(model.slug);
						setDescription(model.description || "");
						setType(model.type);
						setImageUrl(model.imageUrl || "");
						setFileUrl(model.fileUrl || "");
						setExternalUrl(model.externalUrl || "");
						setVersion(model.version || "1.0.0");
						setCategoryId(model.categoryId || "");
						setIsPublished(model.isPublished);
					} else {
						setError("Model not found");
					}
				}
			} catch (err) {
				setError("Failed to load model");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [session, navigate, id]);

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		setError("");

		try {
			const response = await fetch(`/api/models/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					name,
					slug,
					description: description || null,
					type,
					imageUrl: imageUrl || null,
					fileUrl: fileUrl || null,
					externalUrl: externalUrl || null,
					version,
					categoryId: categoryId || null,
					isPublished,
				}),
			});

			if (response.ok) {
				window.location.href = "/dashboard";
			} else {
				const data = await response.json() as { error?: { message?: string } };
				setError(data.error?.message || "Failed to update model");
			}
		} catch (err) {
			setError("Network error");
		} finally {
			setSaving(false);
		}
	};

	if (!session) {
		return null;
	}

	if (loading) {
		return (
			<div className={spacing.page}>
				<div className={layout.container}>
					<p className={text.base}>Loading...</p>
				</div>
			</div>
		);
	}

	return (
		<div className={spacing.page}>
			<div className={layout.container}>
				<div className="mb-8">
					<h1 className={cn(text.h1, colors.text.primary)}>编辑模型</h1>
					<p className={cn(text.base, colors.text.secondary)}>
						修改模型信息
					</p>
				</div>

				{error && (
					<div className="mb-6 bg-red-50 p-4">
						<p className={cn(text.small, "text-red-600")}>{error}</p>
					</div>
				)}

				<form onSubmit={handleSave} className="max-w-2xl space-y-6">
					<div>
						<label
							htmlFor="name"
							className={cn(text.small, colors.text.secondary, "mb-1 block")}
						>
							模型名称 *
						</label>
						<input
							id="name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="GPT-4o"
							className={cn(
								"w-full border border-gray-200 px-3 py-2",
								focus,
							)}
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
							className={cn(
								"w-full border border-gray-200 px-3 py-2",
								focus,
							)}
							required
						/>
					</div>

					<div>
						<label
							htmlFor="description"
							className={cn(text.small, colors.text.secondary, "mb-1 block")}
						>
							描述
						</label>
						<textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="描述你的模型..."
							rows={4}
							className={cn(
								"w-full border border-gray-200 px-3 py-2",
								focus,
							)}
						/>
					</div>

					<div>
						<label
							htmlFor="type"
							className={cn(text.small, colors.text.secondary, "mb-1 block")}
						>
							类型
						</label>
						<select
							id="type"
							value={type}
							onChange={(e) => setType(e.target.value)}
							className={cn(
								"w-full border border-gray-200 px-3 py-2",
								focus,
							)}
						>
							<option value="ai-model">AI Model</option>
							<option value="3d-model">3D Model</option>
							<option value="design">Design</option>
							<option value="other">Other</option>
						</select>
					</div>

					<div>
						<label
							htmlFor="category"
							className={cn(text.small, colors.text.secondary, "mb-1 block")}
						>
							分类
						</label>
						<select
							id="category"
							value={categoryId}
							onChange={(e) => setCategoryId(e.target.value)}
							className={cn(
								"w-full border border-gray-200 px-3 py-2",
								focus,
							)}
						>
							<option value="">无分类</option>
							{categories.map((cat) => (
								<option key={cat.id} value={cat.id}>
									{cat.name}
								</option>
							))}
						</select>
					</div>

					<div>
						<label
							htmlFor="imageUrl"
							className={cn(text.small, colors.text.secondary, "mb-1 block")}
						>
							封面图 URL
						</label>
						<input
							id="imageUrl"
							type="url"
							value={imageUrl}
							onChange={(e) => setImageUrl(e.target.value)}
							placeholder="https://example.com/image.jpg"
							className={cn(
								"w-full border border-gray-200 px-3 py-2",
								focus,
							)}
						/>
					</div>

					<div>
						<label
							htmlFor="fileUrl"
							className={cn(text.small, colors.text.secondary, "mb-1 block")}
						>
							文件 URL
						</label>
						<input
							id="fileUrl"
							type="url"
							value={fileUrl}
							onChange={(e) => setFileUrl(e.target.value)}
							placeholder="https://example.com/model.bin"
							className={cn(
								"w-full border border-gray-200 px-3 py-2",
								focus,
							)}
						/>
					</div>

					<div>
						<label
							htmlFor="externalUrl"
							className={cn(text.small, colors.text.secondary, "mb-1 block")}
						>
							外部链接
						</label>
						<input
							id="externalUrl"
							type="url"
							value={externalUrl}
							onChange={(e) => setExternalUrl(e.target.value)}
							placeholder="https://example.com"
							className={cn(
								"w-full border border-gray-200 px-3 py-2",
								focus,
							)}
						/>
					</div>

					<div>
						<label
							htmlFor="version"
							className={cn(text.small, colors.text.secondary, "mb-1 block")}
						>
							版本
						</label>
						<input
							id="version"
							type="text"
							value={version}
							onChange={(e) => setVersion(e.target.value)}
							placeholder="1.0.0"
							className={cn(
								"w-full border border-gray-200 px-3 py-2",
								focus,
							)}
						/>
					</div>

					<div className="flex items-center gap-2">
						<input
							id="isPublished"
							type="checkbox"
							checked={isPublished}
							onChange={(e) => setIsPublished(e.target.checked)}
							className="h-4 w-4"
						/>
						<label
							htmlFor="isPublished"
							className={cn(text.small, colors.text.secondary)}
						>
							发布（公开可见）
						</label>
					</div>

					<div className="flex gap-4">
						<button
							type="submit"
							disabled={saving}
							className={cn(
								"px-6 py-3",
								colors.bg.inverse,
								colors.text.inverse,
								interactive.base,
								focus,
								saving && "opacity-50 cursor-not-allowed",
							)}
						>
							{saving ? "保存中..." : "保存修改"}
						</button>
						<a
							href="/dashboard"
							className={cn(
								"px-6 py-3 border border-gray-200",
								interactive.base,
								focus,
							)}
						>
							取消
						</a>
					</div>
				</form>
			</div>
		</div>
	);
}
