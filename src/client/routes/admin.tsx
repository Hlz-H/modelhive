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

export const Route = createFileRoute("/admin")({
	component: AdminPage,
});

interface User {
	id: string;
	name: string;
	email: string;
	role: string;
	createdAt: string;
}

interface AdminModel {
	id: string;
	name: string;
	slug: string;
	userId: string;
	type: string;
	isPublished: boolean;
	createdAt: string;
}

interface Tag {
	id: string;
	name: string;
	slug: string;
}

type Tab = "models" | "users" | "tags";

function AdminPage() {
	const { data: session, isPending } = useSession();
	const navigate = useNavigate();
	const [tab, setTab] = useState<Tab>("models");

	const [models, setModels] = useState<AdminModel[]>([]);
	const [users, setUsers] = useState<User[]>([]);
	const [tags, setTags] = useState<Tag[]>([]);
	const [loading, setLoading] = useState(true);

	const [newTagName, setNewTagName] = useState("");
	const [newTagSlug, setNewTagSlug] = useState("");

	useEffect(() => {
		if (isPending) return;
		if (!session) {
			navigate({ to: "/login" });
			return;
		}
	}, [session, isPending, navigate]);

	useEffect(() => {
		if (!session) return;
		const fetchData = async () => {
			setLoading(true);
			try {
				const [modelsRes, usersRes, tagsRes] = await Promise.all([
					fetch("/api/admin/models"),
					fetch("/api/admin/users"),
					fetch("/api/tags"),
				]);
				if (modelsRes.ok) {
					const data = (await modelsRes.json()) as { models: AdminModel[] };
					setModels(data.models);
				}
				if (usersRes.ok) {
					const data = (await usersRes.json()) as { users: User[] };
					setUsers(data.users);
				}
				if (tagsRes.ok) {
					const data = (await tagsRes.json()) as { tags: Tag[] };
					setTags(data.tags);
				}
			} catch {} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, [session]);

	const handleTogglePublished = async (modelId: string, current: boolean) => {
		try {
			const response = await fetch(`/api/admin/models/${modelId}/status`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ isPublished: !current }),
			});
			if (response.ok) {
				setModels((prev) =>
					prev.map((m) =>
						m.id === modelId ? { ...m, isPublished: !current } : m,
					),
				);
			}
		} catch {}
	};

	const handleUpdateRole = async (userId: string, role: string) => {
		try {
			const response = await fetch(`/api/admin/users/${userId}/role`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ role }),
			});
			if (response.ok) {
				setUsers((prev) =>
					prev.map((u) => (u.id === userId ? { ...u, role } : u)),
				);
			}
		} catch {}
	};

	const handleCreateTag = async () => {
		if (!newTagName.trim() || !newTagSlug.trim()) return;
		try {
			const response = await fetch("/api/tags", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: newTagName.trim(),
					slug: newTagSlug.trim(),
				}),
			});
			if (response.ok) {
				const data = (await response.json()) as { tag: Tag };
				setTags((prev) => [...prev, data.tag]);
				setNewTagName("");
				setNewTagSlug("");
			}
		} catch {}
	};

	const handleDeleteTag = async (tagId: string) => {
		if (!confirm("Delete this tag?")) return;
		try {
			const response = await fetch(`/api/tags/${tagId}`, {
				method: "DELETE",
			});
			if (response.ok) {
				setTags((prev) => prev.filter((t) => t.id !== tagId));
			}
		} catch {}
	};

	if (isPending) return null;

	return (
		<div className={spacing.page}>
			<div className={layout.container}>
				<h1 className={cn(text.h1, colors.text.primary, "mb-8")}>Admin</h1>

				{/* Tabs */}
				<div className="mb-6 flex gap-2 border-b border-gray-200">
					{(["models", "users", "tags"] as Tab[]).map((t) => (
						<button
							key={t}
							type="button"
							onClick={() => setTab(t)}
							className={cn(
								"px-4 py-2 text-sm capitalize transition-colors",
								tab === t
									? "border-b-2 border-gray-800 font-medium"
									: "text-gray-500 hover:text-gray-800",
							)}
						>
							{t}
						</button>
					))}
				</div>

				{loading ? (
					<p className={text.base}>Loading...</p>
				) : tab === "models" ? (
					<div className="space-y-2">
						{models.map((model) => (
							<div
								key={model.id}
								className="flex items-center justify-between border border-gray-200 p-4"
							>
								<div>
									<a
										href={`/models/${model.slug}`}
										className={cn(text.h3, "hover:underline")}
									>
										{model.name}
									</a>
									<p className={cn(text.small, colors.text.secondary)}>
										{model.type} • {model.userId.substring(0, 8)} •{" "}
										{new Date(model.createdAt).toLocaleDateString()}
									</p>
								</div>
								<button
									type="button"
									onClick={() =>
										handleTogglePublished(model.id, model.isPublished)
									}
									className={cn(
										"px-3 py-1 text-sm border",
										model.isPublished
											? "border-green-200 text-green-700"
											: "border-red-200 text-red-600",
										interactive.base,
									)}
								>
									{model.isPublished ? "Published" : "Unpublished"}
								</button>
							</div>
						))}
					</div>
				) : tab === "users" ? (
					<div className="space-y-2">
						{users.map((user) => (
							<div
								key={user.id}
								className="flex items-center justify-between border border-gray-200 p-4"
							>
								<div>
									<p className={cn(text.h3)}>{user.name}</p>
									<p className={cn(text.small, colors.text.secondary)}>
										{user.email} • {user.id.substring(0, 8)}
									</p>
								</div>
								<div className="flex items-center gap-2">
									<span className={cn(text.small, colors.text.secondary)}>
										{user.role}
									</span>
									<select
										value={user.role}
										onChange={(e) => handleUpdateRole(user.id, e.target.value)}
										className={cn(
											"border border-gray-200 px-2 py-1 text-sm",
											focus,
										)}
									>
										<option value="user">user</option>
										<option value="admin">admin</option>
									</select>
								</div>
							</div>
						))}
					</div>
				) : (
					<div>
						{/* Create Tag */}
						<div className="mb-6 flex gap-3">
							<input
								type="text"
								value={newTagName}
								onChange={(e) => {
									setNewTagName(e.target.value);
									setNewTagSlug(
										e.target.value
											.toLowerCase()
											.replace(/\s+/g, "-")
											.replace(/[^a-z0-9-]/g, ""),
									);
								}}
								placeholder="Tag name"
								className={cn(
									"flex-1 border border-gray-200 px-3 py-2 text-sm",
									focus,
								)}
							/>
							<input
								type="text"
								value={newTagSlug}
								onChange={(e) => setNewTagSlug(e.target.value)}
								placeholder="tag-slug"
								className={cn(
									"flex-1 border border-gray-200 px-3 py-2 text-sm",
									focus,
								)}
							/>
							<button
								type="button"
								onClick={handleCreateTag}
								disabled={!newTagName.trim() || !newTagSlug.trim()}
								className={cn(
									"px-4 py-2 text-sm",
									colors.bg.inverse,
									colors.text.inverse,
									interactive.base,
									(!newTagName.trim() || !newTagSlug.trim()) &&
										"cursor-not-allowed opacity-50",
								)}
							>
								Create Tag
							</button>
						</div>

						{/* Tag List */}
						<div className="space-y-2">
							{tags.map((tag) => (
								<div
									key={tag.id}
									className="flex items-center justify-between border border-gray-200 p-4"
								>
									<div>
										<p className={cn(text.h3)}>{tag.name}</p>
										<p className={cn(text.small, colors.text.secondary)}>
											{tag.slug}
										</p>
									</div>
									<button
										type="button"
										onClick={() => handleDeleteTag(tag.id)}
										className={cn(
											"border border-red-200 px-3 py-1 text-red-600 text-sm",
											interactive.base,
										)}
									>
										Delete
									</button>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
