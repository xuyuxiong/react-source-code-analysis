# Fiber 架构再探

Fiber 是 React 16+ 的核心数据结构，也是 Concurrent 模式的基石。

## 🤔 为什么需要 Fiber?

### React 15 的问题

```
┌─────────────────────────────────────────────┐
│          React 15 递归更新 (v15)             │
├─────────────────────────────────────────────┤
│                                             │
│  function render(vnode) {                   │
│    if (typeof vnode === 'string') {         │
│      return createTextElement(vnode);       │
│    }                                        │
│    const element = createElement(vnode);    │
│                                             │
│    // ❌ 问题：递归不可中断                  │
│    for (const child of vnode.children) {    │
│      render(child);  // 必须完成            │
│    }                                        │
│  }                                          │
│                                             │
│  // 大组件树会阻塞主线程                      │
│  render(largeTree);  // 🔥 卡顿!             │
│                                             │
└─────────────────────────────────────────────┘
```

**问题**：
- 递归更新不可中断
- 大组件树导致长时间阻塞
- 无法区分优先级

### Fiber 的解决方案

将递归重构为**可中断的遍历**：

```
┌─────────────────────────────────────────────┐
│          React 16+ Fiber 架构               │
├─────────────────────────────────────────────┤
│                                             │
│  function workLoop() {                      │
│    while (workInProgress && !shouldYield())│
│      performUnitOfWork(workInProgress);     │
│  }                                          │
│                                             │
│  // ✅ 可中断，可恢复                        │
│  // ✅ 支持优先级                            │
│  // ✅ 时间切片                              │
│                                             │
└─────────────────────────────────────────────┘
```

## 🌲 Fiber 数据结构

### 完整定义

```javascript
// packages/react-reconciler/src/ReactFiber.js
function FiberNode(tag, pendingProps, key, mode) {
  // === 组件实例属性 ===
  this.tag = tag;                    // Fiber 类型
  this.key = key;                    // key
  this.type = null;                  // 组件类型 (Function/Class/Host)
  
  // === Fiber 树结构 (链表) ===
  this.return = null;                // 父 Fiber
  this.child = null;                 // 第一个子 Fiber
  this.sibling = null;               // 下一个兄弟 Fiber
  
  // === 属性 ===
  this.pendingProps = pendingProps;  // 新的 props
  this.memoizedProps = null;         // 上次渲染的 props
  this.memoizedState = null;         // 上次渲染的 state
  
  // === 状态 ===
  this.stateNode = null;             // 真实 DOM / 实例
  
  // === 更新队列 ===
  this.updateQueue = null;
  
  // === 副作用 ===
  this.flags = NoFlags;              // 副作用标记
  this.subtreeFlags = NoFlags;       // 子树副作用
  this.deletions = null;             // 删除的子节点
  
  // === 优先级 ===
  this.lanes = NoLanes;              // 本次更新的优先级
  this.childLanes = NoLanes;         // 子树优先级
  
  // === 交替树 (双缓冲) ===
  this.alternate = null;             // 指向另一棵树的对应 Fiber
}
```

### 链表结构

Fiber 使用**孩子 - 兄弟链表**代替树：

```
// 树结构
      A
     / \
    B   C
   / \
  D   E

// Fibere 链表结构
      A
     /
    B → C
   /
  D → E

// 实际内存布局
A.child → B
B.return → A
B.sibling → C
C.return → A
B.child → D
D.return → B
D.sibling → E
E.return → B
```

**优势**：
- 遍历过程中可以方便地添加/删除节点
- 支持自底向上的遍历

## 🔄 双缓冲树

React 维护两棵 Fiber 树：

```
Current Tree (当前显示)    WorkInProgress Tree (内存中构建)
┌─────────────┐          ┌─────────────┐
│   Root      │          │   Root'     │
│     │       │          │     │       │
│   ┌─┴─┐     │          │   ┌─┴─┐     │
│   A   B     │          │   A'  B'    │
│   │   │     │          │   │   │     │
│   C   D     │          │   C'  D'    │
└─────────────┘          └─────────────┘
       │                        │
       └─────────┬──────────────┘
                 │
         commit 阶段切换指针
```

### 工作原理

