import { MIN_DELAY_MS, type DecodedGif, type GifFrame } from "./decode";

/** 加速段的最短总时长，不足时继续循环源片 */
const MIN_RAMP_MS = 2400;
/** 源片最多循环的遍数 */
const MAX_LOOPS = 8;
/** 加速段的总帧数上限，防止长 GIF 循环后体积失控 */
const MAX_RAMP_FRAMES = 1500;

/** 一轮循环得到的帧序列与总时长 */
interface Pass {
  frames: GifFrame[];
  durationMs: number;
}

/**
 * 循环源片并重新分配帧间隔：起始为原速，结尾为 `peakSpeed` 倍。
 *
 * 倍速按 `progress ** curve` 从 1 涨到 `peakSpeed`，曲线覆盖整段（含所有循环），
 * 所以每一遍都比上一遍快。
 * 单帧累计时长不足 `MIN_DELAY_MS` 时并入下一帧，末段帧数因此减少，观感是明显跳帧。
 *
 * @param gif 解码后的源 GIF
 * @param peakSpeed 加速曲线末端的倍速
 * @param curve 加速曲线的幂指数，1 为线性爬坡，越大越把加速堆到结尾
 */
export function accelerate(
  gif: DecodedGif,
  peakSpeed: number,
  curve: number,
): GifFrame[] {
  let loops = 1;
  let pass = buildPass(gif, peakSpeed, curve, loops);

  while (pass.durationMs < MIN_RAMP_MS && loops < MAX_LOOPS) {
    if (gif.frames.length * (loops + 1) > MAX_RAMP_FRAMES) {
      break;
    }
    loops += 1;
    pass = buildPass(gif, peakSpeed, curve, loops);
  }

  return pass.frames;
}

/**
 * 按给定循环遍数重排帧间隔。
 *
 * @param loops 源片循环遍数
 */
function buildPass(
  gif: DecodedGif,
  peakSpeed: number,
  curve: number,
  loops: number,
): Pass {
  const source = gif.frames;
  const totalFrames = source.length * loops;
  const frames: GifFrame[] = [];
  let durationMs = 0;
  /** 已被加速压缩、但还没归入某一帧的时长 */
  let pending = 0;
  let index = 0;

  for (let loop = 0; loop < loops; loop++) {
    for (let i = 0; i < source.length; i++, index++) {
      const progress = totalFrames > 1 ? index / (totalFrames - 1) : 1;
      const speed = 1 + (peakSpeed - 1) * progress ** curve;
      pending += source[i]!.delayMs / speed;

      if (pending >= MIN_DELAY_MS || index === totalFrames - 1) {
        const delayMs = Math.max(MIN_DELAY_MS, Math.round(pending / 10) * 10);
        frames.push({ rgba: source[i]!.rgba, delayMs });
        durationMs += delayMs;
        pending = 0;
      }
    }
  }

  return { frames, durationMs };
}

/**
 * 把 GIF 等比放大到铺满目标画布并居中裁掉溢出部分，
 * 让爆炸片段铺满画面，不留黑边。
 *
 * @param gif 待缩放的 GIF
 * @param boxWidth 目标画布宽度
 * @param boxHeight 目标画布高度
 */
export function fillBox(
  gif: DecodedGif,
  boxWidth: number,
  boxHeight: number,
): GifFrame[] {
  const source = document.createElement("canvas");
  source.width = gif.width;
  source.height = gif.height;
  const sourceCtx = source.getContext("2d")!;

  const canvas = document.createElement("canvas");
  canvas.width = boxWidth;
  canvas.height = boxHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const scale = Math.max(boxWidth / gif.width, boxHeight / gif.height);
  const drawWidth = Math.max(1, Math.round(gif.width * scale));
  const drawHeight = Math.max(1, Math.round(gif.height * scale));
  const offsetX = Math.round((boxWidth - drawWidth) / 2);
  const offsetY = Math.round((boxHeight - drawHeight) / 2);

  return gif.frames.map((frame) => {
    sourceCtx.putImageData(new ImageData(frame.rgba, gif.width, gif.height), 0, 0);
    ctx.clearRect(0, 0, boxWidth, boxHeight);
    ctx.drawImage(source, offsetX, offsetY, drawWidth, drawHeight);
    return {
      rgba: new Uint8ClampedArray(ctx.getImageData(0, 0, boxWidth, boxHeight).data),
      delayMs: frame.delayMs,
    };
  });
}
