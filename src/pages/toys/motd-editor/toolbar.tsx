import type { MouseEvent } from "react";
import {
  Bold,
  Eraser,
  Italic,
  Pipette,
  Shuffle,
  Strikethrough,
  Trash2,
  Underline,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { COLORS, type CharStyle, type FormatKey } from "./motd";

/** 格式按钮定义，快捷键同时用于按钮提示与编辑区按键处理 */
export const FORMAT_BUTTONS: readonly {
  /** 样式字段 */
  key: FormatKey;
  /** 按钮文案 */
  label: string;
  /** 按钮图标 */
  icon: LucideIcon;
  /** 触发该格式的快捷键，没有快捷键时省略 */
  shortcut?: {
    /** 按键（小写） */
    key: string;
    /** 是否需要同时按住 Shift */
    shift: boolean;
  };
}[] = [
  { key: "bold", label: "加粗", icon: Bold, shortcut: { key: "b", shift: false } },
  { key: "italic", label: "斜体", icon: Italic, shortcut: { key: "i", shift: false } },
  {
    key: "underlined",
    label: "下划线",
    icon: Underline,
    shortcut: { key: "u", shift: false },
  },
  // Ctrl+X 是剪切，只有加上 Shift 才当作删除线
  {
    key: "strikethrough",
    label: "删除线",
    icon: Strikethrough,
    shortcut: { key: "x", shift: true },
  },
  { key: "obfuscated", label: "乱码", icon: Shuffle },
];

/** 把快捷键定义转成展示文案，如 Ctrl/Cmd+Shift+X */
function shortcutLabel(shortcut: { key: string; shift: boolean }): string {
  return `Ctrl/Cmd+${shortcut.shift ? "Shift+" : ""}${shortcut.key.toUpperCase()}`;
}

interface MotdToolbarProps {
  /** 工具条当前显示的样式 */
  style: CharStyle;
  /** 上色回调 */
  onColor: (color: string) => void;
  /** 切换格式回调 */
  onToggleFormat: (key: FormatKey) => void;
  /** 清除格式回调 */
  onClearStyle: () => void;
  /** 清空内容回调 */
  onReset: () => void;
  /** 按下时的处理，用于阻止按钮抢走编辑区焦点 */
  onMouseDown: (event: MouseEvent<HTMLDivElement>) => void;
}

/** 颜色与格式工具条：色板、取色器、格式开关与清空操作 */
export default function MotdToolbar({
  style,
  onColor,
  onToggleFormat,
  onClearStyle,
  onReset,
  onMouseDown,
}: MotdToolbarProps) {
  return (
    <div
      className="rounded-xl border bg-card/60 p-3 backdrop-blur-sm"
      onMouseDown={onMouseDown}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-xs font-medium text-muted-foreground">颜色</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {COLORS.map((color) => {
            const active = (style.color ?? "#ffffff") === color.hex;
            return (
              <button
                key={color.code}
                type="button"
                aria-label={`${color.name} ${color.hex}`}
                aria-pressed={active}
                title={`${color.name}（${color.hex}）`}
                onClick={() => onColor(color.hex)}
                className={cn(
                  "size-6 rounded-lg ring-1 ring-black/25 transition-transform duration-150",
                  "hover:scale-110 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                  active && "ring-2 ring-primary ring-offset-2 ring-offset-card",
                )}
                style={{ backgroundColor: color.hex }}
              />
            );
          })}

          <label
            title="自定义颜色"
            className={cn(
              "relative flex size-6 cursor-pointer items-center justify-center overflow-hidden rounded-lg",
              "border border-dashed border-muted-foreground/50 text-muted-foreground",
              "transition-colors hover:border-primary hover:text-primary",
            )}
          >
            <Pipette className="size-3.5" />
            <input
              type="color"
              aria-label="自定义颜色"
              value={style.color ?? "#ffffff"}
              onChange={(event) => onColor(event.target.value)}
              className="absolute inset-0 size-full cursor-pointer opacity-0"
            />
          </label>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2">
        <span className="mr-1 text-xs font-medium text-muted-foreground">格式</span>
        {FORMAT_BUTTONS.map((item) => (
          <Button
            key={item.key}
            type="button"
            size="xs"
            variant={style[item.key] ? "secondary" : "ghost"}
            aria-pressed={style[item.key]}
            title={
              item.shortcut
                ? `${item.label}（${shortcutLabel(item.shortcut)}）`
                : item.label
            }
            onClick={() => onToggleFormat(item.key)}
          >
            <item.icon />
            {item.label}
          </Button>
        ))}
        <span aria-hidden className="mx-1 h-4 w-px bg-border" />
        <Button type="button" size="xs" variant="ghost" onClick={onClearStyle}>
          <Eraser />
          清除格式
        </Button>
        <Button
          type="button"
          size="xs"
          variant="ghost"
          className="ml-auto text-muted-foreground"
          onClick={onReset}
        >
          <Trash2 />
          清空
        </Button>
      </div>
    </div>
  );
}
