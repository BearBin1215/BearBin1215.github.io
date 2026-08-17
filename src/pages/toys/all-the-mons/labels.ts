/**
 * All The Mons 宝点心页面的展示辅助（不含界面文案）。
 * 属性 / 能力值 / 蛋群的名称由数据文件 labels.json 提供；
 * 稀有度、材料分类、效果类型、场景选项等中文文案直接写在各组件内。
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

/** 稀有度桶排序优先级（数值越小越稀有），用于物种列表按稀有度排序 */
export const BUCKET_RARITY_INDEX: Record<string, number> = {
  "ultra-rare": 0,
  rare: 1,
  uncommon: 2,
  common: 3,
  boss: 4,
};

/** 材料显示分类展示顺序 */
export const MATERIAL_CATEGORY_ORDER = ["typing", "egg_group", "ev", "other"] as const;

/** 生成位置类型可选项（宝点心场景，不含垂钓） */
export const POSITION_VALUES = ["grounded", "surface", "submerged", "seafloor"] as const;

/** 光照范围选项（白天 / 夜晚互斥） */
export const LIGHT_VALUES = ["day", "night"] as const;

/** 天气选项 */
export const WEATHER_VALUES = ["clear", "rain", "thunder"] as const;
