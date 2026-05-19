# Context 作为 Provider

React 19 简化了 Context 的写法，可以直接使用 `<Context>` 作为 Provider，无需专门的 `<Context.Provider>`。

## 🎯 变化对比

### React 18

```jsx
// 创建 Context
const ThemeContext = createContext('light');

// 使用 Provider
function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Toolbar />
    </ThemeContext.Provider>
  );
}

// 消费 Context
function Toolbar() {
  const theme = useContext(ThemeContext);
  return <div>当前主题：{theme}</div>;
}
```

### React 19

```jsx
// 创建 Context（不变）
const ThemeContext = createContext('light');

// 直接使用 Context 作为 Provider
function App() {
  return (
    <ThemeContext value="dark">
      <Toolbar />
    </ThemeContext>
  );
}

// 消费 Context（不变）
function Toolbar() {
  const theme = useContext(ThemeContext);
  return <div>当前主题：{theme}</div>;
}
```

## 💡 完整示例

### 1. 多主题切换

```jsx
// contexts/ThemeContext.js
import { createContext } from 'react';

export const ThemeContext = createContext('light');

// components/ThemeProvider.js
import { ThemeContext } from './ThemeContext';

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  
  const toggleTheme = () => {
    setTheme(t => t === 'light' ? 'dark' : 'light');
  };
  
  return (
    <ThemeContext value={theme}>
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        {children}
      </ThemeContext.Provider>
    </ThemeContext>
  );
}

// 使用
function App() {
  return (
    <ThemeProvider>
      <Layout />
    </ThemeProvider>
  );
}
```

### 2. 嵌套 Context

```jsx
const UserContext = createContext(null);
const SettingsContext = createContext({});

function App() {
  return (
    <UserContext value={{ id: 1, name: '张三' }}>
      <SettingsContext value={{ language: 'zh', timezone: 'Asia/Shanghai' }}>
        <Profile />
      </SettingsContext>
    </UserContext>
  );
}

function Profile() {
  const user = useContext(UserContext);
  const settings = useContext(SettingsContext);
  
  return (
    <div>
      <p>用户：{user.name}</p>
      <p>语言：{settings.language}</p>
    </div>
  );
}
```

### 3. 条件 Provider

```jsx
function App({ user }) {
  return (
    <AuthContext value={user}>
      {user ? (
        <UserContext value={user}>
          <Dashboard />
        </UserContext>
      ) : (
        <GuestContext value={null}>
          <LoginForm />
        </GuestContext>
      )}
    </AuthContext>
  );
}
```

## 🔍 工作原理

### 内部实现

```javascript
// packages/react/src/ReactContext.js
function Context({ value, children }) {
  // 读取当前渲染的 Context
  const context = readContext(Context);
  
  // 如果值发生变化，调度更新
  if (context !== value) {
    scheduleUpdateOnFiber(current, lane);
  }
  
  return children;
}

// Provider 别名
Context.Provider = Context;
```

### 向后兼容

```javascript
// React 19 仍然支持 .Provider
Context.Provider = Context;

// 所以两种写法都有效
<Context.Provider value={value}>  {/* React 18 风格，仍然有效 */}
<Context value={value}>           {/* React 19 新风格 */}
```

## 📊 使用场景

### 1. 用户认证

```jsx
// contexts/AuthContext.js
import { createContext } from 'react';

export const AuthContext = createContext(null);

// components/AuthProvider.js
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // 检查登录状态
    checkAuth().then(user => {
      setUser(user);
      setLoading(false);
    });
  }, []);
  
  const login = async (credentials) => {
    const user = await api.login(credentials);
    setUser(user);
  };
  
  const logout = async () => {
    await api.logout();
    setUser(null);
  };
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return (
    <AuthContext value={{ user, login, logout }}>
      {children}
    </AuthContext>
  );
}

// 使用
function App() {
  return (
    <AuthProvider>
      <Nav />
      <Main />
    </AuthProvider>
  );
}
```

### 2. 国际化

