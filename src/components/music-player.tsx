import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { ExternalLink } from "@/components/external-link";
import { SectionTitle } from "@/components/section-title";
import { buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useMusicPlayerStore, useCurrentTrack } from "@/stores/music-player";
import { cn } from "@/lib/utils";

/** 格式化时间为 mm:ss */
function formatTime(seconds: number): string {
  if (Number.isNaN(seconds) || !Number.isFinite(seconds)) {
    return "0:00";
  }
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface MarqueeTextProps {
  /** 文本内容 */
  children: ReactNode;
  /** 容器额外 className */
  className?: string;
}

/**
 * 溢出时左右自动滚动的文本。
 * 通过对比内容宽度和容器宽度判断是否溢出，
 * 溢出时计算需要滚动的距离并通过 CSS 变量 --marquee-distance 传入动画，
 * 配合 animate-marquee 实现「停留-左滚-停留-右滚」循环。
 */
function MarqueeText({ children, className }: MarqueeTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) {
      return;
    }
    const check = () => {
      // 初始化与尺寸变化时都需要同步检测结果以决定是否启用滚动
      setOverflowing(inner.scrollWidth > container.clientWidth + 1);
      setDistance(Math.max(0, inner.scrollWidth - container.clientWidth));
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(container);
    ro.observe(inner);
    return () => {
      ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("overflow-hidden", !overflowing && "truncate", className)}
    >
      <span
        ref={innerRef}
        className={cn("inline-block whitespace-nowrap", overflowing && "animate-marquee")}
        style={
          overflowing
            ? ({ "--marquee-distance": `-${distance}px` } as CSSProperties)
            : undefined
        }
      >
        {children}
      </span>
    </div>
  );
}

/**
 * 横向迷你音乐播放器：
 * 顶部「推荐音乐」标题 + 共用音量控制；封面带悬浮播放按钮；右侧歌曲信息 + 进度条。
 * 状态来自全局 zustand store（@/stores/music-player），audio 元素由 AudioController 全局维护。
 * 同一 store 可在首页与杂记页等多个位置共享同一播放状态。
 */
