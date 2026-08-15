import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  computeImpact,
  filterScenarioPool,
  resolveLure,
} from "@/pages/toys/all-the-mons/calc";
import type {
  AllTheMonsData,
  PoolEntry,
  SpawnBait,
  SpeciesInfo,
} from "@/pages/toys/all-the-mons/types";

/** 读取 public/data/all-the-mons 下生成的真实数据，验证管线对实际数据可正常工作 */
function loadRealData(): AllTheMonsData {
  const base = join(process.cwd(), "public/data/all-the-mons");
  const read = (name: string): unknown =>
    JSON.parse(readFileSync(join(base, name), "utf8"));
  const speciesList = read("species.json") as SpeciesInfo[];
  const species: Record<string, SpeciesInfo> = {};
  for (const s of speciesList) {
    species[s.id] = s;
  }
  return {
    baitEffects: read("bait-effects.json") as Record<string, SpawnBait>,
    materials: read("materials.json") as AllTheMonsData["materials"],
    species,
    spawnPool: read("spawn-pool.json") as PoolEntry[],
    biomeTagReverse: read("biome-tags-reverse.json") as Record<string, string[]>,
    labels: read("labels.json") as AllTheMonsData["labels"],
    meta: read("meta.json") as AllTheMonsData["meta"],
  };
}

describe("真实数据管线冒烟测试", () => {
  const data = loadRealData();

  it("数据规模符合预期", () => {
    expect(Object.keys(data.species).length).toBeGreaterThan(900);
    expect(data.spawnPool.length).toBeGreaterThan(2000);
    expect(data.materials.length).toBeGreaterThan(40);
  });

  it("材料均为影响刷新概率的类型（纯个体加成材料已过滤）", () => {
    const probabilityTypes = new Set([
      "cobblemon:typing",
      "cobblemon:egg_group",
      "cobblemon:ev",
      "cobblemon:rarity_bucket",
      "cobblemon:bite_time",
    ]);
    for (const m of data.materials) {
      const effects = data.baitEffects[m.baitId]?.effects ?? [];
      expect(
        effects.some((e) => probabilityTypes.has(e.type)),
        `${m.id} 不含影响刷新概率的效果`,
      ).toBe(true);
    }
  });

  it("神兽刷新标签（legendary_spawns_ccc）已纳入生成池与反查映射", () => {
    const legendaryInPool = data.spawnPool.filter((e) =>
      e.biomes.some((b) => b.startsWith("#legendary_spawns_ccc:")),
    );
    expect(legendaryInPool.length).toBeGreaterThan(10);
    const legendaryInReverse = new Set<string>();
    for (const tags of Object.values(data.biomeTagReverse)) {
      for (const t of tags) {
        if (t.startsWith("#legendary_spawns_ccc:")) {
          legendaryInReverse.add(t);
        }
      }
    }
    expect(legendaryInReverse.size).toBeGreaterThan(10);
  });

  it("群系反查可解析出刷新相关标签并用于场景过滤", () => {
    const poolTags = new Set<string>();
    for (const e of data.spawnPool) {
      for (const b of e.biomes) {
        poolTags.add(b);
      }
      for (const b of e.anti) {
        poolTags.add(b);
      }
    }
    expect(Object.keys(data.biomeTagReverse).length).toBeGreaterThan(400);

    const biome = "wythers:tropical_forest";
    const resolved = (data.biomeTagReverse[biome] ?? []).filter((t) => poolTags.has(t));
    expect(resolved).toContain("#cobblemon:is_jungle");
    const scenario = {
      biomeTags: resolved,
      light: "all",
      weather: "clear",
      posTypes: ["grounded", "surface", "submerged", "seafloor"],
    } as const;
    const pool = filterScenarioPool(data, scenario);
    expect(pool.length).toBeGreaterThan(0);
  });

  it("原版群系解析出 is_overworld，沙漠黑夜生成池规模与概率合理", () => {
    const poolTags = new Set<string>();
    for (const e of data.spawnPool) {
      for (const b of e.biomes) {
        poolTags.add(b);
      }
      for (const b of e.anti) {
        poolTags.add(b);
      }
    }
    const desertTags = (data.biomeTagReverse["minecraft:desert"] ?? []).filter((t) =>
      poolTags.has(t),
    );
    expect(desertTags).toContain("#cobblemon:is_overworld");
    const scenario = {
      biomeTags: desertTags,
      light: "night",
      weather: "clear",
      posTypes: ["grounded", "surface", "submerged", "seafloor"],
    } as const;
    const pool = filterScenarioPool(data, scenario);
    // 原版群系应解析出 is_overworld 标签，涵盖大量通用条目
    expect(pool.length).toBeGreaterThan(100);
    const impact = computeImpact(data, scenario, []);
    const landorus = impact.species.find((s) => s.id === "landorus");
    expect(landorus).toBeDefined();
    expect(landorus!.pAfter).toBeLessThan(0.1);
  });

  it("中文名覆盖：材料与物种均应有中文名", () => {
    const noZhMaterials = data.materials.filter(
      (m) => !/[\u4e00-\u9fff]/.test(m.names.zh),
    );
    expect(noZhMaterials).toEqual([]);
    const noZhSpecies = Object.values(data.species).filter((s) => !s.names.zh);
    expect(noZhSpecies).toEqual([]);
  });

  it("树果类材料都能在 bait-effects 中解析出效果", () => {
    const berries = data.materials.filter((m) => m.kind === "berry");
    expect(berries.length).toBeGreaterThan(30);
    for (const m of berries) {
      expect(data.baitEffects[m.baitId], `${m.baitId} 缺少效果定义`).toBeDefined();
      expect(data.baitEffects[m.baitId]!.effects.length).toBeGreaterThan(0);
    }
  });

  it("场景过滤与计算在丛林场景下产出合理结果", () => {
    const scenario = {
      biomeTags: ["#cobblemon:is_jungle"],
      light: "all",
      weather: "clear",
      posTypes: ["grounded", "surface", "submerged", "seafloor"],
    } as const;
    const pool = filterScenarioPool(data, scenario);
    expect(pool.length).toBeGreaterThan(50);

    // 草系吸引（rindo 果）：丛林必然存在草系物种，应出现概率上升
    const rindo = data.materials.find((m) => m.baitId === "berries/rindo_berry");
    expect(rindo).toBeDefined();
    const impact = computeImpact(data, scenario, rindo ? [rindo.id] : []);
    expect(impact.species.length).toBeGreaterThan(20);
    expect(impact.summary.totalSpecies).toBe(impact.species.length);
    const boosted = impact.species.filter((s) => s.delta > 1e-9);
    expect(boosted.length).toBeGreaterThan(0);
    expect(boosted[0]?.matchedTyping).toContain("grass");
  });

  it("稀有度层级效果在全量场景下会拉平稀有度桶", () => {
    const scenario = {
      biomeTags: ["#cobblemon:is_overworld"],
      light: "all",
      weather: "clear",
      posTypes: ["grounded"],
    } as const;
    const lure = resolveLure([], data);
    expect(lure.rarityTier).toBe(0);
    const apple = data.materials.find((m) => m.baitId === "fruits/allthemodium_apple");
    const impact = computeImpact(data, scenario, apple ? [apple.id] : []);
    expect(impact.rarityTier).toBe(12);
    const commonBefore = impact.bucketBefore["common"]!;
    const commonAfter = impact.bucketAfter["common"]!;
    expect(commonAfter).toBeLessThan(commonBefore);
  });
});
