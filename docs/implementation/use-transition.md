# useTransition 实现

useTransition 是 React 18 并发特性的核心 Hook，用于将更新标记为"非紧急"，实现可中断渲染。

## 📦 模块位置

```
packages/react-reconciler/src/
├── ReactFiberHooks.js       # useTransition Hook 实现
└── ReactFiberWorkLoop.js    # 调度逻辑
```

## 🔍 数据结构

### useTransition Hook 状态

```javascript
// useTransition 返回 [isPending, startTransition]
// Hook.memoizedState 存储 [boolean, () => void]
```

### Transition 状态

```javascript
// ReactCurrentBatchConfig.transition 用于标记当前是否在 transition 中
type TransitionStatus = 0 | 1;  // 0: 无 transition, 1: 有 transition
```

## 🔬 useTransition 实现

### mountTransition（首次渲染）

```javascript
// packages/react-reconciler/src/ReactFiberHooks.js

function mountTransition(): [
  boolean,
  (callback: () => void, options?: StartTransitionOptions) => void,
] {
  const hook = mountWorkInProgressHook();
  
  // 创建初始状态
  const [isPending, setPending] = mountStateImpl((false: Thenable<boolean> | boolean));
  
  // 创建 dispatch 函数
  const setPending: boolean => void = (dispatchOptimisticSetState.bind(
    null,
    currentlyRenderingFiber,
    false,
    ((isPending.queue: any): UpdateQueue<boolean, boolean>),
  ): any);
  
  // 创建 startTransition 函数
  const start = (startTransition: any).bind(
    null,
    currentlyRenderingFiber,
    ((isPending.queue: any): UpdateQueue<boolean, boolean>),
    true,
    false,
  );
  
  // 存储 [isPending, start]
  hook.memoizedState = [false, start];
  
  return [false, start];
}
```

### updateTransition（更新渲染）

```javascript
function updateTransition(): [
  boolean,
  (callback: () => void, options?: StartTransitionOptions) => void,
] {
  const hook = updateWorkInProgressHook();
  const currentStateHook = ((currentHook: any): Hook);
  
  // 获取 pending 状态
  const [isPending] = updateState(false);
  
  // 获取 start 函数
  const start = hook.memoizedState[1];
  
  return [isPending, start];
}
```

### startTransition（核心实现）

```javascript
// packages/react-reconciler/src/ReactFiberHooks.js

function startTransition(
  fiber: Fiber,
  queue: UpdateQueue<boolean | Thenable<boolean>, BasicStateAction<boolean | Thenable<boolean>>>,
  pendingState: boolean,
  finishedState: boolean,
  callback: () => mixed,
  options?: StartTransitionOptions,
): void {
  const previousPriority = getCurrentUpdatePriority();
  setCurrentUpdatePriority(
    higherEventPriority(previousPriority, ContinuousEventPriority),
  );

  const prevTransition = ReactSharedInternals.T;
  const currentTransition: Transition = ({}: any);
  
  // React 18 新特性支持
  if (enableViewTransition) {
    currentTransition.types =
      prevTransition !== null
        ? prevTransition.types
        : null;
  }
  
  if (enableGestureTransition) {
    currentTransition.gesture = null;
  }
  
  if (enableTransitionTracing) {
    currentTransition.name =
      options !== undefined && options.name !== undefined ? options.name : null;
    currentTransition.startTime = now();
  }
  
  if (__DEV__) {
    currentTransition._updatedFibers = new Set();
  }

  // 标记为 transition 更新
  ReactSharedInternals.T = currentTransition;
  
  // 设置 pending 状态
  dispatchOptimisticSetState(fiber, false, queue, pendingState);

  try {
    const returnValue = callback();
    const onStartTransitionFinish = ReactSharedInternals.S;
    if (onStartTransitionFinish !== null) {
      onStartTransitionFinish(currentTransition, returnValue);
    }

    // 处理异步 transition
    if (
      returnValue !== null &&
      typeof returnValue === 'object' &&
      typeof returnValue.then === 'function'
    ) {
      const thenable = ((returnValue: any): Thenable<mixed>);
      if (__DEV__) {
        ReactSharedInternals.asyncTransitions++;
        thenable.then(releaseAsyncTransition, releaseAsyncTransition);
      }
      
      // 创建 thenable 用于 Suspense
      const thenableForFinishedState = chainThenableValue(
        thenable,
        finishedState,
      );
      
      dispatchSetStateInternal(
        fiber,
        queue,
        (thenableForFinishedState: any),
        requestUpdateLane(fiber),
      );
    } else {
      dispatchSetStateInternal(
        fiber,
        queue,
        finishedState,
        requestUpdateLane(fiber),
      );
    }
  } catch (error) {
    // 处理错误
    const rejectedThenable: RejectedThenable<boolean> = {
      then() {},
      status: 'rejected',
      reason: error,
    };
    
    dispatchSetStateInternal(
      fiber,
      queue,
      rejectedThenable,
      requestUpdateLane(fiber),
    );
  } finally {
    setCurrentUpdatePriority(previousPriority);

    if (prevTransition !== null && currentTransition.types !== null) {
      prevTransition.types = currentTransition.types;
    }
    ReactSharedInternals.T = prevTransition;

    if (__DEV__) {
      if (prevTransition === null && currentTransition._updatedFibers) {
        const updatedFibersCount = currentTransition._updatedFibers.size;
        currentTransition._updatedFibers.clear();
        if (updatedFibersCount > 10) {
          console.warn(
            'Detected a large number of updates inside startTransition. ' +
              'If this is due to a subscription please re-write it to use React provided hooks. ' +
              'Otherwise concurrent mode guarantees are off the table.',
          );
        }
      }
    }
  }
}
```

