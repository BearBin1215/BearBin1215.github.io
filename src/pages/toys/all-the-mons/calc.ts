/**
 * 宝点心吸引计算核心。
 *
 * 复刻 Cobblemon 源码中的机制：
 * - SpawnBaitUtils.mergeEffects：按 (type, subcategory) 合并，chance 求和（上限 1）、value 求和后向上取整
 * - SpawnBaitInfluence.affectWeight：typing / egg_group / ev 对权重的影响
 *   （注意：源码用「未合并」的原始效果列表取首个 typing / ev 效果，蛋组则遍历原始列表；本模块忠实复刻）
 * - BucketNormalizingInfluence：rarity_bucket 层级把各稀有度桶权重取 w^(1/n) 后归一到 100
 * - 概率模型：先按 pokeSnackBuckets 权重选桶，再在桶内按条目权重加权选择
 */
import type {
  BaitEffect,
  AllTheMonsData,
  MaterialInfo,
  PoolEntry,
  SpeciesInfo,
  WeightMultiplier,
} from "./types";

/** 宝点心生成池配置（best-spawner-config.json 的 pokeSnackBuckets） */
export const POKE_SNACK_BUCKETS: Record<string, number> = {
  common: 83.25,
  uncommon: 11.25,
  rare: 4.125,
  "ultra-rare": 1.375,
};

/** 稀有度桶归一化参数（PokeSnackSpawnerFactory 传入） */
const BUCKET_FIRST_TIER = 1.2;
const BUCKET_GRADIENT = 0.2;

/** 效果类型常量（对应 SpawnBait.Effects） */
const EFFECT = {
  TYPING: "cobblemon:typing",
  EGG_GROUP: "cobblemon:egg_group",
  EV: "cobblemon:ev",
  RARITY_BUCKET: "cobblemon:rarity_bucket",
  BITE_TIME: "cobblemon:bite_time",
} as const;

/** 不参与权重、只影响生成个体质量的效果类型 */
const QUALITY_EFFECT_TYPES = new Set([
  "cobblemon:nature",
  "cobblemon:iv",
  "cobblemon:shiny_reroll",
  "cobblemon:mark_chance",
  "cobblemon:drops_reroll",
  "cobblemon:gender_chance",
  "cobblemon:level_raise",
  "cobblemon:ha_chance",
  "cobblemon:alpha_chance",
  "cobblemon:friendship",
  "cobblemon:size",
]);

/**
 * 合并效果（复刻 SpawnBaitUtils.mergeEffects）。
 * 按 (type, subcategory) 分组：chance 求和但不超过 1，value 求和后向上取整。
 */
export function mergeEffects(effects: BaitEffect[]): BaitEffect[] {
  const groups = new Map<string, BaitEffect[]>();
  for (const effect of effects) {
    const key = `${effect.type}\u0000${effect.subcategory ?? ""}`;
    const list = groups.get(key) ?? [];
    list.push(effect);
    groups.set(key, list);
  }

  return [...groups.values()].map((group) => {
    const { type, subcategory } = group[0]!;
    const totalChance = group.reduce((sum, e) => sum + e.chance, 0);
    const totalValue = group.reduce((sum, e) => sum + e.value, 0);
    return {
      type,
      subcategory,
      chance: Math.min(totalChance, 1),
      value: Math.ceil(totalValue),
    };
  });
}

/**
 * 解析某个材料的效果列表。
 * @param material 材料
 * @param data 聚合数据
 * @returns 该材料对应的原始效果列表（可能为空）
 */
function getMaterialEffects(
  material: MaterialInfo,
  data: AllTheMonsData,
): BaitEffect[] {
  return data.baitEffects[material.baitId]?.effects ?? [];
}

/** 场景光照范围 */
export type LightRange = "all" | "day" | "night";

/** 场景天气 */
export type Weather = "clear" | "rain" | "thunder";

