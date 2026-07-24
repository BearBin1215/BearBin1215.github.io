import type { FC } from "react";
import { ExternalLink } from "@/components/external-link";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";

/** 单项技术条目 */
interface Tech {
  /** 技术名称 */
  name: string;
  /** 一句话描述用途 */
  description: string;
  /** 官网地址，点击 Card 跳转 */
  url: string;
  /** 品牌图标组件，来自 simple-icons */
  icon: FC<{ className?: string }>;
  /** 主版本号，无版本号的省略 */
  version?: string;
}

interface TechCardProps {
  /** 待渲染的技术条目 */
  tech: Tech;
}

/** 技术条目卡片：展示图标、名称、版本号与描述，点击跳转官网 */
function TechCard({ tech }: TechCardProps) {
  const Icon = tech.icon;
  return (
    <Card className="group/card transition-all duration-400 hover:bg-card/60 hover:shadow-md hover:ring-foreground/10">
      <ExternalLink href={tech.url} className="block">
        <CardHeader>
          <div className="flex items-center gap-2">
            {/* 响应 Card hover，图标在卡片悬浮时放大 1.15 倍 */}
            <Icon className="size-5 transition-transform duration-400 group-hover/card:scale-115" />
            <span className="font-semibold">{tech.name}</span>
            {tech.version && (
              <Badge variant="secondary" className="ml-auto">
                v{tech.version}
              </Badge>
            )}
          </div>
          <CardDescription>{tech.description}</CardDescription>
        </CardHeader>
      </ExternalLink>
    </Card>
  );
}

export { TechCard };
export type { Tech };
