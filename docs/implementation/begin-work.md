# beginWork 详解

beginWork 是 React render 阶段的核心函数，负责向下遍历 Fiber 树并创建/更新子 Fiber。

## 📦 模块位置

```
packages/react-reconciler/src/
└── ReactFiberBeginWork.js    # beginWork 实现
```

## 🔍 函数签名

```javascript
// packages/react-reconciler/src/ReactFiberBeginWork.js

function beginWork(
  current: Fiber | null,     // 当前的 Fiber（旧树）
  workInProgress: Fiber,     // 工作中的 Fiber（新树）
  renderLanes: Lanes,        // 渲染优先级
): Fiber | null {
  // 返回第一个子 Fiber 或 null
}
```

## 🎯 核心职责

### 1. Props 比对

```javascript
function beginWork(current, workInProgress, renderLanes) {
  // 1. 读取 props
  const pendingProps = workInProgress.pendingProps;
  const currentProps = workInProgress.memoizedProps;
  
  // 2. 检查 props 是否变化
  const didReceiveUpdate = 
    checkIfWorkInProgressShouldUpdate(current, workInProgress);
  
  // 3. 如果没有变化且优先级足够，可以跳过
  if (!didReceiveUpdate && current !== null) {
    return bailoutOnAlreadyFinishedWork(
      current,
      workInProgress,
      renderLanes
    );
  }
  
  // 4. 根据组件类型分派处理
  switch (workInProgress.tag) {
    case FunctionComponent:
      return updateFunctionComponent(...);
    case ClassComponent:
      return updateClassComponent(...);
    case HostComponent:
      return updateHostComponent(...);
    // ... 其他类型
  }
}
```

### 2. 组件类型分发

```javascript
// 根据 tag 分发到不同更新函数
switch (workInProgress.tag) {
  // === 函数组件 ===
  case FunctionComponent:
  case SimpleMemoComponent:
    return updateFunctionComponent(
      current,
      workInProgress,
      Component,
      unresolvedProps
    );
  
  // === Class 组件 ===
  case ClassComponent: {
    const Component = workInProgress.type;
    if (isLegacyClassComponent(Component)) {
      return updateLegacyClassComponent(...);
    }
    return updateClassComponent(...);
  }
  
  // === DOM 元素 ===
  case HostComponent: {
    const type = workInProgress.type;
    return updateHostComponent(current, workInProgress, type);
  }
  
  // === 文本节点 ===
  case HostText: {
    return updateHostText(current, workInProgress);
  }
  
  // === Fragment ===
  case Fragment:
    return updateFragment(current, workInProgress);
  
  // === Suspense ===
  case SuspenseComponent:
    return updateSuspenseComponent(current, workInProgress);
  
  // === Context Provider ===
  case ContextProvider:
    return updateContextProvider(current, workInProgress);
  
  // === Context Consumer ===
  case ContextConsumer:
    return updateContextConsumer(current, workInProgress);
}
```

## 🔬 函数组件更新

### updateFunctionComponent

```javascript
// packages/react-reconciler/src/ReactFiberBeginWork.js

function updateFunctionComponent(
  current,
  workInProgress,
  Component,
  nextProps,
) {
  // 1. 准备渲染上下文
  prepareToReadContext(workInProgress, renderLanes);
  
  // 2. 调用函数组件
  let nextChildren;
  if (__DEV__) {
    // 开发模式下有额外检查
    ReactCurrentOwner.current = workInProgress;
    setIsRendering(true);
    nextChildren = renderWithHooks(
      current,
      workInProgress,
      Component,
      nextProps,
      undefined,
      workInProgress.mode
    );
  } else {
    nextChildren = renderWithHooks(
      current,
      workInProgress,
      Component,
      nextProps,
      undefined,
      workInProgress.mode
    );
  }
  
  // 3. 处理纯函数组件的优化
  if (current !== null && !didReceiveUpdate) {
    bailoutHooks(current, workInProgress, renderLanes);
    return bailoutOnAlreadyFinishedWork(
      current,
      workInProgress,
      renderLanes
    );
  }
  
  // 4. 协调子节点
  workInProgress.flags |= PerformedWork;
  reconcileChildren(current, workInProgress, nextChildren);
  
  // 5. 返回第一个子节点
  return workInProgress.child;
}
```

