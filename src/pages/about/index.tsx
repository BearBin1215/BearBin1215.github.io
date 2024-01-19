import React, { useEffect } from 'react';
import { LinkCardWall } from '@/components';
import {
  ReactIcon,
  TypeScriptIcon,
  SassIcon,
  PostCSSIcon,
  GitHubIcon,
  WebpackIcon,
  LoadingioIcon
} from '@/components/SvgIcon';
import './index.scss';

const { LinkCard } = LinkCardWall;

const About: React.FC = () => {
  useEffect(() => {
    document.title = '关于 - BearBin';
  }, []);

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
          href='https://sass-lang.com/'
          icon={<SassIcon />}
        >
          CSS预处理器：Sass
        </LinkCard>
        <LinkCard
          href='https://postcss.org/'
          icon={<PostCSSIcon />}
        >
          CSS转换：PostCSS
        </LinkCard>
        <LinkCard
          href='https://webpack.js.org/'
          icon={<WebpackIcon />}
        >
          构建工具：webpack
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
