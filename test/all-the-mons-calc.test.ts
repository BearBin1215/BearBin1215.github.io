import { describe, expect, it } from "vitest";
import {
  computeImpact,
  computeSpeciesWeight,
  filterScenarioPool,
  mergeEffects,
  resolveLure,
  weightMultiplierApplies,
  weightMultiplierProduct,
} from "@/pages/toys/all-the-mons/calc";
import type {
  BaitEffect,
  AllTheMonsData,
  PoolEntry,
} from "@/pages/toys/all-the-mons/types";

/** 构造一份最小可用的测试数据 */
function makeData(overrides: Partial<AllTheMonsData> = {}): AllTheMonsData {
  const species: AllTheMonsData["species"] = {
    charmander: {
      id: "charmander",
      name: "Charmander",
      types: ["fire"],
      eggGroups: ["monster", "dragon"],
      evYield: { speed: 1 },
    },
    bulbasaur: {
      id: "bulbasaur",
      name: "Bulbasaur",
      types: ["grass", "poison"],
      eggGroups: ["monster", "grass"],
      evYield: { special_attack: 1 },
    },
    squirtle: {
      id: "squirtle",
      name: "Squirtle",
      types: ["water"],
      eggGroups: ["monster", "water_1"],
      evYield: { defence: 1 },
    },
    dragonite: {
      id: "dragonite",
      name: "Dragonite",
      types: ["dragon", "flying"],
      eggGroups: ["water_1", "dragon"],
      evYield: { attack: 3 },
    },
  };

  const spawnPool: PoolEntry[] = [
    {
      p: "charmander",
      bucket: "common",
      weight: 10,
      pos: "grounded",
      biomes: ["#cobblemon:is_jungle"],
      anti: [],
      minLight: null,
      maxLight: null,
      lureOnly: false,
      isRaining: null,
      isThundering: null,
      weightMultipliers: [],
    },
    {
      p: "bulbasaur",
      bucket: "common",
      weight: 10,
      pos: "grounded",
      biomes: ["#cobblemon:is_jungle"],
      anti: [],
      minLight: 8,
      maxLight: 15,
      lureOnly: false,
      isRaining: null,
      isThundering: null,
      weightMultipliers: [],
    },
    {
      p: "squirtle",
      bucket: "common",
      weight: 10,
      pos: "submerged",
      biomes: ["#cobblemon:is_jungle"],
      anti: [],
      minLight: 0,
      maxLight: 7,
      lureOnly: false,
      isRaining: null,
      isThundering: null,
      weightMultipliers: [],
    },
    {
      p: "charmander",
      bucket: "common",
      weight: 10,
      pos: "grounded",
      biomes: ["#cobblemon:is_overworld"],
      anti: ["#cobblemon:is_jungle"],
      minLight: null,
      maxLight: null,
      lureOnly: false,
      isRaining: null,
      isThundering: null,
      weightMultipliers: [],
    },
    {
      p: "dragonite",
      bucket: "rare",
      weight: 4,
      pos: "grounded",
      biomes: ["#cobblemon:is_jungle"],
      anti: [],
      minLight: null,
      maxLight: null,
      lureOnly: false,
      isRaining: null,
      isThundering: null,
      weightMultipliers: [],
    },
  ];

  return {
    baitEffects: {
      "berries/pecha_berry": {
        item: "cobblemon:pecha_berry",
        effects: [
          { type: "cobblemon:egg_group", subcategory: "water_1", chance: 1, value: 10 },
        ],
      },
      "berries/charti_berry": {
        item: "cobblemon:charti_berry",
        effects: [
          { type: "cobblemon:typing", subcategory: "rock", chance: 1, value: 10 },
        ],
      },
      "berries/occa_berry": {
        item: "cobblemon:occa_berry",
        effects: [
          { type: "cobblemon:typing", subcategory: "fire", chance: 1, value: 10 },
        ],
      },
      "berries/pomeg_berry": {
        item: "cobblemon:pomeg_berry",
        effects: [{ type: "cobblemon:ev", subcategory: "hp", chance: 1, value: 100 }],
      },
      "berries/hami_berry": {
        item: "cobblemon:hami_berry",
        effects: [{ type: "cobblemon:ev", subcategory: "spa", chance: 1, value: 100 }],
      },
      "fruits/allthemodium_apple": {
        item: "allthemodium:allthemodium_apple",
        effects: [
          { type: "cobblemon:rarity_bucket", subcategory: null, chance: 1, value: 12 },
        ],
      },
    },
    materials: [
      {
        id: "berry:pecha_berry",
        kind: "berry",
        label: "Pecha Berry",
        baitId: "berries/pecha_berry",
        flavours: { SWEET: 10 },
        category: "egg_group",
        detail: ["water_3", "bug"],
      },
      {
        id: "berry:charti_berry",
        kind: "berry",
        label: "Charti Berry",
        baitId: "berries/charti_berry",
        flavours: null,
        category: "typing",
        detail: ["rock"],
      },
      {
        id: "berry:occa_berry",
        kind: "berry",
        label: "Occa Berry",
        baitId: "berries/occa_berry",
        flavours: null,
        category: "typing",
        detail: ["fire"],
      },
      {
        id: "berry:pomeg_berry",
        kind: "berry",
        label: "Pomeg Berry",
        baitId: "berries/pomeg_berry",
        flavours: null,
        category: "ev",
        detail: ["hp"],
      },
      {
        id: "berry:hami_berry",
        kind: "berry",
        label: "Hami Berry",
        baitId: "berries/hami_berry",
        flavours: null,
        category: "ev",
        detail: ["spa"],
      },
      {
        id: "item:allthemodium_apple",
        kind: "item",
        label: "Allthemodium Apple",
        baitId: "fruits/allthemodium_apple",
        flavours: null,
        category: "other",
        detail: [],
      },
    ],
    species,
    spawnPool,
    biomeTagReverse: {},
    meta: { generatedAt: "", counts: {} },
    ...overrides,
  };
}

