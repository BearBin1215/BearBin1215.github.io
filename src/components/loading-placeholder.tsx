import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface LoadingPlaceholderProps {
  /** Spinner 尺寸类（如 "size-8"），默认 "size-8" */
  spinnerSize?: string;
  /** 容器额外类（如 "h-40"、"py-8"），默认 "h-40" */
  className?: string;
}

/** 加载占位：水平垂直居中的 Spinner，统一各处加载态外观 */
function LoadingPlaceholder({
  spinnerSize = "size-8",
  className = "h-40",
}: LoadingPlaceholderProps) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Spinner className={spinnerSize} />
    </div>
  );
}

export { LoadingPlaceholder };
