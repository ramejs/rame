import { Fragment, isRameElement } from '../jsx/runtime';
import { RameElement, RameNode, RameResolvedValue } from './component';

function collapseRenderedSiblings(results: RameResolvedValue[]): RameResolvedValue {
  const meaningfulResults = results.filter((result) => result !== null && result !== undefined);

  if (meaningfulResults.length === 0) {
    return null;
  }

  return meaningfulResults;
}

async function renderAwaitedNode(node: Awaited<RameNode>): Promise<RameResolvedValue> {
  if (
    node === null ||
    node === undefined ||
    ['string', 'number', 'boolean'].includes(typeof node)
  ) {
    return node;
  }

  if (Array.isArray(node)) {
    const results: RameResolvedValue[] = [];
    let containsRenderableChildren = false;

    for (const child of node) {
      const awaitedChild = await child;

      if (Array.isArray(awaitedChild) || isRameElement(awaitedChild)) {
        containsRenderableChildren = true;
      }

      results.push(await renderAwaitedNode(awaitedChild));
    }

    if (!containsRenderableChildren) {
      return results;
    }

    return collapseRenderedSiblings(results);
  }

  if (!isRameElement(node)) {
    return node as RameResolvedValue;
  }

  const element = node as RameElement;

  if (element.type === Fragment) {
    const { children } = element.props;
    if (children !== undefined) {
      return await renderToValue(children);
    }
    return null;
  }

  if (typeof element.type === 'function') {
    return await renderToValue(await element.type(element.props));
  }

  throw new Error(
    `[Rame] Intrinsic element <${element.type}> is not yet supported. Use function components only at this time.`,
  );
}

/**
 * This is the core rendering function that takes a `RameNode` (the result of rendering a component) and processes it.
 * During rendering nothing is actually returned, instead functions are awaited and called
 * Note: Do not forget to await :)
 */
export async function render(node: RameNode): Promise<void> {
  await renderToValue(node);
}

/**
 * Evaluates a node tree and returns its resolved value.
 *
 * This is useful for host integrations like HTTP servers that need to run a
 * component subtree and capture its result instead of discarding it.
 */
export async function renderToValue(node: RameNode): Promise<RameResolvedValue> {
  return await renderAwaitedNode(await node);
}
