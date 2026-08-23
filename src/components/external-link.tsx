import { type ComponentProps } from "react";
import { SiX } from "@icons-pack/react-simple-icons";

/** 推特（X）链接域名匹配：兼容 x.com 及其子域名（如 twitter.com 重定向后） */
const X_HOST_RE = /(^|\.)x\.com$/i;

/**
 * 判断链接是否指向 x.com（推特）
 * 通过 URL 解析 hostname 后精确匹配，排除形如 https://xxx.com 的误判；
 * href 为空或非法 URL 时返回 false。
 */
function isXUrl(href: string | undefined): boolean {
  if (!href) {
    return false;
  }
  try {
    return X_HOST_RE.test(new URL(href).hostname);
  } catch {
    return false;
  }
}

/**
 * 外部链接：在新标签页打开第三方网站。
 * 自动添加 `target="_blank"` 与 `rel="noopener noreferrer"`，避免每次重复写、避免遗漏 rel 导致安全风险。
 * 默认带 `.link` 样式（前景色 + 点状下划线，hover 变虚线），与正文（`.prose a`）链接一致。
 * 传入 className 时会整体覆盖默认样式（如按钮、卡片等已自定样式的场景）。
 * 其他属性（href、children 等）与普通 `<a>` 一致。
 * 若链接指向 x.com（推特），会在链接文本前添加 X 图标。
 */
function ExternalLink({ href, children, ...props }: ComponentProps<"a">) {
  const isX = isXUrl(href);

  return (
    <a target="_blank" rel="noopener noreferrer" className="link" href={href} {...props}>
      {isX && (
        <SiX className="me-0.5 inline-block size-3.5 align-[-0.15em]" aria-hidden />
      )}
      {children}
    </a>
  );
}

export { ExternalLink };
