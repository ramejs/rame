import { render, createContext, useContext, Fragment } from '../src';

// Context for the current user
const UserContext = createContext<{ id: number; name: string } | null>(null);
// Context for the current request id
const RequestIdContext = createContext<string>('none');

const LogUser = () => {
  const user = useContext(UserContext);
  console.log('User:', user ? `${user.id} (${user.name})` : 'none');
  return null;
};

const LogRequestId = () => {
  const reqId = useContext(RequestIdContext);
  console.log('RequestId:', reqId);
  return null;
};

await render(
  <Fragment>
    <LogUser />
    <LogRequestId />
    <UserContext.Provider value={{ id: 1, name: 'Alice' }}>
      <RequestIdContext.Provider value="req-123">
        <LogUser />
        <LogRequestId />
      </RequestIdContext.Provider>
    </UserContext.Provider>
    <LogUser />
    <LogRequestId />
  </Fragment>,
);

// Output:
// User: none
// RequestId: none
// User: 1 (Alice)
// RequestId: req-123
// User: none
// RequestId: none
