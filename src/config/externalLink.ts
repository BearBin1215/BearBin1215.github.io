import { FC, SVGProps } from 'react';
import { GitHubIcon, MGPIcon, BilibiliIcon } from '@/components/SvgIcon';

interface ExternalLink {
  href: string;
  title: string;
  Icon: FC<SVGProps<SVGSVGElement>>;
}

const externalLinkList: ExternalLink[] = [
  {
    href: 'https://space.bilibili.com/7928053',
    title: 'bilibili',
    Icon: BilibiliIcon,
  },
  {
    href: 'https://zh.moegirl.org.cn/User:BearBin',
    title: '萌娘百科',
    Icon: MGPIcon,
  },
  {
    href: 'https://github.com/BearBin1215',
    title: 'GitHub',
    Icon: GitHubIcon,
  },
];

export { ExternalLink };
export default externalLinkList;