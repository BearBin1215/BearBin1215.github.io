import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink } from "@/components/external-link";
import { cn } from "@/lib/utils";
import { useDocumentTitle } from "@/hooks/use-document-title";

/** 基础处理用时（tick），20tick = 1s */
const BASE_TIME = 400;
/** 速度/加工室插件数量（行、列数，0-12 共 13 级） */
const PLUGIN_COUNTS = 13;
/** 待处理物品总数 */
const ITEM_COUNT = 64;
/** 插件等级上限 */
const MAX_LEVEL = 9;

/** 插件数列表 [0, 1, ..., 12] */
const pluginList = Array.from({ length: PLUGIN_COUNTS }, (_, i) => i);

/** 最小时间信息 */
interface MinTimeInfo {
  /** 最小时间（秒），无解时为 Infinity */
  time: number;
  /** 对应的速度插件数 */
  speed: number;
  /** 对应的加工室插件数 */
  process: number;
}

/**
 * 计算处理时间
 * @param speed 速度插件数
 * @param process 加工室插件数
 * @param speedLevel 速度插件等级
 * @param processLevel 加工室插件等级
 * @returns 处理 64 个物品的时间（秒）
 */
function calculateTime(
  speed: number,
  process: number,
  speedLevel: number,
  processLevel: number,
): number {
  /** 速度插件提供的效率提升倍率 */
  const speedMultiplier = 1 + speed * (speedLevel * 0.5);
  /** 单配方耗时（tick，向下取整） */
  const oneItemTick = Math.floor(BASE_TIME / speedMultiplier);
  /** 总并行数 */
  const processParallel = 1 + process * processLevel;
  /** 总处理轮数 */
  const processRounds = Math.ceil(ITEM_COUNT / processParallel);
  return (processRounds * oneItemTick) / 20;
}

/** 解析输入框值并限制到 [0, MAX_LEVEL] */
const clampLevel = (value: string): number => {
  const v = parseInt(value, 10);
  if (Number.isNaN(v)) {
    return 0;
  }
  return Math.min(Math.max(v, 0), MAX_LEVEL);
};

function OritechCalculator() {
  const [speedLevel, setSpeedLevel] = useState(7);
  const [processLevel, setProcessLevel] = useState(7);
  const [selectedCount, setSelectedCount] = useState(2);
  useDocumentTitle("Oritech 效率计算");

  /** 当前选中总数对应斜线上的最小时间及其位置 */
  const minTimeInfo = useMemo<MinTimeInfo>(() => {
    let minTime = Infinity;
    let minSpeed = -1;
    let minProcess = -1;

    for (let i = 0; i <= Math.min(selectedCount, PLUGIN_COUNTS - 1); i++) {
      const j = selectedCount - i;
      if (j >= 0 && j < PLUGIN_COUNTS) {
        const time = calculateTime(i, j, speedLevel, processLevel);
        if (time < minTime) {
          minTime = time;
          minSpeed = i;
          minProcess = j;
        }
      }
    }

    return { time: minTime, speed: minSpeed, process: minProcess };
  }, [speedLevel, processLevel, selectedCount]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Oritech 效率计算</h1>
      <p className="text-sm">
        自用：计算 Minecraft Mod{" "}
        <ExternalLink
          href="https://www.curseforge.com/minecraft/mc-mods/oritech"
          className="text-primary hover:underline"
        >
          Oritech
        </ExternalLink>{" "}
        在固定速度插件、加工室插件总数下的最优配置。
      </p>
      <p className="text-sm">
        假定处理一个物品初始用时 {BASE_TIME} tick（{BASE_TIME / 20}s），本表计算处理{" "}
        {ITEM_COUNT} 个物品所用时间（s）。
      </p>
      <p className="text-sm">点击可高亮对应插件总数的单元格。</p>

      <div className="flex flex-wrap gap-6">
        <div className="space-y-2">
          <Label htmlFor="speed-level">速度插件等级</Label>
          <Input
            id="speed-level"
            type="number"
            min={0}
            max={MAX_LEVEL}
            value={speedLevel}
            onChange={(e) => setSpeedLevel(clampLevel(e.target.value))}
            className="w-32"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="process-level">加工室插件等级</Label>
          <Input
            id="process-level"
            type="number"
            min={0}
            max={MAX_LEVEL}
            value={processLevel}
            onChange={(e) => setProcessLevel(clampLevel(e.target.value))}
            className="w-32"
          />
        </div>
      </div>

      {minTimeInfo.time !== Infinity && (
        <p className="text-sm">
          共计使用 <span className="font-medium">{selectedCount}</span>{" "}
          个插件时，最优配置： 速度{" "}
          <span className="font-medium">{minTimeInfo.speed}</span> + 加工室{" "}
          <span className="font-medium">{minTimeInfo.process}</span>，耗时{" "}
          <span className="font-bold text-foreground">
            {minTimeInfo.time.toFixed(2)}s
          </span>
        </p>
      )}

      <div className="overflow-x-auto">
        <Table className="border-collapse bg-card/24">
          <TableHeader>
            <TableRow>
              <TableHead rowSpan={2} colSpan={2} className="bg-muted/40 text-center">
                加工\速度
              </TableHead>
              {pluginList.map((speed) => (
                <TableHead
                  key={speed}
                  onClick={() => setSelectedCount(speed)}
                  className={cn(
                    "cursor-pointer bg-muted/40 text-center",
                    selectedCount === speed && "bg-secondary/80",
                  )}
                >
                  {speed}
                </TableHead>
              ))}
            </TableRow>
            <TableRow>
              {pluginList.map((speed) => (
                <TableHead
                  key={speed}
                  onClick={() => setSelectedCount(speed)}
                  className={cn(
                    "cursor-pointer bg-muted/40 text-center text-xs leading-tight font-normal",
                    selectedCount === speed && "bg-secondary/80",
                  )}
                >
                  {(1 + speedLevel * 0.5 * speed) * 100}%
                  <br />
                  耗时{Math.floor(BASE_TIME / (1 + speed * (speedLevel * 0.5)))}t
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pluginList.map((process) => (
              <TableRow key={process}>
                <TableCell
                  onClick={() => setSelectedCount(process)}
                  className={cn(
                    "cursor-pointer bg-muted/40 text-center font-medium",
                    selectedCount === process && "bg-secondary/80",
                  )}
                >
                  {process}
                </TableCell>
                <TableCell
                  onClick={() => setSelectedCount(process)}
                  className={cn(
                    "cursor-pointer bg-muted/40 text-center text-xs leading-tight",
                    selectedCount === process && "bg-secondary/80",
                  )}
                >
                  {1 + process * processLevel}并行
                  <br />
                  {Math.ceil(ITEM_COUNT / (1 + process * processLevel))}轮
                </TableCell>
                {pluginList.map((speed) => {
                  const isMinTime =
                    speed === minTimeInfo.speed && process === minTimeInfo.process;
                  return (
                    <TableCell
                      key={`${process}-${speed}`}
                      onClick={() => setSelectedCount(process + speed)}
                      className={cn(
                        "cursor-pointer text-center tabular-nums",
                        process + speed === selectedCount && "bg-secondary/84",
                        isMinTime && "bg-yellow-200/90 font-bold dark:bg-yellow-900/80",
                      )}
                    >
                      {calculateTime(speed, process, speedLevel, processLevel).toFixed(2)}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default OritechCalculator;
