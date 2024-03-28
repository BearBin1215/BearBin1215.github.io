import React, { useEffect } from 'react';
import { viewpointList, mgpViewpointList } from './viewpoint';
import { Banner, Tabs } from '@/components';
import { BannerProps } from '@/components/props';

const { Tab } = Tabs;
import './index.scss';

interface viewPointItem extends BannerProps {
  /** 用于map生成react节点 */
  key: React.Key;
  /** 其实就是children */
  text: React.ReactNode;
}

const Viewpoint: React.FC = () => {
  useEffect(() => {
    document.title = '个人观点 - BearBin';
  }, []);

  const bannerFactory = ({ key, signature, text: children, source }: viewPointItem) => (
    <Banner
      key={key}
      signature={signature}
      source={source}
    >
      {children}
    </Banner>
  );

  return (
    <>
      <Banner type='header'>
        基本上都来自于
        <a
          href='https://mzh.moegirl.org.cn/_?curid=561478'
          rel='noreferrer'
          target='_blank'
        >
          我的萌百用户页
        </a>
        ，放在这里主要是凑一页用（
      </Banner>

      <Tabs className='viewpoint-tab'>
        <Tab label='无病呻吟'>
          {viewpointList.map(bannerFactory)}
        </Tab>
        <Tab label='编辑相关'>
          {mgpViewpointList.map(bannerFactory)}
        </Tab>
      </Tabs>
    </>
  );
};

export default Viewpoint;
