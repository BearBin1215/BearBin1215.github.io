import React, { useState, useEffect } from 'react';
import './index.less';

const OritechCalculator = () => {
  /** 配方用时 */
  const baseTime = 400;
  /** 插件数量，即行、列数 */
  const pluginCounts = 13;

  const speedList = [...Array(pluginCounts).keys()];
  const processList = [...Array(pluginCounts).keys()];

  // 插件等级
  const [pluginLevel, setPluginLevel] = useState(7);
  // 勾选的插件总数
  const [selectedCount, setSelectedCount] = useState(0);
  // 当前勾选高亮斜线上的最小时间及其位置
  const [minTimeInfo, setMinTimeInfo] = useState({ time: Infinity, speed: -1, process: -1 });

  /** 计算处理时间 */
  const calculateTime = (speed: number, process: number) => {
    /** 速度插件所提供的效率提升 */
    const speedMultiplier = 1 + speed * (pluginLevel * 0.5);
    /** 单配方耗时，向下取整 */
    const oneItemTick = Math.floor(baseTime / speedMultiplier);
    /** 总并行数 */
    const processParallel = 1 + process * pluginLevel;
    /** 总处理轮数 */
    const processRounds = Math.ceil(64 / processParallel);
    // 结果为总执行轮数*单配方耗时
    return processRounds * oneItemTick / 20;
  };

  // 计算当前选中斜线上的最小时间
  useEffect(() => {
    let minTime = Infinity;
    let minSpeed = -1;
    let minProcess = -1;

    // 只计算当前选中总数对应的斜线
    for (let i = 0; i <= Math.min(selectedCount, pluginCounts - 1); i++) {
      const j = selectedCount - i;
      if (j >= 0 && j < pluginCounts) {
        const time = calculateTime(i, j);
        if (time < minTime) {
          minTime = time;
          minSpeed = i;
          minProcess = j;
        }
      }
    }

    setMinTimeInfo({ time: minTime, speed: minSpeed, process: minProcess });
  }, [pluginLevel, selectedCount]);

  return (
    <>
      <p>假定处理一个物品初始用时{baseTime}tick（{baseTime / 20}s），本表计算处理64个物品所用时间（s）。</p>
      <p>点击第一列/行数字可高亮对应总数单元格。</p>
      <p>
        使用插件等级（速度插件、加工室插件）：
        <input
          type='number'
          value={pluginLevel}
          onChange={(e) => setPluginLevel(parseInt(e.target.value))}
          max={9}
        />
      </p>
      <table className='oritech-calculator'>
        <tbody>
          <tr>
            <td
              className='first-cell'
              rowSpan={2}
              colSpan={2}
            >
              加工\速度
            </td>
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
                className={selectedCount === speed ? 'highlight remark' : 'remark'}
              >
                {(1 + pluginLevel * 0.5 * speed) * 100}%
                <br />
                耗时{Math.floor(baseTime / (1 + speed * (pluginLevel * 0.5)))}t
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
              <td
                className={selectedCount === process ? 'highlight remark' : 'remark'}
              >
                {1 + process * pluginLevel}并行
                <br />
                {Math.ceil(64 / (1 + process * pluginLevel))}轮
              </td>
              {speedList.map((speed) => {
                const isMinTime = speed === minTimeInfo.speed && process === minTimeInfo.process;
                return (
                  <td
                    key={`${process}-${speed}`}
                    className={`${process + speed === selectedCount ? 'highlight' : ''} ${isMinTime ? 'min-time' : ''}`}
                  >
                    {calculateTime(speed, process).toFixed(2)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default OritechCalculator;
