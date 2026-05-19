# 源码目录结构

## 📁 React 仓库概览

```
react/                           # https://github.com/facebook/react
├── packages/                    # 核心代码包
│   ├── react/                   # React 核心（Component, createElement 等）
│   ├── react-dom/               # DOM 渲染器
│   ├── react-reconciler/        # 协调器（核心算法）
│   ├── scheduler/               # 调度器
│   ├── react-jsx-runtime/       # JSX 运行时
│   ├── react-dom-bindings/      # DOM 绑定
│   └── ...
├── fixtures/                    # 测试示例
├── scripts/                     # 构建脚本
└── ...
```

## 🔍 核心包详解

### packages/react

React 核心 API，不包含渲染逻辑。

```
packages/react/
├── src/
│   ├── React.js                    # 导出所有 API
│   ├── ReactElement.js             # ReactElement 创建
│   ├── ReactComponent.js           # Component 基类
│   ├── ReactHooks.js               # Hooks 实现
│   ├── ReactCurrentDispatcher.js   # 当前 Dispatcher
│   └── ...
```

**关键文件**：
- `ReactElement.js` - `createElement` 实现
- `ReactHooks.js` - `useState`, `useEffect` 等 Hooks

### packages/shared

共享工具和常量。

```
packages/shared/
├── ReactTypeOfSideEffect.js     # 副作用类型
├── ReactLanePriority.js         # Lane 优先级
├── ReactSymbols.js              # 符号常量
└── ReactInstanceMap.js          # 实例映射
```

### packages/react-reconciler

协调器核心，最复杂的部分。

```
packages/react-reconciler/
├── src/
│   ├── ReactFiber.js                 # Fiber 节点创建
│   ├── ReactFiberBeginWork.js        # beginWork 实现
│   ├── ReactFiberCompleteWork.js     # completeWork 实现
│   ├── ReactFiberCommitWork.js       # commit 阶段
│   ├── ReactFiberHooks.js            # Hooks 更新
│   ├── ReactFiberThrow.js            # 错误处理
│   ├── ReactFiberWorkLoop.js         # 工作循环
│   └── ...
```

### packages/react-dom

DOM 渲染器。

```
packages/react-dom/
├── src/
│   ├── client/
│   │   ├── ReactDOMRoot.js           # createRoot
│   │   └── ReactDOMHydrationRoot.js  # hydrateRoot
│   ├── server/
│   │   └── ReactDOMServer.js         # SSR
│   └── ...
```

### packages/scheduler

调度器实现。

```
packages/scheduler/
├── src/
│   ├── Scheduler.js                  # 调度器主逻辑
│   ├── SchedulerPriorityLevels.js    # 优先级定义
│   └── SchedulerMinHeap.js           # 任务堆
```

## 🗺️ 关键调用链

### 渲染入口

```
ReactDOM.createRoot()
  └─> createContainer()
      └─> createFiberRoot()
          └─> updateContainer()
              └─> scheduleUpdateOnFiber()
                  └─> ensureRootIsScheduled()
                      └─> scheduleCallback()  [Scheduler]
```

### Hook 调用链

```
useState(initialValue)
  └─> resolveDispatcher()
      └─> mountState()  /  updateState()
          └─> dispatchSetState()
              └─> enqueueConcurrentHookUpdate()
                  └─> scheduleUpdateOnFiber()
```

## 📦 构建产物

```
build/
├── node_modules/           # Node 环境构建
├── umd/                    # UMD 浏览器版本
└── oss/                    # 开源版本
```

---

## 📖 下一步

- [构建开发环境](./setup) - 搭建本地调试环境