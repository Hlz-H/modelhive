import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSession } from "@client/lib/auth";
import { cn, colors, layout, spacing, text } from "@/client/lib/design";

export const Route = createFileRoute("/dashboard")({
	component: DashboardPage,
});

interface Model {
	id: string;
	name: string;
	slug: string;
	type: string;
	isPublished: boolean;
	createdAt: string;
}

function DashboardPage() {
	const { data: session, isPending } = useSession();
	const navigate = useNavigate();
	const [models, setModels] = useState<Model[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// 等待 session 加载完成
		if (isPending) return;
		
		if (!session) {
			navigate({ to: "/login" });
			return;
		}

		const fetchUserModels = async () => {
			try {
				const response = await fetch(`/api/users/${session.user.id}/models`);
				if (response.ok) {
					const data = await response.json() as { models: Model[] };
					setModels(data.models);
				}
			} catch (err) {
				console.error("Failed to fetch models:", err);
			} finally {
				setLoading(false);
			}
		};

		fetchUserModels();
	}, [session, isPending, navigate]);

	const handleDelete = async (id: string) => {
		if (!confirm("确定要删除这个模型吗？")) return;

		try {
			const response = await fetch(`/api/models/${id}`, {
				method: "DELETE",
			});

			if (response.ok) {
				setModels(models.filter((m) => m.id !== id));
			}
		} catch (err) {
			console.error("Failed to delete model:", err);
		}
	};

	if (!session) {
		return null;
	}

	return (
		<div className={spacing.page}>
			<div className={layout.container}>
				<div className="mb-8 flex items-center justify-between">
					<div>
						<h1 className={cn(text.h1, colors.text.primary)}>Dashboard</h1>
						<p className={cn(text.base, colors.text.secondary)}>
							管理你的模型
						</p>
					</div>
					<a
						href="/models/new"
						className={cn(
							"px-6 py-3",
							colors.bg.inverse,
							colors.text.inverse,
						)}
					>
						创建新模型
					</a>
				</div>

				{loading ? (
					<p className={text.base}>Loading...</p>
				) : models.length === 0 ? (
					<div className="py-12 text-center">
						<p className={cn(text.h3, colors.text.secondary, "mb-4")}>
							还没有模型
						</p>
						<p className={cn(text.base, colors.text.secondary)}>
							点击上面的"创建新模型"按钮开始
						</p>
					</div>
				) : (
					<div className="space-y-4">
						{models.map((model) => (
							<div
								key={model.id}
								className="flex items-center justify-between border border-gray-200 p-4"
							>
								<div>
									<h3 className={cn(text.h3)}>
										<a
											href={`/models/${model.slug}`}
											className={cn(colors.text.primary, "hover:underline")}
										>
											{model.name}
										</a>
									</h3>
									<p className={cn(text.small, colors.text.secondary)}>
										{model.type} • {model.isPublished ? "已发布" : "未发布"} •{" "}
										{new Date(model.createdAt).toLocaleDateString()}
									</p>
								</div>
								<div className="flex gap-2">
									<a
										href={`/models/${model.id}/edit`}
										className={cn(
											"px-4 py-2 border border-gray-200",
											text.small,
										)}
									>
										编辑
									</a>
									<button
										type="button"
										onClick={() => handleDelete(model.id)}
										className={cn(
											"px-4 py-2 border border-red-200 text-red-600",
											text.small,
										)}
									>
										删除
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
