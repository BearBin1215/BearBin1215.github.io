import {
  GIFEncoder,
  createPaletteMapper,
  createPaletteSampler,
  type Palette,
} from "@techsquidtv/gifenc";
import type { GifFrame } from "./decode";

/** 参与调色板取样的帧数上限 */
const SAMPLE_FRAME_COUNT = 12;
/** 调色板取样使用的像素总数上限，控制量化耗时 */
const MAX_SAMPLE_PIXELS = 160_000;

/** 让出主线程，给浏览器留出重绘界面（进度条）的机会 */
export function nextTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/** 全片共用一套 256 色调色板，取样覆盖整段序列，源片与爆炸都能取到颜色 */
function buildPalette(frames: GifFrame[]): Palette {
  const sampledFrames = Math.min(frames.length, SAMPLE_FRAME_COUNT);
  const frameStep = Math.max(1, Math.floor(frames.length / sampledFrames));
  const samplesPerFrame = Math.ceil(MAX_SAMPLE_PIXELS / sampledFrames);
  const sampler = createPaletteSampler(samplesPerFrame * sampledFrames, samplesPerFrame);

  for (let i = 0; i < sampledFrames; i++) {
    sampler.addFrame(frames[Math.min(frames.length - 1, i * frameStep)]!.rgba);
  }

  return sampler.quantize(256, { format: "rgb565" });
}

/**
 * 把帧序列编码成可下载的 GIF。
 *
 * 每帧按需让出主线程，`onProgress` 用于驱动界面上的进度条。
 *
 * @param onProgress 编码进度回调，参数为 0~1 的比例
 */
export async function encodeGif(
  frames: GifFrame[],
  width: number,
  height: number,
  onProgress?: (fraction: number) => void,
): Promise<Blob> {
  if (frames.length === 0) {
    throw new Error("没有可编码的画面。");
  }

  const palette = buildPalette(frames);
  const mapper = createPaletteMapper(palette, "rgb565");
  const encoder = GIFEncoder();

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i]!;
    encoder.writeFrame(mapper.map(frame.rgba), width, height, {
      palette: i === 0 ? palette : undefined,
      delay: frame.delayMs,
      repeat: 0,
    });
    onProgress?.((i + 1) / frames.length);
    if ((i & 7) === 7) {
      await nextTick();
    }
  }

  encoder.finish();
  // bytes() 的类型不满足 BlobPart，复制一份完成类型转换
  return new Blob([new Uint8Array(encoder.bytes())], { type: "image/gif" });
}
