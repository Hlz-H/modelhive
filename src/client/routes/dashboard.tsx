import { createFileRoute } from "@tanstack/react-router";
import { cn, colors, layout, spacing, text } from "@/client/lib/design";

export const Route = createFileRoute("/dashboard")({
	component: DashboardPage,
});

function DashboardPage() {
	return (
		<div className={spacing.page}>
			<div className={layout.container}>
				<div className="mb-8">
					<h1 className={cn(text.h1, colors.text.primary)}>Dashboard</h1>
					<p className={cn(text.base, colors.text.secondary)}>
						Manage your models and account
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="border border-gray-200 p-6">
						<h2 className={cn(text.h2, "mb-4")}>My Models</h2>
						<p className={cn(text.base, colors.text.secondary, "mb-4")}>
							View and manage your published models
						</p>
						<a
							href="/dashboard/models/new"
							className={cn(
								"inline-flex items-center px-4 py-2",
								colors.bg.inverse,
								colors.text.inverse,
							)}
						>
							Create New Model
						</a>
					</div>

					<div className="border border-gray-200 p-6">
						<h2 className={cn(text.h2, "mb-4")}>Profile</h2>
						<p className={cn(text.base, colors.text.secondary, "mb-4")}>
							Update your profile information
						</p>
						<a
							href="/profile"
							className={cn(
								"inline-flex items-center px-4 py-2 border border-gray-200",
							)}
						>
							Edit Profile
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}
