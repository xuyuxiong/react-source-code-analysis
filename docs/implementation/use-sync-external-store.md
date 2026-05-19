# useSyncExternalStore 实现

useSyncExternalStore 是 React 18 新增的 Hook，用于订阅外部数据源（如 Redux、Zustand 等状态管理库）。

## 📦 模块位置

```
packages/react-reconciler/src/
└── ReactFiberHooks.js    # useSyncExternalStore 实现
```

## 🔍 问题背景

### 并发渲染中的撕裂问题

```
并发渲染时可能出现数据撕裂：

时间线：
T1: 开始渲染（读取 store = A）
T2: 外部数据变化（store = B）
T3: 渲染被中断
T4: 恢复渲染（读取 store = B）
T5: Commit → 显示混合状态（部分 A，部分 B）❌
```

### 使用场景

```javascript
// 外部数据源示例：
// - Redux store
// - Zustand store
// - 浏览器 API（网络状态、主题）
// - localStorage
// - 第三方库状态
```

## 🔬 Hook 签名

```typescript
function useSyncExternalStore<Snapshot>(
  subscribe: (onStoreChange: () => void) => () => void,
  getSnapshot: () => Snapshot,
  getServerSnapshot?: () => Snapshot,
): Snapshot;
```

### 参数说明

| 参数 | 类型 | 说明 |
|------|------|------|
| subscribe | (callback) => unsubscribe | 订阅函数，返回取消订阅函数 |
| getSnapshot | () => Snapshot | 获取当前快照（数据） |
| getServerSnapshot | () => Snapshot | SSR 时获取快照（可选） |

## 🔬 核心实现

### Hook 入口

```javascript
// packages/react-reconciler/src/ReactFiberHooks.js

function useSyncExternalStore(
  subscribe: () => () => void,
  getSnapshot: () => any,
  getServerSnapshot?: () => any,
): any {
  // 1. 检查是否在服务器端渲染
  if (getServerSnapshot === undefined) {
    throw new Error('Missing getServerSnapshot');
  }
  
  // 2. 创建/更新 Hook
  const hook = mountWorkInProgressHook();
  
  // 3. 获取快照
  const snapshot = getSnapshot();
  
  // 4. 检查快照变化
  // （使用 Object.is 比较）
  
  return snapshot;
}
```

### Store 实例

```javascript
// 每个 Hook 关联的 store 实例
type StoreInstance = {
  value: any,           // 当前值
  getSnapshot: () => any,  // 获取快照
  handleChange: () => void, // 变化处理
  subscribing: boolean,    // 是否已订阅
};
```

### mountSyncExternalStore

```javascript
function mountSyncExternalStore(
  subscribe: () => () => void,
  getSnapshot: () => any,
  getServerSnapshot?: () => any,
): any {
  // 1. 创建 Hook
  const hook = mountWorkInProgressHook();
  
  // 2. 检查 SSR
  const isHydrating = getServerSnapshot !== undefined;
  
  if (isHydrating) {
    // 3. SSR 时使用服务端快照
    const serverSnapshot = getServerSnapshot();
    hook.memoizedState = {
      value: serverSnapshot,
      store: null,
    };
    return serverSnapshot;
  }
  
  // 4. 客户端：创建 store 实例
  const store = {
    value: null,
    getSnapshot,
    subscribing: false,
    handleChange: null,
  };
  
  // 5. 获取初始快照
  const snapshot = getSnapshot();
  store.value = snapshot;
  
  // 6. 创建变化处理函数
  store.handleChange = () => {
    const nextSnapshot = getSnapshot();
    
    // 7. 检查快照是否变化
    if (!Object.is(store.value, nextSnapshot)) {
      store.value = nextSnapshot;
      
      // 8. 触发重新渲染
      forceStoredValueUpdate();
    }
  };
  
  // 9. 保存 store
  hook.memoizedState = {
    value: snapshot,
    store,
  };
  
  // 10. 订阅外部数据源
  if (!store.subscribing) {
    const unsubscribe = subscribe(store.handleChange);
    store.unsubscribe = unsubscribe;
    store.subscribing = true;
  }
  
  return snapshot;
}
```

### updateSyncExternalStore

```javascript
function updateSyncExternalStore(
  subscribe: () => () => void,
  getSnapshot: () => any,
  getServerSnapshot?: () => any,
): any {
  // 1. 获取 Hook
  const hook = updateWorkInProgressHook();
  
  // 2. 获取 store 实例
  const prevStore = hook.memoizedState.store;
  
  // 3. 获取最新快照
  const snapshot = getSnapshot();
  
  // 4. 检查快照变化
  const prevSnapshot = prevStore?.value;
  const hasChanged = !Object.is(prevSnapshot, snapshot);
  
  if (hasChanged) {
    // 5. 如果快照变化，标记更新
    markWorkInProgressReceivedUpdate();
  }
  
  return snapshot;
}
```

