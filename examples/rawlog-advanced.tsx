import { render, Fragment, RawLog } from '../src';

const failed = ['users', 'orders', 'payments'];

const StartupLog = ({ port }: { port: number }) => (
  <Fragment>
    <RawLog type="info" content={`Listening on :${port}`} />
    <RawLog type="debug" content={`PID: ${process.pid}`} />
    <RawLog type="debug" content={`Node: ${process.version}`} />
  </Fragment>
);

const EnvCheck = ({ envKey }: { envKey: string }) => {
  const value = process.env[envKey];
  return value ? (
    <RawLog type="info" content={`${envKey}=${value}`} />
  ) : (
    <RawLog type="warn" content={`${envKey} is not set`} />
  );
};

await render(
  <Fragment>
    {failed.map((service) => (
      <RawLog type="error" content={`${service} service unreachable`} />
    ))}
  </Fragment>,
);

await render(<StartupLog port={3000} />);

await render(
  <Fragment>
    {['NODE_ENV', 'DATABASE_URL', 'PORT'].map((envKey) => (
      <EnvCheck envKey={envKey} />
    ))}
  </Fragment>,
);
