import { useEffect, useRef, type FC, type ReactNode } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TechBadgeProps {
  /** 徽章显示文字 */
  label: string;
  /** simple-icons 品牌图标组件，传入后以品牌色渲染 */
  icon: FC<{ className?: string; color?: string }>;
  /** 悬浮提示，未提供时不显示 Tooltip */
  tooltip?: ReactNode;
  /** 自定义 className */
  className?: string;
}

/**
 * 技术徽章：固定视口渐变背景 + 彩色品牌图标
 *
 * 通过 `color="default"` 让 simple-icons 图标使用其内置品牌色；
 * 背景使用 `background-attachment: fixed` 的对角渐变，使每个徽章按其在视口中的
 * 位置显示不同色相，滚动时还会产生渐变"露出"的动态效果。浅/深模式各有对应配色。
 *
 * simple-icons 的 svg 内默认渲染 `<title>` 子元素，浏览器会将其作为原生 tooltip
 * 显示，与自定义 Tooltip 冲突。这里在挂载后移除 svg 内的 `<title>` 元素，
 * 仅在 `tooltip` prop 提供时显示统一的 shadcn Tooltip。
 */
function TechBadge({ label, icon: Icon, tooltip, className }: TechBadgeProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) {
      return;
    }
    root.querySelectorAll("svg title").forEach((el) => el.remove());
  }, []);

  const badge = (
    <span
      ref={ref}
      className={cn(
        "tech-badge-bg inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-sm font-medium text-foreground transition-all hover:shadow-sm",
        className,
      )}
    >
      <Icon color="default" className="size-4 shrink-0" />
      {label}
    </span>
  );

  if (!tooltip) {
    return badge;
  }

  return (
    <Tooltip>
      <TooltipTrigger render={badge} />
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

export { TechBadge };
