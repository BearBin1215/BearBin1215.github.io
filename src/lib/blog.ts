import { posts as entries } from "@/content/blog/registry";

/** 博客文章元数据 */
export interface BlogPostMeta {
  /** URL 中使用的 slug，来自文件名（不含扩展名） */
  slug: string;
  /** 文章标题 */
  title: string;
  /** 发布日期，ISO 字符串 YYYY-MM-DD */
  date: string;
  /** 摘要，可选 */
  excerpt?: string;
  /** 标签列表 */
  tags?: string[];
}

/** 完整博客文章（包含正文） */
export interface BlogPost extends BlogPostMeta {
  /** Markdown 正文 */
  content: string;
}

/** vite-plugin-markdown 导出的 .md 模块形状 */
interface MarkdownModule {
  /** .md 原文 */
  markdown: string;
}

/** registry 中的文章条目：元数据 + 懒加载正文 */
export interface BlogPostEntry extends BlogPostMeta {
  /** 动态加载 .md 模块，Vite 为每篇生成独立 chunk 按需加载 */
  loadContent: () => Promise<MarkdownModule>;
}

/** TOC 目录项 */
export interface TocItem {
  /** 标题级别：2 对应 h2，3 对应 h3，4 对应 h4 */
  level: 2 | 3 | 4;
  /** 标题文本 */
  text: string;
  /** 用于锚点跳转的 id */
  id: string;
}

/** TOC 最大显示层级：2 仅 h2，3 含 h3，4 含 h4 */
export type TocMaxLevel = 2 | 3 | 4;

/** 博客布局 Outlet context：父级 Blog 向子路由 Post 暴露的 TOC 同步接口 */
export interface BlogOutletContext {
  /** 子路由在文章切换时调用，刷新父级 TOC 状态（已包含 h2-h4 全部层级） */
  setToc: (items: TocItem[]) => void;
  /** 子路由在滚动时调用，更新父级 TOC 当前激活项 */
  setActiveId: (id: string | null) => void;
}

/** 将标题文本转为 URL 安全的锚点 id（中文字符保留） */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

/** 单篇文章加载 promise 缓存，按 slug 索引 */
const postPromiseCache = new Map<string, Promise<BlogPost | null>>();

/**
 * HMR 版本号：blog.ts 因 registry 等依赖变更被重新求值时自增。
 * 消费方将其作为加载文章列表的 effect 依赖，使开发模式下修改 registry 能触发热更新；
 * 生产构建中 import.meta.hot 被剔除，恒为 0，无副作用。
 */
export let hmrVersion = 0;
if (import.meta.hot) {
  hmrVersion = ((import.meta.hot.data.hmrVersion as number | undefined) ?? 0) + 1;
  import.meta.hot.data.hmrVersion = hmrVersion;
}

/**
 * 获取全部文章元数据（不含正文），按日期倒序。
 * 同步版本，供需要立即拿到列表的场景（如上下篇导航）使用。
 */
export function getPostMetas(): BlogPostMeta[] {
  return entries
    .map(({ loadContent: _, ...meta }) => meta)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * 获取全部文章元数据（不含正文）
 * registry 静态导入，同步可用；返回 Promise 保持接口兼容
 * 按日期倒序返回
 */
export function loadPosts(): Promise<BlogPostMeta[]> {
  return Promise.resolve(getPostMetas());
}

/**
 * 懒加载单篇文章（含正文）
 * 调用 registry 条目的 loadContent 按需加载 .md
 * 结果按 slug 缓存，重复访问同一文章直接复用 promise
 */
export function loadPost(slug: string): Promise<BlogPost | null> {
  let promise = postPromiseCache.get(slug);
  if (!promise) {
    promise = (async () => {
      const entry = entries.find((p) => p.slug === slug);
      if (!entry) {
        return null;
      }
      const { loadContent, ...meta } = entry;
      const { markdown: content } = await loadContent();
      return { ...meta, content };
    })();
    postPromiseCache.set(slug, promise);
  }
  return promise;
}

/**
 * 从 markdown 内容中提取 h2/h3/h4 标题作为 TOC
 * 自动跳过 fenced code block 中的 # 行
 * 始终提取 h2-h4 全部层级，由调用方按需过滤显示
 */
export function extractToc(markdown: string): TocItem[] {
  const lines = markdown.split("\n");
  const items: TocItem[] = [];
  let inCodeBlock = false;
  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) {
      continue;
    }
    const m = /^(#{2,4})\s+(.+?)\s*#*$/.exec(line);
    if (!m || m[1] === undefined || m[2] === undefined) {
      continue;
    }
    const level = m[1].length as 2 | 3 | 4;
    const text = m[2].trim();
    items.push({ level, text, id: slugify(text) });
  }
  return items;
}

/**
 * 按年份分组文章
 * 返回年份倒序的数组，每组内文章保持原顺序（已按日期倒序）
 */
export function groupByYear(
  posts: BlogPostMeta[],
): Array<{ year: string; posts: BlogPostMeta[] }> {
  const groups = new Map<string, BlogPostMeta[]>();
  for (const post of posts) {
    const year = post.date.slice(0, 4) || "未知";
    if (!groups.has(year)) {
      groups.set(year, []);
    }
    groups.get(year)!.push(post);
  }
  return [...groups.entries()]
    .map(([year, items]) => ({ year, posts: items }))
    .sort((a, b) => b.year.localeCompare(a.year));
}

/**
 * 收集所有不重复的标签及其出现次数
 * 按出现次数倒序排列
 */
export function collectTags(
  posts: BlogPostMeta[],
): Array<{ tag: string; count: number }> {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.tags || []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/**
 * 根据搜索关键词过滤文章
 * 匹配标题、摘要（大小写不敏感）
 */
export function filterPosts(posts: BlogPostMeta[], query: string): BlogPostMeta[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return posts;
  }
  return posts.filter(
    (p) => p.title.toLowerCase().includes(q) || p.excerpt?.toLowerCase().includes(q),
  );
}

/** 文章配图 URL 映射：源码路径 -> Vite 处理后的 URL，构建时由 ?url glob 生成 */
const imageUrls = import.meta.glob("/src/content/blog/**/*.{png,jpg,jpeg,gif,webp,svg}", {
  query: "?url",
  import: "default",
  eager: true,
}) as Record<string, string>;

/**
 * 将 markdown 中的图片 src 解析为 Vite URL
 * 绝对路径与 http(s) URL 原样返回；相对路径按文章所在年份目录 + 文件名查找映射。
 * 使 markdown 可用 ./xxx.png 相对路径（IDE 预览友好），运行时映射为构建时 URL
 */
export function resolveImage(src: string, year: string): string {
  if (src.startsWith("/") || /^https?:/.test(src)) {
    return src;
  }
  const filename = src.replace(/^\.\/+/, "");
  const key = `/src/content/blog/${year}/${filename}`;
  return imageUrls[key] ?? src;
}
