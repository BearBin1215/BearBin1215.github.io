import React from 'react';
import './index.scss';

const OritechCalculator = () => {
  const speedList = [...Array(10).keys()];
  const processList = [...Array(10).keys()];

  // 计算处理时间的函数
  const calculateTime = (speed: number, process: number) => {
    const baseTime = 10; // 初始用时10s
    const speedMultiplier = 1 + speed * 3.5; // 每个速度插件提升350%
    const processParallel = 1 + process; // 每个加工插件提供一个并行
    return (baseTime / speedMultiplier / processParallel * 64).toFixed(2);
  };

  return (
    <>
      <p>
        假定处理一个物品初始用时200tick（10s），本表计算处理64个物品所用时间（s）。
      </p>
      <table className='oritech-calculator'>
        <tbody>
          <tr>
            <td>加工\速度</td>
            {speedList.map((speed) => (
              <td key={speed}>{speed}</td>
            ))}
          </tr>
          {processList.map((process) => (
            <tr key={process}>
              <td>{process}</td>
              {speedList.map((speed) => (
                <td key={`${process}-${speed}`}>
                  {calculateTime(speed, process)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default OritechCalculator;
