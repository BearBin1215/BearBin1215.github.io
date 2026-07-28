import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router";
import { Menu, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SocialLinks } from "./social-links";
import ThemeToggle from "./theme-toggle";

/** 顶部横条 */
function Header() {
  /** 移动端菜单展开状态 */
  const [mobileOpen, setMobileOpen] = useState(false);
  /** 汉堡按钮 ref：用于点击外部时排除自身 */
  const triggerRef = useRef<HTMLButtonElement>(null);
  /** 移动端下拉菜单 ref：用于点击外部判断 */
  const menuRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }
    /** 移动端菜单打开时监听点击菜单与按钮以外区域关闭菜单 */
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }
      setMobileOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mobileOpen]);

  /** 根据 NavLink 是否激活返回对应的 className，悬浮或激活时下划线从中心展开 */
  const getNavLinkClassNames = ({ isActive }: { isActive: boolean }) =>
    cn(
      "relative text-lg transition-colors",
      "px-3 md:px-0", // 移动端加上左右边距
      "after:absolute after:-bottom-1 after:left-1/2 after:h-0.5 after:w-full after:origin-center after:-translate-x-1/2 after:scale-x-0 after:bg-primary after:transition-transform after:duration-200",
      isActive
        ? "text-foreground after:scale-x-100"
        : "text-muted-foreground hover:text-foreground hover:after:scale-x-100",
    );

  return (
    <header className="sticky top-0 z-50 w-screen border-b">
      <div
        className={cn(
          "mx-auto flex h-(--header-height) items-center justify-between px-5",
          // 渐进增强：支持 backdrop-filter 时叠加半透明背景 + 模糊，否则降级为更不透明的纯色
          "bg-background/50 backdrop-blur supports-backdrop-filter:bg-background/23",
        )}
      >
        <span className="flex-1 justify-start font-semibold">
          <NavLink to="/">BearBin</NavLink>
        </span>
        {/* 桌面端导航 */}
        <nav className="hidden flex-none gap-6 md:flex">
          <NavLink to="/about" className={getNavLinkClassNames}>
            关于
          </NavLink>
          <NavLink to="/toys" className={getNavLinkClassNames}>
            玩具
          </NavLink>
          <NavLink to="/blog" className={getNavLinkClassNames}>
            杂记
          </NavLink>
        </nav>
        {/* 桌面端社交链接 + 主题切换 */}
        <div className="hidden flex-1 items-center justify-end gap-1 md:flex">
          <SocialLinks />
          <ThemeToggle />
        </div>
        {/* 移动端主题切换 + 汉堡按钮 */}
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            ref={triggerRef}
            type="button"
            aria-label={mobileOpen ? "关闭菜单" : "打开菜单"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* 移动端下拉菜单 */}
      {mobileOpen && (
        <nav
          ref={menuRef}
          className={cn(
            "absolute top-full right-0 left-0 z-50 flex flex-col gap-2 border-b px-5 py-3 md:hidden",
            // 渐进增强：与顶部条相同的半透明 + 模糊降级策略
            "bg-background/70 backdrop-blur supports-backdrop-filter:bg-background/37",
          )}
        >
          <NavLink
            to="/about"
            onClick={() => setMobileOpen(false)}
            className={getNavLinkClassNames}
          >
            关于
          </NavLink>
          <NavLink
            to="/toys"
            onClick={() => setMobileOpen(false)}
            className={getNavLinkClassNames}
          >
            玩具
          </NavLink>
          <NavLink
            to="/blog"
            onClick={() => setMobileOpen(false)}
            className={getNavLinkClassNames}
          >
            杂记
          </NavLink>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
            <SocialLinks showLabel />
          </div>
        </nav>
      )}
    </header>
  );
}

export { Header };
