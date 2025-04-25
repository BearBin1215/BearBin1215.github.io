import React, { useState, useEffect, ChangeEventHandler } from 'react';
import ReactJson from 'react18-json-view';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { EditorView } from '@codemirror/view';
import { Banner } from '@/components';
import 'react18-json-view/src/style.css'
import './index.scss';
import packageJson from '../../../../package.json';

const JSONView: React.FC = () => {
  const [src, setSrc] = useState(packageJson);
  const [text, setText] = useState(JSON.stringify(packageJson, null, 2));

  const handleEdit = ({ src }: { src: any }) => {
    setText(JSON.stringify(src, null, 2));
  };

  const handleTextChange = (value: string) => {
    setText(value);
  };

  useEffect(() => {
    try {
      setSrc(JSON.parse(text));
    } catch (error) {
      console.info('JSON解析错误');
    }
  }, [text]);

  return (
    <>
      <h1>JSON可视化试验场</h1>
      <Banner type='header'>
        使用组件：
        <a href='https://github.com/mac-s-g/react-json-view'>
          react1-json-view
        </a>
        、
        <a href='https://github.com/uiwjs/react-codemirror'>
          @uiw/react-codemirror
        </a>
      </Banner>
      <div id='json-view'>
        <ReactJson
          src={src}
          onEdit={handleEdit}
          onAdd={handleEdit}
          onDelete={handleEdit}
          editable
          theme='vscode'
        />
        <CodeMirror
          className='json-editor'
          value={text}
          maxHeight='35em'
          extensions={[json(), EditorView.lineWrapping]}
          onChange={handleTextChange}
        />
      </div>
    </>
  );
};

JSONView.displayName = 'JOSNView';

export default JSONView;
