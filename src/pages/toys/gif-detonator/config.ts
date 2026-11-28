/** 输入 GIF 的体积上限 */
export const MAX_INPUT_BYTES = 20 * 1024 * 1024;

/** 源片帧数上限，超出后解码与编码耗时不可控 */
export const MAX_SOURCE_FRAMES = 500;

/** 输出宽度上限，源片更宽时等比缩小 */
export const MAX_OUTPUT_WIDTH = 480;

/** 结尾加速倍数的取值范围与默认值 */
export const SPEED_RANGE = { min: 2, max: 12, default: 6 } as const;

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
