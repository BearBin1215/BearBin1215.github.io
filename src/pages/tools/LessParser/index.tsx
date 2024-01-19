import React, { useEffect, useState, useRef } from 'react';
import { render as parseLess } from 'less';
import { debounce } from 'lodash';
import './index.scss';

const defaultLessCode = `
.foo {
  color: #000;

  .bar {
    text-decoration: underline;

    &:hover {
      color: red;
    }
  }
}
`.trim();


const StyleParser: React.FC = () => {
  const [lessParseResult, setLessParseResult] = useState('');
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

  const handleLessCodeChange = debounce(({ target: { value } }: React.ChangeEvent<HTMLTextAreaElement>) => {
    parseLess(value)
      .then(({ css }) => setLessParseResult(css))
      .catch((error) => setLessParseResult(error));
  }, 1000);

  return (
    <>
      <h1>Less解析器</h1>
      <div className='lessparser-wrapper'>
        <textarea
          onChange={handleLessCodeChange}
          ref={inputRef}
          className='code'
        />
        <textarea
          readOnly
          value={lessParseResult}
          className='code'
        />
      </div>
    </>
  );
};

export default StyleParser;