/** 计算场景（选择生物群系 + 光照 + 天气 + 生成位置） */
export interface Scenario {
  /**
   * 生物群系标签列表，如 ["#cobblemon:is_jungle", "#cobblemon:is_overworld"]。
   * 表示当前群系同时属于这些标签：出生条目条件命中任一标签即纳入，
   * 反向条件命中任一标签即排除（取并集）。
   */
  biomeTags: readonly string[];
  /** 光照范围：all 全部 / day 白天(8-15) / night 夜晚(0-7) */
  light: LightRange;
  /** 天气：clear 晴 / rain 雨 / thunder 雷暴 */
  weather: Weather;
  /** 包含的生成位置类型 */
  posTypes: readonly string[];
}

/** 天气是否为「下雨」（雨或雷暴） */
function isRaining(weather: Weather): boolean {
  return weather === "rain" || weather === "thunder";
}

/** 合并后的吸引效果摘要 */
export interface LureSummary {
  /** 原始效果列表（按材料选择顺序） */
  raw: BaitEffect[];
  /** 合并后效果 */
  merged: BaitEffect[];
  /** rarity_bucket 合并后的总层级（决定桶归一化强度） */
  rarityTier: number;
  /** typing 相关效果（合并后） */
  typingEffects: BaitEffect[];
  /** egg_group 相关效果（合并后） */
  eggGroupEffects: BaitEffect[];
  /** ev 相关效果（合并后） */
  evEffects: BaitEffect[];
  /** bite_time 相关效果（合并后） */
  biteTimeEffects: BaitEffect[];
  /** 影响生成个体质量的效果（合并后） */
  qualityEffects: BaitEffect[];
  /** 权重计算实际生效的首个 typing 效果（源码取原始列表首个） */
  activeTypingEffect: BaitEffect | null;
  /** 权重计算实际生效的首个 ev 效果 */
  activeEvEffect: BaitEffect | null;
}

/**
 * 由选中的材料 id 列表解析出完整吸引效果摘要。
 * @param materialIds 材料 id 列表（顺序即材料顺序，影响首 typing/ev 效果）
 * @param data 聚合数据
 */
export function resolveLure(materialIds: string[], data: AllTheMonsData): LureSummary {
  const byId = new Map(data.materials.map((m) => [m.id, m]));
  const raw: BaitEffect[] = [];
  for (const id of materialIds) {
    const material = byId.get(id);
    if (!material) {
      continue;
    }
    raw.push(...getMaterialEffects(material, data));
  }
  const merged = mergeEffects(raw);

  const activeTypingEffect = raw.find((e) => e.type === EFFECT.TYPING) ?? null;
  const activeEvEffect = raw.find((e) => e.type === EFFECT.EV) ?? null;

  return {
    raw,
    merged,
    // 与源码 PokeSnackSpawnerFactory 一致：稀有度层级 = 原始 rarity_bucket 效果 value 之和取整
    rarityTier: Math.floor(
      raw.filter((e) => e.type === EFFECT.RARITY_BUCKET).reduce((s, e) => s + e.value, 0),
    ),
    typingEffects: merged.filter((e) => e.type === EFFECT.TYPING),
    eggGroupEffects: merged.filter((e) => e.type === EFFECT.EGG_GROUP),
    evEffects: merged.filter((e) => e.type === EFFECT.EV),
    biteTimeEffects: merged.filter((e) => e.type === EFFECT.BITE_TIME),
    qualityEffects: merged.filter((e) => QUALITY_EFFECT_TYPES.has(e.type)),
    activeTypingEffect,
    activeEvEffect,
  };
}

/** 单物种的权重影响结果 */
export interface SpeciesWeightResult {
  /** 最终权重（0 = 被 ev 条件过滤掉） */
  weight: number;
  /** 命中的属性（首个 typing 效果对应的属性，若命中） */
  matchedTyping: string | null;
  /** 命中的蛋群 */
  matchedEggGroups: string[];
  /** 因 EV 产量不匹配被过滤的属性（null = 未被过滤） */
  blockedByEv: string | null;
}

