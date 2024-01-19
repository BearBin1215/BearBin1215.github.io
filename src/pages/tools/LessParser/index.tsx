import React, { useEffect, useState } from 'react';
import { render as parseLess } from 'less';
import { debounce } from 'lodash';
import './index.scss';

const StyleParser: React.FC = () => {
  const [lessParseResult, setLessParseResult] = useState('');

  useEffect(() => {
    document.title = 'LESS解析器 - BearBin';
  }, []);

  const handleLessCodeChange = debounce(({ target: { value } }: React.ChangeEvent<HTMLTextAreaElement>) => {
    parseLess(value)
      .then(({ css }) => setLessParseResult(css))
      .catch((error) => setLessParseResult(error));
  }, 1000);

  return (
    <>
      <h1>LESS解析器</h1>
      <div className='styleparser-wrapper'>
        <textarea
          onChange={handleLessCodeChange}
        />
        <textarea
          readOnly
          value={lessParseResult}
        />
      </div>
    </>
  );
};

export default StyleParser;