import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** 触发显示的滚动阈值（px） */
const VISIBILITY_THRESHOLD = 400;

/**
 * 返回顶部浮动按钮：页面滚动超过阈值后淡入出现，点击平滑回到顶部。
 * 挂载在全局布局，所有长页面（尤其博客正文）可用。
 */
function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > VISIBILITY_THRESHOLD);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      aria-label="返回顶部"
      className={cn(
        buttonVariants({ variant: "outline", size: "icon" }),
        "fixed right-6 bottom-6 z-40 rounded-full bg-background/80 shadow-lg backdrop-blur transition-all duration-200 hover:bg-background/95",
        visible ? "opacity-100" : "pointer-events-none translate-y-2 opacity-0",
      )}
    >
      <ArrowUp className="size-5" />
    </button>
  );
}

export { BackToTop };