### renderWithHooks

```javascript
// 调用组件函数并处理 Hooks
export function renderWithHooks(
  current,
  workInProgress,
  Component,
  props,
  secondArg,
  nextRenderLanes,
) {
  // 1. 设置当前渲染的 Fiber
  workInProgress.memoizedState = null;
  workInProgress.updateQueue = null;
  workInProgress.lanes = NoLanes;
  
  // 2. 设置 Hooks 调度器
  ReactCurrentDispatcher.current =
    current === null || current.memoizedState === null
      ? HooksDispatcherOnMount  // 首次渲染
      : HooksDispatcherOnUpdate; // 更新渲染
  
  // 3. 调用组件函数
  let children = Component(props, secondArg);
  
  // 4. 处理 didScheduleRenderPhaseUpdate
  if (didScheduleRenderPhaseUpdate) {
    // 处理渲染阶段的更新（如 setState）
    children = renderWithHooksAgain(...);
  }
  
  // 5. 重置调度器
  ReactCurrentDispatcher.current = ContextOnlyDispatcher;
  
  return children;
}
```

## 🔄 Class 组件更新

### updateClassComponent

```javascript
function updateClassComponent(
  current,
  workInProgress,
  Component,
  resolvedProps,
  renderLanes,
) {
  // 1. 准备上下文
  prepareToReadContext(workInProgress, renderLanes);
  
  // 2. 获取或通过创建实例
  const instance = workInProgress.stateNode;
  let shouldUpdate;
  
  if (instance === null) {
    // 首次渲染，创建实例
    constructClassInstance(
      workInProgress,
      Component,
      resolvedProps,
    );
    mountClassInstance(
      workInProgress,
      Component,
      resolvedProps,
      renderLanes,
    );
    shouldUpdate = true;
  } else {
    // 更新渲染
    shouldUpdate = updateClassInstance(
      current,
      workInProgress,
      Component,
      resolvedProps,
      renderLanes,
    );
  }
  
  // 3. 渲染组件
  return finishClassComponent(
    current,
    workInProgress,
    Component,
    shouldUpdate,
    resolvedProps,
    renderLanes,
  );
}
```

### finishClassComponent

```javascript
function finishClassComponent(
  current,
  workInProgress,
  Component,
  shouldUpdate,
  props,
  renderLanes,
) {
  // 1. 获取 render 结果
  const instance = workInProgress.stateNode;
  
  // 2. 调用 render 方法
  const nextChildren = instance.render();
  
  // 3. 处理 context
  if (current !== null && !shouldUpdate) {
    // 可以复用之前的结果
    const currentChild = workInProgress.child;
    return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
  }
  
  // 4. 协调子节点
  workInProgress.flags |= PerformedWork;
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  
  // 5. 返回子节点
  return workInProgress.child;
}
```

## 🏠 Host Component 更新

### updateHostComponent

```javascript
function updateHostComponent(
  current,
  workInProgress,
  type,
  newProps,
  renderLanes,
) {
  // 1. 如果是文本输入，处理特殊逻辑
  if (type === 'input' || type === 'textarea' || type === 'select') {
    // 处理受控/非受控
    initWrapperState(workInProgress, newProps);
  }
  
  // 2. 标记需要更新
  markUpdate(workInProgress);
  
  // 3. 协调子节点
  reconcileChildren(current, workInProgress, newProps.children);
  
  // 4. 返回子节点
  return workInProgress.child;
}
```

## 🚫 BAIL OUT 优化

### bailoutOnAlreadyFinishedWork

