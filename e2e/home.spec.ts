import { expect, test } from "@playwright/test";

test("首页正常加载并展示核心内容", async ({ page }) => {
  await page.goto("/");

  // 文档标题与主标题
  await expect(page).toHaveTitle(/BearBin/);
  await expect(page.getByRole("heading", { level: 1, name: "BearBin" })).toBeVisible();

  // 简介文案与板块标题
  await expect(page.getByText("样样通样样松")).toBeVisible();
  await expect(page.getByRole("heading", { name: "关于我" })).toBeVisible();
});
