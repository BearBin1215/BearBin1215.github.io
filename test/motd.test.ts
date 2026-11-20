import { describe, expect, it } from "vitest";
import {
  applyStyle,
  charCountByLine,
  clearStyle,
  clipLines,
  DEFAULT_STYLE,
  isMotdDoc,
  parseMotd,
  remapStyles,
  shadowColor,
  stripFormatCodes,
  styleAt,
  toAmpersand,
  toCodePointIndex,
  toJSON,
  toLegacy,
  toProperties,
  toggleStyle,
} from "@/pages/toys/motd-editor/motd";

describe("MOTD 解析", () => {
  it("解析经典颜色与格式码", () => {
    const doc = parseMotd("§6§lHello §7World");
    expect(doc.text).toBe("Hello World");
    expect(styleAt(doc, 0)).toMatchObject({ color: "#ffaa00", bold: true });
    expect(styleAt(doc, 6)).toMatchObject({ color: "#aaaaaa", bold: false });
  });

  it("颜色码清空已启用的格式", () => {
    const doc = parseMotd("§l§aX§cY");
    expect(styleAt(doc, 0)).toMatchObject({ color: "#55ff55", bold: false });
    expect(styleAt(doc, 1)).toMatchObject({ color: "#ff5555", bold: false });

    // 格式码在颜色码之后才能保留
    const green = parseMotd("§a§lX");
    expect(styleAt(green, 0)).toMatchObject({ color: "#55ff55", bold: true });
  });

  it("§r 重置为默认样式", () => {
    const doc = parseMotd("§6§labc§rdef");
    expect(styleAt(doc, 0)).toMatchObject({ color: "#ffaa00", bold: true });
    expect(styleAt(doc, 3)).toEqual(DEFAULT_STYLE);
  });

  it("解析 §x 十六进制颜色", () => {
    const doc = parseMotd("§x§1§2§3§4§5§6Hex");
    expect(doc.text).toBe("Hex");
    expect(styleAt(doc, 0).color).toBe("#123456");
  });

  it("解析插件常用的 &#rrggbb 颜色", () => {
    const doc = parseMotd("&#12AB34Hi");
    expect(doc.text).toBe("Hi");
    expect(styleAt(doc, 0).color).toBe("#12ab34");
  });

  it("解析 & 前缀格式码", () => {
    const doc = parseMotd("&bAqua &lBold");
    expect(doc.text).toBe("Aqua Bold");
    expect(styleAt(doc, 0)).toMatchObject({ color: "#55ffff", bold: false });
    expect(styleAt(doc, 5)).toMatchObject({ bold: true });
  });

  it("解析 server.properties 的转义写法与 motd 前缀", () => {
    const doc = parseMotd("motd=\\u00A7aHi\\nSecond");
    expect(doc.text).toBe("Hi\nSecond");
    expect(styleAt(doc, 0).color).toBe("#55ff55");
    expect(styleAt(doc, 4).color).toBe("#55ff55");
  });

  it("无效前缀按普通字符保留", () => {
    const doc = parseMotd("100% & §zz");
    expect(doc.text).toBe("100% & §zz");
    expect(doc.styles).toHaveLength(Array.from(doc.text).length);
  });

  it("emoji 等增补平面字符按码点一一对应", () => {
    const doc = parseMotd("§a😀ab");
    expect(doc.text).toBe("😀ab");
    expect(doc.styles).toHaveLength(3);
    expect(styleAt(doc, 0).color).toBe("#55ff55");
  });
});