```javascript
function bailoutOnAlreadyFinishedWork(
  current,
  workInProgress,
  renderLanes,
) {
  // 如果当前组件不需要更新，跳过子树
  
  // 1. 清除副作用
  workInProgress.flags &= ~ForceUpdateForLegacySuspense;
  
  // 2. 检查子节点优先级
  if (!includesSomeLane(renderLanes, workInProgress.childLanes)) {
    // 子节点也没有更新，完全跳过
    return null;
  }
  
  // 3. 部分更新，继续推进子节点
  cloneChildFibers(current, workInProgress);
  return workInProgress.child;
}
```

### 判断是否需要更新

```javascript
function checkIfWorkInProgressShouldUpdate(current, workInProgress) {
  const currentProps = current.memoizedProps;
  const newProps = workInProgress.pendingProps;
  
  // 1. props 浅比较
  if (currentProps !== newProps) {
    return true;  // props 变化，需要更新
  }
  
  // 2. 检查 state/refs/hooks
  if (workInProgress.flags & ForceUpdate) {
    return true;  // 强制更新
  }
  
  // 3. 检查 context
  if (hasContextChanged()) {
    return true;  // context 变化
  }
  
  return false;  // 不需要更新
}
```

## 🌲 遍历流程

```
beginWork 向下遍历示例：

      App (current)           App (workInProgress)
        │                        │
        ▼                        ▼
     beginWork()              beginWork()
        │                        │
        │                    分派到 FunctionComponent
        │                        │
        │                 renderWithHooks()
        │                        │
        │                 reconcileChildren()
        │                        │
        └──────────────────► 返回 child (Header)
                                │
                                ▼
                         beginWork(Header)
                                │
                                ▼
                         beginWork(Main)
                                │
                                ▼
                         beginWork(Footer)
```

## 📊 副作用标记

```javascript
// 在 beginWork 中设置的 flags

// 需要执行 DOM 更新
workInProgress.flags |= Update;

// 需要重新创建 DOM
workInProgress.flags |= Placement;

// 需要删除
workInProgress.flags |= Deletion;

// 已完成工作
workInProgress.flags |= PerformedWork;

// Context 变化
workInProgress.flags |= DidPropagateContext;

// 需要更新 Context 消费者
workInProgress.flags |= ContextChanged;
```

## 🔬 调试技巧

### 追踪 beginWork 调用

```javascript
// 开发模式下添加日志
const originalBeginWork = beginWork;
beginWork = function(current, workInProgress, renderLanes) {
  console.group('beginWork');
  console.log('Tag:', workInProgress.tag);
  console.log('Type:', workInProgress.type);
  console.log('Props:', workInProgress.pendingProps);
  console.log('Flags:', workInProgress.flags);
  
  const result = originalBeginWork(current, workInProgress, renderLanes);
  
  console.log('Child:', result?.type || result?.tag);
  console.groupEnd();
  
  return result;
};
```

### 观察 bailout

```javascript
// 检查什么时候触发了 bailout
function bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes) {
  console.log('Bailout triggered:', {
    type: workInProgress.type,
    lanes: renderLanes,
    childLanes: workInProgress.childLanes,
  });
  
  return originalBailout(current, workInProgress, renderLanes);
}
```

## 🐛 常见问题

### Q: beginWork 什么时候返回 null？

**A**: 当组件没有子节点时（如文本节点或空的 Fragment）。

### Q: 如何跳过不必要的更新？

```jsx
// ✅ 使用 React.memo
const MemoComponent = React.memo(({ value }) => {
  return <div>{value}</div>;
});

// ✅ 使用 useMemo
const expensive = useMemo(() => compute(value), [value]);

// ✅ 使用 useCallback
const handler = useCallback(() => {
  doSomething(value);
}, [value]);
```

### Q: bailout 会跳过 Hooks 吗？

**A**: 不会。即使 bailout 跳过了组件，Hooks 仍然会执行，因为需要检查依赖是否变化。

---

## 📖 下一步

- [completeWork 详解](./complete-work) - render 阶段的向上回溯
- [commit 阶段](./commit-before-mutation) - DOM 操作