## 📊 Lane 优先级系统

### Transition Lane 分配

```javascript
// packages/react-reconciler/src/ReactFiberLane.js

// Transition Lanes（低优先级）
const TransitionLane1 = 0b00000000000000000000000000000100;
const TransitionLane2 = 0b00000000000000000000000000001000;
const TransitionLane3 = 0b00000000000000000000000000010000;
const TransitionLane4 = 0b00000000000000000000000000100000;

// 获取下一个可用的 Transition Lane
let transitionLane = TransitionLane1;

function requestTransitionLane(): Lane {
  // 循环使用 Transition Lanes
  const lane = transitionLane;
  transitionLane = (transitionLane << 1) | (TransitionLanes & ~transitionLane);
  
  if ((transitionLane & TransitionLanes) === 0) {
    transitionLane = TransitionLane1;
  }
  
  return lane;
}
```

### 优先级层次

```javascript
// 优先级从高到低
const SyncLane = 0b00000000000000000000000000000001;        // 同步
const InputContinuousLane = 0b00000000000000000000000000000110;  // 输入
const DefaultLane = 0b00000000000000000000000000010000;     // 默认
const TransitionLanes = 0b00000000000000000000000000111100;  // Transition
const IdleLane = 0b00000000000000000000000001000000;        // 空闲
```

## 📊 完整流程图

```mermaid
graph TD
    A[useTransition] --> B[mountTransition/updateTransition]
    B --> C[返回 [isPending, startTransition]]
    
    D[startTransition(callback)] --> E[设置 ReactCurrentBatchConfig.T = 1]
    E --> F[设置 pending = true]
    F --> G[执行 callback]
    G --> H{有异步操作？}
    H -->|是 | I[创建 thenable]
    H -->|否 | J[直接 dispatch]
    
    I --> K[等待 thenable 完成]
    K --> L[pending = false]
    J --> L
    
    M[Provider value 变化] --> N[触发重新渲染]
    N --> O{有 transition lane？}
    O -->|是 | P[低优先级渲染]
    O -->|否 | Q[正常渲染]
    
    P --> R{有高优先级中断？}
    R -->|是 | S[暂停 transition]
    R -->|否 | T[完成 transition]
    
    S --> U[处理高优先级]
    U --> T
```

## 💡 实战技巧

### 1. 基本使用模式

```jsx
function TabContainer() {
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState('home');
  
  function selectTab(nextTab) {
    startTransition(() => {
      setTab(nextTab);  // 非紧急更新
    });
  }
  
  return (
    <>
      <TabBar>
        <TabButton
          isActive={tab === 'home'}
          onClick={() => selectTab('home')}
        >
          Home
        </TabButton>
        <TabButton
          isActive={tab === 'posts'}
          onClick={() => selectTab('posts')}
        >
          Posts
        </TabButton>
      </TabBar>
      
      {isPending && <LoadingSpinner />}
      
      <TabContent tab={tab} />
    </>
  );
}
```

### 2. 搜索功能优化

```jsx
function SearchResults() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();
  
  function handleChange(e) {
    const nextQuery = e.target.value;
    
    // 紧急更新：立即响应输入
    setQuery(nextQuery);
    
    // 非紧急更新：搜索可以延迟
    startTransition(() => {
      fetchResults(nextQuery).then(setResults);
    });
  }
  
  return (
    <>
      <input value={query} onChange={handleChange} />
      {isPending && <LoadingSpinner />}
      <ResultsList results={results} />
    </>
  );
}
```

### 3. 列表过滤优化

```jsx
function FilterableList({ items }) {
  const [filterText, setFilterText] = useState('');
  const [isPending, startTransition] = useTransition();
  const [displayItems, setDisplayItems] = useState(items);
  
  function handleChange(e) {
    const nextFilterText = e.target.value;
    
    // 输入框立即响应
    setFilterText(nextFilterText);
    
    // 过滤操作可以延迟
    startTransition(() => {
      const filtered = items.filter(item =>
        item.name.toLowerCase().includes(nextFilterText.toLowerCase())
      );
      setDisplayItems(filtered);
    });
  }
  
  return (
    <>
      <input value={filterText} onChange={handleChange} />
      {isPending && <LoadingSpinner />}
      <List items={displayItems} />
    </>
  );
}
```

