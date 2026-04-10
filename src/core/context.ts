import { renderToValue } from './renderer';
import type { RameComponentFn, RameNode, RameResolvedValue } from './component';

/**
 * Interface for the Provider component's props. `value` is the context value to provide,
 * and `children` are the nodes to render within this Provider's scope.
 */
interface ProviderProps<T> {
  value: T;
  children?: RameNode;
}

/**
 * Interface for the Consumer component's props. `children` is a render prop that receives the current
 */
interface ConsumerProps<T> {
  // Render-prop: receives the current context value and returns a node.
  children: (value: T) => RameNode;
}

/**
 * A Rame context object — the result of `createContext()`.
 * Holds the Provider and Consumer components, the default value, and an
 * optional display name for tooling.
 */
interface RameContext<T> {
  readonly $$typeof: 'rame.context';
  readonly defaultValue: T;

  // Provide a value to all descendants until the Provider finishes rendering.
  Provider: RameComponentFn<ProviderProps<T>>;

  /**
   * Consume the nearest Provider's value via a render prop.
   *
   * @example
   * ```tsx
   * <SomeContext.Consumer>
   *   {(someValue) => <RawLog content={`someValue is ${someValue}`} />}
   * </SomeContext.Consumer>
   * ```
   */
  Consumer: RameComponentFn<ConsumerProps<T>>;

  // Optional name shown in error messages and future devtools.
  displayName?: string;
}

/**
 * Internal registry for context stacks. Each context has its own stack of values, which
 * allows nested Providers to override values for their descendants.
 *
 * A WeakMap keyed by context instance ensures stacks are GC-able when a
 * context is no longer referenced, and avoids any global naming collisions.
 */
const contextStacks = new WeakMap<RameContext<unknown>, unknown[]>();

function getStack<T>(ctx: RameContext<T>): T[] {
  let stack = contextStacks.get(ctx as RameContext<unknown>);
  if (!stack) {
    stack = [];
    contextStacks.set(ctx as RameContext<unknown>, stack);
  }
  return stack as T[];
}

/**
 * Reads the current value of a context.
 *
 * Must be called **synchronously** during component execution — after `render`
 * passes control to the next sibling the context stack may have changed.
 *
 * Returns the nearest `Provider`'s `value`, or the context's `defaultValue`
 * if there is no Provider in scope.
 *
 * @example
 * ```ts
 * const Child = defineComponent(z.object({}), () => {
 *   const some = useContext(someContext);
 *   console.log(some); // 'someValue'
 *   return null;
 * });
 * ```
 */
export function useContext<T>(ctx: RameContext<T>): T {
  const stack = getStack(ctx);

  if (stack.length) {
    return stack[stack.length - 1]!;
  }
  return ctx.defaultValue;
}

/**
 * Concrete implementation of `RameContext<T>`.
 *
 * `Provider` and `Consumer` are arrow-function class fields so that `this`
 * always refers to the instance, even when the renderer calls them as plain
 * functions (i.e. `element.type(element.props)`).
 */
class RameContextImpl<T> implements RameContext<T> {
  readonly $$typeof = 'rame.context' as const;
  displayName?: string;

  constructor(readonly defaultValue: T) {}

  // Pushes `value` onto the stack, renders children, then pops it — even if
  // rendering throws. Returns the resolved subtree value so host integrations
  // can preserve results across the provider boundary.
  Provider = async ({ value, children }: ProviderProps<T>): Promise<RameResolvedValue> => {
    const stack = getStack(this);
    stack.push(value);
    try {
      return await renderToValue(children ?? null);
    } finally {
      stack.pop();
    }
  };

  // Reads the nearest Provider's value and passes it to the render-prop child.
  Consumer = ({ children }: ConsumerProps<T>): RameNode => {
    const value = useContext(this);
    return children(value);
  };
}

/**
 * Creates a new context with the given default value.
 *
 * The returned object exposes:
 * - `Provider` — a component that makes `value` available to all descendants
 *   rendered within it.
 * - `Consumer` — a component that reads the nearest `Provider`'s value via a
 *   render prop.
 *
 * Use `useContext(ctx)` inside a component to read the value without a
 * Consumer wrapper.
 *
 * @example
 * ```ts
 * const SomeContext = createContext<'value1' | 'value2'>('value1');
 *
 * await render(
 *   <SomeContext.Provider value="value2">
 *     <MyComponent />
 *   </SomeContext.Provider>
 * );
 * ```
 */
export function createContext<T>(defaultValue: T): RameContext<T> {
  return new RameContextImpl(defaultValue);
}
