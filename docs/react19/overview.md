# React 19 总览

React 19 于 2024 年 12 月 5 日正式发布，带来了众多新特性和改进。

## 🎉 主要特性

### 1. React Compiler（编译器）⚛️

**最大亮点**：自动记忆化，告别手动 `useMemo` 和 `useCallback`

```jsx
// React 18 - 需要手动优化
function Component({ items }) {
  const filtered = useMemo(() => {
    return items.filter(item => item.active);
  }, [items]);
  
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);
  
  return <div onClick={handleClick}>{filtered.length}</div>;
}

// React 19 - 编译器自动处理
function Component({ items }) {
  const filtered = items.filter(item => item.active); // 自动 memo
  const handleClick = () => {
    console.log('clicked'); // 自动 memo
  };
  
  return <div onClick={handleClick}>{filtered.length}</div>;
}
```

**原理**：编译器在构建时分析组件，自动添加记忆化：

```bash
npm install babel-plugin-react-compiler
```

### 2. Actions（服务器动作）🔄

支持在服务端处理表单提交：

```jsx
// app/actions.js
'use server';

export async function submitForm(formData) {
  const email = formData.get('email');
  await saveToDatabase(email);
  revalidatePath('/');
}

// 组件中使用
import { submitForm } from './actions';

function Form() {
  return (
    <form action={submitForm}>
      <input name="email" />
      <button type="submit">提交</button>
    </form>
  );
}
```

### 3. 新的 Form Hooks 📝

#### useFormStatus

```jsx
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending, data, method, action } = useFormStatus();
  
  return (
    <button disabled={pending} type="submit">
      {pending ? '提交中...' : '提交'}
    </button>
  );
}
```

#### useFormState

```jsx
import { useFormState } from 'react-dom';

async function increment(previousState, formData) {
  return previousState + 1;
}

function Counter() {
  const [state, formAction] = useFormState(increment, 0);
  
  return (
    <form action={formAction}>
      <p>计数：{state}</p>
      <button type="submit">+1</button>
    </form>
  );
}
```

### 4. useOptimistic（乐观更新）✨

立即更新 UI，等待服务器确认：

```jsx
import { useOptimistic } from 'react';

function MessageThread({ messages, sendMessage }) {
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage) => [...state, newMessage]
  );
  
  async function send(message) {
    addOptimisticMessage(message);
    await sendMessage(message);
  }
  
  return (
    <>
      {optimisticMessages.map(msg => (
        <div key={msg.id}>{msg.text}</div>
      ))}
      <form onSubmit={e => send(e.target.value)}>
        <input />
      </form>
    </>
  );
}
```

### 5. Document Metadata 📄

直接在组件中设置文档元信息：

```jsx
function Page() {
  return (
    <>
      <title>页面标题</title>
      <meta name="description" content="页面描述" />
      <meta name="keywords" content="React, JavaScript" />
      <link rel="canonical" href="https://example.com/page" />
      <body>
        <App />
      </body>
    </>
  );
}
```

### 6. 资源预加载 APIs 🚀

```jsx
import { preinit, preload, prefetchDNS, preconnect } from 'react-dom';

// 在组件中预加载资源
function App() {
  // 预初始化（下载并准备执行）
  preinit('https://example.com/script.js', {
    as: 'script',
    precedence: 'high'
  });
  
  // 预加载资源
  preload('https://example.com/font.woff2', {
    as: 'font',
    type: 'font/woff2',
    crossOrigin: 'anonymous'
  });
  
  // DNS 预取
  prefetchDNS('https://api.example.com');
  
  // 预连接
  preconnect('https://cdn.example.com');
  
  return <div>...</div>;
}
```

### 7. Ref 无需 forwardRef 🔖

```jsx
// React 18 - 需要 forwardRef
const Input = React.forwardRef((props, ref) => {
  return <input ref={ref} {...props} />;
});

// React 19 - 直接接收 ref
function Input({ ref, ...props }) {
  return <input ref={ref} {...props} />;
}
```

### 8. Context 作为 Provider 📦

```jsx
// React 18
<ThemeContext.Provider value={theme}>
  <App />
</ThemeContext.Provider>

// React 19 - 简化写法
<ThemeContext value={theme}>
  <App />
</ThemeContext>
```

### 9. useEffect 清理增强 🧹

```jsx
// React 19 自动清理事件监听
useEffect(() => {
  const controller = new AbortController();
  
  fetch('/api/data', { signal: controller.signal })
    .then(res => res.json());
  
  // cleanup 会自动 abort
  return () => controller.abort();
}, []);
```

## 📊 完整特性对比

| 特性 | React 18 | React 19 |
|------|----------|----------|
| Concurrent Mode | ✅ | ✅ |
| Transitions | ✅ | ✅ |
| Suspense | ✅ | ✅ |
| React Compiler | ❌ | ✅ |
| Actions | ❌ | ✅ |
| useFormStatus | ❌ | ✅ |
| useFormState | ❌ | ✅ |
| useOptimistic | ❌ | ✅ |
| Document Metadata | ❌ | ✅ |
| 资源预加载 APIs | ❌ | ✅ |
| ref 无需 forwardRef | ❌ | ✅ |
| Context 简化 | ❌ | ✅ |
| 自动批处理 | ✅ | ✅ |
| useId | ✅ | ✅ |

## 🔄 迁移指南

### 升级步骤

1. **更新依赖**：
```bash
npm install react@rc react-dom@rc
```

2. **检查破坏性变更**：
- `react-dom/server` 的 `renderToStaticMarkup` 行为变化
- `useDeferredValue` 新增 `initialValue` 参数

3. **启用 Compiler（可选）**：
```bash
npm install babel-plugin-react-compiler
```

4. **逐步采用新特性**：
- 先用 Actions 替代部分 API 调用
- 使用新的 Form Hooks
- 享受自动记忆化的便利

## 📚 参考资料

- [React 19 官方发布博客](https://react.dev/blog/2024/12/05/react-19)
- [React 19 完整文档](https://react.dev)
- [React Compiler RFC](https://github.com/reactjs/rfcs/pull/229)
- [Actions RFC](https://github.com/reactjs/rfcs/pull/188)

---

## 📖 下一步

- [React Compiler 原理](./compiler) - 深入了解编译器
- [Actions 服务器动作](./actions) - 学习服务端动作