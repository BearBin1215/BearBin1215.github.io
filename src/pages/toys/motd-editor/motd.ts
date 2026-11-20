/**
 * Minecraft MOTD 文档模型，以及它与各种编码格式之间的纯函数转换。
 * 编辑时按码点保存每个字符的样式，与游戏编码分开存储；
 * 序列化时再按 § 格式码的规则（颜色码会清空所有格式）补写重置码与格式码。
 */

/** 经典 16 色条目 */
interface ColorEntry {
  /** § 色码（0-9 与 a-f，不含 § 前缀） */
  code: string;
  /** JSON 文本组件中的色名 */
  name: string;
  /** 颜色值，统一小写 #rrggbb */
  hex: string;
}

/** 经典 16 色对照表，顺序与色码 0-f 一致 */
export const COLORS: readonly ColorEntry[] = [
  { code: "0", name: "black", hex: "#000000" },
  { code: "1", name: "dark_blue", hex: "#0000aa" },
  { code: "2", name: "dark_green", hex: "#00aa00" },
  { code: "3", name: "dark_aqua", hex: "#00aaaa" },
  { code: "4", name: "dark_red", hex: "#aa0000" },
  { code: "5", name: "dark_purple", hex: "#aa00aa" },
  { code: "6", name: "gold", hex: "#ffaa00" },
  { code: "7", name: "gray", hex: "#aaaaaa" },
  { code: "8", name: "dark_gray", hex: "#555555" },
  { code: "9", name: "blue", hex: "#5555ff" },
  { code: "a", name: "green", hex: "#55ff55" },
  { code: "b", name: "aqua", hex: "#55ffff" },
  { code: "c", name: "red", hex: "#ff5555" },
  { code: "d", name: "light_purple", hex: "#ff55ff" },
  { code: "e", name: "yellow", hex: "#ffff55" },
  { code: "f", name: "white", hex: "#ffffff" },
];

/** 可以单独开关的格式字段 */
export type FormatKey = "bold" | "italic" | "underlined" | "strikethrough" | "obfuscated";

/** 单个字符的可视样式，编辑时各属性互不影响 */
export interface CharStyle {
  /** 颜色 #rrggbb，null 表示游戏默认白色 */
  color: string | null;
  /** 加粗 */
  bold: boolean;
  /** 斜体 */
  italic: boolean;
  /** 下划线 */
  underlined: boolean;
  /** 删除线 */
  strikethrough: boolean;
  /** 乱码（客户端会随机替换字形） */
  obfuscated: boolean;
}

/** 编辑文档：styles 与 text 的码点一一对应 */
export interface MotdDoc {
  /** 纯文本内容，换行符分隔多行 */
  text: string;
  /** 每个码点的样式，长度与 text 的码点数一致 */
  styles: CharStyle[];
}

/** 合并相邻同样式字符后的文本片段 */
interface Segment {
  /** 片段文本，可能包含换行符 */
  text: string;
  /** 片段内所有字符共用的样式 */
  style: CharStyle;
}

/** 默认样式：白色，不带任何格式 */
export const DEFAULT_STYLE: CharStyle = {
  color: null,
  bold: false,
  italic: false,
  underlined: false,
  strikethrough: false,
  obfuscated: false,
};

/** 单行的建议字符数，超出后游戏内可能换行或显示异常 */
export const LINE_SOFT_LIMIT = 59;

/** MOTD 在服务器列表中最多显示的行数 */
export const MOTD_MAX_LINES = 2;

/** 合法的样式颜色写法 */
const STYLE_COLOR = /^#[0-9a-f]{6}$/i;

/**
 * 判断读到的样式对象是否合法，用于校验本地草稿
 * @param value 待校验的值
 */
function isCharStyle(value: unknown): value is CharStyle {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const style = value as Partial<CharStyle>;
  return (
    (style.color === null ||
      (typeof style.color === "string" && STYLE_COLOR.test(style.color))) &&
    typeof style.bold === "boolean" &&
    typeof style.italic === "boolean" &&
    typeof style.underlined === "boolean" &&
    typeof style.strikethrough === "boolean" &&
    typeof style.obfuscated === "boolean"
  );
}

/**
 * 判断读到的文档是否合法：样式数量必须与码点数一致
 * @param value 待校验的值
 */
