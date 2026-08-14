/**
 * 从本地 Cobblemon 模组源码数据中提取「宝点心 / 吸引」相关静态数据，
 * 生成压缩后的 JSON 快照到 public/data/all-the-mons/，供前端玩具页面使用。
 *
 * 运行：pnpm extract:all-the-mons（内部使用 tsx 执行本文件）
 *
 * 数据来源（默认）：
 *   ../cobblemon/cobblemon/common/src/main/resources/data/cobblemon
 * 并自动合并 All The Mons 整合包覆盖（../cobblemon/All the Mons/overrides/kubejs/data/cobblemon）：
 *   材料（spawn_bait_effects / seasonings）、生成池（spawn_pool_world）
 * 可通过环境变量覆盖：
 *   COBBLEMON_DATA_DIR     基础数据目录（默认为上面的 Cobblemon 源码路径）
 *   COBBLEMON_OVERRIDES_DIR 可选的数据包覆盖目录（如 All the Mons 的
 *                           overrides/kubejs/data/cobblemon），会合并覆盖
 *                           seasonings、spawn_bait_effects 与 spawn_pool_world
 *   COBBLEMON_LANG_FILE    简体中文语言文件路径（默认取 cobblemon 的 zh_cn.json）
 *
 * 生成文件：
 *   bait-effects.json  baitId -> { item, effects[] }
 *   materials.json     可选材料列表（含 category 分类与 detail 子类别）
 *   species.json       [{ id, name, nameZh, types[], eggGroups[], evYield{} }]
 *   spawn-pool.json    世界生成池条目（已合并 All The Mons 覆盖）
 *   biome-tags-reverse.json  群系 id -> 所属标签列表（含原版/Common 标签与神兽刷新标签）
 *   meta.json          生成时间、版本号与统计信息
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(SCRIPT_DIR, "..");
const DEFAULT_DATA_DIR = resolve(
  PROJECT_ROOT,
  "../cobblemon/cobblemon/common/src/main/resources/data/cobblemon",
);
const DEFAULT_OVERRIDES_DIR = resolve(
  PROJECT_ROOT,
  "../cobblemon/All-the-Mons/kubejs/data/cobblemon",
);

const DATA_DIR = resolve(process.env.COBBLEMON_DATA_DIR ?? DEFAULT_DATA_DIR);
const OVERRIDES_DIR = process.env.COBBLEMON_OVERRIDES_DIR
  ? resolve(process.env.COBBLEMON_OVERRIDES_DIR)
  : DEFAULT_OVERRIDES_DIR;
const LANG_FILE = process.env.COBBLEMON_LANG_FILE
  ? resolve(process.env.COBBLEMON_LANG_FILE)
  : resolve(DATA_DIR, "../../assets/cobblemon/lang/zh_cn.json");
const OUT_DIR = resolve(PROJECT_ROOT, "public/data/all-the-mons");

/** All The Mons 整合包 manifest（版本信息） */
const ATM_MANIFEST = resolve(
  PROJECT_ROOT,
  "../cobblemon/All-the-Mons/manifest.json",
);
/** All The Mons 源码仓库 CHANGELOG.md（manifest.json 缺失时解析最新版本号） */
const ATM_CHANGELOG = resolve(PROJECT_ROOT, "../cobblemon/All-the-Mons/CHANGELOG.md");
/** Cobblemon 模组 gradle.properties（mod_version） */
const COBBLEMON_GRADLE_PROPERTIES = resolve(
  PROJECT_ROOT,
  "../cobblemon/cobblemon/gradle.properties",
);

/** 单个吸引效果（对应源码 SpawnBait.Effect） */
interface BaitEffect {
  type: string;
  subcategory: string | null;
  chance: number;
  value: number;
}

/** spawn_bait_effects 条目 */
interface SpawnBaitRaw {
  item: string;
  effects: BaitEffect[];
}

/** 树果数据 */
interface BerryRaw {
  name: string;
  colour: string | null;
  flavours: Record<string, number> | null;
}

/** 带 baitEffects 的调料 */
interface SeasoningRaw {
  item: string;
  effects: BaitEffect[];
}

/** 物种数据 */
interface SpeciesRaw {
  id: string;
  name: string;
  nameZh: string | null;
  types: string[];
  eggGroups: string[];
  evYield: Record<string, number>;
}

/** 生成池条目 */
interface PoolEntryRaw {
  p: string;
  bucket: string;
  weight: number;
  pos: string;
  biomes: string[];
  anti: string[];
  minLight: number | null;
  maxLight: number | null;
  lureOnly: boolean;
  /** 是否要求雨天（true=仅雨天，false=仅非雨天，null=无限制） */
  isRaining: boolean | null;
  /** 是否要求雷暴（true=仅雷暴，false=仅非雷暴，null=无限制） */
  isThundering: boolean | null;
  /** 权重倍率（满足条件时按 multiplier 乘权重，影响概率） */
  weightMultipliers: WeightMultiplierRaw[];
}

/** 权重倍率（仅保留本工具可评估的条件字段） */
interface WeightMultiplierRaw {
  multiplier: number;
  condition: {
    isRaining?: boolean;
    isThundering?: boolean;
    timeRange?: string;
    biomes?: string[];
  };
  anticondition: {
    isRaining?: boolean;
    isThundering?: boolean;
    timeRange?: string;
    biomes?: string[];
  };
}

/** 材料种类 */
type MaterialKind = "berry" | "item" | "seasoning";

/** 材料显示分类（属性 / 蛋群 / 基础点数 / 其他） */
type MaterialCategory = "typing" | "egg_group" | "ev" | "other";

