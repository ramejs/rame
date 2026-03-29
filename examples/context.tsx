import { render, createContext, useContext, defineComponent, Fragment } from '../src';
import { z } from 'zod';

// Context for environment
const EnvContext = createContext<'dev' | 'prod'>('dev');

const LogEnv = defineComponent(z.object({ label: z.string() }), ({ label }) => {
  const env = useContext(EnvContext);
  console.log(`${label}: ${env}`);
  return null;
});

await render(
  <Fragment>
    <LogEnv label="Default env" />
    <EnvContext.Provider value="prod">
      <LogEnv label="Inside provider" />
    </EnvContext.Provider>
    <LogEnv label="After provider" />
  </Fragment>,
);

// Output:
// Default env: dev
// Inside provider: prod
// After provider: dev
