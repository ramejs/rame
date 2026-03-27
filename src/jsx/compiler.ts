import { RexComponentFn, RexElement, RexProps, RexPropsWithChildren } from '@rex/core/component';
import { Fragment } from './runtime';

/**
 * This is `jsx` function that will be called by the JSX transpiler to create elements.
 * It takes a type (which can be a string for HTML elements, a function for components,
 * or the Fragment component), props, and an optional key, and returns a RexElement object.
 */
export function jsx<P extends RexProps | RexPropsWithChildren>(
  type: RexComponentFn<P> | typeof Fragment | string,
  props: P,
): RexElement<P> {
  return {
    $$typeof: 'rex.element',
    type,
    props,
  };
}

// The compiler uses `jsxs` when an element has multiple children (array).
// Semantics are identical to `jsx` for our runtime.
export const jsxs = jsx;

// Dev build alias (same implementation, kept separate for future DX tooling).
export const jsxDEV = jsx;
