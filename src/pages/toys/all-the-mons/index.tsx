import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink } from "@/components/external-link";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { cn } from "@/lib/utils";
import {
  computeImpact,
  EV_STAT_KEYS,
  resolveLure,
  type ImpactResult,
  type LightRange,
  type Scenario,
  type SpeciesImpact,
  type Weather,
} from "./calc";
import {
  BUCKET_LABELS,
  BUCKET_RARITY_INDEX,
  EFFECT_LABELS,
  EV_STAT_ORDER,
  LIGHT_OPTIONS,
  MATERIAL_CATEGORY_LABELS,
  MATERIAL_CATEGORY_ORDER,
  POSITION_OPTIONS,
  RARITY_FILTER_OPTIONS,
  TYPE_COLORS,
  WEATHER_OPTIONS,
} from "./labels";
import { loadAllTheMonsData } from "./loader";
import type { AllTheMonsData, MaterialInfo } from "./types";

/** 界面显示用的中文标签映射（由数据文件派生） */
interface UiLabels {
  /** 属性 id -> 中文名 */
  types: Record<string, string>;
  /** 能力值 id -> 中文名 */
  stats: Record<string, string>;
  /** 蛋群 id -> 中文名 */
  eggGroups: Record<string, string>;
}

const MAX_MATERIALS = 3;

function fmtPct(value: number): string {
  return `${value.toFixed(value < 1 ? 3 : 2)}%`;
}

function fmtRatio(ratio: number | null): string {
  if (ratio === null) {
    return "—";
  }
  if (ratio >= 100) {
    return "∞";
  }
  return `${ratio.toFixed(2)}×`;
}

function subLabel(
  effect: { type: string; subcategory: string | null },
  labels: UiLabels,
): string {
  const sub = effect.subcategory ?? "";
  const type = effect.type;
  const path = sub.includes("/") ? sub.split("/").pop()! : sub;
  if (type === "cobblemon:typing") {
    return labels.types[path] ?? path;
  }
  if (type === "cobblemon:egg_group") {
    return labels.eggGroups[path] ?? path;
  }
  if (type === "cobblemon:ev") {
    const statKey = EV_STAT_KEYS[path] ?? path;
    return labels.stats[statKey] ?? statKey;
  }
  return path;
}

function materialSuffix(material: MaterialInfo, labels: UiLabels): string {
  const items = material.detail.map((d) => {
    if (material.category === "typing") {
      return labels.types[d] ?? d;
    }
    if (material.category === "egg_group") {
      return labels.eggGroups[d] ?? d;
    }
    if (material.category === "ev") {
      const statKey = EV_STAT_KEYS[d] ?? d;
      return labels.stats[statKey] ?? statKey;
    }
    return "";
  });
  return items.filter(Boolean).join("/");
}

function TypeChip({ type, labels }: { type: string; labels: UiLabels }) {
  const color = TYPE_COLORS[type] ?? "#999999";
  return (
    <span
      className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[0.65rem] font-medium text-white"
      style={{ backgroundColor: color }}
    >
      {labels.types[type] ?? type}
    </span>
  );
}

