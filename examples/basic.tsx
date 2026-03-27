/**
 * @ramejs/rame — RawLog Examples
 *
 * RawLog is a built-in Rame component that prints a formatted, colorized log
 * line to the console. It accepts two props:
 *
 *   content  (string)                       — the message to print
 *   type     ("info"|"warn"|"error"|"debug") — controls the label and color
 *                                              defaults to "info" when omitted
 *
 */

import { render, Fragment } from '../src';
import { RawLog } from '../src/components/RawLog';

await render(
  <Fragment>
    {/* Basic usage — type defaults to "info" when omitted */}
    <RawLog content="Application started" />

    {/* All four log levels */}
    <RawLog type="info" content="Listening on http://localhost:3000" />
    <RawLog type="debug" content="Cache size: 128 MB" />
    <RawLog type="warn" content="Deprecated config key 'timeout' detected" />
    <RawLog type="error" content="Failed to connect to database" />
  </Fragment>,
);
