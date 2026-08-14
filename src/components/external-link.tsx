import { type ComponentProps } from "react";

/**
 * 外部链接：在新标签页打开第三方网站。
 * 自动添加 `target="_blank"` 与 `rel="noopener noreferrer"`，避免每次重复写、避免遗漏 rel 导致安全风险。
 * 默认带 `.link` 样式（前景色 + 点状下划线，hover 变虚线），与正文（`.prose a`）链接一致。
 * 传入 className 时会整体覆盖默认样式（如按钮、卡片等已自定样式的场景）。
 * 其他属性（href、children 等）与普通 `<a>` 一致。
 */
function ExternalLink({ ...props }: ComponentProps<"a">) {
  return <a target="_blank" rel="noopener noreferrer" className="link" {...props} />;
}

export { ExternalLink };
