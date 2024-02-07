import React, { useEffect } from 'react';
import CodeZone from './CodeZone';
import { Banner } from '@/components';
import './index.scss';

const MWGadgets = () => {
  useEffect(() => {
    document.title = 'MW小工具';
  }, []);

  return (
    <>
      <h1>
        MediaWiki小工具
      </h1>
      <Banner type='header'>
        目前大多数工具仅针对萌娘百科进行适配，在其他站点可能无法正常使用全部功能。
      </Banner>
      本页建设中……
      <h2>
        批量编辑
      </h2>
      <CodeZone gadgetName='MassEdit' />
      <h2>
        批量移动
      </h2>
      <CodeZone gadgetName='BulkMove' />
    </>
  );
};

export default MWGadgets;
