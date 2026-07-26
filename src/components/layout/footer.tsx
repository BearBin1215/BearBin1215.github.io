import { useLocation } from "react-router";
import { ExternalLink } from "@/components/external-link";
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
      {/* 移动端两行（免责声明上、图源下），桌面端单行 */}
      <div className="mx-auto flex flex-col justify-center gap-1 bg-background/24 px-4 py-2 text-xs text-muted-foreground md:h-14 md:flex-row md:items-center md:justify-end md:gap-2 md:px-6 md:py-0">
        {showDisclaimer && (
          <span className="min-w-0 md:mr-auto md:truncate">
            文章内容仅代表个人观点，不构成任何专业建议
          </span>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          <span>背景图源：</span>
          {sources.map((item, i) => (
            <span key={item.index} className="flex items-center gap-1.5">
              {i > 0 && <span>·</span>}
              <ExternalLink
                href={item.source}
                className={cn(
                  "transition-colors hover:text-foreground",
                  item.index - 1 === currentIndex && "font-bold text-foreground",
                )}
              >
                {item.index}
              </ExternalLink>
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}

export { Footer };
