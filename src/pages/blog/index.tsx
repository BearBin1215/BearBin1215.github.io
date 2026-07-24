import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet } from "react-router";
import { ChevronDown, Search, X } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { LoadingPlaceholder } from "@/components/loading-placeholder";
import { MusicPlayer } from "@/components/music-player";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { cn } from "@/lib/utils";
import {
  BlogOutletContext,
  collectTags,
  filterPosts,
  groupByYear,
  hmrVersion,
  loadPosts,
  type BlogPostMeta,
  type TocItem,
  type TocMaxLevel,
} from "@/lib/blog";

/** localStorage 中保存 TOC 最大层级的 key */
const TOC_MAX_LEVEL_STORAGE_KEY = "blog:toc-max-level";

/** 校验从 localStorage 读取的值是否为合法的 TocMaxLevel */
function isTocMaxLevel(value: unknown): value is TocMaxLevel {
  return value === 2 || value === 3 || value === 4;
}

function Blog() {
  const [allPosts, setAllPosts] = useState<BlogPostMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [maxLevel, setMaxLevel] = useLocalStorage<TocMaxLevel>(
    TOC_MAX_LEVEL_STORAGE_KEY,
    3,
    isTocMaxLevel,
  );
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 首次挂载触发懒加载；开发模式下 registry 变更（hmrVersion 变化）时重新加载
  useEffect(() => {
    let mounted = true;
    loadPosts().then((posts) => {
      if (mounted) {
        setAllPosts(posts);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [hmrVersion]);

  const tags = useMemo(() => collectTags(allPosts), [allPosts]);
  const filteredPosts = useMemo(() => {
    let list = filterPosts(allPosts, search);
    if (activeTag) {
      list = list.filter((post) => post.tags?.includes(activeTag));
    }
    return list;
  }, [allPosts, search, activeTag]);
  const yearGroups = useMemo(() => groupByYear(filteredPosts), [filteredPosts]);

  const context = useMemo<BlogOutletContext>(
    () => ({ setToc, setActiveId }),
    [setToc, setActiveId],
  );

  /**
   * 实际渲染的 TOC 项：按 maxLevel 过滤
   * toc 始终包含 h2-h4 全部层级，便于 effectiveActiveId 回溯到祖先
   */
  const filteredToc = useMemo(
    () => toc.filter((item) => item.level <= maxLevel),
    [toc, maxLevel],
  );

  /**
   * 计算实际需要高亮的 TOC 项 id
   * 当 activeId 对应的标题层级超出 maxLevel 时（例如 maxLevel=2 但当前在 h3 下），
   * 向前回溯到首个可见层级的标题，确保用户始终能看到自己所在章节
   */
  const effectiveActiveId = useMemo(() => {
    if (!activeId) {
      return null;
    }
    const activeIdx = toc.findIndex((item) => item.id === activeId);
    if (activeIdx === -1) {
      return null;
    }
    const activeItem = toc[activeIdx];
    if (activeItem && activeItem.level <= maxLevel) {
      return activeId;
    }
    for (let i = activeIdx - 1; i >= 0; i--) {
      const item = toc[i];
      if (item && item.level <= maxLevel) {
        return item.id;
      }
    }
    return null;
  }, [activeId, toc, maxLevel]);

  /** 渲染右侧 TOC 主体：无标题 / 当前层级无内容 / 正常列表 三种状态 */
  function renderTocBody() {
    if (toc.length === 0) {
      return <p className="px-4 text-xs text-muted-foreground">无目录</p>;
    }
    if (filteredToc.length === 0) {
      return <p className="px-4 text-xs text-muted-foreground">当前层级无目录</p>;
    }
    return (
      <nav className="space-y-1 px-2 text-sm">
        {filteredToc.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={cn(
              "block rounded px-2 py-1 transition-colors",
              item.level === 3 && "pl-5 text-xs",
              item.level === 4 && "pl-8 text-xs",
              item.id === effectiveActiveId
                ? "bg-primary/15 font-medium text-foreground"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
            )}
          >
            {item.text}
          </a>
        ))}
      </nav>
    );
  }

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      {/* 左侧菜单：移动端可折叠，桌面端 sticky */}
      <aside className="md:w-72 md:shrink-0 md:border-r">
        <div className="md:sticky md:top-(--header-offset) md:max-h-[calc(100vh-var(--header-offset))] md:overflow-y-auto">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-expanded={mobileMenuOpen}
            className="flex w-full items-center justify-between border-b p-4 md:hidden"
          >
            <span className="text-sm font-medium">文章列表</span>
            <ChevronDown
              className={cn(
                "size-4 transition-transform",
                mobileMenuOpen && "rotate-180",
              )}
            />
          </button>
          <div
            className={cn("p-4 md:block", mobileMenuOpen ? "block border-b" : "hidden")}
          >
            {loading ? (
              <LoadingPlaceholder spinnerSize="size-6" className="py-8" />
            ) : (
              <>
                {/* 搜索框 */}
                <div className="relative mb-4">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="搜索文章"
                    aria-label="搜索文章"
                    className="w-full rounded-md border bg-background/50 py-1.5 pr-7 pl-8 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label="清除搜索"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
                {/* 标签筛选 */}
                {tags.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveTag(null)}
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs transition-colors",
                        activeTag === null
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
                      )}
                    >
                      全部
                    </button>
                    {tags.map(({ tag, count }) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setActiveTag((cur) => (cur === tag ? null : tag))}
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs transition-colors",
                          activeTag === tag
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
                        )}
                      >
                        {tag}
                        <span className="ml-0.5 opacity-60">{count}</span>
                      </button>
                    ))}
                  </div>
                )}
                {/* 按年分组折叠列表 */}
                <nav className="space-y-1">
                  {yearGroups.length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      没有匹配的文章
                    </p>
                  )}
                  {yearGroups.map((group) => (
                    <Collapsible key={group.year} defaultOpen>
                      <CollapsibleTrigger className="group flex w-full items-center gap-1 rounded px-1 py-1 text-sm font-medium hover:bg-secondary/50">
                        <ChevronDown className="size-3.5 transition-transform group-data-[state=closed]:-rotate-90" />
                        <span>{group.year}</span>
                        <span className="text-muted-foreground">
                          ({group.posts.length})
                        </span>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-1 space-y-0.5 pl-1">
                        {group.posts.map((post) => (
                          <NavLink
                            key={post.slug}
                            to={post.slug}
                            onClick={() => setMobileMenuOpen(false)}
                            className={({ isActive }) =>
                              cn(
                                "flex items-baseline justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                                isActive
                                  ? "bg-primary/15 font-medium text-foreground"
                                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                              )
                            }
                          >
                            <span className="min-w-0 truncate">{post.title}</span>
                            <span className="shrink-0 text-xs tabular-nums opacity-70">
                              {post.date.slice(5)}
                            </span>
                          </NavLink>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </nav>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* 中间文章内容 */}
      <main className="min-w-0 flex-1 px-6 py-2">
        <Outlet context={context} />
      </main>

      {/* 右侧 TOC：仅桌面端显示 */}
      <aside className="hidden lg:block lg:w-72 lg:shrink-0 lg:border-l">
        <div className="lg:sticky lg:top-(--header-offset) lg:max-h-[calc(100vh-var(--header-offset))] lg:overflow-y-auto lg:py-6">
          <div className="mb-2 flex items-center justify-between px-4">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              目录
            </p>
            {toc.length > 0 && (
              <div
                role="group"
                aria-label="目录显示层级"
                className="flex items-center gap-0.5 rounded-md border bg-background/50 p-0.5"
              >
                {([2, 3, 4] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setMaxLevel(lvl)}
                    aria-pressed={maxLevel === lvl}
                    title={`最多显示到 H${lvl}`}
                    className={cn(
                      "h-5 w-5 rounded text-[10px] leading-none font-medium transition-colors",
                      maxLevel === lvl
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    H{lvl}
                  </button>
                ))}
              </div>
            )}
          </div>
          {renderTocBody()}
          {/* 推荐音乐：与首页共享同一播放状态（zustand store） */}
          <div className="mt-4 border-t px-4 pt-4">
            <MusicPlayer />
          </div>
        </div>
      </aside>
    </div>
  );
}

export default Blog;
