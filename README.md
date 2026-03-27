# @rex/core

Write terminal and server-side output using JSX. Components are just functions — validated by Zod, composed with `render()`.

```tsx
import { render, Fragment } from '@rex/core';
import { RawLog } from '@rex/core/components/RawLog';

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
npm install @rex/core zod
```

> `zod` is a peer dependency — you control the version.

## Setup

Add this to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@rex/core"
  }
}
```

That's all. No Babel, no extra plugins.

## Concepts

### `render(node)`

Walks and executes the component tree. Components run in order, top to bottom, and async components are awaited automatically.

```tsx
await render(<MyComponent />);
```

### `defineComponent(schema, fn)`

Creates a component with Zod-validated props. The schema is attached to the function so tooling can introspect it.

```tsx
import { defineComponent } from '@rex/core';
import { z } from 'zod';

const Greet = defineComponent(z.object({ name: z.string() }), (props) => {
  const { name } = GreetSchema.parse(props);
  console.log(`Hello, ${name}`);
  return null;
});

await render(<Greet name="world" />);
```

### `Fragment`

Groups sibling components without an extra wrapper — same idea as React fragments.

```tsx
<Fragment>
  <RawLog content="first" />
  <RawLog content="second" />
</Fragment>
```

## Built-in components

### `RawLog`

Prints a colorized, timestamped log line.

| Prop      | Type                                     | Default  | Description                  |
| --------- | ---------------------------------------- | -------- | ---------------------------- |
| `content` | `string`                                 | —        | The message to print         |
| `type`    | `"info" \| "warn" \| "error" \| "debug"` | `"info"` | Controls the label and color |

```tsx
import { RawLog } from '@rex/core/components/RawLog';

<RawLog content="Cache warmed up" />
<RawLog type="debug" content="Payload size: 4kb" />
```

## License

MIT
