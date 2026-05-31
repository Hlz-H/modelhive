import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { cn, colors, focus, interactive, text } from "@/client/lib/design";

export const Route = createFileRoute("/register")({
	component: RegisterPage,
});

function RegisterPage() {
	const navigate = useNavigate();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			const response = await fetch("/api/auth/sign-up/email", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, email, password }),
			});

			if (response.ok) {
				navigate({ to: "/" });
			} else {
				const data = await response.json();
				setError(data.error?.message || "Registration failed");
			}
		} catch (err) {
			setError("Network error");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex min-h-[60vh] items-center justify-center">
			<div className="mx-auto w-full max-w-sm">
				{error && (
					<div className="mb-8 bg-red-50 p-4">
						<p className={cn(text.small, "text-red-600")}>{error}</p>
					</div>
				)}

				<div className="space-y-6">
					<div>
						<h1 className={cn(text.h1, "mb-2")}>Register</h1>
						<p className={cn(text.base, colors.text.secondary)}>
							Create your ModelHive account
						</p>
					</div>

					<form onSubmit={handleRegister} className="space-y-4">
						<div>
							<label
								htmlFor="name"
								className={cn(text.small, colors.text.secondary, "mb-1 block")}
							>
								Name
							</label>
							<input
								id="name"
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Your name"
								className={cn(
									"w-full border border-gray-200 px-3 py-2",
									focus,
								)}
								required
							/>
						</div>

						<div>
							<label
								htmlFor="email"
								className={cn(text.small, colors.text.secondary, "mb-1 block")}
							>
								Email
							</label>
							<input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="your@email.com"
								className={cn(
									"w-full border border-gray-200 px-3 py-2",
									focus,
								)}
								required
							/>
						</div>

						<div>
							<label
								htmlFor="password"
								className={cn(text.small, colors.text.secondary, "mb-1 block")}
							>
								Password
							</label>
							<input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="••••••••"
								className={cn(
									"w-full border border-gray-200 px-3 py-2",
									focus,
								)}
								required
								minLength={8}
							/>
						</div>

						<button
							type="submit"
							disabled={loading}
							className={cn(
								"flex w-full items-center justify-center px-4 py-3",
								colors.bg.inverse,
								colors.text.inverse,
								interactive.base,
								focus,
								loading && "opacity-50 cursor-not-allowed",
							)}
						>
							{loading ? "Creating account..." : "Create Account"}
						</button>
					</form>

					<p className={cn(text.small, colors.text.secondary, "text-center")}>
						Already have an account?{" "}
						<a href="/login" className={cn(interactive.link)}>
							Sign in
						</a>
					</p>
				</div>
			</div>
		</div>
	);
}
