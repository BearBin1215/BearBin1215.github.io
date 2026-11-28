import { useState } from "react";
import { Bomb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Spinner } from "@/components/ui/spinner";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { CURVE_RANGE, SPEED_RANGE } from "./config";
import GifDetonatorDropzone from "./dropzone";
import GifDetonatorResultPanel from "./result";
import { useGifDetonator } from "./use-detonator";

/** 取出单值滑杆回调里的数值，兼容基元与数组两种形式 */
function readSliderValue(value: number | readonly number[]): number | undefined {
  return typeof value === "number" ? value : value[0];
}

export default function GifDetonatorPage() {
  useDocumentTitle("GIF 加速起爆器");
  const [peakSpeed, setPeakSpeed] = useState<number>(SPEED_RANGE.default);
  const [curve, setCurve] = useState<number>(CURVE_RANGE.default);
  const { source, result, progress, error, busy, selectFile, generate } =
    useGifDetonator();

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">GIF 加速起爆器</h1>

      <GifDetonatorDropzone
        source={source}
        disabled={busy}
        onSelect={(file) => void selectFile(file)}
      />

      <section className="space-y-3 rounded-xl border bg-card/60 p-4 backdrop-blur-sm">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium">结尾加速</span>
            <span className="font-mono text-sm text-primary tabular-nums">
              {peakSpeed}×
            </span>
          </div>

          <Slider
            min={SPEED_RANGE.min}
            max={SPEED_RANGE.max}
            step={1}
            value={[peakSpeed]}
            disabled={busy}
            onValueChange={(value) => {
              const next = readSliderValue(value);
              if (next !== undefined) {
                setPeakSpeed(next);
              }
            }}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium">加速曲线</span>
            <span className="font-mono text-sm text-primary tabular-nums">
              {curve.toFixed(1)} 次方
            </span>
          </div>

          <Slider
            min={CURVE_RANGE.min}
            max={CURVE_RANGE.max}
            step={0.1}
            value={[curve]}
            disabled={busy}
            onValueChange={(value) => {
              const next = readSliderValue(value);
              if (next !== undefined) {
                setCurve(next);
              }
            }}
          />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>前段提速</span>
            <span>尾段提速</span>
          </div>
        </div>

        <Button
          className="w-full"
          size="lg"
          disabled={!source || busy}
          onClick={() => void generate(peakSpeed, curve)}
        >
          {busy ? <Spinner /> : <Bomb />}
          {busy ? "生成中" : "生成"}
        </Button>

        {progress && (
          <div className="space-y-1.5">
            <div
              className="h-1 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress.fraction * 100)}
              aria-label="生成进度"
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-150 ease-linear"
                style={{ width: `${Math.round(progress.fraction * 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{progress.label}</p>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </section>

      {result && <GifDetonatorResultPanel result={result} />}
    </div>
  );
}
