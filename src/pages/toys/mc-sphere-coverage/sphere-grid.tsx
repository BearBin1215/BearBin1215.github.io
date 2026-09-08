import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "cn";
import { BoxIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { createCoverageContext, type CoverageContext } from "./sphere";

/** 示意图调色板（颜色取自主题 CSS 变量） */
interface GridPalette {
  /** 画布底色 */
  canvasBg: string;
  /** 网格线颜色 */
  gridLine: string;
  /** 覆盖格颜色（被至少一个球覆盖） */
  covered: string;
  /** 正方形内空隙格颜色 */
  gap: string;
  /** 球心方块颜色 */
  center: string;
  /** 球心方块上的高度数字颜色 */
  centerText: string;
  /** 球心连线（正方形边）颜色 */
  squareEdge: string;
}

/** 读取根元素上的主题 CSS 变量颜色值 */
function readCssColor(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** 为 oklch 颜色追加透明度；已包含 alpha 的值原样返回 */
function withAlpha(color: string, alpha: number): string {
  return color.includes("/") ? color : color.replace(/\)$/, ` / ${alpha})`);
}

/** 读取当前主题下的示意图调色板 */
function readPalette(): GridPalette {
  return {
    canvasBg: readCssColor("--card"),
    // 网格线需在覆盖色之上保持可见，取中性前景色加透明度
    gridLine: withAlpha(readCssColor("--muted-foreground"), 0.3),
    covered: withAlpha(readCssColor("--primary"), 0.4),
    gap: withAlpha(readCssColor("--destructive"), 0.6),
    center: readCssColor("--primary"),
    centerText: readCssColor("--primary-foreground"),
    squareEdge: withAlpha(readCssColor("--muted-foreground"), 0.6),
  };
}

/** SphereCoverageGrid 组件属性 */
interface SphereCoverageGridProps {
  /** 球直径（格），支持奇偶 */
  diameter: number;
  /** 球心间距（格） */
  distance: number;
  /** 是否在覆盖格上标注该列总层数（关闭时仍可悬浮查看单个格子的高度） */
  showHeight: boolean;
  /** 自定义容器 className */
  className?: string;
  /** 打开 3D 查看弹窗 */
  onOpen3D?: () => void;
}

/** 示意图网格边长（格）：四球包围盒（宽 distance + 直径 d）四周各外扩 1 格空白 */
function gridExtent(diameter: number, distance: number): number {
  return distance + diameter + 2;
}

/**
 * 在画布上逐格绘制四个像素化球的中间层覆盖示意图
 * 四个球心位于格心 (0,0) (d,0) (0,d) (d,d)，落在中间层截面区域内的格子视为被该球覆盖
 * @param viewportBudget 视口高度预算（px，已扣除页头与控件的最小占位），与宽度共同约束单格尺寸
 * @param coverage 覆盖判定与列高计算上下文（组件层已按直径与间距 memo 化）
 */
function drawGrid(
  canvas: HTMLCanvasElement,
  width: number,
  diameter: number,
  distance: number,
  palette: GridPalette,
  showHeight: boolean,
  viewportBudget: number,
  coverage: CoverageContext,
): void {
  const gridW = gridExtent(diameter, distance);
  // 单格尺寸：宽度与视口高度预算共同约束（取较小者），上限 20 避免超大屏格子过大；
  // 可读性下限 12px 保证格子与高度数字可辨；
  // 超出容器宽度的部分由横向滚动兜底，纵向超出视口时由页面滚动查看
  const cell = Math.max(
    12,
    Math.min(20, Math.floor(width / gridW), Math.floor(viewportBudget / gridW)),
  );
  const cssW = cell * gridW;
  const cssH = cssW; // 网格为正方形
  const dpr = window.devicePixelRatio || 1;
  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  ctx.scale(dpr, dpr);
  ctx.fillStyle = palette.canvasBg;
  ctx.fillRect(0, 0, cssW, cssH);

  const d = distance;
  // 视图原点：四球包围盒左上角再外扩 1 格，保证四边空白对称（各 1 格）
  const viewOffset = Math.ceil(diameter / 2);
  // 球心方块标记：仅奇数直径存在明确的球心格
  const showCenterMark = diameter % 2 === 1;
  const centers = new Set<string>(
    showCenterMark ? coverage.centerList.map(([cx, cy]) => `${cx},${cy}`) : [],
  );
  // 单格过小时跳过网格线，避免糊成一片
  const drawGridLine = cell >= 4;
  // 高度标注：单格过小时数字不可读，跳过
  const drawHeight = showHeight && cell >= 10;

  for (let gy = 0; gy < cssH / cell; gy++) {
    const y = gy - viewOffset;
    for (let gx = 0; gx < cssW / cell; gx++) {
      const x = gx - viewOffset;
      const count = coverage.countCovered(x, y);

      const insideSquare = x >= 0 && x <= d && y >= 0 && y <= d;
      let fill: string | null = null;
      if (count >= 1) {
        fill = palette.covered;
      } else if (insideSquare) {
        fill = palette.gap;
      }

      const px = gx * cell;
      const py = gy * cell;
      const isCenter = centers.has(`${x},${y}`);
      if (isCenter) {
        // 球心方块：整格填充不透明主色，与半透明覆盖区区分
        ctx.fillStyle = palette.center;
        ctx.fillRect(px, py, cell, cell);
      } else if (fill) {
        ctx.fillStyle = fill;
        ctx.fillRect(px, py, cell, cell);
      }

      // 高度标注：显示该列从球底到球顶的总层数（球心方块上用对比色数字）
      if (drawHeight && count >= 1) {
        ctx.fillStyle = isCenter ? palette.centerText : palette.center;
        ctx.font = `${Math.max(9, Math.floor(cell * 0.75))}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          String(coverage.columnHeight(x, y)),
          px + cell / 2,
          py + cell / 2 + 0.5,
        );
      }
    }
  }

  // 统一叠加网格线（覆盖区域之上同样可见，保持方格感）
  if (drawGridLine) {
    ctx.strokeStyle = palette.gridLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= gridW; i++) {
      const px = i * cell + 0.5;
      ctx.moveTo(px, 0);
      ctx.lineTo(px, cssH);
    }
    for (let i = 1; i < gridW; i++) {
      const py = i * cell + 0.5;
      ctx.moveTo(0, py);
      ctx.lineTo(cssW, py);
    }
    ctx.stroke();
  }

  // 球心连线（正方形边）：奇数直径连球心格心，偶数直径球心位于格点，偏移多半格
  const squareStart = (viewOffset + (diameter % 2 === 0 ? 1 : 0.5)) * cell;
  ctx.strokeStyle = palette.squareEdge;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  ctx.strokeRect(squareStart, squareStart, d * cell, d * cell);
  ctx.setLineDash([]);
}

/** 图例项 */
interface LegendItem {
  /** 图例文案 */
  label: string;
  /** 图例色块颜色 */
  color: string;
}

/** 悬浮提示信息 */
interface HoverInfo {
  /** 相对提示容器的横向位置（px） */
  x: number;
  /** 相对提示容器的纵向位置（px） */
  y: number;
  /** 悬浮格子的世界网格坐标（高度与覆盖状态渲染时实时派生，避免参数变化后显示过期值） */
  gridX: number;
  gridY: number;
}

/** MC 球覆盖方格示意图（Canvas 逐格渲染 + 图例），随容器宽度与主题变化自动重绘 */
export function SphereCoverageGrid({
  diameter,
  distance,
  showHeight,
  className,
  onOpen3D,
}: SphereCoverageGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [palette, setPalette] = useState<GridPalette>(readPalette);
  const [hover, setHover] = useState<HoverInfo | null>(null);
  // 球心方块标记：仅奇数直径存在明确的球心格
  const showCenterMark = diameter % 2 === 1;
  // 覆盖判定与列高计算上下文，供绘制与悬浮提示共用
  const coverage = useMemo(
    () => createCoverageContext(diameter, distance),
    [diameter, distance],
  );

  // 监听容器宽度变化
  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerWidth(Math.floor(entry.contentRect.width));
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 监听视口高度变化，约束画布纵向不超出屏幕
  useEffect(() => {
    const update = () => setViewportHeight(window.innerHeight);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // 监听根元素 class 变化（主题切换）以更新调色板
  useEffect(() => {
    const observer = new MutationObserver(() => setPalette(readPalette()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  // 视口高度预算：仅扣除页头与控件的约 120px 最小占位，
  // 画布纵向超出预算时由页面滚动查看，避免过度压缩单格导致高度数字不可读
  const viewportBudget = viewportHeight - 120;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || containerWidth <= 0) {
      return;
    }
    drawGrid(
      canvas,
      containerWidth,
      diameter,
      distance,
      palette,
      showHeight,
      viewportBudget,
      coverage,
    );
  }, [containerWidth, viewportBudget, diameter, distance, palette, showHeight, coverage]);

  /** 鼠标悬浮时计算所在格子的列高度，未被覆盖则不显示提示 */
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) {
      return;
    }
    const cssW = parseFloat(canvas.style.width);
    if (!cssW) {
      return;
    }
    const gridW = gridExtent(diameter, distance);
    const cell = cssW / gridW;
    const rect = canvas.getBoundingClientRect();
    const gx = Math.floor(((e.clientX - rect.left) * cssW) / rect.width / cell);
    const gy = Math.floor(((e.clientY - rect.top) * cssW) / rect.height / cell);
    if (gx < 0 || gy < 0 || gx >= gridW || gy >= gridW) {
      setHover(null);
      return;
    }
    const viewOffset = Math.ceil(diameter / 2);
    const x = gx - viewOffset;
    const y = gy - viewOffset;
    if (coverage.countCovered(x, y) === 0) {
      setHover(null);
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const mx = e.clientX - containerRect.left;
    const my = e.clientY - containerRect.top;
    setHover({
      // 靠近右边界时提示翻到鼠标左侧，靠近顶部时放到下方
      x: mx > containerRect.width - 130 ? mx - 118 : mx + 14,
      y: my > 48 ? my - 36 : my + 18,
      gridX: x,
      gridY: y,
    });
  };

  /** 当前主题下的图例项（球心方块仅奇数直径存在） */
  const legendItems: LegendItem[] = [
    { label: "覆盖区", color: palette.covered },
    { label: "空隙（正方形内未覆盖）", color: palette.gap },
    ...(showCenterMark ? [{ label: "球心方块", color: palette.center }] : []),
  ];

  return (
    <div className={cn("space-y-2", className)}>
      {/* 画布居中用 mx-auto 而非 flex justify-center：溢出滚动时 auto margin 会回退为左对齐，
          避免 flex 居中导致左侧溢出内容永远无法滚动到 */}
      <div ref={containerRef} className="relative overflow-x-auto">
        {onOpen3D && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  className="absolute top-2 right-2 z-10 bg-background/90 shadow-sm backdrop-blur-sm"
                  onClick={onOpen3D}
                  aria-label="3D 查看"
                />
              }
            >
              <BoxIcon />
            </TooltipTrigger>
            <TooltipContent>3D 查看</TooltipContent>
          </Tooltip>
        )}
        <canvas
          ref={canvasRef}
          className="mx-auto block"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHover(null)}
        />
        {hover && coverage.countCovered(hover.gridX, hover.gridY) > 0 && (
          <div
            className="pointer-events-none absolute z-10 rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md"
            style={{ left: hover.x, top: hover.y }}
          >
            该列共 {coverage.columnHeight(hover.gridX, hover.gridY)} 层
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {legendItems.map((item) => (
          <span
            key={item.label}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <span className="size-3 rounded-xs" style={{ backgroundColor: item.color }} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
