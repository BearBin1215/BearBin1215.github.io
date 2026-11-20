import type { CSSProperties } from "react";
import { shadowColor, type CharStyle } from "./motd";

/**
 * 把字符样式转成游戏风格的内联样式：颜色、加粗、斜体、下划线、删除线，
 * 以及按游戏规则计算的文字阴影（向右下偏移 1 像素，颜色各通道取 1/4）
 * @param style 字符样式
 */
export function segmentStyle(style: CharStyle): CSSProperties {
  const color = style.color ?? "#ffffff";
  const decorations = [
    style.underlined ? "underline" : "",
    style.strikethrough ? "line-through" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return {
    color,
    fontWeight: style.bold ? 700 : 400,
    fontStyle: style.italic ? "italic" : "normal",
    textDecorationLine: decorations || "none",
    textShadow: `1px 1px 0 ${shadowColor(color)}`,
  };
}