/**
 * EV 效果子类别（Showdown 短代码）到物种 evYield 键的映射。
 * 对应源码 Stats.getStat：atk->attack、def->defence、spa->special_attack、spd->special_defence、spe->speed、hp->hp。
 */
export const EV_STAT_KEYS: Record<string, string> = {
  hp: "hp",
  atk: "attack",
  attack: "attack",
  def: "defence",
  defense: "defence",
  defence: "defence",
  spa: "special_attack",
  spd: "special_defence",
  spe: "speed",
  speed: "speed",
};

/**
 * 计算单个物种受吸引效果的权重影响（复刻 SpawnBaitInfluence.affectWeight）。
 * @param species 物种信息（未知返回 null 乘数）
 * @param raw 原始（未合并）效果列表
 * @param merged 合并后效果列表
 */
export function computeSpeciesWeight(
  species: SpeciesInfo | null,
  raw: BaitEffect[],
  merged: BaitEffect[],
): SpeciesWeightResult {
  if (!species) {
    return {
      weight: 1,
      matchedTyping: null,
      matchedEggGroups: [],
      blockedByEv: null,
    };
  }

  const hasRelevant =
    merged.some((e) => e.type === EFFECT.EV) ||
    merged.some((e) => e.type === EFFECT.TYPING) ||
    merged.some((e) => e.type === EFFECT.EGG_GROUP);

  if (!hasRelevant) {
    return {
      weight: 1,
      matchedTyping: null,
      matchedEggGroups: [],
      blockedByEv: null,
    };
  }

  let weight = 1;
  let blockedByEv: string | null = null;

  // EV：源码取原始列表首个 ev 效果；物种对应能力产量为 0 时权重归 0
  if (merged.some((e) => e.type === EFFECT.EV)) {
    const evEffect = raw.find((e) => e.type === EFFECT.EV);
    if (evEffect?.subcategory) {
      const stat = evEffect.subcategory;
      const evYieldValue = species.evYield[EV_STAT_KEYS[stat] ?? stat] ?? 0;
      if (evYieldValue <= 0) {
        weight = 0;
        blockedByEv = stat;
      }
    }
  }

  let matchedTyping: string | null = null;
  // typing：源码取原始列表首个 typing 效果，命中属性则乘以 value
  if (weight > 0 && merged.some((e) => e.type === EFFECT.TYPING)) {
    const typingEffect = raw.find((e) => e.type === EFFECT.TYPING);
    if (typingEffect?.subcategory && species.types.includes(typingEffect.subcategory)) {
      matchedTyping = typingEffect.subcategory;
      weight *= typingEffect.value;
    }
  }

  // egg_group：遍历原始列表，命中任一蛋组则乘以对应 value
  const matchedEggGroups: string[] = [];
  if (weight > 0 && merged.some((e) => e.type === EFFECT.EGG_GROUP)) {
    for (const effect of raw) {
      if (effect.type !== EFFECT.EGG_GROUP || !effect.subcategory) {
        continue;
      }
      if (species.eggGroups.includes(effect.subcategory)) {
        matchedEggGroups.push(effect.subcategory);
        weight *= effect.value;
        break;
      }
    }
  }

  return {
    weight,
    matchedTyping,
    matchedEggGroups,
    blockedByEv,
  };
}

/** 判断光照条件是否兼容 */
function lightCompatible(entry: PoolEntry, light: LightRange): boolean {
  if (light === "all") {
    return true;
  }
  const range: [number, number] = light === "day" ? [8, 15] : [0, 7];
  const [min, max] = range;
  const lo = entry.minLight ?? 0;
  const hi = entry.maxLight ?? 15;
  return lo <= max && hi >= min;
}

/**
 * 过滤出指定场景下的生成池条目（宝点心场景）。
 * 固定排除垂钓位置与仅垂钓（minLureLevel）条目——宝点心无法触发。
 * 群系匹配取并集：条目条件生物群系命中任一选中标签即纳入，
 * 反向条件生物群系命中任一选中标签即排除。
 * 天气匹配：按场景天气判断 isRaining / isThundering 条件。
 */
