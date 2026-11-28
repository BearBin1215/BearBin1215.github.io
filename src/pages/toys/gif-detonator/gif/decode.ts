import { decompressFrames, parseGIF, type ParsedFrame, type ParsedGif } from "gifuct-js";

/** 单帧的整画布 RGBA 像素，长度为画布宽 × 高 × 4 */
type Rgba = Uint8ClampedArray<ArrayBuffer>;

/** 解码后的一帧 */
export interface GifFrame {
  /** 已按帧处置方式补齐成整张画布的 RGBA 像素 */
  rgba: Rgba;
  /** 该帧的播放时长（毫秒） */
  delayMs: number;
}

/** 解码结果 */
export interface DecodedGif {
  /** 画布宽度（像素） */
  width: number;
  /** 画布高度（像素） */
  height: number;
  /** 依次播放的帧 */
  frames: GifFrame[];
}

/** 解码选项 */
interface DecodeOptions {
  /** 保留的起始帧，从 0 开始（含） */
  from?: number;
  /** 截止帧（不含） */
  to?: number;
}

/** GIF 格式的帧间隔下限，更小的值会被浏览器自行放慢 */
export const MIN_DELAY_MS = 20;

/**
 * 把 GIF 解析成整画布的 RGBA 帧序列。
 *
 * 解码的同时按 `maxWidth` 等比缩小，`from` / `to` 用于只保留片段：
 * 区间外的帧仍会被合成（保证区间内画面正确），但不会留在内存里。
 *
 * @param buffer GIF 文件内容
 * @param maxWidth 输出宽度上限，原图更窄时不放大
 * @param options 帧区间选项
 */
export function decodeGif(
  buffer: ArrayBuffer,
  maxWidth: number,
  options: DecodeOptions = {},
): DecodedGif {
  let parsed: ParsedGif;
  let rawFrames: ParsedFrame[];
  try {
    parsed = parseGIF(buffer);
    rawFrames = decompressFrames(parsed, true);
  } catch {
    throw new Error("这个 GIF 解析不了。");
  }
  if (rawFrames.length === 0) {
    throw new Error("这个 GIF 里没有可用的画面。");
  }

  const from = options.from ?? 0;
  const to = Math.min(options.to ?? Infinity, rawFrames.length);

  const width = parsed.lsd.width;
  const height = parsed.lsd.height;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

  const patchCanvas = document.createElement("canvas");
  const patchCtx = patchCanvas.getContext("2d")!;

  const scale = Math.min(1, maxWidth / width);
  const outWidth = Math.max(1, Math.round(width * scale));
  const outHeight = Math.max(1, Math.round(height * scale));

  const scaleCanvas = document.createElement("canvas");
  scaleCanvas.width = outWidth;
  scaleCanvas.height = outHeight;
  const scaleCtx = scaleCanvas.getContext("2d", { willReadFrequently: true })!;
  scaleCtx.imageSmoothingEnabled = true;
  scaleCtx.imageSmoothingQuality = "high";

  const frames: GifFrame[] = [];
  /** 处置方式为 3 时，需要在画下一帧前恢复的快照 */
  let savedState: ImageData | null = null;

  for (let index = 0; index < rawFrames.length; index++) {
    const frame = rawFrames[index]!;

    if (frame.disposalType === 3) {
      savedState = ctx.getImageData(0, 0, width, height);
    }

    const { left, top, width: fw, height: fh } = frame.dims;
    if (fw > 0 && fh > 0) {
      patchCanvas.width = fw;
      patchCanvas.height = fh;
      patchCtx.putImageData(
        new ImageData(new Uint8ClampedArray(frame.patch), fw, fh),
        0,
        0,
      );
      ctx.drawImage(patchCanvas, left, top);
    }

    const delayMs = Math.max(MIN_DELAY_MS, frame.delay || 100);

    if (index >= from && index < to) {
      if (scale < 1) {
        scaleCtx.clearRect(0, 0, outWidth, outHeight);
        scaleCtx.drawImage(canvas, 0, 0, outWidth, outHeight);
        frames.push({
          rgba: new Uint8ClampedArray(
            scaleCtx.getImageData(0, 0, outWidth, outHeight).data,
          ),
          delayMs,
        });
      } else {
        frames.push({
          rgba: new Uint8ClampedArray(ctx.getImageData(0, 0, width, height).data),
          delayMs,
        });
      }
    }

    // 按当前帧的处置方式更新画布，得到下一帧的初始状态
    if (frame.disposalType === 2) {
      ctx.clearRect(left, top, fw, fh);
    } else if (frame.disposalType === 3 && savedState) {
      ctx.putImageData(savedState, 0, 0);
    }
  }

  if (frames.length === 0) {
    throw new Error("帧区间内没有画面。");
  }

  return { width: outWidth, height: outHeight, frames };
}