/** 材料条目 */
interface MaterialRaw {
  id: string;
  kind: MaterialKind;
  label: string;
  baitId: string;
  flavours: Record<string, number> | null;
  /** 显示分类 */
  category: MaterialCategory;
  /** 分类对应的子类别 id（属性名 / 蛋组名 / 能力名），供名称后缀展示 */
  detail: string[];
}

/**
 * 非 cobblemon 命名空间物品的中文名兜底（原版 Minecraft / 整合包材料，
 * 这些名称不在 Cobblemon 的 zh_cn 语言文件里）。
 */
const ITEM_ZH_FALLBACK: Record<string, string> = {
  glow_berries: "发光浆果",
  sweet_berries: "甜浆果",
  apple: "苹果",
  enchanted_golden_apple: "附魔金苹果",
  glistering_melon_slice: "闪烁的西瓜片",
  golden_apple: "金苹果",
  golden_carrot: "金胡萝卜",
  allthemodium_apple: "ATM苹果",
  allthemodium_carrot: "ATM胡萝卜",
  mythical_pecha_berry: "神话桃桃果",
};

const V = (b: string): string => `minecraft:${b}`;

/** 原版主世界群系 id（不含下界/末地/虚空） */
const V_OVERWORLD: string[] = [
  "badlands",
  "bamboo_jungle",
  "beach",
  "birch_forest",
  "cherry_grove",
  "cold_ocean",
  "dark_forest",
  "deep_cold_ocean",
  "deep_dark",
  "deep_frozen_ocean",
  "deep_lukewarm_ocean",
  "deep_ocean",
  "desert",
  "dripstone_caves",
  "eroded_badlands",
  "flower_forest",
  "forest",
  "frozen_ocean",
  "frozen_peaks",
  "frozen_river",
  "grove",
  "ice_spikes",
  "jagged_peaks",
  "jungle",
  "lukewarm_ocean",
  "lush_caves",
  "mangrove_swamp",
  "meadow",
  "mushroom_fields",
  "ocean",
  "old_growth_birch_forest",
  "old_growth_pine_taiga",
  "old_growth_spruce_taiga",
  "plains",
  "river",
  "savanna",
  "savanna_plateau",
  "snowy_beach",
  "snowy_plains",
  "snowy_slopes",
  "snowy_taiga",
  "sparse_jungle",
  "stony_peaks",
  "stony_shore",
  "sunflower_plains",
  "swamp",
  "taiga",
  "warm_ocean",
  "windswept_forest",
  "windswept_gravelly_hills",
  "windswept_hills",
  "windswept_savanna",
  "wooded_badlands",
].map(V);

/**
 * 外部数据包（原版 Minecraft 与 Common taglib）生物群系标签的硬编码成员。
 * 这些标签的定义在游戏运行时 / 其他模组数据里，不在本仓库内；
 * 若缺失，原版群系（如 minecraft:desert）无法解析出 is_overworld 等标签，
 * 会导致生成池漏掉大量通用条目、概率严重失真。故在此补全。
 */
