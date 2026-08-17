/**
 * 计算器各区块共享的类型、常量与格式化工具：
 * UiLabels / 效果类型中文文案 / 概率与倍率格式化 / 分类标签解析。
 */
import { EV_STAT_KEYS } from "./calc";
import type { MaterialInfo } from "./types";

/** 界面中文标签映射（由数据文件 labels.json 派生） */
export interface UiLabels {
  /** 属性 id -> 中文名 */
  types: Record<string, string>;
  /** 能力值 id -> 中文名 */
  stats: Record<string, string>;
  /** 蛋群 id -> 中文名 */
  eggGroups: Record<string, string>;
}

/** 效果类型中文名（吸引效果摘要逐行展示、「其他」分类材料悬浮提示共用） */
export const EFFECT_LABELS: Record<string, string> = {
  "cobblemon:typing": "属性吸引",
  "cobblemon:egg_group": "蛋群吸引",
  "cobblemon:ev": "基础点数",
  "cobblemon:rarity_bucket": "稀有度等级提升",
  "cobblemon:bite_time": "上钩时间",
  "cobblemon:nature": "性格",
  "cobblemon:iv": "个体值",
  "cobblemon:shiny_reroll": "发光概率",
  "cobblemon:mark_chance": "证章",
  "cobblemon:drops_reroll": "额外掉落",
  "cobblemon:gender_chance": "性别",
  "cobblemon:level_raise": "等级提升",
  "cobblemon:ha_chance": "隐藏特性",
  "cobblemon:alpha_chance": "头目概率",
  "cobblemon:friendship": "亲密度",
  "cobblemon:size": "体型",
};

/** 格式化概率为百分比字符串：小于 1% 保留 3 位小数，否则保留 2 位 */
export function fmtPct(value: number): string {
  return `${value.toFixed(value < 1 ? 3 : 2)}%`;
}

/**
 * 格式化概率为高精度百分比字符串（最多 12 位有效数字，去除尾随零）。
 * Java（Cobblemon 源码）与 JS 均为 IEEE 754 双精度浮点（约 15~17 位有效数字），
 * 且 calc.ts 按源码同序复刻运算，取 12 位有效数字足以覆盖有意义的精度；
 * 极小值自动退化为科学计数法（如 4e-8%）。
 */
export function fmtPctPrecise(value: number): string {
  if (value === 0) {
    return "0%";
  }
  let text = Math.abs(value).toPrecision(12);
  if (text.includes("e")) {
    text = text.replace(/\.?0+e/, "e");
  } else {
    text = text.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  }
  return [value < 0 ? "-" : "", text, "%"].join("");
}

/** 格式化概率倍率：无倍率显示 -，≥100 倍视为无穷显示 ∞ */
export function fmtRatio(ratio: number | null): string {
  if (ratio === null) {
    return "-";
  }
  if (ratio >= 100) {
    return "∞";
  }
  return `${ratio.toFixed(2)}×`;
}

/**
 * 解析效果 / 材料子类别的中文名称。
 * 分类可能是效果类型（带 cobblemon: 前缀）或材料分类，统一去掉前缀后匹配：
 * typing -> 属性、egg_group -> 蛋群、ev 经 EV_STAT_KEYS 映射为能力值键，
 * 其余分类原样返回末段 id；子类别可能带路径（如 a/b/steel），统一取末段。
 */
export function categoryLabel(
  category: string,
  subcategory: string,
  labels: UiLabels,
): string {
  const kind = category.replace(/^cobblemon:/, "");
  const path = subcategory.includes("/") ? subcategory.split("/").pop()! : subcategory;
  if (kind === "typing") {
    return labels.types[path] ?? path;
  }
  if (kind === "egg_group") {
    return labels.eggGroups[path] ?? path;
  }
  if (kind === "ev") {
    const statKey = EV_STAT_KEYS[path] ?? path;
    return labels.stats[statKey] ?? statKey;
  }
  return path;
}

/** 生成材料名称后缀（属性 / 蛋群 / 能力值中文名称，以 / 连接） */
export function materialSuffix(material: MaterialInfo, labels: UiLabels): string {
  if (material.category === "other") {
    return "";
  }
  return material.detail
    .map((d) => categoryLabel(material.category, d, labels))
    .filter(Boolean)
    .join("/");
}
