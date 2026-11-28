import "@fontsource/fusion-pixel-12px-proportional-sc/400.css";
import { useState, type KeyboardEvent, type MouseEvent } from "react";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useLocalStorage } from "@/hooks/use-local-storage";
import MotdEditor, { type MotdSelection } from "./editor";
import MotdOutput from "./output";
import MotdToolbar, { FORMAT_BUTTONS } from "./toolbar";
import {
  applyStyle,
  clearStyle,
  DEFAULT_STYLE,
  isMotdDoc,
  LINE_SOFT_LIMIT,
  MOTD_MAX_LINES,
  parseMotd,
  styleAt,
  toggleStyle,
  withFormat,
  type CharStyle,
  type FormatKey,
  type MotdDoc,
} from "./motd";

/** 草稿在 localStorage 中的键名 */
const STORAGE_KEY = "motd-editor:doc";

/** 首次打开时的示例 MOTD */
const DEFAULT_DOC = parseMotd(
  "§6§lBearBin 的服务器 §7[1.21]\n§7生存 / 建筑 / 红石 · §a欢迎加入",
);

export default function MotdEditorPage() {
  useDocumentTitle("MOTD 编辑器");
  const [doc, setDoc] = useLocalStorage<MotdDoc>(STORAGE_KEY, DEFAULT_DOC, isMotdDoc);
  const [selection, setSelection] = useState<MotdSelection>({ start: 0, end: 0 });
  /** 待应用样式，点过颜色或格式后到光标移动前有效；为空时跟随光标处样式 */
  const [pendingStyle, setPendingStyle] = useState<CharStyle | null>(null);

  const hasSelection = selection.end > selection.start;
  /** 光标前一个字符的样式，也是新输入字符实际继承的样式 */
  const caretStyle =
    selection.start > 0 ? styleAt(doc, selection.start - 1) : DEFAULT_STYLE;
  /** 工具条显示的样式：待应用样式优先，其次选区首字符或光标前一个字符 */
  const currentStyle =
    pendingStyle ?? (hasSelection ? styleAt(doc, selection.start) : caretStyle);

  /** 选区或光标变化后丢弃待应用样式，让工具条回到光标处的真实样式 */
  const handleSelectionChange = (next: MotdSelection) => {
    setSelection(next);
    setPendingStyle(null);
  };

  /** 上色：有选区则套用到选区，否则作为后续输入的颜色 */
  const handleColor = (color: string) => {
    if (!hasSelection) {
      setPendingStyle({ ...(pendingStyle ?? caretStyle), color });
      return;
    }
    const next = applyStyle(doc, selection.start, selection.end, { color });
    setDoc(next);
    setPendingStyle(styleAt(next, selection.start));
  };

  /** 切换格式：有选区时按选区内容整体开关，否则只影响后续输入 */
  const handleFormat = (key: FormatKey) => {
    if (!hasSelection) {
      const base = pendingStyle ?? caretStyle;
      setPendingStyle(withFormat(base, key, !base[key]));
      return;
    }
    const next = toggleStyle(doc, selection.start, selection.end, key);
    setDoc(next);
    setPendingStyle(styleAt(next, selection.start));
  };

  /** 清除选区格式；无选区时清除待应用样式 */
  const handleClearStyle = () => {
    if (hasSelection) {
      setDoc(clearStyle(doc, selection.start, selection.end));
    }
    setPendingStyle(DEFAULT_STYLE);
  };

  /** 清空全部内容 */
  const handleReset = () => {
    setDoc({ text: "", styles: [] });
    setSelection({ start: 0, end: 0 });
    setPendingStyle(null);
  };

  /** 编辑区快捷键：Ctrl/Cmd 加 B、I、U，再加 Shift 加 X 切换对应格式 */
  const handleEditorKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(event.ctrlKey || event.metaKey) || event.altKey) {
      return;
    }
    const pressed = event.key.toLowerCase();
    const matched = FORMAT_BUTTONS.find(
      (item) =>
        item.shortcut &&
        item.shortcut.key === pressed &&
        item.shortcut.shift === event.shiftKey,
    );
    if (!matched) {
      return;
    }
    event.preventDefault();
    handleFormat(matched.key);
  };

  /**
   * 按下工具栏时阻止焦点离开编辑区，点完颜色或格式后可以继续输入；
   * 取色输入框需要正常获得焦点才能打开取色器，单独放行
   */
  const handleToolbarMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as Element).closest("input[type='color']")) {
      return;
    }
    event.preventDefault();
  };

  return (
    <div className="max-w-4xl space-y-4">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">MOTD 编辑器</h1>
      </header>

      <MotdToolbar
        style={currentStyle}
        onColor={handleColor}
        onToggleFormat={handleFormat}
        onClearStyle={handleClearStyle}
        onReset={handleReset}
        onMouseDown={handleToolbarMouseDown}
      />

      <MotdEditor
        doc={doc}
        onChange={setDoc}
        onSelectionChange={handleSelectionChange}
        onKeyDown={handleEditorKeyDown}
        pendingStyle={pendingStyle}
      />

      <MotdOutput doc={doc} />

      <section className="rounded-xl border bg-card/60 p-4 backdrop-blur-sm">
        <h2 className="text-sm font-medium">使用说明</h2>
        <ul className="mt-2 space-y-1.5 pl-1 text-xs text-muted-foreground">
          <li>编辑区使用网页字体，游戏内的字体与换行可能略有差异。</li>
          <li>
            选中文字后可以用 Ctrl/Cmd 加 B、I、U 切换格式，加 Shift 再加 X 切换删除线。
          </li>
          <li>
            {`MOTD 只显示 ${MOTD_MAX_LINES} 行，每行上限约 ${LINE_SOFT_LIMIT} 字符。`}
          </li>
          <li>
            {
              "server.properties 只有原版 1.16 及以上版本识别十六进制颜色，修改后需要重启服务器。"
            }
          </li>
        </ul>
      </section>
    </div>
  );
}
