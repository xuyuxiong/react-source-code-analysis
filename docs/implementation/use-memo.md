# useMemo / useCallback 实现

useMemo 和 useCallback 是 React 性能优化的核心 Hook，它们的实现机制相似但用途不同。

## 📦 模块位置

```
packages/react-reconciler/src/
└── ReactFiberHooks.js    # Hooks 核心实现
```

## 🔍 数据结构

### useMemo Hook 结构

```javascript
// useMemo Hook 的 memoizedState 存储 [值, 依赖数组]
// 结构：[cachedValue, dependencies]

// Hook 结构保持不变
type Hook = {
  memoizedState: any,
  baseState: any,
  baseQueue: Update<any>,
  queue: UpdateQueue<any>,
  next: Hook,
};
```

### useCallback Hook 结构

```javascript
// useCallback Hook 的 memoizedState 直接存储回调函数
// 结构：cachedCallback
// 依赖数组存储在 Hook.queue.pending 中
```

## 🔬 useMemo 实现

### mountMemo

```javascript
// packages/react-reconciler/src/ReactFiberHooks.js

function mountMemo<T>(
  nextCreate: () => T,
  deps: Array<mixed> | void | null,
): T {
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  
  // 执行创建函数
  const nextValue = nextCreate();
  
  // React 18 StrictMode 下双重执行
  if (shouldDoubleInvokeUserFnsInHooksDEV) {
    setIsStrictModeForDevtools(true);
    try {
      nextCreate();
    } finally {
      setIsStrictModeForDevtools(false);
    }
  }
  
  // 存储 [值, 依赖数组]
  hook.memoizedState = [nextValue, nextDeps];
  
  return nextValue;
}
```

### updateMemo

```javascript
function updateMemo<T>(
  nextCreate: () => T,
  deps: Array<mixed> | void | null,
): T {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  const prevState = hook.memoizedState;
  
  // prevState 是 [值, 依赖数组]
  if (nextDeps !== null) {
    const prevDeps: Array<mixed> | null = prevState[1];
    
    // 使用 Object.is 比较依赖
    if (areHookInputsEqual(nextDeps, prevDeps)) {
      // 依赖未变化，返回缓存值
      return prevState[0];
    }
  }
  
  // 依赖变化，重新计算
  const nextValue = nextCreate();
  
  // React 18 StrictMode 下双重执行
  if (shouldDoubleInvokeUserFnsInHooksDEV) {
    setIsStrictModeForDevtools(true);
    try {
      nextCreate();
    } finally {
      setIsStrictModeForDevtools(false);
    }
  }
  
  // 更新缓存
  hook.memoizedState = [nextValue, nextDeps];
  
  return nextValue;
}
```

### rerenderMemo

```javascript
function rerenderMemo<T>(
  nextCreate: () => T,
  deps: Array<mixed> | void | null,
): T {
  // 重渲染阶段与更新阶段相同
  return updateMemo(nextCreate, deps);
}
```

## 🔬 useCallback 实现

### mountCallback

```javascript
function mountCallback<T>(
  callback: T,
  deps: Array<mixed> | void | null,
): T {
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  
  // 直接存储回调函数
  hook.memoizedState = callback;
  
  // 依赖数组存储在 Hook 的 queue.pending 中
  // 注意：useCallback 不使用 queue，但依赖数组需要存储
  // 实际实现中依赖数组直接作为 Hook.memoizedState[1] 存储
  
  return callback;
}
```

### updateCallback

```javascript
function updateCallback<T>(
  callback: T,
  deps: Array<mixed> | void | null,
): T {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  const prevState = hook.memoizedState;
  
  // prevState 是 [callback, deps]
  if (nextDeps !== null) {
    const prevDeps: Array<mixed> | null = prevState[1];
    
    // 依赖比较
    if (areHookInputsEqual(nextDeps, prevDeps)) {
      // 依赖未变化，返回缓存的回调
      return prevState[0];
    }
  }
  
  // 依赖变化，返回新回调
  hook.memoizedState = [callback, nextDeps];
  
  return callback;
}
```

### rerenderCallback

```javascript
function rerenderCallback<T>(
  callback: T,
  deps: Array<mixed> | void | null,
): T {
  // 重渲染阶段与更新阶段相同
  return updateCallback(callback, deps);
}
```

## 🔍 依赖比较实现

### areHookInputsEqual

