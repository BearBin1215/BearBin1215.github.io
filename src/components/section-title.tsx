import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** 区块标题变体 */
type SectionTitleVariant = "default" | "accent";

interface SectionTitleProps {
  /** 标题内容 */
  children: ReactNode;
  /** 标题变体：default 为纯文字中标题，accent 为带左侧色条的小标题 */
  variant?: SectionTitleVariant;
  /** 自定义 className */
  className?: string;
  /** 渲染的标题标签，默认 h2 */
  as?: "h2" | "h3";
}

/** 区块标题：统一各页面的标题样式 */
function SectionTitle({
  children,
  variant = "default",
  className,
  as: Tag = "h2",
}: SectionTitleProps) {
  return (
    <Tag
      className={cn(
        "font-semibold text-foreground",
        variant === "default" && "text-lg",
        variant === "accent" && "border-l-2 border-primary pl-3 text-base",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export { SectionTitle };
