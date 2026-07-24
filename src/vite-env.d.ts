/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

/**
 * .md 文件作为原始字符串默认导出
 * 由 vite.config 的 markdown-raw plugin 提供，省去 ?raw 后缀以便 IDE 跳转
 */
declare module "*.md" {
  const attributes: Record<string, unknown>;
  const markdown: string;
  export { attributes, markdown };
}
