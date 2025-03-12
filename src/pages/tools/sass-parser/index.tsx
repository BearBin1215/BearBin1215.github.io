import React, { useEffect, useState, useRef } from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import css from 'react-syntax-highlighter/dist/esm/languages/hljs/css';
import { a11yLight } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { compileString } from 'sass';
import { debounce } from 'lodash-es';
import example from './example.txt' assert { type: 'string' };
import { Button } from '@/components';
import { copyText } from '@/utils/clipboard';
import saveFile from '@/utils/saveFile';
import './index.scss';

const StyleParser: React.FC = () => {
  const [sassParseResult, setSassParseResult] = useState(compileString(example).css);
  const [isSucess, setIsSuccess] = useState(true);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = example;
    }
    SyntaxHighlighter.registerLanguage('css', css);
  }, []);

  /** 输入框代码发生变化后若0.5s内无变化则进行解析 */
  const handleSassCodeChange = debounce(({ target: { value } }: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const res = compileString(value);
      setSassParseResult(res.css);
      setIsSuccess(true);
    } catch (err) {
      setSassParseResult(`${err}`);
    }
  }, 500);

  /** 复制结果 */
  const handleCopy = () => {
    if (isSucess) {
      copyText(sassParseResult);
    }
  };

  /** 将结果下载为css文件 */
  const handleDownload = () => {
    if (isSucess) {
      saveFile(new Blob([sassParseResult]), 'output.css');
    }
  };

  return (
    <>
      <h1>Sass解析器</h1>
      <div className='sassparser-wrapper'>
        <textarea
          onChange={handleSassCodeChange}
          ref={inputRef}
          className='code'
        />
        <div className='button-area'>
          <Button
            onClick={handleCopy}
            buttonType='primary'
          >
            复制
          </Button>
          <Button
            onClick={handleDownload}
          >
            下载
          </Button>
        </div>
        <SyntaxHighlighter language='css' style={a11yLight}>
          {sassParseResult}
        </SyntaxHighlighter>
      </div>
    </>
  );
};

export default StyleParser;
