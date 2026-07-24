# 博客文章编写指南

本项目博客文章使用 Markdown 编写，由 `react-markdown` + `remark-gfm` + `rehype-highlight`（基于 highlight.js）渲染。本文档说明如何添加新文章，以及与普通 Markdown 的差异。

## 添加新文章

在 `src/content/blog/` 目录下新建 `.md` 文件即可，文件名作为 URL slug。

例如：`src/content/blog/my-first-post.md` → 访问路径 `/blog/my-first-post`。

新增文件后无需修改任何代码，菜单、列表、TOC 会自动更新。

## Frontmatter

每个 `.md` 文件**必须**以 YAML frontmatter 开头（被 `---` 包裹），定义文章元数据：

```md
---
title: 文章标题
date: 2026-07-19
tags:
  - 标签1
  - 标签2
excerpt: 摘要，显示在文章标题下方，可选
---

正文从这里开始...
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| `title` | string | 是 | 文章标题，显示为 h1 |
| `date` | string | 是 | 发布日期，格式 `YYYY-MM-DD`，用于排序与按年分组 |
| `tags` | string[] | 否 | 标签列表，用于菜单标签筛选 |
| `excerpt` | string | 否 | 摘要，显示在标题下方 |

### Frontmatter 解析限制

本项目使用自实现的迷你 frontmatter 解析器（见 `src/lib/blog.ts`），仅支持以下 YAML 子集：

- 标量键值对：`key: value`
- 字符串块状数组：`key:` 换行后每行 `- item`
- 字符串两端可选引号（单引号或双引号）

**不支持**：嵌套对象、行内数组 `[a, b]`、多行字符串、数字/布尔类型（所有值按字符串处理）。

## 与普通 Markdown 的区别

正文部分遵循 [CommonMark](https://commonmark.org/) + [GFM](https://github.github.com/gfm/) 规范，但有以下差异：

### 自动行为

| 行为 | 说明 |
| ---- | ---- |
| 链接新窗口打开 | 所有 `[text](url)` 链接自动添加 `target="_blank" rel="noopener noreferrer"` |
| 代码高亮 | fenced code block 自动通过 highlight.js 高亮，需指定语言（如 ``` ```ts ```）。浅色与深色模式分别使用 github.css 与 github-dark.css 主题，由 `.dark` 作用域自动切换 |
| TOC 提取 | `##` 和 `###` 标题自动提取到右侧目录，点击可跳转 |
| 锚点 id | 标题文本经 `slugify` 处理生成锚点（中文保留，其他非字母数字字符替换为连字符） |

### 样式约束

- 代码块跟随页面主题切换：浅色模式 github.css，深色模式 github-dark.css 配色，背景按 67% 透明度混合以透出页面背景图
- 文章最大宽度 `max-w-4xl`（896px），超出居中显示
- 标题层级建议从 `##`（h2）开始，`#`（h1）由 frontmatter 的 `title` 渲染，正文中不应再使用 `#`

### 支持的 GFM 扩展

- 表格
- 任务列表（`- [x]` / `- [ ]`）
- 删除线（`~~text~~`）
- 自动链接 URL

## 示例

参考 [src/content/blog/example.md](../src/content/blog/example.md)，包含所有受支持格式的演示。

## 文件命名约定

- 使用小写英文 + 连字符：`my-post.md`、`react-patterns.md`
- 避免中文文件名、空格、下划线
- 文件名即为 URL slug，应保持简洁可读

## 技术实现

文章加载流程（见 `src/lib/blog.ts`）：

1. 构建时 `import.meta.glob('/src/content/blog/*.md', { query: '?raw' })` 为每个 `.md` 生成独立 chunk
2. 运行时 `loadPosts()` 并行加载所有文章（用于菜单），通过缓存 promise 避免重复加载
3. `loadPost(slug)` 仅加载单篇文章（用于详情页），实现懒加载
4. frontmatter 由自实现解析器处理，正文交由 `react-markdown` 渲染

修改渲染行为（如自定义组件、插件）见 `src/pages/blog/post.tsx` 中的 `markdownComponents`。
