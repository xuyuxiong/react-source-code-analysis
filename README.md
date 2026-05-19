# React 源码深度解析 - React 18/19 完整版

> 参考「React 技术揭秘」的实现方式，全面更新 React 18/19 新特性与源码架构

---

## 📋 实现清单

### 一、项目基础架构

```
react-source-code-analysis/
├── docs/                    # 文档目录
│   ├── .vuepress/          # VuePress 配置
│   │   ├── config.js       # 站点配置
│   │   ├── theme/          # 主题配置
│   │   └── public/         # 静态资源
│   ├── guide/              # 指南篇
│   ├── architecture/       # 架构篇
│   ├── implementation/     # 实现篇
│   └── react19/            # React 19 新特性
├── demos/                   # 可运行的 Demo
│   ├── concurrent/         # Concurrent Features 演示
│   ├── transitions/        # Transitions 演示
│   └── suspense/           # Suspense 演示
├── scripts/                 # 构建脚本
├── package.json
└── README.md
```

### 二、内容规划

#### 📘 第一部分：指南篇 (Guide)

| 章节 | 内容 | 状态 |
|------|------|------|
| 1.1 | 学习本指南的前提知识 | 待实现 |
| 1.2 | React 18/19 新特性总览 | 待实现 |
| 1.3 | 如何调试 React 源码 | 待实现 |
| 1.4 | 源码目录结构详解 | 待实现 |
| 1.5 | 构建 React 开发环境 | 待实现 |

#### 📗 第二部分：理念篇 (Philosophy)

| 章节 | 内容 | 状态 |
|------|------|------|
| 2.1 | 为什么需要 Concurrent React | 待实现 |
| 2.2 | Fiber 架构再探 (React 18 视角) | 待实现 |
| 2.3 | 可中断渲染与时间切片 | 待实现 |
| 2.4 | 优先级模型：Lane 深度解析 | 待实现 |
| 2.5 | 并发特性的设计理念 | 待实现 |

#### 📙 第三部分：架构篇 (Architecture)

| 章节 | 内容 | 状态 |
|------|------|------|
| 3.1 | React 18 整体架构图解 | 待实现 |
| 3.2 | Scheduler - 调度器核心 | 待实现 |
| 3.3 | Reconciler - 协调器工作流程 | 待实现 |
| 3.4 | Renderer - 渲染器对接 | 待实现 |
| 3.5 | 事件系统架构 (Discrete/Continuous/Default) | 待实现 |
| 3.6 | Hook 系统架构 | 待实现 |
| 3.7 | Suspense 架构 | 待实现 |
| 3.8 | Concurrent Features 架构 | 待实现 |

#### 📕 第四部分：实现篇 (Implementation)

**渲染流程**

| 章节 | 内容 | 状态 |
|------|------|------|
| 4.1 | 创建根节点：createRoot 源码解析 | 待实现 |
| 4.2 | render 阶段：beginWork 详解 | 待实现 |
| 4.3 | render 阶段：completeWork 详解 | 待实现 |
| 4.4 | commit 阶段：before mutation | 待实现 |
| 4.5 | commit 阶段：mutation | 待实现 |
| 4.6 | commit 阶段：layout | 待实现 |

**核心算法**

| 章节 | 内容 | 内容 |
|------|------|------|
| 5.1 | Diff 算法（单节点） | 待实现 |
| 5.2 | Diff 算法（多节点） | 待实现 |
| 5.3 | 优先级调度算法 | 待实现 |
| 5.4 | 任务调度与时间切片 | 待实现 |

**Hooks 实现**

| 章节 | 内容 | 状态 |
|------|------|------|
| 6.1 | Hooks 数据结构与链表 | 待实现 |
| 6.2 | useState / useReducer | 待实现 |
| 6.3 | useEffect / useLayoutEffect | 待实现 |
| 6.4 | useMemo / useCallback | 待实现 |
| 6.5 | useRef / useImperativeHandle | 待实现 |
| 6.6 | useContext | 待实现 |
| 6.7 | useTransition / useDeferredValue | 待实现 |
| 6.8 | useId | 待实现 |
| 6.9 | useSyncExternalStore | 待实现 |
| 6.10 | useInsertionEffect | 待实现 |

**Suspense 与并发**

| 章节 | 内容 | 状态 |
|------|------|------|
| 7.1 | Suspense 工作原理 | 待实现 |
| 7.2 | Lazy loading 实现 | 待实现 |
| 7.3 | Error Boundaries | 待实现 |
| 7.4 | useTransition 实现 | 待实现 |
| 7.5 | useDeferredValue 实现 | 待实现 |
| 7.6 | Automatic Batching | 待实现 |

#### 📔 第五部分：React 19 新特性

| 章节 | 内容 | 状态 |
|------|------|------|
| 8.1 | React 19 总览与迁移指南 | 待实现 |
| 8.2 | React Compiler 原理 | 待实现 |
| 8.3 | Actions (服务器动作) | 待实现 |
| 8.4 | useFormStatus / useFormState | 待实现 |
| 8.5 | useOptimistic | 待实现 |
| 8.6 | Document Metadata | 待实现 |
| 8.7 | 资源预加载 APIs (preinit, preload, prefetchDNS, preconnect) | 待实现 |
| 8.8 | ref 无需 forwardRef | 待实现 |
| 8.9 | <Context> 作为 Provider | 待实现 |
| 8.10 | 清理 useEffect 中的事件监听器 | 待实现 |

### 三、技术栈选型

| 项目 | 选型 | 说明 |
|------|------|------|
| 文档框架 | VuePress 2 / VitePress | 现代化文档工具，GitHub Pages 友好 |
| 主题 | 自定义主题 / HopeTheme | 参考原站风格，现代化改造 |
| 代码高亮 | Prism.js | 支持 JSX 语法高亮 |
| 图表 | Mermaid / Excalidraw | 架构图、流程图 |
| Demo 框架 | CodeSandbox 嵌入 | 可交互示例 |
| 构建工具 | Vite | 快速开发体验 |
| 部署 | GitHub Actions | 自动部署到 GitHub Pages |

### 四、视觉设计

- **配色方案**：参考 React 官方蓝色系 (#087EA4)
- **Logo**：设计专属 Logo（原子 + React 图标结合）
- **插图**：使用 Excalidraw 绘制架构插图
- **动画**：关键流程添加 CSS 动画演示

### 五、交互功能

- [ ] 代码在线运行（CodeSandbox 嵌入）
- [ ] 章节进度追踪
- [ ] 搜索功能（Algolia DocSearch）
- [ ] 暗色模式支持
- [ ] 移动端适配
- [ ] 评论系统（可选：Giscus）

### 六、部署配置

- [ ] GitHub Repository 创建
- [ ] GitHub Actions 构建配置
- [ ] GitHub Pages 域名配置
- [ ] SEO 优化（meta 标签、sitemap）
- [ ] 分析工具接入（可选：Umami / Plausible）

---

## 🚀 下一步

请审阅以上实现清单，确认以下事项：

1. **内容覆盖**：是否有需要增加/删减的章节？
2. **技术选型**：VuePress 2 还是 VitePress？（建议 VitePress - 更现代）
3. **优先级**：希望优先实现哪些部分？
4. **视觉风格**：有无特定设计偏好？

确认后我将开始分步实现！