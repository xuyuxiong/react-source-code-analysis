# Document Metadata

React 19 允许直接在组件中设置文档元信息（title、meta、link 等），无需使用第三方库或 useEffect。

## 🎯 解决的问题

### React 18 的方式

```jsx
// React 18 - 需要使用 useEffect
function Page() {
  useEffect(() => {
    document.title = '页面标题';
    
    const meta = document.createElement('meta');
    meta.name = 'description';
    meta.content = '页面描述';
    document.head.appendChild(meta);
    
    return () => {
      document.head.removeChild(meta);
    };
  }, []);
  
  return <div>内容</div>;
}

// 或使用第三方库
import { Helmet } from 'react-helmet';

function Page() {
  return (
    <>
      <Helmet>
        <title>页面标题</title>
        <meta name="description" content="页面描述" />
      </Helmet>
      <div>内容</div>
    </>
  );
}
```

### React 19 的方式

```jsx
// React 19 - 原生支持
function Page() {
  return (
    <>
      <title>页面标题</title>
      <meta name="description" content="页面描述" />
      <link rel="canonical" href="https://example.com/page" />
      <div>内容</div>
    </>
  );
}
```

## 📦 支持的元素

### 1. title

```jsx
function Article({ title }) {
  return (
    <>
      <title>{title} - 我的博客</title>
      <article>
        <h1>{title}</h1>
        {/* 内容 */}
      </article>
    </>
  );
}
```

### 2. meta

```jsx
function Article({ title, description, image }) {
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content="React, JavaScript, 前端" />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content="article" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      
      <article>{/* 内容 */}</article>
    </>
  );
}
```

### 3. link

```jsx
function Page() {
  return (
    <>
      <title>页面</title>
      
      {/*  canonical URL */}
      <link rel="canonical" href="https://example.com/page" />
      
      {/* alternate languages */}
      <link rel="alternate" hrefLang="en" href="https://example.com/en/page" />
      <link rel="alternate" hrefLang="zh" href="https://example.com/zh/page" />
      
      {/* RSS/Atom feed */}
      <link rel="alternate" type="application/rss+xml" href="/feed.xml" />
      
      {/* 图标 */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      
      <div>内容</div>
    </>
  );
}
```

### 4. base

```jsx
function App() {
  return (
    <>
      <base href="https://example.com/" target="_blank" />
      <Nav />
      <Main />
    </>
  );
}
```

## 🔍 工作原理

### 服务端渲染

```javascript
// React 19 SSR 会自动将 metadata 提升到 <head>
import { renderToPipeableStream } from 'react-dom/server';

function App() {
  return (
    <html>
      <head>
        {/* metadata 会被收集到这里 */}
      </head>
      <body>
        <Page />
      </body>
    </html>
  );
}

const { pipe } = renderToPipeableStream(<App />);
```

### 客户端渲染

```javascript
// 客户端 React 会管理 head 元素
// 添加/更新/删除 metadata

function Page1() {
  return (
    <>
      <title>页面 1</title>
      <div>内容 1</div>
    </>
  );
}

function Page2() {
  return (
    <>
      <title>页面 2</title>
      <div>内容 2</div>
    </>
  );
}

// 路由切换时，title 会自动更新
```

## 💡 完整示例

### 1. 博客文章

```jsx
// app/blog/[slug]/page.js
import { getPost } from '@/lib/posts';

export default async function BlogPost({ params }) {
  const post = await getPost(params.slug);
  
  return (
    <>
      <title>{post.title} | 我的博客</title>
      <meta name="description" content={post.excerpt} />
      <meta name="author" content={post.author.name} />
      <meta name="published" content={post.date} />
      
      {/* Open Graph */}
      <meta property="og:title" content={post.title} />
      <meta property="og:description" content={post.excerpt} />
      <meta property="og:image" content={post.coverImage} />
      <meta property="og:type" content="article" />
      <meta property="article:published_time" content={post.date} />
      <meta property="article:author" content={post.author.url} />
      
      {/* JSON-LD 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.excerpt,
            image: post.coverImage,
            datePublished: post.date,
            author: {
              '@type': 'Person',
              name: post.author.name,
            },
          }),
        }}
      />
      
      <article>
        <h1>{post.title}</h1>
        <p className="text-gray-600">{post.excerpt}</p>
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </article>
    </>
  );
}
```

