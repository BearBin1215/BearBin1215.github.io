import { describe, it, expect } from "vitest";
import {
  slugify,
  extractToc,
  groupByYear,
  collectTags,
  filterPosts,
  type BlogPostMeta,
} from "@/lib/blog";

/** 构造一篇 BlogPostMeta 的辅助函数，省略默认值 */
function makePost(overrides: Partial<BlogPostMeta> = {}): BlogPostMeta {
  return {
    slug: "test-post",
    title: "测试文章",
    date: "2026-01-01",
    tags: [],
    ...overrides,
  };
}

describe("slugify 生成锚点 id", () => {
  it("保留中文字符", () => {
    expect(slugify("abc标题中文")).toBe("abc标题中文");
  });

  it("英文转小写并以-分隔", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("非字母数字字符、空白字符统一替换为 -", () => {
    expect(slugify("😀 a/b\\c?d=e  a b  ")).toBe("a-b-c-d-e-a-b");
  });

  it("去除首尾的连字符", () => {
    expect(slugify("---标题---")).toBe("标题");
  });

  it("空字符串返回空字符串", () => {
    expect(slugify("")).toBe("");
  });

  it("仅特殊符号返回空字符串", () => {
    expect(slugify("???///")).toBe("");
  });
});

describe("extractToc 提取标题", () => {
  it("提取 h2/h3/h4 标题", () => {
    const md = `# h1\n## h2 标题\n### h3 标题\n#### h4 标题\n##### h5 标题\n`;
    const items = extractToc(md);
    expect(items).toHaveLength(3);
    expect(items[0]?.level).toBe(2);
    expect(items[0]?.text).toBe("h2 标题");
    expect(items[1]?.level).toBe(3);
    expect(items[2]?.level).toBe(4);
  });

  it("跳过 fenced code block 中的 # 行", () => {
    const md = `## 真标题\n\`\`\`ts\n## 这不是标题\n### 也不是\n\`\`\`\n## 又是真的\n`;
    const items = extractToc(md);
    expect(items).toHaveLength(2);
    expect(items[0]?.text).toBe("真标题");
    expect(items[1]?.text).toBe("又是真的");
  });

  it("处理标题尾部的 #（ATX 风格闭合）", () => {
    const md = `## 标题 ##\n### 另一个 ###\n`;
    const items = extractToc(md);
    expect(items).toHaveLength(2);
    expect(items[0]?.text).toBe("标题");
    expect(items[1]?.text).toBe("另一个");
  });

  it("为每项生成 slugify 后的 id", () => {
    const items = extractToc("## Hello World\n");
    expect(items[0]?.id).toBe("hello-world");
  });

  it("不提取 h1 与 h5+", () => {
    const md = `# h1\n##### h5\n###### h6\n`;
    expect(extractToc(md)).toEqual([]);
  });

  it("空字符串返回空数组", () => {
    expect(extractToc("")).toEqual([]);
  });
});

describe("groupByYear 文章年份分组", () => {
  it("按年份分组并倒序", () => {
    const posts = [
      makePost({ slug: "a", date: "2025-01-01" }),
      makePost({ slug: "b", date: "2026-01-01" }),
      makePost({ slug: "c", date: "2025-06-01" }),
    ];
    const groups = groupByYear(posts);
    expect(groups.map((g) => g.year)).toEqual(["2026", "2025"]);
    expect(groups[0]?.posts).toHaveLength(1);
    expect(groups[1]?.posts).toHaveLength(2);
  });

  it("同年内保持原顺序", () => {
    const posts = [
      makePost({ slug: "first", date: "2026-01-01" }),
      makePost({ slug: "second", date: "2026-06-01" }),
    ];
    const groups = groupByYear(posts);
    expect(groups[0]?.posts.map((p) => p.slug)).toEqual(["first", "second"]);
  });

  it("空列表返回空数组", () => {
    expect(groupByYear([])).toEqual([]);
  });
});

describe("collectTags 统计标签次数", () => {
  it("统计标签出现次数", () => {
    const posts = [
      makePost({ tags: ["a", "b"] }),
      makePost({ tags: ["a", "c"] }),
      makePost({ tags: ["a"] }),
    ];
    const tags = collectTags(posts);
    expect(tags).toEqual([
      { tag: "a", count: 3 },
      { tag: "b", count: 1 },
      { tag: "c", count: 1 },
    ]);
  });

  it("按出现次数倒序，次数相同按字母序升序", () => {
    const posts = [
      makePost({ tags: ["zeta", "alpha"] }),
      makePost({ tags: ["alpha", "mid"] }),
      makePost({ tags: ["zeta"] }),
    ];
    const tags = collectTags(posts);
    expect(tags.map((t) => t.tag)).toEqual(["alpha", "zeta", "mid"]);
  });

  it("空列表返回空数组", () => {
    expect(collectTags([])).toEqual([]);
  });
});

describe("filterPosts 关键词过滤文章", () => {
  const posts = [
    makePost({ slug: "a", title: "TypeScript 入门", excerpt: "TS 基础" }),
    makePost({ slug: "b", title: "Rust 笔记", excerpt: "内存安全" }),
    makePost({ slug: "c", title: "随笔", excerpt: "日常" }),
  ];

  it("匹配标题（大小写不敏感）", () => {
    const result = filterPosts(posts, "typescript");
    expect(result.map((p) => p.slug)).toEqual(["a"]);
  });

  it("匹配摘要", () => {
    const result = filterPosts(posts, "内存安全");
    expect(result.map((p) => p.slug)).toEqual(["b"]);
  });

  it("空查询返回全部", () => {
    expect(filterPosts(posts, "")).toHaveLength(3);
  });

  it("仅空白字符的查询等同于空查询", () => {
    expect(filterPosts(posts, "   ")).toHaveLength(3);
  });

  it("无匹配返回空数组", () => {
    expect(filterPosts(posts, "不存在的关键词xyz")).toEqual([]);
  });
});
