/**
 * All The Mons 宝点心页面的中文标签与展示辅助。
 */

/** 属性徽章颜色（背景） */
export const TYPE_COLORS: Record<string, string> = {
  normal: "#A8A77A",
  fire: "#EE8130",
  water: "#6390F0",
  electric: "#F7D02C",
  grass: "#7AC74C",
  ice: "#96D9D6",
  fighting: "#C22E28",
  poison: "#A33EA1",
  ground: "#E2BF65",
  flying: "#A98FF3",
  psychic: "#F95587",
  bug: "#A6B91A",
  rock: "#B6A136",
  ghost: "#735797",
  dragon: "#6F35FC",
  dark: "#705746",
  steel: "#B7B7CE",
  fairy: "#D685AD",
};

/** 基础点数材料展示顺序（按玩家常用 HP、攻击、防御、特攻、特防、速度 排序） */
export const EV_STAT_ORDER: Record<string, number> = {
  hp: 0,
  atk: 1,
  def: 2,
  spa: 3,
  spd: 4,
  spe: 5,
};

/** 稀有度筛选选项（按 超稀有 → 普通 排序） */
export const RARITY_FILTER_OPTIONS = [
  { value: "ultra-rare", label: "超稀有" },
  { value: "rare", label: "稀有" },
  { value: "uncommon", label: "不普通" },
  { value: "common", label: "普通" },
] as const;

/** 稀有度桶中文名 */
export const BUCKET_LABELS: Record<string, string> = {
  common: "普通",
  uncommon: "不普通",
  rare: "稀有",
  "ultra-rare": "超稀有",
  boss: "头目",
};

/** 稀有度桶排序优先级（数值越小越稀有），用于物种列表按稀有度排序 */
export const BUCKET_RARITY_INDEX: Record<string, number> = {
  "ultra-rare": 0,
  rare: 1,
  uncommon: 2,
  common: 3,
  boss: 4,
};

/** 材料显示分类中文名与展示顺序 */
export const MATERIAL_CATEGORY_LABELS: Record<string, string> = {
  typing: "属性",
  egg_group: "蛋群",
  ev: "基础点数",
  other: "其他",
};

/** 材料显示分类展示顺序 */
export const MATERIAL_CATEGORY_ORDER = ["typing", "egg_group", "ev", "other"] as const;

/** 效果类型说明 */
export const EFFECT_LABELS: Record<string, string> = {
  "cobblemon:typing": "属性吸引",
  "cobblemon:egg_group": "蛋群吸引",
  "cobblemon:ev": "EV 筛选",
  "cobblemon:rarity_bucket": "稀有度提升",
  "cobblemon:bite_time": "刷新间隔",
  "cobblemon:nature": "性格",
  "cobblemon:iv": "个体值",
  "cobblemon:shiny_reroll": "闪率重掷",
  "cobblemon:mark_chance": "标记",
  "cobblemon:drops_reroll": "掉落重掷",
  "cobblemon:gender_chance": "性别",
  "cobblemon:level_raise": "等级提升",
  "cobblemon:ha_chance": "隐藏特性",
  "cobblemon:alpha_chance": "头目概率",
  "cobblemon:friendship": "亲密度",
  "cobblemon:size": "体型",
};

/** 生成位置类型可选项（宝点心场景，不含垂钓） */
export const POSITION_OPTIONS = [
  { value: "grounded", label: "地面" },
  { value: "surface", label: "水面" },
  { value: "submerged", label: "水下" },
  { value: "seafloor", label: "海底" },
] as const;

/** 光照范围选项（白天 / 夜晚互斥） */
export const LIGHT_OPTIONS = [
  { value: "day", label: "白天（光照 8-15）" },
  { value: "night", label: "夜晚（光照 0-7）" },
] as const;

/** 天气选项 */
export const WEATHER_OPTIONS = [
  { value: "clear", label: "晴" },
  { value: "rain", label: "雨" },
  { value: "thunder", label: "雷暴" },
] as const;