### forceStoredValueUpdate（触发更新）

```javascript
function forceStoredValueUpdate() {
  // 1. 创建更新
  const update = {
    eventTime: requestEventTime(),
    lane: requestUpdateLane(currentlyRenderingFiber),
    action: null,
    hasEagerState: false,
    eagerState: null,
    next: null,
  };
  
  // 2. 调度更新（跳过 shouldComponentUpdate）
  scheduleUpdateOnFiber(
    currentlyRenderingFiber,
    update.lane,
  );
}
```

## 🔄 完整流程

```mermaid
graph TD
    A[useSyncExternalStore] --> B{首次渲染？}
    B -->|是 | C[mountSyncExternalStore]
    B -->|否 | D[updateSyncExternalStore]
    
    C --> E[创建 Store 实例]
    E --> F[获取初始快照]
    F --> G[订阅外部数据源]
    G --> H[返回快照]
    
    D --> I[获取最新快照]
    I --> J{快照变化？}
    J -->|是 | K[标记更新]
    J -->|否 | L[返回缓存]
    K --> H
    L --> H
    
    M[外部数据变化] --> N[handleChange 触发]
    N --> O[获取新快照]
    O --> P{快照变化？}
    P -->|是 | Q[scheduleUpdateOnFiber]
    P -->|否 | R[忽略]
    Q --> S[重新渲染]
```

## 💡 实战技巧

### 1. 基础使用

```jsx
// 订阅浏览器网络状态
function useOnlineStatus() {
  return useSyncExternalStore(
    // subscribe
    (onStoreChange) => {
      window.addEventListener('online', onStoreChange);
      window.addEventListener('offline', onStoreChange);
      
      return () => {
        window.removeEventListener('online', onStoreChange);
        window.removeEventListener('offline', onStoreChange);
      };
    },
    // getSnapshot
    () => navigator.onLine,
  );
}

// 使用
function StatusBar() {
  const isOnline = useOnlineStatus();
  return <div>{isOnline ? 'Online' : 'Offline'}</div>;
}
```

### 2. 配合 Redux

```jsx
// 配合 Redux store
function useReduxStore() {
  const store = useStore(); // Redux store
  
  return useSyncExternalStore(
    // subscribe
    (onStoreChange) => store.subscribe(onStoreChange),
    // getSnapshot
    () => store.getState(),
  );
}

// 配合 selector
function useSelector(selector) {
  const store = useStore();
  
  return useSyncExternalStore(
    // subscribe
    (onStoreChange) => store.subscribe(onStoreChange),
    // getSnapshot
    () => selector(store.getState()),
    // getServerSnapshot (SSR)
    () => selector(preloadedState),
  );
}
```

### 3. 配合 Zustand

```jsx
// Zustand store
import { create } from 'zustand';

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// 使用 hook
function useCount() {
  return useSyncExternalStore(
    // subscribe
    (onStoreChange) => useStore.subscribe(onStoreChange),
    // getSnapshot
    () => useStore.getState().count,
  );
}

// 组件
function Counter() {
  const count = useCount();
  const increment = useStore((state) => state.increment);
  
  return (
    <button onClick={increment}>
      Count: {count}
    </button>
  );
}
```

### 4. 配合 localStorage

```jsx
function useLocalStorage(key, initialValue) {
  return useSyncExternalStore(
    // subscribe
    (onStoreChange) => {
      const handler = (e) => {
        if (e.key === key) {
          onStoreChange();
        }
      };
      
      window.addEventListener('storage', handler);
      
      return () => {
        window.removeEventListener('storage', handler);
      };
    },
    // getSnapshot
    () => {
      const item = localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : initialValue;
    },
  );
}

// 使用
function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  
  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Theme: {theme}
    </button>
  );
}
```

### 5. 防止不必要的订阅

```jsx
// 优化：使用 useMemo 缓存 subscribe 函数
function useOptimizedSyncExternalStore(subscribe, getSnapshot) {
  // 缓存 subscribe
  const cachedSubscribe = useMemo(() => {
    return (onStoreChange) => {
      const unsubscribe = subscribe(onStoreChange);
      return unsubscribe;
    };
  }, [subscribe]);
  
  return useSyncExternalStore(cachedSubscribe, getSnapshot);
}
```

## ⚠️ 注意事项

