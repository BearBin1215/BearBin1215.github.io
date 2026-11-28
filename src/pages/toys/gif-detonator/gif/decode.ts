/** 单帧的整画布 RGBA 像素，长度为画布宽 × 高 × 4 */
type Rgba = Uint8ClampedArray<ArrayBuffer>;

/** 解码后的一帧 */
export interface GifFrame {
  /** 整张画布的 RGBA 像素 */
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

/** 文件本身无法解析时的提示 */
const BROKEN_MESSAGE = "这个 GIF 解析不了。";

/** 逐帧输出 RGBA 用的画布 */
interface OutputCanvas {
  /** 绘制当前帧并读取像素的画布上下文 */
  ctx: CanvasRenderingContext2D;
  /** 输出宽度（像素） */
  width: number;
  /** 输出高度（像素） */
  height: number;
}

/**
 * 按 `maxWidth` 等比计算输出尺寸并创建画布。
 *
 * @param frame 用于确定画布尺寸的帧
 * @param maxWidth 输出宽度上限，原图更窄时不放大
 */
function createOutputCanvas(frame: VideoFrame, maxWidth: number): OutputCanvas {
  const scale = Math.min(1, maxWidth / frame.displayWidth);
  const width = Math.max(1, Math.round(frame.displayWidth * scale));
  const height = Math.max(1, Math.round(frame.displayHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  return { ctx, width, height };
}

/**
 * 构造解码器并等待元数据就绪。
 *
 * 轨道信息就绪后才读得到帧数；文件损坏时构造或等待阶段就会失败。
 *
 * @param buffer GIF 文件内容
 */
async function openDecoder(buffer: ArrayBuffer): Promise<ImageDecoder> {
  let decoder: ImageDecoder | null = null;
  try {
    decoder = new ImageDecoder({
      data: buffer,
      type: "image/gif",
      preferAnimation: true,
    });
    await decoder.tracks.ready;
    return decoder;
  } catch {
    decoder?.close();
    throw new Error(BROKEN_MESSAGE);
  }
}

/**
 * 解码单帧，帧数据损坏时把底层异常换成便于展示的文案。
 *
 * @param decoder 已就绪的解码器
 * @param frameIndex 帧序号，从 0 开始
 */
async function decodeFrame(
  decoder: ImageDecoder,
  frameIndex: number,
): Promise<ImageDecodeResult> {
  try {
    return await decoder.decode({ frameIndex });
  } catch {
    throw new Error(BROKEN_MESSAGE);
  }
}

/**
 * 用浏览器内置的 `ImageDecoder` 把 GIF 解析成整画布的 RGBA 帧序列。
 *
 * 帧重叠、透明与帧处置都由浏览器合成好，解码出的帧本身就是完整画面；
 * 这里只按 `maxWidth` 等比缩小，并按 `from` / `to` 只保留需要的片段。
 *
 * @param buffer GIF 文件内容
 * @param maxWidth 输出宽度上限，原图更窄时不放大
 * @param options 帧区间选项
 */
export async function decodeGif(
  buffer: ArrayBuffer,
  maxWidth: number,
  options: DecodeOptions = {},
): Promise<DecodedGif> {
  if (
    typeof ImageDecoder === "undefined" ||
    !(await ImageDecoder.isTypeSupported("image/gif"))
  ) {
    throw new Error(
      "当前浏览器不支持解码 GIF，请换用 Chrome、Edge、Firefox 或新版 Safari。",
    );
  }

  const decoder = await openDecoder(buffer);
  try {
    const track = decoder.tracks.selectedTrack;
    if (!track || track.frameCount === 0) {
      throw new Error("这个 GIF 里没有可用的画面。");
    }

    const from = Math.max(0, options.from ?? 0);
    const to = Math.min(options.to ?? Infinity, track.frameCount);

    const frames: GifFrame[] = [];
    /** 首次解码到帧后才能确定输出尺寸，因此画布延迟创建 */
    let output: OutputCanvas | null = null;

    for (let index = from; index < to; index++) {
      const { image } = await decodeFrame(decoder, index);
      try {
        output ??= createOutputCanvas(image, maxWidth);
        output.ctx.clearRect(0, 0, output.width, output.height);
        output.ctx.drawImage(image, 0, 0, output.width, output.height);
        frames.push({
          // 帧时长单位是微秒，0 时长按 GIF 的惯例当作 100ms
          delayMs: Math.max(
            MIN_DELAY_MS,
            Math.round((image.duration ?? 0) / 1000) || 100,
          ),
          rgba: new Uint8ClampedArray(
            output.ctx.getImageData(0, 0, output.width, output.height).data,
          ),
        });
      } finally {
        image.close();
      }
    }

    if (!output) {
      throw new Error("帧区间内没有画面。");
    }

    return { width: output.width, height: output.height, frames };
  } finally {
    decoder.close();
  }
}
