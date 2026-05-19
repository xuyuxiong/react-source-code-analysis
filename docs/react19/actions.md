# Actions - 服务器动作

Actions 是 React 19 引入的新范式，允许直接在客户端组件中调用服务器函数，简化表单处理和数据提交。

## 🎯 解决的问题

### React 18 的模式

```jsx
// React 18 - 需要手动处理
function Form() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  
  async function handleSubmit(e) {
    e.preventDefault();
    setPending(true);
    setError(null);
    
    try {
      const formData = new FormData(e.target);
      const response = await fetch('/api/submit', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('提交失败');
      }
      
      // 处理成功
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="email" />
      <button type="submit" disabled={pending}>
        {pending ? '提交中...' : '提交'}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
```

**问题**：
- 大量样板代码
- 状态管理复杂
- 错误处理繁琐

### React 19 的 Actions

```jsx
// React 19 - 简化模式
'use client';

import { submitForm } from './actions';

function Form() {
  return (
    <form action={submitForm}>
      <input name="email" />
      <button type="submit">提交</button>
    </form>
  );
}
```

```jsx
// app/actions.js
'use server';

export async function submitForm(formData) {
  const email = formData.get('email');
  await saveToDatabase(email);
  revalidatePath('/');
}
```

## 📦 核心概念

### 1. Server Actions

使用 `'use server'` 标记的异步函数：

```javascript
// actions.js
'use server';

export async function createTodo(formData) {
  const title = formData.get('title');
  await db.todo.create({ data: { title } });
  revalidatePath('/todos');
}
```

### 2. 表单集成

```jsx
// 方式 1：直接作为 form action
<form action={createTodo}>
  <input name="title" />
  <button type="submit">添加</button>
</form>

// 方式 2：按钮 action
<button form="todo-form" action={createTodo}>
  添加
</button>
```

### 3. 客户端调用

```jsx
'use client';

import { createTodo } from './actions';

function AddTodo() {
  async function handleSubmit() {
    // 直接在客户端调用服务器函数
    await createTodo(new FormData());
  }
  
  return <button onClick={handleSubmit}>添加</button>;
}
```

## 🔧 完整示例

### 基础表单

```jsx
// app/actions.js
'use server';

export async function signup(formData) {
  const email = formData.get('email');
  const password = formData.get('password');
  
  // 验证
  if (!email || !password) {
    return { error: '请填写完整信息' };
  }
  
  // 创建用户
  await createUser({ email, password });
  
  // 重新验证
  revalidatePath('/dashboard');
  
  return { success: true };
}
```

```jsx
// app/signup/page.js
import { signup } from './actions';

export default function SignupPage() {
  return (
    <form action={signup}>
      <h1>注册</h1>
      <input name="email" type="email" placeholder="邮箱" />
      <input name="password" type="password" placeholder="密码" />
      <button type="submit">注册</button>
    </form>
  );
}
```

### 带状态反馈

```jsx
// app/actions.js
'use server';

export async function likePost(postId) {
  await db.post.update({
    where: { id: postId },
    data: { likes: { increment: 1 } },
  });
  
  revalidatePath(`/post/${postId}`);
}
```

```jsx
// app/post/[id]/page.js
import { likePost } from '../actions';
import { getPost } from '@/lib/db';

export default async function PostPage({ params }) {
  const post = await getPost(params.id);
  
  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
      
      <form action={likePost}>
        <input type="hidden" name="postId" value={post.id} />
        <button type="submit">
          👍 {post.likes}
        </button>
      </form>
    </article>
  );
}
```

### 渐进增强

```jsx
// 支持无 JavaScript 环境
<form action="/api/submit" method="POST">
  <input name="email" />
  <button type="submit">提交</button>
</form>

// React 19 自动拦截并增强
```

## 🎯 使用场景

### 1. 数据提交

```javascript
'use server';

export async function updateProfile(formData) {
  const name = formData.get('name');
  const bio = formData.get('bio');
  
  await db.user.update({
    where: { id: currentUserId },
    data: { name, bio },
  });
  
  revalidatePath('/profile');
}
```

