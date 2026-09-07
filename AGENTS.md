## 项目概述

GitHub Pages 个人博客项目，处于早期开发阶段。

## 技术栈

- **框架**: React 19
- **路由**：React Router v8（无需额外引入react-router-dom）
- **UI组件库**: shadcn/ui
- **图标库**：lucide-react, @icons-pack/react-simple-icons, @ant-design/icons
- **样式**: Tailwind CSS v4
- **语言**: TypeScript
- **包管理**: pnpm
- **代码规范**: oxlint + oxfmt

## 对话

- 面向中文用户，**对话、输出文档都使用中文**
- 如果用户提出的需求或设计较为笼统，有多个方案可以使用，**列出方案让用户选择**

## 视觉综述

个人博客项目，视觉设计自由度高。总体要求如下：

- 组件库优先使用 shadcn/ui 以保证高度定制化。需要图标时，尽可能使用现有的成熟、流行图标库，没有才考虑自己添加
- 要求从0到1给出设计、或大幅度修改现有布局时，如果有多个备选方案，详细列出并让用户选择
- 总体风格简洁，如果没有特别说明，避免过于大幅度的动效、非常鲜艳的色彩
- 设计大块元素（如卡片、侧边栏）时考虑背景图片显示效果，保持一定背景透明度
- 需要适配浅色、深色模式显示效果
- 使用响应式布局兼容移动端

## 常用指令


```bash
# 启动开发服务器
pnpm dev

# 类型检查
pnpm typecheck

# 代码规范检查
pnpm lint

# 代码格式化
pnpm format

# 添加 shadcn/ui 组件
pnpm dlx shadcn@latest add 组件名
```

## 项目结构

仅展示大致结构，`<占位符>` 与 `*` 表示对应位置是动态值或同类文件：

```text
src/
├── assets/               # 静态资源（背景图、logo、音乐等）
├── components/
│   ├── layout/           # 全局布局组件（Header、Footer、Layout 等）
│   ├── ui/               # shadcn/ui 组件目录（按需添加）
│   ├── audio-controller.tsx   # 全局 audio 元素，由 zustand store 驱动
│   ├── background.tsx    # 背景图轮播
│   ├── loading-placeholder.tsx
│   ├── music-player.tsx  # 音乐播放器 UI（状态来自 store）
│   ├── section-title.tsx
│   └── theme-provider.tsx
├── content/
│   └── blog/<year>/*.md  # 博客文章，按年份分子目录存放
├── hooks/
│   └── use-local-storage.ts
├── lib/
│   ├── blog.ts           # 博客文章加载、frontmatter 解析、TOC 提取
│   └── utils.ts          # cn 等通用工具函数
├── pages/
│   ├── about/            # 关于页
│   ├── blog/             # 杂记页（列表 + 文章详情 + 入口页）
│   ├── home/             # 首页
│   └── toys/             # 玩具页
├── stores/
│   └── music-player.tsx  # 音乐播放器全局状态（zustand）
├── App.tsx
├── index.css             # Tailwind v4 入口与全局样式
├── main.tsx
└── router.tsx            # 路由配置（createBrowserRouter + lazy）
test/                     # 测试脚本
```

## 代码规范

### TypeScript

- 多次使用的变量、通用组件、工具函数都应有对应的jsdoc注释，复杂逻辑需要描述逻辑
- 接口定义的每个属性都要有对应jsdoc注释，除非是 id/key 等唯一标识符等一眼能看出含义的属性
- 代码修改后，不要注释说明这里曾经是什么样，只说明最新代码（除非要提醒开发者不要使用废弃方案）
- 每次涉及ts的代码修改后运行 `pnpm typecheck`、`pnpm lint`、`pnpm format` 检查类型和规范错误

## 代码审查

- 如果没有特别要求，代码审查应该覆盖以下基础指标：
  - 模块化程度是否合理，有无应提取的公共模块，有无应当引入npm包简化的代码
  - 圈复杂度、嵌套深度等复杂度指标是否合理
  - 单一组件/函数是否职责过重/过轻
  - 指定的审查范围内代码风格是否和其他代码一致
  - 注释是否人类可读，是否合理划分函数前注释和行间注释
- 审查注释时应检查有无反复修改导致的冗余：
  - 例如一开始选择A方案、后来改用B方案，可能残留“不使用A方案是因为XXXX”冗余注释
  - 反复修改可能产生 `A(原方案) + B(补丁1) + C(补丁2) - B(补丁3)` 此类后面补丁抵消前面补丁的场景
  - 早先版本文件导出一个函数（或引入了某个依赖）并在另一个文件使用，后续删除使用方可能未删除导出，lint检查不到此类情况
- 修复审查问题后，除非仅修改注释等不产生实际影响的内容，若工具支持内置浏览器测试，应当测试无误
