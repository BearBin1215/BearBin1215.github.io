import React, { useRef } from 'react';
import Editor from './Editor.jsx';
import './index.scss';
import 'quill/dist/quill.core.css';
import 'quill/dist/quill.snow.css';

const Test = () => {
  const quillRef = useRef();

  return <Editor ref={quillRef} />;
};

export default Test;