function MusicPlayer() {
  const tracks = useMusicPlayerStore((s) => s.tracks);
  const isPlaying = useMusicPlayerStore((s) => s.isPlaying);
  const currentTime = useMusicPlayerStore((s) => s.currentTime);
  const duration = useMusicPlayerStore((s) => s.duration);
  const volume = useMusicPlayerStore((s) => s.volume);
  const muted = useMusicPlayerStore((s) => s.muted);
  const toggle = useMusicPlayerStore((s) => s.toggle);
  const next = useMusicPlayerStore((s) => s.next);
  const prev = useMusicPlayerStore((s) => s.prev);
  const seek = useMusicPlayerStore((s) => s.seek);
  const setVolume = useMusicPlayerStore((s) => s.setVolume);
  const toggleMute = useMusicPlayerStore((s) => s.toggleMute);

  const track = useCurrentTrack();
  const hasMultiple = tracks.length > 1;
  const effectiveVolume = muted ? 0 : volume;

  /**
   * 进度条拖动期间的本地状态:
   * - isSeeking: 是否正在拖动
   * - seekValue: 拖动期间 Slider 显示的本地值(避免 timeupdate 反向覆盖造成抖动)
   * 拖动结束后才把 seekValue 提交到 store,触发 audio 真正 seek。
   */
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);

  const handleSliderChange = (value: number | readonly number[]) => {
    const time = Array.isArray(value) ? value[0] : value;
    if (isSeeking) {
      // 拖动期间仅更新本地值，避免 timeupdate 反向覆盖造成抖动
      setSeekValue(time);
    } else {
      // 键盘等非拖动场景立即提交，保证可访问性
      seek(time);
    }
  };

  /** 开始拖动:同步初始值到当前位置,避免首帧视觉跳变 */
  const handleSeekStart = () => {
    setSeekValue(currentTime);
    setIsSeeking(true);
  };

  /** 结束拖动:提交 seek 到 store,触发 audio-controller 写入 audio.currentTime */
  const handleSeekEnd = () => {
    setIsSeeking(false);
    seek(seekValue);
  };

  const handleVolumeChange = (value: number | readonly number[]) => {
    const v = Array.isArray(value) ? value[0] : value;
    setVolume(v);
  };

  return (
    <div className="space-y-2">
      {/* 顶部：推荐音乐标题（左）+ 共用音量控制（右，静音按钮 + 音量条） */}
      <div className="flex items-center justify-between gap-2">
        <SectionTitle variant="accent" className="shrink-0">
          推荐音乐
        </SectionTitle>
        <div className="flex shrink-0 basis-28 items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={muted ? "取消静音" : "静音"}
                  className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
                >
                  {muted || volume === 0 ? (
                    <VolumeX className="size-4" />
                  ) : (
                    <Volume2 className="size-4" />
                  )}
                </button>
              }
            />
            <TooltipContent>{muted ? "取消静音" : "静音"}</TooltipContent>
          </Tooltip>
          <Slider
            value={[effectiveVolume]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="w-16"
            aria-label="音量"
          />
        </div>
      </div>

      <div className="space-y-2 rounded-lg border bg-card/50 p-3">
        {/* 上方：封面（左）+ 歌曲信息/进度条/控制（右） */}
        <div className="flex items-center gap-3">
          {/* 封面 + 悬浮播放按钮：桌面 hover 显示，移动端始终显示 */}
          <div className="group relative size-12 shrink-0">
            <img
              src={track.cover}
              alt={track.name}
              className="size-12 rounded-md object-cover"
            />
            <button
              type="button"
              onClick={toggle}
              aria-label={isPlaying ? "暂停" : "播放"}
              className={cn(
                "absolute inset-0 flex items-center justify-center",
                "rounded-md bg-black/50 text-white transition-colors hover:bg-black/60",
                "md:opacity-0 md:group-hover:opacity-100",
              )}
            >
              {isPlaying ? <Pause className="size-5" /> : <Play className="size-5" />}
            </button>
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            {/* 歌曲名（左）+ 歌手（右） */}
            <div className="flex items-center justify-between gap-2">
              {track.songUrl ? (
                <MarqueeText className="min-w-0 text-sm font-medium">
                  <ExternalLink
                    href={track.songUrl}
                    className="text-inherit hover:underline"
                  >
                    {track.name}
                  </ExternalLink>
                </MarqueeText>
              ) : (
                <MarqueeText className="min-w-0 text-sm font-medium">
                  {track.name}
                </MarqueeText>
              )}
              <span className="shrink-0 text-xs text-muted-foreground">
                {track.artist}
              </span>
            </div>
            {/* 专辑名（下） */}
            {track.albumUrl ? (
              <MarqueeText className="text-xs text-muted-foreground">
                <ExternalLink
                  href={track.albumUrl}
                  className="text-inherit hover:underline"
                >
                  {track.album}
                </ExternalLink>
              </MarqueeText>
            ) : (
              <MarqueeText className="text-xs text-muted-foreground">
                {track.album}
              </MarqueeText>
            )}
            {/* 进度条 + 时间 */}
            <div className="flex items-center gap-2">
              <Slider
                value={[isSeeking ? seekValue : currentTime]}
                max={duration || 1}
                step={1}
                onValueChange={handleSliderChange}
                onPointerDown={handleSeekStart}
                onPointerUp={handleSeekEnd}
                onPointerCancel={handleSeekEnd}
                className="flex-1"
                aria-label="播放进度"
              />
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {formatTime(isSeeking ? seekValue : currentTime)}/{formatTime(duration)}
              </span>
            </div>
            {/* 多首曲目时显示上一首/下一首 */}
            {hasMultiple && (
              <div className="flex items-center justify-center gap-0.5">
                <button
                  type="button"
                  onClick={prev}
                  aria-label="上一首"
                  className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
                >
                  <SkipBack className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label="下一首"
                  className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
                >
                  <SkipForward className="size-4" />
                </button>
              </div>
            )}
          </div>
        </div>
        {/* 下方：评价（单独块元素，不再与进度条同级） */}
        {track.comment && (
          <p className="border-t border-border/50 pt-2 text-xs text-muted-foreground italic">
            「{track.comment}」
          </p>
        )}
      </div>
    </div>
  );
}

export { MusicPlayer };
