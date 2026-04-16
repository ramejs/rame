import { describe, it, expect } from 'bun:test';
import { render, Fragment } from '../../index';
import { useState, useEffect } from '../../core/state';
import type { Signal, SetState, DisposeEffect } from '../../core/state';

describe('useState', () => {
  it('returns undefined as the initial value when none is provided', () => {
    const [val] = useState();
    expect(val()).toBeUndefined();
  });

  it('returns the provided initial value', () => {
    const [count] = useState(0);
    expect(count()).toBe(0);
  });

  it('updates the value via setState with a direct value', () => {
    const [count, setCount] = useState(0);
    setCount(5);
    expect(count()).toBe(5);
  });

  it('updates the value via setState with a function updater', () => {
    const [count, setCount] = useState(10);
    setCount((prev) => prev + 1);
    expect(count()).toBe(11);
  });

  it('is a no-op when setState is called with the same value (Object.is)', () => {
    const [count, setCount] = useState(3);
    const log: number[] = [];

    useEffect(() => {
      log.push(count());
    }, [count]);

    setCount(3); // same value — should not trigger effect
    expect(log).toEqual([3]); // only the initial run
  });

  it('works correctly with object initial values', () => {
    const initial = { name: 'Alice' };
    const [user, setUser] = useState(initial);
    expect(user()).toBe(initial);

    const next = { name: 'Bob' };
    setUser(next);
    expect(user()).toBe(next);
  });

  it('signal has $$typeof marker', () => {
    const [sig] = useState(0);
    expect((sig as { $$typeof: string }).$$typeof).toBe('rame.signal');
  });

  it('getValue() returns the same value as calling the signal directly', () => {
    const [count, setCount] = useState(0);
    expect(count.getValue()).toBe(0);
    setCount(7);
    expect(count.getValue()).toBe(7);
    expect(count.getValue()).toBe(count());
  });
});

describe('useEffect', () => {
  it('runs immediately on registration', () => {
    const [count] = useState(0);
    const log: number[] = [];

    useEffect(() => {
      log.push(count());
    }, [count]);

    expect(log).toEqual([0]);
  });

  it('re-runs when a dep signal changes', () => {
    const [count, setCount] = useState(0);
    const log: number[] = [];

    useEffect(() => {
      log.push(count());
    }, [count]);

    setCount(1);
    setCount(2);

    expect(log).toEqual([0, 1, 2]);
  });

  it('does NOT re-run when a dep signal value is unchanged', () => {
    const [count, setCount] = useState(0);
    const log: number[] = [];

    useEffect(() => {
      log.push(count());
    }, [count]);

    setCount(0); // Object.is — no change
    expect(log).toEqual([0]);
  });

  it('calls cleanup before re-running the effect', () => {
    const [count, setCount] = useState(0);
    const events: string[] = [];

    useEffect(() => {
      events.push(`run:${count()}`);
      return () => events.push(`cleanup:${count()}`);
    }, [count]);

    setCount(1);
    setCount(2);

    expect(events).toEqual(['run:0', 'cleanup:1', 'run:1', 'cleanup:2', 'run:2']);
  });

  it('with empty deps [] runs exactly once and never re-runs', () => {
    const [, setCount] = useState(0);
    const log: string[] = [];

    // Effect with empty deps — subscribes to nothing
    const [flag] = useState(false);
    useEffect(() => {
      log.push('ran');
    }, []);

    // Changing unrelated state doesn't trigger
    setCount(1);
    setCount(2);

    void flag; // suppress unused var
    expect(log).toEqual(['ran']);
  });

  it('runs effect for each dep that changes independently', () => {
    const [a, setA] = useState(0);
    const [b, setB] = useState(0);
    const log: string[] = [];

    useEffect(() => {
      log.push(`a=${a()},b=${b()}`);
    }, [a, b]);

    setA(1);
    setB(1);

    expect(log).toEqual(['a=0,b=0', 'a=1,b=0', 'a=1,b=1']);
  });

  it('two independent effects on the same signal both run', () => {
    const [count, setCount] = useState(0);
    const log1: number[] = [];
    const log2: number[] = [];

    useEffect(() => {
      log1.push(count());
    }, [count]);
    useEffect(() => {
      log2.push(count());
    }, [count]);

    setCount(5);

    expect(log1).toEqual([0, 5]);
    expect(log2).toEqual([0, 5]);
  });
});

