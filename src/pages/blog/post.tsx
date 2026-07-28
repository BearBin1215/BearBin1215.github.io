import {
  Suspense,
  use,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { Link, useOutletContext, useParams } from "react-router";
import { MarkdownHooks, type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  CornerUpLeft,
  FileX,
} from "lucide-react";
import { CopyScreenshotButton } from "@/components/copy-screenshot-button";
import { ExternalLink } from "@/components/external-link";
import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LoadingPlaceholder } from "@/components/loading-placeholder";
import {
  BlogOutletContext,
  extractToc,
  getPostMetas,
  hmrVersion,
  loadPost,
  resolveImage,
  slugify,
  type BlogPost,
  type BlogPostMeta,
} from "@/lib/blog";
import { cn } from "@/lib/utils";
import { useDocumentTitle } from "@/hooks/use-document-title";

/**
 * 从 ReactNode 中递归提取纯文本
 * 用于给标题生成稳定的锚点 id（与 extractToc 中算法一致）
 */
function nodeToText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") {
    return "";
  }
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(nodeToText).join("");
  }
  if (typeof node === "object" && "props" in node) {
    return nodeToText((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

/** 文章加载失败或不存在时的占位提示 */
function PostNotFound() {
  return (
    <Empty className="min-h-80">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileX />
        </EmptyMedia>
        <EmptyTitle>文章不存在</EmptyTitle>
        <EmptyDescription>
          请检查链接是否正确，或返回杂记列表查看其他文章。
        </EmptyDescription>
      </EmptyHeader>
      <Link to="/blog" className={buttonVariants()}>
        返回杂记
      </Link>
    </Empty>
  );
}

/** 代码块：包裹 pre 并在右上角提供复制按钮（桌面 hover 显示，移动端常显） */
function CodeBlock({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = preRef.current?.querySelector("code")?.textContent ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* 剪贴板不可用时静默忽略 */
    }
  }

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? "已复制" : "复制代码"}
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon-xs" }),
          "absolute top-1.5 right-1.5 z-10 bg-background/70 text-muted-foreground backdrop-blur hover:bg-background/90 hover:text-foreground md:opacity-0 md:group-hover:opacity-100",
        )}
      >
        {copied ? <Check className="text-emerald-500" /> : <Copy />}
      </button>
      <pre ref={preRef} className={className}>
        {children}
      </pre>
    </div>
  );
}

/** 文章末尾上下篇导航：上一篇为更新的，下一篇为更早的 */
function PostNav({
  prev,
  next,
}: {
  prev: BlogPostMeta | null;
  next: BlogPostMeta | null;
}) {
  if (!prev && !next) {
    return null;
  }
  return (
    <nav className="mx-auto mt-8 flex max-w-4xl justify-between gap-4 px-1">
      {prev ? (
        <Link
          to={`/blog/${prev.slug}`}
          className="group flex min-w-0 flex-1 flex-col gap-1 rounded-md p-2 transition-colors hover:bg-secondary/50"
        >
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <ChevronLeft className="size-3.5" />
            上一篇
          </span>
          <span className="truncate text-sm font-medium group-hover:text-primary">
            {prev.title}
          </span>
        </Link>
      ) : (
        <span className="flex-1" aria-hidden />
      )}
      {next ? (
        <Link
          to={`/blog/${next.slug}`}
          className="group flex min-w-0 flex-1 flex-col items-end gap-1 rounded-md p-2 text-right transition-colors hover:bg-secondary/50"
        >
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            下一篇
            <ChevronRight className="size-3.5" />
          </span>
          <span className="truncate text-sm font-medium group-hover:text-primary">
            {next.title}
          </span>
        </Link>
      ) : (
        <span className="flex-1" aria-hidden />
      )}
    </nav>
  );
}

/**
 * 从文末脚注列表中读取指定脚注的渲染结果
 * 克隆脚注 li，移除返回链接并给所有链接加新标签打开，避免离开当前文章
 */