```javascript
function areHookInputsEqual(
  nextDeps: Array<mixed>,
  prevDeps: Array<mixed> | null,
): boolean {
  if (__DEV__) {
    if (ignorePreviousDependencies) {
      // 热重载时强制重新执行
      return false;
    }
  }

  if (prevDeps === null) {
    if (__DEV__) {
      console.error(
        '%s received a final argument during this render, but not during ' +
          'the previous render. Even though the final argument is optional, ' +
          'its type cannot change between renders.',
        currentHookNameInDev,
      );
    }
    return false;
  }

  if (__DEV__) {
    // 开发模式下检查长度变化
    if (nextDeps.length !== prevDeps.length) {
      console.error(
        'The final argument passed to %s changed size between renders. The ' +
          'order and size of this array must remain constant.\n\n' +
          'Previous: %s\n' +
          'Incoming: %s',
        currentHookNameInDev,
        `[${prevDeps.join(', ')}]`,
        `[${nextDeps.join(', ')}]`,
      );
    }
  }

  // 逐项使用 Object.is 比较
  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    if (is(nextDeps[i], prevDeps[i])) {
      continue;
    }
    return false;
  }
  return true;
}
```

### Object.is 比较

```javascript
// 使用 React 内部的 is 函数（Object.is 的 polyfill）
// 与 === 的区别：
is(0, -0);        // false
0 === -0;         // true

is(NaN, NaN);     // true
NaN === NaN;      // false

is({}, {});       // false (引用不同)
```

## 📊 完整流程图

```mermaid
graph TD
    A[useMemo/Callback] --> B[首次渲染？]
    B -->|是 | C[mount 阶段]
    C --> D[创建 Hook]
    D --> E[执行 nextCreate 或存储 callback]
    E --> F[存储 [值, 依赖] 或 [callback, 依赖]]
    F --> G[返回值]
    
    B -->|否 | H[update 阶段]
    H --> I[获取上次依赖]
    I --> J{依赖变化？}
    J -->|否 | K[返回缓存值]
    J -->|是 | L[重新执行 nextCreate 或返回新 callback]
    L --> M[更新缓存]
    M --> G
    K --> G
```

## 💡 实战技巧

### 1. 避免不必要的计算

```jsx
// ✅ 推荐：缓存昂贵的计算
const sortedList = useMemo(() => {
  return list.slice().sort((a, b) => a.value - b.value);
}, [list]);

// ❌ 不推荐：简单计算不需要 memo
const doubled = useMemo(() => count * 2, [count]);  // 过度优化
```

### 2. 传递给子组件

```jsx
// ✅ 推荐：避免子组件不必要的重渲染
const handler = useCallback(() => {
  doSomething(id);
}, [id]);

return <Child onClick={handler} />;

// ❌ 不推荐：每次渲染都创建新函数
return (
  <Child onClick={() => doSomething(id)} />
);
```

### 3. 配合 React.memo

```jsx
// 父组件
function Parent({ items }) {
  const [count, setCount] = useState(0);
  
  // 稳定的 memo
  const sortedItems = useMemo(() => {
    return items.slice().sort();
  }, [items]);
  
  // 稳定的 callback
  const handleClick = useCallback((item) => {
    console.log(item);
  }, []);
  
  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      <MemoizedList items={sortedItems} onClick={handleClick} />
    </>
  );
}

// 子组件
const MemoizedList = React.memo(function List({ items, onClick }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id} onClick={() => onClick(item)}>
          {item.name}
        </li>
      ))}
    </ul>
  );
});
```

### 4. 依赖项陷阱

```jsx
// ❌ 错误：对象作为依赖
function Component() {
  const config = { timeout: 5000 };
  
  useEffect(() => {
    fetchData(config);
  }, [config]);  // 每次都执行（新对象）
}

// ✅ 正确：展开或提取
function Component() {
  const timeout = 5000;
  
  useEffect(() => {
    fetchData({ timeout });
  }, [timeout]);
}

// ✅ 或使用 useMemo 缓存对象
function Component() {
  const config = useMemo(() => ({ timeout: 5000 }), []);
  
  useEffect(() => {
    fetchData(config);
  }, [config]);
}
```

### 5. React 18 StrictMode 双重执行

```jsx
// React 18 StrictMode 下，useMemo 的创建函数会执行两次
const expensiveValue = useMemo(() => {
  console.log('Computing...');  // 会打印两次
  return expensiveCalculation(data);
}, [data]);

// 确保创建函数是纯函数，无副作用
```

## ⚠️ 注意事项

### 1. 不要过度优化

```jsx
// ❌ 不推荐：简单值不需要 memo
const name = useMemo(() => 'John', []);

// ✅ 推荐：只有计算昂贵时才使用
const sortedData = useMemo(() => {
  return hugeData.slice().sort(compare);
}, [hugeData]);
```

### 2. 依赖数组的陷阱

