import React from 'react';
import { LinkCardWall } from '@/components';
import ReactIcon from '@/components/SvgIcon/icons/react.svg?react';
import TypeScriptIcon from '@/components/SvgIcon/icons/typescript.svg?react';
import GitHubIcon from '@/components/SvgIcon/sites/GitHub';
import LoadingioIcon from '@/components/SvgIcon/sites/Loadingio';
import ViteIcon from '@/components/SvgIcon/icons/vite.svg?react';
import lessLogo from '@/assets/less_logo.png';
import './index.less';

const { LinkCard } = LinkCardWall;

const About: React.FC = () => {
  return (
    <>
      <h1>关于本站</h1>
      <LinkCardWall>
        <LinkCard
          href='https://react.docschina.org/'
          icon={<ReactIcon />}
        >
          框架：React
        </LinkCard>
        <LinkCard
          href='https://www.typescriptlang.org/'
          icon={<TypeScriptIcon />}
        >
          语言：TypeScript
        </LinkCard>
        <LinkCard
          href='https://lesscss.org/'
          icon={<img src={lessLogo} />}
        >
          CSS预处理器：Less
        </LinkCard>
        <LinkCard
          href='https://vite.dev/'
          icon={<ViteIcon />}
        >
          构建工具：Vite
        </LinkCard>
      </LinkCardWall>
      <LinkCardWall>
        <LinkCard
          href='https://github.com/BearBin1215/BearBin1215.github.io'
          icon={<GitHubIcon />}
        >
          代码托管：GitHub
        </LinkCard>
        <LinkCard
          href='https://loading.io/'
          icon={<LoadingioIcon />}
        >
          加载图标：loading.io
        </LinkCard>
      </LinkCardWall>
    </>
  );
};

export default About;