const VANILLA_TAG_BIOMES: Record<string, string[]> = {
  "#minecraft:is_overworld": V_OVERWORLD,
  "#c:is_overworld": V_OVERWORLD,
  "#minecraft:is_badlands": ["badlands", "eroded_badlands", "wooded_badlands"].map(V),
  "#c:is_badlands": ["badlands", "eroded_badlands", "wooded_badlands"].map(V),
  "#minecraft:is_beach": ["beach", "snowy_beach"].map(V),
  "#c:is_beach": ["beach", "snowy_beach"].map(V),
  "#c:is_birch_forest": ["birch_forest", "old_growth_birch_forest"].map(V),
  "#c:is_cave": ["dripstone_caves", "lush_caves"].map(V),
  "#minecraft:is_cave": ["dripstone_caves", "lush_caves"].map(V),
  "#c:is_cold": [
    "cold_ocean",
    "deep_cold_ocean",
    "deep_frozen_ocean",
    "frozen_ocean",
    "frozen_peaks",
    "frozen_river",
    "grove",
    "ice_spikes",
    "snowy_beach",
    "snowy_plains",
    "snowy_slopes",
    "snowy_taiga",
    "stony_peaks",
    "windswept_gravelly_hills",
    "windswept_hills",
  ].map(V),
  "#c:is_cold/overworld": [
    "cold_ocean",
    "deep_cold_ocean",
    "deep_frozen_ocean",
    "frozen_ocean",
    "frozen_peaks",
    "frozen_river",
    "grove",
    "ice_spikes",
    "snowy_beach",
    "snowy_plains",
    "snowy_slopes",
    "snowy_taiga",
    "stony_peaks",
    "windswept_gravelly_hills",
    "windswept_hills",
  ].map(V),
  "#c:is_dead": ["basalt_deltas", "nether_wastes", "soul_sand_valley"].map(V),
  "#minecraft:is_deep_ocean": [
    "deep_ocean",
    "deep_cold_ocean",
    "deep_frozen_ocean",
    "deep_lukewarm_ocean",
  ].map(V),
  "#c:is_deep_ocean": [
    "deep_ocean",
    "deep_cold_ocean",
    "deep_frozen_ocean",
    "deep_lukewarm_ocean",
  ].map(V),
  "#c:is_dense_vegetation": [
    "bamboo_jungle",
    "dark_forest",
    "jungle",
    "mangrove_swamp",
    "old_growth_birch_forest",
    "old_growth_spruce_taiga",
    "sparse_jungle",
  ].map(V),
  "#c:is_dense_vegetation/overworld": [
    "bamboo_jungle",
    "dark_forest",
    "jungle",
    "mangrove_swamp",
    "old_growth_birch_forest",
    "old_growth_spruce_taiga",
    "sparse_jungle",
  ].map(V),
  "#c:is_desert": ["badlands", "desert", "eroded_badlands", "wooded_badlands"].map(V),
  "#minecraft:is_end": [
    "end_barrens",
    "end_highlands",
    "end_midlands",
    "small_end_islands",
    "the_end",
  ].map(V),
  "#c:is_end": [
    "end_barrens",
    "end_highlands",
    "end_midlands",
    "small_end_islands",
    "the_end",
  ].map(V),
  "#c:is_floral": ["cherry_grove", "flower_forest", "meadow", "sunflower_plains"].map(V),
  "#c:is_flower_forest": ["flower_forest"].map(V),
  "#c:flower_forest": ["flower_forest"].map(V),
  "#minecraft:is_forest": [
    "birch_forest",
    "cherry_grove",
    "dark_forest",
    "flower_forest",
    "forest",
    "old_growth_birch_forest",
    "windswept_forest",
  ].map(V),
  "#c:is_forest": [
    "birch_forest",
    "cherry_grove",
    "dark_forest",
    "flower_forest",
    "forest",
    "old_growth_birch_forest",
    "old_growth_pine_taiga",
    "old_growth_spruce_taiga",
    "windswept_forest",
  ].map(V),
  "#minecraft:is_hill": [
    "windswept_forest",
    "windswept_gravelly_hills",
    "windswept_hills",
    "windswept_savanna",
  ].map(V),
  "#c:is_hill": [
    "windswept_forest",
    "windswept_gravelly_hills",
    "windswept_hills",
    "windswept_savanna",
  ].map(V),
  "#c:is_icy": ["frozen_peaks", "ice_spikes", "snowy_slopes"].map(V),
  "#minecraft:is_jungle": ["bamboo_jungle", "jungle", "sparse_jungle"].map(V),
  "#c:is_jungle": ["bamboo_jungle", "jungle", "sparse_jungle"].map(V),
  "#c:is_lush": [
    "bamboo_jungle",
    "cherry_grove",
    "dripstone_caves",
    "jungle",
    "lush_caves",
    "mangrove_swamp",
    "mushroom_fields",
    "sparse_jungle",
  ].map(V),
  "#c:is_magical": ["cherry_grove", "mushroom_fields"].map(V),
  "#minecraft:is_mountain": [
    "frozen_peaks",
    "grove",
    "jagged_peaks",
    "meadow",
    "snowy_slopes",
    "stony_peaks",
    "windswept_gravelly_hills",
    "windswept_hills",
  ].map(V),
  "#c:is_mountain": [
    "frozen_peaks",
    "grove",
    "jagged_peaks",
    "meadow",
    "snowy_slopes",
    "stony_peaks",
    "windswept_gravelly_hills",
    "windswept_hills",
  ].map(V),
  "#c:is_mountain/peak": ["frozen_peaks", "jagged_peaks", "stony_peaks"].map(V),
  "#c:is_mountain/slope": ["grove", "meadow", "snowy_slopes"].map(V),
  "#c:is_mushroom": ["mushroom_fields"].map(V),
  "#c:is_mushroom_island": ["mushroom_fields"].map(V),
  "#minecraft:is_nether": [
    "basalt_deltas",
    "crimson_forest",
    "nether_wastes",
    "soul_sand_valley",
    "warped_forest",
  ].map(V),
  "#minecraft:is_ocean": [
    "cold_ocean",
    "deep_cold_ocean",
    "deep_frozen_ocean",
    "deep_lukewarm_ocean",
    "deep_ocean",
    "frozen_ocean",
    "lukewarm_ocean",
    "ocean",
    "warm_ocean",
  ].map(V),
  "#c:is_ocean": [
    "cold_ocean",
    "deep_cold_ocean",
    "deep_frozen_ocean",
    "deep_lukewarm_ocean",
    "deep_ocean",
    "frozen_ocean",
    "lukewarm_ocean",
    "ocean",
    "warm_ocean",
  ].map(V),
  "#c:is_old_growth": [
    "old_growth_birch_forest",
    "old_growth_pine_taiga",
    "old_growth_spruce_taiga",
  ].map(V),
  "#c:is_plains": ["plains", "sunflower_plains"].map(V),
  "#c:is_plateau": ["savanna_plateau", "wooded_badlands"].map(V),
  "#minecraft:is_river": ["frozen_river", "river"].map(V),
  "#c:is_river": ["frozen_river", "river"].map(V),
  "#c:is_sandy": [
    "badlands",
    "beach",
    "desert",
    "eroded_badlands",
    "wooded_badlands",
  ].map(V),
  "#minecraft:is_savanna": ["savanna", "savanna_plateau", "windswept_savanna"].map(V),
  "#c:is_savanna": ["savanna", "savanna_plateau", "windswept_savanna"].map(V),
  "#c:is_snowy": [
    "frozen_ocean",
    "frozen_peaks",
    "frozen_river",
    "grove",
    "ice_spikes",
    "snowy_beach",
    "snowy_plains",
    "snowy_slopes",
    "snowy_taiga",
  ].map(V),
  "#c:snowy": [
    "cold_ocean",
    "deep_cold_ocean",
    "deep_frozen_ocean",
    "frozen_ocean",
    "frozen_peaks",
    "frozen_river",
    "grove",
    "ice_spikes",
    "snowy_beach",
    "snowy_plains",
    "snowy_slopes",
    "snowy_taiga",
  ].map(V),
  "#c:is_snowy_plains": ["ice_spikes", "snowy_plains"].map(V),
  "#c:is_sparse_vegetation": [
    "savanna",
    "savanna_plateau",
    "sparse_jungle",
    "windswept_forest",
    "windswept_gravelly_hills",
    "windswept_hills",
    "windswept_savanna",
    "wooded_badlands",
  ].map(V),
  "#c:is_sparse_vegetation/overworld": [
    "savanna",
    "savanna_plateau",
    "sparse_jungle",
    "windswept_forest",
    "windswept_gravelly_hills",
    "windswept_hills",
    "windswept_savanna",
    "wooded_badlands",
  ].map(V),
  "#c:is_spooky": ["dark_forest"].map(V),
  "#c:is_stony_shores": ["stony_shore"].map(V),
  "#c:is_swamp": ["mangrove_swamp", "swamp"].map(V),
  "#minecraft:is_taiga": [
    "old_growth_pine_taiga",
    "old_growth_spruce_taiga",
    "snowy_taiga",
    "taiga",
  ].map(V),
  "#c:is_taiga": [
    "old_growth_pine_taiga",
    "old_growth_spruce_taiga",
    "snowy_taiga",
    "taiga",
  ].map(V),
  "#c:is_underground": ["deep_dark", "dripstone_caves", "lush_caves"].map(V),
  "#c:is_wasteland": [
    "badlands",
    "basalt_deltas",
    "eroded_badlands",
    "wooded_badlands",
  ].map(V),
  "#c:is_windswept": [
    "windswept_forest",
    "windswept_gravelly_hills",
    "windswept_hills",
    "windswept_savanna",
  ].map(V),
  "#c:tree/coniferous": [
    "grove",
    "old_growth_pine_taiga",
    "old_growth_spruce_taiga",
    "snowy_taiga",
    "taiga",
    "windswept_forest",
  ].map(V),
  "#c:tree/deciduous": [
    "birch_forest",
    "cherry_grove",
    "dark_forest",
    "flower_forest",
    "forest",
    "old_growth_birch_forest",
    "windswept_forest",
  ].map(V),
  "#c:tree/jungle": ["bamboo_jungle", "jungle", "mangrove_swamp", "sparse_jungle"].map(V),
  "#c:tree/savanna": ["savanna", "savanna_plateau", "windswept_savanna"].map(V),
};