```javascript
// render 阶段 - 在 WIP 树上工作
function workLoop() {
  while (workInProgress) {
    // 创建/更新 workInProgress 树
    beginWork(workInProgress);
    completeWork(workInProgress);
  }
}

// commit 阶段 - 切换树指针
function commitRoot() {
  // 将 workInProgress 树变为 current
  root.current = finishedWork;
  // 旧的 current 树变成下次的 workInProgress
}
```

## 🚶 遍历流程

### 深度优先遍历

```javascript
// packages/react-reconciler/src/ReactFiberWorkLoop.js
function workLoopSync() {
  while (workInProgress !== null) {
    workInProgress = performUnitOfWork(workInProgress);
  }
}

function performUnitOfWork(unit) {
  // 1. beginWork - 向下遍历
  const next = beginWork(current, unit, renderLanes);
  
  // 2. 没有子节点，向上回溯
  if (next === null) {
    completeUnitOfWork(unit);
  } else {
    // 3. 有子节点，继续向下
    workInProgress = next;
  }
  
  return workInProgress;
}

function completeUnitOfWork(unit) {
  let completedWork = unit;
  do {
    // 1. completeWork - 完成当前节点
    const next = completeWork(current, completedWork);
    
    // 2. 有兄弟，遍历兄弟
    if (next !== null) {
      workInProgress = next;
      return;
    }
    
    // 3. 没有兄弟，返回父节点
    completedWork = completedWork.return;
    current = completedWork;
  } while (completedWork !== null);
}
```

### 遍历顺序示例

对于组件树：
```
      App
     /   \
  Header  Main
         /   \
      Sidebar Content
```

遍历顺序：
```
beginWork: App → Header → (完成) → Main → Sidebar → (完成) → Content → (完成)
completeWork: Header ← App ← Main ← Sidebar ← Main ← Content ← Main ← App
```

## ⚛️ Fiber 的三种状态

### 1. Incomplete (未完成)

```
Fiber {
  flags: NoFlags,
  stateNode: null,  // 还未创建
}
```

### 2. Working (处理中)

```
Fiber {
  flags: PerformedWork,
  stateNode: <div>,  // 正在创建
  child: null,  // 子节点还在构建
}
```

### 3. Complete (完成)

```
Fiber {
  flags: Update | Ref,  // 收集副作用
  stateNode: <div>,
  child: [completed children],
  sibling: null,
}
```

## 🎯 并发支持

### 可中断恢复

```javascript
// 时间片结束，让出执行权
function shouldYield() {
  return getCurrentTime() >= deadline;
}

// 恢复执行
function resumeWork() {
  // workInProgress 保持不变
  // 下次从断点继续
  workLoop();
}
```

### 优先级插队

```javascript
// 高优先级任务可以打断低优先级
function scheduleUpdateOnFiber(fiber, lanes) {
  // 检查是否有更高优先级
  if (includesNonIdleWork(lanes)) {
    // 打断当前工作
    interruptWorkLoop();
    // 调度高优先级
    scheduleCallback(ImmediatePriority, () => {
      performConcurrentWorkOnRoot();
    });
  }
}
```

## 🔬 调试技巧

### 查看 Fiber 树

```javascript
// 在浏览器控制台
const root = document._reactRootContainer._internalRoot;
const currentFiber = root.current;

function printFiber(fiber, depth = 0) {
  const indent = '  '.repeat(depth);
  console.log(`${indent}${fiber.type?.name || fiber.tag}`);
  
  if (fiber.child) {
    printFiber(fiber.child, depth + 1);
  }
  if (fiber.sibling) {
    printFiber(fiber.sibling, depth);
  }
}

printFiber(currentFiber);
```

### 观察副作用

```javascript
// 收集所有有副作用的 Fiber
function collectEffects(fiber, effects = []) {
  if (fiber.flags !== NoFlags) {
    effects.push({
      type: fiber.type?.name,
      flags: fiber.flags,
    });
  }
  
  if (fiber.child) {
    collectEffects(fiber.child, effects);
  }
  if (fiber.sibling) {
    collectEffects(fiber.sibling, effects);
  }
  
  return effects;
}
```

---

## 📖 下一步

- [可中断渲染与时间切片](./time-slicing)
- [优先级模型：Lane 深度解析](./lane)