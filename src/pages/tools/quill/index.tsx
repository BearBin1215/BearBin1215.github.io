import React, { useRef } from 'react';
import Editor from './Editor';
import 'quill/dist/quill.core.css';
import 'quill/dist/quill.snow.css';
import './index.less';

const Test = () => {
  const quillRef = useRef();

  return <Editor ref={quillRef} />;
};

export default Test;