/**
 * 会影响「刷新概率 / 频率」的效果类型：
 * typing / egg_group 提高对应宝可梦权重，ev 过滤不匹配宝可梦，
 * rarity_bucket 拉平稀有度桶，bite_time 缩短刷新间隔。
 * 仅含性格、个体值等个体加成效果的树果不会改变刷新概率，不列为可选材料。
 */
const PROBABILITY_EFFECT_TYPES = new Set([
  "cobblemon:typing",
  "cobblemon:egg_group",
  "cobblemon:ev",
  "cobblemon:rarity_bucket",
  "cobblemon:bite_time",
]);

/** 显示分类的优先级（属性 > 蛋群 > 基础点数 > 其他）与效果类型映射 */
const CATEGORY_PRIORITY: MaterialCategory[] = ["typing", "egg_group", "ev"];

const EFFECT_TYPE_TO_CATEGORY: Record<string, MaterialCategory> = {
  "cobblemon:typing": "typing",
  "cobblemon:egg_group": "egg_group",
  "cobblemon:ev": "ev",
};

/** 读取 All The Mons 与 Cobblemon 版本号 */
function loadVersions(): { allTheMons: string | null; cobblemon: string | null } {
  let allTheMons: string | null = null;
  const manifest = readJson(ATM_MANIFEST);
  if (manifest !== null && typeof manifest === "object" && !Array.isArray(manifest)) {
    const version = (manifest as { version?: unknown }).version;
    if (typeof version === "string" && version.trim() !== "") {
      allTheMons = version.trim();
    }
  }
  // manifest 缺失时从 CHANGELOG.md 解析最新的「## [版本号]」标题
  if (!allTheMons && existsSync(ATM_CHANGELOG)) {
    try {
      const text = readFileSync(ATM_CHANGELOG, "utf8");
      const match = text.match(/^##\s+.*?\[([^\]]+)\]/m);
      if (match && match[1] && match[1].trim() !== "") {
        allTheMons = match[1].trim();
      }
    } catch {
      // 忽略读取失败
    }
  }
  let cobblemon: string | null = null;
  if (existsSync(COBBLEMON_GRADLE_PROPERTIES)) {
    try {
      const text = readFileSync(COBBLEMON_GRADLE_PROPERTIES, "utf8");
      const match = text.match(/^\s*mod_version\s*=\s*(.+)$/m);
      if (match && match[1] && match[1].trim() !== "") {
        cobblemon = match[1].trim();
      }
    } catch {
      // 忽略读取失败
    }
  }
  return { allTheMons, cobblemon };
}

/** 读取简体中文语言文件，返回 key -> 中文名 的映射 */
function loadLang(): Record<string, string> {
  if (!existsSync(LANG_FILE)) {
    console.warn(`[warn] 未找到简体中文语言文件：${LANG_FILE}`);
    return {};
  }
  const lang = readJson(LANG_FILE);
  if (lang === null || typeof lang !== "object" || Array.isArray(lang)) {
    return {};
  }
  return lang as Record<string, string>;
}

/** 根据物品 id 获取中文名（优先 cobblemon 语言文件，其次兜底表，最后回退英文化 id） */
function itemZhLabel(lang: Record<string, string>, itemId: string): string | null {
  return (
    lang[`item.cobblemon.${itemId}`] ??
    lang[`block.cobblemon.${itemId}`] ??
    ITEM_ZH_FALLBACK[itemId] ??
    null
  );
}

/** 读取并解析一个 JSON 文件；文件不存在或解析失败时返回 null */
function readJson(path: string): unknown {
  if (!existsSync(path)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    console.warn(`[warn] 无法解析 JSON：${path}（${(err as Error).message}）`);
    return null;
  }
}

/** 递归收集某个目录下所有 .json 文件的路径列表 */
function collectJsonFiles(dir: string, subdir = ""): string[] {
  const full = join(dir, subdir);
  if (!existsSync(full)) {
    return [];
  }
  const out: string[] = [];
  for (const entry of readdirSync(full, { withFileTypes: true })) {
    const rel = join(subdir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectJsonFiles(dir, rel));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      out.push(join(full, entry.name));
    }
  }
  return out;
}