describe('dispose', () => {
  it('unsubscribes the effect — no further re-runs after disposal', () => {
    const [count, setCount] = useState(0);
    const log: number[] = [];

    const dispose = useEffect(() => {
      log.push(count());
    }, [count]);

    setCount(1);
    dispose();
    setCount(2); // should not trigger
    setCount(3); // should not trigger

    expect(log).toEqual([0, 1]);
  });

  it('calls cleanup on dispose', () => {
    const [count] = useState(0);
    const events: string[] = [];

    const dispose = useEffect(() => {
      events.push('run');
      return () => events.push('cleanup');
    }, [count]);

    dispose();

    expect(events).toEqual(['run', 'cleanup']);
  });

  it('is idempotent — calling dispose twice does not double-cleanup', () => {
    const [count] = useState(0);
    const events: string[] = [];

    const dispose = useEffect(() => {
      events.push('run');
      return () => events.push('cleanup');
    }, [count]);

    dispose();
    dispose(); // second call should be a no-op

    expect(events).toEqual(['run', 'cleanup']);
  });

  it('disposes independently of other effects on the same signal', () => {
    const [count, setCount] = useState(0);
    const log1: number[] = [];
    const log2: number[] = [];

    const dispose1 = useEffect(() => {
      log1.push(count());
    }, [count]);
    useEffect(() => {
      log2.push(count());
    }, [count]);

    dispose1();
    setCount(1);

    expect(log1).toEqual([0]); // stopped after dispose
    expect(log2).toEqual([0, 1]); // still running
  });
});

describe('circular effect guard', () => {
  it('throws when an effect synchronously triggers itself via setState', () => {
    const [count, setCount] = useState(0);

    expect(() => {
      useEffect(() => {
        if (count() < 10) setCount((c) => c + 1); // re-triggers same effect
      }, [count]);
    }).toThrow('[rame] Circular effect detected');
  });
});

