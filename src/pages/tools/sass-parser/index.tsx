import React, { useEffect, useState } from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import css from 'react-syntax-highlighter/dist/esm/languages/hljs/css';
import { a11yLight } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { sass } from '@codemirror/lang-sass';
import { compileString } from 'sass';
import { debounce } from 'lodash-es';
import { Button } from '@/components';
import { copyText } from '@/utils/clipboard';
import saveFile from '@/utils/saveFile';
import example from './example.inline.scss';
import './index.less';

const StyleParser: React.FC = () => {
  const [text, setText] = useState(example);
  const [sassParseResult, setSassParseResult] = useState(compileString(example).css);
  const [isSucess, setIsSuccess] = useState(true);

  useEffect(() => {
    SyntaxHighlighter.registerLanguage('css', css);
  }, []);

  /** 输入框代码发生变化后若0.5s内无变化则进行解析 */
  const handleSassCodeChange = debounce((value: string) => {
    setText(value);
  }, 500);

  useEffect(() => {
    try {
      const res = compileString(text);
      setSassParseResult(res.css);
      setIsSuccess(true);
    } catch (err) {
      setSassParseResult(`${err}`);
    }
  }, [text]);

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
        <CodeMirror
          className='sass-editor'
          value={text}
          extensions={[sass(), EditorView.lineWrapping]}
          onChange={handleSassCodeChange}
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
