/** 输入 GIF 的体积上限 */
export const MAX_INPUT_BYTES = 20 * 1024 * 1024;

/** 源片帧数上限，超出后解码与编码耗时不可控 */
export const MAX_SOURCE_FRAMES = 500;

/** 输出宽度上限，源片更宽时等比缩小 */
export const MAX_OUTPUT_WIDTH = 480;

/** 结尾加速倍数的取值范围与默认值 */
export const SPEED_RANGE = { min: 2, max: 12, default: 6 } as const;

/**
 * 加速曲线指数的取值范围与默认值。
 *
 * 倍速按 `progress ** curve` 从 1 涨到结尾倍速，`progress` 是加速段的归一化进度（0 → 1）：
 * 指数为 1 时线性增长，越大越把加速推迟到结尾，小于 1 则起步就明显提速、后段趋缓。
 */
export const CURVE_RANGE = { min: 0.5, max: 4, default: 2 } as const;

/** 把字节数格式化为便于阅读的单位 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** 把毫秒时长格式化为秒，保留一位小数 */
export function formatDuration(ms: number): string {
  return `${(ms / 1000).toFixed(1)} 秒`;
}
