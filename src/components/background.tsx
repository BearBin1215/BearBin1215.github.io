import { useEffect, useRef } from "react";
import { backgrounds, useBackgroundStore } from "@/stores/background";

/** 轮播间隔 */
const INTERVAL = 5 * 60 * 1000;

/** 淡入淡出持续时间 */
const FADE_DURATION = 2000;

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
 * 全局背景层
 * 包含两部分：
 * 1. 背景图片轮播层：固定定位铺满视口，通过 Web Animations API 交叉淡入淡出切换图片
 *    使用 WAAPI 而非 CSS transition，避免切换主题导致全局样式重算打断过渡
 *    起始图片由 localStorage 记忆，每次进入站点从下一张开始，避免短暂访客总看到同一张
 *    当前显示索引同步至 zustand store，供页脚高亮对应来源链接
 * 2. 全局覆层：位于背景图层之上，为所有内容提供统一的半透明背景色
 */
function Background() {
  const imgRef = useRef<(HTMLImageElement | null)[]>([]);
  /**
   * 初始索引仅读取一次：后续切换由内部定时器驱动并通过 store 同步给页脚，
   * 此处不订阅 store 变化，避免每次切换触发本组件重渲染与定时器重建。
   */
  const initialIndex = useRef(useBackgroundStore.getState().currentIndex).current;
  const setCurrentIndex = useBackgroundStore((s) => s.setCurrentIndex);

  useEffect(() => {
    let current = initialIndex;

    // 入场淡入：起始图片从 opacity 0 平滑淡入到 1，避免突兀
    fade(imgRef.current[current], 0, 1);

    const timer = setInterval(() => {
      const next = (current + 1) % backgrounds.length;
      fade(imgRef.current[current], 1, 0);
      fade(imgRef.current[next], 0, 1);

      current = next;
      setCurrentIndex(current);
    }, INTERVAL);
    return () => clearInterval(timer);
  }, [initialIndex, setCurrentIndex]);

  return (
    <>
      <div
        className="pointer-events-none fixed top-0 bottom-0 left-0 -z-10 w-screen"
        aria-hidden="true"
      >
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
      <div
        className="fixed top-0 bottom-0 left-0 -z-10 w-screen bg-background/83"
        aria-hidden="true"
      />
    </>
  );
}

export { Background };
