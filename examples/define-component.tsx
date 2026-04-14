import { defineComponent, renderToValue } from '../src';
import { z } from 'zod';

const users = new Map<string, { id: string; name: string; role: 'admin' | 'user' }>([
  [
    '11111111-1111-1111-1111-111111111111',
    { id: '11111111-1111-1111-1111-111111111111', name: 'Ada', role: 'admin' },
  ],
]);

const GetUser = defineComponent(
  z.object({
    id: z.uuid(),
  }),
  ({ id }) => users.get(id) ?? { status: 404, body: { error: 'Not found' } },
  'GetUser',
);

const Paginate = defineComponent(
  z.object({
    page: z.number().int().positive(),
    limit: z.number().int().min(1).max(100),
  }),
  ({ page, limit }) => ({ page, limit, offset: (page - 1) * limit }),
  'Paginate',
);

console.log(await renderToValue(<GetUser id="11111111-1111-1111-1111-111111111111" />));
console.log(await renderToValue(<Paginate page={2} limit={10} />));
