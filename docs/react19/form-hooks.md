# useFormStatus / useFormState

React 19 新增的两个 Form Hooks，让表单状态管理更简单。

## useFormStatus

获取表单提交状态。

### API

```jsx
import { useFormStatus } from 'react-dom';

function FormStatus() {
  const { pending, data, method, action } = useFormStatus();
  
  return (
    <div>
      {pending ? '提交中...' : '就绪'}
    </div>
  );
}
```

### 返回值

```typescript
interface FormStatus {
  pending: boolean;    // 是否正在提交
  data: FormData;      // 表单数据
  method: string;      // 表单方法 (GET/POST)
  action: string | ((formData: FormData) => void); // 提交动作
}
```

### 使用场景

#### 1. 提交按钮状态

```jsx
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button type="submit" disabled={pending}>
      {pending ? '提交中...' : '提交'}
    </button>
  );
}

function Form() {
  return (
    <form action={submitAction}>
      <input name="email" />
      <SubmitButton />
    </form>
  );
}
```

**注意**：`useFormStatus` 必须在 `<form>` 的子组件中使用。

#### 2. 多字段表单

```jsx
function LoginForm() {
  return (
    <form action={login}>
      <div>
        <label>邮箱</label>
        <input name="email" type="email" />
      </div>
      <div>
        <label>密码</label>
        <input name="password" type="password" />
      </div>
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Spinner /> 登录中...
        </>
      ) : (
        '登录'
      )}
    </button>
  );
}
```

#### 3. 防止重复提交

```jsx
function CheckoutForm() {
  return (
    <form action={checkout}>
      <input name="address" />
      <input name="card" />
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending, data, method } = useFormStatus();
  
  // 显示提交的数据
  if (pending) {
    console.log('正在提交:', {
      method,
      data: Object.fromEntries(data),
    });
  }
  
  return (
    <button type="submit" disabled={pending}>
      {pending ? '处理中...' : '支付'}
    </button>
  );
}
```

---

## useFormState

管理表单状态，支持服务端返回状态。

### API

```jsx
import { useFormState } from 'react-dom';

function Form() {
  const [state, formAction] = useFormState(action, initialState);
  
  return (
    <form action={formAction}>
      {/* state 包含服务端返回的状态 */}
      {state?.error && <p className="error">{state.error}</p>}
      {state?.success && <p className="success">成功!</p>}
      {/* 表单字段 */}
    </form>
  );
}
```

### 参数

```typescript
function useFormState<A, S>(
  action: (state: S, formData: FormData) => S | Promise<S>,
  initialState: S,
  permalink?: string
): [S, (formData: FormData) => void];
```

### 使用场景

#### 1. 基础表单状态

```jsx
// app/actions.js
'use server';

export async function signup(state, formData) {
  const email = formData.get('email');
  const password = formData.get('password');
  
  try {
    await createUser({ email, password });
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
```

```jsx
// app/page.js
import { useFormState } from 'react-dom';
import { signup } from './actions';

export default function SignupForm() {
  const [state, formAction] = useFormState(signup, {
    success: false,
    error: null,
  });
  
  return (
    <form action={formAction}>
      <input name="email" type="email" placeholder="邮箱" />
      <input name="password" type="password" placeholder="密码" />
      
      {state?.error && (
        <p className="error">{state.error}</p>
      )}
      {state?.success && (
        <p className="success">注册成功!</p>
      )}
      
      <button type="submit">注册</button>
    </form>
  );
}
```

#### 2. 表单验证

```jsx
// app/actions.js
'use server';

export async function validateAndSubmit(state, formData) {
  const errors = {};
  
  const email = formData.get('email');
  if (!email || !email.includes('@')) {
    errors.email = '请输入有效的邮箱';
  }
  
  const password = formData.get('password');
  if (!password || password.length < 8) {
    errors.password = '密码至少 8 位';
  }
  
  if (Object.keys(errors).length > 0) {
    return { errors, submitted: false };
  }
  
  // 提交到数据库
  await createUser({ email, password });
  
  return { success: true, submitted: true };
}
```

```jsx
function Form() {
  const [state, formAction] = useFormState(validateAndSubmit, {
    errors: {},
    submitted: false,
  });
  
  return (
    <form action={formAction}>
      <input name="email" defaultValue={state?.email} />
      {state?.errors?.email && (
        <span className="error">{state.errors.email}</span>
      )}
      
      <input name="password" type="password" />
      {state?.errors?.password && (
        <span className="error">{state.errors.password}</span>
      )}
      
      <button type="submit">提交</button>
    </form>
  );
}
```

