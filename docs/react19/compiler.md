# React Compiler 原理

React Compiler 是 React 19 的最大亮点，它能够**自动记忆化**组件，无需手动使用 `useMemo` 和 `useCallback`。

## 🎯 解决的问题

### React 18 的痛点

```jsx
// React 18 - 需要手动优化
function Component({ items, onSelect }) {
  // ❌ 不优化：每次渲染都重新计算
  const filtered = items.filter(i => i.active);
  
  // ❌ 不优化：每次渲染都创建新函数
  const handleClick = () => {
    onSelect(items);
  };
  
  return (
    <div onClick={handleClick}>
      {filtered.map(item => (
        <Item key={item.id} item={item} />
      ))}
    </div>
  );
}

// ✅ 正确做法：手动 memo
function Component({ items, onSelect }) {
  const filtered = useMemo(() => {
    return items.filter(i => i.active);
  }, [items]);
  
  const handleClick = useCallback(() => {
    onSelect(items);
  }, [items, onSelect]);
  
  return (
    <div onClick={handleClick}>
      {filtered.map(item => (
        <Item key={item.id} item={item} />
      ))}
    </div>
  );
}
```

**问题**：
- 需要记忆每个依赖
- 容易遗漏依赖
- 代码冗余

### React 19 的解决方案

```jsx
// React 19 - 编译器自动处理
function Component({ items, onSelect }) {
  // ✅ 编译器自动 memo
  const filtered = items.filter(i => i.active);
  
  // ✅ 编译器自动 memo
  const handleClick = () => {
    onSelect(items);
  };
  
  return (
    <div onClick={handleClick}>
      {filtered.map(item => (
        <Item key={item.id} item={item} />
      ))}
    </div>
  );
}
```

## 🔧 工作原理

### 编译流程

```
源代码 (JavaScript/JSX)
    │
    ▼
┌─────────────────┐
│   Babel 解析    │
│   生成 AST      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  React Compiler │
│  分析依赖关系   │
│  识别 Memo 点    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  插入 useMemo   │
│  插入 useCallback│
└────────┬────────┘
         │
         ▼
编译后的代码 (优化后)
```

### 依赖分析

编译器分析每个值的**可变性**：

```javascript
// 编译器分析
function Component(props) {
  const { items, onSelect } = props;  // props 是只读的
  
  // 分析：filtered 只依赖于 items
  const filtered = items.filter(i => i.active);
  
  // 分析：handleClick 依赖于 items 和 onSelect
  const handleClick = () => {
    onSelect(items);
  };
  
  // 生成 memo 代码
  // $[0] = useMemo(() => items.filter(...), [items])
  // $[1] = useCallback(() => { onSelect(items) }, [items, onSelect])
}
```

## 📦 安装配置

### 1. 安装插件

```bash
npm install babel-plugin-react-compiler
```

### 2. Babel 配置

```javascript
// babel.config.js
module.exports = {
  plugins: [
    ['babel-plugin-react-compiler', {
      runtimeModule: 'react',
    }],
  ],
};
```

### 3. Vite 配置

```javascript
// vite.config.js
import react from '@vitejs/plugin-react';

export default {
  plugins: [
    react({
      babel: {
        plugins: [
          ['babel-plugin-react-compiler', {
            runtimeModule: 'react',
          }],
        ],
      },
    }),
  ],
};
```

### 4. Next.js 配置

```javascript
// next.config.js
module.exports = {
  compiler: {
    reactRemoveProperties: true,
  },
  experimental: {
    reactCompiler: true,
  },
};
```

## 🔍 编译输出示例

### 输入代码

```jsx
function Counter({ initialCount }) {
  const [count, setCount] = useState(initialCount);
  
  const double = count * 2;
  
  const handleClick = () => {
    setCount(count + 1);
  };
  
  return (
    <div>
      <p>{count} x 2 = {double}</p>
      <button onClick={handleClick}>+1</button>
    </div>
  );
}
```

### 编译输出（简化版）

