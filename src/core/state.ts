/**
 * A callable getter for reactive state. Calling it returns the current value.
 * The `$$typeof` marker allows future runtime checks and devtools integration.
 */
export interface Signal<T> {
  (): T;
  getValue(): T;
  readonly $$typeof: 'rame.signal';
}

/**
 * State setter returned by `useState`. Accepts either a new value or an
 * updater function that receives the previous value and returns the next value.
 */
export type SetState<T> = (value: T | ((prev: T) => T)) => void;

/**
 * Disposes an effect: unsubscribes it from all dep signals, runs any pending
 * cleanup, and prevents any further re-execution.
 */
export type DisposeEffect = () => void;

/** Internal record describing a single registered effect. */
interface EffectRecord {
  readonly fn: () => void | (() => void);
  cleanup: (() => void) | undefined;
  disposed: boolean;
}

/** Internal metadata stored per signal in the registry. */
interface SignalMeta<T> {
  value: T;
  effects: Set<EffectRecord>;
}

/**
 * Maps each Signal to its current value and the set of effects subscribed to it.
 */
const signalRegistry = new WeakMap<Signal<unknown>, SignalMeta<unknown>>();

/**
 * Tracks effects that are currently mid-execution, used to detect synchronous
 * circular effect chains and throw instead of infinite-looping.
 */
const runningEffects = new Set<EffectRecord>();

/**
 * This returns meta for the signal, each signal is same as single dependency from effect
 */
function getMeta<T = unknown>(signal: Signal<T>): SignalMeta<T> {
  const meta = signalRegistry.get(signal);
  if (!meta) throw new Error('[rame] Signal not found in registry. Was it created with useState?');
  return meta as SignalMeta<T>;
}

/**
 * Executes a single effect record: calls its cleanup (if any), then runs fn
 * and stores the new cleanup.
 */
function runEffect(record: EffectRecord): void {
  if (record.disposed) return;

  if (runningEffects.has(record)) {
    throw new Error(
      '[rame] Circular effect detected: an effect triggered itself synchronously. ' +
        'Break the cycle by guarding setState with a condition.',
    );
  }

  // Call cleanup from previous run.
  if (record.cleanup) {
    record.cleanup();
    record.cleanup = undefined;
  }

  runningEffects.add(record);
  try {
    const cleanupFunction = record.fn();
    if (typeof cleanupFunction === 'function') {
      record.cleanup = cleanupFunction;
    }
  } finally {
    runningEffects.delete(record);
  }
}

/**
 * Creates a read-only signal from a plain value.
 *
 * Unlike `useState`, there is no setter — the signal's value is fixed at
 * creation time. Useful for providing constant default context values without
 * reaching for the `useState` hack.
 *
 * @example
 * ```ts
 * const zero = createSignal(0);
 * zero(); // 0
 * ```
 */
export function createSignal<T>(value: T): Signal<T> {
  const meta: SignalMeta<T> = { value, effects: new Set() };

  const signal = function signal(): T {
    return meta.value;
  } as Signal<T>;

  signal.getValue = (): T => meta.value;

  Object.defineProperty(signal, '$$typeof', {
    value: 'rame.signal' as const,
    writable: false,
    enumerable: false,
    configurable: false,
  });

  signalRegistry.set(signal, meta);

  return signal;
}

/**
 * Creates an in-memory reactive state value.
 */
export function useState<T>(): [Signal<T | undefined>, SetState<T | undefined>];
export function useState<T>(initialValue: T): [Signal<T>, SetState<T>];
export function useState<T>(initialValue?: T): [Signal<T | undefined>, SetState<T | undefined>] {
  const meta: SignalMeta<T | undefined> = {
    value: initialValue,
    effects: new Set(),
  };

  const signal = function signal(): T | undefined {
    return meta.value;
  } as Signal<T | undefined>;

  signal.getValue = (): T | undefined => meta.value;

  // Define $$typeof as a non-writable, non-enumerable property so it doesn't
  // show up in serialization but is readable for devtools.
  Object.defineProperty(signal, '$$typeof', {
    value: 'rame.signal' as const,
    writable: false,
    enumerable: false,
    configurable: false,
  });

  signalRegistry.set(signal, meta);

  const setState: SetState<T | undefined> = (valueOrUpdater) => {
    const next =
      typeof valueOrUpdater === 'function'
        ? (valueOrUpdater as (prev: T | undefined) => T | undefined)(meta.value)
        : valueOrUpdater;

    // No-op if value hasn't changed.
    if (Object.is(meta.value, next)) return;

    meta.value = next;

    // Snapshot the set before iterating — an effect could subscribe new
    // effects to this signal during its run.
    for (const record of [...meta.effects]) {
      runEffect(record);
    }
  };

  return [signal, setState];
}

/**
 * Registers a side-effect that runs immediately and re-runs whenever any
 * signal in `deps` changes.
 *
 * - **Empty deps `[]`**: runs exactly once, never re-runs.
 * - **Cleanup**: if `fn` returns a function, it is called before the effect
 *   re-runs and when `dispose()` is called.
 */
export function useEffect(fn: () => void | (() => void), deps: Signal<unknown>[]): DisposeEffect {
  const record: EffectRecord = {
    fn,
    cleanup: undefined,
    disposed: false,
  };

  // Subscribe to every dep signal.
  for (const dep of deps) {
    getMeta(dep).effects.add(record);
  }

  // Run immediately (first execution).
  runEffect(record);

  const dispose: DisposeEffect = () => {
    if (record.disposed) return;
    record.disposed = true;

    // Unsubscribe from all dep signals.
    for (const dep of deps) {
      getMeta(dep).effects.delete(record);
    }

    // Run cleanup one final time.
    if (record.cleanup) {
      record.cleanup();
      record.cleanup = undefined;
    }
  };

  return dispose;
}