#### 3. 计数器

```jsx
// app/actions.js
'use server';

export async function increment(previousState) {
  return previousState + 1;
}
```

```jsx
function Counter() {
  const [count, incrementAction] = useFormState(increment, 0);
  
  return (
    <form action={incrementAction}>
      <p>计数：{count}</p>
      <button type="submit">+1</button>
    </form>
  );
}
```

#### 4. 多选表单

```jsx
// app/actions.js
'use server';

export async function updateSettings(state, formData) {
  const settings = {
    notifications: formData.get('notifications') === 'on',
    darkMode: formData.get('darkMode') === 'on',
    autoSave: formData.get('autoSave') === 'on',
  };
  
  await saveSettings(settings);
  
  return { ...settings, saved: true };
}
```

```jsx
function SettingsForm() {
  const [state, formAction] = useFormState(updateSettings, {
    notifications: false,
    darkMode: false,
    autoSave: false,
    saved: false,
  });
  
  return (
    <form action={formAction}>
      <label>
        <input
          type="checkbox"
          name="notifications"
          defaultChecked={state.notifications}
        />
        通知
      </label>
      
      <label>
        <input
          type="checkbox"
          name="darkMode"
          defaultChecked={state.darkMode}
        />
        暗色模式
      </label>
      
      <label>
        <input
          type="checkbox"
          name="autoSave"
          defaultChecked={state.autoSave}
        />
        自动保存
      </label>
      
      {state.saved && <p>设置已保存!</p>}
      
      <button type="submit">保存</button>
    </form>
  );
}
```

---

## 🎯 组合使用

### useFormStatus + useFormState

```jsx
// app/actions.js
'use server';

export async function submitComment(state, formData) {
  const comment = formData.get('comment');
  
  if (!comment || comment.trim() === '') {
    return { error: '评论不能为空' };
  }
  
  await saveComment(comment);
  return { success: true, comment };
}
```

```jsx
import { useFormState } from 'react-dom';
import { useFormStatus } from 'react-dom';
import { submitComment } from './actions';

function CommentForm() {
  const [state, formAction] = useFormState(submitComment, null);
  
  return (
    <form action={formAction}>
      <textarea name="comment" placeholder="评论..." />
      <SubmitButton />
      {state?.error && <p className="error">{state.error}</p>}
      {state?.success && <p className="success">评论已发布!</p>}
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button type="submit" disabled={pending}>
      {pending ? '发布中...' : '发布评论'}
    </button>
  );
}
```

### 与普通按钮组合

```jsx
function DeleteButton({ id }) {
  const { pending } = useFormStatus();
  
  return (
    <button
      type="submit"
      name="action"
      value="delete"
      disabled={pending}
    >
      {pending ? '删除中...' : '删除'}
    </button>
  );
}

function ItemActions({ itemId }) {
  return (
    <form action={itemActions}>
      <input type="hidden" name="itemId" value={itemId} />
      <DeleteButton />
    </form>
  );
}
```

---

## 🐛 常见问题

### Q: useFormStatus 为什么必须在 form 子组件中使用？

**A**: 因为它需要访问 form 的 context，获取提交状态。在 form 根组件中无法获取。

### Q: 如何处理多个表单？

```jsx
function MultiForm() {
  return (
    <>
      <form action={action1}>
        <StatusIndicator formId="form1" />
      </form>
      <form action={action2}>
        <StatusIndicator formId="form2" />
      </form>
    </>
  );
}

function StatusIndicator({ formId }) {
  const { pending } = useFormStatus();
  return <span>{pending ? `${formId} 提交中...` : '就绪'}</span>;
}
```

### Q: 如何清空表单？

```jsx
function Form() {
  const [state, formAction, isPending] = useFormState(action, initial);
  
  // 使用 key 强制重新渲染
  const [formKey, setFormKey] = useState(0);
  
  function reset() {
    setFormKey(k => k + 1);
  }
  
  return (
    <form key={formKey} action={formAction}>
      {/* 表单字段 */}
      <button type="button" onClick={reset}>重置</button>
    </form>
  );
}
```

---

## 📖 下一步

- [useOptimistic](./use-optimistic)
- [Document Metadata](./metadata)