```jsx
// contexts/LocaleContext.js
import { createContext } from 'react';

export const LocaleContext = createContext({
  locale: 'zh-CN',
  messages: {},
  setLocale: () => {},
});

// 使用
function I18nProvider({ children }) {
  const [locale, setLocale] = useState('zh-CN');
  const messages = getMessages(locale);
  
  return (
    <LocaleContext value={{ locale, messages, setLocale }}>
      {children}
    </LocaleContext>
  );
}

// 消费
function Welcome() {
  const { messages } = useContext(LocaleContext);
  return <h1>{messages.welcome}</h1>;
}
```

### 3. 状态管理

```jsx
// contexts/StoreContext.js
import { createContext, useReducer } from 'react';

const initialState = {
  count: 0,
  items: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'INCREMENT':
      return { ...state, count: state.count + 1 };
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.payload] };
    default:
      return state;
  }
}

export const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  
  return (
    <StoreContext value={{ state, dispatch }}>
      {children}
    </StoreContext>
  );
}

// 自定义 Hook
export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return context;
}

// 使用
function Counter() {
  const { state, dispatch } = useStore();
  
  return (
    <div>
      <p>计数：{state.count}</p>
      <button onClick={() => dispatch({ type: 'INCREMENT' })}>
        +1
      </button>
    </div>
  );
}
```

## ⚠️ 注意事项

### 1. Provider 命名

```jsx
// ✅ 推荐：清晰的命名
const UserContext = createContext(null);

function App() {
  return <UserContext value={user}>...</UserContext>;
}

// ⚠️ 避免混淆
const UserProvider = createContext(null);  // 名字叫 Provider 但实际是 Context

// 使用
<UserProvider value={user}>  {/* 容易误解 */}
```

### 2. TypeScript 类型

```typescript
// 定义 Context 类型
interface User {
  id: number;
  name: string;
}

const UserContext = createContext<User | null>(null);

// 使用
function Component() {
  const user = useContext(UserContext);
  // user 类型是 User | null
  return <div>{user?.name}</div>;
}
```

### 3. 默认值

```jsx
// 默认值仍然有效
const ThemeContext = createContext('light');

// 不 wrapping Provider 时使用默认值
function App() {
  return <Toolbar />;  // Toolbar 中 useContext(ThemeContext) 返回 'light'
}
```

## 🔧 迁移指南

### 从旧代码迁移

```jsx
// Before
<ThemeContext.Provider value={theme}>
  <App />
</ThemeContext.Provider>

// After (React 19)
<ThemeContext value={theme}>
  <App />
</ThemeContext>

// 或者保持原样（仍然有效）
<ThemeContext.Provider value={theme}>
  <App />
</ThemeContext.Provider>
```

### Codemod 脚本

```javascript
// 自动迁移 codemod
module.exports = function transformer(file, api) {
  const j = api.jscodeshift;
  
  return j(file.source)
    .find(j.JSXElement, {
      openingElement: {
        name: {
          type: 'JSXMemberExpression',
          property: { name: 'Provider' }
        }
      }
    })
    .forEach(path => {
      // <Context.Provider> → <Context>
      const contextName = path.node.openingElement.name.object.name;
      path.node.openingElement.name = j.jsxIdentifier(contextName);
      path.node.closingElement.name = j.jsxIdentifier(contextName);
    })
    .toSource();
};
```

## 📊 对比总结

| 特性 | React 18 | React 19 |
|------|----------|----------|
| Provider 写法 | `<Context.Provider>` | `<Context>` |
| 兼容性 | - | 两种都支持 |
| 代码量 | 多 `.Provider` | 简洁 |
| 类型安全 | 需要定义 Provider type | 相同 |

## 🐛 常见问题

### Q: 还可以用 `<Context.Provider>` 吗？

**A**: 可以，React 19 完全向后兼容。

### Q: 需要更新所有代码吗？

**A**: 不需要，可以逐步迁移。

### Q: 第三方库怎么办？

**A**: 大多数库会继续使用 `.Provider`，完全兼容。

---

## 📖 下一步

- [清理 useEffect 中的事件监听器](../implementation/use-effect)
- [完整实现篇首页](../implementation/)