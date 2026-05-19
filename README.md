# React 源码深度解析

> React 18/19 完整源码学习指南 - 从理念到架构到实现

[![Status](https://img.shields.io/badge/status-complete-brightgreen)](https://github.com/xuyuxiong/react-source-code-analysis)
[![React](https://img.shields.io/badge/React-18/19-61dafb)](https://react.dev)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

---

## 📖 项目简介

本项目是一本完整的 React 源码学习指南，参考「React 技术揭秘」的实现方式，**全面更新 React 18/19 新特性与源码架构**。

相比原版，本项目的特点：
- 🆕 **内容更新**：覆盖 React 18/19，而非 v17
- 📊 **图解更多**：大量可视化架构图
- 🎮 **可交互 Demo**：边学边练
- 📱 **现代化体验**：响应式设计、暗色模式

👉 **在线阅读**：[https://xuyuxiong.github.io/react-source-code-analysis/](https://xuyuxiong.github.io/react-source-code-analysis/)

---

## ✅ 完成情况

**50 章完整内容，100% 完成！**

| 部分 | 章节数 | 状态 |
|------|--------|------|
| 📘 指南篇 | 5 章 | ✅ 完成 |
| 📗 理念篇 | 5 章 | ✅ 完成 |
| 📙 架构篇 | 8 章 | ✅ 完成 |
| 📕 实现篇 | 23 章 | ✅ 完成 |
| 📔 React 19 | 9 章 | ✅ 完成 |

---

## 📚 内容概览

### 指南篇 - 入门准备
- 学习前提
- React 18/19 新特性总览
- 如何调试 React 源码
- 源码目录结构
- 构建开发环境

### 理念篇 - 设计思想
- 为什么需要 Concurrent React
- Fiber 架构再探
- 可中断渲染与时间切片
- 优先级模型：Lane 深度解析
- 并发特性的设计理念

### 架构篇 - 整体架构
- React 18 整体架构图解
- Scheduler - 调度器核心
- Reconciler - 协调器
- Renderer - 渲染器
- 事件系统架构
- Hook 系统架构
- Suspense 架构
- Concurrent Features 架构

### 实现篇 - 源码解析

**渲染流程**
- createRoot 源码解析
- beginWork 详解
- completeWork 详解
- commit Before Mutation
- commit Mutation
- commit Layout

**核心算法**
- Diff 算法（单节点/多节点）
- 优先级调度算法
- 任务调度与时间切片

**Hooks 实现**
- useState / useReducer
- useEffect / useLayoutEffect
- useMemo / useCallback
- useRef / useContext
- useTransition / useDeferredValue
- useId / useSyncExternalStore

**Suspense 与并发**
- Suspense 工作原理
- Lazy Loading
- Error Boundaries
- Automatic Batching

### React 19 新特性
- React 19 总览
- React Compiler 原理
- Actions 服务器动作
- useFormStatus / useFormState
- useOptimistic
- Document Metadata
- 资源预加载 APIs
- ref 无需 forwardRef
- \<Context\> 作为 Provider

---

## 🚀 快速开始

### 本地开发

```bash
# 克隆项目
git clone https://github.com/xuyuxiong/react-source-code-analysis.git
cd react-source-code-analysis

# 安装依赖
npm install

# 启动开发服务器
npm run docs:dev
```

访问 http://localhost:5173

### 构建

```bash
# 构建静态文件
npm run docs:build

# 预览构建结果
npm run docs:preview
```

---

## 🛠️ 技术栈

| 项目 | 技术 |
|------|------|
| 文档框架 | [VitePress](https://vitepress.dev) |
| 构建工具 | Vite |
| 代码高亮 | Shiki |
| 图表 | Mermaid |
| 部署 | GitHub Actions + GitHub Pages |

---

## 📁 项目结构

```
react-source-code-analysis/
├── docs/                    # 文档目录
│   ├── .vitepress/         # VitePress 配置
│   │   ├── config.ts       # 站点配置
│   │   └── theme/          # 主题自定义
│   ├── guide/              # 指南篇 (5 章)
│   ├── philosophy/         # 理念篇 (5 章)
│   ├── architecture/       # 架构篇 (8 章)
│   ├── implementation/     # 实现篇 (23 章)
│   ├── react19/            # React 19 (9 章)
│   └── index.md            # 首页
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Actions 部署
├── package.json
├── README.md
└── PROGRESS.md             # 项目进度
```

---

## 🎯 适合人群

- ✅ 有 1-2 年 React 使用经验
- ✅ 熟悉 JavaScript/TypeScript
- ✅ 对原理有好奇心
- ✅ 愿意投入时间深入学习

---

## 📖 学习路线

```mermaid
graph LR
    A[指南篇<br/>入门准备] --> B[理念篇<br/>理解设计思想]
    B --> C[架构篇<br/>掌握整体结构]
    C --> D[实现篇<br/>深入源码细节]
    D --> E[React 19<br/>跟进最新特性]
```

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

[MIT License](LICENSE)

---

## 👋 关于作者

本项目由 [xuyuxiong](https://github.com/xuyuxiong) 创作并维护。

如果你从中受益，欢迎给项目一个 ⭐ Star！

---

<Badge type="info" text="Last Updated: 2024" />