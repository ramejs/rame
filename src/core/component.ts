import { Fragment } from '../jsx/runtime';
import { input, ZodType } from 'zod';

// A special symbol to identify Rame elements at runtime.
export interface RameElement<P = RamePropsWithChildren> {
  readonly $$typeof: 'rame.element';
  readonly type: RameComponentFn<P> | typeof Fragment | string;
  readonly props: P;
}

export type RameValue = string | number | boolean | null | undefined | object;

export type RameResolvedValue = RameValue | RameResolvedValue[];

// A special symbol to identify fragments at runtime.
type RameNodeAwaited = RameElement | RameValue | RameNode[];

// A special type for fragments — allows grouping multiple children without an extra wrapper element.
export type RameNode = Promise<RameNodeAwaited> | RameNodeAwaited;

// A built-in component for fragments — just returns its children as-is.
export type RameProps<T = unknown> = T;

// Fragment component: used to group multiple children without an extra wrapper element.
export type RamePropsWithChildren<T = unknown> = T & { children?: RameNode | RameNode[] };

// A component function: receives validated props, returns a node (or async).
export type RameComponentFn<P = RamePropsWithChildren | RameProps> = (
  props: P,
) => RameNode | Promise<RameNode>;

// Synchronous version of a component function, for cases where async rendering is not needed.
export type RameFunctionComponent<P = RamePropsWithChildren | RameProps> = RameComponentFn<P>;

/**
 * A Rame component enriched with a Zod schema for props validation.
 * The schema is attached as a `.schema` property so tooling can introspect it.
 */
export interface RameComponent<
  TSchema extends ZodType,
  P extends input<TSchema> = input<TSchema>,
> extends RameComponentFn<P> {
  // The Zod schema that validates and parses props for this component.
  schema: TSchema;
  // Human-readable display name
  displayName?: string;
}

/**
 * Attaches a Zod schema to a component function and returns the enriched
 * `RameComponent`. This is optional — you can also call `schema.parse()` inside
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
  fn: RameComponentFn<input<TSchema>>,
  displayName?: string,
): RameComponent<TSchema> {
  const component = ((props: input<TSchema>) => {
    const parsedProps = schema.parse(props) as input<TSchema>;
    return fn(parsedProps);
  }) as RameComponent<TSchema>;

  // Attach the schema to the component function for runtime validation and tooling support.
  component.schema = schema;

  if (displayName) component.displayName = displayName;

  return component;
}
