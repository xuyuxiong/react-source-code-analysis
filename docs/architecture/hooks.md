# Hook 系统架构

Hooks 是 React 16.8+ 的核心特性，允许函数组件拥有状态和生命周期。

## 📦 模块位置

```
packages/react-reconciler/src/
├── ReactFiberHooks.js           # Hooks 核心实现
├── ReactHookEffectTags.js       # Effect 标签
└── ReactFiberDispatch.js        # 调度器集成
```

## 🎯 设计目标

1. **状态复用**：逻辑可以抽取为自定义 Hook
2. **简洁 API**：无需理解 this 绑定
3. **兼容旧代码**：可以与 Class 组件共存

## 🔗 数据结构

### Hook 链表

```javascript
// packages/react-reconciler/src/ReactFiberHooks.js
type Hook = {
  memoizedState: any,     // 当前状态
  baseState: any,         // 基础状态
  baseQueue: Update<any>, // 基础更新队列
  queue: UpdateQueue<any>, // 更新队列
  next: Hook | null,      // 下一个 Hook（链表）
};
```

### 链表结构

```
Component
   │
   ▼
Hook 0 (useState) → Hook 1 (useEffect) → Hook 2 (useContext) → null
   │                    │                      │
   ▼                    ▼                      ▼
 state               effects               context
```

## 🔄 工作原理

### 1. 首次渲染（mount）

```javascript
// 简化的 mount 流程
function mountWorkInProgressHook() {
  const hook = {
    memoizedState: null,
    baseState: null,
    baseQueue: null,
    queue: null,
    next: null,
  };
  
  // 添加到链表
  if (workInProgressHook === null) {
    workInProgressHook = hook;
    currentlyRenderingFiber.memoizedState = workInProgressHook;
  } else {
    workInProgressHook.next = hook;
    workInProgressHook = hook;
  }
  
  return workInProgressHook;
}
```

### 2. 更新渲染（update）

```javascript
// 简化的 update 流程
function updateWorkInProgressHook() {
  // 从 current Fiber 获取旧 Hook
  let current = currentHook.next;
  
  // 创建新的 WorkInProgress Hook
  let workInProgress = {
    ...current,
    next: null,
  };
  
  // 链接到链表
  workInProgressHook.next = workInProgress;
  workInProgressHook = workInProgress;
  
  return workInProgressHook;
}
```

### 3. 规则检查

```javascript
// 确保 Hooks 调用顺序一致
function updateHookTypesDev() {
  if (currentHook === null) {
    console.error('Rendered fewer hooks than expected.');
  }
  
  if (currentHook.type !== workInProgressHook.type) {
    console.error('Rendered different hooks than expected.');
  }
}
```

## 🔍 useState 实现

### mountState

```javascript
// packages/react-reconciler/src/ReactFiberHooks.js
function mountState(initialState) {
  // 1. 创建 Hook
  const hook = mountWorkInProgressHook();
  
  // 2. 处理初始状态（支持函数）
  if (typeof initialState === 'function') {
    initialState = initialState();
  }
  
  // 3. 创建更新队列
  const queue = {
    pending: null,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: initialState,
  };
  
  hook.queue = queue;
  hook.memoizedState = initialState;
  
  // 4. 创建 dispatch 函数
  const dispatch = (queue.dispatch = dispatchAction.bind(
    null,
    currentlyRenderingFiber,
    queue
  ));
  
  return [hook.memoizedState, dispatch];
}
```

### updateState

```javascript
function updateState() {
  // 1. 获取当前 Hook
  const hook = updateWorkInProgressHook();
  
  // 2. 处理更新队列
  const queue = hook.queue;
  
  // 3. 计算新状态
  return updateReducer(queue);
}
```

### dispatchAction

```javascript
function dispatchAction(fiber, queue, action) {
  // 1. 创建 Update 对象
  const update = {
    eventTime: requestEventTime(),
    lane: requestUpdateLane(fiber),
    action,
    hasEagerState: false,
    next: null,
  };
  
  // 2. 添加到队列
  const pending = queue.pending;
  if (pending === null) {
    // 第一个 update
    update.next = update;
  } else {
    // 插入到环状链表
    update.next = pending.next;
    pending.next = update;
  }
  queue.pending = update;
  
  // 3. 调度更新
  scheduleUpdateOnFiber(fiber, update.lane);
}
```

