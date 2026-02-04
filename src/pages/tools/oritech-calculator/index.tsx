import React, { useState } from 'react';
import './index.scss';

const OritechCalculator = () => {
  /** 插件数量，即行、列数 */
  const pluginCounts = 13;

  const speedList = [...Array(pluginCounts).keys()];
  const processList = [...Array(pluginCounts).keys()];

  // 速度插件等级
  const [speedLevel, setSpeedLevel] = useState(7);
  // 勾选的插件总数
  const [selectedCount, setSelectedCount] = useState(0);

  /** 计算处理时间 */
  const calculateTime = (speed: number, process: number) => {
    const baseTime = 200; // 初始用时200tick
    /** 速度插件所提供的效率提升 */
    const speedMultiplier = 1 + speed * (speedLevel * 0.5);
    /** 处理单个物品所需时间，向下取整 */
    const oneItemTick = Math.floor(baseTime / speedMultiplier);
    /** 总并行数 */
    const processParallel = 1 + process;

    return (oneItemTick / processParallel * 64 / 20).toFixed(2);
  };

  return (
    <>
      <p>假定处理一个物品初始用时200tick（10s），本表计算处理64个物品所用时间（s）。</p>
      <p>点击第一列/行数字可高亮对应总数单元格。</p>
      <p>
        使用速度插件等级：
        <input
          type='number'
          value={speedLevel}
          onChange={(e) => setSpeedLevel(parseInt(e.target.value))}
          max={9}
        />
      </p>
      <table className='oritech-calculator'>
        <tbody>
          <tr>
            <td className='first-cell' rowSpan={2}>加工\速度</td>
            {speedList.map((speed) => (
              <td
                key={speed}
                className={selectedCount === speed ? 'highlight calculator-header' : 'calculator-header'}
                onClick={() => setSelectedCount(speed)}
                style={{ cursor: 'pointer' }}
              >
                {speed}
              </td>
            ))}
          </tr>
          <tr>
            {speedList.map((speed) => (
              <td
                key={speed}
                className={selectedCount === speed ? 'highlight' : ''}
              >
                {speedLevel * 0.5 * speed * 100}%
              </td>
            ))}
          </tr>
          {processList.map((process) => (
            <tr key={process}>
              <td
                className={selectedCount === process ? 'highlight calculator-header' : 'calculator-header'}
                onClick={() => setSelectedCount(process)}
                style={{ cursor: 'pointer' }}
              >
                {process}
              </td>
              {speedList.map((speed) => (
                <td
                  key={`${process}-${speed}`}
                  className={process + speed === selectedCount ? 'highlight' : ''}
                >
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
