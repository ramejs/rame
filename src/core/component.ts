import { Fragment } from '@rex/jsx/runtime';
import { input, ZodType } from 'zod';

// A special symbol to identify Rex elements at runtime.
export interface RexElement<P = RexPropsWithChildren> {
  readonly $$typeof: 'rex.element';
  readonly type: RexComponentFn<P> | typeof Fragment | string;
  readonly props: P;
}

// A special symbol to identify fragments at runtime.
type RexNodeAwaited = RexElement | string | number | boolean | null | undefined | RexNode[];

// A special type for fragments — allows grouping multiple children without an extra wrapper element.
export type RexNode = Promise<RexNodeAwaited> | RexNodeAwaited;

// A built-in component for fragments — just returns its children as-is.
export type RexProps<T = unknown> = T;

// Fragment component: used to group multiple children without an extra wrapper element.
export type RexPropsWithChildren<T = unknown> = T & { children?: RexNode | RexNode[] };

// A component function: receives validated props, returns a node (or async).
export type RexComponentFn<P = RexPropsWithChildren | RexProps> = (
  props: P,
) => RexNode | Promise<RexNode>;

// Synchronous version of a component function, for cases where async rendering is not needed.
export type RexFunctionComponent<P = RexPropsWithChildren | RexProps> = RexComponentFn<P>;

/**
 * A Rex component enriched with a Zod schema for props validation.
 * The schema is attached as a `.schema` property so tooling can introspect it.
 */
export interface RexComponent<
  TSchema extends ZodType,
  P extends input<TSchema> = input<TSchema>,
> extends RexComponentFn<P> {
  // The Zod schema that validates and parses props for this component.
  schema: TSchema;
  // Human-readable display name
  displayName?: string;
}

/**
 * Attaches a Zod schema to a component function and returns the enriched
 * `RexComponent`. This is optional — you can also call `schema.parse()` inside
 * the component body directly.
 *
 * @example
 * ```ts
 * export const MyComp = defineComponent(MyPropsSchema, (props) => {
 *   const { foo } = MyPropsSchema.parse(props);
 *   // ...
 *   return null;
 * });
 * ```
 */
export function defineComponent<TSchema extends ZodType>(
  schema: TSchema,
  fn: RexComponentFn<input<TSchema>>,
  displayName?: string,
): RexComponent<TSchema> {
  const component = fn as RexComponent<TSchema>;

  // Attach the schema to the component function for runtime validation and tooling support.
  component.schema = schema;

  if (displayName) component.displayName = displayName;

  return component;
}