/** 将文件名（去掉 .json）作为 id */
function idOf(path: string): string {
  return basename(path, ".json");
}

/** 解析 bait 效果字段 */
function parseEffects(raw: unknown): BaitEffect[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map((e) => ({
    type: String((e as { type?: unknown }).type ?? ""),
    subcategory:
      (e as { subcategory?: unknown }).subcategory !== null &&
      (e as { subcategory?: unknown }).subcategory !== undefined
        ? String((e as { subcategory?: unknown }).subcategory)
        : null,
    chance: Number((e as { chance?: unknown }).chance ?? 0),
    value: Number((e as { value?: unknown }).value ?? 0),
  }));
}

/**
 * 读取 spawn_bait_effects 目录（支持基础数据 + 覆盖数据合并），
 * 返回 baitId -> { item, effects } 的映射。
 * baitId 使用相对路径（不含扩展名），如 berries/pecha_berry、fruits/allthemodium_apple；
 * 覆盖数据中的同名条目会覆盖基础数据。
 */
function loadBaitEffects(
  dataDir: string,
  overridesDir: string | null,
): Map<string, SpawnBaitRaw> {
  const map = new Map<string, SpawnBaitRaw>();
  const dirs: string[] = [];
  dirs.push(join(dataDir, "spawn_bait_effects"));
  if (overridesDir && existsSync(join(overridesDir, "spawn_bait_effects"))) {
    dirs.push(join(overridesDir, "spawn_bait_effects"));
  }
  for (const dir of dirs) {
    for (const file of collectJsonFiles(dir)) {
      const bait = readJson(file);
      if (bait === null || typeof bait !== "object" || Array.isArray(bait)) {
        continue;
      }
      const rel = file.slice(dir.length + 1).replaceAll("\\", "/");
      const key = rel.replace(/\.json$/, "");
      map.set(key, {
        item: String((bait as { item?: unknown }).item ?? ""),
        effects: parseEffects((bait as { effects?: unknown }).effects),
      });
    }
  }
  return map;
}

/** 读取 berries 目录，返回 berryId -> { name, colour, flavours } */
function loadBerries(dataDir: string): Map<string, BerryRaw> {
  const map = new Map<string, BerryRaw>();
  const dir = join(dataDir, "berries");
  for (const file of collectJsonFiles(dir)) {
    const berry = readJson(file);
    if (berry === null || typeof berry !== "object" || Array.isArray(berry)) {
      continue;
    }
    const id = idOf(file);
    const berryData = berry as {
      name?: unknown;
      colour?: unknown;
      flavours?: unknown;
    };
    map.set(id, {
      name: typeof berryData.name === "string" ? berryData.name : humanize(id),
      colour: typeof berryData.colour === "string" ? berryData.colour : null,
      flavours:
        berryData.flavours !== null && berryData.flavours !== undefined
          ? (berryData.flavours as Record<string, number>)
          : null,
    });
  }
  return map;
}

/** 读取 seasonings 目录，返回 seasoningId -> { item, effects }（仅保留含 baitEffects 的） */
function loadSeasonings(
  dataDir: string,
  overridesDir: string | null,
): Map<string, SeasoningRaw> {
  const map = new Map<string, SeasoningRaw>();
  const dirs: string[] = [];
  dirs.push(join(dataDir, "seasonings"));
  if (overridesDir && existsSync(join(overridesDir, "seasonings"))) {
    dirs.push(join(overridesDir, "seasonings"));
  }
  for (const dir of dirs) {
    for (const file of collectJsonFiles(dir)) {
      const seasoning = readJson(file);
      if (
        seasoning === null ||
        typeof seasoning !== "object" ||
        Array.isArray(seasoning)
      ) {
        continue;
      }
      const effects = parseEffects((seasoning as { baitEffects?: unknown }).baitEffects);
      if (effects.length === 0) {
        continue;
      }
      const seasoningData = seasoning as { item?: unknown; ingredient?: unknown };
      map.set(idOf(file), {
        item: String(seasoningData.item ?? seasoningData.ingredient ?? ""),
        effects,
      });
    }
  }
  return map;
}

