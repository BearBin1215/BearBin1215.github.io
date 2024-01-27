import React, { useEffect } from 'react';

const Home: React.FC = () => {
  useEffect(() => {
    document.title = 'BearBin';
  }, []);

  return (
    <>
      <h1>欢迎</h1>
      本站搭建中，稳中向好！
    </>
  );
};

export default Home;
