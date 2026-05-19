# completeWork 详解

completeWork 是 beginWork 的对称操作，在遍历到叶子节点后向上回溯，创建/克隆 DOM 节点并收集副作用。

## 📦 模块位置

```
packages/react-reconciler/src/
└── ReactFiberCompleteWork.js    # completeWork 实现
```

## 🔍 函数签名

```javascript
// packages/react-reconciler/src/ReactFiberCompleteWork.js

function completeWork(
  current: Fiber | null,     // 当前的 Fiber（旧树）
  workInProgress: Fiber,     // 工作中的 Fiber（新树）
  renderLanes: Lanes,        // 渲染优先级
): Fiber | null {
  // 返回兄弟 Fiber 或父 Fiber
}
```

## 🎯 核心职责

### 1. Host Component 处理

```javascript
function completeWork(current, workInProgress, renderLanes) {
  const newProps = workInProgress.pendingProps;
  
  switch (workInProgress.tag) {
    // === DOM 元素 ===
    case HostComponent: {
      const type = workInProgress.type;
      
      if (current !== null && workInProgress.stateNode != null) {
        // 更新现有实例
        updateHostComponent(
          current,
          workInProgress,
          type,
          newProps,
        );
      } else {
        // 创建新实例
        createHostInstance(workInProgress, type, newProps);
      }
      
      return null;  // 完成，返回 null 触发向上回溯
    }
    
    // === 文本节点 ===
    case HostText: {
      const newText = newProps;
      if (current && workInProgress.stateNode != null) {
        updateHostText(current, workInProgress, newText);
      } else {
        createHostTextInstance(workInProgress, newText);
      }
      return null;
    }
    
    // === Fragment ===
    case Fragment:
      return null;
    
    // === Function/Class 组件 ===
    case FunctionComponent:
    case ClassComponent:
      return null;  // 组件本身不需要特殊处理
    
    // === Suspense ===
    case SuspenseComponent:
      return updateSuspenseComponent(
        current,
        workInProgress,
        renderLanes,
      );
  }
  
  return null;
}
```

### 2. 创建 Host Instance

```javascript
// packages/react-dom-bindings/src/client/ReactDOMComponent.js

function createHostInstance(workInProgress, type, props) {
  const container = getRootContainer();
  
  // 1. 创建 DOM 元素
  const instance = document.createElement(type);
  
  // 2. 设置属性
  setInitialProperties(instance, type, props);
  
  // 3. 设置内部标记
  precacheFiberNode(workInProgress, instance);
  markContainerAsRoot(instance);
  
  // 4. 保存到 stateNode
  workInProgress.stateNode = instance;
  
  // 5. 标记需要追加子节点
  markUpdate(workInProgress);
}
```

### 3. 设置初始属性

```javascript
// packages/react-dom-bindings/src/client/ReactDOMComponent.js

function setInitialProperties(domElement, type, props) {
  // 1. 验证属性
  if (__DEV__) {
    validateProperties(type, props);
  }
  
  // 2. 处理特殊属性
  if (type === 'input') {
    initWrapperState(domElement, props);
  } else if (type === 'select') {
    initWrapperState(domElement, props);
  } else if (type === 'textarea') {
    initWrapperState(domElement, props);
  }
  
  // 3. 设置普通属性
  for (const propKey in props) {
    if (propKey === 'children' || propKey === 'dangerouslySetInnerHTML') {
      continue;
    }
    
    const propValue = props[propKey];
    if (propValue == null) {
      continue;
    }
    
    // 事件、样式、普通属性分别处理
    setProp(domElement, type, propKey, propValue);
  }
  
  // 4. 处理 children
  const { children } = props;
  if (typeof children === 'string') {
    setTextContent(domElement, children);
  } else if (typeof children === 'number') {
    setTextContent(domElement, '' + children);
  }
}
```

### 4. 追加子节点