/** 读取 species 数据，返回 id -> { name, nameZh, types, eggGroups, evYield } */
function loadSpecies(
  dataDir: string,
  lang: Record<string, string>,
): Map<string, SpeciesRaw> {
  const map = new Map<string, SpeciesRaw>();
  const dir = join(dataDir, "species");
  for (const file of collectJsonFiles(dir)) {
    const species = readJson(file);
    if (species === null || typeof species !== "object" || Array.isArray(species)) {
      continue;
    }
    const speciesData = species as {
      implemented?: unknown;
      primaryType?: unknown;
      secondaryType?: unknown;
      evYield?: unknown;
      eggGroups?: unknown;
      name?: unknown;
    };
    if (speciesData.implemented === false) {
      continue;
    }
    const types = [String(speciesData.primaryType ?? "")];
    if (speciesData.secondaryType) {
      types.push(String(speciesData.secondaryType));
    }
    const ev: Record<string, number> = {};
    if (speciesData.evYield !== null && speciesData.evYield !== undefined) {
      for (const [stat, value] of Object.entries(
        speciesData.evYield as Record<string, unknown>,
      )) {
        if (Number(value) > 0) {
          ev[stat] = Number(value);
        }
      }
    }
    const id = idOf(file);
    map.set(id, {
      id,
      name: typeof speciesData.name === "string" ? speciesData.name : humanize(id),
      nameZh: lang[`cobblemon.species.${id}.name`] ?? null,
      types: types.filter(Boolean),
      eggGroups: Array.isArray(speciesData.eggGroups)
        ? (speciesData.eggGroups as string[]).map(String)
        : [],
      evYield: ev,
    });
  }
  return map;
}

/** 读取世界生成池条目（跳过 herds 子目录），合并基础数据与覆盖数据（覆盖同名文件） */
function loadSpawnPool(dataDir: string, overridesDir: string | null): PoolEntryRaw[] {
  // 按相对路径收集文件，覆盖数据（后处理）优先
  const filesByKey = new Map<string, string>();
  const collect = (root: string): void => {
    const dir = join(root, "spawn_pool_world");
    if (!existsSync(dir)) {
      return;
    }
    for (const file of collectJsonFiles(dir)) {
      const rel = file.slice(dir.length + 1).replaceAll("\\", "/");
      if (rel.includes("/")) {
        continue; // 跳过 herds 等子目录
      }
      filesByKey.set(rel, file);
    }
  };
  collect(dataDir);
  if (overridesDir) {
    collect(overridesDir);
  }

  const entries: PoolEntryRaw[] = [];
  for (const file of filesByKey.values()) {
    const set = readJson(file);
    if (set === null || typeof set !== "object" || Array.isArray(set)) {
      continue;
    }
    const spawns = (set as { spawns?: unknown }).spawns;
    if (!Array.isArray(spawns)) {
      continue;
    }
    for (const spawn of spawns) {
      const spawnData = spawn as {
        type?: unknown;
        pokemon?: unknown;
        bucket?: unknown;
        weight?: unknown;
        spawnablePositionType?: unknown;
        context?: unknown;
        weightMultiplier?: unknown;
        condition?: {
          biomes?: unknown;
          anti?: unknown;
          minSkyLight?: unknown;
          maxSkyLight?: unknown;
          minLureLevel?: unknown;
          maxLureLevel?: unknown;
          isRaining?: unknown;
          isThundering?: unknown;
        };
        anticondition?: { biomes?: unknown };
      };
      if (spawnData.type !== "pokemon") {
        continue;
      }
      const condition = spawnData.condition ?? {};
      const anticondition = spawnData.anticondition ?? {};
      const pokemon = String(spawnData.pokemon ?? "");
      const p = pokemon.trim().split(/\s+/)[0] ?? "";
      const hasLureCondition =
        (condition.minLureLevel ?? null) !== null ||
        (condition.maxLureLevel ?? null) !== null;
      entries.push({
        p,
        bucket: String(spawnData.bucket ?? "common"),
        weight: Number(spawnData.weight ?? 0),
        // 兼容新老字段：spawnablePositionType 或 context
        pos: String(spawnData.spawnablePositionType ?? spawnData.context ?? ""),
        biomes: Array.isArray(condition.biomes)
          ? (condition.biomes as string[]).map(String)
          : [],
        anti: Array.isArray(anticondition.biomes)
          ? (anticondition.biomes as string[]).map(String)
          : [],
        minLight:
          condition.minSkyLight !== null && condition.minSkyLight !== undefined
            ? Number(condition.minSkyLight)
            : null,
        maxLight:
          condition.maxSkyLight !== null && condition.maxSkyLight !== undefined
            ? Number(condition.maxSkyLight)
            : null,
        lureOnly: hasLureCondition,
        isRaining:
          condition.isRaining !== null && condition.isRaining !== undefined
            ? Boolean(condition.isRaining)
            : null,
        isThundering:
          condition.isThundering !== null && condition.isThundering !== undefined
            ? Boolean(condition.isThundering)
            : null,
        weightMultipliers: parseWeightMultipliers(spawnData.weightMultiplier),
      });
    }
  }
  return entries;
}

/** 提取权重倍率中可评估的条件字段 */
function pickMultiplierCondition(raw: unknown): WeightMultiplierRaw["condition"] {
  const out: WeightMultiplierRaw["condition"] = {};
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return out;
  }
  const cond = raw as {
    isRaining?: unknown;
    isThundering?: unknown;
    timeRange?: unknown;
    biomes?: unknown;
  };
  if (cond.isRaining !== null && cond.isRaining !== undefined) {
    out.isRaining = Boolean(cond.isRaining);
  }
  if (cond.isThundering !== null && cond.isThundering !== undefined) {
    out.isThundering = Boolean(cond.isThundering);
  }
  if (typeof cond.timeRange === "string") {
    out.timeRange = cond.timeRange;
  }
  if (Array.isArray(cond.biomes)) {
    out.biomes = cond.biomes.map(String);
  }
  return out;
}

