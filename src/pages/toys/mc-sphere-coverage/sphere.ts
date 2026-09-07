/** 球体形状数据（blakeohare/minecraftsphere 超采样算法构建） */
interface SphereShape {
  /** 中间层各行半宽：索引为 floor(|dy|)（dy 为相对球对称中心的竖直偏移，偶数直径时为半整数），值可为半整数 */
  sliceHalfWidth: number[];
  /** 列跨度表：该列从球底到球顶的总层数，索引为 y * size + x（球内水平网格坐标），未覆盖为 0 */
  columnSpan: Uint8Array;
  /** 网格边长（= 直径） */
  size: number;
}

/** 球体形状按直径缓存，供示意图绘制与页面覆盖计算共享，避免重复构建 */
const sphereShapeCache = new Map<number, SphereShape>();

/**
 * 构建 3D 超采样球体形状（移植自 blakeohare/minecraftsphere）：
 * 每个方块细分出 5³ 个子立方体中心，落在单位球内的比例 > 50% 则该方块属于球。
 * 层直径在球心附近保持不变、向两极平滑递减，符合真实球形。支持任意直径（含偶数）。
 * @param diameter 球直径（格），网格边长 = diameter
 */
function buildSphereShape(diameter: number): SphereShape {
  const cached = sphereShapeCache.get(diameter);
  if (cached) {
    return cached;
  }
  const size = diameter;
  // 子采样偏移量级为 1/d，中心距离平方落在 [1 - fast, 1 + fast] 之外时可秒判
  const fast = 4 / size;
  const sub = [-0.5, -0.25, 0, 0.25, 0.5].map((v) => {
    const s = (2 * v) / size;
    return s * s;
  });
  // 中间层（最大截面）：奇数直径为正中一层，偶数直径取对称两层之一（图案相同）
  const sliceZ = Math.ceil(size / 2);
  // 球对称中心的网格参考坐标（奇数直径为整数格心，偶数直径为 x.5）
  const center = (size - 1) / 2;
  const sliceHalfWidth = new Array<number>(Math.ceil(size / 2)).fill(0);
  // 列跨度的 zmin/zmax 临时表，索引 y * size + x
  const zmin = new Uint16Array(size * size).fill(size + 1);
  const zmax = new Uint16Array(size * size);
  for (let z = 1; z <= size; z++) {
    const bz = (2 * (z - 0.5)) / size - 1;
    const bzz = bz * bz;
    for (let y = 0; y < size; y++) {
      const by = (2 * (y + 0.5)) / size - 1;
      const base = by * by + bzz;
      for (let x = 0; x < size; x++) {
        const bx = (2 * (x + 0.5)) / size - 1;
        const c = bx * bx + base;
        let isFilled: boolean;
        if (c <= 1 - fast) {
          isFilled = true;
        } else if (c > 1 + fast) {
          continue;
        } else {
          // 精确子采样：距离平方 ≤ 1 的子立方体中心占比过半
          let n = 0;
          for (const sx of sub) {
            for (const sy of sub) {
              for (const sz of sub) {
                if (c + sx + sy + sz <= 1) {
                  n++;
                }
              }
            }
          }
          isFilled = n / 125 > 0.5;
        }
        if (!isFilled) {
          continue;
        }
        // 中间层：记录各行半宽（行偏移按 floor(|dy|) 归组）
        if (z === sliceZ) {
          const i = Math.floor(Math.abs(y - center));
          const half = Math.abs(x - center);
          if (half > (sliceHalfWidth[i] ?? 0)) {
            sliceHalfWidth[i] = half;
          }
        }
        // 更新该列的 z 跨度
        const ci = y * size + x;
        if ((zmin[ci] ?? size + 1) > z) {
          zmin[ci] = z;
        }
        zmax[ci] = z;
      }
    }
  }
  const columnSpan = new Uint8Array(size * size);
  for (let i = 0; i < columnSpan.length; i++) {
    const lo = zmin[i] ?? size + 1;
    columnSpan[i] = lo > size ? 0 : (zmax[i] ?? lo) - lo + 1;
  }
  const shape: SphereShape = { sliceHalfWidth, columnSpan, size };
  sphereShapeCache.set(diameter, shape);
  return shape;
}

/** 覆盖判定与列高计算的共享上下文，供画布绘制与悬浮提示复用 */
export interface CoverageContext {
  /** 四个球心的网格坐标列表 */
  centerList: ReadonlyArray<readonly [number, number]>;
  /** 判断世界坐标格 (x, y) 被几个球的最大截面覆盖 */
  countCovered: (x: number, y: number) => number;
  /** 世界坐标格 (x, y) 的列总层数（四个球覆盖的最大跨度，未覆盖返回 0） */
  columnHeight: (x: number, y: number) => number;
}

/**
 * 构建覆盖判定与列高计算的共享上下文
 * 偶数直径时球的对称中心位于球心格右上方的格点 (cx + 0.5, cy + 0.5)
 */
export function createCoverageContext(
  diameter: number,
  distance: number,
): CoverageContext {
  const { sliceHalfWidth, columnSpan, size } = buildSphereShape(diameter);
  // 世界格 -> 球内网格索引的偏移：奇数直径 +radius，偶数直径 +diameter/2 - 1，两者统一为 ceil(d/2) - 1
  const indexOffset = Math.ceil(diameter / 2) - 1;
  const centerList: ReadonlyArray<readonly [number, number]> = [
    [0, 0],
    [distance, 0],
    [0, distance],
    [distance, distance],
  ];
  /** 判断相对单个球对称中心的水平偏移是否落在中间层截面内 */
  const inSlice = (dx: number, dy: number): boolean => {
    const i = Math.floor(Math.abs(dy));
    const half = sliceHalfWidth[i];
    return half !== undefined && Math.abs(dx) <= half;
  };
  // 偶数直径时球的对称中心相对球心格偏移半格
  const evenHalf = diameter % 2 === 0 ? 0.5 : 0;
  return {
    centerList,
    /** 判断世界坐标格 (x, y) 被几个球的最大截面覆盖 */
    countCovered: (x, y) => {
      let count = 0;
      for (const [cx, cy] of centerList) {
        if (inSlice(x - cx - evenHalf, y - cy - evenHalf)) {
          count++;
        }
      }
      return count;
    },
    /** 该列上四个球覆盖跨度层数的最大值，未覆盖返回 0 */
    columnHeight: (x, y) => {
      let max = 0;
      for (const [cx, cy] of centerList) {
        const ix = x - cx + indexOffset;
        const iy = y - cy + indexOffset;
        if (ix < 0 || iy < 0 || ix >= size || iy >= size) {
          continue;
        }
        const span = columnSpan[iy * size + ix] ?? 0;
        if (span > max) {
          max = span;
        }
      }
      return max;
    },
  };
}