export function filterScenarioPool(
  data: AllTheMonsData,
  scenario: Scenario,
): PoolEntry[] {
  const posSet = new Set(scenario.posTypes);
  const tagSet = new Set(scenario.biomeTags);
  const raining = isRaining(scenario.weather);
  const thundering = scenario.weather === "thunder";
  return data.spawnPool.filter((entry) => {
    if (entry.lureOnly) {
      return false;
    }
    if (!posSet.has(entry.pos)) {
      return false;
    }
    if (!lightCompatible(entry, scenario.light)) {
      return false;
    }
    if (entry.isRaining === true && !raining) {
      return false;
    }
    if (entry.isRaining === false && raining) {
      return false;
    }
    if (entry.isThundering === true && !thundering) {
      return false;
    }
    if (entry.isThundering === false && thundering) {
      return false;
    }
    if (entry.anti.some((a) => tagSet.has(a))) {
      return false;
    }
    if (!entry.biomes.some((b) => tagSet.has(b))) {
      return false;
    }
    return true;
  });
}

/** timeRange 是否与场景光照匹配（day/night 可直接匹配；dawn/dusk/twilight 等无法用白天/黑夜表示，视为不匹配） */
function timeRangeMatches(timeRange: string | undefined, light: LightRange): boolean {
  if (!timeRange || timeRange === "any") {
    return true;
  }
  if (timeRange === "day") {
    return light === "day";
  }
  if (timeRange === "night") {
    return light === "night";
  }
  return false;
}

/** 判断单个权重倍率的条件是否由场景满足（condition 全部满足且 anticondition 未命中） */
export function weightMultiplierApplies(
  wm: WeightMultiplier,
  scenario: Scenario,
): boolean {
  const cond = wm.condition;
  const anti = wm.anticondition;
  const raining = isRaining(scenario.weather);
  const thundering = scenario.weather === "thunder";

  const condOk =
    (cond.isRaining === undefined || cond.isRaining === raining) &&
    (cond.isThundering === undefined || cond.isThundering === thundering) &&
    timeRangeMatches(cond.timeRange, scenario.light) &&
    (cond.biomes === undefined ||
      cond.biomes.length === 0 ||
      cond.biomes.some((b) => scenario.biomeTags.includes(b)));

  const antiSatisfied =
    (anti.isRaining !== undefined && anti.isRaining === raining) ||
    (anti.isThundering !== undefined && anti.isThundering === thundering) ||
    (anti.timeRange !== undefined && timeRangeMatches(anti.timeRange, scenario.light)) ||
    (anti.biomes !== undefined &&
      anti.biomes.length > 0 &&
      anti.biomes.some((b) => scenario.biomeTags.includes(b)));

  return condOk && !antiSatisfied;
}

/** 计算条目在场景下的权重倍率乘积（多个倍率连乘） */
export function weightMultiplierProduct(entry: PoolEntry, scenario: Scenario): number {
  let product = 1;
  for (const wm of entry.weightMultipliers ?? []) {
    if (weightMultiplierApplies(wm, scenario)) {
      product *= wm.multiplier;
    }
  }
  return product;
}

/** 单物种受影响后的汇总 */
export interface SpeciesImpact {
  /** 物种 id */
  id: string;
  /** 显示名 */
  name: string;
  /** 属性 */
  types: string[];
  /** 出现的稀有度桶 */
  buckets: string[];
  /** 生成位置类型 */
  posTypes: string[];
  /** 基础权重总和（各条目求和） */
  baseWeight: number;
  /** 吸引后权重总和 */
  afterWeight: number;
  /** 基础概率（%） */
  pBefore: number;
  /** 吸引后概率（%） */
  pAfter: number;
  /** 概率变化（pAfter - pBefore） */
  delta: number;
  /** 概率倍率（pAfter / pBefore；基础为 0 时为 null） */
  ratio: number | null;
  /** 命中的吸引属性 */
  matchedTyping: string[];
  /** 命中的吸引蛋组 */
  matchedEggGroups: string[];
  /** 是否被 ev 过滤 */
  blockedByEv: boolean;
}