describe("MOTD 序列化", () => {
  it("经典编码往返一致", () => {
    const source = "§6§lHello §7World";
    expect(toLegacy(parseMotd(source))).toBe(source);
  });

  it("十六进制编码往返一致", () => {
    const source = "§x§1§2§3§4§5§6Hex";
    expect(toLegacy(parseMotd(source))).toBe(source);
  });

  it("空文档输出空字符串", () => {
    const doc = parseMotd("");
    expect(doc.text).toBe("");
    expect(toLegacy(doc)).toBe("");
    expect(toProperties(doc)).toBe("motd=");
    expect(toJSON(doc)).toBe('{"text":"","extra":[]}');
  });

  it("关闭格式时重新输出颜色码即可清空格式", () => {
    const doc = parseMotd("§6ab");
    const bolded = applyStyle(doc, 0, 1, { bold: true });
    expect(toLegacy(bolded)).toBe("§6§la§6b");
    const restored = parseMotd(toLegacy(bolded));
    expect(styleAt(restored, 0)).toMatchObject({ color: "#ffaa00", bold: true });
    expect(styleAt(restored, 1)).toMatchObject({ color: "#ffaa00", bold: false });
  });

  it("默认色需要关闭格式时只能输出 §r", () => {
    const doc = applyStyle(parseMotd("§lab"), 0, 1, { bold: false });
    expect(toLegacy(doc)).toBe("a§lb");
    expect(toLegacy(applyStyle(parseMotd("§lab"), 1, 2, { bold: false }))).toBe("§la§rb");
  });

  it("& 输出使用插件颜色写法", () => {
    expect(toAmpersand(parseMotd("§aHi"))).toBe("&aHi");
    expect(toAmpersand(parseMotd("§x§1§2§3§4§5§6Hi"))).toBe("&#123456Hi");
  });

  it("properties 输出转义 §、换行与反斜杠", () => {
    const doc = parseMotd("§aHi\n§7Second");
    expect(toProperties(doc)).toBe("motd=\\u00A7aHi\\n\\u00A77Second");

    const withSlash = applyStyle(parseMotd("a\\b"), 0, 3, { color: null });
    expect(toProperties(withSlash)).toBe("motd=a\\\\b");
  });

  it("JSON 输出使用色名与格式字段", () => {
    const doc = parseMotd("§6§lHi");
    expect(JSON.parse(toJSON(doc))).toEqual({
      text: "",
      extra: [{ text: "Hi", color: "gold", bold: true }],
    });
  });

  it("JSON 用独立组件表示换行", () => {
    const doc = parseMotd("§aA\nB");
    expect(JSON.parse(toJSON(doc))).toEqual({
      text: "",
      extra: [
        { text: "A", color: "green" },
        { text: "\n" },
        { text: "B", color: "green" },
      ],
    });
  });

  it("JSON 自定义颜色输出 #rrggbb", () => {
    const doc = parseMotd("§x§1§2§3§4§5§6Hi");
    expect(JSON.parse(toJSON(doc)).extra[0]).toEqual({
      text: "Hi",
      color: "#123456",
    });
  });

  it("JSON 输出保留空行", () => {
    const extra = JSON.parse(toJSON(parseMotd("a\n\nb"))).extra;
    expect(extra).toEqual([{ text: "a" }, { text: "\n" }, { text: "\n" }, { text: "b" }]);
  });
});

describe("MOTD 样式编辑", () => {
  it("applyStyle 只修改指定字段", () => {
    const doc = applyStyle(parseMotd("abc"), 0, 2, { color: "#ff0000" });
    const bolded = applyStyle(doc, 0, 1, { bold: true });
    expect(styleAt(bolded, 0)).toMatchObject({ color: "#ff0000", bold: true });
    expect(styleAt(bolded, 1)).toMatchObject({ color: "#ff0000", bold: false });
    expect(styleAt(bolded, 2)).toEqual(DEFAULT_STYLE);
  });

  it("applyStyle 对空区间或无变化返回原对象", () => {
    const doc = parseMotd("abc");
    expect(applyStyle(doc, 1, 1, { bold: true })).toBe(doc);
    expect(applyStyle(doc, 0, 3, { bold: false })).toBe(doc);
  });

  it("toggleStyle 先全开再全关", () => {
    const doc = parseMotd("abc");
    const on = toggleStyle(doc, 0, 2, "bold");
    expect(on.styles.filter((s) => s.bold)).toHaveLength(2);
    const off = toggleStyle(on, 0, 2, "bold");
    expect(off.styles.every((s) => !s.bold)).toBe(true);
  });

  it("clearStyle 恢复默认样式", () => {
    const doc = applyStyle(parseMotd("abc"), 0, 3, {
      color: "#ff0000",
      bold: true,
    });
    const cleared = clearStyle(doc, 0, 3);
    expect(cleared.styles).toEqual([DEFAULT_STYLE, DEFAULT_STYLE, DEFAULT_STYLE]);
  });
});

