import { useEffect, useState, type ComponentType } from "react";
import { Link } from "react-router";
import { FileText, Hash } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SectionTitle } from "@/components/section-title";
import { LoadingPlaceholder } from "@/components/loading-placeholder";
import { collectTags, hmrVersion, loadPosts, type BlogPostMeta } from "@/lib/blog";
import { useDocumentTitle } from "@/hooks/use-document-title";

/** 最近文章展示数量 */
const RECENT_POSTS_LIMIT = 3;

/** 统计卡片：图标 + 数值 + 标签 */
function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
}) {
  return (
    <Card size="sm" className="group/card flex-1 gap-0">
      <CardContent className="flex items-center gap-3 py-1">
        {/* 图标容器：hover 时由 transition 平滑放大；内层图标触发 index.css 中的 animate-icon-wobble 晃动动画 */}
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition-transform duration-200 group-hover/card:scale-115">
          <Icon className="size-4.5 origin-center group-hover/card:animate-icon-wobble" />
        </div>
        <div className="min-w-0">
          <div className="text-xl leading-tight font-semibold tabular-nums">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

/** 最近文章卡片：日期 + 标题 + 摘要 + 标签 */
function RecentPostCard({ post }: { post: BlogPostMeta }) {
  return (
    <Link
      to={post.slug}
      className="group block rounded-lg border bg-card/60 p-4 transition-colors hover:border-primary/40 hover:bg-card/80"
    >
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <time dateTime={post.date} className="tabular-nums">
          {post.date}
        </time>
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <h3 className="mt-1.5 font-medium text-foreground transition-colors group-hover:text-primary">
        {post.title}
      </h3>
      {post.excerpt && (
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
      )}
    </Link>
  );
}

/** /blog 默认入口页：展示博客总览统计与最近文章 */
function BlogOverview() {
  const [posts, setPosts] = useState<BlogPostMeta[] | null>(null);
  useDocumentTitle("杂记");

  useEffect(() => {
    let mounted = true;
    loadPosts().then((all) => {
      if (mounted) {
        setPosts(all);
      }
    });
    return () => {
      mounted = false;
    };
  }, [hmrVersion]);

  if (posts === null) {
    return <LoadingPlaceholder spinnerSize="size-8" className="py-16" />;
  }

  /** 文章为空时的友好提示 */
  if (posts.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-muted-foreground">还没有文章，敬请期待。</p>
      </div>
    );
  }

  const tags = collectTags(posts);
  const recentPosts = posts.slice(0, RECENT_POSTS_LIMIT);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">杂记</h1>
      </header>

      <section className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <StatCard icon={FileText} value={posts.length} label="篇文章" />
        <StatCard icon={Hash} value={tags.length} label="个标签" />
      </section>

      <section className="space-y-3">
        <SectionTitle variant="accent">最近</SectionTitle>
        <div className="space-y-2">
          {recentPosts.map((post) => (
            <RecentPostCard key={post.slug} post={post} />
          ))}
        </div>
      </section>
    </div>
  );
}

export default BlogOverview;
