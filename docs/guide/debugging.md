# 如何调试 React 源码

## 🎯 为什么调试源码很重要

阅读源码时，仅仅"看"是不够的。通过调试，你可以：

- 看到代码实际执行的顺序
- 观察变量的实时变化
- 理解函数调用的上下文
- 验证你的理解是否正确

## 📥 步骤 1：克隆 React 仓库

```bash
git clone https://github.com/facebook/react.git
cd react
```

## 🔧 步骤 2：安装依赖

```bash
npm install
```

## 🏗️ 步骤 3：构建开发版本

```bash
# 构建 React 开发版本
npm run build react/index,react-dom/index --type=NODE

# 或者构建所有包
npm run build
```

构建完成后，产物在 `build/` 目录下。

## 🔍 步骤 4：设置调试环境

### 方式一：使用 React 官方式的 Debug 配置

1. 在 VS Code 中打开 React 仓库
2. 创建 `.vscode/launch.json`：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug React",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}",
      "sourceMaps": true
    }
  ]
}
```

### 方式二：直接在源码中调试

在感兴趣的源码位置添加 `debugger` 语句：

```javascript
// packages/react-reconciler/src/ReactFiberBeginWork.js
function beginWork(current, workInProgress, renderLanes) {
  debugger; // 断点
  // ... 其余代码
}
```

## 🧪 步骤 5：创建测试项目

创建一个简单的 React 项目用于调试：

```bash
npx create-react-app my-app --template cra-template
cd my-app
npm link ../react/build/node_modules/react
npm link ../react/build/node_modules/react-dom
```

或者使用 Vite（更轻量）：

```bash
npm create vite@latest my-app -- --template react
cd my-app
npm link ../react/build/node_modules/react
npm link ../react/build/node_modules/react-dom
```

## 🔬 调试技巧

### 1. 使用控制台打印 Fiber 树

```javascript
// 在浏览器控制台执行
console.log(
  document._reactRootContainer._internalRoot.current
);
```

### 2. 观察调度过程

在 Scheduler 中设置断点：

```javascript
// packages/scheduler/index.js
exports.unstable_runWithPriority = function(priorityLevel, eventHandler) {
  debugger;
  switch (priorityLevel) {
    // ...
  }
};
```

### 3. 使用 React DevTools Profiler

安装 [React DevTools](https://chrome.google.com/webstore/search/react%20devtools) 扩展，使用 Profiler 观察：

- 组件渲染次数
- 渲染耗时
- Fiber 树结构

## 📊 关键断点位置

| 模块 | 文件 | 函数 | 用途 |
|------|------|------|------|
| Scheduler | `scheduler/index.js` | `unstable_runWithPriority` | 观察优先级调度 |
| Reconciler | `ReactFiberBeginWork.js` | `beginWork` | 观察 render 阶段 |
| Reconciler | `ReactFiberCompleteWork.js` | `completeWork` | 观察完成工作 |
| Reconciler | `ReactFiberCommitWork.js` | `commitRoot` | 观察 commit 阶段 |
| Hooks | `ReactFiberHooks.js` | `updateReducer` | 观察 Hooks 更新 |

## 🐛 常见问题

### Q: 构建后代码被压缩了怎么办？

使用 `--type=NODE` 构建，不会被压缩：

```bash
npm run build react/index,react-dom/index --type=NODE
```

### Q: 断点不生效？

1. 确保使用的是开发版本（development）
2. 检查 source map 是否开启
3. 尝试清理浏览器缓存

### Q: 如何观察 Fiber 链表？

```javascript
// 从 Fiber 根节点遍历
function traverseFiber(fiber, depth = 0) {
  const indent = '  '.repeat(depth);
  console.log(`${indent}${fiber.type || fiber.tag}`);
  
  if (fiber.child) {
    traverseFiber(fiber.child, depth + 1);
  }
  if (fiber.sibling) {
    traverseFiber(fiber.sibling, depth);
  }
}

// 使用
const root = document._reactRootContainer._internalRoot.current;
traverseFiber(root);
```

## 🎓 实践练习

1. **练习 1**：在 `beginWork` 中设置断点，观察组件更新时的调用栈
2. **练习 2**：使用 `useState` 触发更新，观察 Scheduler 如何调度
3. **练习 3**：使用 `useTransition`，观察优先级变化

---

## 📖 下一步

- [源码目录结构](./structure) - 了解 React 仓库组织
- [构建开发环境](./setup) - 搭建本地开发环境