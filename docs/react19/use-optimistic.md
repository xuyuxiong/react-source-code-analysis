# useOptimistic - 乐观更新

React 19 新增的 Hook，用于实现乐观 UI 更新，在服务器确认前立即显示变化。

## 🎯 使用场景

### 传统方式的问题

```jsx
// React 18 - 等待服务器响应
async function sendMessage(message) {
  setIsSending(true);
  await api.sendMessage(message);  // ⏳ 等待
  setMessages(m => [...m, message]);  // 更新 UI
  setIsSending(false);
}

// 用户看到：输入 → 点击发送 → 等待 → 消息出现
```

### useOptimistic 改进

```jsx
// React 19 - 立即显示
import { useOptimistic } from 'react';

function Chat({ messages, sendMessage }) {
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage) => [...state, newMessage]
  );
  
  async function handleSubmit(message) {
    // 立即更新 UI
    addOptimisticMessage(message);
    
    // 后台发送到服务器
    await sendMessage(message);
  }
  
  return (
    <>
      {optimisticMessages.map(msg => (
        <Message key={msg.id} {...msg} />
      ))}
      <form onSubmit={handleSubmit}>
        <input name="message" />
      </form>
    </>
  );
}
```

## 📦 API

```typescript
function useOptimistic<S, A>(
  passthrough: S,
  reducer: (state: S, action: A) => S
): [S, (action: A) => void];
```

### 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `passthrough` | `S` | 原始数据（来自服务器） |
| `reducer` | `(S, A) => S` | 状态更新函数 |

### 返回值

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `optimisticState` | `S` | 当前状态（含乐观更新） |
| `setOptimisticState` | `(A) => void` | 触发乐观更新 |

## 💡 完整示例

### 1. 评论区

```jsx
'use client';

import { useOptimistic } from 'react';
import { addComment } from './actions';

function CommentSection({ initialComments }) {
  const [optimisticComments, addOptimisticComment] = useOptimistic(
    initialComments,
    (state, newComment) => [...state, { ...newComment, id: Date.now(), pending: true }]
  );
  
  async function handleSubmit(formData) {
    const comment = {
      text: formData.get('text'),
      author: 'You',
      createdAt: new Date(),
    };
    
    // 乐观更新
    addOptimisticComment(comment);
    
    // 发送到服务器
    try {
      await addComment(formData);
    } catch {
      // 处理失败（回滚或显示错误）
    }
  }
  
  return (
    <div>
      {optimisticComments.map(comment => (
        <Comment 
          key={comment.id} 
          {...comment}
          isPending={comment.pending}
        />
      ))}
      
      <form action={handleSubmit}>
        <textarea name="text" />
        <button type="submit">评论</button>
      </form>
    </div>
  );
}
```

### 2. 点赞功能

```jsx
'use client';

import { useOptimistic } from 'react';
import { likePost, unlikePost } from './actions';

function LikeButton({ postId, initialLikes, isLiked }) {
  const [optimisticState, like] = useOptimistic(
    { likes: initialLikes, isLiked },
    (state) => ({
      likes: state.isLiked ? state.likes - 1 : state.likes + 1,
      isLiked: !state.isLiked,
    })
  );
  
  async function handleClick() {
    // 乐观更新
    like();
    
    // 服务器同步
    try {
      if (optimisticState.isLiked) {
        await unlikePost(postId);
      } else {
        await likePost(postId);
      }
    } catch {
      // 失败回滚（可能需要额外逻辑）
    }
  }
  
  return (
    <button onClick={handleClick}>
      {optimisticState.isLiked ? '❤️' : '🤍'} {optimisticState.likes}
    </button>
  );
}
```

### 3. 购物车

```jsx
'use client';

import { useOptimistic } from 'react';
import { addToCart, removeFromCart } from './actions';

function Cart({ initialItems }) {
  const [optimisticCart, updateCart] = useOptimistic(
    initialItems,
    (state, action) => {
      switch (action.type) {
        case 'ADD':
          return [...state, { ...action.item, pending: true }];
        case 'REMOVE':
          return state.filter(item => item.id !== action.id);
        case 'CONFIRM':
          return state.map(item => ({ ...item, pending: false }));
        default:
          return state;
      }
    }
  );
  
  async function handleAdd(item) {
    // 乐观添加
    updateCart({ type: 'ADD', item });
    
    try {
      await addToCart(item);
      // 确认
      updateCart({ type: 'CONFIRM', item });
    } catch {
      // 失败处理
    }
  }
  
  async function handleRemove(id) {
    // 乐观删除
    updateCart({ type: 'REMOVE', id });
    
    try {
      await removeFromCart(id);
    } catch {
      // 失败处理
    }
  }
  
  return (
    <div>
      {optimisticCart.map(item => (
        <CartItem 
          key={item.id} 
          item={item}
          isPending={item.pending}
          onRemove={() => handleRemove(item.id)}
        />
      ))}
    </div>
  );
}
```

