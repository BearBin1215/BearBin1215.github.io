/**
 * @description 性能优化相关函数
 */

/**
 * 防抖
 * @param {() => void} func - 执行的函数
 * @param {number} interval - 时间间隔
 * @returns {() => void} - 返回
 */
const debounce = (func: () => void, interval: number): (() => void) => {
  let timeout: NodeJS.Timeout | null;
  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(func, interval);
  };
};

/**
 * 节流
 * @param {() => void} func - 执行的函数
 * @param {number} interval - 时间间隔
 * @returns {() => void} - 返回
 */
const throttle = (func: () => void, interval: number): (() => void) => {
  let lastFunc: NodeJS.Timeout;
  let lastRan: number;
  return () => {
    if (!lastRan) {
      func();
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if ((Date.now() - lastRan) >= interval) {
          func();
          lastRan = Date.now();
        }
      }, interval - (Date.now() - lastRan));
    }
  };
};

export {
  debounce,
  throttle
};