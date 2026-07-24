import { motion, type MotionStyle, type Transition } from "motion/react";
import { cn } from "@/lib/utils";

interface BorderBeamProps {
  /** 流光尺寸 */
  size?: number;
  /** 动画持续时间（秒） */
  duration?: number;
  /** 动画延迟时间（秒） */
  delay?: number;
  /** 流光渐变起始颜色 */
  colorFrom?: string;
  /** 流光渐变结束颜色 */
  colorTo?: string;
  /** motion 动画过渡配置 */
  transition?: Transition;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 是否反转动画方向 */
  reverse?: boolean;
  /** 初始偏移位置（0-100） */
  initialOffset?: number;
  /** 流光边框宽度 */
  borderWidth?: number;
}

/**
 * Magic UI 的边框流光组件
 * @link https://magicui.design/docs/components/border-beam
 */
export const BorderBeam = ({
  className,
  size = 50,
  delay = 0,
  duration = 6,
  colorFrom = "#ffaa40",
  colorTo = "#9c40ff",
  transition,
  style,
  reverse = false,
  initialOffset = 0,
  borderWidth = 1,
}: BorderBeamProps) => {
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-[inherit] border-(length:--border-beam-width) border-transparent mask-[linear-gradient(transparent,transparent),linear-gradient(#000,#000)] mask-intersect [mask-clip:padding-box,border-box]"
      style={
        {
          "--border-beam-width": `${borderWidth}px`,
        } as React.CSSProperties
      }
    >
      <motion.div
        className={cn(
          "absolute aspect-square",
          "bg-linear-to-l from-(--color-from) via-(--color-to) to-transparent",
          className,
        )}
        style={
          {
            width: size,
            offsetPath: `rect(0 auto auto 0 round ${size}px)`,
            "--color-from": colorFrom,
            "--color-to": colorTo,
            ...style,
          } as MotionStyle
        }
        initial={{ offsetDistance: `${initialOffset}%` }}
        animate={{
          offsetDistance: reverse
            ? [`${100 - initialOffset}%`, `${-initialOffset}%`]
            : [`${initialOffset}%`, `${100 + initialOffset}%`],
        }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration,
          delay: -delay,
          ...transition,
        }}
      />
    </div>
  );
};
