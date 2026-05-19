---
layout: home

hero:
  name: React 源码深度解析
  text: React 18/19 完整源码学习指南
  tagline: 从理念到架构到实现，全面掌握 React 核心原理
  image:
    src: /react-logo.svg
    alt: React Logo
  actions:
    - theme: brand
      text: 开始学习
      link: /guide/prerequisites
    - theme: alt
      text: GitHub
      link: https://github.com/xuyuxiong/react-source-code-analysis

features:
  - icon: 🚀
    title: 最新版本
    details: 全面覆盖 React 18 稳定特性与 React 19 最新功能，包括 Concurrent Features、React Compiler 等
  - icon: 📚
    title: 渐进式学习
    details: 从理念篇 → 架构篇 → 实现篇，自顶向下，符合认知规律
  - icon: 🔍
    title: 源码调试
    details: 手把手教你搭建调试环境，深入理解每一行代码
  - icon: 🎯
    title: 图解丰富
    details: 大量架构图、流程图、时序图，让抽象概念可视化
  - icon: 💻
    title: 在线 Demo
    details: 关键概念配有 CodeSandbox 可交互示例，边学边练
  - icon: 🌙
    title: 暗色模式
    details: 支持亮色/暗色主题切换，舒适阅读体验
---

## 📖 为什么学习 React 源码？

<div class="why-learn">

**很多同学有这样的困惑：**

- React 代码能写，但不知道原理
- 遇到性能问题不知道怎么优化
- 新功能（Suspense、Concurrent）不敢用
- 想贡献 React 源码但无从下手

**学习源码能帮你：**

1. ✅ 理解 React 的设计理念，写出更优雅的代码
2. ✅ 掌握性能优化的本质，不再盲目优化
3. ✅ 信心满满地使用新特性
4. ✅ 甚至成为 React 贡献者

</div>

## 🗺️ 学习路线

```mermaid
graph LR
    A["指南篇
    入门准备"] --> B["理念篇
    理解设计思想"]
    B --> C["架构篇
    掌握整体结构"]
    C --> D["实现篇
    深入源码细节"]
    D --> E["React 19
    跟进最新特性"]
```

## 📋 内容概览

### 指南篇
学习前的准备工作，包括环境搭建、调试方法等

### 理念篇
理解 React 为什么这样设计，Fiber 架构、并发模型等

### 架构篇
从宏观角度理解 React 的整体架构和各模块职责

### 实现篇
深入源码，逐行分析核心功能的实现

### React 19
React 19 新特性详解，包括 Compiler、Actions 等

## 👥 谁适合学习？

- ✅ 有 1-2 年 React 使用经验
- ✅ 熟悉 JavaScript/TypeScript
- ✅ 对原理有好奇心
- ✅ 愿意投入时间深入学习

## 📝 关于本项目

本项目参考「React 技术揭秘」的实现方式，全面更新 React 18/19 新特性与源码架构。

相比原版，本项目的特点：
- 🆕 **内容更新**：覆盖 React 18/19，而非 v17
- 📊 **图解更多**：大量可视化架构图
- 🎮 **可交互 Demo**：边学边练
- 📱 **现代化体验**：响应式设计、暗色模式

<div class="action-buttons">
  <a href="/guide/prerequisites" class="btn-get-started">→ 开始学习</a>
</div>

<style>
.why-learn {
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  padding: 24px;
  margin: 24px 0;
}

.action-buttons {
  margin-top: 32px;
  padding-top: 32px;
  border-top: 1px solid var(--vp-c-divider);
}

.btn-get-started {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  color: var(--vp-c-brand);
  font-size: 16px;
  font-weight: 500;
  text-decoration: none;
  padding: 10px 16px;
  border: 2px solid var(--vp-c-brand);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.btn-get-started:hover {
  background: var(--vp-c-brand);
  color: #fff;
  transform: translateX(4px);
}
</style>