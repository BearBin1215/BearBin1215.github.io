import { create } from "zustand";
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
    position: "33% 45%",
    source: "https://pixiv.net/artworks/147092236",
  },
  {
    src: bg3,
    position: "64% 45%",
    source: "https://x.com/roro046/status/2001238104209076417",
  },
];

/** localStorage 存储上次显示图片索引的键名 */
const STORAGE_KEY = "bg-index";

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

/** 持久化当前显示的图片索引，失败时静默降级 */
function saveIndex(index: number) {
  try {
    localStorage.setItem(STORAGE_KEY, String(index));
  } catch {
    // 写入失败时静默降级
  }
}

/** 背景图全局状态：Background 轮播时写入当前索引，Footer 据此高亮对应来源链接 */
interface BackgroundState {
  /** 当前显示的背景图索引 */
  currentIndex: number;
  /** 更新当前背景图索引并持久化 */
  setCurrentIndex: (index: number) => void;
}

const initialIndex = getInitialIndex();
saveIndex(initialIndex);

export const useBackgroundStore = create<BackgroundState>((set) => ({
  currentIndex: initialIndex,
  setCurrentIndex: (index) => {
    saveIndex(index);
    set({ currentIndex: index });
  },
}));

export { backgrounds };
export type { BackgroundItem };