### 4. 多步骤表单

```jsx
function MultiStepForm() {
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  
  function nextStep() {
    startTransition(() => {
      setStep(s => s + 1);  // 表单切换可以延迟
    });
  }
  
  function submitForm(data) {
    // 提交是紧急的
    setStep(s => s + 1);
  }
  
  return (
    <>
      {isPending && <LoadingSpinner />}
      <FormStep 
        step={step} 
        onNext={nextStep} 
        onSubmit={submitForm} 
      />
    </>
  );
}
```

### 5. 配合 Suspense 使用

```jsx
function SearchPage() {
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState('');
  
  function handleSearch(newQuery) {
    startTransition(() => {
      setQuery(newQuery);  // 触发 Suspense 边界
    });
  }
  
  return (
    <>
      <input 
        value={query} 
        onChange={e => handleSearch(e.target.value)} 
      />
      {isPending && <LoadingSpinner />}
      <Suspense fallback={<LoadingSpinner />}>
        <SearchResults query={query} />
      </Suspense>
    </>
  );
}
```

## ⚠️ 注意事项

### 1. 使用场景选择

```jsx
// ✅ 适合使用 useTransition
- 列表过滤/排序
- Tab 切换
- 搜索建议
- 大数据渲染
- 可以延迟的 UI 更新

// ❌ 不适合使用 useTransition
- 用户输入反馈
- 按钮点击响应
- 关键状态更新
- 错误处理
```

### 2. 与 useDeferredValue 的区别

```jsx
// useTransition - 控制 setState
function ComponentA() {
  const [isPending, startTransition] = useTransition();
  
  function handleChange(value) {
    startTransition(() => {
      setState(value);  // 控制状态更新
    });
  }
}

// useDeferredValue - 延迟派生值
function ComponentB() {
  const [text, setText] = useState('');
  const deferredText = useDeferredValue(text);  // 延迟计算结果
  
  return (
    <>
      <input value={text} onChange={e => setText(e.target.value)} />
      <ExpensiveList text={deferredText} />
    </>
  );
}
```

### 3. 异步操作处理

```jsx
// ✅ 正确处理异步 transition
function AsyncComponent() {
  const [isPending, startTransition] = useTransition();
  
  async function handleAction() {
    startTransition(async () => {
      // 异步操作会被正确包装
      await fetchData();
      setState(newData);
    });
  }
}
```

### 4. 优先级层次

```
优先级从高到低：

1. Sync（同步）
   └── flushSync(() => setState())

2. Input Continuous（输入连续）
   └── 用户输入、点击

3. Default（默认）
   └── 普通 setState

4. Transition（过渡）⭐ useTransition
   └── startTransition(() => setState())

5. Idle（空闲）
   └── 后台任务
```

## 🔬 调试技巧

### 追踪 transition 执行

```javascript
// 开发模式下查看 transition 状态
function DebugTransition() {
  const [isPending, startTransition] = useTransition();
  
  useEffect(() => {
    console.log('Transition pending:', isPending);
  }, [isPending]);
  
  return null;
}
```

### 观察 Lane 分配

```javascript
// 在 React DevTools 中查看：
// 1. 打开 Profiler
// 2. 记录组件更新
// 3. 查看 Lane 分配
```

### 性能分析

```javascript
// 使用 React Profiler API
function ProfiledComponent() {
  const [isPending, startTransition] = useTransition();
  
  function handleChange(value) {
    startTransition(() => {
      // 性能关键代码
      console.time('transition');
      setState(value);
      console.timeEnd('transition');
    });
  }
}
```

## 🐛 常见问题

### Q: useTransition 有什么用？

**A**: 将更新标记为非紧急，允许 React 中断渲染以响应更紧急的更新，提升用户体验。

### Q: startTransition 包裹的 setState 会怎样？

**A**: 使用较低的 Transition Lane 优先级，可以被高优先级更新中断，完成后自动清除 pending 状态。

### Q: 什么时候应该使用 useTransition？

**A**:
- 列表过滤/排序
- Tab 切换
- 搜索建议
- 大数据渲染
- 任何可以延迟的 UI 更新

### Q: useTransition 和 useDeferredValue 有什么区别？

**A**:
- useTransition：控制状态更新（主动）
- useDeferredValue：延迟派生值（被动）

### Q: 如何调试 transition？

**A**: 使用 React DevTools Profiler 查看组件更新，观察 isPending 状态变化，或使用 console.log 追踪。

---

## 📖 下一步

- [useDeferredValue 实现](./use-deferred-value)
- [useId 实现](./use-id)