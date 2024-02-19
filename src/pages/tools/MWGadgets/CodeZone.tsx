import React, { useEffect } from 'react';
import { RiFileCopyLine } from 'react-icons/ri';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import js from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import { duotoneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Tabs } from '@/components';
import { copyText } from '@/utils/clipboard';

/**
 * 载入代码示例
 */
const CodeZone: React.FC<{ gadgetName: string }> = ({ gadgetName }) => {
  useEffect(() => {
    SyntaxHighlighter.registerLanguage('javascript', js);
  }, []);

  /**
   * 代码高亮配置
   */
  const highlightProps = {
    language: 'javascript',
    style: duotoneLight,
    className: 'gadget-codehighlight',
  };

  const loaderCodeCDN = `mw.loader.load("https://cdn.jsdelivr.net/gh/BearBin1215/MoegirlPedia@master/dist/gadgets/${gadgetName}.min.js");`;

  const loaderCodeUserPage = `mw.loader.load("/index.php?title=User:BearBin/js/${gadgetName}.js&action=raw&ctype=text/javascript");`;

  return (
    <Tabs className='mgpgadgets-tabs'>
      <Tabs.Tab label='外部CDN'>
        <div className='gadget-codezone'>
          <button
            className='gadget-copycode'
            onClick={() => copyText(loaderCodeCDN)}
            title='复制'
          >
            <RiFileCopyLine className='copy-icon' />
          </button>
          <SyntaxHighlighter {...highlightProps}>
            {loaderCodeCDN}
          </SyntaxHighlighter>
        </div>
      </Tabs.Tab>
      <Tabs.Tab label='站内用户JS'>
        <div className='gadget-codezone'>
          <button
            className='gadget-copycode'
            onClick={() => copyText(loaderCodeUserPage)}
            title='复制'
          >
            <RiFileCopyLine className='copy-icon' />
          </button>
          <SyntaxHighlighter {...highlightProps}>
            {loaderCodeUserPage}
          </SyntaxHighlighter>
        </div>
      </Tabs.Tab>
    </Tabs>
  );
};

export default CodeZone;
