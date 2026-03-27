import { Fragment } from '@rex/jsx/runtime';
import { RexElement, RexNode } from './component';

/**
 * This is the core rendering function that takes a `RexNode` (the result of rendering a component) and processes it.
 * During rendering nothing is actually returned, instead functions are awaited and called
 * Note: Do not forget to await :)
 */
export async function render(node: RexNode): Promise<void> {
  // Base case: primitive values (string, number, boolean) and null/undefined are returned as-is.
  // This is because rendering them brings nothing on the table
  if (!node || ['string', 'number', 'boolean'].includes(typeof node)) {
    return;
  }

  // If the node is an array, we need to render each child in sequence.
  if (Array.isArray(node)) {
    for (const child of node) {
      // Note: we await each child before rendering the next one to ensure proper sequencing, especially if some children are promises.
      await render(await child);
    }
    return;
  }

  // At this point, node is a single element
  const element = (await node) as RexElement;

  // If the element is a Fragment, we need to render its children directly without any wrapper.
  if (element.type === Fragment) {
    const { children } = element.props;
    if (children !== undefined) {
      await render(children);
    }
    return;
  }

  // Function component — invoke it with its props and render the result.
  if (typeof element.type === 'function') {
    await render(await element.type(element.props));
    return;
  }

  // Intrinsic string tag — reserved for future host bindings
  throw new Error(
    `[Rex] Intrinsic element <${element.type}> is not yet supported. Use function components only at this time.`,
  );
}
