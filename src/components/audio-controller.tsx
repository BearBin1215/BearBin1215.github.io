import { useEffect, useRef } from "react";
import { useMusicPlayerStore, useCurrentTrack } from "@/stores/music-player";

/**
 * 全局音频控制器：在布局层挂载唯一一个 <audio> 元素。
 * - 将 store 中的 isPlaying/currentIndex/volume/muted 同步到 audio 元素
 * - 将 audio 事件（timeupdate、ended）回传到 store
 * - duration 由 Track 数据硬编码，不依赖 loadedmetadata
 */
function AudioController() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const isPlaying = useMusicPlayerStore((s) => s.isPlaying);
  const currentIndex = useMusicPlayerStore((s) => s.currentIndex);
  const currentTime = useMusicPlayerStore((s) => s.currentTime);
  const volume = useMusicPlayerStore((s) => s.volume);
  const muted = useMusicPlayerStore((s) => s.muted);
  const reportTimeUpdate = useMusicPlayerStore((s) => s.reportTimeUpdate);
  const reportEnded = useMusicPlayerStore((s) => s.reportEnded);

  const track = useCurrentTrack();
  const effectiveVolume = muted ? 0 : volume;

  // 播放/暂停控制
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    if (isPlaying) {
      audio.play().catch(() => {
        // 自动播放策略拦截等情况，回退到暂停态
        useMusicPlayerStore.getState().pause();
      });
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // 切换曲目：重置进度，若仍处于播放态则继续播放新曲目
  // 通过 getState 读取 isPlaying，避免将其加入依赖导致暂停/播放时也触发重置
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.currentTime = 0;
    if (useMusicPlayerStore.getState().isPlaying) {
      audio.play().catch(() => {
        useMusicPlayerStore.getState().pause();
      });
    }
  }, [currentIndex]);

  // 同步音量/静音到 audio 元素
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.volume = effectiveVolume;
  }, [effectiveVolume]);

  // 响应用户拖动进度条触发的 seek
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    // 仅当差距 > 0.1 秒时才写入，避免 timeupdate 引起的微小更新造成循环写入
    if (Math.abs(audio.currentTime - currentTime) > 0.1) {
      audio.currentTime = currentTime;
    }
  }, [currentTime]);

  return (
    <audio
      ref={audioRef}
      src={track.src}
      preload="metadata"
      onTimeUpdate={(e) => reportTimeUpdate(e.currentTarget.currentTime)}
      onEnded={reportEnded}
      hidden
    />
  );
}

export { AudioController };
