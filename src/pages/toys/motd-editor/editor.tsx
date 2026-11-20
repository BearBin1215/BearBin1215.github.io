import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type CompositionEvent,
  type KeyboardEvent,
  type SyntheticEvent,
  type UIEvent,
} from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "cn";
import {
  charCountByLine,
  clipLines,
  LINE_SOFT_LIMIT,
  MOTD_MAX_LINES,
  parseMotd,
  remapStyles,
  stripFormatCodes,
  toCodePointIndex,
  toSegments,
  type CharStyle,
  type MotdDoc,
} from "./motd";
import { segmentStyle } from "./text-style";

/**
 * 镜像层与 textarea 必须完全一致的文字度量：字体、字号、行高与内边距。
 * 任一处改动都要同步，否则两层换行位置不同、光标会错位。
 */
const TEXT_METRICS = "p-3 font-pixel text-xs leading-4.5 md:text-lg md:leading-6.75";

/** 编辑器选区，使用与文档一致的码点下标 */
export interface MotdSelection {
  /** 起始码点下标（含） */
  start: number;
  /** 结束码点下标（不含） */
  end: number;
}

interface MotdEditorProps {
  /** 当前文档 */
  doc: MotdDoc;
  /** 文档变化回调 */
  onChange: (doc: MotdDoc) => void;
  /** 选区变化回调 */
  onSelectionChange: (selection: MotdSelection) => void;
  /** 键盘事件回调，用于处理 Ctrl+B 等快捷键 */
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  /** 新输入字符使用的样式（工具条里待应用的颜色或格式），为 null 时继承前一个字符 */
  pendingStyle: CharStyle | null;
}

/**
 * 判断粘贴内容是否带有格式码（§、& 代码、\u00A7 转义或 motd= 前缀）
 * & 前缀要求出现在行首或空白之后，避免把 `?a=1&d=2` 这类普通文本当成 MOTD
 * 不属于以上情况时返回 false，由 textarea 按默认行为粘贴
 */
function looksLikeMotd(text: string): boolean {
  return /§|\\u00a7|^\s*motd\s*=|&#[0-9a-f]{6}|(?:^|\s)&[0-9a-fk-orx]/i.test(text);
}

/**
 * 镜像层编辑器：把文字设为透明的 textarea 覆盖在样式化文本之上，
 * 两层共用字体、字号、行高与内边距，因此光标与换行自然对齐。
 * 文本改动通过 remapStyles 重新分配样式，输入法组合输入期间只同步文本。
 */