/** 场景条目（含物种信息与权重计算中间值） */
interface ScenarioEntry {
  entry: PoolEntry;
  species: SpeciesInfo | null;
  baseWeight: number;
  afterWeight: number;
  result: SpeciesWeightResult;
}

/** 计算结果 */
export interface ImpactResult {
  /** 按物种汇总后的影响列表（按 pAfter 降序） */
  species: SpeciesImpact[];
  /** 基础桶权重 */
  bucketBefore: Record<string, number>;
  /** 归一化后的桶权重 */
  bucketAfter: Record<string, number>;
  /** 稀有度层级 */
  rarityTier: number;
  /** 汇总统计 */
  summary: {
    /** 场景内物种总数 */
    totalSpecies: number;
    /** 概率上升的物种数 */
    boosted: number;
    /** 概率下降的物种数 */
    reduced: number;
    /** 不变/无法判断的物种数 */
    neutral: number;
    /** 被 ev 完全过滤的物种数 */
    blocked: number;
    /** 未在物种数据中找到的物种数 */
    unknown: number;
  };
}

/**
 * 计算吸引效果对指定场景下宝可梦刷新概率的影响。
 * 算法：
 * 1. 按 pokeSnackBuckets 权重选桶；若 rarityTier > 0，桶权重取 w^(1/n) 后归一到 100
 * 2. 桶内按条目权重加权选择（基础 vs 吸引后）
 * 3. 按物种汇总概率并给出前后对比
 */