export function isMotdDoc(value: unknown): value is MotdDoc {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const doc = value as Partial<MotdDoc>;
  return (
    typeof doc.text === "string" &&
    Array.isArray(doc.styles) &&
    doc.styles.length === Array.from(doc.text).length &&
    doc.styles.every(isCharStyle)
  );
}

/** 格式码对照表，CharStyle 字段名与 JSON 文本组件字段名一致 */
const FORMAT_CODES: readonly { key: FormatKey; code: string }[] = [
  { key: "obfuscated", code: "k" },
  { key: "bold", code: "l" },
  { key: "strikethrough", code: "m" },
  { key: "underlined", code: "n" },
  { key: "italic", code: "o" },
];

const COLOR_BY_CODE = new Map(COLORS.map((c) => [c.code, c]));
const COLOR_BY_HEX = new Map(COLORS.map((c) => [c.hex, c]));
const FLAG_BY_CODE = new Map(FORMAT_CODES.map((f) => [f.code, f.key]));

const HEX_DIGIT = /^[0-9a-f]$/i;
const HEX_COLOR = /^[0-9a-f]{6}$/i;

/** 判断两个样式是否完全相同 */
function stylesEqual(a: CharStyle, b: CharStyle): boolean {
  return (
    a.color === b.color &&
    a.bold === b.bold &&
    a.italic === b.italic &&
    a.underlined === b.underlined &&
    a.strikethrough === b.strikethrough &&
    a.obfuscated === b.obfuscated
  );
}

/** 取指定码点索引处的样式，越界返回默认样式 */
export function styleAt(doc: MotdDoc, index: number): CharStyle {
  return doc.styles[index] ?? DEFAULT_STYLE;
}

/**
 * 把 UTF-16 下标（textarea 的 selectionStart/End）换算为码点下标
 * @param text 完整文本
 * @param utf16Index UTF-16 下标
 */
export function toCodePointIndex(text: string, utf16Index: number): number {
  return Array.from(text.slice(0, utf16Index)).length;
}

/**
 * 统计每行字符数
 * @param text 完整文本
 * @returns 每行的码点数数组，至少含一项
 */
export function charCountByLine(text: string): number[] {
  return text.split("\n").map((line) => Array.from(line).length);
}

/**
 * 计算游戏内文字阴影色：每个通道取 1/4
 * @param hex 前景色 #rrggbb
 */
export function shadowColor(hex: string): string {
  const value = Number.parseInt(hex.slice(1, 7), 16);
  const channel = (shift: number) =>
    Math.floor(((value >> shift) & 0xff) / 4)
      .toString(16)
      .padStart(2, "0");
  return `#${channel(16)}${channel(8)}${channel(0)}`;
}

/** 解析出的格式码结果 */
interface ParsedCode {
  /** 格式码结束后的字符下标（不含） */
  end: number;
  /** 应用该格式码后的完整样式 */
  style: CharStyle;
}

/**
 * 尝试在指定位置读取一个格式码
 * @param chars 文本码点数组
 * @param start 前缀字符（§ 或 &）的下标
 * @param current 当前样式，格式码在此基础上叠加
 * @returns 无效格式码返回 null，此时该前缀按普通字符处理
 */
function readCode(chars: string[], start: number, current: CharStyle): ParsedCode | null {
  const next = chars[start + 1]?.toLowerCase();
  if (next === undefined) {
    return null;
  }

  // 插件常用的 &#rrggbb 写法
  if (next === "#") {
    const hex = chars.slice(start + 2, start + 8).join("");
    if (!HEX_COLOR.test(hex)) {
      return null;
    }
    return {
      end: start + 8,
      style: { ...DEFAULT_STYLE, color: `#${hex.toLowerCase()}` },
    };
  }

  // 原版 1.16+ 的 §x§r§r§g§g§b§b 写法
  if (next === "x") {
    const digits: string[] = [];
    let index = start + 2;
    while (digits.length < 6) {
      const prefix = chars[index];
      const digit = chars[index + 1];
      if (
        (prefix !== "§" && prefix !== "&") ||
        digit === undefined ||
        !HEX_DIGIT.test(digit)
      ) {
        break;
      }
      digits.push(digit);
      index += 2;
    }
    if (digits.length !== 6) {
      return null;
    }
    return {
      end: index,
      style: { ...DEFAULT_STYLE, color: `#${digits.join("").toLowerCase()}` },
    };
  }

  if (next === "r") {
    return { end: start + 2, style: DEFAULT_STYLE };
  }

  const color = COLOR_BY_CODE.get(next);
  if (color) {
    // 颜色码会清空所有格式，与游戏行为保持一致
    return { end: start + 2, style: { ...DEFAULT_STYLE, color: color.hex } };
  }

  const flag = FLAG_BY_CODE.get(next);
  if (flag) {
    return { end: start + 2, style: { ...current, [flag]: true } };
  }

  return null;
}

