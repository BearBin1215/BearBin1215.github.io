import type { Plugin } from "unified";

/**
 * B 站视频指令正则：匹配 `:::bilibili BV号 [p=分P]` 独立段落。
 * 分组 1 为 BV 号，分组 2 为可选的 p（分 P）序号。
 */
const BILIBILI_DIRECTIVE_RE = /^:::\s*bilibili\s+(BV[0-9A-Za-z]+)(?:\s+p=(\d+))?\s*$/;

/** 最小化 mdast 节点结构，避免依赖 mdast 类型包 */
interface MdastNode {
  type: string;
  value?: string;
  children?: MdastNode[];
  data?: Record<string, unknown>;
}

/** 递归遍历 mdast 树中的所有节点 */
function walk(node: MdastNode, visit: (node: MdastNode) => void) {
  visit(node);
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      walk(child, visit);
    }
  }
}

/**
 * remark 插件：将 `:::bilibili BV号 [p=分P]` 指令行转换为 B 站 iframe 播放器。
 * 通过 mdast-util-to-hast 支持的 `data.hName` / `data.hProperties` / `data.hChildren`
 * 机制，把匹配的段落节点改写成 iframe 元素，由渲染端自定义 iframe 组件统一包装样式。
 * 未匹配的段落原样保留，不产生副作用。
 */
export const remarkBilibili: Plugin = () => {
  return (tree) => {
    walk(tree as MdastNode, (node) => {
      if (node.type !== "paragraph") {
        return;
      }
      const text = (node.children ?? [])
        .filter((child) => child.type === "text" && typeof child.value === "string")
        .map((child) => child.value)
        .join("")
        .trim();
      const match = BILIBILI_DIRECTIVE_RE.exec(text);
      if (!match) {
        return;
      }
      // 正则已保证 BV 号捕获组非空，此处用非空断言消除 undefined 类型
      const bvid = match[1]!;
      const p = match[2];
      const src = new URL("https://player.bilibili.com/player.html");
      src.search = new URLSearchParams({
        isOutside: "true",
        bvid,
        p: p ?? "1",
        poster: "true",
        autoplay: "false",
      }).toString();
      node.data = {
        hName: "iframe",
        hProperties: {
          src: src.toString(),
          title: `B站视频 ${bvid}`,
          allow: "autoplay; encrypted-media; picture-in-picture; fullscreen",
        },
        hChildren: [],
      };
    });
  };
};
