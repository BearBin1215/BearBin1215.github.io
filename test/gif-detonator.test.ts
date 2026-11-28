import { describe, expect, it } from "vitest";
import { MIN_DELAY_MS, type DecodedGif } from "@/pages/toys/gif-detonator/gif/decode";
import { accelerate } from "@/pages/toys/gif-detonator/gif/transform";

/** 构造只关心帧数与帧间隔的测试用 GIF，像素数据留空 */
function makeGif(frameCount: number, delayMs: number): DecodedGif {
  return {
    width: 2,
    height: 2,
    frames: Array.from({ length: frameCount }, () => ({
      rgba: new Uint8ClampedArray(16),
      delayMs,
    })),
  };
}

function totalDuration(frames: { delayMs: number }[]): number {
  return frames.reduce((sum, frame) => sum + frame.delayMs, 0);
}

describe("GIF 结尾加速", () => {
  it("帧间隔不低于 GIF 下限，并按 10ms 取整", () => {
    const frames = accelerate(makeGif(40, 100), 6);
    for (const frame of frames) {
      expect(frame.delayMs).toBeGreaterThanOrEqual(MIN_DELAY_MS);
      expect(frame.delayMs % 10).toBe(0);
    }
  });

  it("源片太短时循环播放，直到加速段达到最短时长", () => {
    const frames = accelerate(makeGif(40, 100), 6);
    expect(totalDuration(frames)).toBeGreaterThanOrEqual(2400);
  });

  it("末段的帧间隔明显小于开头", () => {
    const frames = accelerate(makeGif(40, 100), 6);
    expect(frames.at(-1)!.delayMs).toBeLessThan(frames[0]!.delayMs);
  });

  it("循环遍数有上限，极短的源片不会无限重复", () => {
    const frames = accelerate(makeGif(10, 100), 12);
    expect(frames.length).toBeLessThanOrEqual(10 * 8);
  });
});
