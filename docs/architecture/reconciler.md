# Reconciler - 协调器核心

Reconciler 是 React 的核心，负责计算差异（Diff）并构建 Fiber 树。

## 📦 模块位置

```
packages/react-reconciler/
├── src/
│   ├── ReactFiber.js                 # Fiber 节点创建
│   ├── ReactFiberBeginWork.js        # beginWork 实现
│   ├── ReactFiberCompleteWork.js     # completeWork 实现
│   ├── ReactFiberCommitWork.js       # commit 阶段
│   ├── ReactFiberHooks.js            # Hooks 处理
│   ├── ReactFiberThrow.js            # 错误处理
│   ├── ReactFiberWorkLoop.js         # 工作循环
│   └── ReactChildFiber.js            # Diff 算法
```

## 🔄 核心工作流程

```
render 阶段（可中断，并发执行）
    ↓
beginWork(向下遍历)
    ↓
completeWork(向上回溯)
    ↓
collectEffects(收集副作用)
    ↓
commit 阶段（不可中断，同步执行）
    ↓
commitBeforeMutation
    ↓
commitMutation
    ↓
commitLayout
```

## 🔍 beginWork 详解

### 职责

1. 比对当前 Fiber 和新的 props
2. 创建/复用子 Fiber
3. 返回第一个子 Fiber（继续向下）

### 核心逻辑

```javascript
// packages/react-reconciler/src/ReactFiberBeginWork.js
function beginWork(current, workInProgress, renderLanes) {
  // 1. 比对 props，判断是否需要更新
  const didReceiveUpdate = reconcileProps(
    current,
    workInProgress.pendingProps,
    renderLanes
  );

  // 2. 根据组件类型分派处理
  switch (workInProgress.tag) {
    case FunctionComponent:
      return updateFunctionComponent(
        current,
        workInProgress,
        workInProgress.type,
        workInProgress.pendingProps
      );
    case ClassComponent:
      return updateClassComponent(
        current,
        workInProgress,
        workInProgress.type,
        workInProgress.pendingProps
      );
    case HostComponent:
      return updateHostComponent(
        current,
        workInProgress
      );
    case Fragment:
      return updateFragment(current, workInProgress);
    // ... 其他类型
  }
}
```

### 组件更新流程

```javascript
function updateFunctionComponent(
  current,
  workInProgress,
  Component,
  nextProps
) {
  // 1. 调用函数组件，获取 children
  const nextChildren = Component(nextProps);
  
  // 2. 协调子节点
  reconcileChildren(current, workInProgress, nextChildren);
  
  // 3. 返回子 Fiber
  return workInProgress.child;
}
```

## 🔍 completeWork 详解

### 职责

1. 创建/克隆 DOM 节点
2. 收集副作用
3. 返回兄弟 Fiber 或父 Fiber

### 核心逻辑

```javascript
// packages/react-reconciler/src/ReactFiberCompleteWork.js
function completeWork(current, workInProgress, renderLanes) {
  switch (workInProgress.tag) {
    case HostComponent:
      return completeHostComponent(current, workInProgress);
    case HostText:
      return completeHostText(current, workInProgress);
    case FunctionComponent:
      return null; // 函数组件不需要额外工作
    case ClassComponent:
      return null;
    case Fragment:
      return null;
  }
}

function completeHostComponent(current, workInProgress) {
  const type = workInProgress.type;
  const props = workInProgress.pendingProps;
  
  let instance;
  
  if (current !== null && workInProgress.stateNode != null) {
    // 1. 更新现有实例
    updateHostComponent(
      current,
      workInProgress,
      type,
      props
    );
  } else {
    // 2. 创建新实例
    instance = createInstance(
      type,
      props,
      rootContainerInstance
    );
    
    // 3. 将所有子节点添加到实例
    appendAllChildren(instance, workInProgress);
    
    workInProgress.stateNode = instance;
  }
  
  // 4. 标记副作用
  markUpdate(workInProgress);
  
  return null; // 完成，返回兄弟或父节点
}
```

## 🔍 commitRoot 详解

### 职责

将 Fiber 树的变更应用到真实 DOM

### 三个阶段

```javascript
function commitRoot(root) {
  const finishedWork = root.finishedWork;
  
  // 1. Before Mutation 阶段
  commitBeforeMutationEffects(root, finishedWork);
  
  // 2. Mutation 阶段
  commitMutationEffects(root, finishedWork);
  
  // 3. Layout 阶段
  commitLayoutEffects(finishedWork, root);
  
  // 4. 更新状态
  root.current = finishedWork;
  
  return null;
}
```

### Before Mutation

```javascript
function commitBeforeMutationEffects(root, firstChild) {
  // 1. 计算快照（getSnapshotBeforeUpdate）
  // 2. 处理 useEffect 的 destroy
  // 3. 调用 getSnapshotBeforeUpdate
}
```

### Mutation

```javascript
function commitMutationEffects(root, firstChild) {
  // 遍历副作用列表，执行 DOM 操作
  forEachEffect(effect => {
    switch (effect.flags & flags) {
      case Placement:
        commitPlacement(effect);
        break;
      case Update:
        commitUpdate(effect);
        break;
      case Deletion:
        commitDeletion(root, effect);
        break;
    }
  });
}
```

### Layout

```javascript
function commitLayoutEffects(finishedWork, root) {
  // 1. 调用 useLayoutEffect
  // 2. 调用 componentDidMount/Update
  // 3. 更新 ref
  
  forEachEffect(effect => {
    if (effect.flags & Layout) {
      switch (effect.tag) {
        case FunctionComponent:
          commitHookEffectList(effect);
          break;
        case ClassComponent:
          const instance = effect.stateNode;
          if (typeof instance.componentDidMount === 'function') {
            instance.componentDidMount();
          }
          break;
      }
    }
  });
}
```

## 🌲 Fiber 树遍历

### beginWork（向下）

```
       A
      / \
     B   C
    / \
   D   E

// 顺序：A -> B -> D -> (D 完成) -> E
```

### completeWork（向上）

```
       A
      / \
     B   C
    / \
   D   E

// 顺序：(D 完成) -> B -> E -> (E 完成) -> B 完成 -> C
```

## 📊 副作用列表

```javascript
// 副作用类型
const NoFlags = 0b00000000000;
const PerformedWork = 0b00000000001;
const Placement = 0b00000000010;      // 插入节点
const Update = 0b00000000100;         // 更新属性
const Deletion = 0b00000001000;       // 删除节点
const ChildDeletion = 0b00000010000;  // 删除子节点
const ContentReset = 0b00000100000;
const Callback = 0b00001000000;
const DidCapture = 0b00010000000;
const Ref = 0b00100000000;            // ref
const Snapshot = 0b01000000000;
const Passive = 0b10000000000;        // useEffect
```

## 🎯 Diff 算法集成

```javascript
function reconcileChildren(current, workInProgress, nextChildren) {
  if (current === null) {
    // 首次渲染
    workInProgress.child = mountChildFibers(
      workInProgress,
      null,
      nextChildren
    );
  } else {
    // 更新
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren
    );
  }
}
```

## 🐛 常见问题

### Q: beginWork 返回 null 是什么意思？

**A**: 表示没有子节点，开始向上回溯（completeWork）。

### Q: 为什么 commit 阶段不可中断？

**A**: DOM 操作必须是同步的，否则用户会看到不一致的 UI 状态。

### Q: Fiber 节点何时被释放？

**A**: 完成 commit 后，旧的 Fiber 树不再被引用，由 GC 回收。

---

## 📖 下一步

- [Renderer - 渲染器](./renderer)
- [开始工作循环](../implementation/begin-work)