### 4. 关注/取消关注

```jsx
'use client';

import { useOptimistic } from 'react';
import { followUser, unfollowUser } from './actions';

function FollowButton({ userId, initialIsFollowing }) {
  const [isFollowing, setIsFollowing] = useOptimistic(
    initialIsFollowing,
    (state) => !state  // 切换状态
  );
  
  async function handleClick() {
    // 乐观更新
    setIsFollowing();
    
    // 服务器同步
    try {
      if (isFollowing) {
        await unfollowUser(userId);
      } else {
        await followUser(userId);
      }
    } catch {
      // 失败回滚
      setIsFollowing();  // 切换回原状态
    }
  }
  
  return (
    <button 
      onClick={handleClick}
      className={isFollowing ? 'following' : 'follow'}
    >
      {isFollowing ? '已关注' : '+ 关注'}
    </button>
  );
}
```

## 🔍 工作原理

### 内部实现

```javascript
// packages/react-reconciler/src/ReactFiberHooks.js
function mountOptimistic(passthrough, reducer) {
  // 1. 创建内部状态
  const [state, setState] = mountState(passthrough);
  
  // 2. 创建 optimistic Hook
  const optimisticHook = mountWorkInProgressHook();
  
  // 3. 创建更新函数
  const setOptimisticState = (action) => {
    const newState = reducer(state, action);
    setState(newState);
  };
  
  return [state, setOptimisticState];
}

function updateOptimistic(passthrough, reducer) {
  // 类似 mount，但从 current Hook 更新
  return updateState(passthrough, reducer);
}
```

### 与 useFormState 配合

```jsx
'use client';

import { useFormState } from 'react-dom';
import { useOptimistic } from 'react';

function TodoForm() {
  // 表单状态
  const [todos, addTodo] = useFormState(todosReducer, []);
  
  // 乐观更新
  const [optimisticTodos, setOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo) => [...state, { ...newTodo, pending: true }]
  );
  
  async function handleSubmit(formData) {
    const todo = {
      text: formData.get('text'),
      completed: false,
    };
    
    // 乐观显示
    setOptimisticTodo(todo);
    
    // 表单 action 会调用
    return addTodo(todo);
  }
  
  return (
    <form action={handleSubmit}>
      {optimisticTodos.map(todo => (
        <Todo key={todo.id} {...todo} pending={todo.pending} />
      ))}
      <input name="text" />
      <button type="submit">添加</button>
    </form>
  );
}
```

## ⚠️ 注意事项

### 1. 错误处理

```jsx
async function handleSubmit(formData) {
  const message = formData.get('message');
  
  // 乐观更新
  addOptimisticMessage(message);
  
  try {
    await sendMessage(message);
  } catch (error) {
    // 失败回滚
    removeOptimisticMessage(message);
    
    // 显示错误提示
    setError('发送失败，请重试');
  }
}
```

### 2. 状态同步

```jsx
// 服务器数据更新后，同步乐观状态
function Component({ serverData }) {
  const [optimisticData, setOptimistic] = useOptimistic(
    serverData,
    reducer
  );
  
  // serverData 变化时，optimisticData 不会被覆盖
  // 除非显式调用 setOptimistic
  
  return <div>{optimisticData}</div>;
}
```

### 3. 配合 useTransition

```jsx
import { useOptimistic, useTransition } from 'react';

function Feed() {
  const [posts, addPost] = useOptimistic(...);
  const [isPending, startTransition] = useTransition();
  
  async function handleSubmit(formData) {
    // 乐观更新
    addPost(formData);
    
    // 过渡更新其他状态
    startTransition(async () => {
      await submitToServer(formData);
    });
  }
  
  return (
    <>
      {isPending && <Spinner />}
      {/* posts */}
    </>
  );
}
```

## 📊 对比其他方案

| 方案 | 优点 | 缺点 |
|------|------|------|
| `useOptimistic` | React 内置、简洁 | 需要 React 19 |
| 手动状态管理 | 灵活、可控 | 代码复杂 |
| SWR/RQuery | 功能丰富、自动缓存 | 需要额外依赖 |

## 🐛 常见问题

### Q: 如何处理依赖更新？

```jsx
// 子组件依赖父组件的乐观状态
function Parent() {
  const [items, addItem] = useOptimistic(...);
  
  return (
    <>
      <ItemList items={items} />
      <AddButton onAdd={addItem} />
    </>
  );
}
```

### Q: 可以撤销吗？

```jsx
async function handleUnfollow(userId) {
  // 乐观更新
  setUnfollowing(userId);
  
  try {
    await unfollowUser(userId);
  } catch {
    // 失败回滚
    setFollowing(userId);
  }
  
  // 或自动回滚
  setTimeout(() => {
    // 取消未确认的操作
    rollbackIfNotConfirmed(userId);
  }, 5000);
}
```

---

## 📖 下一步

- [Document Metadata](./metadata)
- [资源预加载 APIs](./preload)