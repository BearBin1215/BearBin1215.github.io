import { describe, expect, it } from "vitest";
import {
  createCoverageContext,
  getSphereVoxels,
} from "@/pages/toys/mc-sphere-coverage/sphere";

/** 统计四球正方形内部（含四角）完全未被覆盖的格子数（参数顺序与源码 countGaps 一致） */
function countGaps(distance: number, diameter: number): number {
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

describe("MC 球覆盖计算", () => {
  it("球体素关于包围盒中心对称（奇偶直径均成立）", () => {
    for (const diameter of [3, 4, 5, 8, 41]) {
      const voxels = getSphereVoxels(diameter);
      const v = (i: number) => voxels[i] ?? 0;
      const filled = new Set<string>();
      for (let i = 0; i < voxels.length; i += 3) {
        filled.add(`${v(i)},${v(i + 1)},${v(i + 2)}`);
      }
      for (let i = 0; i < voxels.length; i += 3) {
        const mirror =
          `${diameter - 1 - v(i)},${diameter - 1 - v(i + 1)},` +
          `${diameter - 1 - v(i + 2)}`;
        expect(
          filled.has(mirror),
          `d=${diameter} 的第 ${i / 3} 个体素不满足中心对称`,
        ).toBe(true);
      }
    }
  });

  it("奇数直径球心格的列高等于直径", () => {
    for (const diameter of [5, 9, 41]) {
      const coverage = createCoverageContext(diameter, 0);
      expect(coverage.columnHeight(0, 0)).toBe(diameter);
    }
  });

  it("最大无空隙间距与逐格验证结果一致，再大 1 格即出现空隙", () => {
    /** 直径与对应最大安全间距（3D 超采样逐格验证的实测值） */
    const cases: readonly (readonly [number, number])[] = [
      [9, 7],
      [15, 11],
      [21, 15],
      [41, 29],
    ];
    for (const [diameter, safeDistance] of cases) {
      expect(countGaps(safeDistance, diameter)).toBe(0);
      expect(countGaps(safeDistance + 1, diameter)).toBeGreaterThan(0);
    }
  });

  it("四球覆盖关于正方形中心对称", () => {
    const distance = 29;
    const coverage = createCoverageContext(41, distance);
    for (let x = -5; x <= distance + 5; x++) {
      for (let y = -5; y <= distance + 5; y++) {
        expect(coverage.countCovered(x, y)).toBe(
          coverage.countCovered(distance - x, distance - y),
        );
      }
    }
  });
});