/** 合并效果：按 (type, subcategory) 分组，chance 求和（上限 1），value 求和后向上取整 */
describe("mergeEffects", () => {
  it("无效果返回空数组", () => {
    expect(mergeEffects([])).toEqual([]);
  });

  it("同类型同子类别合并 value 并向上取整", () => {
    const effects: BaitEffect[] = [
      { type: "cobblemon:typing", subcategory: "fire", chance: 1, value: 10 },
      { type: "cobblemon:typing", subcategory: "fire", chance: 1, value: 10 },
    ];
    const merged = mergeEffects(effects);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({
      type: "cobblemon:typing",
      subcategory: "fire",
      value: 20,
      chance: 1,
    });
  });

  it("chance 求和不超过 1", () => {
    const merged = mergeEffects([
      { type: "cobblemon:egg_group", subcategory: "bug", chance: 0.8, value: 5 },
      { type: "cobblemon:egg_group", subcategory: "bug", chance: 0.8, value: 5 },
    ]);
    expect(merged[0]?.chance).toBe(1);
  });

  it("不同子类别视为不同效果", () => {
    const merged = mergeEffects([
      { type: "cobblemon:egg_group", subcategory: "bug", chance: 1, value: 5 },
      { type: "cobblemon:egg_group", subcategory: "water_1", chance: 1, value: 5 },
    ]);
    expect(merged).toHaveLength(2);
  });
});

describe("resolveLure", () => {
  it("按材料 id 解析效果并合并", () => {
    const data = makeData();
    const lure = resolveLure(["berry:pecha_berry", "berry:occa_berry"], data);
    expect(lure.raw).toHaveLength(2);
    expect(lure.merged).toHaveLength(2);
    expect(lure.eggGroupEffects).toHaveLength(1);
    expect(lure.activeTypingEffect?.subcategory).toBe("fire");
  });

  it("rarity_bucket 计算层级", () => {
    const data = makeData();
    const lure = resolveLure(["item:allthemodium_apple"], data);
    expect(lure.rarityTier).toBe(12);
  });

  it("未知材料 id 被忽略", () => {
    const data = makeData();
    const lure = resolveLure(["不存在:xxx"], data);
    expect(lure.raw).toHaveLength(0);
    expect(lure.merged).toHaveLength(0);
  });
});

