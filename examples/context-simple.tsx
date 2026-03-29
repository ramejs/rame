import { render, createContext, useContext, Fragment, RamePropsWithChildren } from '../src';

// Create a context for the current environment
const EnvContext = createContext<'dev' | 'prod'>('dev');

// A component that logs the current environment
const LogEnv = ({ label }: { label: string }) => {
  const env = useContext(EnvContext);
  console.log(`${label}: ${env}`);
  return null;
};

// A component that provides a different environment to its children
const EnvProvider = ({ value, children }: RamePropsWithChildren<{ value: 'dev' | 'prod' }>) => {
  return <EnvContext.Provider value={value}>{children}</EnvContext.Provider>;
};

// Example: log environment before, inside, and after a provider
await render(
  <Fragment>
    <LogEnv label="Default env" />
    <EnvProvider value="prod">
      <LogEnv label="Inside provider" />
    </EnvProvider>
    <LogEnv label="After provider" />
  </Fragment>,
);

// Output:
// Default env: dev
// Inside provider: prod
// After provider: dev