### updateReducer

```javascript
function updateReducer(queue) {
  // 1. 获取待处理的更新
  const pending = queue.pending;
  
  // 2. 遍历更新队列
  let first = pending.next;
  let newState = hook.baseState;
  
  while (first !== null) {
    const action = first.action;
    const reducer = queue.lastRenderedReducer;
    
    // 3. 计算新状态
    newState = reducer(newState, action);
    
    first = first.next;
  }
  
  // 4. 更新状态
  hook.memoizedState = newState;
  queue.lastRenderedState = newState;
  
  return [newState, queue.dispatch];
}
```

## 🔍 useEffect 实现

### Effect 结构

```javascript
type Effect = {
  tag: number,           // Effect 标签
  create: () => mixed,   // 创建函数
  destroy: (() => mixed) | null, // 清理函数
  deps: Array<mixed> | null,     // 依赖数组
  next: Effect,          // 下一个 Effect
};
```

### mountEffect

```javascript
function mountEffect(create, deps) {
  return mountEffectImpl(
    PassiveEffect | PassiveStaticEffect,
    PassiveEffect,
    create,
    deps
  );
}

function mountEffectImpl(tag, deps, create) {
  // 1. 创建 Effect
  const effect = {
    tag,
    create,
    destroy: null,
    deps,
    next: null,
  };
  
  // 2. 添加到组件的 effect 列表
  const componentUpdateQueue = currentlyRenderingFiber.updateQueue;
  const lastEffect = componentUpdateQueue.lastEffect;
  
  if (lastEffect === null) {
    componentUpdateQueue.lastEffect = effect.next = effect;
  } else {
    const firstEffect = lastEffect.next;
    lastEffect.next = effect;
    effect.next = firstEffect;
    componentUpdateQueue.lastEffect = effect;
  }
  
  // 3. 标记副作用
  currentlyRenderingFiber.flags |= tag;
  
  return effect;
}
```

### updateEffect

```javascript
function updateEffect(create, deps) {
  // 1. 获取旧 Effect
  const current = currentHook;
  
  // 2. 比较依赖
  const prevDeps = current.deps;
  if (deps !== null && prevDeps !== null) {
    // 快速比较依赖
    for (let i = 0; i < prevDeps.length && i < deps.length; i++) {
      if (Object.is(deps[i], prevDeps[i])) {
        continue;
      }
      // 依赖变化，需要重新执行
      return updateEffectImpl(create, deps);
    }
    // 依赖没变，跳过
    return updateEffectImpl(null, deps);
  }
  
  // 没有 deps 或 deps 变化，重新执行
  return updateEffectImpl(create, deps);
}
```

### Effect 执行时机

```javascript
// packages/react-reconciler/src/ReactFiberCommitWork.js
function commitPassiveEffectEffects(firstEffect, root) {
  forEachEffect(effect => {
    if (effect.tag & Passive) {
      // useEffect 的 create 函数
      const create = effect.create;
      effect.destroy = create();
    }
  });
}

function commitBeforeMutationEffects(firstEffect) {
  forEachEffect(effect => {
    if (effect.tag & Layout) {
      // useLayoutEffect 的 create 函数（同步执行）
      const create = effect.create;
      effect.destroy = create();
    }
  });
}
```

## 🔍 useContext 实现

```javascript
function mountContext(Context) {
  // 1. 创建 Hook
  const hook = mountWorkInProgressHook();
  
  // 2. 读取当前值
  const value = Context._currentValue;
  
  // 3. 订阅变化
  if (Context._currentValue2 !== undefined) {
    // React 18+ 支持多个并发渲染
    Context._currentValue2 = value;
  }
  
  hook.memoizedState = value;
  
  return value;
}

function updateContext(Context) {
  // 1. 获取当前 Hook
  const hook = updateWorkInProgressHook();
  
  // 2. 读取最新值
  const value = Context._currentValue;
  
  hook.memoizedState = value;
  
  return value;
}
```

