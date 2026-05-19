# 并发设计理念

并发设计是 React 18 的核心哲学，理解这些理念能帮助你更好地使用并发特性。

## 🎯 设计原则

### 1. 用户优先（User-Centric）

```
用户输入 > 视觉更新

┌─────────────────────────────────────────────┐
│  用户体验优先级                              │
├─────────────────────────────────────────────┤
│  1. 输入响应（点击、滚动、输入）            │
│  2. 过渡动画                                │
│  3. 内容更新                                │
│  4. 后台数据获取                            │
└─────────────────────────────────────────────┘
```

```jsx
// ❌ 不好的设计：阻塞用户输入
async function handleSubmit() {
  setLoading(true);
  await submitData();  // 阻塞期间无法输入
  setLoading(false);
}

// ✅ 好的设计：保持响应
async function handleSubmit() {
  startTransition(() => {
    submitData();  // 后台处理
  });
  // 可以立即处理其他输入 ✅
}
```

### 2. 渐进式增强

```
基础功能 → 渐进加载 → 完整体验

┌─────────────────────────────────────────────┐
│  渐进式加载                                 │
├─────────────────────────────────────────────┤
│  1. 首先显示骨架屏/Loading                  │
│  2. 逐步加载非关键内容                      │
│  3. 最后增强交互和动画                      │
└─────────────────────────────────────────────┘
```

```jsx
// 使用 Suspense 渐进加载
<Suspense fallback={<Skeleton />}>
  <HeavyComponent />
</Suspense>

// 使用 useDeferredValue 渐进更新
function Page({ filter }) {
  const deferredFilter = useDeferredValue(filter);
  
  return (
    <>
      <input value={filter} />
      <List filter={deferredFilter} />  {/* 稍后更新 */}
    </>
  );
}
```

### 3. 无感知优化

```
好的优化用户感觉不到

¬¬∂ 显式的 Loading    →    隐式的平滑过渡
```

```jsx
// ❌ 显式的等待体验
<button onClick={handleClick}>
  {loading ? '处理中...' : '提交'}
</button>

// ✅ 隐式的流畅体验
<button onClick={() => {
  startTransition(() => handleClick());
}} disabled={isPending}>
  提交
</button>
// 用户不会感到卡顿，只会看到平滑过渡
```

## 🔄 并发模式

### 1. 抢占式调度（Preemptive）

```javascript
// 高优先级任务可以打断低优先级
function scheduleUpdate(fiber, lane) {
  const pendingLanes = root.pendingLanes;
  
  // 检查新任务是否优先级更高
  if (includesHigherPriority(lane, pendingLanes)) {
    // 中断当前工作
    interruptWorkLoop();
  }
  
  // 调度新任务
  ensureRootIsScheduled(root);
}
```

### 2. 可中断渲染（Interruptible）

```
render 阶段（可中断）          commit 阶段（不可中断）
     │                              │
     ▼                              ▼
┌──────────┐                  ┌──────────┐
│ beginWork│                  │  DOM 操作│
│   ↓      │                  │   ↓      │
│ complete │  暂停点          │ mutation │
│   ↓      │  ◄──────────────► │   ↓      │
│ collect  │                  │ layout   │
└──────────┘                  └──────────┘
```

### 3. 记忆化与跳过

```javascript
// 跳过不需要更新的子树
function bailoutOnAlreadyFinishedWork(current, workInProgress) {
  // 如果优先级没有变化，跳过
  if (!includesSomeLane工作InProgress.lanes, workInProgress.childLanes)) {
    return null;  // 跳过该子树
  }
  
  // 否则继续推进
  return workInProgress.child;
}
```

## 📊 并发策略

### 1. 分层渲染

```
分层策略：

┌─────────────────────────────────────────────┐
│  层级 1: 交互层（立即响应）                   │
│  - 点击反馈                                 │
│  - 滚动响应                                 │
│  - 输入状态                                 │
├─────────────────────────────────────────────┤
│  层级 2: 内容层（渐进更新）                   │
│  - 列表过滤                                 │
│  - 内容加载                                 │
│  - 图片渲染                                 │
├─────────────────────────────────────────────┤
│  层级 3: 数据层（后台处理）                   │
│  - 数据获取                                 │
│  - 缓存更新                                 │
│  - 预取                                     │
└─────────────────────────────────────────────┘
```

```jsx
function App() {
  // 层级 1: 交互状态（同步）
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // 层级 2: 内容状态（过渡）
  const [filter, setFilter] = useState('');
  const [isPending, startTransition] = useTransition();
  
  // 层级 3: 数据状态（后台）
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetchData().then(setData);
  }, []);
  
  function handleFilter(e) {
    const value = e.target.value;
    setFilter(value);
    
    // 过渡到新的过滤结果
    startTransition(() => {
      // 过滤操作
    });
  }
  
  return (
    <>
      <Menu isOpen={isMenuOpen} />  {/* 立即响应 */}
      <Filter onChange={handleFilter} />  {/* 过渡更新 */}
      {isPending && <Loading />}
      <Content data={data} filter={filter} />
    </>
  );
}
```

