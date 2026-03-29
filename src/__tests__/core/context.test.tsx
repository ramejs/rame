import { describe, it, expect } from 'bun:test';
import { z } from 'zod';
import { render, defineComponent, Fragment } from '../../index';
import { createContext, useContext } from '../../core/context';

describe('createContext / useContext', () => {
  // ---------------------------------------------------------------------------
  // Context shape
  // ---------------------------------------------------------------------------

  it('exposes $$typeof and defaultValue on the context object', () => {
    const Ctx = createContext('initial');
    expect(Ctx.$$typeof).toBe('rame.context');
    expect(Ctx.defaultValue).toBe('initial');
  });

  // ---------------------------------------------------------------------------
  // Provider + useContext
  // ---------------------------------------------------------------------------

  it('provides the default value when no Provider is present', async () => {
    const Ctx = createContext('default');
    let received = '';

    const Child = defineComponent(z.object({}), () => {
      received = useContext(Ctx);
      return null;
    });

    await render(<Child />);

    expect(received).toBe('default');
  });

  it('multiple sibling components inside a Provider all read the same value', async () => {
    const Ctx = createContext('initial');
    const log: string[] = [];

    const First = defineComponent(z.object({}), () => {
      log.push(useContext(Ctx));
      return null;
    });

    const Second = defineComponent(z.object({}), () => {
      log.push(useContext(Ctx));
      return null;
    });

    await render(
      <Ctx.Provider value="shared">
        <First />
        <Second />
      </Ctx.Provider>,
    );

    expect(log).toEqual(['shared', 'shared']);
  });

  it('provides the Provider value to a descendant via useContext', async () => {
    const Ctx = createContext('light');
    let received = '';

    const Child = defineComponent(z.object({}), () => {
      received = useContext(Ctx);
      return null;
    });

    await render(
      <Ctx.Provider value="dark">
        <Child />
      </Ctx.Provider>,
    );

    expect(received).toBe('dark');
  });

  it('restores the outer value after the Provider finishes', async () => {
    const Ctx = createContext('outer');
    const log: string[] = [];

    const Before = defineComponent(z.object({}), () => {
      log.push(useContext(Ctx));
      return null;
    });

    const Inside = defineComponent(z.object({}), () => {
      log.push(useContext(Ctx));
      return null;
    });

    const After = defineComponent(z.object({}), () => {
      log.push(useContext(Ctx));
      return null;
    });

    await render(
      <Fragment>
        <Before />
        <Ctx.Provider value="inner">
          <Inside />
        </Ctx.Provider>
        <After />
      </Fragment>,
    );

    expect(log).toEqual(['outer', 'inner', 'outer']);
  });

  it('supports nested Providers — innermost wins', async () => {
    const Ctx = createContext('A');
    let received = '';

    const Child = defineComponent(z.object({}), () => {
      received = useContext(Ctx);
      return null;
    });

    await render(
      <Ctx.Provider value="B">
        <Ctx.Provider value="C">
          <Child />
        </Ctx.Provider>
      </Ctx.Provider>,
    );

    expect(received).toBe('C');
  });

  it('outer Provider value is visible after inner Provider exits', async () => {
    const Ctx = createContext('A');
    const log: string[] = [];

    const Inner = defineComponent(z.object({}), () => {
      log.push(useContext(Ctx));
      return null;
    });

    const Outer = defineComponent(z.object({}), () => {
      log.push(useContext(Ctx));
      return null;
    });

    await render(
      <Ctx.Provider value="B">
        <Ctx.Provider value="C">
          <Inner />
        </Ctx.Provider>
        <Outer />
      </Ctx.Provider>,
    );

    expect(log).toEqual(['C', 'B']);
  });

  it('works with non-string values (object)', async () => {
    const Ctx = createContext<{ count: number }>({ count: 0 });
    let received = { count: -1 };

    const Child = defineComponent(z.object({}), () => {
      received = useContext(Ctx);
      return null;
    });

    await render(
      <Ctx.Provider value={{ count: 42 }}>
        <Child />
      </Ctx.Provider>,
    );

    expect(received).toEqual({ count: 42 });
  });

  it('independent contexts do not interfere with each other', async () => {
    const ThemeCtx = createContext('light');
    const LangCtx = createContext('en');
    let theme = '';
    let lang = '';

    const Child = defineComponent(z.object({}), () => {
      theme = useContext(ThemeCtx);
      lang = useContext(LangCtx);
      return null;
    });

    await render(
      <ThemeCtx.Provider value="dark">
        <LangCtx.Provider value="fr">
          <Child />
        </LangCtx.Provider>
      </ThemeCtx.Provider>,
    );

    expect(theme).toBe('dark');
    expect(lang).toBe('fr');
  });

  it('deep descendant (grandchild) sees the Provider value', async () => {
    const Ctx = createContext('root');
    let received = '';

    const Grandchild = defineComponent(z.object({}), () => {
      received = useContext(Ctx);
      return null;
    });

    const Parent = defineComponent(z.object({}), () => <Grandchild />);

    await render(
      <Ctx.Provider value="provided">
        <Parent />
      </Ctx.Provider>,
    );

    expect(received).toBe('provided');
  });

  it('async component inside Provider reads the correct value', async () => {
    const Ctx = createContext('sync');
    let received = '';

    const AsyncChild = defineComponent(z.object({}), async () => {
      await new Promise((r) => setTimeout(r, 10));
      received = useContext(Ctx);
      return null;
    });

    await render(
      <Ctx.Provider value="async">
        <AsyncChild />
      </Ctx.Provider>,
    );

    expect(received).toBe('async');
  });

  it('null is a valid provided value', async () => {
    const Ctx = createContext<string | null>('default');
    let received: string | null = 'untouched';

    const Child = defineComponent(z.object({}), () => {
      received = useContext(Ctx);
      return null;
    });

    await render(
      <Ctx.Provider value={null}>
        <Child />
      </Ctx.Provider>,
    );

    expect(received).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Consumer (render-prop)
  // ---------------------------------------------------------------------------

  it('Consumer passes the default value when no Provider is present', async () => {
    const Ctx = createContext('fallback');
    let received = '';

    await render(
      <Ctx.Consumer>
        {(value) => {
          received = value;
          return null;
        }}
      </Ctx.Consumer>,
    );

    expect(received).toBe('fallback');
  });

  it('Consumer passes the Provider value', async () => {
    const Ctx = createContext('off');
    let received = '';

    await render(
      <Ctx.Provider value="on">
        <Ctx.Consumer>
          {(value) => {
            received = value;
            return null;
          }}
        </Ctx.Consumer>
      </Ctx.Provider>,
    );

    expect(received).toBe('on');
  });

  it('Consumer can return a component subtree', async () => {
    const Ctx = createContext('hello');
    const rendered: string[] = [];

    const Leaf = defineComponent(z.object({ msg: z.string() }), ({ msg }) => {
      rendered.push(msg);
      return null;
    });

    await render(
      <Ctx.Provider value="world">
        <Ctx.Consumer>{(value) => <Leaf msg={value} />}</Ctx.Consumer>
      </Ctx.Provider>,
    );

    expect(rendered).toEqual(['world']);
  });

  it('Consumer with nested Providers picks up the innermost value', async () => {
    const Ctx = createContext('A');
    let received = '';

    await render(
      <Ctx.Provider value="B">
        <Ctx.Provider value="C">
          <Ctx.Consumer>
            {(value) => {
              received = value;
              return null;
            }}
          </Ctx.Consumer>
        </Ctx.Provider>
      </Ctx.Provider>,
    );

    expect(received).toBe('C');
  });

  // ---------------------------------------------------------------------------
  // Provider cleanup on error
  // ---------------------------------------------------------------------------

  it('pops the value even if a child throws', async () => {
    const Ctx = createContext('safe');
    let received = '';

    const Boom = defineComponent(z.object({}), () => {
      throw new Error('intentional');
    });

    const After = defineComponent(z.object({}), () => {
      received = useContext(Ctx);
      return null;
    });

    // First render: Provider wraps a throwing child. The error surfaces here.
    try {
      await render(
        <Ctx.Provider value="danger">
          <Boom />
        </Ctx.Provider>,
      );
    } catch {
      // swallowed — we only care that the stack was cleaned up.
    }

    // Second render: no Provider in scope. Should see the default value, confirming
    // the Provider's finally-block correctly popped 'danger' off the stack.
    await render(<After />);

    expect(received).toBe('safe');
  });
});
