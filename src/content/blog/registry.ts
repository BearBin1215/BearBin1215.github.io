import type { BlogPostEntry } from "@/lib/blog";

/** 博客文章注册表：新增文章时在此添加条目，并创建对应 .md */
const posts: BlogPostEntry[] = [
  {
    slug: "0727-battle-of-penghu",
    title: "谈《澎湖海战》的影响",
    excerpt: "不只关乎历史认知，更潜藏着严峻的现实风险。",
    date: "2026-07-27",
    tags: ["思考", "时事"],
    loadContent: () => import("./2026/0727-battle-of-penghu.md"),
  },
  {
    slug: "0709-will-ai-make-work-staggered",
    title: "关于AI和错峰上班",
    date: "2026-07-09",
    excerpt: "从电力峰谷到算力潮汐，算力峰谷价差是否会推动企业调整用工安排？",
    tags: ["思考"],
    loadContent: () => import("./2026/0709-will-ai-make-work-staggered.md"),
  },
];

export { posts };
