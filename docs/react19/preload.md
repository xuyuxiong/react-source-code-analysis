# 资源预加载 APIs

React 19 引入了资源预加载 APIs，允许在组件渲染时声明式地预加载资源，优化页面性能。

## 🎯 解决的问题

### React 18 的方式

```jsx
// React 18 - 需要手动管理
function Page() {
  useEffect(() => {
    // 预加载字体
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = '/font.woff2';
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
    
    // 预连接 CDN
    const preconnect = document.createElement('link');
    preconnect.rel = 'preconnect';
    preconnect.href = 'https://cdn.example.com';
    document.head.appendChild(preconnect);
    
    return () => {
      document.head.removeChild(link);
      document.head.removeChild(preconnect);
    };
  }, []);
  
  return <Content />;
}
```

### React 19 的方式

```jsx
// React 19 - 声明式 API
import { preload, preconnect } from 'react-dom';

function Page() {
  // 预加载字体
  preload('/font.woff2', {
    as: 'font',
    type: 'font/woff2',
    crossOrigin: 'anonymous'
  });
  
  // 预连接 CDN
  preconnect('https://cdn.example.com');
  
  return <Content />;
}
```

## 📦 API 总览

| API | 用途 | 优先级 |
|-----|------|--------|
| `preload()` | 预加载资源 | 高 |
| `preinit()` | 预初始化（下载 + 执行） | 最高 |
| `prefetchDNS()` | DNS 预取 | 中 |
| `preconnect()` | 预连接（握手） | 中 |

## 🔍 API 详解

### 1. preload()

预加载资源，但不执行：

```javascript
import { preload } from 'react-dom';

// 预加载字体
preload('https://fonts.example.com/font.woff2', {
  as: 'font',
  type: 'font/woff2',
  crossOrigin: 'anonymous'
});

// 预加载图片
preload('/hero-image.jpg', {
  as: 'image',
  imageSrcSet: '/hero-480w.jpg 480w, /hero-800w.jpg 800w',
  imageSizes: '(max-width: 600px) 480px, 800px'
});

// 预加载脚本
preload('/critical-script.js', {
  as: 'script'
});

// 预加载样式
preload('/styles.css', {
  as: 'style'
});
```

### 2. preinit()

预初始化资源（下载并准备执行）：

```javascript
import { preinit } from 'react-dom';

// 预初始化脚本
preinit('https://example.com/script.js', {
  as: 'script',
  precedence: 'high',  // 执行优先级
  crossOrigin: 'anonymous'
});

// 预初始化样式
preinit('/styles.css', {
  as: 'style',
  precedence: 'default'
});

// 优先级选项
// - "high": 高优先级，尽快执行
// - "default": 默认优先级
// - "low": 低优先级
```

### 3. prefetchDNS()

预取 DNS 解析：

```javascript
import { prefetchDNS } from 'react-dom';

// 预取 DNS
prefetchDNS('https://api.example.com');

// 对第三方资源很有用
prefetchDNS('https://analytics.google.com');
```

### 4. preconnect()

预建立连接（包含 DNS 预取 + TCP 握手）：

```javascript
import { preconnect } from 'react-dom';

// 预连接
preconnect('https://cdn.example.com');

// 可以配合 crossorigin
preconnect('https://fonts.googleapis.com', {
  crossOrigin: 'anonymous'
});
```

## 💡 完整示例

### 1. 图片懒加载优化

```jsx
import { preload, preinit } from 'react-dom';

function Gallery({ images }) {
  // 预加载首屏图片
  React.useEffect(() => {
    images.slice(0, 4).forEach(img => {
      preload(img.src, {
        as: 'image',
        imageSrcSet: img.srcSet,
        imageSizes: img.sizes
      });
    });
  }, [images]);
  
  return (
    <div className="gallery">
      {images.map((img, i) => (
        <LazyImage key={img.id} {...img} />
      ))}
    </div>
  );
}
```

### 2. 字体优化

```jsx
import { preload, preconnect } from 'react-dom';

function Page({ fontUrl }) {
  // 预连接字体服务器
  preconnect('https://fonts.googleapis.com');
  preconnect('https://fonts.gstatic.com', {
    crossOrigin: 'anonymous'
  });
  
  // 预加载字体
  preload(fontUrl, {
    as: 'font',
    type: 'font/woff2',
    crossOrigin: 'anonymous'
  });
  
  return (
    <div style={{ fontFamily: 'CustomFont' }}>
      内容
    </div>
  );
}
```

### 3. 路由预取

```jsx
import { preload, preinit } from 'react-dom';
import { Link } from 'react-router-dom';

function Nav() {
  const [hoveredLink, setHoveredLink] = useState(null);
  
  function handleMouseEnter(href) {
    setHoveredLink(href);
    
    // 预取路由资源
    const chunkUrl = getChunkUrl(href);
    preload(chunkUrl, { as: 'script' });
  }
  
  function handleMouseLeave() {
    setHoveredLink(null);
  }
  
  return (
    <nav>
      <Link 
        to="/about"
        onMouseEnter={() => handleMouseEnter('/about')}
        onMouseLeave={handleMouseLeave}
      >
        关于
      </Link>
      <Link 
        to="/contact"
        onMouseEnter={() => handleMouseEnter('/contact')}
        onMouseLeave={handleMouseLeave}
      >
        联系
      </Link>
    </nav>
  );
}
```

### 4. 第三方脚本

