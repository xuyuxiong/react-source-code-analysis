# 为什么需要 Concurrent React

Concurrent React 是 React 18 引入的全新渲染范式，解决了同步渲染在复杂应用中的性能瓶颈。

## 🎯 问题背景

### 同步渲染的局限

在 React 18 之前，所有更新都是**同步且不可中断**的：

```
┌─────────────────────────────────────────────┐
│         React 17 同步渲染                     │
├─────────────────────────────────────────────┤
│                                             │
│  用户点击 → 开始渲染 → 完成渲染 → 响应用户   │
│             ═══════════>                    │
│                阻塞主线程                    │
│                                             │
│  问题：大组件树渲染时会阻塞用户输入          │
│  表现：点击无响应、滚动卡顿、输入延迟        │
│                                             │
└─────────────────────────────────────────────┘
```

### 真实场景问题

```jsx
// 问题场景：渲染大型列表
function SearchResults({ results }) {
  return (
    <div>
      <input placeholder="搜索..." />
      <List>
        {results.map(item => (
          <ListItem key={item.id} item={item} />
        ))}
      </List>
    </div>
  );
}

// React 17:
// 1. 用户输入 → 触发 setState
// 2. 开始渲染整个列表（可能几百个组件）
// 3. 渲染完成前，输入框无响应 ❌
// 4. 用户感觉"卡顿"
```

## 🔍 根本原因

### 1. 渲染工作量大

```javascript
//  render 工作量 = 组件数量 × 每个组件的复杂度

// 示例：1000 个列表项
// 工作量 = 1000 × (props 比对 + JSX 创建 + Diff)
// 可能需要 100ms+，阻塞主线程
```

### 2. 主线程被占用

```
主线程时间线（React 17）

0ms    50ms   100ms  150ms  200ms
│──────│──────│──────│──────│──────
│  渲染开始           │
│                     │  渲染结束
│                     │
└─────────────────────┘
       阻塞期间用户输入无法响应 ❌
```

### 3. 所有更新优先级相同

```javascript
// React 17: 所有 setState 优先级相同
setState(inputValue);    // 紧急：用户输入
setState(searchResults); // 不紧急：列表渲染

// 但 React 17 同等对待，导致紧急更新被阻塞
```

## 💡 Concurrent 的解决方案

### 1. 可中断渲染

```
┌─────────────────────────────────────────────┐
│         React 18 并发渲染                     │
├─────────────────────────────────────────────┤
│                                             │
│  渲染 A → 用户输入 → 暂停 A → 处理输入       │
│  ═══>         ═══>        ═══>     ═══>     │
│  恢复 A → 完成 A → 用户看到响应             │
│                                             │
│  关键：渲染可以被暂停和恢复，不阻塞输入      │
│                                             │
└─────────────────────────────────────────────┘
```

### 2. 优先级调度

```javascript
// React 18: 区分优先级
const [inputValue, setInputValue] = useState('');  // 高优先级
const [results, setResults] = useState([]);         // 低优先级

// 高优先级更新可以打断低优先级更新
function handleInput(e) {
  setInputValue(e.target.value);  // 立即响应 ✅
  
  startTransition(() => {
    setResults(filterResults(e.target.value));  // 可延迟 ✅
  });
}
```

### 3. 多版本 UI

```
Concurrent React 可以同时准备多个 UI 版本：

Current UI (显示中)          WorkInProgress UI (准备中)
┌─────────────┐             ┌─────────────┐
│  旧结果列表  │             │  新结果列表  │
│  可见       │  ──────▶   │  不可见      │
└─────────────┘             └─────────────┘
     ↑                            ↑
     │                            │
     └───── 高优先级更新可以 ──────┘
          立即切换到新版本
```

## 🎯 并发带来的好处

### 1. 保持响应

