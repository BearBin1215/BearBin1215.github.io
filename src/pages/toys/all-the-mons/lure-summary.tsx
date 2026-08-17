/** 吸引效果摘要内容组件：不分组，逐行展示合并后的各效果 */
import type { ReactNode } from "react";
import { HelpCircleIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { resolveLure } from "./calc";
import type { BaitEffect } from "./types";
import { EFFECT_LABELS, type UiLabels, categoryLabel } from "./shared";

/** 是否存在任意吸引效果（供卡片标题描述与内容渲染共同判断） */
export function hasLureEffects(lure: ReturnType<typeof resolveLure>): boolean {
  return lure.merged.length > 0 || lure.rarityTier > 0;
}

/**
 * 吸引效果摘要内容：不分组，逐行展示合并后的各效果
 * （稀有度提升、属性 / 蛋群吸引、基础点数、上钩时间、个体质量）。
 * 属性与基础点数行末尾带问号悬浮提示（仅首个生效 / 权重归 0 说明）。
 */
export function LureSummary({
  lure,
  labels,
}: {
  lure: ReturnType<typeof resolveLure>;
  /** 界面中文标签映射 */
  labels: UiLabels;
}) {
  if (!hasLureEffects(lure)) {
    return null;
  }

  /** 行末问号悬浮提示图标 */
  const hintIcon = (tooltip: string) => (
    <Tooltip>
      <TooltipTrigger className="inline-flex size-4 cursor-help items-center justify-center text-muted-foreground/70 transition-colors outline-none hover:text-foreground">
        <HelpCircleIcon className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );

  /** 单条效果行：效果类型名 + 子类别 + 倍率（+ 触发概率与行末提示） */
  const renderRow = (effect: BaitEffect, key: string, hint?: ReactNode) => {
    const sub = effect.subcategory
      ? categoryLabel(effect.type, effect.subcategory, labels)
      : "";
    return (
      <li key={key} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span className="text-muted-foreground">
          {EFFECT_LABELS[effect.type] ?? effect.type}
        </span>
        {sub && <span>{sub}</span>}
        {effect.value > 0 && <span>×{effect.value}</span>}
        {effect.chance < 1 && `（触发 ${(effect.chance * 100).toFixed(0)}%）`}
        {hint}
      </li>
    );
  };

  return (
    <ul className="space-y-1 text-sm">
      {lure.rarityTier > 0 && (
        <li className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-muted-foreground">
            {EFFECT_LABELS["cobblemon:rarity_bucket"]}
          </span>
          <span>+{lure.rarityTier}</span>
        </li>
      )}
      {lure.typingEffects.map((e, i) =>
        renderRow(
          e,
          `${e.type}:${e.subcategory}:${i}`,
          hintIcon("仅第一个属性效果生效，其余属性吸引不参与权重计算。"),
        ),
      )}
      {lure.eggGroupEffects.map((e, i) =>
        renderRow(e, `${e.type}:${e.subcategory}:${i}`),
      )}
      {lure.evEffects.map((e, i) =>
        renderRow(
          e,
          `${e.type}:${e.subcategory}:${i}`,
          hintIcon("只保留对应能力有基础点数的宝可梦，其余权重归 0。"),
        ),
      )}
      {lure.biteTimeEffects.map((e, i) =>
        renderRow(e, `${e.type}:${e.subcategory}:${i}`),
      )}
      {lure.qualityEffects.map((e, i) => renderRow(e, `${e.type}:${e.subcategory}:${i}`))}
    </ul>
  );
}
