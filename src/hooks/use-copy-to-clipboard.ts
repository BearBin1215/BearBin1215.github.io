import { useCallback, useEffect, useRef, useState } from "react";

/** 复制操作的瞬时状态 */
export type CopyStatus = "idle" | "success" | "error";

/** 状态恢复默认的延时（毫秒） */
const RESET_DELAY = 2000;

/**
 * 写入剪贴板并维护瞬时状态，2 秒后回到 idle。
 * 非安全上下文或浏览器不支持时 `navigator.clipboard` 不存在，
 * 直接调用会同步抛错，因此先做能力检测，失败统一落到 error。
 *
 * @returns status 当前状态，copy 写入文本，reset 立即恢复默认状态
 */
function useCopyToClipboard() {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 卸载时清掉未触发的定时器，避免对已卸载组件 setState
  useEffect(() => clearTimer, [clearTimer]);

  const copy = useCallback(
    (text: string) => {
      clearTimer();
      const settle = (next: CopyStatus) => {
        setStatus(next);
        timerRef.current = window.setTimeout(() => {
          setStatus("idle");
          timerRef.current = null;
        }, RESET_DELAY);
      };

      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
        settle("error");
        return;
      }
      navigator.clipboard
        .writeText(text)
        .then(() => settle("success"))
        .catch((error: unknown) => {
          console.error("写入剪贴板失败", error);
          settle("error");
        });
    },
    [clearTimer],
  );

  const reset = useCallback(() => {
    clearTimer();
    setStatus("idle");
  }, [clearTimer]);

  return { status, copy, reset };
}

export { useCopyToClipboard };
