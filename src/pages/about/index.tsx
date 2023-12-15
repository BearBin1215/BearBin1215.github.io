import React from 'react';
import { LinkCardWall } from '@/components';
import {
  ReactIcon,
  SassIcon,
  GitHubIcon,
  WebpackIcon,
  LoadingIcon
} from '@/components/SvgIcon';
import './index.scss';

const About: React.FC = () => {
  document.title = 'About - BearBin';
  const { LinkCard } = LinkCardWall;

  return (
    <>
      <h1>About</h1>
      <LinkCardWall>
        <LinkCard
          href='https://react.docschina.org/'
          icon={<ReactIcon />}
        >
          框架：React
        </LinkCard>
        <LinkCard
          href='https://sass-lang.com/'
          icon={<SassIcon />}
        >
          CSS预处理器：Sass
        </LinkCard>
        <LinkCard
          href='https://github.com/BearBin1215/BearBin1215.github.io'
          icon={<GitHubIcon />}
        >
          代码托管：GitHub
        </LinkCard>
        <LinkCard
          href='https://webpack.js.org/'
          icon={<WebpackIcon />}
        >
          构建工具：webpack
        </LinkCard>
        <LinkCard
          href='https://loading.io/'
          icon={<LoadingIcon />}
        >
          加载图标：loading.io
        </LinkCard>
      </LinkCardWall>
    </>
  );
};

export default About;