describe("computeSpeciesWeight", () => {
  const data = makeData();
  const charmander = data.species.charmander!;

  it("未知物种不产生变化", () => {
    const result = computeSpeciesWeight(null, [], []);
    expect(result.multiplier).toBe(1);
    expect(result.weight).toBe(1);
  });

  it("命中属性时权重乘以 value", () => {
    const raw: BaitEffect[] = [
      { type: "cobblemon:typing", subcategory: "fire", chance: 1, value: 10 },
    ];
    const merged = mergeEffects(raw);
    const result = computeSpeciesWeight(charmander, raw, merged);
    expect(result.weight).toBe(10);
    expect(result.matchedTyping).toBe("fire");
  });

  it("属性不匹配时权重不变", () => {
    const raw: BaitEffect[] = [
      { type: "cobblemon:typing", subcategory: "rock", chance: 1, value: 10 },
    ];
    const merged = mergeEffects(raw);
    const result = computeSpeciesWeight(charmander, raw, merged);
    expect(result.weight).toBe(1);
    expect(result.matchedTyping).toBeNull();
  });

  it("属性吸引只取原始列表首个 typing 效果（复刻源码行为）", () => {
    const raw: BaitEffect[] = [
      { type: "cobblemon:typing", subcategory: "rock", chance: 1, value: 10 },
      { type: "cobblemon:typing", subcategory: "fire", chance: 1, value: 10 },
    ];
    const merged = mergeEffects(raw);
    const result = computeSpeciesWeight(charmander, raw, merged);
    // 第一个 typing 是 rock，未命中 → 权重不变
    expect(result.weight).toBe(1);
    expect(result.matchedTyping).toBeNull();
  });

  it("ev 效果：物种无对应能力产量时权重归 0", () => {
    const raw: BaitEffect[] = [
      { type: "cobblemon:ev", subcategory: "hp", chance: 1, value: 100 },
    ];
    const merged = mergeEffects(raw);
    const result = computeSpeciesWeight(charmander, raw, merged);
    expect(result.weight).toBe(0);
    expect(result.blockedByEv).toBe("hp");
  });

  it("ev 命中对应能力时保留权重", () => {
    const raw: BaitEffect[] = [
      { type: "cobblemon:ev", subcategory: "speed", chance: 1, value: 100 },
    ];
    const merged = mergeEffects(raw);
    const result = computeSpeciesWeight(charmander, raw, merged);
    expect(result.weight).toBe(1);
    expect(result.blockedByEv).toBeNull();
  });

  it("ev 子类别使用 Showdown 短代码（spa=特攻）也能正确匹配 evYield", () => {
    const raw: BaitEffect[] = [
      { type: "cobblemon:ev", subcategory: "spa", chance: 1, value: 100 },
    ];
    const merged = mergeEffects(raw);
    // bulbasaur evYield.special_attack = 1 → 命中，不拦截
    const matched = computeSpeciesWeight(data.species.bulbasaur!, raw, merged);
    expect(matched.weight).toBe(1);
    expect(matched.blockedByEv).toBeNull();
    // charmander 无特攻产量 → 拦截
    const blocked = computeSpeciesWeight(charmander, raw, merged);
    expect(blocked.weight).toBe(0);
    expect(blocked.blockedByEv).toBe("spa");
  });

  it("命中蛋组时权重乘以 value", () => {
    const raw: BaitEffect[] = [
      { type: "cobblemon:egg_group", subcategory: "dragon", chance: 1, value: 10 },
    ];
    const merged = mergeEffects(raw);
    const result = computeSpeciesWeight(charmander, raw, merged);
    expect(result.weight).toBe(10);
    expect(result.matchedEggGroups).toContain("dragon");
  });
});