/**
 * 还原转义与 `motd=` 前缀：`\u00A7` → §、`\n` → 换行、`\\` → 反斜杠
 * @param input 用户粘贴的原始字符串
 */
function normalizeInput(input: string): string {
  return input
    .replace(/^\s*motd\s*=\s*/i, "")
    .replace(/\\(u00a7|n|\\)/gi, (_match: string, group: string) => {
      const lower = group.toLowerCase();
      if (lower === "n") {
        return "\n";
      }
      return lower === "\\" ? "\\" : "§";
    });
}

/**
 * 解析 § / & 格式字符串为编辑文档
 * 支持 § 与 & 前缀、16 色、k l m n o r、§x 十六进制、&#rrggbb、
 * 以及 server.properties 中的 \u00A7 与 \n 转义
 * @param input 原始字符串
 */
export function parseMotd(input: string): MotdDoc {
  const chars = Array.from(normalizeInput(input));
  const text: string[] = [];
  const styles: CharStyle[] = [];
  let current = DEFAULT_STYLE;

  for (let index = 0; index < chars.length; index++) {
    const char = chars[index];
    if (char === undefined) {
      break;
    }
    if (char === "§" || char === "&") {
      const code = readCode(chars, index, current);
      if (code) {
        current = code.style;
        index = code.end - 1;
        continue;
      }
    }
    text.push(char);
    styles.push(current);
  }

  return { text: text.join(""), styles };
}

