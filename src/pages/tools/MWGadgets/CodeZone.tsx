import React from 'react';
import { RiFileCopyLine } from 'react-icons/ri';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { a11yLight } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { copyText } from '@/utils/clipboard';

const CodeZone: React.FC<{ gadgetName: string }> = ({ gadgetName }) => {
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
        style={a11yLight}
        className='gadget-codehighlight'
      >
        {loaderCode}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodeZone;
