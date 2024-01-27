import React, { useEffect, useState, useRef } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { a11yLight } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { render as parseLess } from 'less';
import debounce from 'lodash/debounce';
import { Button } from '@/components';
import { copyText } from '@/utils/clipboard';
import saveFile from '@/utils/saveFile';
import './index.scss';

const defaultLessCode = `.foo {
  color: #000;

  .bar {
    text-decoration: underline;

    &:hover {
      color: red;
    }
  }
}
`;

const StyleParser: React.FC = () => {
  const [lessParseResult, setLessParseResult] = useState('');
  const [isSucess, setIsSuccess] = useState(true);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    document.title = 'Less解析器 - BearBin';
    if (inputRef.current) {
      inputRef.current.value = defaultLessCode;
    }
    parseLess(defaultLessCode).then(({ css }) => {
      setLessParseResult(css);
    });
  }, []);

  /**
   * 输入框代码发生变化后若0.5s内无变化则进行解析
   */
  const handleLessCodeChange = debounce(({ target: { value } }: React.ChangeEvent<HTMLTextAreaElement>) => {
    parseLess(value, (error, output) => {
      console.log(error, output);
      if (error) {
        setLessParseResult(error.message);
        setIsSuccess(false);
      } else {
        setLessParseResult(output!.css);
        setIsSuccess(true);
      }
    });
  }, 500);

  /**
   * 复制结果
   */
  const handleCopy = () => {
    if (isSucess) {
      copyText(lessParseResult);
    }
  };

  /**
   * 将结果下载为css文件
   */
  const handleDownload = () => {
    if (isSucess) {
      saveFile(new Blob([lessParseResult]), 'output.css');
    }
  };

  return (
    <>
      <h1>Less解析器</h1>
      <div className='lessparser-wrapper'>
        <textarea
          onChange={handleLessCodeChange}
          ref={inputRef}
          className='code'
        />
        <div className='button-area'>
          {/* <Button>
            上传
          </Button> */}
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
          {lessParseResult}
        </SyntaxHighlighter>
        {/* <textarea
          readOnly
          value={lessParseResult}
          className='code'
        /> */}
      </div>
      本来还想搓一个scss解析器上去，结果发现scss只能在node上运行（
    </>
  );
};

export default StyleParser;
