# Renderer - 渲染器

Renderer 负责将 Fiber 渲染到具体的宿主环境（DOM、Native、Canvas 等）。

## 📦 React 的 Renderer 生态

```
React Core (packages/react)
    │
    ├──► ReactDOM (Web)
    ├──► React Native (iOS/Android)
    ├──► React Three Fiber (Three.js)
    ├──► React Ink (终端)
    └──► React PDF (PDF 文档)
```

## 🏛️ 架构设计

React 采用 **三层架构** 实现跨平台：

```
┌─────────────────────────────────────────┐
│            React Core (react)           │
│   - Component, createElement, Hooks     │
└───────────────────┬─────────────────────┘
                    │
┌───────────────────▼────────────────────┐
│      React Reconciler (通用协调器)      │
│   - Fiber, Diff, beginWork, complete   │
└───────────────────┬────────────────────┘
                    │
    ┌───────────────┼───────────────┐
    ▼               ▼               ▼
┌────────┐   ┌──────────┐   ┌──────────┐
│  DOM   │   │  Native  │   │  Three   │
│ Config │   │  Config  │   │  Config  │
└────────┘   └──────────┘   └──────────┘
```

## 🔧 Host Config

每个 Renderer 需要实现 **Host Config**：

```typescript
// packages/react-dom/src/client/ReactDOMHostConfig.js
export const supportsMutation = true;
export const supportsPersistence = false;
export const supportsHydration = true;

// 创建实例
export function createInstance(
  type: string,
  props: Object,
  rootContainerInstance: Container,
): Instance {
  const element = document.createElement(type);
  setInitialProperties(element, type, props);
  return element;
}

// 创建文本节点
export function createTextInstance(
  text: string,
): Instance {
  return document.createTextNode(text);
}

// 添加子节点
export function appendInitialChild(
  parent: Instance,
  child: Instance,
): void {
  parent.appendChild(child);
}

// 插入节点
export function insertBefore(
  parent: Instance,
  child: Instance,
  beforeChild: Instance,
): void {
  parent.insertBefore(child, beforeChild);
}

// 删除节点
export function removeChild(
  parent: Instance,
  child: Instance,
): void {
  parent.removeChild(child);
}

// 更新属性
export function commitUpdate(
  instance: Instance,
  type: string,
  oldProps: Object,
  newProps: Object,
): void {
  updateProperties(instance, type, oldProps, newProps);
}
```

## 📊 ReactDOM 实现详解

### 模块结构

```
packages/react-dom/
├── src/
│   ├── client/
│   │   ├── ReactDOMRoot.js           # createRoot
│   │   ├── ReactDOMHydrationRoot.js  # hydrateRoot
│   │   └── ReactFiberConfig.js       # Host Config
│   ├── server/
│   │   └── ReactDOMServer.js         # SSR
│   └── shared/
│       └── ReactControlledValue.js   # 表单控制
```

### createRoot 实现

```javascript
// packages/react-dom/src/client/ReactDOMRoot.js
export function createRoot(
  container: Container,
  options?: CreateRootOptions,
): RootType {
  // 1. 校验容器
  if (!isValidContainer(container)) {
    throw new Error('createRoot: invalid container');
  }
  
  // 2. 创建 Fiber Root
  const root = createContainer(
    container,
    ConcurrentRoot,
    null,
    false,
    null,
    'react-root',
    false
  );
  
  // 3. 创建 ReactRoot 实例
  const reactRoot = {
    render: (children) => {
      updateContainer(children, root, null, null);
    },
    unmount: () => {
      updateContainer(null, root, null, null);
    },
    _internalRoot: root,
  };
  
  return reactRoot;
}
```

### 属性更新

```javascript
// packages/react-dom-bindings/src/client/ReactDOMComponent.js
function updateProperties(domElement, type, lastProps, nextProps) {
  // 1. 处理事件
  for (const key in nextProps) {
    if (key.startsWith('on')) {
      const eventName = key.slice(2).toLowerCase();
      // 添加事件监听
      domElement.addEventListener(eventName, nextProps[key]);
    }
  }
  
  // 2. 处理样式
  if (nextProps.style) {
    setValueForStyles(domElement.style, nextProps.style);
  }
  
  // 3. 处理普通属性
  for (const propKey in nextProps) {
    if (propKey === 'children' || propKey === 'dangerouslySetInnerHTML') {
      continue;
    }
    
    const lastProp = lastProps[propKey];
    const nextProp = nextProps[propKey];
    
    if (lastProp !== nextProp) {
      setValueForProperty(domElement, propKey, nextProp, type);
    }
  }
  
  // 4. 处理 children
  if (typeof nextProps.children === 'string') {
    setTextContent(domElement, nextProps.children);
  }
}
```