```jsx
// 搜索场景
function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  
  function handleChange(e) {
    const value = e.target.value;
    
    // 立即更新输入框（高优先级）
    setQuery(value);
    
    // 延迟更新列表（低优先级）
    startTransition(() => {
      setResults(search(value));
    });
  }
  
  return (
    <>
      <input value={query} onChange={handleChange} />
      <ResultList results={results} />
    </>
  );
}

// 用户体验：
// ✅ 输入始终流畅
// ✅ 列表稍后更新（可能显示 Loading）
```

### 2. 平滑过渡

```jsx
// 标签切换
function Tabs() {
  const [tab, setTab] = useState('home');
  const [isPending, startTransition] = useTransition();
  
  function handleTabChange(newTab) {
    startTransition(() => {
      setTab(newTab);  // 过渡更新
    });
  }
  
  return (
    <>
      <nav>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id)}
            className={tab === t.id ? 'active' : ''}
          >
            {t.title}
          </button>
        ))}
      </nav>
      
      {isPending && <Spinner />}  {/* 显示加载状态 */}
      <TabContent tab={tab} />
    </>
  );
}

// 用户体验：
// ✅ 点击立即有反馈
// ✅ 内容过渡平滑
// ✅ 不会"卡住"
```

### 3. 避免闪烁

```jsx
// 延迟值保持 UI 稳定
function Chart({ data }) {
  const [scale, setScale] = useState(1);
  const deferredScale = useDeferredValue(scale);
  
  const chartData = useMemo(() => {
    return data.map(d => ({ ...d, value: d.value * deferredScale }));
  }, [data, deferredScale]);
  
  return (
    <>
      <Slider 
        onChange={e => setScale(Number(e.target.value))}
        value={scale}
      />
      {scale !== deferredScale && <Loading />}
      <ChartCanvas data={chartData} />
    </>
  );
}

// 用户体验：
// ✅ 滑块拖动流畅
// ✅ 图表逐步更新
// ✅ 不会闪烁
```

## 📊 性能对比

### 输入响应时间

| 场景 | React 17 | React 18 Concurrent |
|------|----------|---------------------|
| 输入 → 显示字符 | 50-200ms | <16ms ✅ |
| 列表过滤器更新 | 阻塞 | 非阻塞 ✅ |
| 标签切换 | 卡顿 | 平滑 ✅ |

### 渲染时间线对比

```
React 17 同步渲染:

输入     渲染开始          渲染结束
│        │                │
▼        ▼                ▼
│════════╪════════════════╪────────> 时间
         │← 阻塞 100ms →  │


React 18 并发渲染:

输入     渲染开始    暂停     渲染恢复    完成
│        │           │        │          │
▼        ▼           ▼        ▼          ▼
│═══╪════╪═══════╪═══╪═══════╪══════════> 时间
    │       │       │         │
    │       │       │         └─ 渲染完成
    │       │       └─ 处理输入（不阻塞）
    │       └─ 暂停渲染
    └─ 输入立即响应
```

## 🎯 适用场景

### ✅ 适合使用并发的场景

1. **大型列表渲染**
   - 搜索结果
   - 数据表格
   - 信息流

2. **复杂过滤/排序**
   - 多条件筛选
   - 大数据集排序

3. **路由切换**
   - 页面过渡
   - 懒加载组件

4. **图表可视化**
   - 数据缩放
   - 实时数据更新

### ⚠️ 不需要的场景

1. **简单小组件**
   - 按钮状态
   - 表单切换

2. **静态内容**
   - 不经常更新的展示

3. **原子更新**
   - 单个计数器
   - 简单状态切换

## 🔬 调试技巧

### 观察渲染优先级

```javascript
// 开发模式下
function Component() {
  useEffect(() => {
    console.log('渲染优先级:', 
      React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
        .ReactCurrentOwner.current
    );
  });
  
  return <div>内容</div>;
}
```

### Performance 面板

```
Chrome DevTools → Performance → 录制

查看:
- User Timing: Transition 标记
- Main 线程：渲染是否被中断
- Frame 率：是否保持 60fps
```

---

## 📖 下一步

- [Fiber 架构再探](./fiber) - 理解并发数据结构
- [时间切片](./time-slicing) - 深入时间切片机制