/**
 * 路由配置文件
 * 在这里集中管理所有需要特殊处理的路由
 */

// 重要：所有 API 路由默认需要认证，只有在这里列出的路由才能公开访问
// 添加新路由时请谨慎考虑是否真的需要公开访问
export const PUBLIC_API_ROUTES = [
	"/api/hello", // 测试端点
	// Better Auth 的公开端点（包括路径本身和子路径）
	"/api/auth/sign-in",
	"/api/auth/sign-in/*",
	"/api/auth/sign-up",
	"/api/auth/sign-up/*",
	"/api/auth/sign-out",
	"/api/auth/callback/*",
	"/api/auth/verify-email",
	"/api/auth/forgot-password",
	"/api/auth/reset-password",
	"/api/auth/get-session",
	"/api/auth/error",
	// Better Auth well-known endpoints
	"/api/auth/.well-known/*",
	"/api/auth/error/*",
	"/api/openapi.json", // OpenAPI 文档
	"/api/docs", // API 文档界面
	"/api/docs/*", // API 文档相关资源
	"/api/health", // 健康检查端点
	// ModelHive public endpoints
	// 路由放行给全局 auth guard，但模型模块内部的 optionalAuth 中间件会处理实际认证
	// GET 公共可访问，POST/PUT/DELETE 在 handler 内检查 c.get("user")
	"/api/models",
	"/api/models/*",
	"/api/categories",
	"/api/categories/seed",
	"/api/tags",
	"/api/tags/*",
	"/api/models/*/favorites",
	"/api/files/*",
	"/api/collections",
	"/api/collections/*",
	// User routes (public GET, authenticated PUT)
	"/api/users/me",
	"/api/users/*/models",
	"/api/users/*/collections",
	"/api/users/*/followers",
	"/api/users/*/following",
	"/api/users/*/follow-stats",
	"/api/users/*/follow-check",
	"/api/users/me/follow-stats",
	"/api/users/*/follow-stats",
	// Comment routes (public GET, authenticated POST/DELETE)
	"/api/models/*/comments",
	"/api/models/*/comments/*",
] as const;
