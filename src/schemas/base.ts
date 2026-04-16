import { z } from 'zod';

/**
 *  Every Rame component's prop schema MUST extend this.
 * It provides the common fields the renderer and tooling rely on.
 */

export const BasePropsSchema = z.object({
  /**
   * Child nodes. Components that accept children should extend this and
   * refine the `children` field to be more specific.
   */
  children: z.any().optional(),
});

export type BaseProps = z.infer<typeof BasePropsSchema>;