describe("filterScenarioPool", () => {
  const data = makeData();

  it("按生物群系标签过滤并应用反向条件", () => {
    const pool = filterScenarioPool(data, {
      biomeTags: ["#cobblemon:is_jungle"],
      light: "all",
      weather: "clear",
      posTypes: ["grounded", "submerged"],
    });
    // is_overworld + anti is_jungle 的条目被反向条件排除；其余 4 条保留
    expect(pool).toHaveLength(4);
    expect(pool.some((e) => e.biomes.includes("#cobblemon:is_overworld"))).toBe(false);
  });

  it("光照过滤：夜晚只保留与 0-7 范围相交的条目", () => {
    const pool = filterScenarioPool(data, {
      biomeTags: ["#cobblemon:is_jungle"],
      light: "night",
      weather: "clear",
      posTypes: ["grounded", "submerged"],
    });
    // charmander / dragonite（无光照限制）与 squirtle（0-7）保留；bulbasaur（8-15）排除
    expect(pool.map((e) => e.p)).toEqual(["charmander", "squirtle", "dragonite"]);
  });

  it("多标签取并集：任一标签命中即纳入，反向条件命中任一即排除", () => {
    const pool = filterScenarioPool(data, {
      biomeTags: ["#cobblemon:is_jungle", "#cobblemon:is_overworld"],
      light: "all",
      weather: "clear",
      posTypes: ["grounded", "submerged"],
    });
    // 5 条条目全部命中 is_jungle 或 is_overworld；
    // 但 is_overworld + anti is_jungle 的条目反向条件命中 is_jungle 被排除 → 剩 4 条
    expect(pool).toHaveLength(4);
    expect(pool.map((e) => e.p)).toEqual([
      "charmander",
      "bulbasaur",
      "squirtle",
      "dragonite",
    ]);
  });

  it("lureOnly 条目总是被排除", () => {
    const dataWithLure = makeData({
      spawnPool: [{ ...data.spawnPool[0]!, lureOnly: true }],
    });
    const pool = filterScenarioPool(dataWithLure, {
      biomeTags: ["#cobblemon:is_jungle"],
      light: "all",
      weather: "clear",
      posTypes: ["grounded"],
    });
    expect(pool).toHaveLength(0);
  });

  it("仅限雨天的条目不纳入（晴天）", () => {
    const dataWithRain = makeData({
      spawnPool: [{ ...data.spawnPool[0]!, isRaining: true }],
    });
    const pool = filterScenarioPool(dataWithRain, {
      biomeTags: ["#cobblemon:is_jungle"],
      light: "all",
      weather: "clear",
      posTypes: ["grounded", "submerged"],
    });
    expect(pool).toHaveLength(0);
  });

  it("天气条件：雨天/雷暴条目仅在对应天气下纳入", () => {
    const dataWithWeather = makeData({
      spawnPool: [
        { ...data.spawnPool[0]!, isRaining: true },
        { ...data.spawnPool[1]!, isThundering: true },
      ],
    });
    const base = {
      biomeTags: ["#cobblemon:is_jungle"],
      light: "all",
      posTypes: ["grounded", "submerged"],
    } as const;
    // 晴天：两个都被排除
    expect(
      filterScenarioPool(dataWithWeather, { ...base, weather: "clear" }),
    ).toHaveLength(0);
    // 雨天：仅雨天的纳入，雷暴的不纳入
    const rain = filterScenarioPool(dataWithWeather, { ...base, weather: "rain" });
    expect(rain.map((e) => e.p)).toEqual(["charmander"]);
    // 雷暴：雨天与雷暴条目都纳入
    expect(
      filterScenarioPool(dataWithWeather, { ...base, weather: "thunder" }),
    ).toHaveLength(2);
  });
});

describe("weightMultiplier", () => {
  const data = makeData();

  it("雷暴权重倍率在雷暴天气下生效、晴天不生效", () => {
    const scenarioClear = {
      biomeTags: ["#cobblemon:is_jungle"],
      light: "day" as const,
      weather: "clear" as const,
      posTypes: ["grounded"],
    };
    const scenarioThunder = { ...scenarioClear, weather: "thunder" as const };
    const wm = {
      multiplier: 5,
      condition: { isThundering: true },
      anticondition: {},
    };
    expect(weightMultiplierApplies(wm, scenarioClear)).toBe(false);
    expect(weightMultiplierApplies(wm, scenarioThunder)).toBe(true);
  });

  it("夜间权重倍率在夜晚光照下生效", () => {
    const scenarioNight = {
      biomeTags: ["#cobblemon:is_jungle"],
      light: "night" as const,
      weather: "clear" as const,
      posTypes: ["grounded"],
    };
    const scenarioDay = { ...scenarioNight, light: "day" as const };
    const wm = {
      multiplier: 2,
      condition: { timeRange: "night" },
      anticondition: {},
    };
    expect(weightMultiplierApplies(wm, scenarioNight)).toBe(true);
    expect(weightMultiplierApplies(wm, scenarioDay)).toBe(false);
  });

  it("多个倍率连乘，反向条件命中则不生效", () => {
    const scenario = {
      biomeTags: ["#cobblemon:is_jungle"],
      light: "day" as const,
      weather: "clear" as const,
      posTypes: ["grounded"],
    };
    const entry = {
      ...data.spawnPool[0]!,
      weightMultipliers: [
        { multiplier: 2, condition: { timeRange: "day" }, anticondition: {} },
        { multiplier: 3, condition: { isRaining: false }, anticondition: {} },
        {
          multiplier: 10,
          condition: { isRaining: false },
          anticondition: { isRaining: false },
        },
      ],
    };
    // 前两个生效（2×3=6），第三个因反向条件命中（非雨天）不生效
    expect(weightMultiplierProduct(entry, scenario)).toBe(6);
  });

  it("权重倍率参与概率计算：雷暴下受倍率影响的物种概率上升", () => {
    const baseScenario = {
      biomeTags: ["#cobblemon:is_jungle"],
      light: "all" as const,
      weather: "clear" as const,
      posTypes: ["grounded", "submerged"],
    };
    const dataWithWm = makeData({
      spawnPool: [
        {
          ...data.spawnPool[0]!,
          weightMultipliers: [
            { multiplier: 5, condition: { isThundering: true }, anticondition: {} },
          ],
        },
        ...data.spawnPool.slice(1),
      ],
    });
    const clearImpact = computeImpact(dataWithWm, baseScenario, []);
    const charmanderClear = clearImpact.species.find((s) => s.id === "charmander")!;
    const thunderImpact = computeImpact(
      dataWithWm,
      { ...baseScenario, weather: "thunder" },
      [],
    );
    const charmanderThunder = thunderImpact.species.find((s) => s.id === "charmander")!;
    expect(charmanderThunder.pAfter).toBeGreaterThan(charmanderClear.pAfter);
  });
});

