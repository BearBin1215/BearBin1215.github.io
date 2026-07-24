import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** 系统深色模式媒体查询，模块级常量避免重复创建 */
const darkMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

/** 订阅系统深色模式偏好 */
function usePrefersDark() {
  return useSyncExternalStore(
    (onChange) => {
      darkMediaQuery.addEventListener("change", onChange);
      return () => darkMediaQuery.removeEventListener("change", onChange);
    },
    () => darkMediaQuery.matches,
  );
}

/** 深色/浅色主题切换按钮 */
export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const systemDark = usePrefersDark();
  const isDark = theme === "system" ? systemDark : theme === "dark";

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label="切换主题"
          >
            {isDark ? <Sun /> : <Moon />}
          </Button>
        }
      />
      <TooltipContent>切换{isDark ? "浅色" : "深色"}主题</TooltipContent>
    </Tooltip>
  );
}
