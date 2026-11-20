import { useMemo, useState } from "react";
import { Check, CircleAlert, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCopyToClipboard, type CopyStatus } from "@/hooks/use-copy-to-clipboard";
import { cn } from "cn";
import { toAmpersand, toJSON, toLegacy, toProperties, type MotdDoc } from "./motd";

/** 输出格式标识 */
type FormatId = "legacy" | "amp" | "properties" | "json";

/** 复制按钮在各状态下的文案 */
const COPY_LABELS: Record<CopyStatus, string> = {
  idle: "复制",
  success: "已复制",
  error: "复制失败",
};

/** 复制按钮在各状态下的图标 */
function CopyStateIcon({ state }: { state: CopyStatus }) {
  if (state === "success") {
    return <Check className="text-emerald-600 dark:text-emerald-400" />;
  }
  if (state === "error") {
    return <CircleAlert className="text-destructive" />;
  }
  return <Copy />;
}

/** 输出格式定义 */
interface OutputFormat {
  /** 切换按钮文案 */
  label: string;
  /** 适用场景说明 */
  hint: string;
  /** 由文档生成该格式文本 */
  build: (doc: MotdDoc) => string;
}

/** 输出格式表，键即格式标识，声明顺序即按钮顺序 */
const FORMATS: Record<FormatId, OutputFormat> = {
  legacy: {
    label: "§ 代码",
    hint: "用于插件配置、聊天栏等支持原版格式码的地方。",
    build: toLegacy,
  },
  amp: {
    label: "& 代码",
    hint: "只有插件会把 & 前缀当作格式码，原版服务端不识别。",
    build: toAmpersand,
  },
  properties: {
    label: "server.properties",
    hint: "可直接替换 motd= 整行（§ 已转义为 \\u00A7），修改后重启服务器才会生效。",
    build: toProperties,
  },
  json: {
    label: "JSON 组件",
    hint: "用于代理端、MiniMOTD 等接收 JSON 文本组件的配置。",
    build: (doc) => toJSON(doc, 2),
  },
};

/** 按声明顺序排列的格式标识 */
const FORMAT_IDS = Object.keys(FORMATS) as FormatId[];

interface MotdOutputProps {
  /** 当前文档 */
  doc: MotdDoc;
}

/** 输出面板：格式切换、只读文本块与复制反馈 */
export default function MotdOutput({ doc }: MotdOutputProps) {
  const [activeId, setActiveId] = useState<FormatId>("legacy");
  const { status: copyState, copy, reset: resetCopy } = useCopyToClipboard();
  const active = FORMATS[activeId];
  const text = useMemo(() => active.build(doc), [active, doc]);

  return (
    <div className="overflow-hidden rounded-xl border bg-card/60">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b p-2">
        <div className="flex flex-wrap gap-1" role="group" aria-label="输出格式">
          {FORMAT_IDS.map((id) => {
            const isActive = id === activeId;
            return (
              <Button
                key={id}
                type="button"
                size="xs"
                variant={isActive ? "secondary" : "ghost"}
                aria-pressed={isActive}
                className={cn(isActive && "ring-1 ring-border")}
                onClick={() => {
                  setActiveId(id);
                  resetCopy();
                }}
              >
                {FORMATS[id].label}
              </Button>
            );
          })}
        </div>

        <Button
          type="button"
          size="xs"
          variant="outline"
          className="ml-auto"
          onClick={() => copy(text)}
          aria-label={copyState === "idle" ? "复制当前格式" : COPY_LABELS[copyState]}
        >
          <CopyStateIcon state={copyState} />
          {COPY_LABELS[copyState]}
        </Button>
      </div>

      <pre className="max-h-56 overflow-auto bg-muted/40 p-3 font-mono text-xs leading-6 whitespace-pre">
        {text || "（空）"}
      </pre>

      <p className="border-t px-3 py-2 text-xs text-muted-foreground">{active.hint}</p>
    </div>
  );
}
