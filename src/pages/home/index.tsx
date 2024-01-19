import React, { useEffect } from 'react';
import { Collapse } from '@/components';

const Home: React.FC = () => {
  useEffect(() => {
    document.title = 'BearBin';
  }, []);

  return (
    <>
      <h1>欢迎</h1>
      本站搭建中，稳中向好！
      <Collapse
        label='标题'
        expanded={false}
      >
        内容
      </Collapse>
    </>
  );
};

export default Home;