function extractFootnoteHtml(href: string): string {
  if (typeof document === "undefined") {
    return "";
  }
  const id = href.startsWith("#") ? href.slice(1) : href;
  const li = document.getElementById(id);
  if (!li) {
    return "";
  }
  const clone = li.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("[data-footnote-backref]").forEach((el) => el.remove());
  clone.querySelectorAll("a").forEach((a) => {
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener noreferrer");
  });
  return clone.innerHTML;
}

/** Popover 内脚注内容：挂载时从 DOM 读取对应脚注并复用其 HTML */
function FootnoteBody({ href }: { href: string }) {
  const html = useMemo(() => extractFootnoteHtml(href), [href]);
  if (!html) {
    return null;
  }
  return (
    <div
      className="prose prose-sm max-w-none [&_a]:font-medium [&_p]:my-0"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * 文内脚注引用上标：hover 显示对应脚注内容的 Popover
 * 脚注内容由 react-markdown 渲染至文末 .footnotes 列表，此处按 href 锚点从 DOM 读取
 * click 走默认锚点跳转至文末脚注，并在跳转时关闭 popover；
 * onOpenChange 忽略 trigger-press，使 click 不影响 popover 开关，仅由 hover 控制
 */
function FootnoteRef({ href, children, ...rest }: ComponentProps<"a">) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);

  function show() {
    window.clearTimeout(closeTimer.current);
    setOpen(true);
  }

  function hide() {
    closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  }

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  return (
    <Popover
      open={open}
      onOpenChange={(o, details) => {
        if (!o && details.reason !== "trigger-press") {
          hide();
        }
      }}
    >
      <PopoverTrigger
        nativeButton={false}
        render={
          <a
            href={href}
            {...rest}
            onMouseEnter={show}
            onMouseLeave={hide}
            onClick={() => setOpen(false)}
          >
            {children}
          </a>
        }
      />
      <PopoverContent
        initialFocus={false}
        onMouseEnter={show}
        onMouseLeave={hide}
        className="w-80 p-3"
      >
        <FootnoteBody href={href ?? ""} />
      </PopoverContent>
    </Popover>
  );
}

