import { RameElement, RamePropsWithChildren } from '../core/component';

/**
 * A built-in component for fragments — allows grouping multiple children without an extra wrapper element.
 */
export function Fragment({ children }: RamePropsWithChildren) {
  return children ?? null;
}

/**
 * Checks if a value is a RameElement.
 */
export function isRameElement(element: unknown): element is RameElement {
  // If element is nullish or not an object, it cannot be a RameElement
  if (!element || typeof element !== 'object') {
    return false;
  }

  // Check if the object has the $$typeof property and if it equals 'rame.element'
  if (!('$$typeof' in element)) {
    return false;
  }

  return element.$$typeof === 'rame.element';
}