```jsx
import { preinit, preconnect } from 'react-dom';

function Analytics() {
  // 预连接分析服务
  preconnect('https://www.google-analytics.com');
  
  // 预初始化分析脚本
  preinit('https://www.googletagmanager.com/gtag/js', {
    as: 'script',
    precedence: 'low'  // 低优先级，不影响关键渲染
  });
  
  return null;  // 只负责加载，不渲染
}

function App() {
  return (
    <>
      <Analytics />
      <Main />
    </>
  );
}
```

### 5. CDN 优化

```jsx
import { preload, preconnect, prefetchDNS } from 'react-dom';

function CDNLoader() {
  const cdnUrl = 'https://cdn.example.com';
  
  // 完整的 CDN 优化流程
  prefetchDNS(cdnUrl);      // DNS 预取
  preconnect(cdnUrl);       // 预连接
  preload(`${cdnUrl}/vendor.js`, { as: 'script' });
  preload(`${cdnUrl}/vendor.css`, { as: 'style' });
  
  return null;
}
```

## 🎯 使用策略

### 1. 关键资源预加载

```jsx
function CriticalResources() {
  // 关键 CSS
  preinit('/critical.css', {
    as: 'style',
    precedence: 'high'
  });
  
  // 关键 JS
  preinit('/critical.js', {
    as: 'script',
    precedence: 'high'
  });
  
  // 品牌字体
  preload('/brand-font.woff2', {
    as: 'font',
    type: 'font/woff2'
  });
  
  return null;
}
```

### 2. 图片分优先级

```jsx
function Page() {
  // Hero 图片 - 立即加载
  preload('/hero.jpg', {
    as: 'image',
    fetchPriority: 'high'
  });
  
  // 内容图片 - 正常加载
  // 通过 loading="lazy" 延迟
  
  // 下方图片 - 预加载
  preload('/section2-image.jpg', {
    as: 'image',
    fetchPriority: 'low'
  });
  
  return (
    <>
      <img src="/hero.jpg" alt="Hero" />
      {/* 其他内容 */}
    </>
  );
}
```

### 3. 按需加载

```jsx
function Modal({ isOpen, onClose }) {
  // 模态框打开时预加载资源
  React.useEffect(() => {
    if (isOpen) {
      preload('/modal-styles.css', { as: 'style' });
      preinit('/modal-script.js', { as: 'script' });
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div className="modal">
      {/* 模态框内容 */}
    </div>
  );
}
```

## 📊 性能优化

### Resource Hints 优先级

```
1. preinit()     - 预初始化（下载 + 执行）⭐⭐⭐
2. preload()     - 预加载资源          ⭐⭐⭐
3. preconnect()  - 预连接（握手）      ⭐⭐
4. prefetchDNS() - DNS 预取           ⭐
```

### 避免过度预加载

```jsx
// ❌ 不好的做法 - 预加载太多
resources.forEach(r => preload(r));  // 浪费带宽

// ✅ 好的做法 - 只预加载关键资源
criticalResources.forEach(r => {
  preload(r, { as: getResourceType(r) });
});
```

### 动态路由预取

```jsx
// Next.js App Router 示例
import { useTransition } from 'react';
import { preload } from 'react-dom';

function Navigation({ routes }) {
  const [isPending, startTransition] = useTransition();
  
  function handleNavigate(href) {
    startTransition(() => {
      // 导航时使用
      router.push(href);
    });
  }
  
  function handleMouseEnter(href) {
    // 悬停时预取
    preload(getRouteChunk(href), { as: 'script' });
  }
  
  return (
    <nav>
      {routes.map(route => (
        <a
          key={route.href}
          href={route.href}
          onClick={e => {
            e.preventDefault();
            handleNavigate(route.href);
          }}
          onMouseEnter={() => handleMouseEnter(route.href)}
        >
          {route.title}
        </a>
      ))}
    </nav>
  );
}
```

## ⚠️ 注意事项

### 1. 资源去重

```jsx
// React 会自动去重，相同的 preload 只会触发一次
function Page() {
  preload('/style.css', { as: 'style' });
  
  return (
    <Child />  // Child 中也 preload 同一个文件，不会重复
  );
}
```

### 2. SSR 支持

```jsx
// React 19 SSR 会自动将预加载指令输出到 HTML
function Page() {
  preload('/font.woff2', { as: 'font' });
  return <div>内容</div>;
}

// 服务端渲染的 HTML 会包含
// <link rel="preload" href="/font.woff2" as="font" />
```

### 3. 浏览器兼容性

```jsx
// 检查浏览器支持
if (typeof preload === 'function') {
  preload('/resource.js', { as: 'script' });
} else {
  // 降级处理
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = '/resource.js';
  link.as = 'script';
  document.head.appendChild(link);
}
```

## 🔬 调试技巧

### 观察 Network 面板

```
Chrome DevTools → Network → 查看预加载资源

Type 列会显示:
- preload: 预加载的资源
- script: 预初始化的脚本
- stylesheet: 预初始化的样式
```

### Performance API

```javascript
// 观察资源加载时间
performance.getEntriesByType('resource').forEach(entry => {
  console.log({
    name: entry.name,
    initiatorType: entry.initiatorType,
    duration: entry.duration,
    transferSize: entry.transferSize
  });
});
```

---

## 📖 下一步

- [实现篇：createRoot 源码解析](../implementation/create-root)
- [开始深入实现细节](../implementation/)