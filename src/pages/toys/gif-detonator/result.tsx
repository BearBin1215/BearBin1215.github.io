import { useEffect, useRef } from "react";
import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import { formatBytes, formatDuration } from "./config";
import type { DetonatorResult } from "./use-detonator";

/** 结果面板：预览生成的 GIF、尺寸等基本信息与下载入口 */
export default function GifDetonatorResultPanel({
  result,
}: {
  /** 生成结果 */
  result: DetonatorResult;
}) {
  const panelRef = useRef<HTMLElement>(null);

  // 结果出现时滚进视野
  useEffect(() => {
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [result.url]);

  return (
    <section
      ref={panelRef}
      className="space-y-3 rounded-xl border bg-card/60 p-4 backdrop-blur-sm"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium">生成结果</h2>
        <p className="font-mono text-xs text-muted-foreground tabular-nums">
          {result.frameCount} 帧 · {result.width}×{result.height} ·{" "}
          {formatDuration(result.durationMs)} · {formatBytes(result.size)}
        </p>
      </div>

      <img
        src={result.url}
        alt="生成结果预览"
        className="mx-auto max-h-90 w-auto max-w-full rounded-md border border-border bg-muted/40"
      />

      <a
        href={result.url}
        download={result.downloadName}
        className={cn(buttonVariants({ size: "sm" }), "w-full")}
      >
        <Download />
        下载 GIF
      </a>
    </section>
  );
}
