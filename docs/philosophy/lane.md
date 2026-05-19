# Lane 优先级模型

Lane 是 React 18 引入的优先级模型，用于精细化调度并发更新。

## 🎯 为什么需要 Lane?

### React 17 的问题

React 17 使用 **ExpirationTime**（过期时间）表示优先级：

```javascript
// React 17: 基于时间的优先级
const expirationTime = currentTime + timeout;

// 问题：
// 1. 优先级计算不精确
// 2. 难以区分同一优先级的不同来源
// 3. 批处理不够灵活
```

### React 18 的 Lane 方案

```javascript
// React 18: 基于位掩码的优先级
const SyncLane = 0b0000000000000000000000000000001;
const InputLane = 0b0000000000000000000000000000100;
const DefaultLane = 0b0000000000000000000000000010000;

// 优势：
// 1. 精确的位运算比较
// 2. 支持优先级组合
// 3. 更灵活的批处理
```

## 📦 Lane 数据结构

### 位掩码设计

```javascript
// packages/react-reconciler/src/ReactLanePriority.js

// 二进制表示（31 位可用）
const NoLanes = 0b0000000000000000000000000000000;  // 无优先级

// 同步优先级（最高）
const SyncLane = 0b0000000000000000000000000000001;

// 输入相关
const InputContinuousLane = 0b0000000000000000000000000000100;
const InputDiscreteLane = 0b0000000000000000000000000000010;

// 默认优先级
const DefaultLane = 0b0000000000000000000000000010000;

// 过渡优先级
const TransitionLanes = 0b0000000001111111111111111100000;

// 低优先级/空闲
const IdleLanes = 0b1111111110000000000000000000000;

// 所有用户优先级
const UserBlockingPriorityLanes = InputContinuousLane | InputDiscreteLane;
```

### Lane yclerview

```
31 位二进制 = 31 个优先级等级

高优先级                                                    低优先级
  │                                                              │
  ▼                                                              ▼
┌──┬──┬──┬─────┬─────┬─────┬─────┬─────────────────┬──────────┐
│S │  │  │输入 │默认 │     │过渡 │                  │空闲      │
│ 0│  |  │离散 │     │     │     │                  │          │
└──┴──┴──┴─────┴─────┴─────┴─────┴─────────────────┴──────────┘
位0  位1  位2   位3   位4   位5-10  位11-20            位21-30
```

## 🔍 核心操作

### 1. 位运算比较

```javascript
// 判断是否包含某个优先级
function includesLane(lanes, laneToCheck) {
  return (lanes & laneToCheck) !== NoLanes;
}

// 判断是否包含更高优先级
function includesHigherPriority(lanes, comparedLane) {
  // levels 越低优先级越高
  return (lanes & (comparedLane - 1)) !== NoLanes;
}

// 合并优先级
function mergeLanes(laneA, laneB) {
  return laneA | laneB;
}

// 移除优先级
function removeLane(lanes, laneToRemove) {
  return lanes & ~laneToRemove;
}
```

### 2. 优先级排序

```javascript
// 获取最高优先级（最低位）
function getHighestPriorityLane(lanes) {
  // 获取最右边的 1
  return lanes & -lanes;
}

// 获取最低优先级（最高位）
function getLowestPriorityLane(lanes) {
  let lane = lanes;
  let highest = SyncLane;
  
  while (lane > 0) {
    const bit = lane & -lane;
    highest = bit;
    lane ^= bit;  // 移除最低位
  }
  
  return highest;
}
```

### 3. Lane 转 Scheduler 优先级

```javascript
// packages/react-reconciler/src/ReactFiberLane.js
function getCurrentSchedulerPriority(lanes) {
  if ((lanes & SyncLane) !== NoLanes) {
    return ImmediateSchedulerPriority;
  } else if ((lanes & InputContinuousLane) !== NoLanes) {
    return UserBlockingSchedulerPriority;
  } else if ((lanes & DefaultLane) !== NoLanes) {
    return NormalSchedulerPriority;
  } else if ((lanes & TransitionLanes) !== NoLanes) {
    return NormalSchedulerPriority;
  } else if ((lanes & IdleLanes) !== NoLanes) {
    return IdleSchedulerPriority;
  }
  return NormalSchedulerPriority;
}
```

## 🔄 调度和更新

### 1. 调度更新

```javascript
// packages/react-reconciler/src/ReactFiberWorkLoop.js
function ensureRootIsScheduled(root, currentTime) {
  const pendingLanes = root.pendingLanes;
  
  // 获取下一个要执行的 lane
  const nextLane = getNextLanes(pendingLanes, root.suspendedLanes);
  
  if (nextLane === NoLanes) {
    return;  // 没有待处理的更新
  }
  
  // 根据 lane 确定调度优先级
  const schedulerPriorityLevel = 
    getCurrentSchedulerPriority(nextLane);
  
  // 调度回调
  scheduleCallback(schedulerPriorityLevel, () => {
    performConcurrentWorkOnRoot(root, nextLane);
  });
}
```

### 2. 批量更新