describe('useState + useEffect inside render', () => {
  it('state initialized inside a component is readable during render', async () => {
    let captured: number | undefined;

    const Comp = () => {
      const [count] = useState(42);
      captured = count();
      return null;
    };

    await render(<Comp />);

    expect(captured).toBe(42);
  });

  it('setState inside a component updates state before render returns', async () => {
    let captured: number | undefined;

    const Comp = () => {
      const [count, setCount] = useState(0);
      setCount(7);
      captured = count();
      return null;
    };

    await render(<Comp />);

    expect(captured).toBe(7);
  });

  it('useEffect fires during component render and collects side effects', async () => {
    const log: number[] = [];

    const Comp = () => {
      const [count, setCount] = useState(0);

      const dispose = useEffect(() => {
        log.push(count());
      }, [count]);

      setCount(1);
      setCount(2);
      dispose();
      return null;
    };

    await render(<Comp />);

    expect(log).toEqual([0, 1, 2]);
  });

  it('each render call gets its own isolated state', async () => {
    const results: number[] = [];

    const Comp = ({ value }: { value: number }) => {
      const [count, setCount] = useState(value);
      setCount((p) => (p ?? 0) + 10);
      results.push(count());
      return null;
    };

    await render(
      <Fragment>
        <Comp value={1} />
        <Comp value={2} />
        <Comp value={3} />
      </Fragment>,
    );

    expect(results).toEqual([11, 12, 13]);
  });

  it('cleanup runs when dispose is called inside a component', async () => {
    const events: string[] = [];

    const Comp = () => {
      const [count, setCount] = useState(0);

      const dispose = useEffect(() => {
        events.push(`run:${count()}`);
        return () => events.push(`cleanup:${count()}`);
      }, [count]);

      setCount(1);
      dispose(); // final cleanup
      return null;
    };

    await render(<Comp />);

    expect(events).toEqual(['run:0', 'cleanup:1', 'run:1', 'cleanup:1']);
  });

  it('sibling components have independent state', async () => {
    const log: string[] = [];

    const Counter = ({ id }: { id: string }) => {
      const [count, setCount] = useState(0);
      setCount((p) => (p ?? 0) + 1);
      log.push(`${id}:${count()}`);
      return null;
    };

    await render(
      <Fragment>
        <Counter id="a" />
        <Counter id="b" />
      </Fragment>,
    );

    expect(log).toEqual(['a:1', 'b:1']);
  });

  it('setCount passed as prop — child updates parent signal, signal reflects new value after render', async () => {
    // AnotherComponent receives setCount and calls it during its own render.
    // Because signals are shared by reference (not snapshots), count() on the
    // parent's signal reflects the updated value once render completes.
    const AnotherComponent = ({ setCount }: { setCount: SetState<number> }) => {
      setCount(42);
      return null;
    };

    let countSignal: Signal<number> | undefined;

    const Parent = () => {
      const [count, setCount] = useState(0);
      countSignal = count;
      return <AnotherComponent setCount={setCount} />;
    };

    await render(<Parent />);

    expect(countSignal!()).toBe(42);
  });

  it('signal passed as prop — sibling reads updated value lazily at its own render time', async () => {
    // NOTE: evaluating count() in the parent's JSX (e.g. content={count().toString()})
    // captures the value at JSX construction time — before siblings run.
    // Pass the signal reference instead so each child reads it at its own render time.
    const log: string[] = [];

    const Updater = ({ setCount }: { setCount: SetState<number> }) => {
      setCount(99);
      return null;
    };

    // Receives the signal itself — reads count() lazily during its own render,
    // after Updater has already called setCount(99).
    const Logger = ({ count }: { count: Signal<number> }) => {
      log.push(count().toString());
      return null;
    };

    const Parent = () => {
      const [count, setCount] = useState(0);
      return (
        <Fragment>
          <Updater setCount={setCount} />
          <Logger count={count} />
        </Fragment>
      );
    };

    await render(<Parent />);

    expect(log).toEqual(['99']);
  });

  it('setCount passed as prop — child updates parent signal, effect in parent reacts', async () => {
    // AnotherComponent receives setCount and calls it during its own render.
    // The parent's useEffect is still subscribed at that point — dispose() must
    // NOT be called inside the parent body before returning the JSX, because the
    // renderer processes the returned element AFTER the component function returns.
    const effectLog: number[] = [];
    let capturedDispose: (() => void) | undefined;

    const AnotherComponent = ({ setCount }: { setCount: SetState<number> }) => {
      setCount(42);
      return null;
    };

    const Parent = () => {
      const [count, setCount] = useState(0);

      capturedDispose = useEffect(() => {
        effectLog.push(count());
      }, [count]);

      // Do NOT call dispose() here — the renderer hasn't processed
      // <AnotherComponent /> yet. Dispose after render() resolves instead.
      return <AnotherComponent setCount={setCount} />;
    };

    await render(<Parent />);
    capturedDispose!(); // clean up after render is fully done

    // effect fires on initial run (0) and again when child calls setCount(42)
    expect(effectLog).toEqual([0, 42]);
  });

  it('signal passed as prop — child subscribes its own effect to parent signal', async () => {
    // Child receives the signal reference and registers its own useEffect on it.
    // Parent updates the signal after mounting the child — child effect reacts.
    const effectLog: string[] = [];

    const Child = ({ count }: { count: Signal<number> }) => {
      const dispose = useEffect(() => {
        effectLog.push(`child sees: ${count()}`);
      }, [count]);

      // child disposes its own effect when done
      dispose();
      return null;
    };

    const Parent = () => {
      const [count, setCount] = useState(0);
      setCount(7); // update before Child renders
      return <Child count={count} />;
    };

    await render(<Parent />);

    // Child's effect runs once at registration (count is already 7 by then)
    // and no further re-runs because dispose() is called immediately after
    expect(effectLog).toEqual(['child sees: 7']);
  });
});

describe('useState — Publisher / Subscriber integration', () => {
  it('Subscriber logs every state increment driven by Publisher interval', async () => {
    const log: number[] = [];
    let disposePublisher: DisposeEffect | undefined;

    const Subscriber = ({ state }: { state: Signal<number> }) => {
      useEffect(() => {
        log.push(state());
      }, [state]);
      return null;
    };

    const Publisher = ({ setState }: { setState: SetState<number>; state: Signal<number> }) => {
      disposePublisher = useEffect(() => {
        const id = setInterval(() => {
          setState((prev) => prev + 1);
        }, 100);
        return () => clearInterval(id);
      }, []);
      return null;
    };

    const App = () => {
      const [state, setState] = useState(0);
      return (
        <Fragment>
          <Subscriber state={state} />
          <Publisher setState={setState} state={state} />
        </Fragment>
      );
    };

    await render(<App />);

    await new Promise<void>((resolve) => setTimeout(resolve, 350));

    disposePublisher!();

    // Subscriber fires once on mount (0) then on each interval tick (1, 2, 3)
    expect(log).toEqual([0, 1, 2, 3]);
  });
});
