# @ramejs/rame

Write backend/server output using JSX — for Node.js, CLI tools, and server-side rendering. Components are plain async functions, props are validated with Zod, and everything is rendered in order.

## Install

```bash
npm install @ramejs/rame zod
```

> `zod` is a peer dependency — install it alongside rame and control the version yourself.

## Setup

Add to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@ramejs/rame"
  }
}
```

No Babel, no extra plugins. TypeScript handles the JSX transform automatically.

---

## Quick Example

```tsx
import { render, Fragment } from '@ramejs/rame';
import { RawLog } from '@ramejs/rame';

await render(
  <Fragment>
    <RawLog type="info" content="Server started on :3000" />
    <RawLog type="warn" content="Running without TLS" />
    <RawLog type="error" content="Database unreachable" />
  </Fragment>,
);
```

---

## Context Example (Node.js)

```tsx
import { render, createContext, useContext, Fragment } from '@ramejs/rame';

// Create a context for the current environment
const EnvContext = createContext<'dev' | 'prod'>('dev');

// Arrow function component (like React)
const LogEnv = ({ label }: { label: string }) => {
  const env = useContext(EnvContext);
  console.log(`${label}: ${env}`);
  return null;
};

const EnvProvider = ({ value, children }: { value: 'dev' | 'prod'; children?: any }) => (
  <EnvContext.Provider value={value}>{children}</EnvContext.Provider>
);

await render(
  <Fragment>
    <LogEnv label="Default env" />
    <EnvProvider value="prod">
      <LogEnv label="Inside provider" />
    </EnvProvider>
    <LogEnv label="After provider" />
  </Fragment>,
);
// Output:
// Default env: dev
// Inside provider: prod
// After provider: dev
```

---

## API

- `render(node)` — Walks the component tree and runs every component in order, top to bottom. Async components are awaited before the next sibling runs.
- `defineComponent(schema, fn, displayName?)` — Attaches a Zod schema to a component function. Props are validated at runtime. The third argument sets an optional `displayName` for debugging.
- `createContext(defaultValue)` — Creates a context object for sharing values across the tree. Use `Provider`, `Consumer`, or `useContext` to read values.
- `useContext(ctx)` — Reads the current value of a context inside a component.
- `Fragment` — Groups multiple children without a wrapper.
- `RawLog` — Prints a colorized, timestamped log line to stdout.

---

## More Examples

- See `examples/basic.tsx` for logging
- See `examples/context-simple.tsx` and `examples/context-multi.tsx` for context usage

---

### `Fragment`

Groups multiple components without introducing a wrapper element — same concept as React fragments.

```tsx
import { render, Fragment } from '@ramejs/rame';

await render(
  <Fragment>
    <Greet name="Alice" />
    <Greet name="Bob" />
  </Fragment>,
);
```

---

## Examples

### A component that returns JSX

```tsx
import { render, Fragment, RawLog } from '@ramejs/rame';

const AppStartup = ({ port }: { port: number }) => (
  <Fragment>
    <RawLog type="info" content={`Listening on port ${port}`} />
    <RawLog type="debug" content={`PID: ${process.pid}`} />
  </Fragment>
);

await render(<AppStartup port={3000} />);
// [INFO]  2026-03-28T10:00:00.000Z Listening on port 3000
// [DEBUG] 2026-03-28T10:00:00.000Z PID: 12345
```

### Rendering a list

```tsx
import { render, Fragment, RawLog } from '@ramejs/rame';

const failed = ['users', 'orders', 'payments'];

await render(
  <Fragment>
    {failed.map((service) => (
      <RawLog type="error" content={`${service} service unreachable`} />
    ))}
  </Fragment>,
);
// [ERROR] 2026-03-28T10:00:00.000Z users service unreachable
// [ERROR] 2026-03-28T10:00:00.000Z orders service unreachable
// [ERROR] 2026-03-28T10:00:00.000Z payments service unreachable
```

### Async component

`render()` awaits each component before moving to the next sibling.

```tsx
import { render, Fragment, RawLog } from '@ramejs/rame';

const HealthCheck = async ({ name, url }: { name: string; url: string }) => {
  const res = await fetch(url);
  return (
    <RawLog
      type={res.ok ? 'info' : 'error'}
      content={`${name}: ${res.ok ? 'OK' : 'FAILED'} (${res.status})`}
    />
  );
};

await render(
  <Fragment>
    <HealthCheck name="api" url="https://api.example.com/health" />
    <HealthCheck name="db" url="https://db.example.com/ping" />
  </Fragment>,
);
// [INFO]  2026-03-28T10:00:00.000Z api: OK (200)
// [ERROR] 2026-03-28T10:00:00.000Z db: FAILED (503)
```

### Composing components

```tsx
import { render, Fragment, RawLog } from '@ramejs/rame';

const EnvVar = ({ key }: { key: string }) => {
  const value = process.env[key];
  return value ? (
    <RawLog type="info" content={`${key}=${value}`} />
  ) : (
    <RawLog type="warn" content={`${key} is not set`} />
  );
};

await render(
  <Fragment>
    {['NODE_ENV', 'DATABASE_URL', 'PORT'].map((key) => (
      <EnvVar key={key} />
    ))}
  </Fragment>,
);
// [INFO]  2026-03-28T10:00:00.000Z NODE_ENV=production
// [WARN]  2026-03-28T10:00:00.000Z DATABASE_URL is not set
// [INFO]  2026-03-28T10:00:00.000Z PORT=3000
```

---

## Built-in components

### `RawLog`

Prints a colorized, timestamped log line to stdout.

```tsx
import { RawLog } from '@ramejs/rame/RawLog';
```

| Prop      | Type                                     | Default    | Description                  |
| --------- | ---------------------------------------- | ---------- | ---------------------------- |
| `content` | `string`                                 | (required) | The message to print         |
| `type`    | `"info" \| "warn" \| "error" \| "debug"` | `"info"`   | Controls the label and color |

```tsx
<RawLog content="Cache warmed up" />
<RawLog type="debug" content={`Heap used: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}mb`} />
<RawLog type="error" content="Connection refused" />
```

---

## License

MIT