### 1. getSnapshot 必须同步

```jsx
// ❌ 错误：异步返回
function useData() {
  return useSyncExternalStore(
    subscribe,
    async () => await fetchData(),  // 不允许异步
  );
}

// ✅ 正确：同步返回
function useData() {
  return useSyncExternalStore(
    subscribe,
    () => dataCache.get(),  // 同步返回缓存的数据
  );
}
```

### 2. getSnapshot 不能有副作用

```jsx
// ❌ 错误：getSnapshot 中有副作用
useSyncExternalStore(
  subscribe,
  () => {
    trackEvent('snapshot');  // 副作用
    return data;
  },
);

// ✅ 正确：纯函数
useSyncExternalStore(
  subscribe,
  () => data,  // 纯读取
);
```

### 3. subscribe 返回清理函数

```jsx
// ❌ 错误：忘记返回清理函数
useSyncExternalStore(
  (onStoreChange) => {
    store.addListener(onStoreChange);
    // 没有返回清理函数
  },
  getSnapshot,
);

// ✅ 正确
useSyncExternalStore(
  (onStoreChange) => {
    store.addListener(onStoreChange);
    
    return () => {
      store.removeListener(onStoreChange);
    };
  },
  getSnapshot,
);
```

### 4. getServerSnapshot 在 SSR 中的重要性

```jsx
// SSR 时如果没有 getServerSnapshot
function useTheme() {
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    // 缺少 getServerSnapshot ❌
  );
}

// 警告：Missing getServerSnapshot
// 可能导致 hydration 不匹配

// ✅ 正确
function useTheme() {
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => getServerSnapshot(),  // SSR 快照
  );
}
```

## 🔬 与 useState 对比

### 为什么不用 useState？

```jsx
// ❌ useState 在并发渲染中有问题
function Component() {
  const [data, setData] = useState(store.getData());
  
  useEffect(() => {
    const unsubscribe = store.subscribe((newData) => {
      setData(newData);  // 异步更新可能错过
    });
    return unsubscribe;
  }, []);
  
  return <div>{data}</div>;
}
// 问题：并发渲染时可能读取到过时的数据

// ✅ useSyncExternalStore 保证一致性
function Component() {
  const data = useSyncExternalStore(
    store.subscribe,
    () => store.getData(),  // 每次渲染都同步读取
  );
  
  return <div>{data}</div>;
}
// 优势：每次渲染都同步读取最新快照，避免撕裂
```

### 对比表

| 特性 | useState | useSyncExternalStore |
|------|----------|---------------------|
| 并发安全 | ❌ 否 | ✅ 是 |
| SSR 支持 | ❌ 有限 | ✅ 完整 |
| 外部数据源 | ❌ 需要 useEffect | ✅ 原生支持 |
| 性能 | ⚠️ 可能需要额外渲染 | ✅ 优化过 |

## 🔬 调试技巧

### 追踪订阅

```javascript
// 开发模式下追踪订阅
const originalSubscribe = subscribe;
const wrappedSubscribe = (onStoreChange) => {
  console.log('Subscribing in:', currentlyRenderingFiber.type?.name);
  
  const unsubscribe = originalSubscribe(onStoreChange);
  
  return () => {
    console.log('Unsubscribing:', currentlyRenderingFiber.type?.name);
    unsubscribe();
  };
};
```

### 检查快照变化

```javascript
// 追踪快照变化
function debugGetSnapshot(getSnapshot) {
  let lastSnapshot;
  
  return () => {
    const snapshot = getSnapshot();
    
    if (!Object.is(lastSnapshot, snapshot)) {
      console.log('Snapshot changed:', {
        old: lastSnapshot,
        new: snapshot,
      });
      lastSnapshot = snapshot;
    }
    
    return snapshot;
  };
}

// 使用
const data = useSyncExternalStore(
  subscribe,
  debugGetSnapshot(getSnapshot),
);
```

## 🐛 常见问题

### Q: 为什么需要 getServerSnapshot？

**A**: SSR 时，服务端和客户端的快照可能不同。getServerSnapshot 确保 hydration 一致。

### Q: getSnapshot 可以返回对象吗？

**A**: 可以，但如果对象引用变化会导致每次渲染都触发更新。建议返回原始值或使用 memoization。

### Q: useSyncExternalStore 和 useEffect+useState 有什么区别？

**A**: useSyncExternalStore 是同步读取数据，保证并发安全；useEffect+useState 是异步的，可能在并发渲染中出现数据撕裂。

---

## 📖 下一步

- [Suspense 实现](./suspense)
- [Lazy Loading](./lazy)