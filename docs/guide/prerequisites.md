# 学习前提

在开始学习 React 源码之前，建议你具备以下知识：

## ✅ 必备知识

### 1. JavaScript 基础

- **作用域与闭包**：理解词法作用域、闭包原理
- **原型与继承**：prototype、__proto__、原型链
- **this 绑定**：call/apply/bind、箭头函数 this
- **Promise 与异步**：async/await、微任务/宏任务

### 2. 数据结构

- **链表**：单向链表、双向链表（Fiber 使用）
- **树**：树的遍历（递归、迭代）
- **栈与队列**：函数调用栈、任务队列

### 3. React 使用经验

- **至少 1 年 React 开发经验**
- 熟悉 JSX 语法
- 理解组件生命周期 / Hooks
- 写过 Class 组件和函数组件

## 📚 推荐前置学习

如果你对上述内容不够熟悉，建议先学习：

| 知识点 | 推荐资源 |
|--------|----------|
| JavaScript 进阶 | 《You Don't Know JS》、MDN |
| 数据结构 | 《图解数据结构》、LeetCode 简单题 |
| React 入门 | [React 官方文档](https://react.dev/learn) |

## 🛠️ 技术准备

### 浏览器要求

- Chrome / Edge（推荐，调试工具强大）
- Firefox（备选）

### Node.js 版本

- Node.js >= 18.x
- npm >= 9.x 或 yarn >= 1.22.x

### 代码编辑器

- VS Code（推荐）
  - 安装 ESLint、Prettier 插件
  - 安装 React 代码片段插件

## 🎯 学习目标

学习完本指南后，你将能够：

1. 理解 React 核心设计理念
2. 掌握 Fiber 架构工作原理
3. 独立调试 React 源码
4. 理解并发特性的实现机制
5. 有能力阅读 React RFC 和参与讨论

## 📖 下一步

- [React 18/19 新特性总览](./overview) - 了解新版本有哪些变化
- [如何调试 React 源码](./debugging) - 学习调试技巧

---

> 💡 **提示**：不需要完全掌握所有前置知识才开始，可以在学习过程中查漏补缺。