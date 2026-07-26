import type { FC } from "react";
import {
  SiAntdesign,
  SiCplusplus,
  SiElectron,
  SiLess,
  SiLua,
  SiNextdotjs,
  SiPython,
  SiReact,
  SiRust,
  SiSass,
  SiShadcnui,
  SiTailwindcss,
  SiTauri,
  SiTypescript,
  SiVite,
  SiVitest,
  SiVuedotjs,
  SiWebpack,
  SiWechat,
} from "@icons-pack/react-simple-icons";
import AgGridIcon from "@/assets/icons/ag-grid.svg?react";
import ElementPlusIcon from "@/assets/icons/element-plus.svg?react";
import RspackIcon from "@/assets/icons/rspack.svg?react";
import VantIcon from "@/assets/icons/vant.svg?react";
import { BorderBeam } from "@/components/ui/border-beam";
import { MusicPlayer } from "@/components/music-player";
import { SectionTitle } from "@/components/section-title";
import { ExternalLink } from "@/components/external-link";
import { cn } from "@/lib/utils";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { TechBadge } from "./tech-badge";

/** 技能项 */
interface Skill {
  /** 技能名称，徽章显示文字 */
  name: string;
  /** simple-icons 品牌图标组件 */
  icon: FC<{ className?: string; color?: string }>;
  /** 悬浮提示，未提供时不显示 Tooltip */
  tooltip?: string;
}

/** 技能分组 */
interface SkillGroup {
  /** 分组名称 */
  category: string;
  /** 该分组下的技能列表 */
  items: Skill[];
}

/** 技能列表 */
const skills: SkillGroup[] = [
  {
    category: "编程语言",
    items: [
      { name: "TypeScript", icon: SiTypescript },
      { name: "Rust", icon: SiRust },
      { name: "Python", icon: SiPython },
      { name: "Lua", icon: SiLua },
      { name: "C/C++", icon: SiCplusplus },
    ],
  },
  {
    category: "前端",
    items: [
      { name: "React", icon: SiReact },
      { name: "Vue", icon: SiVuedotjs },
      { name: "TailwindCSS", icon: SiTailwindcss },
      { name: "Less", icon: SiLess },
      { name: "SCSS", icon: SiSass },
      { name: "WXML", icon: SiWechat, tooltip: "微信小程序" },
      { name: "Next.js", icon: SiNextdotjs },
    ],
  },
  {
    category: "组件库",
    items: [
      { name: "Ant Design", icon: SiAntdesign },
      { name: "shadcn/ui", icon: SiShadcnui },
      { name: "Element Plus", icon: ElementPlusIcon },
      { name: "Vant", icon: VantIcon },
      { name: "AG Grid", icon: AgGridIcon },
    ],
  },
  {
    category: "桌面应用",
    items: [
      { name: "Electron", icon: SiElectron },
      { name: "Tauri", icon: SiTauri },
    ],
  },
  {
    category: "工程化",
    items: [
      { name: "webpack", icon: SiWebpack },
      { name: "rspack", icon: RspackIcon },
      { name: "Vite", icon: SiVite },
      { name: "Vitest", icon: SiVitest },
    ],
  },
];

function Home() {
  useDocumentTitle();
  return (
    <div className="mx-auto grid max-w-6xl gap-8 p-6 md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] lg:gap-8">
      {/* 左侧：头像 + 简介，桌面端 sticky 跟随滚动 */}
      <aside className="flex flex-col gap-4 md:sticky md:top-20 md:self-start">
        <div className="relative mx-auto w-fit overflow-hidden rounded-full ring-1 ring-border">
          <img
            src="/avatar.jpg"
            alt="BearBin"
            className="size-32 rounded-full object-cover"
          />
          <BorderBeam
            duration={9}
            size={80}
            borderWidth={3}
            colorFrom="#06B6D4"
            colorTo="#3B82F6"
          />
          <BorderBeam
            duration={9}
            delay={4.5}
            size={80}
            borderWidth={3}
            colorFrom="#3B82F6"
            colorTo="#8B5CF6"
          />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-semibold">BearBin</h1>
          <p className="mt-1 text-muted-foreground">样样通样样松</p>
        </div>
        <MusicPlayer />
      </aside>

      {/* 右侧：介绍 + 技能 */}
      <div className="space-y-8">
        <section>
          <SectionTitle variant="accent" className="mb-4">
            关于我
          </SectionTitle>
          <article className="prose prose-sm">
            <p>
              常用网名 BearBin / Bear_Bin /
              阿熊，一般是从前往后试直到不被占用。熟人叫我阿熊较多。
            </p>
            <p>
              现居福建厦门，<del>不自信又</del>普通的社畜。
            </p>
            <p>爱好方面以游戏、视频为主。目前对同人音乐比较感兴趣，每届 <ExternalLink href="https://zh.moegirl.org.cn/Music_Media-Mix_Market">M3</ExternalLink> 会买几张碟的样子。</p>
            <p>
              大学期间做过一阵子明日方舟攻略视频，后来随着毕业临近就停了。停更的时候微博和B站加起来应该有个4万多的粉丝，现在也是掉下来了。
            </p>
            <p>
              个人思想可能算略显激进，脑子里不时会有些暴论。写这个网站的目的之一也是考虑把自己的想法记录一下，供事后回顾和参考。
            </p>
          </article>
        </section>

        <section>
          <SectionTitle variant="accent" className="mb-4">
            我会什么
          </SectionTitle>
          <div className="divide-y divide-border border-t">
            {skills.map((group) => (
              <div key={group.category} className="group relative py-4 last:pb-0">
                {/* 悬浮分组名：默认透明，hover 时在分组顶部浮现 */}
                <span
                  className={cn(
                    "absolute -top-3 left-2 z-10 px-2 py-0.5",
                    "pointer-events-none rounded bg-primary opacity-0 shadow-sm",
                    "text-xs font-medium text-primary-foreground",
                    "transition-opacity duration-200 group-hover:opacity-100",
                  )}
                >
                  {group.category}
                </span>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((skill) => (
                    <TechBadge
                      key={skill.name}
                      label={skill.name}
                      icon={skill.icon}
                      tooltip={skill.tooltip}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground line-through">
            其实C/C++已经还给大学老师了
          </p>
        </section>
      </div>
    </div>
  );
}

export default Home;
