import React, { useEffect } from 'react';
import CodeZone from './CodeZone';
import { Banner, MGPLink } from '@/components';
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
      <div className='center'>本页建设中……</div>

      <h2>使用指南</h2>
      直接在自己的<MGPLink page='Special:MyPage/common.js'>common.js</MGPLink>页面新增一行，加入对应的<code className='inline-code'>mw.loader.load(...)</code>代码即可。


      <h2>工具介绍</h2>
      <h3>
        批量编辑
      </h3>
      <CodeZone gadgetName='MassEdit' />
      <h3>
        批量移动
      </h3>
      <CodeZone gadgetName='BulkMove' />
      <h3>
        群发提醒
      </h3>
      <CodeZone gadgetName='BatchSend' />
    </>
  );
};

export default MWGadgets;