export function computeImpact(
  data: AllTheMonsData,
  scenario: Scenario,
  materialIds: string[],
): ImpactResult {
  const lure = resolveLure(materialIds, data);
  const raw = lure.raw;
  const merged = lure.merged;
  const pool = filterScenarioPool(data, scenario);

  const entries: ScenarioEntry[] = pool.map((entry) => {
    const species = data.species[entry.p] ?? null;
    const result = computeSpeciesWeight(species, raw, merged);
    // 基础权重 × 场景权重倍率（天气 / 时间 / 群系）——场景条件同样作用于基础概率
    const baseWeight = entry.weight * weightMultiplierProduct(entry, scenario);
    // 基础权重 × 吸引影响
    const afterWeight = result.weight * baseWeight;
    return { entry, species, baseWeight, afterWeight, result };
  });

  // 桶权重：仅保留场景内出现的桶，并归一化到总和 100。
  // 与游戏 chooseBucket 一致：稀有度层级 > 0 时对权重取 w^(1/n) 再归一化（稀有度拉平）。
  const usedBuckets = new Set(entries.map((e) => e.entry.bucket));
  const rawBucketEntries = Object.entries(POKE_SNACK_BUCKETS).filter(([name]) =>
    usedBuckets.has(name),
  );
  const totalRaw = rawBucketEntries.reduce((s, [, w]) => s + w, 0);

  const bucketBefore: Record<string, number> = {};
  for (const [name, weight] of rawBucketEntries) {
    bucketBefore[name] = totalRaw > 0 ? (weight / totalRaw) * 100 : 0;
  }

  const bucketAfter: Record<string, number> = {};
  if (lure.rarityTier > 0) {
    const nf = BUCKET_FIRST_TIER + BUCKET_GRADIENT * (lure.rarityTier - 1);
    const transformed = rawBucketEntries.map(
      ([name, weight]) => [name, weight ** (1 / nf)] as const,
    );
    const totalTransformed = transformed.reduce((s, [, v]) => s + v, 0);
    for (const [name, value] of transformed) {
      bucketAfter[name] = totalTransformed > 0 ? (value / totalTransformed) * 100 : 0;
    }
  } else {
    Object.assign(bucketAfter, bucketBefore);
  }

  // 按桶分别计算概率
  const speciesMap = new Map<
    string,
    {
      id: string;
      name: string;
      types: string[];
      buckets: Set<string>;
      posTypes: Set<string>;
      baseWeight: number;
      afterWeight: number;
      pBefore: number;
      pAfter: number;
      matchedTyping: Set<string>;
      matchedEggGroups: Set<string>;
      blocked: boolean;
      unknown: boolean;
    }
  >();

  const ensure = (id: string, species: SpeciesInfo | null) => {
    let item = speciesMap.get(id);
    if (!item) {
      item = {
        id,
        name: species?.nameZh ?? species?.name ?? id,
        types: species?.types ?? [],
        buckets: new Set(),
        posTypes: new Set(),
        baseWeight: 0,
        afterWeight: 0,
        pBefore: 0,
        pAfter: 0,
        matchedTyping: new Set(),
        matchedEggGroups: new Set(),
        blocked: false,
        unknown: species === null,
      };
      speciesMap.set(id, item);
    }
    return item;
  };

  // 预计算每个桶的权重和，避免嵌套循环
  const sumByBucket = new Map<string, { base: number; after: number }>();
  for (const entry of entries) {
    const acc = sumByBucket.get(entry.entry.bucket) ?? { base: 0, after: 0 };
    acc.base += entry.baseWeight;
    acc.after += entry.afterWeight;
    sumByBucket.set(entry.entry.bucket, acc);
  }

  for (const entry of entries) {
    const bucketWeightBefore = bucketBefore[entry.entry.bucket] ?? 0;
    const bucketWeightAfter = bucketAfter[entry.entry.bucket] ?? 0;
    const sums = sumByBucket.get(entry.entry.bucket) ?? { base: 0, after: 0 };

    const pBefore =
      sums.base > 0 ? (bucketWeightBefore / 100) * (entry.baseWeight / sums.base) : 0;
    const pAfter =
      sums.after > 0 ? (bucketWeightAfter / 100) * (entry.afterWeight / sums.after) : 0;

    const item = ensure(entry.entry.p, entry.species);
    item.buckets.add(entry.entry.bucket);
    item.posTypes.add(entry.entry.pos);
    item.baseWeight += entry.baseWeight;
    item.afterWeight += entry.afterWeight;
    item.pBefore += pBefore;
    item.pAfter += pAfter;
    if (entry.result.matchedTyping) {
      item.matchedTyping.add(entry.result.matchedTyping);
    }
    entry.result.matchedEggGroups.forEach((g) => item.matchedEggGroups.add(g));
    if (entry.result.weight === 0) {
      item.blocked = true;
    }
  }

  const speciesImpacts: SpeciesImpact[] = [...speciesMap.values()]
    .map((item) => {
      const ratio = item.pBefore > 0 ? item.pAfter / item.pBefore : null;
      return {
        id: item.id,
        name: item.name,
        types: item.types,
        buckets: [...item.buckets],
        posTypes: [...item.posTypes],
        baseWeight: item.baseWeight,
        afterWeight: item.afterWeight,
        pBefore: item.pBefore * 100,
        pAfter: item.pAfter * 100,
        delta: item.pAfter * 100 - item.pBefore * 100,
        ratio,
        matchedTyping: [...item.matchedTyping],
        matchedEggGroups: [...item.matchedEggGroups],
        blockedByEv: item.blocked,
      };
    })
    .sort((a, b) => b.pAfter - a.pAfter);

  const summary = {
    totalSpecies: speciesImpacts.length,
    boosted: speciesImpacts.filter((s) => s.delta > 1e-9).length,
    reduced: speciesImpacts.filter((s) => s.delta < -1e-9).length,
    neutral: speciesImpacts.filter((s) => Math.abs(s.delta) <= 1e-9).length,
    blocked: speciesImpacts.filter((s) => s.blockedByEv).length,
    unknown: [...speciesMap.values()].filter((item) => item.unknown).length,
  };

  return {
    species: speciesImpacts,
    bucketBefore,
    bucketAfter,
    rarityTier: lure.rarityTier,
    summary,
  };
}
