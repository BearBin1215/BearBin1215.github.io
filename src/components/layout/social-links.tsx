import type { ReactNode } from "react";
import { default as Icon, GithubOutlined, BilibiliOutlined } from "@ant-design/icons";
import { ExternalLink } from "@/components/external-link";
import { buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import MoegirlPedia from "@/assets/icons/moe.svg?react";

/** 社交链接项 */
interface SocialLink {
  /** 链接地址 */
  href: string;
  /** 无障碍标签与 Tooltip 文本 */
  label: string;
  /** 图标节点 */
  icon: ReactNode;
}

/** 社交链接列表 */
const socialLinks: SocialLink[] = [
  {
    href: "https://github.com/BearBin1215",
    label: "GitHub",
    icon: <GithubOutlined />,
  },
  {
    href: "https://mzh.moegirl.org.cn/User:BearBin?useskin=vector-2022",
    label: "萌娘百科",
    icon: <Icon component={MoegirlPedia} />,
  },
  {
    href: "https://space.bilibili.com/7928053",
    label: "bilibili",
    icon: <BilibiliOutlined />,
  },
];

interface SocialLinksProps {
  /** 是否显示文字标签（移动端建议开启，避免过于空旷） */
  showLabel?: boolean;
}

/** 社交图标链接组：GitHub、萌娘百科、Bilibili */
function SocialLinks({ showLabel = false }: SocialLinksProps) {
  return (
    <>
      {socialLinks.map((link) => (
        <Tooltip key={link.label}>
          <TooltipTrigger
            render={
              <ExternalLink
                href={link.href}
                aria-label={link.label}
                className={cn(
                  buttonVariants({
                    variant: "ghost",
                    size: showLabel ? "sm" : "icon-sm",
                  }),
                  showLabel && "gap-2",
                )}
              >
                {link.icon}
                {showLabel && <span className="text-sm">{link.label}</span>}
              </ExternalLink>
            }
          />
          <TooltipContent>{link.label}</TooltipContent>
        </Tooltip>
      ))}
    </>
  );
}

export { SocialLinks };