export default function MotdEditor({
  doc,
  onChange,
  onSelectionChange,
  onKeyDown,
  pendingStyle,
}: MotdEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const composingRef = useRef(false);
  /** 程序化替换文本后要恢复的光标位置（UTF-16 下标） */
  const pendingCaretRef = useRef<number | null>(null);
  const [truncated, setTruncated] = useState(false);

  // 粘贴等程序化替换完成后，把光标移到新内容末尾
  useEffect(() => {
    const caret = pendingCaretRef.current;
    if (caret === null) {
      return;
    }
    pendingCaretRef.current = null;
    const element = textareaRef.current;
    if (!element) {
      return;
    }
    element.focus();
    element.setSelectionRange(caret, caret);
  }, [doc]);

  /** 镜像层片段，换行符保留在片段内 */
  const segments = useMemo(() => toSegments(doc), [doc]);
  /** 每行字符数，用于计数提示 */
  const counts = useMemo(() => charCountByLine(doc.text), [doc.text]);
  /** 计数行固定显示两条行槽，还没按 Enter 时第二行按 0 计 */
  const lineCounts = counts.length >= 2 ? counts : [counts[0] ?? 0, 0];

  /** 把 textarea 的 UTF-16 选区换算成码点下标后通知父组件 */
  const reportSelection = (text: string, start: number, end: number) => {
    onSelectionChange({
      start: toCodePointIndex(text, Math.min(start, text.length)),
      end: toCodePointIndex(text, Math.min(end, text.length)),
    });
  };

  /** 提交文本改动：去掉误输入的格式码、限制到两行、重新分配样式并同步选区 */
  const commitText = (event: SyntheticEvent<HTMLTextAreaElement>) => {
    const element = event.currentTarget;
    const next = remapStyles(doc, stripFormatCodes(element.value), pendingStyle);
    const clipped = clipLines(next, MOTD_MAX_LINES);

    setTruncated(clipped !== next);
    if (clipped.text !== doc.text) {
      onChange(clipped);
    }
    reportSelection(clipped.text, element.selectionStart, element.selectionEnd);
  };

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (composingRef.current) {
      // 组合输入期间只同步文本，样式在 compositionend 后统一重新分配，
      // 避免拼音输入过程中的文字与最终文本不一致导致样式错位
      const value = stripFormatCodes(event.currentTarget.value);
      if (value !== doc.text) {
        onChange(remapStyles(doc, value, pendingStyle));
      }
      return;
    }
    commitText(event);
  };

  const handleCompositionEnd = (event: CompositionEvent<HTMLTextAreaElement>) => {
    composingRef.current = false;
    commitText(event);
  };

  /** 粘贴带格式码的内容时解析并回填，普通文本按默认方式粘贴 */
  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const text = event.clipboardData.getData("text/plain");
    if (!looksLikeMotd(text)) {
      return;
    }
    event.preventDefault();
    const parsed = parseMotd(text);
    const clipped = clipLines(parsed, MOTD_MAX_LINES);
    const end = Array.from(clipped.text).length;
    setTruncated(clipped !== parsed);
    pendingCaretRef.current = clipped.text.length;
    onChange(clipped);
    onSelectionChange({ start: end, end });
  };

  /** 文本溢出时同步镜像层滚动位置，保证两层始终重合 */
  const syncScroll = (event: UIEvent<HTMLTextAreaElement>) => {
    const mirror = mirrorRef.current;
    if (!mirror) {
      return;
    }
    mirror.scrollTop = event.currentTarget.scrollTop;
    mirror.scrollLeft = event.currentTarget.scrollLeft;
  };

  const handleSelect = () => {
    const element = textareaRef.current;
    if (!element) {
      return;
    }
    reportSelection(element.value, element.selectionStart, element.selectionEnd);
  };

  const overflowing = lineCounts.some((count) => count > LINE_SOFT_LIMIT);

  return (
    <div>
      {/*
        半透明黑底 + 压暗背景：游戏内的 MOTD 绘制在压暗、模糊的世界背景之上，
        这样既透出网页背景，也不会因背景图过亮而影响判断颜色
      */}
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-white/10",
          "bg-black/45 backdrop-blur-md backdrop-brightness-50",
          "transition-[border-color,box-shadow] focus-within:border-primary/50",
          "focus-within:ring-2 focus-within:ring-primary/20",
        )}
      >
        {/* 镜像层：按最终样式渲染，键盘与鼠标事件全部交给上方的 textarea */}
        <div
          ref={mirrorRef}
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 overflow-hidden",
            TEXT_METRICS,
            "wrap-break-word whitespace-pre-wrap",
          )}
        >
          {segments.map((segment, index) => (
            <span
              key={index}
              style={segmentStyle(segment.style)}
              className={
                segment.style.obfuscated
                  ? "underline decoration-white/40 decoration-dotted underline-offset-4"
                  : undefined
              }
            >
              {segment.text}
            </span>
          ))}
          {doc.text.length === 0 && <span className="text-white/25">输入两行 MOTD…</span>}
        </div>

        <Textarea
          ref={textareaRef}
          value={doc.text}
          aria-label="MOTD 内容"
          spellCheck={false}
          autoComplete="off"
          className={cn(
            // 高度正好两行：移动端 2 × 18px + 24px = 60px，桌面端 2 × 27px + 24px = 78px
            // 调整 MOTD_MAX_LINES 或 TEXT_METRICS 的行高时，这两个值要一起改
            "relative block min-h-15 resize-none border-0 bg-transparent md:min-h-19.5",
            TEXT_METRICS,
            "text-transparent caret-primary shadow-none",
            "outline-none selection:bg-primary/35 focus-visible:border-0",
          )}
          style={{ WebkitTextFillColor: "transparent" }}
          onChange={handleChange}
          onSelect={handleSelect}
          onScroll={syncScroll}
          onPaste={handlePaste}
          onKeyDown={onKeyDown}
          onCompositionStart={() => {
            composingRef.current = true;
          }}
          onCompositionEnd={handleCompositionEnd}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="tabular-nums">
          {lineCounts
            .map((count, index) => `第 ${index + 1} 行 ${count}/${LINE_SOFT_LIMIT}`)
            .join("　·　")}
        </span>
        {truncated ? (
          <span className="text-destructive">
            {`MOTD 最多 ${MOTD_MAX_LINES} 行，超出的内容已截断`}
          </span>
        ) : (
          overflowing && (
            <span className="text-amber-600 dark:text-amber-400">
              超出约 {LINE_SOFT_LIMIT} 字符，游戏内可能换行
            </span>
          )
        )}
      </div>
    </div>
  );
}