/** 解析 spawn.weightMultiplier（可为单个对象或数组） */
function parseWeightMultipliers(raw: unknown): WeightMultiplierRaw[] {
  let list: unknown[];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (raw !== null && raw !== undefined) {
    list = [raw];
  } else {
    list = [];
  }
  return list.map((item) => {
    const w = item as {
      multiplier?: unknown;
      condition?: unknown;
      anticondition?: unknown;
    } | null;
    return {
      multiplier: Number(w?.multiplier ?? 1),
      condition: pickMultiplierCondition(w?.condition),
      anticondition: pickMultiplierCondition(w?.anticondition),
    };
  });
}

/**
 * 收集所有命名空间下的生物群系标签定义（tags/worldgen/biome/**），
 * 返回 标签（#ns:path）-> 成员列表（含嵌套标签与具体群系 id）。
 * dataRoots 为数据根目录（包含 <namespace>/tags/worldgen/biome 结构），
 * 例如 cobblemon 的 resources/data 与 All The Mons 的 kubejs/data。
 */
function loadBiomeTagContents(dataRoots: string[]): Record<string, string[]> {
  const map = new Map<string, string[]>();
  for (const dataRoot of dataRoots) {
    if (!dataRoot || !existsSync(dataRoot)) {
      continue;
    }
    for (const nsEntry of readdirSync(dataRoot, { withFileTypes: true })) {
      if (!nsEntry.isDirectory()) {
        continue;
      }
      const ns = nsEntry.name;
      const tagDir = join(dataRoot, ns, "tags", "worldgen", "biome");
      if (!existsSync(tagDir)) {
        continue;
      }
      for (const file of collectJsonFiles(tagDir)) {
        const tag = readJson(file);
        if (tag === null || typeof tag !== "object" || Array.isArray(tag)) {
          continue;
        }
        const values = (tag as { values?: unknown }).values;
        if (!Array.isArray(values)) {
          continue;
        }
        const rel = file
          .slice(tagDir.length + 1)
          .replaceAll("\\", "/")
          .replace(/\.json$/, "");
        const key = `#${ns}:${rel}`;
        map.set(
          key,
          values.map((v) => {
            if (typeof v === "string") {
              return v;
            }
            if (v !== null && typeof v === "object" && "id" in (v as object)) {
              return String((v as { id: unknown }).id);
            }
            return String(v);
          }),
        );
      }
    }
  }
  return Object.fromEntries(map);
}

/**
 * 由标签内容构建「群系 -> 所属标签」的反向映射。
 * 通过标签间嵌套链做传递解析：群系属于标签 T，当且仅当它直接列在 T 中，
 * 或 T 包含的某个（本数据内可解析的）嵌套标签中含有该群系。
 * 注：指向外部数据包（如 #minecraft:is_jungle）的嵌套标签在本仓库内无法展开，
 * 因此仅经由外部标签引用的原版群系不会出现在结果中。
 */
function buildBiomeTagReverse(
  contents: Record<string, string[]>,
): Record<string, string[]> {
  const nestedCache = new Map<string, Set<string>>();
  const resolveTag = (tag: string, stack: Set<string>): Set<string> => {
    const cached = nestedCache.get(tag);
    if (cached) {
      return cached;
    }
    if (stack.has(tag)) {
      return new Set(); // 循环引用保护
    }
    const result = new Set<string>();
    const members = contents[tag];
    if (!members) {
      return result;
    }
    stack.add(tag);
    for (const member of members) {
      if (member.startsWith("#")) {
        const sub = resolveTag(member, stack);
        for (const s of sub) {
          result.add(s);
        }
      } else {
        result.add(member);
      }
    }
    stack.delete(tag);
    nestedCache.set(tag, result);
    return result;
  };

  const reverse = new Map<string, Set<string>>();
  for (const tag of Object.keys(contents)) {
    for (const biome of resolveTag(tag, new Set())) {
      let set = reverse.get(biome);
      if (!set) {
        set = new Set();
        reverse.set(biome, set);
      }
      set.add(tag);
    }
  }
  return Object.fromEntries(
    [...reverse.entries()].map(([biome, tags]) => [biome, [...tags].sort()]),
  );
}

