import { useSession } from "@client/lib/auth";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
	cn,
	colors,
	focus,
	interactive,
	layout,
	spacing,
	text,
} from "@/client/lib/design";

export const Route = createFileRoute("/models/$id/edit")({
	component: EditModelPage,
});

interface Category {
	id: string;
	name: string;
	slug: string;
}

interface Tag {
	id: string;
	name: string;
	slug: string;
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
	fileUrl: string | null;
	externalUrl: string | null;
	version: string;
	categoryId: string | null;
	isPublished: boolean;
	tags?: Tag[];
	rowsCount: number | null;
	license: string | null;
	language: string | null;
	datasetSize: number | null;
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
	const [modelTags, setModelTags] = useState<Tag[]>([]);
	const [tagsInput, setTagsInput] = useState("");
	const [rowsCount, setRowsCount] = useState("");
	const [license, setLicense] = useState("");
	const [language, setLanguage] = useState("");
	const [datasetSize, setDatasetSize] = useState("");

	// Version management
	const [versions, setVersions] = useState<ModelVersion[]>([]);
	const [newVersion, setNewVersion] = useState("");
	const [newFileUrl, setNewFileUrl] = useState("");
	const [newChangelog, setNewChangelog] = useState("");
	const [uploading, setUploading] = useState(false);

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
					const catData = (await catRes.json()) as { categories: Category[] };
					setCategories(catData.categories);
				}

				// Fetch model
				// First try to get from user's models list
				const modelsRes = await fetch(`/api/users/${session.user.id}/models`);
				if (modelsRes.ok) {
					const modelsData = (await modelsRes.json()) as { models: Model[] };
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
						setRowsCount(model.rowsCount != null ? String(model.rowsCount) : "");
						setLicense(model.license || "");
						setLanguage(model.language || "");
						setDatasetSize(model.datasetSize != null ? String(model.datasetSize) : "");
						if (model.tags) {
							setModelTags(model.tags);
						}
					} else {
						setError("Model not found");
					}
				}
				// Fetch versions
				const verRes = await fetch(`/api/models/${id}/versions`);
				if (verRes.ok) {
					const verData = (await verRes.json()) as { versions: ModelVersion[] };
					setVersions(verData.versions);
				}
			} catch (_err) {
				setError("Failed to load model");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [session, navigate, id]);

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setUploading(true);
		try {
			const formData = new FormData();
			formData.append("file", file);
			const response = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			});
			if (response.ok) {
				const data = (await response.json()) as { url: string };
				setNewFileUrl(data.url);
			}
		} catch (err) {
			console.error("Failed to upload file:", err);
		} finally {
			setUploading(false);
		}
	};

	const handleAddVersion = async () => {
		if (!newVersion.trim()) return;
		try {
			const response = await fetch(`/api/models/${id}/versions`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					version: newVersion.trim(),
					fileUrl: newFileUrl || null,
					changelog: newChangelog || null,
				}),
			});
			if (response.ok) {
				const data = (await response.json()) as { version: ModelVersion };
				setVersions((prev) => [data.version, ...prev]);
				setNewVersion("");
				setNewFileUrl("");
				setNewChangelog("");
			}
		} catch (err) {
			console.error("Failed to add version:", err);
		}
	};

	const handleDeleteVersion = async (versionId: string) => {
		if (!confirm("确定删除这个版本？")) return;
		try {
			const response = await fetch(`/api/models/${id}/versions/${versionId}`, {
				method: "DELETE",
			});
			if (response.ok) {
				setVersions((prev) => prev.filter((v) => v.id !== versionId));
			}
		} catch (err) {
			console.error("Failed to delete version:", err);
		}
	};

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
					rowsCount: rowsCount ? parseInt(rowsCount, 10) : null,
					license: license || null,
					language: language || null,
					datasetSize: datasetSize ? parseInt(datasetSize, 10) : null,
				}),
			});

			if (response.ok) {
				// Save tags
				if (tagsInput.trim()) {
					const newTags = tagsInput
						.split(",")
						.map((t) => t.trim())
						.filter(Boolean);
					if (newTags.length > 0) {
						await fetch(`/api/models/${id}/tags`, {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ tags: newTags }),
						});
					}
				}

				window.location.href = "/dashboard";
			} else {
				const data = (await response.json()) as {
					error?: { message?: string };
				};
				setError(data.error?.message || "Failed to update model");
			}
		} catch (_err) {
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
					<p className={cn(text.base, colors.text.secondary)}>修改模型信息</p>
				</div>

				{error && (
					<div className="mb-6 bg-red-50 p-4">
						<p className={cn(text.small, "text-red-600")}>{error}</p>
					</div>
				)}

				{/* Version Management */}
				<div className="mb-8 max-w-2xl">
					<h2 className={cn(text.h2, colors.text.primary, "mb-4")}>版本管理</h2>

					{/* Existing versions */}
					{versions.length > 0 && (
						<div className="mb-6 space-y-2">
							{versions.map((v) => (
								<div
									key={v.id}
									className="flex items-center justify-between border border-gray-200 p-3"
								>
									<div>
										<span className={cn(text.base, "font-medium")}>
											v{v.version}
										</span>
										<span
											className={cn(text.small, colors.text.secondary, "ml-2")}
										>
											{v.downloadCount} downloads
										</span>
										{v.changelog && (
											<p className={cn(text.small, colors.text.secondary)}>
												{v.changelog}
											</p>
										)}
									</div>
									<button
										type="button"
										onClick={() => handleDeleteVersion(v.id)}
										className={cn(
											"border border-red-200 px-3 py-1 text-red-600 text-sm",
											interactive.base,
										)}
									>
										删除
									</button>
								</div>
							))}
						</div>
					)}

					{/* Add new version */}
					<div className="space-y-3 border border-gray-200 p-4">
						<h3 className={cn(text.h3)}>添加新版本</h3>
						<div>
							<label
								className={cn(text.small, colors.text.secondary, "mb-1 block")}
							>
								版本号 *
							</label>
							<input
								type="text"
								value={newVersion}
								onChange={(e) => setNewVersion(e.target.value)}
								placeholder="1.1.0"
								className={cn("w-full border border-gray-200 px-3 py-2", focus)}
							/>
						</div>
						<div>
							<label
								className={cn(text.small, colors.text.secondary, "mb-1 block")}
							>
								文件上传
							</label>
							<div className="flex items-center gap-2">
								<input
									type="file"
									id="fileUpload"
									onChange={handleFileUpload}
									className="hidden"
								/>
								<label
									htmlFor="fileUpload"
									className={cn(
										"cursor-pointer border border-gray-200 px-3 py-2 text-sm",
										interactive.base,
									)}
								>
									{uploading ? "上传中..." : "选择文件"}
								</label>
								{newFileUrl && (
									<span className={cn(text.small, colors.text.secondary)}>
										已上传
									</span>
								)}
							</div>
						</div>
						<div>
							<label
								className={cn(text.small, colors.text.secondary, "mb-1 block")}
							>
								更新说明
							</label>
							<textarea
								value={newChangelog}
								onChange={(e) => setNewChangelog(e.target.value)}
								placeholder="Bug fixes and performance improvements"
								rows={2}
								className={cn("w-full border border-gray-200 px-3 py-2", focus)}
							/>
						</div>
						<button
							type="button"
							onClick={handleAddVersion}
							disabled={!newVersion.trim()}
							className={cn(
								"px-4 py-2",
								colors.bg.inverse,
								colors.text.inverse,
								interactive.base,
								!newVersion.trim() && "cursor-not-allowed opacity-50",
							)}
						>
							添加版本
						</button>
					</div>
				</div>

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
							描述
						</label>
						<textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="描述你的模型..."
							rows={4}
							className={cn("w-full border border-gray-200 px-3 py-2", focus)}
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
							className={cn("w-full border border-gray-200 px-3 py-2", focus)}
						>
							<option value="ai-model">AI Model</option>
							<option value="3d-model">3D Model</option>
							<option value="design">Design</option>
							<option value="dataset">Dataset</option>
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
							className={cn("w-full border border-gray-200 px-3 py-2", focus)}
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
							className={cn("w-full border border-gray-200 px-3 py-2", focus)}
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
							className={cn("w-full border border-gray-200 px-3 py-2", focus)}
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
							className={cn("w-full border border-gray-200 px-3 py-2", focus)}
						/>
					</div>

					<div>
						<label
							htmlFor="tags"
							className={cn(text.small, colors.text.secondary, "mb-1 block")}
						>
							标签
						</label>
						{modelTags.length > 0 && (
							<div className="mb-2 flex flex-wrap gap-1">
								{modelTags.map((tag) => (
									<span
										key={tag.id}
										className="bg-gray-100 px-2 py-0.5 text-gray-600 text-xs"
									>
										{tag.name}
									</span>
								))}
							</div>
						)}
						<input
							id="tags"
							type="text"
							value={tagsInput}
							onChange={(e) => setTagsInput(e.target.value)}
							placeholder="text-generation, image-classification (逗号分隔)"
							className={cn("w-full border border-gray-200 px-3 py-2", focus)}
						/>
					</div>

					{type === "dataset" && (
						<>
							<div>
								<label className={cn(text.small, colors.text.secondary, "mb-1 block")}>行数</label>
								<input type="number" value={rowsCount} onChange={(e) => setRowsCount(e.target.value)} placeholder="10000" className={cn("w-full border border-gray-200 px-3 py-2", focus)} />
							</div>
							<div>
								<label className={cn(text.small, colors.text.secondary, "mb-1 block")}>许可</label>
								<input type="text" value={license} onChange={(e) => setLicense(e.target.value)} placeholder="MIT, Apache-2.0" className={cn("w-full border border-gray-200 px-3 py-2", focus)} />
							</div>
							<div>
								<label className={cn(text.small, colors.text.secondary, "mb-1 block")}>语言</label>
								<input type="text" value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="en, zh" className={cn("w-full border border-gray-200 px-3 py-2", focus)} />
							</div>
							<div>
								<label className={cn(text.small, colors.text.secondary, "mb-1 block")}>大小 (bytes)</label>
								<input type="number" value={datasetSize} onChange={(e) => setDatasetSize(e.target.value)} placeholder="1048576" className={cn("w-full border border-gray-200 px-3 py-2", focus)} />
							</div>
						</>
					)}

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
							className={cn("w-full border border-gray-200 px-3 py-2", focus)}
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
								saving && "cursor-not-allowed opacity-50",
							)}
						>
							{saving ? "保存中..." : "保存修改"}
						</button>
						<a
							href="/dashboard"
							className={cn(
								"border border-gray-200 px-6 py-3",
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
