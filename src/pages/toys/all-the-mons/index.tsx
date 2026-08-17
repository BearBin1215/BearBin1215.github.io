/**
 * All The Mons 宝点心吸引计算页面。
 * 加载静态数据，维护材料与场景（群系 / 光照 / 天气 / 生成位置）状态，
 * 计算吸引效果与影响结果，并组装页面各区块。
 */
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { ExternalLink } from "@/components/external-link";
import { useDocumentTitle } from "@/hooks/use-document-title";
import {
  computeImpact,
  resolveLure,
  type LightRange,
  type Scenario,
  type Weather,
} from "./calc";
import { loadAllTheMonsData } from "./loader";
import type { AllTheMonsData } from "./types";
import { type UiLabels } from "./shared";
import { MaterialSelector } from "./material-selector";
import { ScenarioSettings } from "./scenario-settings";
import { LureSummary, hasLureEffects } from "./lure-summary";
import { ImpactTable } from "./impact-table";

/** 材料槽位上限（对应游戏内烹饪锅的调料槽数量） */
const MAX_MATERIALS = 3;

export default function AllTheMonsCalculator() {
  useDocumentTitle("All The Mons 宝点心吸引计算");

  const [data, setData] = useState<AllTheMonsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [biomeId, setBiomeId] = useState("minecraft:plains");
  const [light, setLight] = useState<LightRange>("day");
  const [weather, setWeather] = useState<Weather>("clear");
  /** 生成位置（单选：宝点心周围地形同时存在多种时，应分次计算） */
  const [posType, setPosType] = useState<string>("grounded");

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    loadAllTheMonsData()
      .then((d) => setData(d))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : String(err)),
      );
  }, [reloadKey]);

  /** 生成池条件中出现过的所有标签（用于判断群系解析出的标签是否影响刷新） */
  const poolTagSet = useMemo(() => {
    const set = new Set<string>();
    if (!data) {
      return set;
    }
    for (const entry of data.spawnPool) {
      for (const b of entry.biomes) {
        set.add(b);
      }
      for (const b of entry.anti) {
        set.add(b);
      }
    }
    return set;
  }, [data]);

  /** 选中群系解析出的、与刷新相关的标签（仅保留生成池中用到的） */
  const resolvedBiomeTags = useMemo(() => {
    if (!data) {
      return [];
    }
    return (data.biomeTagReverse[biomeId] ?? []).filter((tag) => poolTagSet.has(tag));
  }, [data, biomeId, poolTagSet]);

  /** 可选的群系列表：仅保留能解析出至少一个刷新相关标签的群系 */
  const biomeOptions = useMemo(
    () =>
      data
        ? Object.keys(data.biomeTagReverse)
            .filter((b) =>
              (data.biomeTagReverse[b] ?? []).some((tag) => poolTagSet.has(tag)),
            )
            .sort()
        : [],
    [data, poolTagSet],
  );

  const scenario: Scenario = useMemo(
    () => ({ biomeTags: resolvedBiomeTags, light, weather, posTypes: [posType] }),
    [resolvedBiomeTags, light, weather, posType],
  );

  const lure = useMemo(
    () => (data ? resolveLure(selected, data) : null),
    [data, selected],
  );

  const impact = useMemo(
    () => (data ? computeImpact(data, scenario, selected) : null),
    [data, scenario, selected],
  );

  /** 界面中文标签映射（由数据文件派生） */
  const labels: UiLabels = useMemo(() => {
    if (!data) {
      return { types: {}, stats: {}, eggGroups: {} };
    }
    return {
      types: data.labels.types.zh,
      stats: data.labels.stats.zh,
      eggGroups: data.labels.eggGroups.zh,
    };
  }, [data]);

  /** 物种 id -> 中文名称（zh 缺失时回退 en），供影响结果表格展示 */
  const namesById = useMemo(() => {
    const map: Record<string, string> = {};
    if (data) {
      for (const sp of Object.values(data.species)) {
        map[sp.id] = sp.names.zh ?? sp.names.en;
      }
    }
    return map;
  }, [data]);

  /** 版本说明（对应版本 All the Mons xxx / Cobblemon yyy） */
  const versionText = (() => {
    const v = data?.meta.versions;
    if (!v?.allTheMons && !v?.cobblemon) {
      return "";
    }
    return `（对应版本 All the Mons ${v.allTheMons ?? "?"} / Cobblemon ${v.cobblemon ?? "?"}）`;
  })();

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">All The Mons 宝点心吸引计算</h1>
        <Empty>
          <EmptyTitle>数据加载失败</EmptyTitle>
          <EmptyDescription>{error}</EmptyDescription>
          <Button variant="outline" onClick={() => setReloadKey((k) => k + 1)}>
            重试
          </Button>
        </Empty>
      </div>
    );
  }

  if (!data || !lure || !impact) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">All The Mons 宝点心吸引计算</h1>
        <div className="flex h-20 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Spinner />
          正在加载数据…
        </div>
      </div>
    );
  }

  /** 追加材料到下一个空槽位（已满则忽略） */
  const addMaterial = (id: string) => {
    setSelected((prev) => {
      if (prev.length >= MAX_MATERIALS) {
        return prev;
      }
      return [...prev, id];
    });
  };

  /** 移除指定槽位的材料 */
  const removeSlot = (index: number) => {
    setSelected((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">All The Mons 宝点心吸引计算</h1>
      <p className="text-sm">
        计算{" "}
        <ExternalLink href="https://www.curseforge.com/minecraft/modpacks/all-the-mons">
          All The Mons
        </ExternalLink>{" "}
        整合包中，不同树果 /
        材料搭配制作的宝点心在指定场景下对宝可梦刷新的影响。计算逻辑复刻自{" "}
        <ExternalLink href="https://www.curseforge.com/minecraft/mc-mods/cobblemon">
          Cobblemon
        </ExternalLink>{" "}
        模组。
      </p>
      <p className="text-xs text-muted-foreground">
        数据快照生成于 {new Date(data.meta.generatedAt).toLocaleString()}
        {versionText}，已合并 All The Mons 的 材料与生成池覆盖（如
        ATM苹果、ATM胡萝卜及神兽/幻兽生成条目）。 共 {data.meta.counts.species} 种宝可梦、
        {data.meta.counts.spawnPool} 条生成池条目、
        {data.meta.counts.materials} 种材料。
      </p>

      <Card>
        <CardHeader>
          <CardTitle>材料选择</CardTitle>
          <CardDescription>
            制作宝点心使用的树果 / 材料，共 {MAX_MATERIALS} 个槽位，可重复选择；
            仅列出影响刷新概率 / 频率的材料，纯个体加成（性格、个体值等）材料不显示。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MaterialSelector
            materials={data.materials}
            selected={selected}
            maxCount={MAX_MATERIALS}
            labels={labels}
            baitEffects={data.baitEffects}
            onAdd={addMaterial}
            onRemoveAt={removeSlot}
            onClear={() => setSelected([])}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>场景设置</CardTitle>
          <CardDescription>选择所在群系，可通过名字或 #标签 筛选。</CardDescription>
        </CardHeader>
        <CardContent>
          <ScenarioSettings
            biomes={biomeOptions}
            biomeId={biomeId}
            onBiomeChange={setBiomeId}
            tagsByBiome={data.biomeTagReverse}
            biomeTags={resolvedBiomeTags}
            light={light}
            onLightChange={setLight}
            weather={weather}
            onWeatherChange={setWeather}
            posType={posType}
            onPosTypeChange={setPosType}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>吸引效果摘要</CardTitle>
          <CardDescription>
            {hasLureEffects(lure)
              ? "合并后的效果。属性 / 蛋群吸引会提高对应宝可梦的权重，基础点数筛选只保留匹配的宝可梦。"
              : "尚未选择材料。"}
          </CardDescription>
        </CardHeader>
        {hasLureEffects(lure) && (
          <CardContent>
            <LureSummary lure={lure} labels={labels} />
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>
            场景内共 {impact.summary.totalSpecies} 种宝可梦
            {selected.length === 0 ? "（未选择材料，以下为基础刷新概率）" : ""}。 上升{" "}
            {impact.summary.boosted}，下降 {impact.summary.reduced}， 其中{" "}
            {impact.summary.blocked} 被基础点数过滤。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImpactTable impact={impact} labels={labels} namesById={namesById} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>算法说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            概率模型：先按宝点心桶权重（common 83.25 / uncommon 11.25 / rare 4.125 /
            ultra-rare
            1.375）加权选桶，再在桶内按条目权重加权选择，最后按宝可梦汇总。若材料含
            rarity_bucket 效果，桶权重会先取 w^(1/n) 并归一到
            100，使稀有度桶被拉平、高稀有宝可梦相对更容易出现。
          </p>
          <p>
            材料最多 {MAX_MATERIALS}{" "}
            个槽位（对应游戏中烹饪锅的调料槽），可重复放置，相同材料效果会叠加合并；槽位顺序影响「首个」属性
            / 基础点数效果。
          </p>
          <p>
            属性吸引与基础点数筛选只取「第一个」对应效果（与材料选择顺序有关）；蛋组吸引遍历全部蛋组效果。各材料自带的
            weightMultiplier（时间/天气修正）与 drops 在本工具中未纳入。
          </p>
          <p>
            数据合并自 Cobblemon 源码与 All The Mons
            数据包覆盖（材料与生成池）；结果反映的是相对刷新概率变化，未模拟实际的生成频率（每区块数量、生成周期等）。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