```javascript
// completeWork 完成后，会将子节点添加到父节点

function appendAllChildren(
  parent: Instance,
  workInProgress: Fiber,
) {
  let node = workInProgress.child;
  
  while (node !== null) {
    if (node.tag === HostComponent || node.tag === HostText) {
      // DOM 节点或文本节点，直接追加
      parent.appendChild(node.stateNode);
    } else if (node.child !== null) {
      // 有子节点，递归查找
      node.child.return = node;
      node = node.child;
      continue;
    }
    
    // 移动到兄弟节点
    if (node === workInProgress) {
      return;
    }
    
    while (node.sibling === null) {
      if (node.return === null || node.return === workInProgress) {
        return;
      }
      node = node.return;
    }
    
    node.sibling.return = node.return;
    node = node.sibling;
  }
}
```

## 🔄 完整流程

```
完整的 completeWork 流程：

beginWork 向下遍历完成
     │
     ▼
到达叶子节点（如文本或 DOM）
     │
     ▼
completeWork 开始
     │
     ├───► HostComponent: 创建/更新 DOM
     │
     ├───► HostText: 创建/更新文本
     │
     ├───► Fragment: 无操作
     │
     └───► Suspense: 处理 suspense 逻辑
     
     │
     ▼
appendAllChildren: 添加子节点
     │
     ▼
收集副作用（flags）
     │
     ▼
返回兄弟或 null
     │
     ├───► 有兄弟: 继续处理兄弟
     │
     └───► 无兄弟: 返回父节点（向上回溯）
```

## 📊 Suspense 处理

```javascript
function updateSuspenseComponent(
  current,
  workInProgress,
  renderLanes,
) {
  const nextProps = workInProgress.pendingProps;
  
  // 1. 检查是否处于 suspended 状态
  const didSuspend = (workInProgress.flags & DidCapture) !== NoFlags;
  
  if (didSuspend) {
    // 被捕获，显示 fallback
    return reappearWorkInProgress(
      current,
      workInProgress,
      nextProps.fallback,
      renderLanes,
    );
  }
  
  // 2. 检查是否需要显示 fallback
  const showFallback = shouldShowFallback(
    nextProps,
    current?.memoizedState,
  );
  
  if (showFallback) {
    // 显示 fallback
    workInProgress.memoizedState = {
      dehydrated: false,
      boundary: null,
      fallbackChildSet: null,
    };
    
    return createWorkInProgressFromFallback(
      workInProgress,
      nextProps.fallback,
    );
  } else {
    // 显示 primary children
    return null;
  }
}
```

## 🏠 Context Provider 处理

```javascript
function updateContextProvider(
  current,
  workInProgress,
  renderLanes,
) {
  const context = workInProgress.type;
  const newProps = workInProgress.pendingProps;
  const oldProps = workInProgress.memoizedProps;
  
  // 1. 获取新的 context 值
  const newValue = newProps.value;
  
  // 2. 检查值是否变化
  if (current !== null) {
    const oldValue = oldProps.value;
    
    if (Object.is(oldValue, newValue)) {
      // 值没有变化，可以 bailout
      if (!workInProgress.updateQueue && !workInProgress.flags) {
        workInProgress.lanes = workInProgress.childLanes;
        return bailoutOnAlreadyFinishedWork(
          current,
          workInProgress,
          renderLanes,
        );
      }
    }
  }
  
  // 3. 标记 context 变化
  pushProvider(workInProgress, context, newValue);
  
  // 4. 协调子节点
  reconcileChildren(current, workInProgress, newProps.children);
  
  return workInProgress.child;
}
```

## ⚠️ 副作用收集

```javascript
// 在 completeWork 中收集的副作用

// 需要创建 DOM
workInProgress.flags |= Placement;

// 需要更新属性
workInProgress.flags |= Update;

// 需要删除子节点
workInProgress.flags |= ChildDeletion;

// 需要捕获错误
workInProgress.flags |= DidCapture;

// Context 变化
workInProgress.flags |= DidPropagateContext;

// 需要更新 Ref
workInProgress.flags |= Ref;
```

