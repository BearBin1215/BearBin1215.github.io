import { useLocation } from "react-router";
import { backgrounds, useBackgroundStore } from "@/stores/background";
import { cn } from "@/lib/utils";

/** 底部页脚（随页面滚动） */
function Footer() {
  const { pathname } = useLocation();
  /** 当前显示的背景图索引，用于高亮对应的来源链接 */
  const currentIndex = useBackgroundStore((s) => s.currentIndex);
  /** 仅在杂记页及其文章详情页显示免责声明 */
  const showDisclaimer = pathname.startsWith("/blog");

  /** 仅展示有来源链接的背景图 */
  const sources = backgrounds
    .map((bg, index) => ({ index: index + 1, source: bg.source }))
    .filter((item): item is { index: number; source: string } => Boolean(item.source));

  return (
    <footer className="border-t">
      <div className="mx-auto flex h-14 items-center justify-end gap-2 bg-background/24 px-6 text-xs text-muted-foreground">
        {showDisclaimer && (
          <span className="mr-auto min-w-0 truncate">
            文章内容仅代表个人观点，不构成任何专业建议
          </span>
        )}
        <span>背景图源：</span>
        {sources.map((item, i) => (
          <span key={item.index} className="flex items-center gap-2">
            {i > 0 && <span>·</span>}
            <a
              href={item.source}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "transition-colors hover:text-foreground",
                item.index - 1 === currentIndex && "font-bold text-foreground",
              )}
            >
              {item.index}
            </a>
          </span>
        ))}
      </div>
    </footer>
  );
}

export { Footer };
