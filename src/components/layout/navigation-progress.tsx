import { useEffect, useState } from "react";
import { useNavigation } from "react-router";
import { cn } from "@/lib/utils";

/**
 * 顶部导航进度条
 * 在路由导航（含 lazy chunk 加载）期间显示 indeterminate 进度条，
 * 路由级 lazy 加载由 router 在渲染前 await，不触发 React Suspense，故需独立反馈。
 */
function NavigationProgress() {
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const [visible, setVisible] = useState(false);

  // 延迟显示，避免瞬时导航（lazy chunk 已缓存）造成进度条闪烁
  useEffect(() => {
    if (!isLoading) {
      setVisible(false);
      return;
    }
    const timer = setTimeout(() => setVisible(true), 120);
    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-60 h-0.5 overflow-hidden",
        "transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      <div className="h-full w-1/3 animate-navigation-progress bg-primary" />
    </div>
  );
}

export { NavigationProgress };
