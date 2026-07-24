import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ReactNode } from "react";
import { ExternalLink } from "@/components/external-link";
import coverUrl from "@/assets/music/necromance-jacket.jpg";
import songUrl from "@/assets/music/春宵一刻.m4a";

/** 音轨 */
interface Track {
  /** 歌曲名 */
  name: string;
  /** 歌手名 */
  artist: string;
  /** 专辑名 */
  album: string;
  /** 封面图 URL */
  cover: string;
  /** 音频文件 URL */
  src: string;
  /** 歌曲详情页链接（可选） */
  songUrl?: string;
  /** 专辑详情页链接（可选） */
  albumUrl?: string;
  /** 一句话评价（可选），支持 JSX 以嵌入链接等富文本 */
  comment?: ReactNode;
}

/** 推荐曲目列表 */
const tracks: Track[] = [
  {
    name: "春宵一刻",
    artist: "Isle & Notes",
    album: "Necromance ～散りゆく桜花と屍者の国～",
    cover: coverUrl,
    src: songUrl,
    songUrl: "https://music.163.com/song?id=3370855400",
    albumUrl: "https://music.163.com/album?id=371363015",
    comment: (
      <>
        26春
        <ExternalLink
          href="https://zh.moegirl.org.cn/Music_Media-Mix_Market"
          className="text-inherit underline decoration-dotted underline-offset-2 transition-colors hover:decoration-foreground"
        >
          M3
        </ExternalLink>
        最佳！两个月爽听600遍
      </>
    ),
  },
];

/** localStorage 中保存的音量键名 */
const STORAGE_KEY = "music-player:volume";

/** 音乐播放器状态 */
interface MusicPlayerState {
  /** 曲目列表 */
  tracks: Track[];
  /** 当前曲目索引 */
  currentIndex: number;
  /** 是否正在播放 */
  isPlaying: boolean;
  /** 当前播放时间（秒） */
  currentTime: number;
  /** 总时长（秒） */
  duration: number;
  /** 音量（0-1），通过 localStorage 持久化 */
  volume: number;
  /** 是否静音 */
  muted: boolean;
  /** 播放 */
  play: () => void;
  /** 暂停 */
  pause: () => void;
  /** 切换播放/暂停 */
  toggle: () => void;
  /** 下一首 */
  next: () => void;
  /** 上一首 */
  prev: () => void;
  /** 跳转到指定时间（秒） */
  seek: (time: number) => void;
  /** 设置音量（0-1），音量大于 0 时自动取消静音 */
  setVolume: (v: number) => void;
  /** 切换静音 */
  toggleMute: () => void;
  /** AudioController 专用：上报当前播放时间 */
  reportTimeUpdate: (time: number) => void;
  /** AudioController 专用：上报总时长 */
  reportDuration: (duration: number) => void;
  /** AudioController 专用：当前曲目播放结束，自动切到下一首（仅多曲目时） */
  reportEnded: () => void;
}

export const useMusicPlayerStore = create<MusicPlayerState>()(
  persist(
    (set, get) => ({
      tracks,
      currentIndex: 0,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      muted: false,
      play: () => set({ isPlaying: true }),
      pause: () => set({ isPlaying: false }),
      toggle: () => set((s) => ({ isPlaying: !s.isPlaying })),
      next: () =>
        set((s) => ({
          currentIndex: (s.currentIndex + 1) % s.tracks.length,
          currentTime: 0,
        })),
      prev: () =>
        set((s) => ({
          currentIndex: (s.currentIndex - 1 + s.tracks.length) % s.tracks.length,
          currentTime: 0,
        })),
      seek: (time) => set({ currentTime: time }),
      setVolume: (v) => set((s) => ({ volume: v, muted: v > 0 ? false : s.muted })),
      toggleMute: () => set((s) => ({ muted: !s.muted })),
      reportTimeUpdate: (time) => set({ currentTime: time }),
      reportDuration: (duration) => set({ duration }),
      reportEnded: () => {
        const state = get();
        if (state.tracks.length > 1) {
          set({
            currentIndex: (state.currentIndex + 1) % state.tracks.length,
            currentTime: 0,
          });
        } else {
          set({ isPlaying: false, currentTime: 0 });
        }
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // 仅持久化音量，其余状态每次进入页面重置
      partialize: (state) => ({ volume: state.volume }),
    },
  ),
);

/** 当前播放曲目 */
function useCurrentTrack(): Track {
  return useMusicPlayerStore((s) => s.tracks[s.currentIndex]!);
}

export { useCurrentTrack };
