import type { BlogPostEntry } from "@/lib/blog";

/**
 * 博客文章注册表
 * 新增文章时在此添加条目，并创建对应 .md（纯正文，无 frontmatter）。
 * 元数据在此手写作为唯一来源，正文按需动态加载，避免列表/首页加载全部 .md。
 */
const posts: BlogPostEntry[] = [
  {
    slug: "0709-will-ai-make-work-staggered",
    title: "关于AI和错峰上班",
    date: "2026-07-09",
    excerpt: "从电力峰谷到算力潮汐，算力峰谷价差是否会推动企业调整用工安排",
    tags: ["思考"],
    loadContent: () => import("./2026/0709-will-ai-make-work-staggered.md"),
  },
  {
    slug: "0000-example",
    title: "示例文章",
    date: "2026-01-01",
    excerpt: "演示博客支持的 Markdown 格式，可作为新文章的模板参考。",
    tags: ["示例"],
    loadContent: () => import("./2026/0000-example.md"),
  },
];

export { posts };