### 事件系统

```javascript
// packages/react-dom-bindings/src/events/ReactDOMEventListener.js
function dispatchEvent(
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags,
  targetContainer: EventTarget,
  nativeEvent: AnyNativeEvent,
): void {
  // 1. 创建 React 合成事件
  const reactEvent = createSyntheticEvent(nativeEvent);
  
  // 2. 获取目标 Fiber
  const targetInst = getClosestInstanceFromNode(targetContainer);
  
  // 3. 构建事件路径
  const eventSystem = getEventSystem();
  
  // 4. 触发事件
  eventSystem.extractEvents(
    domEventName,
    targetInst,
    reactEvent,
    targetContainer
  );
  
  // 5. 批处理执行
  batchedUpdates(() => {
    processEventQueue(reactEvent);
  });
}
```

## 📱 React Native Renderer

### 差异点

```javascript
// React Native 的 Host Config
export function createInstance(
  type: string,
  props: Object,
): ReactNativeViewInstance {
  // 不是创建 DOM，而是创建 Native 视图
  return UIManager.createView(
    type,
    props,
    rootTag
  );
}

// 属性通过 Bridge 传递
export function commitUpdate(
  instance: ReactNativeViewInstance,
  type: string,
  oldProps: Object,
  newProps: Object,
): void {
  // 通过 Bridge 发送到 Native
  UIManager.updateView(
    instance._nativeTag,
    type,
    newProps
  );
}
```

### 通信架构

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │────▶│    Bridge   │◀────│   Native    │
│ JavaScript  │     │   (JSON)    │     │   (iOS/And) │
└─────────────┘     └─────────────┘     └─────────────┘
```

## 🎨 自定义 Renderer

### 最小实现

```javascript
// 使用 react-reconciler 创建自定义 Renderer
import ReactReconciler from 'react-reconciler';

const MyRenderer = ReactReconciler({
  // Host Config 实现
  supportsMutation: true,
  
  createInstance(type, props) {
    return { type, props, children: [] };
  },
  
  appendInitialChild(parent, child) {
    parent.children.push(child);
  },
  
  appendChild(parent, child) {
    parent.children.push(child);
  },
  
  insertBefore(parent, child, beforeChild) {
    const index = parent.children.indexOf(beforeChild);
    parent.children.splice(index, 0, child);
  },
  
  removeChild(parent, child) {
    const index = parent.children.indexOf(child);
    parent.children.splice(index, 1);
  },
  
  commitUpdate(instance, type, oldProps, newProps) {
    instance.props = newProps;
  },
  
  // ... 其他必需方法
});

// 使用
const container = MyRenderer.createContainer('root');
MyRenderer.updateContainer(<App />, container, null);
```

## 🔄 SSR 渲染

### ReactDOMServer

```javascript
// packages/react-dom/src/server/ReactDOMServer.js
import { renderToString, renderToPipeableStream } from './ReactDOMServerBrowser';

// 同步渲染为字符串
const html = renderToString(<App />);

// 流式渲染（React 18+）
const { pipe } = renderToPipeableStream(<App />, {
  onShellReady() {
    console.log('Shell ready');
  },
  onAllReady() {
    console.log('All ready');
  },
  onError(error) {
    console.error('Error:', error);
  },
});

pipe(response); // 发送到 HTTP 响应
```

### Suspense 支持

```jsx
// React 18 SSR 支持 Suspense
function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Comments />
    </Suspense>
  );
}

// 流式输出
// 1. 先输出外壳 HTML
// 2. Comments 加载完成后，发送对应片段
```

## 📊 性能优化

### 1. 事件委托

```javascript
// 不是每个节点都绑事件
// 而是在 root 上委托
rootElement.addEventListener('click', (e) => {
  const targetInst = getClosestInstanceFromNode(e.target);
  dispatchEvent(e, targetInst);
});
```

### 2. 批量更新

```javascript
// 多次 setState 合并为一次渲染
flushSync(() => {
  setCount(c => c + 1);
  setFlag(f => !f);
});
```

### 3.  hydrate 复用

```javascript
// SSR 后复用已有 DOM
hydrateRoot(container, <App />);
```

---

## 📖 下一步

- [事件系统架构](./events)
- [createRoot 源码解析](../implementation/create-root)