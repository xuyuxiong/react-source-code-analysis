# ref 无需 forwardRef

React 19 中，函数组件可以直接接收 `ref` 作为 prop，不再需要 `forwardRef` 包装。

## 🎯 解决的问题

### React 18 的繁琐写法

```jsx
// React 18 - 需要 forwardRef
import { forwardRef, useImperativeHandle, useRef } from 'react';

const Input = forwardRef((props, ref) => {
  const inputRef = useRef(null);
  
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current.focus(),
    value: () => inputRef.current.value,
  }));
  
  return <input ref={inputRef} {...props} />;
});

// 使用
function Form() {
  const inputRef = useRef(null);
  
  useEffect(() => {
    inputRef.current.focus();
  }, []);
  
  return <Input ref={inputRef} />;
}
```

### React 19 的简化

```jsx
// React 19 - 直接接收 ref
import { useRef } from 'react';

function Input({ ref, ...props }) {
  return <input ref={ref} {...props} />;
}

// 使用方式不变
function Form() {
  const inputRef = useRef(null);
  
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  return <Input ref={inputRef} />;
}
```

## 📦 工作原理

### React 18 的 forwardRef

```javascript
// React 18 内部处理
function forwardRef(render) {
  return {
    $$typeof: REACT_FORWARD_REF_TYPE,
    render,
  };
}

// 渲染时需要特殊处理
function mountForwardRef(current, workInProgress, Component) {
  // 1. 调用 render(props, ref)
  const props = workInProgress.pendingProps;
  const ref = workInProgress.ref;
  
  const children = Component.render(props, ref);
  
  // 2. 协调子节点
  reconcileChildren(current, workInProgress, children);
}
```

### React 19 的简化

```javascript
// React 19 - ref 作为普通 prop
function updateFunctionComponent(current, workInProgress, Component) {
  // 1. 直接传递 props（包含 ref）
  const props = workInProgress.pendingProps;
  
  // 2. 调用组件
  const children = Component(props);  // ref 已经在 props 里
  
  // 3. 协调子节点
  reconcileChildren(current, workInProgress, children);
}
```

## 💡 使用场景

### 1. 输入框组件

```jsx
// 转发到原生 input
function Input({ ref, label, ...props }) {
  return (
    <div className="input-group">
      {label && <label>{label}</label>}
      <input ref={ref} {...props} />
    </div>
  );
}

// 使用
function Form() {
  const inputRef = useRef(null);
  
  const handleSubmit = () => {
    console.log(inputRef.current.value);
  };
  
  return (
    <>
      <Input ref={inputRef} label="用户名" />
      <button onClick={handleSubmit}>提交</button>
    </>
  );
}
```

### 2. 自定义组件命令式方法

```jsx
// 使用 useImperativeHandle 暴露方法
import { useRef, useImperativeHandle } from 'react';

function TextInput({ ref, ...props }) {
  const inputRef = useRef(null);
  
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
    getValue: () => inputRef.current?.value,
    setValue: (val) => {
      if (inputRef.current) {
        inputRef.current.value = val;
      }
    },
  }));
  
  return <input ref={inputRef} {...props} />;
}

// 使用
function Form() {
  const textRef = useRef(null);
  
  return (
    <>
      <TextInput ref={textRef} />
      <button onClick={() => textRef.current.focus()}>
        聚焦
      </button>
      <button onClick={() => textRef.current.setValue('Hello')}>
        设置值
      </button>
    </>
  );
}
```

### 3. 转发 ref 到多个元素

```jsx
// 选择性转发
function LabeledInput({ ref, label, ...props }) {
  return (
    <div>
      {label && <label>{label}</label>}
      <input ref={ref} {...props} />
    </div>
  );
}

// 或者暴露子元素的 ref
function FormField({ inputRef, labelRef, label, ...props }) {
  return (
    <div>
      <label ref={labelRef}>{label}</label>
      <input ref={inputRef} {...props} />
    </div>
  );
}
```

### 4. 条件转发

