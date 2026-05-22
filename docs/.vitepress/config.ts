import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'React 源码深度解析',
  description: 'React 18/19 源码深度解析 - 从理念到架构到实现',
  base: '/react-source-code-analysis/',
  
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#087EA4' }],
  ],

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '首页', link: '/' },
      { text: '指南篇', link: '/guide/prerequisites' },
      { text: '理念篇', link: '/philosophy/why-concurrent' },
      { text: '架构篇', link: '/architecture/overview' },
      { text: '实现篇', link: '/implementation/create-root' },
      { text: 'React 19', link: '/react19/overview' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '指南篇',
          items: [
            { text: '学习前提', link: '/guide/prerequisites' },
            { text: 'React 18/19 新特性总览', link: '/guide/overview' },
            { text: '如何调试 React 源码', link: '/guide/debugging' },
            { text: '源码目录结构', link: '/guide/structure' },
            { text: '构建开发环境', link: '/guide/setup' },
          ],
        },
      ],
      '/philosophy/': [
        {
          text: '理念篇',
          items: [
            { text: '为什么需要 Concurrent React', link: '/philosophy/why-concurrent' },
            { text: 'Fiber 架构再探', link: '/philosophy/fiber' },
            { text: '可中断渲染与时间切片', link: '/philosophy/time-slicing' },
            { text: '优先级模型：Lane 深度解析', link: '/philosophy/lane' },
            { text: '并发特性的设计理念', link: '/philosophy/concurrent-design' },
          ],
        },
      ],
      '/architecture/': [
        {
          text: '架构篇',
          items: [
            { text: 'React 18 整体架构图解', link: '/architecture/overview' },
            { text: 'Scheduler - 调度器核心', link: '/architecture/scheduler' },
            { text: 'Reconciler - 协调器', link: '/architecture/reconciler' },
            { text: 'Renderer - 渲染器', link: '/architecture/renderer' },
            { text: '事件系统架构', link: '/architecture/events' },
            { text: 'Hook 系统架构', link: '/architecture/hooks' },
            { text: 'Suspense 架构', link: '/architecture/suspense' },
            { text: 'Concurrent Features 架构', link: '/architecture/concurrent' },
          ],
        },
      ],
      '/implementation/': [
        {
          text: '实现篇 - 渲染流程',
          items: [
            { text: 'createRoot 源码解析', link: '/implementation/create-root' },
            { text: 'beginWork 详解', link: '/implementation/begin-work' },
            { text: 'completeWork 详解', link: '/implementation/complete-work' },
            { text: 'commit: before mutation', link: '/implementation/commit-before-mutation' },
            { text: 'commit: mutation', link: '/implementation/commit-mutation' },
            { text: 'commit: layout', link: '/implementation/commit-layout' },
          ],
        },
        {
          text: '实现篇 - 核心算法',
          items: [
            { text: 'Diff 算法（单节点）', link: '/implementation/diff-single' },
            { text: 'Diff 算法（多节点）', link: '/implementation/diff-multiple' },
            { text: '优先级调度算法', link: '/implementation/priority' },
            { text: '任务调度与时间切片', link: '/implementation/scheduling' },
          ],
        },
        {
          text: '实现篇 - Hooks 实现',
          items: [
            { text: 'useState / useReducer', link: '/implementation/use-state' },
            { text: 'useEffect / useLayoutEffect', link: '/implementation/use-effect' },
            { text: 'useMemo / useCallback', link: '/implementation/use-memo' },
            { text: 'useRef', link: '/implementation/use-ref' },
            { text: 'useContext', link: '/implementation/use-context' },
            { text: 'useTransition', link: '/implementation/use-transition' },
            { text: 'useId', link: '/implementation/use-id' },
            { text: 'useSyncExternalStore', link: '/implementation/use-sync-external-store' },
            { text: 'useDeferredValue', link: '/implementation/deferred' },
          ],
        },
        {
          text: '实现篇 - Suspense 与并发',
          items: [
            { text: 'Suspense 工作原理', link: '/implementation/suspense' },
            { text: 'Lazy Loading', link: '/implementation/lazy' },
            { text: 'Error Boundaries', link: '/implementation/error-boundaries' },
            { text: 'Automatic Batching', link: '/implementation/batching' },
          ],
        },
      ],
      '/react19/': [
        {
          text: 'React 19 新特性',
          items: [
            { text: 'React 19 总览', link: '/react19/overview' },
            { text: 'React Compiler 原理', link: '/react19/compiler' },
            { text: 'Actions 服务器动作', link: '/react19/actions' },
            { text: 'useFormStatus / useFormState', link: '/react19/form-hooks' },
            { text: 'useOptimistic', link: '/react19/use-optimistic' },
            { text: 'Document Metadata', link: '/react19/metadata' },
            { text: '资源预加载 APIs', link: '/react19/preload' },
            { text: 'ref 无需 forwardRef', link: '/react19/ref' },
            { text: '<Context> 作为 Provider', link: '/react19/context' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/xuyuxiong/react-source-code-analysis' },
    ],

    search: {
      provider: 'local',
      options: {
        detailedView: true,
        hotKeys: [
          { key: 'k', meta: true },
          { key: 's', meta: true, ctrlKey: true },
        ],
        locales: {
          root: {
            translations: {
              button: {
                buttonText: '搜索文档',
                buttonAriaLabel: '搜索文档',
              },
              modal: {
                noResultsText: '无法找到相关结果',
                resetButtonTitle: '清除查询条件',
                footer: {
                  selectText: '进入',
                  selectKeyAriaLabel: '回车键',
                  navigateText: '切换',
                  navigateUpKeyAriaLabel: '上箭头',
                  navigateDownKeyAriaLabel: '下箭头',
                  closeText: '关闭',
                  closeKeyAriaLabel: 'ESC 键',
                },
              },
            },
          },
        },
      },
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present',
    },
  },
  
  markdown: {
    theme: {
      light: 'vitesse-light',
      dark: 'vitesse-dark',
    },
  },
})