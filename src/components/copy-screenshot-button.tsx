import { useEffect, useRef, useState, type RefObject } from "react";
import { AlertCircle, Camera, Check, Download, Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** 按钮反馈状态 */
type CopyStatus = "idle" | "copying" | "success" | "downloaded" | "error";

/** 成功/失败反馈停留时间（ms），过后恢复 idle */
const FEEDBACK_RESET_MS = 2000;

/** 截图四周留白（px） */
const SCREENSHOT_PADDING = 32;

interface CopyScreenshotButtonProps {
  /** 截图目标 DOM 节点 */
  targetRef: RefObject<HTMLElement | null>;
  /** 剪贴板不可用时的降级下载文件名 */
  filename: string;
}

/** 将任意 CSS 颜色解析为 rgb，确保 canvas fillStyle 与克隆内联样式都能稳定渲染（兼容 oklch） */
function resolveColor(color: string): string {
  const probe = document.createElement("div");
  probe.style.color = color;
  document.body.append(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved || color;
}

/** 读取当前主题背景色（--background）并解析为 rgb，作为截图底色 */
function getThemeBackground(): string {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--background")
    .trim();
  return resolveColor(raw || "#ffffff");
}

/** 触发浏览器下载，作为剪贴板写入失败时的降级方案 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * 复制截图按钮：点击后将目标节点渲染为 PNG 写入剪贴板。
 * 使用 html-to-image（点击时动态导入）通过 SVG foreignObject 借浏览器原生渲染，
 * 兼容 Tailwind v4 的 oklch 颜色。剪贴板不支持图片时降级为下载。
 * 通过 width/height + 等量 padding 在保留原始内容尺寸的同时为截图加四周留白，避免重排与裁切。
 */
export function CopyScreenshotButton({ targetRef, filename }: CopyScreenshotButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [status, setStatus] = useState<CopyStatus>("idle");

  // 成功/失败状态短暂停留后恢复 idle，便于再次触发
  useEffect(() => {
    if (status === "idle" || status === "copying") {
      return;
    }
    const timer = window.setTimeout(() => setStatus("idle"), FEEDBACK_RESET_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [status]);

  async function handleClick() {
    const node = targetRef.current;
    if (!node || status === "copying") {
      return;
    }
    const buttonNode = buttonRef.current;
    setStatus("copying");

    // 计算截图尺寸：原始内容尺寸 + 四周留白；配合 border-box + 等量 padding 使内容区不变
    const cs = getComputedStyle(node);
    const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const width = node.offsetWidth - padX + SCREENSHOT_PADDING * 2;
    const height = node.offsetHeight - padY + SCREENSHOT_PADDING * 2;

    let blob: Blob;
    try {
      const { toBlob } = await import("html-to-image");
      const result = await toBlob(node, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: getThemeBackground(),
        width,
        height,
        style: { padding: `${SCREENSHOT_PADDING}px` },
        // 排除按钮自身，避免出现在截图中
        filter: (el) =>
          !(buttonNode !== null && (buttonNode === el || buttonNode.contains(el))),
      });
      if (!result) {
        throw new Error("截图生成失败");
      }
      blob = result;
    } catch {
      setStatus("error");
      return;
    }

    try {
      if (
        navigator.clipboard &&
        typeof navigator.clipboard.write === "function" &&
        typeof ClipboardItem !== "undefined"
      ) {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setStatus("success");
      } else {
        throw new Error("剪贴板不支持图片");
      }
    } catch {
      downloadBlob(blob, filename);
      setStatus("downloaded");
    }
  }

  const config = {
    idle: { icon: Camera, label: "复制截图", tone: "" },
    copying: { icon: Loader2, label: "截图中…", tone: "" },
    success: {
      icon: Check,
      label: "已复制到剪贴板",
      tone: "text-emerald-600 dark:text-emerald-400",
    },
    downloaded: {
      icon: Download,
      label: "已下载图片",
      tone: "text-emerald-600 dark:text-emerald-400",
    },
    error: { icon: AlertCircle, label: "复制失败", tone: "text-destructive" },
  }[status];
  const Icon = config.icon;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            ref={buttonRef}
            type="button"
            onClick={handleClick}
            aria-label={config.label}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-sm" }),
              config.tone,
            )}
          >
            <Icon className={cn("size-4", status === "copying" && "animate-spin")} />
          </button>
        }
      />
      <TooltipContent>{config.label}</TooltipContent>
    </Tooltip>
  );
}