describe("computeImpact", () => {
  const data = makeData();
  const baseScenario = {
    biomeTags: ["#cobblemon:is_jungle"],
    light: "all",
    weather: "clear",
    posTypes: ["grounded", "submerged"],
  } as const;

  it("未选材料时概率不变（ratio 为 1）", () => {
    const impact = computeImpact(data, baseScenario, []);
    expect(impact.summary.totalSpecies).toBe(4);
    expect(impact.species.every((s) => s.ratio === 1)).toBe(true);
    const charmander = impact.species.find((s) => s.id === "charmander")!;
    // common 桶权重归一化后约为 95.28%，桶内 3 个同权重条目 → 各占约 31.76%
    expect(charmander.pBefore).toBeCloseTo(100 * (83.25 / 87.375) * (10 / 30), 4);
  });

  it("属性吸引提升对应物种概率", () => {
    const impact = computeImpact(data, baseScenario, ["berry:occa_berry"]);
    const charmander = impact.species.find((s) => s.id === "charmander")!;
    const bulbasaur = impact.species.find((s) => s.id === "bulbasaur")!;
    expect(charmander.pAfter).toBeGreaterThan(charmander.pBefore);
    expect(bulbasaur.pAfter).toBeLessThan(bulbasaur.pBefore);
    expect(charmander.matchedTyping).toContain("fire");
  });

  it("重复材料会叠加效果（3 个槽位可重复，合并后 value 求和取整）", () => {
    const ids = ["berry:occa_berry", "berry:occa_berry"];
    const lure = resolveLure(ids, data);
    expect(lure.typingEffects[0]?.value).toBe(20);
    const impact = computeImpact(data, baseScenario, ids);
    const charmander = impact.species.find((s) => s.id === "charmander")!;
    const bulbasaur = impact.species.find((s) => s.id === "bulbasaur")!;
    expect(charmander.matchedTyping).toContain("fire");
    expect(charmander.pAfter).toBeGreaterThan(bulbasaur.pAfter);
  });

  it("rarity_bucket 层级触发桶归一化", () => {
    const impact = computeImpact(data, baseScenario, ["item:allthemodium_apple"]);
    expect(impact.rarityTier).toBe(12);
    // 归一化后桶权重之和为 100
    const sum = Object.values(impact.bucketAfter).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(100, 5);
    // 稀有度拉平：common 占比下降、rare 占比上升
    expect(impact.bucketBefore["common"]!).toBeGreaterThan(impact.bucketAfter["common"]!);
    expect(impact.bucketBefore["rare"]!).toBeLessThan(impact.bucketAfter["rare"]!);
  });

  it("ev 筛选将不匹配物种概率归零", () => {
    // 所有物种均无 hp 产量 → 全部被过滤
    const impact = computeImpact(data, baseScenario, ["berry:pomeg_berry"]);
    expect(impact.species.every((s) => s.blockedByEv)).toBe(true);
    expect(impact.summary.blocked).toBe(4);
  });
});
