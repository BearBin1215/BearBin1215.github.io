import { useNavigation } from "react-router";
import { cn } from "cn";

/**
 * 顶部导航进度条
 * 在路由导航（含 lazy chunk 加载）期间显示 indeterminate 进度条，
 * 路由级 lazy 加载由 router 在渲染前 await，不触发 React Suspense，故需独立反馈。
 */
function NavigationProgress() {
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-60 h-0.5 overflow-hidden",
        "transition-opacity duration-300",
        // 显示延迟 120ms 避免瞬时导航闪烁，隐藏时不延迟
        isLoading ? "opacity-100 delay-[120ms]" : "opacity-0",
      )}
    >
      <div className="h-full w-1/3 animate-navigation-progress bg-primary" />
    </div>
  );
}

export { NavigationProgress };
