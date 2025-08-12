import React, { useEffect, useState } from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import css from 'react-syntax-highlighter/dist/esm/languages/hljs/css';
import { a11yLight } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { less } from '@codemirror/lang-less';
import { render as parseLess } from 'less';
import { debounce } from 'lodash-es';
import { Button } from '@/components';
import { copyText } from '@/utils/clipboard';
import saveFile from '@/utils/saveFile';
import example from './example.inline.less';
import './index.scss';

const StyleParser: React.FC = () => {
  const [text, setText] = useState(example);
  const [lessParseResult, setLessParseResult] = useState('');
  const [isSucess, setIsSuccess] = useState(true);

  useEffect(() => {
    parseLess(example).then(({ css: res }) => {
      setLessParseResult(res);
    });
    SyntaxHighlighter.registerLanguage('css', css);
  }, []);

  /** 输入框代码发生变化后若0.5s内无变化则进行解析 */
  const handleLessCodeChange = debounce((value: string) => {
    setText(value);
  }, 500);

  useEffect(() => {
    parseLess(text, (error, output) => {
      console.log(error, output);
      if (error) {
        setLessParseResult(error.message);
        setIsSuccess(false);
      } else {
        setLessParseResult(output!.css);
        setIsSuccess(true);
      }
    });
  }, [text]);

  /** 复制结果 */
  const handleCopy = () => {
    if (isSucess) {
      copyText(lessParseResult);
    }
  };

  /** 将结果下载为css文件 */
  const handleDownload = () => {
    if (isSucess) {
      saveFile(new Blob([lessParseResult]), 'output.css');
    }
  };

  return (
    <>
      <h1>Less解析器</h1>
      <div className='lessparser-wrapper'>
        <CodeMirror
          className='less-editor'
          value={text}
          extensions={[less(), EditorView.lineWrapping]}
          onChange={handleLessCodeChange}
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
          {lessParseResult}
        </SyntaxHighlighter>
      </div>
    </>
  );
};

export default StyleParser;
