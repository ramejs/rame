import { describe, it, expect, spyOn } from 'bun:test';
import { render, Fragment } from '@ramejs/index';
import { RawLog } from '@ramejs/components/RawLog';

describe('RawLog', () => {
  it('prints the content', async () => {
    let lastLog = '';
    spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      lastLog = args.join(' ');
    });

    await render(<RawLog content="Application started" />);
    expect(lastLog).toContain('Application started');
  });

  it('defaults type to info', async () => {
    let lastLog = '';
    spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      lastLog = args.join(' ');
    });

    await render(<RawLog content="hello" />);
    expect(lastLog).toContain('[INFO]');
  });

  it('prints info level', async () => {
    let lastLog = '';
    spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      lastLog = args.join(' ');
    });

    await render(<RawLog type="info" content="Listening on http://localhost:3000" />);
    expect(lastLog).toContain('[INFO]');
    expect(lastLog).toContain('Listening on http://localhost:3000');
  });

  it('prints debug level', async () => {
    let lastLog = '';
    spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      lastLog = args.join(' ');
    });

    await render(<RawLog type="debug" content="Cache size: 128 MB" />);
    expect(lastLog).toContain('[DEBUG]');
    expect(lastLog).toContain('Cache size: 128 MB');
  });

  it('prints warn level', async () => {
    let lastLog = '';
    spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      lastLog = args.join(' ');
    });

    await render(<RawLog type="warn" content="Deprecated config key detected" />);
    expect(lastLog).toContain('[WARN]');
    expect(lastLog).toContain('Deprecated config key detected');
  });

  it('prints error level', async () => {
    let lastLog = '';
    spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      lastLog = args.join(' ');
    });

    await render(<RawLog type="error" content="Failed to connect to database" />);
    expect(lastLog).toContain('[ERROR]');
    expect(lastLog).toContain('Failed to connect to database');
  });

  it('includes a timestamp in the output', async () => {
    let lastLog = '';
    spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      lastLog = args.join(' ');
    });

    await render(<RawLog content="timestamp check" />);
    expect(lastLog).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('renders multiple logs in order via Fragment', async () => {
    const lines: string[] = [];
    spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      lines.push(args.join(' '));
    });

    await render(
      <Fragment>
        <RawLog type="info" content="first" />
        <RawLog type="warn" content="second" />
        <RawLog type="error" content="third" />
      </Fragment>,
    );

    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain('[INFO]');
    expect(lines[1]).toContain('[WARN]');
    expect(lines[2]).toContain('[ERROR]');
  });
});