```jsx
import { c as _c } from 'react/compiler-runtime';

function Counter($props) {
  'use no memo';
  
  // 编译器生成的 memo 逻辑
  const { initialCount } = $props;
  
  // 条件：initialCount 变化时才重新计算
  const $[0] = initialCount !== $previousInitialCount;
  
  if ($[0]) {
    $[1] = useState(initialCount);
    $previousInitialCount = initialCount;
  }
  
  const [count, setCount] = $[1];
  
  // 条件：count 变化时才重新计算
  const $[2] = count !== $previousCount;
  
  if ($[2]) {
    $[3] = count * 2;
    $previousCount = count;
  }
  
  const double = $[3];
  
  // 条件：count 或 setCount 变化时才重新创建
  const $[4] = count !== $previousCount2 || setCount !== $previousSetCount;
  
  if ($[4]) {
    $[5] = () => {
      setCount(count + 1);
    };
    $previousCount2 = count;
    $previousSetCount = setCount;
  }
  
  const handleClick = $[5];
  
  // ... JSX
}
```

## 🎯 编译器优化策略

### 1. 值级别 Memo

```jsx
// 原始代码
function Component({ data }) {
  const result = expensive(data);
  return <div>{result}</div>;
}

// 编译后
function Component({ data }) {
  if (data !== $prevData) {
    $result = expensive(data);
    $prevData = data;
  }
  return <div>{$result}</div>;
}
```

### 2. 函数级别 Memo

```jsx
// 原始代码
function Component({ onClick }) {
  const handler = () => {
    onClick();
  };
  return <button onClick={handler} />;
}

// 编译后
function Component({ onClick }) {
  if (onClick !== $prevOnClick) {
    $handler = () => {
      onClick();
    };
    $prevOnClick = onClick;
  }
  return <button onClick={$handler} />;
}
```

### 3. 对象级别 Memo

```jsx
// 原始代码
function Component({ value }) {
  const style = {
    color: 'red',
    fontSize: value,
  };
  return <div style={style} />;
}

// 编译后
function Component({ value }) {
  if (value !== $prevValue) {
    $style = {
      color: 'red',
      fontSize: value,
    };
    $prevValue = value;
  }
  return <div style={$style} />;
}
```

## ⚠️ 注意事项

### 1. 可变数据

```jsx
// ❌ 编译器无法处理可变数据
function Component({ mutableObj }) {
  // 编译器不知道 mutableObj 是否变化
  mutableObj.count++;
  return <div>{mutableObj.count}</div>;
}

// ✅ 使用不可变数据
function Component({ count }) {
  const newCount = count + 1;
  return <div>{newCount}</div>;
}
```

### 2. 副作用

```jsx
// ❌ 副作用需要 useEffect
function Component({ data }) {
  logData(data);  // 每次都会执行
  return <div>{data}</div>;
}

// ✅ 使用 useEffect
function Component({ data }) {
  useEffect(() => {
    logData(data);
  }, [data]);
  return <div>{data}</div>;
}
```

### 3. 显式跳过

```jsx
// 某些情况不想 memo
function Component({ value }) {
  'use no memo';  // 跳过编译
  return <div>{value}</div>;
}

// 或跳过特定值
function Component({ value }) {
  const result = useMemo(() => {
    return expensive(value);
  }, [value]);  // 手动控制
  return <div>{result}</div>;
}
```

## 🧪 调试工具

### ESLint 插件

```bash
npm install eslint-plugin-react-compiler
```

```javascript
// .eslintrc.js
module.exports = {
  plugins: ['react-compiler'],
  rules: {
    'react-compiler/react-compiler': 'error',
  },
};
```

### 编译器日志

```javascript
// babel.config.js
module.exports = {
  plugins: [
    ['babel-plugin-react-compiler', {
      logger: {
        logEvent(filename, event) {
          console.log(event);
        },
      },
    }],
  ],
};
```

## 📊 性能对比

| 场景 | React 18 | React 19 (Compiler) |
|------|----------|---------------------|
| 大型列表渲染 | 手动优化 required | 自动优化 |
| 复杂计算 | useMemo 样板代码 | 自动 memo |
| 回调函数传递 | useCallback 链 | 自动稳定 |
| 开发体验 | 依赖易出错 | 无需关心依赖 |

## 🐛 已知限制

1. **不支持动态属性名**：
```jsx
// ❌ 编译器可能误判
const obj = {
  [dynamicKey]: value,
};
```

2. **不支持某些模式**：
```jsx
// ❌ 可能被跳过
for (let i = 0; i < items.length; i++) {
  mutate(items[i]);
}
```

3. **与某些库兼容性问题**：
- MobX 等可变状态库
- 某些动画库

---

## 📖 下一步

- [Actions 服务器动作](./actions)
- [useFormStatus / useFormState](./form-hooks)