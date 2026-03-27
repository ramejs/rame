import { z } from 'zod';
import { BasePropsSchema } from '../../schemas/base';

// ---------------------------------------------------------------------------
// RawLog props schema
// ---------------------------------------------------------------------------

// Log levels supported by RawLog.
export const RawLogType = z.enum(['info', 'warn', 'error', 'debug']);

// Transformer to convert RawLogType values to corresponding ANSI color codes for console output.
export const RawLogTypeToANSITransformer = RawLogType.transform((type) => {
  const ANSIColors = {
    info: '\x1b[34m', // blue
    warn: '\x1b[33m', // yellow
    error: '\x1b[31m', // red
    debug: '\x1b[35m', // magenta
  } as const;

  return ANSIColors[type];
});

// TypeScript type for RawLog props, inferred from the Zod schema.
export const RawLogPropsSchema = BasePropsSchema.omit({
  children: true,
}).extend({
  //  The message string to output.
  content: z.string(),

  /**
   * Log level.
   * Determines the label and color of the log message in the console.
   * Supported values: "info", "warn", "error", "debug".
   * Defaults to `"info"` when omitted.
   */
  type: RawLogType.default('info').describe('Log level for the message'),
});

// Input (user-facing) props type — `type` is optional because it has a default.
export type RawLogProps = z.input<typeof RawLogPropsSchema>;

// Parsed (internal) props type — all fields are present and fully typed.
export type RawLogParsedProps = z.output<typeof RawLogPropsSchema>;
