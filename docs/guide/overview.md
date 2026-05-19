# React 18/19 新特性总览

## React 18 核心特性

React 18 于 2022 年 3 月发布，引入了 **Concurrent React** 范式。

### 1. Concurrent Rendering（并发渲染）

并发渲染是 React 18 最大的变化，允许 React 同时准备多个 UI 版本。

```jsx
// React 17 - 同步更新
setState(count + 1); // 阻塞渲染

// React 18 - 并发更新
startTransition(() => {
  setState(count + 1); // 可中断，低优先级
});
```

### 2. Automatic Batching（自动批处理）

React 18 自动批处理所有状态更新，包括：

- setTimeout 回调
- 原生事件处理器
- Promise 回调

```jsx
// React 17
setTimeout(() => {
  setCount(c => c + 1);
  setFlag(f => !f);
  // 渲染 2 次
}, 1000);

// React 18 - 自动批处理
setTimeout(() => {
  setCount(c => c + 1);
  setFlag(f => !f);
  // 只渲染 1 次 ✅
}, 1000);
```

### 3. 新增 Hooks

| Hook | 用途 |
|------|------|
| `useId` | 生成唯一 ID（SSR 友好） |
| `useTransition` | 标记非紧急更新 |
| `useDeferredValue` | 延迟更新某个值 |
| `useSyncExternalStore` | 订阅外部数据源 |
| `useInsertionEffect` | CSS-in-JS 专用 |

### 4. Suspense 增强

- SSR 支持 Suspense
- 支持多个边界
- 与 useTransition 配合使用

```jsx
<Suspense fallback={<Spinner />}>
  <Comments />
</Suspense>
```

### 5. 新的 ReactDOM API

```jsx
// React 17
ReactDOM.render(<App />, container);

// React 18
const root = ReactDOM.createRoot(container);
root.render(<App />);
```

---

## React 19 核心特性

React 19 于 2024 年 12 月发布，带来了更多新特性。

### 1. React Compiler（编译器）

自动记忆化，无需手动 memo：

```jsx
// React 18 - 需要手动优化
const memoized = useMemo(() => expensive(a, b), [a, b]);

// React 19 - 编译器自动处理
const result = expensive(a, b); // 自动 memo
```

### 2. Actions（服务器动作）

```jsx
async function submitForm(formData) {
  'use server';
  await saveToDatabase(formData);
}

function Form() {
  return <form action={submitForm}>...</form>;
}
```

### 3. 新的 Form Hooks

| Hook | 用途 |
|------|------|
| `useFormStatus` | 获取表单提交状态 |
| `useFormState` | 管理表单状态 |
| `useOptimistic` | 乐观更新 UI |

```jsx
function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>提交</button>;
}
```

### 4. Document Metadata

直接在组件中设置 meta 标签：

```jsx
function Page() {
  return (
    <>
      <title>页面标题</title>
      <meta name="description" content="描述" />
      <link rel="author" href="https://example.com" />
      <App />
    </>
  );
}
```

### 5. 资源预加载 APIs

```jsx
import { preinit, preload, prefetchDNS, preconnect } from 'react-dom';

// 预加载字体
preload('https://example.com/font.woff2', { as: 'font' });

// 预连接
preconnect('https://cdn.example.com');

// DNS 预取
prefetchDNS('https://api.example.com');
```

### 6. Ref 无需 forwardRef

```jsx
// React 18
const Input = forwardRef((props, ref) => {
  return <input ref={ref} />;
});

// React 19 - 直接接收 ref
function Input({ ref }) {
  return <input ref={ref} />;
}
```

### 7. Context 作为 Provider

```jsx
// React 18
<ThemeContext.Provider value={theme}>
  <App />
</ThemeContext.Provider>

// React 19
<ThemeContext value={theme}>
  <App />
</ThemeContext>
```

---

## 版本对比

| 特性 | React 17 | React 18 | React 19 |
|------|----------|----------|----------|
| Concurrent Mode | ❌ | ✅ | ✅ |
| Automatic Batching | 部分 | ✅ 全部 | ✅ 全部 |
| useTransition | ❌ | ✅ | ✅ |
| useDeferredValue | ❌ | ✅ | ✅ |
| useId | ❌ | ✅ | ✅ |
| React Compiler | ❌ | ❌ | ✅ |
| Actions | ❌ | ❌ | ✅ |
| 资源预加载 | ❌ | ❌ | ✅ |
| ref 无需 forwardRef | ❌ | ❌ | ✅ |

---

## 📚 参考资料

- [React 18 官方博客](https://react.dev/blog/2022/03/29/react-v18)
- [React 19 官方博客](https://react.dev/blog/2024/12/05/react-19)
- [React 19 完整变更日志](https://github.com/facebook/react/blob/main/CHANGELOG.md)

---

## 📖 下一步

- [如何调试 React 源码](./debugging) - 学习调试技巧