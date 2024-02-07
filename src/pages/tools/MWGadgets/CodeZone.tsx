import React, { useEffect } from 'react';
import { RiFileCopyLine } from 'react-icons/ri';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import js from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import { duotoneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { copyText } from '@/utils/clipboard';

const CodeZone: React.FC<{ gadgetName: string }> = ({ gadgetName }) => {
  useEffect(() => {
    SyntaxHighlighter.registerLanguage('javascript', js);
  }, []);

  const loaderCode = `mw.loader.load("https://cdn.jsdelivr.net/gh/BearBin1215/MoegirlPedia@master/dist/gadgets/${gadgetName}.min.js");`;

  const copyCode = () => {
    copyText(loaderCode);
  };

  return (
    <div className='gadget-codezone'>
      <button
        className='gadget-copycode'
        onClick={copyCode}
        title='复制'
      >
        <RiFileCopyLine className='copy-icon' />
      </button>
      <SyntaxHighlighter
        language='javascript'
        style={duotoneLight}
        className='gadget-codehighlight'
      >
        {loaderCode}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodeZone;