```jsx
// ❌ 错误：函数作为依赖
const handler = () => {};
useMemo(() => {}, [handler]);  // 每次都会重新计算

// ✅ 正确：使用 useCallback 稳定函数
const handler = useCallback(() => {}, []);
useMemo(() => {}, [handler]);
```

### 3. useCallback 的 stale closure

```jsx
// ❌ 错误：闭包陷阱
function Component() {
  const [count, setCount] = useState(0);
  
  const handleClick = useCallback(() => {
    console.log(count);  // 总是初始值
  }, []);
}

// ✅ 正确：包含依赖或使用 ref
function Component() {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);
  countRef.current = count;
  
  const handleClick = useCallback(() => {
    console.log(countRef.current);  // 最新值
  }, []);
}
```

## 🔬 useMemo vs useCallback

### 使用场景区别

| Hook | 适用场景 | 返回值 | 存储结构 |
|------|---------|--------|----------|
| useMemo | 计算结果缓存 | 值 | [值, 依赖] |
| useCallback | 函数引用稳定 | 函数 | [函数, 依赖] |

### 等价关系

```jsx
// useCallback 等价于 useMemo 的语法糖
const fn = useCallback(() => {
  doSomething(a, b);
}, [a, b]);

// 等价于
const fn = useMemo(() => {
  return () => {
    doSomething(a, b);
  };
}, [a, b]);
```

## 🔍 优化原理

### 1. 减少子组件渲染

```jsx
// 没有 useMemo/useCallback
function Parent() {
  const [count, setCount] = useState(0);
  const handler = () => {};
  const value = {};
  
  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      <Child handler={handler} value={value} />
    </>
  );
}

// Child 每次都会重渲染（新引用）

// 有 useMemo/useCallback
function Parent() {
  const [count, setCount] = useState(0);
  const handler = useCallback(() => {}, []);
  const value = useMemo(() => ({}), []);
  
  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      <Child handler={handler} value={value} />
    </>
  );
}

// Child 不会重渲染（引用稳定）
```

### 2. 稳定性传递

```jsx
// 依赖链的稳定性
function App() {
  const [data, setData] = useState([]);
  
  // 稳定的 memo
  const sortedData = useMemo(() => {
    return data.slice().sort();
  }, [data]);
  
  // 稳定的 callback
  const handleClick = useCallback((item) => {
    console.log(item);
  }, []);
  
  // 稳定的对象
  const config = useMemo(() => ({
    onClick: handleClick,
    items: sortedData,
  }), [handleClick, sortedData]);
  
  return <List config={config} />;
}
```

## 🔬 调试技巧

### 观察 memo 效果

```javascript
// 在组件中添加日志
function ExpensiveComponent({ data }) {
  const result = useMemo(() => {
    console.log('Computing...');
    return expensiveCalculation(data);
  }, [data]);
  
  return <div>{result}</div>;
}

// 观察控制台，如果依赖没变不会打印
```

### 检查依赖变化

```javascript
// 自定义 Hook 调试
function useDebugMemo(create, deps) {
  const prevDepsRef = useRef();
  
  useEffect(() => {
    if (prevDepsRef.current) {
      const changed = deps.some((dep, i) => 
        !Object.is(dep, prevDepsRef.current[i])
      );
      if (changed) {
        console.log('Deps changed:', {
          prev: prevDepsRef.current,
          next: deps,
        });
      }
    }
    prevDepsRef.current = deps;
  });
  
  return useMemo(create, deps);
}
```

## 🐛 常见问题

### Q: useMemo 一定能提高性能吗？

**A**: 不一定。useMemo 本身有开销，只有当计算成本 > 开销时才有收益。

```jsx
// ❌ 不值得优化
const doubled = useMemo(() => count * 2, [count]);

// ✅ 值得优化
const sorted = useMemo(() => {
  return hugeData.slice().sort(compare);
}, [hugeData]);
```

### Q: 依赖数组可以是空数组吗？

**A**: 可以，表示只计算一次。

```jsx
const initialValue = useMemo(() => {
  return expensiveSetup();
}, []);
```

### Q: 可以使用 useRef 代替 useMemo 吗？

**A**: 某些情况下可以，但 useRef 不触发重渲染。

```jsx
// 不需要触发渲染时使用 ref
const ref = useRef(null);

useEffect(() => {
  ref.current = expensiveCalculation();
}, []);
```

### Q: 为什么 useMemo 在 StrictMode 下执行两次？

**A**: React 18 StrictMode 会双重调用函数帮助检测副作用。

```jsx
const value = useMemo(() => {
  console.log('Computing...');  // 会打印两次
  return expensiveCalculation(data);
}, [data]);

// 确保创建函数是纯函数
```

---

## 📖 下一步

- [useRef 实现](./use-ref)
- [useContext 实现](./use-context)