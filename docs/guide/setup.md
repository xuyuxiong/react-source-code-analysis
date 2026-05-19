# 构建开发环境

## 🎯 目标

搭建可以调试 React 源码的本地开发环境。

## 📋 前置要求

- Node.js >= 18.x
- npm >= 9.x
- Git

## 🔧 步骤

### 1. 克隆 React 仓库

```bash
git clone https://github.com/facebook/react.git
cd react
```

### 2. 安装依赖

```bash
npm install
```

### 3. 构建开发版本

```bash
# 构建 React 和 ReactDOM
npm run build react/index,react-dom/index --type=NODE

# 构建完整的 React
npm run build
```

### 4. 链接到测试项目

创建一个测试项目：

```bash
# 方式一：使用 Vite（推荐）
npm create vite@latest test-app -- --template react
cd test-app

# 链接本地 React
npm link ../react/build/node_modules/react
npm link ../react/build/node_modules/react-dom
```

### 5. 开始调试

```bash
cd test-app
npm run dev
```

## 🔍 调试技巧

### VS Code 配置

创建 `.vscode/launch.json`：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Chrome 调试",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}",
      "sourceMaps": true
    }
  ]
}
```

### 添加断点

在 React 源码中添加 `debugger` 语句：

```javascript
// packages/react-reconciler/src/ReactFiberBeginWork.js
function beginWork(current, workInProgress, renderLanes) {
  debugger; // 断点
  // ... 代码
}
```

## 📚 推荐配置

### VS Code 插件

- ESLint
- Prettier
- Reactjs code snippets

### Chrome 扩展

- React Developer Tools
- Redux DevTools（可选）

---

## 📖 下一步

开始学习 [如何调试 React 源码](./debugging)