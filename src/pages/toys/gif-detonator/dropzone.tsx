import { useState, type ChangeEvent, type DragEvent } from "react";
import { ImageUp } from "lucide-react";
import { cn } from "cn";
import { formatBytes, MAX_INPUT_BYTES } from "./config";
import type { DetonatorSource } from "./use-detonator";

interface GifDetonatorDropzoneProps {
  /** 已选中的源文件，为 null 时显示空状态 */
  source: DetonatorSource | null;
  /** 生成过程中禁止更换文件 */
  disabled: boolean;
  /** 选择或拖入文件后的回调 */
  onSelect: (file: File) => void;
}

/** 文件选择区 */
export default function GifDetonatorDropzone({
  source,
  disabled,
  onSelect,
}: GifDetonatorDropzoneProps) {
  /** 拖拽悬停状态，用于高亮边框 */
  const [isOver, setIsOver] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // 清空 value，重新选择同一个文件时也能触发 change
    event.target.value = "";
    if (file) {
      onSelect(file);
    }
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsOver(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      onSelect(file);
    }
  };

  return (
    <label
      className={cn(
        "flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-dashed bg-card/40 text-center backdrop-blur-sm transition-colors",
        source ? "px-3 py-3" : "px-4 py-8",
        "hover:border-primary/60 hover:bg-card/60",
        isOver && "border-primary bg-primary/5",
        disabled && "pointer-events-none opacity-60",
      )}
      onDragOver={(event) => {
        event.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="image/gif,.gif"
        className="sr-only"
        disabled={disabled}
        onChange={handleChange}
      />

      {source ? (
        <span className="flex w-full items-center gap-3 text-left">
          <img
            src={source.url}
            alt=""
            className="size-11 shrink-0 rounded border border-border bg-muted object-contain"
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm">{source.file.name}</span>
            <span className="block text-xs text-muted-foreground">
              {formatBytes(source.file.size)} · 点击更换
            </span>
          </span>
        </span>
      ) : (
        <>
          <ImageUp className="mb-1 size-5 text-muted-foreground" />
          <span className="text-sm">选择或拖拽 GIF</span>
          <span className="text-xs text-muted-foreground">
            最大 {formatBytes(MAX_INPUT_BYTES)}
          </span>
        </>
      )}
    </label>
  );
}
