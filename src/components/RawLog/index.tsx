import { RawLogPropsSchema, RawLogTypeToANSITransformer, type RawLogProps } from './schema';
import { defineComponent } from '../../core/component';

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
} as const;

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
