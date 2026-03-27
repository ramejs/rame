import { describe, it, expect } from 'bun:test';
import { jsx, jsxs, jsxDEV } from '@rex/jsx/compiler';
import { Fragment } from '@rex/jsx/runtime';

describe('jsx factory', () => {
  it('sets $$typeof to rex.element', () => {
    const el = jsx('div', {});
    expect(el.$$typeof).toBe('rex.element');
  });

  it('sets type to the given string', () => {
    const el = jsx('span', {});
    expect(el.type).toBe('span');
  });

  it('sets type to a component function', () => {
    const fn = () => null;
    const el = jsx(fn, {});
    expect(el.type).toBe(fn);
  });

  it('sets type to Fragment', () => {
    const el = jsx(Fragment, {});
    expect(el.type).toBe(Fragment);
  });

  it('sets props on the element', () => {
    const props = { content: 'hello', level: 3 };
    const el = jsx('div', props);
    expect(el.props).toEqual(props);
  });

  it('jsxs produces the same shape as jsx', () => {
    const props = { children: ['a', 'b'] };
    expect(jsxs('div', props)).toEqual(jsx('div', props));
  });

  it('jsxDEV produces the same shape as jsx', () => {
    const props = { id: 'test' };
    expect(jsxDEV('section', props)).toEqual(jsx('section', props));
  });
});