/** 文章主体内容，在 PostLoader 解析出 post 后渲染，负责同步目录到父级 Outlet context */
function PostContent({ post }: { post: BlogPost }) {
  const { setToc, setActiveId } = useOutletContext<BlogOutletContext>();
  /** 文章根节点，作为复制截图的目标 */
  const articleRef = useRef<HTMLElement>(null);
  useDocumentTitle(post.title);

  /** 上下篇：列表按日期倒序，故上一篇为更新的、下一篇为更早的 */
  const { prev, next } = useMemo(() => {
    const metas = getPostMetas();
    const idx = metas.findIndex((p) => p.slug === post.slug);
    return {
      prev: idx > 0 ? (metas[idx - 1] ?? null) : null,
      next: idx >= 0 && idx < metas.length - 1 ? (metas[idx + 1] ?? null) : null,
    };
  }, [post.slug, hmrVersion]);

  // 文章内容加载，同步目录并监听标题位置
  useEffect(() => {
    setToc(extractToc(post.content));

    const headings = Array.from(
      document.querySelectorAll<HTMLElement>(
        "article h2[id], article h3[id], article h4[id]",
      ),
    );
    if (headings.length === 0) {
      setActiveId(null);
      return;
    }

    /** 当前处于触发区域内的标题 id 集合 */
    const visible = new Set<string>();

    // 使用 IntersectionObserver 跟踪当前可见章节，回调父级更新目录高亮
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (entry.isIntersecting) {
            visible.add(id);
          } else {
            visible.delete(id);
          }
        }
        // 触发区域为空时保留上一次的激活项（用户正在阅读该章节的内容）
        if (visible.size === 0) {
          return;
        }
        // headings 按 DOM 顺序排列，find 返回最靠上的可见标题
        const topVisible = headings.find((h) => visible.has(h.id));
        if (topVisible) {
          setActiveId(topVisible.id);
        }
      },
      {
        // 触发区域：视口顶部 20%，标题进入此区域即视为正在阅读
        rootMargin: "0px 0px -80% 0px",
        threshold: 0,
      },
    );

    headings.forEach((h) => observer.observe(h));

    // 卸载时清空目录与激活项，避免切换文章时残留旧数据
    return () => {
      observer.disconnect();
      setToc([]);
      setActiveId(null);
    };
  }, [post, setToc, setActiveId]);

  const components: Components = {
    a: ({ children, ...props }) => {
      if ("data-footnote-ref" in props) {
        return <FootnoteRef {...props}>{children}</FootnoteRef>;
      }
      if ("data-footnote-backref" in props) {
        return (
          <a
            {...props}
            aria-label="返回引用处"
            className="decoration-none ms-0.5 inline-flex size-3.5 items-center align-middle text-muted-foreground transition-colors hover:text-primary"
          >
            <CornerUpLeft className="size-full" />
          </a>
        );
      }
      return props.href?.startsWith("#") ? (
        <a {...props}>{children}</a>
      ) : (
        <ExternalLink {...props}>{children}</ExternalLink>
      );
    },
    h2: ({ children, ...props }) => (
      <h2 id={slugify(nodeToText(children))} {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 id={slugify(nodeToText(children))} {...props}>
        {children}
      </h3>
    ),
    h4: ({ children, ...props }) => (
      <h4 id={slugify(nodeToText(children))} {...props}>
        {children}
      </h4>
    ),
    img: ({ src, alt, ...props }) => {
      const resolved =
        typeof src === "string" ? resolveImage(src, post.date.slice(0, 4)) : src;
      return <img src={resolved} alt={alt} {...props} />;
    },
    pre: ({ children, className }) => (
      <CodeBlock className={className}>{children}</CodeBlock>
    ),
  };

  return (
    <>
      <article ref={articleRef} className="mx-auto max-w-4xl px-1">
        <header className="mb-8 border-b pb-4">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold md:text-3xl">{post.title}</h1>
            <CopyScreenshotButton targetRef={articleRef} filename={`${post.slug}.png`} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <time dateTime={post.date}>{post.date}</time>
            {post.tags && post.tags.length > 0 && (
              <>
                <span aria-hidden>·</span>
                {post.tags.map((tag) => (
                  <span key={tag} className="rounded bg-secondary px-1.5 py-0.5 text-xs">
                    {tag}
                  </span>
                ))}
              </>
            )}
          </div>
          {post.excerpt && <p className="mt-3 text-muted-foreground">{post.excerpt}</p>}
        </header>
        <div className="prose prose-sm max-w-none md:prose-base">
          <MarkdownHooks
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            remarkRehypeOptions={{ footnoteLabel: "参考文献" }}
            components={components}
            fallback={<LoadingPlaceholder spinnerSize="size-6" className="py-8" />}
          >
            {post.content}
          </MarkdownHooks>
        </div>
      </article>
      <PostNav prev={prev} next={next} />
    </>
  );
}

/**
 * 文章加载器
 * 使用 React 19 的 use() Hook 挂起至 loadPost 解析完成
 * 同一 slug 的 promise 已在 lib/blog.ts 中缓存，重复访问直接复用
 */
function PostLoader({ slug }: { slug: string }) {
  const post = use(loadPost(slug));
  if (!post) {
    return <PostNotFound />;
  }
  return <PostContent post={post} />;
}

/** 文章详情页入口：负责读取 slug 并提供 Suspense 边界 */
function Post() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) {
    return <PostNotFound />;
  }
  return (
    <Suspense fallback={<LoadingPlaceholder spinnerSize="size-8" />}>
      <PostLoader slug={slug} />
    </Suspense>
  );
}

export default Post;
