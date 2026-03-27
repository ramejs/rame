# @ramejs/rame

Write terminal and server-side output using JSX. Components are plain async functions — validated by Zod, composed with `render()`.

```tsx
import { render, Fragment } from '@ramejs/rame';
import { RawLog } from '@ramejs/rame/components/RawLog';

await render(
  <Fragment>
    <RawLog type="info" content="Server started on :3000" />
    <RawLog type="warn" content="Running without TLS" />
    <RawLog type="error" content="Database unreachable" />
  </Fragment>,
);
```

```
[INFO]  2026-03-28T10:00:00.000Z Server started on :3000
[WARN]  2026-03-28T10:00:00.000Z Running without TLS
[ERROR] 2026-03-28T10:00:00.000Z Database unreachable
```

## Install

```bash
npm install @ramejs/rame zod
```

> `zod` is a peer dependency — install it alongside rame and control the version yourself.

## Setup

Add two options to your `tsconfig.json`:

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

## Core API

### `render(node)`

Walks the component tree and runs every component in order, top to bottom. Async components are awaited before the next sibling runs.

```tsx
import { render } from '@ramejs/rame';

await render(<App />);
```

### `defineComponent(schema, fn, displayName?)`

Attaches a Zod schema to a component function. Props are validated at runtime — a `ZodError` is thrown on invalid input. The third argument sets an optional `displayName` for debugging.

```tsx
import { defineComponent } from '@ramejs/rame';
import { z } from 'zod';

const Greet = defineComponent(
  z.object({ name: z.string() }),
  ({ name }) => {
    console.log(`Hello, ${name}!`);
    return null;
  },
  'Greet',
);

await render(<Greet name="world" />);
// Hello, world!
```

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
import { defineComponent, render, Fragment } from '@ramejs/rame';
import { RawLog } from '@ramejs/rame/components/RawLog';
import { z } from 'zod';

const AppStartup = defineComponent(z.object({ port: z.number() }), ({ port }) => (
  <Fragment>
    <RawLog type="info" content={`Listening on port ${port}`} />
    <RawLog type="debug" content={`PID: ${process.pid}`} />
  </Fragment>
));

await render(<AppStartup port={3000} />);
// [INFO]  2026-03-28T10:00:00.000Z Listening on port 3000
// [DEBUG] 2026-03-28T10:00:00.000Z PID: 12345
```

### Rendering a list

```tsx
import { render, Fragment } from '@ramejs/rame';
import { RawLog } from '@ramejs/rame/components/RawLog';

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
import { defineComponent, render, Fragment } from '@ramejs/rame';
import { RawLog } from '@ramejs/rame/components/RawLog';
import { z } from 'zod';

const HealthCheck = defineComponent(
  z.object({ name: z.string(), url: z.string().url() }),
  async ({ name, url }) => {
    const res = await fetch(url);
    return (
      <RawLog
        type={res.ok ? 'info' : 'error'}
        content={`${name}: ${res.ok ? 'OK' : 'FAILED'} (${res.status})`}
      />
    );
  },
);

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
import { defineComponent, render, Fragment } from '@ramejs/rame';
import { RawLog } from '@ramejs/rame/components/RawLog';
import { z } from 'zod';

const EnvVar = defineComponent(z.object({ key: z.string() }), ({ key }) => {
  const value = process.env[key];
  return value ? (
    <RawLog type="info" content={`${key}=${value}`} />
  ) : (
    <RawLog type="warn" content={`${key} is not set`} />
  );
});

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
import { RawLog } from '@ramejs/rame/components/RawLog';
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