### 2. 产品页面

```jsx
// app/products/[id]/page.js
export default function ProductPage({ product }) {
  return (
    <>
      <title>{product.name} - 购买 {product.category}</title>
      <meta name="description" content={product.description} />
      
      {/* Product Schema */}
      <meta property="og:title" content={product.name} />
      <meta property="og:description" content={product.description} />
      <meta property="og:image" content={product.image} />
      <meta property="og:type" content="product" />
      <meta property="product:price:amount" content={product.price} />
      <meta property="product:currency" content="CNY" />
      
      <ProductDetails product={product} />
    </>
  );
}
```

### 3. 用户资料

```jsx
// app/users/[username]/page.js
export default function UserProfile({ user }) {
  return (
    <>
      <title>{user.name} (@{user.username})</title>
      <meta name="description" content={user.bio} />
      
      {/* 社交链接 */}
      <link rel="me" href={`https://github.com/${user.github}`} />
      <link rel="me" href={`https://twitter.com/${user.twitter}`} />
      
      <Profile user={user} />
    </>
  );
}
```

### 4. 动态 SEO

```jsx
// app/search/page.js
export default function SearchPage({ searchParams }) {
  const query = searchParams.q || '';
  
  return (
    <>
      <title>搜索：{query || '全部商品'}</title>
      <meta name="robots" content={query ? 'noindex' : 'index'} />
      
      <SearchResults query={query} />
    </>
  );
}
```

## 🎯 SSR 优化

### Next.js App Router

```jsx
// app/page.js - 自动生成 metadata
export const metadata = {
  title: '首页',
  description: '欢迎来到我的网站',
  openGraph: {
    title: '首页',
    description: '欢迎来到我的网站',
    images: ['/og-image.png'],
  },
};

export default function Home() {
  return (
    <>
      {/* 额外的动态 metadata */}
      <meta name="generator" content="Next.js" />
      <main>内容</main>
    </>
  );
}
```

### 动态 metadata

```jsx
// app/blog/[slug]/page.js
export async function generateMetadata({ params }) {
  const post = await getPost(params.slug);
  
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  };
}

export default function Post({ params }) {
  const post = await getPost(params.slug);
  
  return (
    <>
      {/* 额外的 metadata */}
      <meta property="article:author" content={post.author.url} />
      <Article content={post.content} />
    </>
  );
}
```

## ⚠️ 注意事项

### 1. 不要重复设置

```jsx
// ❌ 不好的做法 - 重复 title
function Page() {
  return (
    <>
      <title>标题 1</title>
      <title>标题 2</title> {/* 会覆盖 */}
    </>
  );
}
```

### 2. 条件渲染

```jsx
// ✅ 条件 metadata
function Page({ isAdmin }) {
  return (
    <>
      <title>{isAdmin ? '管理后台' : '用户中心'}</title>
      {isAdmin && (
        <meta name="robots" content="noindex" />
      )}
      <Content />
    </>
  );
}
```

### 3. 布局中的 metadata

```jsx
// app/layout.js
export const metadata = {
  title: {
    default: '我的网站',
    template: '%s | 我的网站',
  },
  description: '网站描述',
};

// app/page.js - 会覆盖 default
export const metadata = {
  title: '首页',
};

// 最终标题："首页 | 我的网站"
```

## 🔬 调试技巧

### 检查渲染后的 head

```javascript
// 浏览器控制台
console.log(document.title);
console.log(document.querySelectorAll('meta'));
console.log(document.querySelector('link[rel="canonical"]'));
```

### Next.js 调试

```jsx
// 检查 metadata 是否正确生成
// 查看页面源码 (Ctrl+U)
// 检查 <head> 中的元素
```

## 📊 对比方案

| 方案 | 优点 | 缺点 |
|------|------|------|
| React 19 原生 | 内置、简洁、SSR 友好 | 需要 React 19 |
| react-helmet | 成熟、功能丰富 | 需要额外依赖、客户端重 hydrate |
| Next.js metadata | 类型安全、自动优化 | 仅限 Next.js |

---

## 📖 下一步

- [资源预加载 APIs](./preload)
- [ref 无需 forwardRef](./ref)