/** 会被游戏当作格式码的片段：§x 十六进制、§#rrggbb 与单字符码 */
const FORMAT_CODE = /§(?:x(?:§[0-9a-f]){6}|#[0-9a-f]{6}|[0-9a-fk-or])/gi;

/**
 * 去掉文本里会被游戏当成格式码的片段，孤立的 § 原样保留。
 * 用于编辑区过滤误输入的格式码，避免它们破坏输出结果。
 * @param text 原始文本
 */
export function stripFormatCodes(text: string): string {
  return text.replace(FORMAT_CODE, "");
}

/**
 * 按换行切分并把相邻同样式字符合并为片段
 * @param splitNewline 是否在换行处切分（否则换行保留在片段文本中）
 */
function groupRuns(doc: MotdDoc, splitNewline: boolean): Segment[][] {
  const chars = Array.from(doc.text);
  const lines: Segment[][] = [[]];
  let text = "";
  let style: CharStyle | null = null;

  const flush = () => {
    if (style && text) {
      lines[lines.length - 1]?.push({ text, style });
    }
    text = "";
    style = null;
  };

  for (let index = 0; index < chars.length; index++) {
    const char = chars[index];
    if (splitNewline && char === "\n") {
      flush();
      lines.push([]);
      continue;
    }
    const charStyle = doc.styles[index] ?? DEFAULT_STYLE;
    if (style && !stylesEqual(style, charStyle)) {
      flush();
    }
    style = charStyle;
    text += char;
  }
  flush();
  return lines;
}

/** 把文档合并为同样式片段序列，换行保留在片段文本内 */
export function toSegments(doc: MotdDoc): Segment[] {
  return groupRuns(doc, false)[0] ?? [];
}

/** 序列化选项 */
interface SerializeOptions {
  /** 格式码前缀 */
  prefix: "§" | "&";
  /** 自定义颜色的写法：原版 §x 序列或插件常用的 #rrggbb */
  hex: "legacy" | "hash";
}

/** 按指定前缀与十六进制写法序列化为格式串 */
function serialize(doc: MotdDoc, { prefix, hex }: SerializeOptions): string {
  const parts: string[] = [];
  let current: CharStyle = DEFAULT_STYLE;

  /** 写入颜色码，并把当前状态同步为「只有该颜色」 */
  const emitColorCode = (color: string) => {
    const classic = COLOR_BY_HEX.get(color);
    if (classic) {
      parts.push(`${prefix}${classic.code}`);
    } else if (hex === "hash") {
      parts.push(`${prefix}#${color.slice(1)}`);
    } else {
      const digits = color.slice(1).split("");
      parts.push(`${prefix}x${digits.map((d) => `${prefix}${d}`).join("")}`);
    }
    current = { ...DEFAULT_STYLE, color };
  };

  for (const segment of toSegments(doc)) {
    const { style } = segment;
    if (style.color !== current.color) {
      if (style.color === null) {
        parts.push(`${prefix}r`);
        current = DEFAULT_STYLE;
      } else {
        emitColorCode(style.color);
      }
    }
    // § 格式码无法单独关闭某个格式：再写一次颜色码即可清空格式，默认色只能靠重置
    let needClear = false;
    for (const { key } of FORMAT_CODES) {
      if (current[key] && !style[key]) {
        needClear = true;
        break;
      }
    }
    if (needClear) {
      if (style.color !== null) {
        emitColorCode(style.color);
      } else {
        parts.push(`${prefix}r`);
        current = DEFAULT_STYLE;
      }
    }
    for (const { key, code } of FORMAT_CODES) {
      if (style[key] && !current[key]) {
        parts.push(`${prefix}${code}`);
        current = { ...current, [key]: true };
      }
    }
    parts.push(segment.text);
  }

  return parts.join("");
}

/** 序列化为 § 格式串，可直接用于插件配置与聊天栏 */
export function toLegacy(doc: MotdDoc): string {
  return serialize(doc, { prefix: "§", hex: "legacy" });
}

/** 序列化为 & 格式串，仅插件会转换，原版不识别 */
export function toAmpersand(doc: MotdDoc): string {
  return serialize(doc, { prefix: "&", hex: "hash" });
}

/**
 * 序列化为 server.properties 的 motd 行：
 * § 转义为 \u00A7、换行转义为 \n、反斜杠转义为 \\
 */
export function toProperties(doc: MotdDoc): string {
  const escaped = toLegacy(doc)
    .replace(/\\/g, "\\\\")
    .replace(/§/g, "\\u00A7")
    .replace(/\n/g, "\\n");
  return `motd=${escaped}`;
}

/** 把片段转为 JSON 文本组件 */
function componentOf({ text, style }: Segment): Record<string, unknown> {
  const component: Record<string, unknown> = { text };
  if (style.color) {
    const classic = COLOR_BY_HEX.get(style.color);
    component.color = classic ? classic.name : style.color;
  }
  for (const { key } of FORMAT_CODES) {
    if (style[key]) {
      component[key] = true;
    }
  }
  return component;
}

/**
 * 序列化为 JSON 文本组件，换行以 {"text":"\n"} 表示
 * @param doc 编辑文档
 * @param space 缩进空格数，用于复制时美化
 */
export function toJSON(doc: MotdDoc, space?: number): string {
  const extra: Record<string, unknown>[] = [];
  // 按行切分，行与行之间插入独立的换行组件
  groupRuns(doc, true).forEach((line, index) => {
    if (index > 0) {
      extra.push({ text: "\n" });
    }
    for (const segment of line) {
      extra.push(componentOf(segment));
    }
  });
  return JSON.stringify({ text: "", extra }, null, space);
}

/**
 * 把区间限制在有效范围内
 * @returns 有效时返回 [start, end)，否则返回 null
 */
function range(doc: MotdDoc, start: number, end: number): [number, number] | null {
  const from = Math.max(0, Math.min(start, doc.styles.length));
  const to = Math.max(0, Math.min(end, doc.styles.length));
  return from < to ? [from, to] : null;
}

/**
 * 返回把指定格式字段设为指定值的样式副本，其余字段不变
 * @param style 原始样式
 * @param key 格式字段
 * @param value 目标值
 */
export function withFormat(style: CharStyle, key: FormatKey, value: boolean): CharStyle {
  const next = { ...style };
  next[key] = value;
  return next;
}

/**
 * 修改区间内字符的样式，未指定的字段保持不变
 * @param doc 编辑文档
 * @param start 起始码点下标（含）
 * @param end 结束码点下标（不含）
 * @param patch 需要修改的样式字段
 */
export function applyStyle(
  doc: MotdDoc,
  start: number,
  end: number,
  patch: Partial<CharStyle>,
): MotdDoc {
  const target = range(doc, start, end);
  if (!target) {
    return doc;
  }
  const styles = doc.styles.slice();
  let changed = false;
  for (let index = target[0]; index < target[1]; index++) {
    const current = styles[index] ?? DEFAULT_STYLE;
    const next = { ...current, ...patch };
    if (!stylesEqual(current, next)) {
      styles[index] = next;
      changed = true;
    }
  }
  return changed ? { ...doc, styles } : doc;
}

/**
 * 切换区间内某个格式：区间内全部启用时关闭，否则全部启用
 * @param doc 编辑文档
 * @param start 起始码点下标（含）
 * @param end 结束码点下标（不含）
 * @param key 格式字段
 */
export function toggleStyle(
  doc: MotdDoc,
  start: number,
  end: number,
  key: FormatKey,
): MotdDoc {
  const target = range(doc, start, end);
  if (!target) {
    return doc;
  }
  let enabled = true;
  for (let index = target[0]; index < target[1]; index++) {
    if (!styleAt(doc, index)[key]) {
      enabled = false;
      break;
    }
  }
  const styles = doc.styles.slice();
  let changed = false;
  for (let index = target[0]; index < target[1]; index++) {
    const current = styles[index] ?? DEFAULT_STYLE;
    if (current[key] !== !enabled) {
      styles[index] = withFormat(current, key, !enabled);
      changed = true;
    }
  }
  return changed ? { ...doc, styles } : doc;
}

/**
 * 清除区间内所有样式，恢复为默认白色无格式
 * @param doc 编辑文档
 * @param start 起始码点下标（含）
 * @param end 结束码点下标（不含）
 */
export function clearStyle(doc: MotdDoc, start: number, end: number): MotdDoc {
  return applyStyle(doc, start, end, DEFAULT_STYLE);
}

/**
 * 文本改动后重新分配样式：相同的前后缀保留原样式，
 * 新输入的字符默认继承插入点前一个字符的样式
 * @param doc 修改前的文档
 * @param nextText 修改后的全文
 * @param inherit 指定新输入字符使用的样式（例如工具条里待应用的颜色），传 null 或不传时继承前一个字符
 */
export function remapStyles(
  doc: MotdDoc,
  nextText: string,
  inherit?: CharStyle | null,
): MotdDoc {
  const previous = Array.from(doc.text);
  const next = Array.from(nextText);

  let prefix = 0;
  while (
    prefix < previous.length &&
    prefix < next.length &&
    previous[prefix] === next[prefix]
  ) {
    prefix++;
  }

  let suffix = 0;
  while (
    suffix < previous.length - prefix &&
    suffix < next.length - prefix &&
    previous[previous.length - 1 - suffix] === next[next.length - 1 - suffix]
  ) {
    suffix++;
  }

  const inherited: CharStyle =
    inherit ?? (prefix > 0 ? doc.styles[prefix - 1] : undefined) ?? DEFAULT_STYLE;
  const inserted = new Array<CharStyle>(next.length - prefix - suffix).fill(inherited);
  const styles = [
    ...doc.styles.slice(0, prefix),
    ...inserted,
    ...doc.styles.slice(previous.length - suffix),
  ];

  return { text: nextText, styles };
}

/**
 * 只保留前若干行，文本与样式一起裁剪
 * @param doc 编辑文档
 * @param maxLines 保留的行数
 * @returns 内容未超出时返回原对象
 */
export function clipLines(doc: MotdDoc, maxLines: number): MotdDoc {
  const chars = Array.from(doc.text);
  let newlines = 0;
  for (let index = 0; index < chars.length; index++) {
    if (chars[index] !== "\n") {
      continue;
    }
    newlines++;
    if (newlines === maxLines) {
      return {
        text: chars.slice(0, index).join(""),
        styles: doc.styles.slice(0, index),
      };
    }
  }
  return doc;
}
