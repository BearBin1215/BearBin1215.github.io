/**
 * 材料选择面板：搜索框 + 已选槽位 + 按显示分类分组的可选材料芯片。
 * 搜索同时匹配中英文名、id 与口味值；基础点数类材料按常用能力值顺序排列。
 * 树果 / 调料与部分物品配有像素风图标；「其他」分类材料悬浮显示效果明细。
 */
import { Fragment, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { EV_STAT_ORDER, MATERIAL_CATEGORY_ORDER, TYPE_COLORS } from "./labels";
import type { MaterialInfo, SpawnBait } from "./types";
import { EFFECT_LABELS, type UiLabels, materialSuffix } from "./shared";

/** 材料分类中文名 */
const CATEGORY_LABELS: Record<string, string> = {
  typing: "属性",
  egg_group: "蛋群",
  ev: "基础点数",
  other: "其他",
};

/** kind=item 且配有物品图标的材料 -> 图片扩展名（文件位于 public/icons/items/，未列出的 item 无图标） */
const ITEM_ICON_EXTS: Record<string, string> = {
  allthemodium_apple: "png",
  allthemodium_carrot: "png",
  apple: "png",
  enchanted_golden_apple: "gif",
  glistering_melon_slice: "png",
  glow_berries: "png",
  golden_apple: "png",
  golden_carrot: "png",
  sweet_berries: "png",
};

/** 图标静态资源根（public/icons/，随站点部署不经过构建处理） */
const ICONS_BASE = `${import.meta.env.BASE_URL}icons/`;

/**
 * 材料物品图标 URL：
 * - 树果 / 调料 -> public/icons/berries/<物品id>.png（全部均有；调料如神话桃桃果直接复制同材质树果的 png）
 * - 其他物品 -> public/icons/items/<物品id>.<ext>（仅 ITEM_ICON_EXTS 列出的材料有）
 */
function materialIconUrl(material: MaterialInfo): string | null {
  const itemName = material.id.slice(material.kind.length + 1);
  if (material.kind === "berry" || material.kind === "seasoning") {
    return [ICONS_BASE, "berries/", itemName, ".png"].join("");
  }
  const extension = material.kind === "item" ? (ITEM_ICON_EXTS[itemName] ?? null) : null;
  return extension ? [ICONS_BASE, "items/", itemName, ".", extension].join("") : null;
}

/** 材料图标（16px 显示，像素风格外观保留） */
function MaterialIcon({ material }: { material: MaterialInfo }) {
  const url = materialIconUrl(material);
  if (!url) {
    return null;
  }
  return (
    <img
      src={url}
      alt=""
      loading="lazy"
      className="size-4 shrink-0 [image-rendering:pixelated]"
    />
  );
}

/** 材料选择面板组件（搜索、槽位管理、分组展示） */
export function MaterialSelector({
  materials,
  selected,
  maxCount,
  labels,
  baitEffects,
  onAdd,
  onRemoveAt,
  onClear,
}: {
  materials: MaterialInfo[];
  selected: string[];
  maxCount: number;
  /** 界面中文标签映射（用于材料后缀） */
  labels: UiLabels;
  /** 效果数据（「其他」分类材料悬浮显示效果明细） */
  baitEffects: Record<string, SpawnBait>;
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
          if (!id) {
            return (
              <div
                key={index}
                className="flex h-9 items-center rounded-md border border-dashed border-muted-foreground/40 px-2.5 text-xs text-muted-foreground"
              >
                空槽位 {index + 1}
              </div>
            );
          }
          return (
            <button
              key={index}
              type="button"
              aria-label={`移除 ${material?.names.zh ?? ""}`}
              onClick={() => onRemoveAt(index)}
              className="flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-primary bg-primary/10 px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-primary/20"
            >
              {material && <MaterialIcon material={material} />}
              {material?.names.zh}
              <span aria-hidden="true" className="text-muted-foreground">
                ×
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        点击材料会加入下一个空槽位，重复点击可重复添加；点击已选槽位即可移除。
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
              {CATEGORY_LABELS[category]}（{list.length}）
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
                // 默认态的属性材料显示对应属性色边框（选中 / 满槽禁用态保持原样）
                const typeBorderColor =
                  m.category === "typing" && !active && !full
                    ? (TYPE_COLORS[m.detail[0] ?? ""] ?? null)
                    : null;
                const chip = (
                  <button
                    type="button"
                    disabled={full && !active}
                    onClick={() => onAdd(m.id)}
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-1 rounded-md border px-2.5 py-1 text-xs transition-colors",
                      chipClass,
                    )}
                    style={typeBorderColor ? { borderColor: typeBorderColor } : undefined}
                  >
                    <MaterialIcon material={m} />
                    <span>
                      {m.names.zh}
                      {suffix && <span className="text-muted-foreground">·{suffix}</span>}
                      {count > 1 && ` ×${count}`}
                    </span>
                  </button>
                );
                const otherEffects =
                  m.category === "other" ? (baitEffects[m.baitId]?.effects ?? []) : [];
                if (otherEffects.length === 0) {
                  return <Fragment key={m.id}>{chip}</Fragment>;
                }
                return (
                  <Tooltip key={m.id}>
                    <TooltipTrigger render={<span />}>{chip}</TooltipTrigger>
                    <TooltipContent className="block space-y-1">
                      {otherEffects.map((effect, i) => (
                        <div key={i}>
                          {EFFECT_LABELS[effect.type] ?? effect.type}
                          {effect.value > 0 && ` ×${effect.value}`}
                        </div>
                      ))}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
