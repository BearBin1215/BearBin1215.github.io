/**
 * @description 宝可梦属性相克表
 * 首列为进攻方招式属性，首行为防守方属性，内部单元格为克制倍率
 */
import {
  Fragment,
  memo,
  useCallback,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { cn } from "@/lib/utils";
import {
  bestOffensiveEffectiveness,
  combinedEffectiveness,
  MULTIPLIER,
  TYPES,
  type TypeId,
  type TypeInfo,
} from "./data";

/** 悬浮高亮所在的数据区行列索引（从 0 开始） */
interface HoverCell {
  row: number;
  col: number;
}

/** 倍率显示文本（乘积可能出现的全部取值） */
function multiplierText(m: number): string {
  switch (m) {
    case 0:
      return "0×";
    case 0.25:
      return "1/4×";
    case 0.5:
      return "1/2×";
    default:
      return `${m}×`;
  }
}

/** 倍率效果描述 */
function multiplierWord(m: number): string {
  switch (m) {
    case 0:
      return "免疫";
    case 0.25:
    case 0.5:
      return "抵抗";
    case 2:
    case 4:
      return "效果拔群！";
    default:
      return "";
  }
}

/** 倍率单元格，统一包裹 Tooltip、倍率文本与配色 */
function MultiplierCell({
  multiplier,
  className,
  onHover,
  children,
}: {
  /** 倍率值（0 / 0.25 / 0.5 / 1 / 2 / 4） */
  multiplier: number;
  /** Trigger 类，用于附加行或列的语义分隔边框 */
  className?: string;
  /** 鼠标悬浮回调 */
  onHover: () => void;
  /** Tooltip 内容（倍率详情） */
  children: ReactNode;
}) {
  const classNames = cn(
    "flex size-10 items-center justify-center border border-border/60 text-xs font-medium tabular-nums",
    className,
    (function multiplierClassName() {
      switch (multiplier) {
        case 0:
          return "bg-gray-200 dark:bg-gray-800 text-muted-foreground";
        case 0.25:
          return "bg-red-200 text-red-950 dark:bg-red-900 dark:text-red-100";
        case 0.5:
          return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
        case 2:
          return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300";
        case 4:
          return "bg-green-200 text-green-950 dark:bg-green-900 dark:text-green-100";
        default:
          return "bg-background text-muted-foreground";
      }
    })(),
  );

  return (
    <Tooltip>
      <TooltipTrigger render={<div />} className={classNames} onMouseEnter={onHover}>
        {multiplierText(multiplier)}
      </TooltipTrigger>
      <TooltipContent className="pointer-events-none">{children}</TooltipContent>
    </Tooltip>
  );
}

/** 属性图标 */
function TypeIcon({ type, className }: { type: TypeInfo; className?: string }) {
  return (
    <img
      src={type.icon}
      alt={type.zh}
      draggable={false}
      className={cn("pointer-events-none size-full select-none", className)}
    />
  );
}

/** Tooltip 中的属性徽章（有色圆框图标 + 中文） */
function TypeBadge({ type }: { type: TypeInfo }) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      <span
        className="flex size-4 shrink-0 items-center justify-center rounded-full p-0.5"
        style={{ backgroundColor: type.color }}
      >
        <TypeIcon type={type} />
      </span>
      {type.zh}
    </span>
  );
}

/**
 * 双属性区域表头（防守综合列 / 本系打击面行）：
 * 对角线双属性图标格子（上下三角分别为第一、第二属性色底 + 图标）+ 徽章 Tooltip，
 * 以带色边框与主网格区分（borderClassName 约定与对应行/列的 MultiplierCell 一致）。
 */