function MaterialSelector({
  materials,
  selected,
  maxCount,
  labels,
  onAdd,
  onRemoveAt,
  onClear,
}: {
  materials: MaterialInfo[];
  selected: string[];
  maxCount: number;
  /** 界面中文标签映射（来自数据文件） */
  labels: UiLabels;
  onAdd: (id: string) => void;
  onRemoveAt: (index: number) => void;
  onClear: () => void;
}) {
  const [search, setSearch] = useState("");
  const keyword = search.trim().toLowerCase();

  const groups = useMemo(() => {
    const result: Record<string, MaterialInfo[]> = {};
    for (const m of materials) {
      const haystack =
        `${m.names.zh} ${m.names.en} ${m.id} ${m.flavours ? Object.keys(m.flavours).join(" ") : ""}`.toLowerCase();
      if (keyword && !haystack.includes(keyword)) {
        continue;
      }
      (result[m.category] ??= []).push(m);
    }
    return result;
  }, [materials, keyword]);

  const slots = Array.from({ length: maxCount }, (_, i) => selected[i] ?? null);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Input
          placeholder="搜索材料名称…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Button variant="outline" size="sm" onClick={onClear}>
          清空（{selected.length}/{maxCount}）
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {slots.map((id, index) => {
          const material = id ? materials.find((m) => m.id === id) : null;
          return (
            <div
              key={index}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-md border px-2.5 text-xs",
                id
                  ? "border-primary bg-primary/10 font-medium text-foreground"
                  : "border-dashed border-muted-foreground/40 text-muted-foreground",
              )}
            >
              {material ? material.names.zh : `空槽位 ${index + 1}`}
              {id && (
                <button
                  type="button"
                  aria-label={`移除 ${material?.names.zh ?? ""}`}
                  onClick={() => onRemoveAt(index)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        点击材料会加入下一个空槽位，重复点击可重复添加；用槽位上的 × 移除。
      </p>

      {MATERIAL_CATEGORY_ORDER.map((category) => {
        let list = groups[category];
        if (!list || list.length === 0) {
          return null;
        }
        if (category === "ev") {
          list = [...list].sort(
            (a, b) =>
              (EV_STAT_ORDER[a.detail[0] ?? ""] ?? 99) -
              (EV_STAT_ORDER[b.detail[0] ?? ""] ?? 99),
          );
        }
        return (
          <div key={category} className="space-y-1.5">
            <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {MATERIAL_CATEGORY_LABELS[category]}（{list.length}）
            </div>
            <div className="flex flex-wrap gap-1.5">
              {list.map((m) => {
                const count = selected.filter((id) => id === m.id).length;
                const active = count > 0;
                const full = selected.length >= maxCount;
                const suffix = materialSuffix(m, labels);
                let chipClass =
                  "border-border bg-card/40 text-muted-foreground hover:bg-secondary/50 hover:text-foreground";
                if (active) {
                  chipClass = "border-primary bg-primary/15 font-medium text-foreground";
                } else if (full) {
                  chipClass =
                    "cursor-not-allowed border-border bg-card/20 text-muted-foreground/40";
                }
                return (
                  <button
                    key={m.id}
                    type="button"
                    disabled={full && !active}
                    onClick={() => onAdd(m.id)}
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-xs transition-colors",
                      chipClass,
                    )}
                  >
                    {m.names.zh}
                    {suffix && <span className="text-muted-foreground">·{suffix}</span>}
                    {count > 1 && ` ×${count}`}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** 群系单选器（按真实群系筛选，自动解析其所属标签；支持 #标签 搜索） */
function BiomeSelector({
  biomes,
  selected,
  onSelect,
  tagsByBiome,
}: {
  biomes: string[];
  selected: string;
  onSelect: (biome: string) => void;
  /** 群系 id -> 标签列表，用于以 # 开头的标签搜索 */
  tagsByBiome: Record<string, string[]>;
}) {
  const [search, setSearch] = useState("");
  const keyword = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!keyword) {
      return biomes;
    }
    if (keyword.startsWith("#")) {
      const tagKw = keyword.slice(1);
      return biomes.filter((b) =>
        (tagsByBiome[b] ?? []).some((t) => t.toLowerCase().includes(tagKw)),
      );
    }
    return biomes.filter((b) => b.toLowerCase().includes(keyword));
  }, [biomes, keyword, tagsByBiome]);

  return (
    <div className="space-y-2">
      <Input
        placeholder="搜索群系 id 或 #标签…（如 plains / #is_forest）"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-8"
      />
      <div className="max-h-56 space-y-0.5 overflow-y-auto border border-border/50 p-2">
        {filtered.map((b) => {
          const active = b === selected;
          return (
            <label
              key={b}
              className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-secondary/40"
            >
              <input
                type="radio"
                name="biome"
                checked={active}
                onChange={() => onSelect(b)}
                className="size-4 accent-primary"
              />
              <span className="truncate">{b}</span>
            </label>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground">无匹配群系</p>
        )}
      </div>
      <p className="text-xs text-muted-foreground">共 {biomes.length} 个可解析群系。</p>
    </div>
  );
}

function LureSummaryCard({
  lure,
  labels,
}: {
  lure: ReturnType<typeof resolveLure>;
  /** 界面中文标签映射（来自数据文件） */
  labels: UiLabels;
}) {
  const hasAny = lure.merged.length > 0 || lure.rarityTier > 0;

  if (!hasAny) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>吸引效果摘要</CardTitle>
          <CardDescription>尚未选择材料。</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const renderGroup = (
    title: string,
    effects: ReturnType<typeof resolveLure>["merged"],
    note?: string,
  ) => {
    if (effects.length === 0) {
      return null;
    }
    return (
      <div className="space-y-1">
        <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {title}
        </div>
        <ul className="space-y-1 text-sm">
          {effects.map((effect, index) => (
            <li key={index} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <Badge variant="secondary">
                {EFFECT_LABELS[effect.type] ?? effect.type}
              </Badge>
              <span>
                {subLabel(effect, labels)}
                {effect.value > 0 && ` ×${effect.value}`}
                {effect.chance < 1 && `（触发 ${(effect.chance * 100).toFixed(0)}%）`}
              </span>
            </li>
          ))}
        </ul>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>吸引效果摘要</CardTitle>
        <CardDescription>
          合并后的效果。属性 / 蛋组吸引会提高对应宝可梦的权重，EV 只保留匹配的宝可梦。
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {lure.rarityTier > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              稀有度提升
            </div>
            <p className="text-sm">
              层级 <Badge variant="secondary">{lure.rarityTier}</Badge>
              ，稀有度桶权重被拉平（高稀有宝可梦相对更容易出现）。
            </p>
          </div>
        )}
        {lure.activeTypingEffect && (
          <div className="space-y-1">
            <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              权重生效属性
            </div>
            <p className="text-sm">
              仅首个属性效果生效：{" "}
              <span className="font-medium">
                {subLabel(lure.activeTypingEffect, labels)}
              </span>{" "}
              ×{lure.activeTypingEffect.value}
              <span className="text-muted-foreground">
                （源码行为：属性吸引只取第一个效果）
              </span>
            </p>
          </div>
        )}
        {renderGroup("属性吸引", lure.typingEffects)}
        {renderGroup("蛋群吸引", lure.eggGroupEffects)}
        {renderGroup(
          "EV 筛选",
          lure.evEffects,
          "只保留对应能力有 EV 产量的宝可梦，其余权重归 0。",
        )}
        {renderGroup("刷新间隔", lure.biteTimeEffects)}
        {renderGroup("个体质量加成", lure.qualityEffects)}
      </CardContent>
    </Card>
  );
}

/** 结果列表排序键与默认方向 */
const SORT_KEYS = ["rarity", "pAfter", "pBefore", "name"] as const;
type SortKey = (typeof SORT_KEYS)[number];
const SORT_DEFAULT_DIR: Record<SortKey, "asc" | "desc"> = {
  rarity: "asc",
  pAfter: "desc",
  pBefore: "desc",
  name: "asc",
};

/** 物种稀有度排序键：取该物种最稀有的桶（数值越小越稀有） */
function speciesRarityIndex(s: SpeciesImpact): number {
  return Math.min(...s.buckets.map((b) => BUCKET_RARITY_INDEX[b] ?? 4));
}

/** 表头排序按钮 */
function SortHeader({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  sort: { key: SortKey; dir: "asc" | "desc" };
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = sort.key === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={cn(
        "inline-flex items-center gap-1 font-medium whitespace-nowrap",
        className,
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
      {active && (sort.dir === "asc" ? "▲" : "▼")}
    </button>
  );
}

function ImpactTable({
  impact,
  scenario,
  selectedCount,
  biomeName,
  labels,
}: {
  impact: ImpactResult;
  scenario: Scenario;
  selectedCount: number;
  biomeName: string;
  /** 界面中文标签映射（来自数据文件） */
  labels: UiLabels;
}) {
  const [nameQuery, setNameQuery] = useState("");
  const [rarityFilter, setRarityFilter] = useState<string[]>(
    RARITY_FILTER_OPTIONS.map((o) => o.value),
  );
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "rarity",
    dir: "asc",
  });

  const list = useMemo(() => {
    const keyword = nameQuery.trim().toLowerCase();
    const byName = keyword
      ? impact.species.filter(
          (s) =>
            s.name.toLowerCase().includes(keyword) ||
            s.id.toLowerCase().includes(keyword),
        )
      : impact.species;
    const filtered =
      rarityFilter.length === 0
        ? byName
        : byName.filter((s) => s.buckets.some((b) => rarityFilter.includes(b)));
    const dirMul = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sort.key === "name") {
        return dirMul * a.name.localeCompare(b.name, "zh-CN");
      }
      if (sort.key === "pAfter") {
        return dirMul * (a.pAfter - b.pAfter);
      }
      if (sort.key === "pBefore") {
        return dirMul * (a.pBefore - b.pBefore);
      }
      const ra = speciesRarityIndex(a);
      const rb = speciesRarityIndex(b);
      if (ra !== rb) {
        return dirMul * (ra - rb);
      }
      return b.pAfter - a.pAfter;
    });
  }, [impact, nameQuery, rarityFilter, sort]);

  const toggleRarity = (value: string) => {
    setRarityFilter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const setSortKey = (key: SortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: SORT_DEFAULT_DIR[key] },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          场景：{biomeName}（解析 {scenario.biomeTags.length} 个刷新标签）
        </CardTitle>
        <CardDescription>
          场景内共 {impact.summary.totalSpecies} 种宝可梦
          {selectedCount === 0 ? "（未选择材料，以下为基础刷新概率）" : ""}。 上升{" "}
          {impact.summary.boosted}，下降 {impact.summary.reduced}， 被 EV 过滤{" "}
          {impact.summary.blocked}。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="按名字筛选…"
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
            className="h-8 w-40"
          />
          <div className="flex flex-wrap gap-1">
            {RARITY_FILTER_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                type="button"
                size="xs"
                variant={rarityFilter.includes(opt.value) ? "default" : "outline"}
                onClick={() => toggleRarity(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        {impact.species.length === 0 ? (
          <Empty>
            <EmptyTitle>无匹配条目</EmptyTitle>
            <EmptyDescription>
              该场景下没有符合条件的出生条目，请调整场景设置。
            </EmptyDescription>
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <SortHeader
                      label="宝可梦"
                      sortKey="name"
                      sort={sort}
                      onSort={setSortKey}
                    />
                  </TableHead>
                  <TableHead>属性</TableHead>
                  <TableHead>
                    <SortHeader
                      label="稀有度"
                      sortKey="rarity"
                      sort={sort}
                      onSort={setSortKey}
                    />
                  </TableHead>
                  <TableHead className="text-right">
                    <SortHeader
                      label="基础概率"
                      sortKey="pBefore"
                      sort={sort}
                      onSort={setSortKey}
                    />
                  </TableHead>
                  <TableHead className="text-right">
                    <SortHeader
                      label="吸引后概率"
                      sortKey="pAfter"
                      sort={sort}
                      onSort={setSortKey}
                    />
                  </TableHead>
                  <TableHead className="text-right">变化</TableHead>
                  <TableHead>命中吸引</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((s) => {
                  const ratio = s.ratio;
                  const boosted = s.delta > 1e-9;
                  const reduced = s.delta < -1e-9;
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {s.name}
                        {s.blockedByEv && (
                          <Badge variant="destructive" className="ml-2">
                            EV 过滤
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="flex gap-1">
                          {s.types.map((t) => (
                            <TypeChip key={t} type={t} labels={labels} />
                          ))}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {s.buckets.map((b) => BUCKET_LABELS[b] ?? b).join("、")}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmtPct(s.pBefore)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {fmtPct(s.pAfter)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right whitespace-nowrap tabular-nums",
                          boosted && "text-green-600 dark:text-green-400",
                          reduced && "text-red-600 dark:text-red-400",
                        )}
                      >
                        {boosted ? "+" : ""}
                        {fmtPct(s.delta)}
                        {s.ratio !== null && ` (${fmtRatio(ratio)})`}
                      </TableCell>
                      <TableCell className="min-w-40">
                        <div className="flex flex-wrap gap-1">
                          {s.matchedTyping.map((t) => (
                            <TypeChip key={t} type={t} labels={labels} />
                          ))}
                          {s.matchedEggGroups.map((g) => (
                            <Badge key={g} variant="outline">
                              {labels.eggGroups[g] ?? g}
                            </Badge>
                          ))}
                          {s.matchedTyping.length === 0 &&
                            s.matchedEggGroups.length === 0 &&
                            !s.blockedByEv && (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AllTheMonsCalculator() {
  useDocumentTitle("All The Mons 宝点心吸引计算");

  const [data, setData] = useState<AllTheMonsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [biomeId, setBiomeId] = useState("minecraft:plains");
  const [light, setLight] = useState<LightRange>("day");
  const [weather, setWeather] = useState<Weather>("clear");
  const [posTypes, setPosTypes] = useState<string[]>([
    "grounded",
    "surface",
    "submerged",
    "seafloor",
  ]);

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
    return (data.biomeTagReverse[biomeId] ?? []).filter((t) => poolTagSet.has(t));
  }, [data, biomeId, poolTagSet]);

  /** 可选的群系列表：仅保留能解析出至少一个刷新相关标签的群系（无标签群系过滤掉） */
  const biomeOptions = useMemo(
    () =>
      data
        ? Object.keys(data.biomeTagReverse)
            .filter((b) => (data.biomeTagReverse[b] ?? []).some((t) => poolTagSet.has(t)))
            .sort()
        : [],
    [data, poolTagSet],
  );

  const scenario: Scenario = useMemo(
    () => ({ biomeTags: resolvedBiomeTags, light, weather, posTypes }),
    [resolvedBiomeTags, light, weather, posTypes],
  );

  const lure = useMemo(
    () => (data ? resolveLure(selected, data) : null),
    [data, selected],
  );

  const impact = useMemo(
    () => (data ? computeImpact(data, scenario, selected) : null),
    [data, scenario, selected],
  );

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
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner />
          正在加载数据…
        </div>
      </div>
    );
  }

  /** 界面中文标签映射（由数据文件派生，替代硬编码标签） */
  const labels: UiLabels = {
    types: data.labels.types.zh,
    stats: data.labels.stats.zh,
    eggGroups: data.labels.eggGroups.zh,
  };

  const addMaterial = (id: string) => {
    setSelected((prev) => {
      if (prev.length >= MAX_MATERIALS) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const removeSlot = (index: number) => {
    setSelected((prev) => prev.filter((_, i) => i !== index));
  };

  const togglePosType = (value: string) => {
    setPosTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">All The Mons 宝点心吸引计算</h1>
      <p className="text-sm">
        计算 All The Mons 整合包中，不同树果 /
        材料搭配（宝点心材料）在指定场景下对宝可梦刷新的影响：属性与蛋群吸引提高对应宝可梦权重、EV
        筛保留特定能力、稀有度层级拉平稀有度桶、个体质量加成等。
      </p>
      <p className="text-sm">
        数据基于{" "}
        <ExternalLink href="https://www.curseforge.com/minecraft/modpacks/all-the-mons">
          All The Mons
        </ExternalLink>{" "}
        整合包，计算逻辑复刻自{" "}
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

      <div className="grid gap-4 lg:grid-cols-2">
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
              onAdd={addMaterial}
              onRemoveAt={removeSlot}
              onClear={() => setSelected([])}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>场景设置</CardTitle>
              <CardDescription>选择所在群系，可通过名字或 #标签 筛选。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>群系</Label>
                <BiomeSelector
                  biomes={biomeOptions}
                  selected={biomeId}
                  onSelect={setBiomeId}
                  tagsByBiome={data?.biomeTagReverse ?? {}}
                />
                {resolvedBiomeTags.length > 0 ? (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      解析出 {resolvedBiomeTags.length} 个群系标签：
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {resolvedBiomeTags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-destructive">
                    该群系无法解析出刷新相关标签，结果将为空。
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>光照</Label>
                <div className="flex flex-wrap gap-2">
                  {LIGHT_OPTIONS.map((opt) => (
                    <Button
                      key={opt.value}
                      type="button"
                      size="sm"
                      variant={light === opt.value ? "default" : "outline"}
                      onClick={() => setLight(opt.value)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>天气</Label>
                <div className="flex flex-wrap gap-2">
                  {WEATHER_OPTIONS.map((opt) => (
                    <Button
                      key={opt.value}
                      type="button"
                      size="sm"
                      variant={weather === opt.value ? "default" : "outline"}
                      onClick={() => setWeather(opt.value)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>生成位置</Label>
                <div className="flex flex-wrap gap-2">
                  {POSITION_OPTIONS.map((opt) => {
                    const active = posTypes.includes(opt.value);
                    return (
                      <Button
                        key={opt.value}
                        type="button"
                        size="sm"
                        variant={active ? "default" : "outline"}
                        onClick={() => togglePosType(opt.value)}
                      >
                        {opt.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <LureSummaryCard lure={lure} labels={labels} />

      <ImpactTable
        impact={impact}
        scenario={scenario}
        selectedCount={selected.length}
        biomeName={biomeId}
        labels={labels}
      />

      <Card>
        <CardHeader>
          <CardTitle>算法说明与局限</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            概率模型：先按宝点心桶权重（common 83.25 / uncommon 11.25 / rare 4.125 /
            ultra-rare 1.375）加权选桶，再在桶内按条目权重加权选择，最后按物种汇总。
            若材料含 rarity_bucket 效果，桶权重会先取 w^(1/n) 并归一到 100。
          </p>
          <p>
            材料最多 {MAX_MATERIALS} 个槽位（对应游戏中烹饪锅的调料槽），可重复放置，
            相同材料效果会叠加合并；槽位顺序影响「首个」属性 / EV 效果。
          </p>
          <p>
            与源码一致的行为：属性吸引与 EV
            筛选只取「第一个」对应效果（与材料选择顺序有关）；
            蛋组吸引遍历全部蛋组效果。各材料自带的 weightMultiplier（时间/天气修正）与
            drops 在本工具中未纳入。
          </p>
          <p>
            数据合并自 Cobblemon 源码与 All The Mons 数据包覆盖（材料与生成池）；
            结果反映的是相对刷新概率变化，未模拟实际的生成频率（每区块数量、生成周期等）。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
