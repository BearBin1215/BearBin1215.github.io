import { useState, useMemo, useEffect, useCallback, use, createContext } from "react";

type Theme = "dark" | "light" | "system";
type ResolvedTheme = "dark" | "light";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  disableTransitionOnChange?: boolean;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)";
const THEME_VALUES: Theme[] = ["dark", "light", "system"];

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

function isTheme(value: string | null): value is Theme {
  if (value === null) {
    return false;
  }

  return THEME_VALUES.includes(value as Theme);
}

function getSystemTheme(): ResolvedTheme {
  if (window.matchMedia(COLOR_SCHEME_QUERY).matches) {
    return "dark";
  }

  return "light";
}

function disableTransitionsTemporarily() {
  const style = document.createElement("style");
  style.appendChild(
    document.createTextNode(
      "*,*::before,*::after{-webkit-transition:none!important;transition:none!important}",
    ),
  );
  document.head.appendChild(style);

  return () => {
    // 强制浏览器执行一次样式重排，确保 transition:none 规则已生效
    window.getComputedStyle(document.body);
    // 双重 rAF 等待两帧，保证下一帧恢复时不会带上被禁用的过渡
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        style.remove();
      });
    });
  };
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
  disableTransitionOnChange = true,
  ...props
}: ThemeProviderProps) {
  const [themeState, setThemeState] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem(storageKey);
    if (isTheme(storedTheme)) {
      return storedTheme;
    }

    return defaultTheme;
  });

  const setTheme = useCallback(
    (nextTheme: Theme) => {
      try {
        localStorage.setItem(storageKey, nextTheme);
      } catch {
        // 隐私模式或磁盘满时静默降级，仍更新内存状态
      }
      setThemeState(nextTheme);
    },
    [storageKey],
  );

  const applyTheme = useCallback(
    (nextTheme: Theme) => {
      const root = document.documentElement;
      const resolvedTheme = nextTheme === "system" ? getSystemTheme() : nextTheme;
      const restoreTransitions = disableTransitionOnChange
        ? disableTransitionsTemporarily()
        : null;

      root.classList.remove("light", "dark");
      root.classList.add(resolvedTheme);

      if (restoreTransitions) {
        restoreTransitions();
      }
    },
    [disableTransitionOnChange],
  );

  useEffect(() => {
    applyTheme(themeState);

    if (themeState !== "system") {
      return undefined;
    }

    const mediaQuery = window.matchMedia(COLOR_SCHEME_QUERY);
    const handleChange = () => {
      applyTheme("system");
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [themeState, applyTheme]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.storageArea !== localStorage) {
        return;
      }

      if (event.key !== storageKey) {
        return;
      }

      if (isTheme(event.newValue)) {
        setThemeState(event.newValue);
        return;
      }

      setThemeState(defaultTheme);
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [defaultTheme, storageKey]);

  const value = useMemo(
    () => ({
      theme: themeState,
      setTheme,
    }),
    [themeState, setTheme],
  );

  return (
    <ThemeProviderContext {...props} value={value}>
      {children}
    </ThemeProviderContext>
  );
}

export const useTheme = () => {
  const context = use(ThemeProviderContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};
