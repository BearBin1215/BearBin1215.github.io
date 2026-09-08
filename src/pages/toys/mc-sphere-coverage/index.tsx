import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { createCoverageContext } from "./sphere";
import { SphereCoverageGrid } from "./sphere-grid";
import { SphereCoverage3D } from "./sphere-3d";

/** 直径上限（格），避免示意图网格过大导致单格过小 */
const MAX_DIAMETER = 128;

/** 最小直径（格） */
const MIN_DIAMETER = 3;

/** 默认直径（格） */
const DEFAULT_DIAMETER = 41;

/**
 * 统计正方形内部（含四角）完全未被球覆盖的格子数
 * 四个球心位于格心 (0,0) (s,0) (0,s) (s,s)
 * @param distance 球心间距（格）
 * @param diameter 球直径（格），支持奇偶
 * @returns 空隙格子数，为 0 表示正方形被完全覆盖
 */
function countGaps(distance: number, diameter: number): number {
  // 覆盖判定复用示意图的共享上下文（内部球体数据按直径缓存）
  const coverage = createCoverageContext(diameter, distance);
  let gaps = 0;
  for (let x = 0; x <= distance; x++) {
    for (let y = 0; y <= distance; y++) {
      if (coverage.countCovered(x, y) === 0) {
        gaps++;
      }
    }
  }
  return gaps;
}

/**
 * 求逐格验证下不留空隙的最大整数球心间距
 * 从理论临界 floor(√2/2·D) + 1 开始向下试探（像素化截面较几何球略瘦，可能需要更小间距）
 */
function findMaxSafeDistance(diameter: number): number {
  for (let s = Math.floor((diameter / 2) * Math.SQRT2) + 1; s >= 1; s--) {
    if (countGaps(s, diameter) === 0) {
      return s;
    }
  }
  return 1;
}

/** 解析输入框值并限制到 [MIN_DIAMETER, MAX_DIAMETER] */
const clampDiameter = (value: string): number => {
  const v = parseInt(value, 10);
  if (Number.isNaN(v)) {
    return DEFAULT_DIAMETER;
  }
  return Math.min(Math.max(v, MIN_DIAMETER), MAX_DIAMETER);
};

export default function McSphereCoverage() {
  const [diameter, setDiameter] = useState(DEFAULT_DIAMETER);
  // 直径输入草稿：输入期间保留中间态（如 "1"、"12"），失焦或回车时才钳制提交
  const [diameterDraft, setDiameterDraft] = useState(String(DEFAULT_DIAMETER));
  const [distance, setDistance] = useState(() => findMaxSafeDistance(DEFAULT_DIAMETER));
  const [showHeight, setShowHeight] = useState(false);
  const [show3D, setShow3D] = useState(false);
  useDocumentTitle("MC 球覆盖计算器");

  /** 逐格验证下无空隙的最大整数间距 */
  const safeDistance = useMemo(() => findMaxSafeDistance(diameter), [diameter]);

  /** 修改直径后将间距重置为推荐值 */
  const handleDiameterChange = (value: number) => {
    setDiameter(value);
    setDistance(findMaxSafeDistance(value));
  };

  /** 失焦/回车时解析草稿并钳制到合法范围，有变化才提交 */
  const commitDiameterDraft = () => {
    const value = clampDiameter(diameterDraft);
    setDiameterDraft(String(value));
    if (value !== diameter) {
      handleDiameterChange(value);
    }
  };

  /**
   * 输入期间保留中间态（如 "1"、"12"），合法值即时生效，空/越界的草稿待失焦或回车时钳制，
   * 避免逐字符钳制破坏输入（如输入 12 被截断为 32）
   */
  const handleDraftChange = (text: string) => {
    setDiameterDraft(text);
    const value = parseInt(text, 10);
    if (
      !Number.isNaN(value) &&
      value >= MIN_DIAMETER &&
      value <= MAX_DIAMETER &&
      value !== diameter
    ) {
      handleDiameterChange(value);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">MC 球覆盖计算器</h1>
      <p className="text-sm">
        用于 Minecraft 建筑规划：四个球心构成一个正方形，以四点为球心各放一个等径球，
        计算球心间距多少时四球恰好不留四角空隙（即正方形内部被完全覆盖）。
      </p>
      <p className="text-sm">
        下方示意图采用 blakeohare/minecraftsphere 的 3D
        超采样算法逐格验证（与游戏内球形插件表现一致），显示球的中间层（最大截面），
        实际可用间距以验证结果为准。
      </p>
      <p className="text-sm">
        开启"显示高度"后，覆盖格上标注该列从球底到球顶的总层数；关闭时可悬浮在方块上查看对应高度。
      </p>

      {/* 控制区 */}
      <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
        <div className="space-y-2">
          <Label htmlFor="diameter">球直径 D（格）</Label>
          <Input
            id="diameter"
            type="number"
            min={MIN_DIAMETER}
            max={MAX_DIAMETER}
            value={diameterDraft}
            onChange={(e) => handleDraftChange(e.target.value)}
            onBlur={commitDiameterDraft}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                commitDiameterDraft();
              }
            }}
            className="w-32"
          />
        </div>
        <div className="min-w-60 flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="distance">球心间距 s（格）</Label>
            <span className="text-sm tabular-nums">{distance}</span>
          </div>
          <Slider
            id="distance"
            min={1}
            max={diameter}
            value={[distance]}
            onValueChange={(value) =>
              setDistance(Array.isArray(value) ? value[0] : value)
            }
          />
        </div>
        <div className="flex items-center gap-2 pb-1">
          <Switch id="show-height" checked={showHeight} onCheckedChange={setShowHeight} />
          <Label htmlFor="show-height">显示高度</Label>
        </div>
      </div>

      {/* 结果区 */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <p>
          无空隙最大间距{" "}
          <span className="font-bold text-foreground tabular-nums">{safeDistance}</span>{" "}
          格
          {safeDistance !== distance && (
            <Button
              variant="outline"
              size="sm"
              className="ml-2 h-6 px-2 text-xs"
              onClick={() => setDistance(safeDistance)}
            >
              应用
            </Button>
          )}
        </p>
      </div>

      <SphereCoverageGrid
        diameter={diameter}
        distance={distance}
        showHeight={showHeight}
        onOpen3D={() => setShow3D(true)}
      />

      <Dialog open={show3D} onOpenChange={setShow3D}>
        <DialogContent className="flex! h-[min(90vh,760px)] max-w-[calc(100%-1rem)] flex-col p-0 sm:max-w-[min(96vw,1200px)]!">
          <DialogHeader className="p-5 pr-14 pb-4">
            <DialogTitle>球体覆盖 3D 查看</DialogTitle>
            <DialogDescription>
              直径 {diameter} 格，球心间距 {distance} 格
            </DialogDescription>
          </DialogHeader>
          <SphereCoverage3D diameter={diameter} distance={distance} open={show3D} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
