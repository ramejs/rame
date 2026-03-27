import { RawLogPropsSchema, RawLogTypeToANSITransformer, type RawLogProps } from './schema';
import { defineComponent } from '@ramejs/rame/component';

// ---------------------------------------------------------------------------
// ANSI color helpers
// ---------------------------------------------------------------------------

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
} as const;

// ---------------------------------------------------------------------------
// RawLog component
//
// Usage:
//   <RawLog content="Server started" type="info" />
//   <RawLog content="Something went wrong" type="error" />
//   <RawLog content="Cache miss" />   ← type defaults to "info"
// ---------------------------------------------------------------------------

export const RawLog = defineComponent(
  RawLogPropsSchema,
  (rawProps: RawLogProps) => {
    // Validate & apply defaults via Zod — throws ZodError on invalid input.
    const { content, type } = RawLogPropsSchema.parse(rawProps);

    const color = RawLogTypeToANSITransformer.parse(type); // Get ANSI color code for the log type.
    const label = `${ANSI.bold}${color}[${type.toUpperCase()}]${ANSI.reset}`;

    const timestamp = new Date().toISOString();

    console.log(`${label} ${color}${timestamp}${ANSI.reset} ${content}`);

    // RawLog is a leaf (side-effect) component — no children to render.
    return null;
  },
  'RawLog',
);