### 2. 流式渲染

```jsx
// React 18 SSR 支持流式
function App() {
  return (
    <html>
      <body>
        <Suspense fallback={<Skeleton />}>
          <Header />
        </Suspense>
        
        <Suspense fallback={<Spinner />}>
          <Comments />
        </Suspense>
        
        <Suspense fallback={<Spinner />}>
          <Sidebar />
        </Suspense>
      </body>
    </html>
  );
}

// 流式输出:
// 1. 先输出 HTML 外壳
// 2. Header 准备好 → 发送
// 3. Comments 准备好 → 发送
// 4. Sidebar 准备好 → 发送
```

### 3. 选择性 Hydration

```
客户端激活策略:

┌─────────────────────────────────────────────┐
│  优先激活交互区域                            │
├─────────────────────────────────────────────┤
│  1. 视口内组件优先                           │
│  2. 交互元素优先（按钮、输入框）             │
│  3. 非关键内容延迟激活                       │
└─────────────────────────────────────────────┘
```

```jsx
// React 18 自动选择性 Hydration
function Page() {
  return (
    <>
      {/* 优先激活 */}
      <Nav>
        <button onClick={toggleMenu}>菜单</button>
      </Nav>
      
      {/* 延迟激活 */}
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </>
  );
}
```

## 🎯 最佳实践

### 1. 合理使用 Transition

```jsx
// ✅ 推荐：用于非紧急更新
function TabContainer() {
  const [tab, setTab] = useState('home');
  const [isPending, startTransition] = useTransition();
  
  function handleTabChange(newTab) {
    startTransition(() => {
      setTab(newTab);
    });
  }
  
  return (
    <>
      <TabList activeTab={tab} onChange={handleTabChange} />
      {isPending && <Spinner />}
      <TabContent tab={tab} />
    </>
  );
}

// ❌ 不推荐：所有更新都用 transition
function WrongExample() {
  const [count, setCount] = useState(0);
  
  function handleClick() {
    // 简单的计数器不需要 transition
    startTransition(() => {
      setCount(c => c + 1);  // 多余的 transition
    });
  }
  
  return <button onClick={handleClick}>{count}</button>;
}
```

### 2. 延迟值的正确使用

```jsx
// ✅ 推荐：用于 expensive 计算
function SearchResults({ query }) {
  const [results, setResults] = useState([]);
  const deferredQuery = useDeferredValue(query);
  
  useEffect(() => {
    search(deferredQuery).then(setResults);
  }, [deferredQuery]);
  
  return (
    <>
      <input value={query} />
      {query !== deferredQuery && <Loading />}
      <ResultList results={results} />
    </>
  );
}

// ❌ 不推荐：用于简单值
function WrongExample({ value }) {
  const deferredValue = useDeferredValue(value);
  return <div>{deferredValue}</div>;  // 没必要
}
```

### 3. Suspense 边界放置

```jsx
// ✅ 推荐：在合适层级设置边界
function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Suspense fallback={<CommentsSkeleton />}>
        <Comments />
      </Suspense>
      
      <Suspense fallback={<SidebarSkeleton />}>
        <Sidebar />
      </Suspense>
    </Suspense>
  );
}
```

## ⚠️ 常见误区

### 1. 过度使用并发

```jsx
// ❌ 过度设计
function Counter() {
  const [count, setCount] = useState(0);
  const [isPending, startTransition] = useTransition();
  
  function handleClick() {
    // 简单计数不需要 transition
    startTransition(() => {
      setCount(c => c + 1);
    });
  }
  
  return (
    <button onClick={handleClick} disabled={isPending}>
      {count}
    </button>
  );
}
```

### 2. 忽略错误边界

```jsx
// ✅ 推荐：搭配 ErrorBoundary
<ErrorBoundary fallback={<Error />}>
  <Suspense fallback={<Loading />}>
    <AsyncComponent />
  </Suspense>
</ErrorBoundary>
```

### 3. 忘记清理

```jsx
// ✅ 推荐：清理副作用
function Component({ query }) {
  const deferredQuery = useDeferredValue(query);
  
  useEffect(() => {
    const controller = new AbortController();
    
    fetchData(deferredQuery, { signal: controller.signal })
      .then(setData);
    
    return () => controller.abort();  // 清理
  }, [deferredQuery]);
}
```

---

## 📖 下一步

- [实现篇开始](../implementation/create-root)
- [Scheduler 调度器详解](../architecture/scheduler)