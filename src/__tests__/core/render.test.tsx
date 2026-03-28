import { describe, it, expect } from 'bun:test';
import { render, defineComponent, Fragment } from '../../index';
import { z } from 'zod';

describe('render', () => {
  it('calls a component when rendered', async () => {
    let called = false;

    const Marker = defineComponent(z.object({}), () => {
      called = true;
      return null;
    });

    await render(<Marker />);

    expect(called).toBe(true);
  });

  it('passes props to the component', async () => {
    let received = '';

    const Greet = defineComponent(z.object({ name: z.string() }), (props) => {
      received = props.name;
      return null;
    });

    await render(<Greet name="world" />);

    expect(received).toBe('world');
  });

  it('renders all children inside a Fragment', async () => {
    const rendered: string[] = [];

    const A = defineComponent(z.object({}), () => {
      rendered.push('A');
      return null;
    });
    const B = defineComponent(z.object({}), () => {
      rendered.push('B');
      return null;
    });
    const C = defineComponent(z.object({}), () => {
      rendered.push('C');
      return null;
    });

    await render(
      <Fragment>
        <A />
        <B />
        <C />
      </Fragment>,
    );

    expect(rendered).toEqual(['A', 'B', 'C']);
  });

  it('renders children in top-to-bottom order', async () => {
    const order: number[] = [];

    const Step = defineComponent(z.object({ n: z.number() }), (props) => {
      order.push(props.n);
      return null;
    });

    await render(
      <Fragment>
        <Step n={1} />
        <Step n={2} />
        <Step n={3} />
      </Fragment>,
    );

    expect(order).toEqual([1, 2, 3]);
  });

  it('awaits an async component before rendering the next sibling', async () => {
    const order: string[] = [];

    const Slow = defineComponent(z.object({}), async () => {
      await new Promise((r) => setTimeout(r, 20));
      order.push('slow');
      return null;
    });

    const Fast = defineComponent(z.object({}), () => {
      order.push('fast');
      return null;
    });

    await render(
      <Fragment>
        <Slow />
        <Fast />
      </Fragment>,
    );

    expect(order).toEqual(['slow', 'fast']);
  });

  it('renders nested Fragments', async () => {
    const rendered: string[] = [];

    const X = defineComponent(z.object({}), () => {
      rendered.push('X');
      return null;
    });
    const Y = defineComponent(z.object({}), () => {
      rendered.push('Y');
      return null;
    });
    const Z = defineComponent(z.object({}), () => {
      rendered.push('Z');
      return null;
    });

    await render(
      <Fragment>
        <X />
        <Fragment>
          <Y />
          <Z />
        </Fragment>
      </Fragment>,
    );

    expect(rendered).toEqual(['X', 'Y', 'Z']);
  });

  it('renders a component that returns another component', async () => {
    const rendered: string[] = [];

    const Inner = defineComponent(z.object({}), () => {
      rendered.push('inner');
      return null;
    });

    const Outer = defineComponent(z.object({}), () => {
      rendered.push('outer');
      return <Inner />;
    });

    await render(<Outer />);

    expect(rendered).toEqual(['outer', 'inner']);
  });
});
