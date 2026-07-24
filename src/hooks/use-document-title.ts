import { useEffect } from "react";

/** 站点名称，作为所有页面 title 的统一后缀 */
const SITE_NAME = "BearBin";

/**
 * 设置当前文档标题。
 * - 传入非空 segment：显示为 `${segment} - ${SITE_NAME}`
 * - 不传或传入 null/空串：显示为纯 `${SITE_NAME}`（用于首页）
 *
 * segment 变化时自动更新（如文章异步加载完成后）；
 * 路由切换时由新页面的调用覆盖。
 */
function useDocumentTitle(segment?: string | null): void {
  useEffect(() => {
    document.title = segment ? `${segment} - ${SITE_NAME}` : SITE_NAME;
  }, [segment]);
}

export { useDocumentTitle };
