/**
 * 通用防抖工具。
 *
 * 把一个会高频触发的函数（如 input 监听、resize、滚动）
 * 包装为「停止触发后 wait 毫秒才真正执行」的版本。
 *
 * 同一时刻只会有一个 pending 的调用；新输入会重置计时器。
 * 返回的函数自带 `cancel()`，用于组件卸载时清理未触发的回调。
 *
 * @example
 *   const onSearch = debounce((q: string) => fetch(q), 200)
 *   // ...
 *   onSearch(query)
 *   onCancel(() => onSearch.cancel())
 */
export interface DebouncedFunction<TArgs extends readonly unknown[]> {
  (...args: TArgs): void;
  cancel: () => void;
}

export function debounce<TArgs extends readonly unknown[]>(
  fn: (...args: TArgs) => void,
  wait: number,
): DebouncedFunction<TArgs> {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const debounced = ((...args: TArgs) => {
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, wait);
  }) as DebouncedFunction<TArgs>;

  debounced.cancel = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return debounced;
}
