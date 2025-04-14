import React, { useState, useEffect, ChangeEventHandler } from 'react';
import ReactJson, { type InteractionProps } from 'react-json-view';
import packageJson from '../../../../package.json';
import { Banner } from '@/components';
import './index.scss';

const JSONView: React.FC = () => {
  const [src, setSrc] = useState(packageJson);
  const [text, setText] = useState(JSON.stringify(packageJson, null, 2));

  const handleEdit = (edit: InteractionProps) => {
    setText(JSON.stringify(edit.updated_src, null, 2));
  };

  const handleTextChange: ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    setText(e.target.value);
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
          react-json-view
        </a>
      </Banner>
      <div id='json-view'>
        <ReactJson
          src={src}
          onEdit={handleEdit}
          onAdd={handleEdit}
          onDelete={handleEdit}
        />
        <textarea
          id='json-text'
          value={text}
          onChange={handleTextChange}
        />
      </div>
    </>
  );
};

JSONView.displayName = 'JOSNView';

export default JSONView;