```jsx
function Switch({ ref, as, ...props }) {
  const Component = as || 'div';
  
  // 根据条件转发到不同元素
  return <Component ref={ref} {...props} />;
}

// 使用
<Switch as="button" ref={buttonRef}>
  按钮
</Switch>

<Switch as="a" href="#" ref={linkRef}>
  链接
</Switch>
```

## 🔍 兼容模式

### 同时支持 React 18 和 19

```jsx
// 使用 forwardRef 保持兼容
import { forwardRef } from 'react';

const Input = forwardRef(function Input(props, ref) {
  return <input ref={ref} {...props} />;
});

// React 19 中也可以直接使用（forwardRef 仍然有效）
<Input ref={inputRef} />
```

### 类型定义（TypeScript）

```typescript
// React 19 类型
interface InputProps {
  label?: string;
}

// ref 类型
type InputRef = HTMLInputElement;

// 组件定义
function Input({ ref, label, ...props }: InputProps & {
  ref: React.Ref<InputRef>;
}) {
  return (
    <div>
      {label && <label>{label}</label>}
      <input ref={ref} {...props} />
    </div>
  );
}

// 使用
function App() {
  const inputRef = useRef<HTMLInputElement>(null);
  return <Input ref={inputRef} label="用户名" />;
}
```

## 📊 forwardRef vs 直接传 ref

| 对比项 | forwardRef (React 18) | 直接 ref (React 19) |
|--------|----------------------|---------------------|
| 代码量 | 需要包装 | 直接接收 |
| 嵌套层级 | 多一层 | 无额外层级 |
| 调试 | 显示 ForwardRef | 显示组件名 |
| 兼容性 | 所有版本 | React 19+ |
| useImperativeHandle | 需要 | 仍然需要 |

## ⚠️ 注意事项

### 1. useImperativeHandle 仍然需要

```jsx
// 暴露自定义方法仍然需要 useImperativeHandle
function CustomInput({ ref, ...props }) {
  const inputRef = useRef(null);
  
  useImperativeHandle(ref, () => ({
    // 暴露的方法
    focus: () => inputRef.current?.focus(),
    customMethod: () => {
      // 自定义逻辑
    },
  }));
  
  return <input ref={inputRef} {...props} />;
}
```

### 2. DOM 组件自动转发

```jsx
// DOM 组件（如 div, input）不需要 forwardRef
function Card({ ref, children, ...props }) {
  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  );
}
```

### 3. 第三方组件兼容

```jsx
// 对于还没升级的库，仍然需要 forwardRef
import { SomeComponent } from 'some-library';

// 如果库没升级，包装一下
const WrappedComponent = forwardRef((props, ref) => {
  return <SomeComponent {...props} forwardedRef={ref} />;
});
```

## 🧪 迁移指南

### 从 forwardRef 迁移

```jsx
// Before (React 18)
const Input = forwardRef((props, ref) => {
  return <input ref={ref} {...props} />;
});

// After (React 19)
function Input({ ref, ...props }) {
  return <input ref={ref} {...props} />;
}
```

### 保留 forwardRef 的情况

```jsx
// 需要支持 React 18 的库
export const Input = React.forwardRef((props, ref) => {
  return <input ref={ref} {...props} />;
});

// 或者使用条件导出
const InputImpl = ({ ref, ...props }) => {
  return <input ref={ref} {...props} />;
};

// React 19+ 直接导出
// 旧版本用 forwardRef 包装
```

## 🐛 常见问题

### Q: ref 可以作为普通对象使用吗？

```jsx
// ✅ 可以
function Child({ ref }) {
  console.log(ref);  // ref 对象
  return <input ref={ref} />;
}
```

### Q: 如何处理 ref 回调？

```jsx
// ref 回调同样有效
function Form() {
  return (
    <Input ref={(el) => {
      if (el) {
        console.log('mounted', el);
      }
    }} />
  );
}
```

---

## 📖 下一步

- [<Context> 作为 Provider](./context)
- [清理 useEffect 中的事件监听器](../implementation/use-effect)