## 🔬 源码深度

### pushWorkInProgress

```javascript
// packages/react-reconciler/src/ReactFiberCompleteWork.js

function pushWorkInProgress(workInProgress) {
  // 将完成的 Fiber 推入完成队列
  // 后续在 commit 阶段处理
  
  const subtreeFlags = workInProgress.subtreeFlags;
  
  if (subtreeFlags !== NoFlags) {
    // 子树有副作用，标记父节点
    let parent = workInProgress.return;
    
    while (parent !== null) {
      parent.subtreeFlags |= subtreeFlags;
      parent = parent.return;
    }
  }
}
```

### markUpdate

```javascript
// 标记组件需要更新 DOM

function markUpdate(workInProgress) {
  workInProgress.flags |= Update;
  
  // 同时标记父节点
  let parent = workInProgress.return;
  while (parent !== null) {
    parent.subtreeFlags |= Update;
    parent = parent.return;
  }
}
```

## 🔄 遍历示例

```
completeWork 向上回溯：

    App
   /   \
Header  Main
       /   \
   Sidebar Content

遍历顺序:
1. beginWork(App) → 返回 Header
2. beginWork(Header) → 返回 null (无子)
3. completeWork(Header) → 创建 DOM
4. 移动到 Main
5. beginWork(Main) → 返回 Sidebar
6. beginWork(Sidebar) → 返回 null
7. completeWork(Sidebar) → 创建 DOM
8. 移动到 Content
9. beginWork(Content) → 返回 null
10. completeWork(Content) → 创建 DOM
11. completeWork(Main) → 附加 Sidebar 和 Content
12. completeWork(App) → 附加 Header 和 Main
```

## 📊 flags 传递

```
flags 向上传递示例:

    App (subtreeFlags |= Placement)
   /   \
Header  Main (subtreeFlags |= Update)
        /   \
   Sidebar (Update)  Content (Placement)
   
SIDEBAR 需要 Update
  │
  └──► 标记 Main.subtreeFlags |= Update
           │
           └──► 标记 App.subtreeFlags |= Update

CONTENT 需要 Placement
  │
  └──► 标记 Main.subtreeFlags |= Placement
           │
           └──► 标记 App.subtreeFlags |= Placement
```

## 🔬 调试技巧

### 追踪 completeWork

```javascript
// 开发模式下添加日志
const originalCompleteWork = completeWork;
completeWork = function(current, workInProgress, renderLanes) {
  console.group('completeWork');
  console.log('Tag:', workInProgress.tag);
  console.log('Type:', workInProgress.type);
  console.log('StateNode:', workInProgress.stateNode);
  console.log('Flags:', workInProgress.flags);
  console.log('SubtreeFlags:', workInProgress.subtreeFlags);
  
  const result = originalCompleteWork(current, workInProgress, renderLanes);
  
  console.log('Result:', result);
  console.groupEnd();
  
  return result;
};
```

### 观察 DOM 创建

```javascript
// 拦截 createElement
const originalCreateElement = document.createElement;
document.createElement = function(tagName) {
  console.log('Creating element:', tagName);
  console.trace('Call stack');
  return originalCreateElement.call(this, tagName);
};
```

## 🐛 常见问题

### Q: completeWork 什么时候创建 DOM？

**A**: 当 `current === null` 或 `workInProgress.stateNode === null` 时。

### Q: 为什么需要 subtreeFlags？

**A**: subtreeFlags 记录子树的副作用，commit 阶段可以快速判断哪些子树需要处理。

### Q: Host Component 和 Class Component 处理有什么区别？

**A**: 
- Host Component 创建/更新 DOM
- Class Component 不需要特殊处理（render 结果已经在 beginWork 处理）

---

## 📖 下一步

- [commit Before Mutation](./commit-before-mutation) - 快照与清理
- [commit Mutation](./commit-mutation) - DOM 操作
- [commit Layout](./commit-layout) - 副作用应用