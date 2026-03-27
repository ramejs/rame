import { RexElement, RexPropsWithChildren } from '@rex/core/component';

/**
 * A built-in component for fragments — allows grouping multiple children without an extra wrapper element.
 */
export function Fragment({ children }: RexPropsWithChildren) {
  return children ?? null;
}

/**
 * Checks if a value is a RexElement.
 */
export function isRexElement(element: unknown): element is RexElement {
  // If element is nullish or not an object, it cannot be a RexElement
  if (!element || typeof element !== 'object') {
    return false;
  }

  // Check if the object has the $$typeof property and if it equals 'rex.element'
  if (!('$$typeof' in element)) {
    return false;
  }

  return element.$$typeof === 'rex.element';
}
