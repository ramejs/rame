import { render, renderToValue, Fragment, RawLog } from '../src';

const Add = ({ a, b }: { a: number; b: number }) => a + b;

const Slow = async () => {
  await Promise.resolve();
  console.log('Slow done');
  return 'slow';
};

const Fast = () => {
  console.log('Fast done');
  return 'fast';
};

const AppBanner = ({ port }: { port: number }) => (
  <Fragment>
    <RawLog type="info" content={`Listening on :${port}`} />
    <RawLog type="debug" content={`PID: ${process.pid}`} />
  </Fragment>
);

const result = await renderToValue(<Add a={3} b={4} />);
console.log('Add result:', result);

await render(
  <Fragment>
    <Slow />
    <Fast />
  </Fragment>,
);

await render(<AppBanner port={3000} />);

// Output order:
// Add result: 7
// Slow done
// Fast done
// [INFO]  ... Listening on :3000
// [DEBUG] ... PID: <pid>