/** 将 id 转成可读标签（如 pecha_berry -> Pecha Berry） */
function humanize(id: string): string {
  return id
    .split("_")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/**
 * 计算材料显示分类与其子类别明细。
 * 优先级：属性 > 蛋群 > 基础点数 > 其他；detail 为该分类下效果的子类别 id（去重）。
 */
function materialCategoryAndDetail(effects: BaitEffect[]): {
  category: MaterialCategory;
  detail: string[];
} {
  for (const category of CATEGORY_PRIORITY) {
    const matching = effects.filter(
      (e) => EFFECT_TYPE_TO_CATEGORY[e.type] === category && e.subcategory !== null,
    );
    if (matching.length > 0) {
      return {
        category,
        detail: [...new Set(matching.map((e) => e.subcategory as string))],
      };
    }
  }
  return { category: "other", detail: [] };
}

/**
 * 组装可选材料列表：
 * - 有 spawn_bait_effects 的树果（kind=berry）
 * - 有 spawn_bait_effects 的其他物品（kind=item）
 * - 带 baitEffects 的调料（kind=seasoning，通过 seasonings/<id> 标识解析）
 * 仅保留影响刷新概率 / 频率的材料，并标注效果分类 tags。
 */
function buildMaterials(
  baitEffects: Map<string, SpawnBaitRaw>,
  berries: Map<string, BerryRaw>,
  seasonings: Map<string, SeasoningRaw>,
  lang: Record<string, string>,
): MaterialRaw[] {
  const materials: MaterialRaw[] = [];
  const seen = new Set<string>();
  for (const [baitId, bait] of baitEffects) {
    if (bait.effects.length === 0) {
      continue; // 无效果的兜底物品（如 poke_bait）不列为可选材料
    }
    // 仅保留影响刷新概率/频率的材料；纯个体加成（性格、个体值等）材料不显示
    if (!bait.effects.some((e) => PROBABILITY_EFFECT_TYPES.has(e.type))) {
      continue;
    }
    const { category, detail } = materialCategoryAndDetail(bait.effects);
    const itemId = bait.item.split(":").pop() ?? "";
    const kind: MaterialKind = berries.has(itemId) ? "berry" : "item";
    const berry = berries.get(itemId);
    const id = `${kind}:${itemId}`;
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    materials.push({
      id,
      kind,
      label: itemZhLabel(lang, itemId) ?? berry?.name ?? humanize(itemId),
      baitId,
      flavours: berry?.flavours ?? null,
      category,
      detail,
    });
  }
  for (const [seasoningId, seasoning] of seasonings) {
    if (seasoning.effects.length === 0) {
      continue;
    }
    const { category, detail } = materialCategoryAndDetail(seasoning.effects);
    const id = `seasoning:${seasoningId}`;
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    const itemId = seasoning.item.split(":").pop() ?? seasoningId;
    materials.push({
      id,
      kind: "seasoning",
      label:
        itemZhLabel(lang, itemId) ??
        itemZhLabel(lang, seasoningId) ??
        humanize(seasoningId),
      baitId: `seasonings:${seasoningId}`,
      flavours: null,
      category,
      detail,
    });
  }
  return materials;
}

function main(): void {
  if (!existsSync(DATA_DIR)) {
    console.error(`[error] 找不到 Cobblemon 数据目录：${DATA_DIR}`);
    console.error("请通过环境变量 COBBLEMON_DATA_DIR 指定数据目录后重试。");
    process.exit(1);
  }

  const overridesDir = OVERRIDES_DIR && existsSync(OVERRIDES_DIR) ? OVERRIDES_DIR : null;
  if (OVERRIDES_DIR && !overridesDir) {
    console.warn(`[warn] 覆盖数据目录不存在，已忽略：${OVERRIDES_DIR}`);
  }

  const lang = loadLang();
  const versions = loadVersions();
  const baitEffects = loadBaitEffects(DATA_DIR, overridesDir);
  const berries = loadBerries(DATA_DIR);
  const seasonings = loadSeasonings(DATA_DIR, overridesDir);
  const species = loadSpecies(DATA_DIR, lang);
  const spawnPool = loadSpawnPool(DATA_DIR, overridesDir);
  // 群系标签内容：基础模组（cobblemon 命名空间）+ All The Mons 数据包根目录
  const overridesDataRoot = overridesDir ? resolve(overridesDir, "..") : null;
  const biomeTagContents = loadBiomeTagContents(
    [resolve(DATA_DIR, ".."), overridesDataRoot].filter((d): d is string => d !== null),
  );
  // 合并外部数据包（原版 / Common）生物群系标签，使原版群系能解析出 is_overworld 等标签
  for (const [tag, members] of Object.entries(VANILLA_TAG_BIOMES)) {
    if (!(tag in biomeTagContents)) {
      biomeTagContents[tag] = members;
    }
  }
  const biomeTagReverse = buildBiomeTagReverse(biomeTagContents);
  const materials = buildMaterials(baitEffects, berries, seasonings, lang);

  mkdirSync(OUT_DIR, { recursive: true });

  const write = (name: string, data: unknown): void =>
    writeFileSync(join(OUT_DIR, name), JSON.stringify(data), "utf8");

  // 将带 baitEffects 的调料也写入 bait-effects（以 seasonings:<id> 为键），
  // 便于前端按 material.baitId 直接解析效果（对应源码 SpawnBaitEffects.getFromIdentifier 的 seasonings 分支）。
  const baitEffectsAll = new Map(baitEffects);
  for (const [seasoningId, seasoning] of seasonings) {
    if (seasoning.effects.length === 0) {
      continue;
    }
    baitEffectsAll.set(`seasonings:${seasoningId}`, {
      item: seasoning.item,
      effects: seasoning.effects,
    });
  }

  write("bait-effects.json", Object.fromEntries(baitEffectsAll));
  write("species.json", [...species.values()]);
  write("spawn-pool.json", spawnPool);
  write("biome-tags-reverse.json", biomeTagReverse);
  write("materials.json", materials);
  write("meta.json", {
    generatedAt: new Date().toISOString(),
    versions,
    counts: {
      species: species.size,
      spawnPool: spawnPool.length,
      materials: materials.length,
    },
  });

  console.log(`已生成数据到 ${OUT_DIR}`);
  console.log(`  bait-effects: ${baitEffects.size}`);
  console.log(`  berries: ${berries.size}`);
  console.log(`  seasonings(带 baitEffects): ${seasonings.size}`);
  console.log(`  species: ${species.size}`);
  console.log(`  spawn-pool 条目: ${spawnPool.length}`);
  console.log(`  biome tag reverse: ${Object.keys(biomeTagReverse).length}`);
  console.log(`  materials: ${materials.length}`);
}

main();
