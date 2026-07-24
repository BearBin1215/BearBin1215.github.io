import { useEffect, useRef } from "react";
import bg1 from "@/assets/backgrounds/background_1.jpg";
import bg2 from "@/assets/backgrounds/background_2.jpg";
import bg3 from "@/assets/backgrounds/background_3.jpg";

/** 单张背景图片配置 */
type BackgroundItem = {
  /** 图片资源地址 */
  src: string;
  /** object-position 值，控制图片在容器中的对齐位置，默认 "center" */
  position?: string;
  /** 图片原作来源链接，页脚展示给用户 */
  source?: string;
};

/** 背景图片列表：图片资源与原作来源统一在此维护 */
const backgrounds: BackgroundItem[] = [
  {
    src: bg1,
    position: "30% 40%",
    source: "https://pixiv.net/artworks/136849830",
  },
  {
    src: bg2,
    position: "64% 45%",
    source: "https://x.com/roro046/status/1983491023604212009",
  },
  {
    src: bg3,
    position: "33% 45%",
    source: "https://pixiv.net/artworks/147092236",
  },
];

/** 导出背景图列表，供页脚渲染源链接使用 */
export { backgrounds };

/** 轮播间隔 */
const INTERVAL = 5 * 60 * 1000;

/** 淡入淡出持续时间 */
const FADE_DURATION = 2000;

/** localStorage 存储上次显示图片索引的键名 */
const STORAGE_KEY = "bg-index";

/**
 * 使用 Web Animations API 在指定图片上做 opacity 过渡。
 * 使用 WAAPI 而非 CSS transition，避免切换主题导致全局样式重算打断过渡。
 */
function fade(img: HTMLImageElement | null | undefined, from: number, to: number) {
  if (!img) {
    return;
  }
  img.animate([{ opacity: from }, { opacity: to }], {
    duration: FADE_DURATION,
    easing: "ease-in-out",
    fill: "forwards",
  });
}

/**
 * 读取上次显示的图片索引，返回下次进入应显示的索引（即下一张）。
 * 隐私模式或 localStorage 不可用时降级为 0。
 */
function getInitialIndex(): number {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      const n = Number.parseInt(saved, 10);
      if (Number.isInteger(n) && n >= 0 && n < backgrounds.length) {
        return (n + 1) % backgrounds.length;
      }
    }
  } catch {
    // localStorage 不可用，降级为 0
  }
  return 0;
}

/**
 * 全局背景层
 * 包含两部分：
 * 1. 背景图片轮播层：固定定位铺满视口，通过 Web Animations API 交叉淡入淡出切换图片
 *    使用 WAAPI 而非 CSS transition，避免切换主题导致全局样式重算打断过渡
 *    起始图片由 localStorage 记忆，每次进入站点从下一张开始，避免短暂访客总看到同一张
 * 2. 全局覆层：位于背景图层之上，为所有内容提供统一的半透明背景色
 */
function Background() {
  const imgRef = useRef<(HTMLImageElement | null)[]>([]);
  const initialIndex = useRef(getInitialIndex()).current;

  useEffect(() => {
    let current = initialIndex;

    const saveIndex = (i: number) => {
      try {
        localStorage.setItem(STORAGE_KEY, String(i));
      } catch {
        // 写入失败时静默降级
      }
    };

    saveIndex(current);

    // 入场淡入：起始图片从 opacity 0 平滑淡入到 1，避免突兀
    fade(imgRef.current[current], 0, 1);

    const timer = setInterval(() => {
      const next = (current + 1) % backgrounds.length;
      fade(imgRef.current[current], 1, 0);
      fade(imgRef.current[next], 0, 1);

      current = next;
      saveIndex(current);
    }, INTERVAL);
    return () => clearInterval(timer);
  }, [initialIndex]);

  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        {backgrounds.map((item, i) => (
          <img
            key={item.src}
            ref={(el) => {
              imgRef.current[i] = el;
            }}
            src={item.src}
            alt=""
            loading={i === initialIndex ? "eager" : "lazy"}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ opacity: 0, objectPosition: item.position ?? "center" }}
          />
        ))}
      </div>
      {/* 背景图层上的全局覆层，为所有内容提供半透明背景色 */}
      <div className="fixed inset-0 -z-10 bg-background/94" aria-hidden="true" />
    </>
  );
}

export { Background };
