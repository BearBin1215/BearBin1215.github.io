import { useCallback, useState } from "react";

/**
 * 与 localStorage 同步的状态 Hook，初始化时读取 localStorage，更新时写入。
 * 适合需要在页面刷新后保留的简单状态（如音量）。
 *
 * 由于 JSON.parse 后的值类型不可信（用户可能手动改写 localStorage，或历史遗留数据格式不一致），
 * 当提供 `validate` 时仅接受通过校验的值，否则回退到 `initialValue`。
 *
 * @param key localStorage 键名
 * @param initialValue 初始值（localStorage 无值、读取失败或校验不通过时使用）
 * @param validate 可选的类型守卫，校验从 localStorage 读取的值是否合法
 * @returns [value, setValue] 元组，setValue 行为与 useState 一致
 */
function useLocalStorage<T>(
  key: string,
  initialValue: T,
  validate?: (value: unknown) => value is T,
) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }
      const parsed: unknown = JSON.parse(item);
      if (validate && !validate(parsed)) {
        return initialValue;
      }
      return parsed as T;
    } catch {
      return initialValue;
    }
  });

  const setStoredValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // 忽略写入失败（隐私模式/磁盘满等）
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, setStoredValue] as const;
}

export { useLocalStorage };
