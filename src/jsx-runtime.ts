// This file is the automatic JSX import source (`rex/jsx-runtime`).
// The TypeScript compiler inserts `import { jsx, jsxs, Fragment } from "rex/jsx-runtime"`
// at the top of every .tsx file automatically — you never import it yourself.

import { RexComponentFn, RexElement } from './core/component';
export { jsx, jsxs, jsxDEV } from './jsx/compiler';
export { Fragment } from './jsx/runtime';

// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace JSX {
  /** The type of every JSX expression, e.g. `const el: JSX.Element = <Foo />` */
  type Element = RexElement;

  /** Tells TypeScript which prop holds children. */
  interface ElementChildrenAttribute {
    children: object;
  }

  /**
   * Accept any component function, regardless of its concrete prop type.
   * `any` is intentional — using a specific props type causes contravariance
   * failures when TypeScript checks concrete components against this type.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type ElementType = RexComponentFn<any>;

  /**
   * No built-in for now
   */
  interface IntrinsicElements {
    [tag: string]: Record<string, unknown>;
  }
}
