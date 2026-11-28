import { useCallback, useEffect, useRef, useState } from "react";
import {
  formatBytes,
  MAX_INPUT_BYTES,
  MAX_OUTPUT_WIDTH,
  MAX_SOURCE_FRAMES,
} from "./config";
import { decodeGif, type GifFrame } from "./gif/decode";
import { encodeGif, nextTick } from "./gif/encode";
import { loadExplosion } from "./gif/explosion";
import { accelerate, fillBox } from "./gif/transform";

/** 已选中的源文件 */
export interface DetonatorSource {
  /** 用户选择的原始文件 */
  file: File;
  /** 文件内容，每次生成时重新解码 */
  bytes: ArrayBuffer;
  /** 缩略图使用的 object URL */
  url: string;
}

/** 生成结果 */
export interface DetonatorResult {
  /** 结果 GIF 的 object URL */
  url: string;
  /** 建议的下载文件名 */
  downloadName: string;
  /** 画布宽度（像素） */
  width: number;
  /** 画布高度（像素） */
  height: number;
  /** 总帧数 */
  frameCount: number;
  /** 总时长（毫秒） */
  durationMs: number;
  /** 文件大小（字节） */
  size: number;
}

/** 生成进度 */
export interface DetonatorProgress {
  /** 0~1 的完成比例 */
  fraction: number;
  /** 当前阶段的说明文案 */
  label: string;
}

/**
 * GIF 起爆器的状态与处理流程。
 *
 * 解码、加速与编码都在主线程执行，靠让出主线程来刷新进度；
 * object URL 在结果被替换与组件卸载时回收。
 */
export function useGifDetonator() {
  const [source, setSource] = useState<DetonatorSource | null>(null);
  const [result, setResult] = useState<DetonatorResult | null>(null);
  const [progress, setProgress] = useState<DetonatorProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** 源文件的引用副本，供异步回调与卸载清理读取 */
  const sourceRef = useRef<DetonatorSource | null>(null);
  /** 结果的引用副本，供异步回调与卸载清理读取 */
  const resultRef = useRef<DetonatorResult | null>(null);
  /** 生成中的互斥标记，避免重复点击 */
  const busyRef = useRef(false);

  useEffect(() => {
    return () => {
      if (sourceRef.current) {
        URL.revokeObjectURL(sourceRef.current.url);
      }
      if (resultRef.current) {
        URL.revokeObjectURL(resultRef.current.url);
      }
    };
  }, []);

  /** 回收结果的 object URL 并清空展示 */
  const clearResult = useCallback(() => {
    if (resultRef.current) {
      URL.revokeObjectURL(resultRef.current.url);
    }
    resultRef.current = null;
    setResult(null);
  }, []);

  /** 校验并载入用户选择的文件；不合法时只更新错误文案 */
  const selectFile = useCallback(
    async (file: File) => {
      if (busyRef.current) {
        return;
      }
      setError(null);

      if (file.type !== "image/gif" && !/\.gif$/i.test(file.name)) {
        setError("只支持 GIF 文件。");
        return;
      }
      if (file.size > MAX_INPUT_BYTES) {
        setError(
          `文件超过 ${formatBytes(MAX_INPUT_BYTES)}（当前 ${formatBytes(file.size)}）。`,
        );
        return;
      }

      let bytes: ArrayBuffer;
      try {
        bytes = await file.arrayBuffer();
      } catch {
        setError("读取文件失败。");
        return;
      }

      const previous = sourceRef.current;
      const next: DetonatorSource = {
        file,
        bytes,
        url: URL.createObjectURL(file),
      };
      sourceRef.current = next;
      setSource(next);
      if (previous) {
        URL.revokeObjectURL(previous.url);
      }
      clearResult();
    },
    [clearResult],
  );

  /**
   * 解码源片，接上按 `peakSpeed` 与 `curve` 加速的循环、以及爆炸片段后重新编码。
   *
   * @param peakSpeed 加速曲线末端的倍速
   * @param curve 加速曲线的幂指数
   */
  const generate = useCallback(
    async (peakSpeed: number, curve: number) => {
      const current = sourceRef.current;
      if (!current || busyRef.current) {
        return;
      }

      busyRef.current = true;
      setError(null);
      clearResult();
      setProgress({ fraction: 0.03, label: "解析 GIF" });

      try {
        await nextTick();

        const gif = decodeGif(current.bytes, MAX_OUTPUT_WIDTH);
        if (gif.frames.length > MAX_SOURCE_FRAMES) {
          throw new Error(
            `原图 ${gif.frames.length} 帧，超过 ${MAX_SOURCE_FRAMES} 帧上限。`,
          );
        }

        setProgress({ fraction: 0.25, label: "结尾加速中" });
        await nextTick();
        const accelerated = accelerate(gif, peakSpeed, curve);
        const explosion = fillBox(await loadExplosion(), gif.width, gif.height);

        setProgress({ fraction: 0.45, label: "编码中" });
        await nextTick();

        const frames: GifFrame[] = [...accelerated, ...explosion];
        const blob = await encodeGif(frames, gif.width, gif.height, (fraction) =>
          setProgress({
            fraction: 0.45 + fraction * 0.55,
            label: `编码中 ${Math.round(fraction * 100)}%`,
          }),
        );

        const baseName = current.file.name.replace(/\.gif$/i, "");
        const nextResult: DetonatorResult = {
          url: URL.createObjectURL(blob),
          downloadName: `${baseName}-detonated.gif`,
          width: gif.width,
          height: gif.height,
          frameCount: frames.length,
          durationMs: frames.reduce((sum, frame) => sum + frame.delayMs, 0),
          size: blob.size,
        };
        resultRef.current = nextResult;
        setResult(nextResult);
      } catch (err) {
        setError(err instanceof Error ? err.message : "生成失败。");
      } finally {
        busyRef.current = false;
        setProgress(null);
      }
    },
    [clearResult],
  );

  return {
    source,
    result,
    progress,
    error,
    /** 生成中的标志，界面据此禁用交互 */
    busy: progress !== null,
    selectFile,
    generate,
  };
}