describe("文本改动后的样式重映射", () => {
  it("插入字符继承前一个字符的样式", () => {
    const doc = applyStyle(parseMotd("abc"), 0, 1, { color: "#ff0000" });
    const next = remapStyles(doc, "aXbc");
    expect(next.text).toBe("aXbc");
    expect(styleAt(next, 1).color).toBe("#ff0000");
    expect(styleAt(next, 2)).toEqual(DEFAULT_STYLE);
  });

  it("删除字符保留剩余样式", () => {
    const doc = applyStyle(parseMotd("abc"), 0, 1, { color: "#ff0000" });
    const next = remapStyles(doc, "ac");
    expect(next.styles).toHaveLength(2);
    expect(styleAt(next, 0).color).toBe("#ff0000");
    expect(styleAt(next, 1)).toEqual(DEFAULT_STYLE);
  });

  it("在开头插入使用默认样式", () => {
    const next = remapStyles(parseMotd("bc"), "abc");
    expect(next.styles.every((s) => s === DEFAULT_STYLE)).toBe(true);
  });

  it("可用指定样式覆盖继承", () => {
    const pending = { ...DEFAULT_STYLE, color: "#12a0b0" };
    const next = remapStyles(parseMotd("bc"), "abc", pending);
    expect(styleAt(next, 0).color).toBe("#12a0b0");
    expect(styleAt(next, 1)).toEqual(DEFAULT_STYLE);
    expect(styleAt(next, 2)).toEqual(DEFAULT_STYLE);
  });
});

describe("辅助工具", () => {
  it("toCodePointIndex 处理代理对", () => {
    expect(toCodePointIndex("😀ab", 0)).toBe(0);
    expect(toCodePointIndex("😀ab", 2)).toBe(1);
    expect(toCodePointIndex("😀ab", 4)).toBe(3);
  });

  it("charCountByLine 按码点统计每行", () => {
    expect(charCountByLine("😀ab\ncd")).toEqual([3, 2]);
    expect(charCountByLine("")).toEqual([0]);
  });

  it("shadowColor 各通道取 1/4", () => {
    expect(shadowColor("#ffffff")).toBe("#3f3f3f");
    expect(shadowColor("#ff0000")).toBe("#3f0000");
    expect(shadowColor("#0000aa")).toBe("#00002a");
    expect(shadowColor("#000000")).toBe("#000000");
  });

  it("styleAt 越界返回默认样式", () => {
    expect(styleAt(parseMotd("a"), 5)).toBe(DEFAULT_STYLE);
  });
});

describe("行数裁剪与草稿校验", () => {
  it("clipLines 只保留前两行且样式同步", () => {
    const doc = parseMotd("§a一\n§r二\n三");
    const clipped = clipLines(doc, 2);
    expect(clipped.text).toBe("一\n二");
    expect(clipped.styles).toHaveLength(Array.from(clipped.text).length);
    expect(clipped.styles[0]?.color).toBe("#55ff55");
    expect(clipped.styles[2]?.color).toBeNull();
  });

  it("行数未超出时返回原对象", () => {
    const doc = parseMotd("一\n二");
    expect(clipLines(doc, 2)).toBe(doc);
  });

  it("stripFormatCodes 去掉完整格式码但保留孤立 §", () => {
    expect(stripFormatCodes("a§z§ab")).toBe("a§zb");
    expect(stripFormatCodes("§x§1§2§3§4§5§6Hex")).toBe("Hex");
    expect(stripFormatCodes("§#12ab34Hi")).toBe("Hi");
    expect(stripFormatCodes("普通文本 & 符号")).toBe("普通文本 & 符号");
  });

  it("isMotdDoc 拒绝长度不一致与非法颜色的草稿", () => {
    expect(isMotdDoc(parseMotd("§aHi"))).toBe(true);
    expect(isMotdDoc(null)).toBe(false);
    expect(isMotdDoc({ text: "a", styles: [] })).toBe(false);
    expect(isMotdDoc({ text: "a", styles: [{ ...DEFAULT_STYLE, color: "red" }] })).toBe(
      false,
    );
  });
});
