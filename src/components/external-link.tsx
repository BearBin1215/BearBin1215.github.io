import { type ComponentProps } from "react";

/**
 * 外部链接：在新标签页打开第三方网站。
 * 自动添加 `target="_blank"` 与 `rel="noopener noreferrer"`，避免每次重复写、避免遗漏 rel 导致安全风险。
 * 其他属性（href、className、children 等）与普通 `<a>` 一致。
 */
function ExternalLink({ ...props }: ComponentProps<"a">) {
  return <a target="_blank" rel="noopener noreferrer" {...props} />;
}

export { ExternalLink };
