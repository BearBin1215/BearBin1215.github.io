import React from 'react';
import { Tabs } from '@/components';

const { Tab } = Tabs;

const Home: React.FC = () => {
  document.title = 'BearBin';

  return (
    <>
      <h1>欢迎</h1>
      本站搭建中，稳中向好！
      <Tabs>
        <Tab label='1' className='123'>aaa</Tab>
        <Tab label='2'>bbb</Tab>
      </Tabs>
    </>
  );
};

export default Home;