### 2. 删除操作

```javascript
'use server';

export async function deleteTodo(id) {
  await db.todo.delete({ where: { id } });
  revalidatePath('/todos');
}
```

```jsx
<form action={deleteTodo}>
  <input type="hidden" name="id" value={todo.id} />
  <button type="submit">删除</button>
</form>
```

### 3. 批量操作

```javascript
'use server';

export async function toggleTodos(todoIds) {
  for (const id of todoIds) {
    await db.todo.toggle(id);
  }
  revalidatePath('/todos');
}
```

### 4. 搜索过滤

```javascript
'use server';

export async function searchProducts(formData) {
  const query = formData.get('q');
  const results = await db.product.search(query);
  return results;
}
```

## 🔒 安全性

### 1. 输入验证

```javascript
'use server';

export async function createUser(formData) {
  const email = formData.get('email');
  const password = formData.get('password');
  
  // 服务端验证
  if (!isValidEmail(email)) {
    throw new Error('无效的邮箱');
  }
  
  if (password.length < 8) {
    throw new Error('密码太短');
  }
  
  // ...
}
```

### 2. 权限检查

```javascript
'use server';

export async function deletePost(id) {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('未登录');
  }
  
  const post = await getPost(id);
  if (post.authorId !== user.id) {
    throw new Error('无权删除');
  }
  
  await db.post.delete(id);
}
```

### 3. CSRF 保护

```javascript
// Next.js 自动提供 CSRF 保护
// 无需手动处理
```

## 🧪 错误处理

### 方式 1：try-catch

```jsx
'use client';

import { useState } from 'react';
import { submitForm } from './actions';

function Form() {
  const [error, setError] = useState(null);
  
  async function handleSubmit(formData) {
    try {
      await submitForm(formData);
    } catch (err) {
      setError(err.message);
    }
  }
  
  return (
    <form action={handleSubmit}>
      {error && <p className="error">{error}</p>}
      {/* ... */}
    </form>
  );
}
```

### 方式 2：useFormState

```jsx
import { useFormState } from 'react-dom';
import { submitForm } from './actions';

function Form() {
  const [state, formAction] = useFormState(submitForm, null);
  
  return (
    <form action={formAction}>
      {state?.error && <p className="error">{state.error}</p>}
      {state?.success && <p className="success">提交成功!</p>}
      {/* ... */}
    </form>
  );
}
```

## 📊 性能优化

### 1. 乐观更新

```jsx
'use client';

import { useOptimistic } from 'react';
import { likePost } from './actions';

function LikeButton({ postId, initialLikes }) {
  const [likes, addLike] = useOptimistic(
    initialLikes,
    (count) => count + 1
  );
  
  async function handleClick() {
    addLike();
    await likePost(postId);
  }
  
  return (
    <button onClick={handleClick}>
      👍 {likes}
    </button>
  );
}
```

### 2. 批处理

```javascript
'use server';

export async function bulkUpdate(updates) {
  // 批处理数据库操作
  await db.$transaction(
    updates.map(update =>
      db.item.update(update)
    )
  );
  
  revalidatePath('/items');
}
```

## 🐛 常见问题

### Q: Actions 和普通 API 有什么区别？

**A**: 
- Actions 直接作为函数调用，无需 fetch
- 自动序列化/反序列化
- 内置 CSRF 保护
- 更好的类型推断

### Q: 如何测试 Actions?

```javascript
// __tests__/actions.test.js
import { createTodo } from '../actions';

test('creates a todo', async () => {
  const formData = new FormData();
  formData.append('title', 'Test');
  
  const result = await createTodo(formData);
  expect(result).toBeDefined();
});
```

### Q: 可以在客户端组件中使用吗？

**A**: 可以，但需要 `'use client'` 标记。

---

## 📖 下一步

- [useFormStatus / useFormState](./form-hooks)
- [useOptimistic](./use-optimistic)