## 🔍 useMemo/useCallback 实现

### mountMemo

```javascript
function mountMemo(nextCreate, deps) {
  // 1. 创建 Hook
  const hook = mountWorkInProgressHook();
  
  // 2. 执行创建函数
  const nextValue = nextCreate();
  
  // 3. 保存值和依赖
  hook.memoizedState = [nextValue, deps];
  
  return nextValue;
}
```

### updateMemo

```javascript
function updateMemo(nextCreate, deps) {
  // 1. 获取当前 Hook
  const hook = updateWorkInProgressHook();
  
  // 2. 获取旧值和依赖
  const prevState = hook.memoizedState;
  
  // 3. 比较依赖
  if (deps !== null) {
    const prevDeps = prevState[1];
    if (areHookInputsEqual(deps, prevDeps)) {
      // 依赖没变，返回缓存值
      return prevState[0];
    }
  }
  
  // 4. 依赖变化，重新计算
  const nextValue = nextCreate();
  hook.memoizedState = [nextValue, deps];
  
  return nextValue;
}
```

### useCallback

```javascript
// useCallback 本质是 useMemo 的语法糖
function useCallback(callback, deps) {
  return useMemo(() => callback, deps);
}
```

## 🎯 自定义 Hooks

### 原理

自定义 Hook 本质是调用内置 Hooks 的组合：

```javascript
function useLocalStorage(key, initialValue) {
  // 内部调用 useState
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });
  
  // 内部调用 useEffect
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(storedValue));
  }, [key, storedValue]);
  
  return [storedValue, setStoredValue];
}
```

### 链表顺序保证

```javascript
// React 通过调用顺序保证 Hook 正确性
function MyComponent() {
  const [a, setA] = useState(0);     // Hook 0
  const [b, setB] = useState(0);     // Hook 1
  useEffect(() => {});               // Hook 2
  
  //  ciclo 必须与上次渲染顺序一致
}
```

## 🔬 调试技巧

### 观察 Hook 链表

```javascript
// 在浏览器控制台
const fiber = document.querySelector('[data-reactroot]')._reactRootContainer._internalRoot.current;

function printHooks(fiber) {
  let hook = fiber.memoizedState;
  let i = 0;
  
  while (hook) {
    console.log(`Hook ${i}:`, hook.memoizedState);
    hook = hook.next;
    i++;
  }
}

printHooks(fiber.child);
```

### 检查 Hook 顺序

```javascript
// 开发模式下的检查
if (__DEV__) {
  if (currentHook !== null && workInProgressHook !== null) {
    if (currentHook.type !== workInProgressHook.type) {
      console.error(
        `Rendered different hooks at position ${index}`
      );
    }
  }
}
```

## 🐛 常见问题

### Q: 为什么 Hooks 必须在顶层调用？

**A**: React 依赖调用顺序来匹配 Hook，条件调用会导致顺序错乱。

### Q: 闭包陷阱如何解决？

```jsx
// ❌ 问题代码
function Counter() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const id = setInterval(() => {
      console.log(count); // 总是 0
    }, 1000);
    return () => clearInterval(id);
  }, []); // deps 为空
}

// ✅ 解决方案 1：添加依赖
useEffect(() => {
  const id = setInterval(() => {
    console.log(count);
  }, 1000);
  return () => clearInterval(id);
}, [count]);

// ✅ 解决方案 2：使用函数更新
useEffect(() => {
  const id = setInterval(() => {
    setCount(c => c + 1); // 使用最新值
  }, 1000);
  return () => clearInterval(id);
}, []);

// ✅ 解决方案 3：useRef
function Counter() {
  const countRef = useRef(count);
  countRef.current = count;
  
  useEffect(() => {
    const id = setInterval(() => {
      console.log(countRef.current);
    }, 1000);
    return () => clearInterval(id);
  }, []);
}
```

---

## 📖 下一步

- [Suspense 架构](./suspense)
- [useState 源码解析](../implementation/use-state)