```javascript
// 合并同一优先级的更新
function batchUpdates(update1, update2) {
  const lane1 = update1.lane;
  const lane2 = update2.lane;
  
  // 相同优先级，合并
  if (lane1 === lane2) {
    return mergeUpdates(update1, update2);
  }
  
  // 不同优先级，高优先级先执行
  if (includesHigherPriority(lane1, lane2)) {
    scheduleUpdate(update1);
    scheduleUpdate(update2);
  } else {
    // 延迟低优先级
    startTransition(() => {
      scheduleUpdate(update2);
    });
    scheduleUpdate(update1);
  }
}
```

### 3. 饥饿处理

```javascript
// 防止低优先级任务永远执行
function markStarvedLanesAsExpired(root, currentTime) {
  // 检查等待时间过长的 lanes
  const pendingLanes = root.pendingLanes;
  const suspendedLanes = root.suspendedLanes;
  
  if ((pendingLanes & suspendedLanes) !== NoLanes) {
    // 将饥饿的任务提升为同步优先级
    root.expiredLanes |= (pendingLanes & suspendedLanes);
  }
}
```

## 💡 实战示例

### 1. 输入 + 列表更新

```jsx
function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  
  function handleSearch(e) {
    const value = e.target.value;
    
    // 同步更新输入框（SyncLane）
    setQuery(value);
    
    // 过渡更新列表（TransitionLanes）
    startTransition(() => {
      setResults(search(value));
    });
  }
  
  return (
    <>
      <input value={query} onChange={handleSearch} />
      <ResultList results={results} />
    </>
  );
}

// 内部 Lane 分配:
// - setQuery: SyncLane (同步)
// - setResults: TransitionLanes (过渡)
```

### 2. 多优先级更新

```jsx
function Dashboard() {
  const [user, setUser] = useState(currentUser);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  
  // 用户操作 - 离散优先级
  function handleUserUpdate(data) {
    setUser(data);  // InputDiscreteLane
  }
  
  // 通知更新 - 连续优先级
  useEffect(() => {
    const unsubscribe = subscribeNotifications(data => {
      setNotifications(data);  // InputContinuousLane
    });
    return unsubscribe;
  }, []);
  
  // 统计数据 - 默认优先级
  useEffect(() => {
    fetchStats().then(data => {
      setStats(data);  // DefaultLane
    });
  }, []);
  
  return (
    <Dashboard
      user={user}
      notifications={notifications}
      stats={stats}
    />
  );
}
```

### 3. 调试 Lane

```javascript
// 查看当前待处理的 lanes
function debugLanes() {
  const internals = 
    React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
  
  const root = internals.ReactCurrentOwner.current;
  
  console.log({
    pendingLanes: root.pendingLanes.toString(2),
    suspendedLanes: root.suspendedLanes.toString(2),
    expiredLanes: root.expiredLanes.toString(2),
  });
}
```

## 🔬 源码解析

### getNextLanes

```javascript
// packages/react-reconciler/src/ReactFiberLane.js
function getNextLanes(pendingLanes, suspendedLanes) {
  // 1. 检查是否有同步任务
  const syncLanes = pendingLanes & SyncLane;
  if (syncLanes !== NoLanes) {
    return syncLanes;
  }
  
  // 2. 检查输入相关
  const inputLanes = pendingLanes & InputLanes;
  if (inputLanes !== NoLanes) {
    return getHighestPriorityLane(inputLanes);
  }
  
  // 3. 检查默认优先级
  const defaultLanes = pendingLanes & DefaultLane;
  if (defaultLanes !== NoLanes) {
    return defaultLanes;
  }
  
  // 4. 依优先级往下检查...
}
```

### 优先级继承

```javascript
// 子组件继承父组件的优先级
function updateContainer(children, container, parentComponent) {
  const updateLane = requestUpdateLane(parentComponent);
  
  // updateLane 会继承当前正在处理的优先级
  function requestUpdateLane(fiber) {
    const current = getCurrentFiber();
    if (current !== null) {
      return current.lanes;  // 继承当前优先级
    }
    return DefaultLane;
  }
}
```

## ⚠️ 常见问题

### Q: 如何选择合适的 Lane?

```jsx
// 用户直接交互 → 离散/连续优先级
onClick  → InputDiscreteLane
onInput  → InputContinuousLane

// 非紧急更新 → 过渡
startTransition(() => setXxx()) → TransitionLanes

// 数据获取 → 默认优先级
fetchData().then(setXxx) → DefaultLane
```

### Q: 可以自定义 Lane 吗？

**A**: 不行，Lane 是 React 内部模型。但可以通过以下方式控制：

```jsx
// 使用 useTransition 控制优先级
const [isPending, startTransition] = useTransition();
startTransition(() => {
  // 这个更新会使用 TransitionLanes
  setState(newValue);
});
```

### Q: 如何避免优先级反转？

```jsx
// ❌ 不好的做法：高优先级依赖低优先级结果
function Component() {
  const [highPriority, setHigh] = useState();
  const [lowPriority, setLow] = useState();
  
  useEffect(() => {
    // 低优先级先执行
    fetchData().then(data => {
      setLow(data);  // 可能会阻塞高优先级
    });
  }, []);
  
  return <Child high={highPriority} />;
}

// ✅ 好的做法：使用 startTransition
function Component() {
  const [data, setData] = useState();
  
  useEffect(() => {
    startTransition(() => {
      fetchData().then(setData);
    });
  }, []);
  
  return <Child data={data} />;
}
```

---

## 📖 下一步

- [时间切片与中断恢复](./time-slicing)
- [Scheduler 调度器源码](../architecture/scheduler)