function DualHeaderCell({
  types,
  label,
  borderClassName,
  onCellHover,
}: {
  /** 两个已选属性（顺序与选择顺序一致） */
  types: readonly [TypeInfo, TypeInfo];
  /** 表头说明文案（如 双属性 / 本系打击面） */
  label: string;
  /** 附加行或列的语义分隔边框 */
  borderClassName?: string;
  /** 悬浮回调（表头不参与十字框，悬浮时清除） */
  onCellHover: (cell: HoverCell | null) => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<div />}
        className={cn(
          "relative size-10 overflow-hidden border border-border/60",
          borderClassName,
        )}
        onMouseEnter={() => onCellHover(null)}
      >
        <div
          className="pointer-events-none absolute inset-0 [clip-path:polygon(0_0,100%_0,0_100%)]"
          style={{ backgroundColor: types[0].color }}
        />
        <div
          className="pointer-events-none absolute inset-0 [clip-path:polygon(100%_0,100%_100%,0_100%)]"
          style={{ backgroundColor: types[1].color }}
        />
        <TypeIcon type={types[0]} className="absolute top-0.5 left-0.5 size-5" />
        <TypeIcon type={types[1]} className="absolute right-0.5 bottom-0.5 size-5" />
      </TooltipTrigger>
      <TooltipContent className="pointer-events-none">
        <div className="flex items-center gap-1.5">
          <TypeBadge type={types[0]} />
          <span>+</span>
          <TypeBadge type={types[1]} />
          <span className="text-background/70">{label}</span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * 属性表头按钮（首行防守方 / 首列进攻方）：
 * 属性色底图标 + 选中描边 + 徽章与选择提示 Tooltip。
 */
function TypeHeaderCell({
  type,
  roleLabel,
  isSelected,
  onToggle,
  onCellHover,
}: {
  /** 表头属性 */
  type: TypeInfo;
  /** 轴角色：防守方 / 进攻方 */
  roleLabel: "防守方" | "进攻方";
  /** 是否选中 */
  isSelected: boolean;
  /** 点击切换选择回调 */
  onToggle: (id: TypeId) => void;
  /** 悬浮回调（表头不参与十字框，悬浮时清除） */
  onCellHover: (cell: HoverCell | null) => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<button type="button" />}
        onClick={() => onToggle(type.id)}
        onMouseEnter={() => onCellHover(null)}
        className={cn(
          "size-10 cursor-pointer border border-border/60 p-1.5 outline-2 -outline-offset-2 outline-transparent transition-[filter,outline-color] hover:brightness-110 focus-visible:outline-ring",
          isSelected && "outline-foreground",
        )}
        style={{ backgroundColor: type.color }}
      >
        <TypeIcon type={type} />
      </TooltipTrigger>
      <TooltipContent className="pointer-events-none">
        <div className="flex items-center gap-1.5">
          <TypeBadge type={type} />
          <span className="text-background/70">
            {isSelected ? "点击取消选择" : `点击选择为${roleLabel}属性`}
          </span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

/** 倍率格子的 Tooltip 内容：进攻方 -> 防守方 + 倍率与效果描述 */
function EffectDetail({
  atk,
  defs,
  multiplier,
}: {
  atk: TypeInfo;
  /** 防守方属性（单属性 1 个、双属性综合 2 个） */
  defs: readonly TypeInfo[];
  /** 显示的综合倍率 */
  multiplier: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <TypeBadge type={atk} />
        <span>→</span>
        {defs.map((def, i) => (
          <Fragment key={def.id}>
            {i > 0 && <span>·</span>}
            <TypeBadge type={def} />
          </Fragment>
        ))}
      </div>
      <div>
        {multiplierText(multiplier)} {multiplierWord(multiplier)}
      </div>
      {defs.length === 2 && (
        <div className="text-background/70">
          {multiplierText(MULTIPLIER[atk.id][defs[0]!.id])} ×{" "}
          {multiplierText(MULTIPLIER[atk.id][defs[1]!.id])} = {multiplierText(multiplier)}
        </div>
      )}
    </div>
  );
}

/** 本系打击面 Tooltip 分别展示两个进攻属性的倍率 */
function OffensiveCoverageDetail({
  attackerTypes,
  defenderTypes,
}: {
  /** 进攻方双属性 */
  attackerTypes: readonly [TypeInfo, TypeInfo];
  /** 防守方属性（单属性 1 个 / 双属性 2 个） */
  defenderTypes: readonly TypeInfo[];
}) {
  const multipliers = attackerTypes.map((atk) =>
    defenderTypes.length === 2
      ? combinedEffectiveness(atk.id, defenderTypes[0]!.id, defenderTypes[1]!.id)
      : MULTIPLIER[atk.id][defenderTypes[0]!.id],
  );

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <TypeBadge type={attackerTypes[0]} />
        <span>+</span>
        <TypeBadge type={attackerTypes[1]} />
        <span>→</span>
        {defenderTypes.map((def, index) => (
          <Fragment key={def.id}>
            {index > 0 && <span>·</span>}
            <TypeBadge type={def} />
          </Fragment>
        ))}
      </div>
      <div>
        {attackerTypes[0].zh} {multiplierText(multipliers[0]!)}，{attackerTypes[1].zh}{" "}
        {multiplierText(multipliers[1]!)}
      </div>
    </div>
  );
}

/**
 * 相克表网格模板类：外层覆盖框容器与 ChartGrid 必须使用同一模板
 * （外层模板决定十字框与选中高亮框的定位，ChartGrid 以整格跨度填充）。
 * 主网格为 19 行/列（表头 + 18 属性），双属性时追加综合行/列至 20。
 * @param hasDualAttackers 是否已选择两个进攻方属性
 * @param hasDualDefenders 是否已选择两个防守方属性
 */
function chartGridTemplateClasses(
  hasDualAttackers: boolean,
  hasDualDefenders: boolean,
): string {
  return cn(
    hasDualAttackers
      ? "grid-rows-[repeat(20,--spacing(10))]"
      : "grid-rows-[repeat(19,--spacing(10))]",
    hasDualDefenders
      ? "grid-cols-[repeat(20,--spacing(10))]"
      : "grid-cols-[repeat(19,--spacing(10))]",
  );
}

/**
 * 相克表网格
 *
 * 用 memo 与页面悬浮状态隔离，鼠标在格子间移动只更新外层覆盖框，避免内部单元格反复全量重渲染卡顿
 */
function ChartGrid({
  selectedAttackers,
  selectedDefenders,
  onCellHover,
  onToggleAttacker,
  onToggleDefender,
}: {
  /** 已选中的进攻方属性，最多两个 */
  selectedAttackers: readonly TypeId[];
  /** 已选中的防守方属性，最多两个 */
  selectedDefenders: readonly TypeId[];
  /** 数据格子悬浮回调（更新十字框位置） */
  onCellHover: (cell: HoverCell | null) => void;
  /** 进攻方表头点击回调 */
  onToggleAttacker: (id: TypeId) => void;
  /** 防守方表头点击回调 */
  onToggleDefender: (id: TypeId) => void;
}) {
  /** 是否已选满两个进攻属性（此时显示本系打击面行） */
  const hasDualAttackers = selectedAttackers.length === 2;
  /** 是否已选满两个防守属性（此时显示综合倍率列） */
  const hasDualDefenders = selectedDefenders.length === 2;
  const selectedDefenderTypes = selectedDefenders.map((id) =>
    TYPES.find((type) => type.id === id)!,
  );
  const selectedAttackerTypes = selectedAttackers.map((id) =>
    TYPES.find((type) => type.id === id)!,
  );

  /** 双防守属性时本系打击面综合格的倍率，未选满时为 null */
  const coverageMult =
    hasDualAttackers && hasDualDefenders
      ? bestOffensiveEffectiveness(
          selectedAttackers[0]!,
          selectedAttackers[1]!,
          selectedDefenders[0]!,
          selectedDefenders[1]!,
        )
      : null;

  return (
    <div
      className={cn(
        "col-span-full col-start-1 row-span-full row-start-1 grid",
        chartGridTemplateClasses(hasDualAttackers, hasDualDefenders),
      )}
    >
      {/* 首行：角落占位（边框与底色由外层左上角占位框覆盖）+ 防守方属性（可点击选择） */}
      <div className="size-10" onMouseEnter={() => onCellHover(null)} />
      {TYPES.map((type) => (
        <TypeHeaderCell
          key={type.id}
          type={type}
          roleLabel="防守方"
          isSelected={selectedDefenders.includes(type.id)}
          onToggle={onToggleDefender}
          onCellHover={onCellHover}
        />
      ))}
      {/* 综合列表头：右上至左下的对角线分隔两个已选属性 */}
      {hasDualDefenders && (
        <DualHeaderCell
          types={[selectedDefenderTypes[0]!, selectedDefenderTypes[1]!]}
          label="双属性"
          borderClassName="border-l-[#3A65BC]/50"
          onCellHover={onCellHover}
        />
      )}

      {/* 数据行：进攻方属性 + 倍率格子（+ 综合列） */}
      {TYPES.map((atk, row) => {
        /** 双防守属性时该行综合列的倍率 */
        const combinedMult = hasDualDefenders
          ? combinedEffectiveness(atk.id, selectedDefenders[0]!, selectedDefenders[1]!)
          : null;
        return (
          <Fragment key={atk.id}>
            <TypeHeaderCell
              type={atk}
              roleLabel="进攻方"
              isSelected={selectedAttackers.includes(atk.id)}
              onToggle={onToggleAttacker}
              onCellHover={onCellHover}
            />
            {TYPES.map((def, col) => {
              const m = MULTIPLIER[atk.id][def.id];
              return (
                <MultiplierCell
                  key={def.id}
                  multiplier={m}
                  onHover={() => onCellHover({ row, col })}
                >
                  <EffectDetail atk={atk} defs={[def]} multiplier={m} />
                </MultiplierCell>
              );
            })}
            {combinedMult !== null && (
              <MultiplierCell
                multiplier={combinedMult}
                className="border-l-[#3A65BC]/50"
                onHover={() => onCellHover({ row, col: TYPES.length })}
              >
                <EffectDetail
                  atk={atk}
                  defs={selectedDefenderTypes}
                  multiplier={combinedMult}
                />
              </MultiplierCell>
            )}
          </Fragment>
        );
      })}
      {hasDualAttackers && (
        <>
          <DualHeaderCell
            types={[selectedAttackerTypes[0]!, selectedAttackerTypes[1]!]}
            label="本系打击面"
            borderClassName="border-t-[#BC413A]/50"
            onCellHover={onCellHover}
          />
          {TYPES.map((def, col) => {
            const mult = bestOffensiveEffectiveness(
              selectedAttackers[0]!,
              selectedAttackers[1]!,
              def.id,
            );
            return (
              <MultiplierCell
                key={def.id}
                multiplier={mult}
                className="border-t-[#BC413A]/50"
                onHover={() => onCellHover({ row: TYPES.length, col })}
              >
                <OffensiveCoverageDetail
                  attackerTypes={[selectedAttackerTypes[0]!, selectedAttackerTypes[1]!]}
                  defenderTypes={[def]}
                />
              </MultiplierCell>
            );
          })}
          {coverageMult !== null && (
            <MultiplierCell
              multiplier={coverageMult}
              className="border-t-[#BC413A]/50 border-l-[#3A65BC]/50"
              onHover={() => onCellHover({ row: TYPES.length, col: TYPES.length })}
            >
              <OffensiveCoverageDetail
                attackerTypes={[selectedAttackerTypes[0]!, selectedAttackerTypes[1]!]}
                defenderTypes={selectedDefenderTypes}
              />
            </MultiplierCell>
          )}
        </>
      )}
    </div>
  );
}

const ChartGridMemo = memo(ChartGrid);

export default function TypeChart() {
  useDocumentTitle("宝可梦属性相克表");

  /** 已选中的进攻方属性（至多两个，顺序为选择顺序） */
  const [selectedAttackers, setSelectedAttackers] = useState<TypeId[]>([]);
  /** 已选中的防守方属性（至多两个，顺序为选择顺序） */
  const [selectedDefenders, setSelectedDefenders] = useState<TypeId[]>([]);
  const [hover, setHover] = useState<HoverCell | null>(null);

  /** 是否已选满两个进攻属性（此时显示本系打击面行） */
  const hasDualAttackers = selectedAttackers.length === 2;
  /** 是否已选满两个防守属性（此时显示综合倍率列） */
  const hasDualDefenders = selectedDefenders.length === 2;

  /** 切换属性选择；已选满两个时替换最早选择的属性 */
  const toggleType = useCallback(
    (setter: Dispatch<SetStateAction<TypeId[]>>, id: TypeId) => {
      setter((prev) => {
        if (prev.includes(id)) {
          return prev.filter((value) => value !== id);
        }
        return prev.length >= 2 ? [prev[1]!, id] : [...prev, id];
      });
    },
    [],
  );

  /** 切换进攻方属性选择 */
  const toggleAttacker = useCallback((id: TypeId) => {
    toggleType(setSelectedAttackers, id);
  }, [toggleType]);

  /** 切换防守方属性选择 */
  const toggleDefender = useCallback((id: TypeId) => {
    toggleType(setSelectedDefenders, id);
  }, [toggleType]);

  /** 悬浮框越界保护：综合行或综合列收起后不再显示其旧位置 */
  const hoverVisible =
    hover !== null &&
    hover.col >= 0 &&
    hover.col < TYPES.length + (hasDualDefenders ? 1 : 0) &&
    hover.row < TYPES.length + (hasDualAttackers ? 1 : 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">宝可梦属性相克表</h1>
      <p className="text-sm">
        点击防守方属性可以追加双属性防守综合列，点击进攻方属性可以追加本系打击面行，重复点击可取消选择。
      </p>

      <div className="overflow-x-auto">
        <div className="relative w-fit">
          {/* 顶部标签行：防守方属性，与防守方属性列对齐（双防守属性时含综合列） */}
          <div className="flex">
            <div className="h-6 w-16 shrink-0" />
            <div
              className={cn(
                "flex h-6 items-center justify-center bg-blue-400 dark:bg-blue-700 text-xs font-medium text-white",
                hasDualDefenders ? "w-190" : "w-180",
              )}
            >
              防守方属性
            </div>
          </div>
          <div className="flex">
            {/* 左侧标签列：攻击方招式属性，与进攻方属性行对齐（双进攻属性时含打击面行） */}
            <div className="w-6 shrink-0">
              <div className="h-10" />
              <div
                className={cn(
                  "flex w-6 items-center justify-center bg-rose-600 dark:bg-rose-800 text-xs font-medium text-white [text-orientation:upright] [writing-mode:vertical-rl]",
                  hasDualAttackers ? "h-190" : "h-180",
                )}
              >
                攻击方招式属性
              </div>
            </div>
            <div
              className={cn(
                "relative grid w-fit",
                chartGridTemplateClasses(hasDualAttackers, hasDualDefenders),
              )}
              onMouseLeave={() => setHover(null)}
            >
              {/* 已选防守列与进攻行的静态高亮框 */}
              {selectedDefenders.map((id) => {
                const col = TYPES.findIndex((type) => type.id === id);
                const selType = TYPES[col]!;
                return (
                  <div
                    key={selType.id}
                    className="pointer-events-none z-10 row-span-full row-start-1 border-2 border-foreground/35"
                    style={{ gridColumnStart: col + 2 }}
                  />
                );
              })}
              {selectedAttackers.map((id) => {
                const row = TYPES.findIndex((type) => type.id === id);
                const selectedType = TYPES[row]!;
                return (
                  <div
                    key={selectedType.id}
                    className="pointer-events-none z-10 col-span-full col-start-1 border-2 border-foreground/35"
                    style={{ gridRowStart: row + 2 }}
                  />
                );
              })}

              {/* 悬浮十字框：横向框住进攻方行、纵向框住防守方列，位置变化时平滑移动 */}
              {hoverVisible && hover !== null && (
                <>
                  <div
                    className="pointer-events-none z-20 col-span-full col-start-1 row-start-2 border-2 border-primary/70 bg-primary/5 transition-transform duration-200 ease-out"
                    style={{
                      transform: `translateY(calc(var(--spacing)*${hover.row * 10}))`,
                    }}
                  />
                  <div
                    className="pointer-events-none z-20 col-start-2 row-span-full row-start-1 border-2 border-primary/70 bg-primary/5 transition-transform duration-200 ease-out"
                    style={{
                      transform: `translateX(calc(var(--spacing)*${hover.col * 10}))`,
                    }}
                  />
                </>
              )}

              <ChartGridMemo
                selectedAttackers={selectedAttackers}
                selectedDefenders={selectedDefenders}
                onCellHover={setHover}
                onToggleAttacker={toggleAttacker}
                onToggleDefender={toggleDefender}
              />
            </div>
          </div>
          {/* 左上角占位框，不拦截鼠标事件 */}
          <div className="pointer-events-none absolute top-0 left-0 h-16 w-16 border border-border/60 bg-background" />
        </div>
      </div>
    </div>
  );
}
