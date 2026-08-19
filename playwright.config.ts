import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright 端到端测试配置。
 *
 * - 测试文件位于 e2e/ 目录，与 vitest 的 test/ 目录隔离
 * - 运行前由 webServer 自动启动 Vite 开发服务器（端口 9029）
 * - CI 环境：串行执行 + 失败重试；本地：并行执行不重试
 */
export default defineConfig({
  testDir: "./e2e",
  /** 用例间完全并行，提升本地执行速度 */
  fullyParallel: true,
  /** CI 下禁用 test.only，避免聚焦用例被误提交 */
  forbidOnly: !!process.env.CI,
  /** CI 下失败重试 2 次，本地不重试 */
  retries: process.env.CI ? 2 : 0,
  /** CI 下串行保证稳定性，本地并行 */
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: "http://localhost:9029",
    /** 首次重试时记录 trace，便于定位失败原因 */
    trace: "on-first-retry",
    /** 仅失败时截图，减少正常运行的产物 */
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:9029",
    /** 本地复用已启动的 dev server，CI 下始终新建 */
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
