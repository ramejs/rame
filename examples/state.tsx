/**
 * @ramejs/rame — useState + useEffect Example
 *
 * Demonstrates an event-buffering pipeline using reactive state inside
 * Rame components — structured similarly to how you'd write React components.
 *
 * Scenario: an audit logger that collects individual events and flushes them
 * as a batch once the buffer reaches a threshold.
 */

import { render, useState, useEffect, Fragment } from '../src';

interface AuditEvent {
  type: string;
  userId: number;
}

const BATCH_SIZE = 3;

function flushBatch(events: AuditEvent[]): void {
  console.log(`[audit] flushing ${events.length} events:`);
  for (const event of events) {
    console.log(`  - user=${event.userId} action=${event.type}`);
  }
}

interface AuditLoggerProps {
  events: AuditEvent[];
}

const AuditLogger = ({ events }: AuditLoggerProps) => {
  const [buffer, setBuffer] = useState<AuditEvent[]>([]);

  // Observe the buffer — log its size whenever it changes.
  //
  // useEffect returns two things:
  //   - cleanup (returned from fn): runs before each RE-RUN to undo what the
  //     last run set up (e.g. remove listeners, cancel timers).
  //   - dispose (returned by useEffect itself): stops the effect from running
  //     EVER AGAIN — call this when you're done with the effect entirely.
  const dispose = useEffect(() => {
    console.log(`[audit] buffer size: ${buffer().length}`);

    // Cleanup: log that we're tearing down the previous observation before
    // the next run begins.
    return () => {
      console.log(`[audit] cleanup — was observing size ${buffer().length}`);
    };
  }, [buffer]);

  // Push all incoming events through the reactive buffer
  for (const event of events) {
    setBuffer((prev) => {
      const next = [...(prev ?? []), event];
      if (next.length >= BATCH_SIZE) {
        flushBatch(next);
        return [];
      }
      return next;
    });
  }

  // Drain any partial batch that didn't reach the threshold
  if (buffer().length > 0) {
    flushBatch(buffer());
  }

  dispose();
  return null;
};

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

await render(
  <Fragment>
    <AuditLogger
      events={[
        { userId: 1, type: 'login' },
        { userId: 2, type: 'login' },
        { userId: 1, type: 'view_report' }, // → flush batch 1
        { userId: 3, type: 'login' },
        { userId: 2, type: 'export_csv' },
        { userId: 1, type: 'logout' }, // → flush batch 2
      ]}
    />
  </Fragment>,
);

// Expected output:
//
// [audit] buffer size: 0
// [audit] cleanup — was observing size 1      ← cleanup before re-run
// [audit] buffer size: 1
// [audit] cleanup — was observing size 2      ← cleanup before re-run
// [audit] buffer size: 2
// [audit] flushing 3 events:
//   - user=1 action=login
//   - user=2 action=login
//   - user=1 action=view_report
// [audit] cleanup — was observing size 0      ← cleanup before re-run
// [audit] buffer size: 0
// [audit] cleanup — was observing size 1      ← cleanup before re-run
// [audit] buffer size: 1
// [audit] cleanup — was observing size 2      ← cleanup before re-run
// [audit] buffer size: 2
// [audit] flushing 3 events:
//   - user=3 action=login
//   - user=2 action=export_csv
//   - user=1 action=logout
// [audit] cleanup — was observing size 0      ← cleanup before re-run
// [audit] buffer size: 0
// [audit] cleanup — was observing size 0      ← final cleanup on dispose()
