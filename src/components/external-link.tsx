import { type ComponentProps } from "react";
import { SiX } from "@icons-pack/react-simple-icons";

/** 推特（X）链接域名匹配：兼容 x.com 及其子域名（如 twitter.com 重定向后） */
const X_HOST_RE = /(^|\.)x\.com$/i;

/** X 用户名形链接：单段路径，仅含字母、数字、下划线，1~15 个字符 */
const X_USER_PATH_RE = /^\/([A-Za-z0-9_]{1,15})\/?$/;

/** X 站内单段功能页路径，形态与用户名相同，不能视作个人主页 */
const X_RESERVED_PATHS = new Set([
  "home",
  "explore",
  "notifications",
  "messages",
  "search",
  "settings",
  "compose",
  "login",
  "logout",
  "signup",
  "i",
  "intent",
  "tos",
  "privacy",
  "rules",
  "help",
  "about",
  "download",
  "jobs",
  "account",
  "ads",
  "premium",
  "verified",
  "communities",
  "connect_people",
  "places",
  "lists",
  "bookmarks",
  "moments",
  "topics",
  "trends",
  "who_to_follow",
]);

/**
 * 判断链接是否指向 x.com（推特）的用户主页，如 `https://x.com/foo`。
 * 推文、媒体等带子路径的链接（如 `https://x.com/foo/status/bar`）视为非用户主页；
 * href 为空或非法 URL 时返回 false。
 */
function isXUserUrl(href: string | undefined): boolean {
  if (!href) {
    return false;
  }
  try {
    const url = new URL(href);
    if (!X_HOST_RE.test(url.hostname)) {
      return false;
    }
    const username = X_USER_PATH_RE.exec(url.pathname)?.[1];
    return username !== undefined && !X_RESERVED_PATHS.has(username.toLowerCase());
  } catch {
    return false;
  }
}

/** ExternalLink 额外支持的属性（在原生 `<a>` 属性基础上扩展） */
interface ExternalLinkProps extends ComponentProps<"a"> {
  /** 是否在链接指向 x.com（推特）用户主页时，于链接文本前自动添加 X 图标，默认关闭 */
  showIcon?: boolean;
}

/**
 * 外部链接：在新标签页打开第三方网站。
 * 自动添加 `target="_blank"` 与 `rel="noopener noreferrer"`，避免每次重复写、避免遗漏 rel 导致安全风险。
 * 默认带 `.link` 样式（前景色 + 点状下划线，hover 变虚线），与正文（`.prose a`）链接一致。
 * 传入 className 时会整体覆盖默认样式（如按钮、卡片等已自定样式的场景）。
 * 其他属性（href、children 等）与普通 `<a>` 一致。
 * 当 `showIcon` 为 true 且链接指向 X 用户主页时，会在链接文本前添加 X 图标；默认关闭。
 */
function ExternalLink({ href, children, showIcon = false, ...props }: ExternalLinkProps) {
  const isXUser = showIcon && isXUserUrl(href);

  return (
    <a target="_blank" rel="noopener noreferrer" className="link" href={href} {...props}>
      {isXUser && (
        <SiX className="me-0.5 inline-block size-3.5 align-[-0.15em]" aria-hidden />
      )}
      {children}
    </a>
  );
}

export { ExternalLink };
