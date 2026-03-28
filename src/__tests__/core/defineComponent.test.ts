import { describe, it, expect } from 'bun:test';
import { z } from 'zod';
import { defineComponent } from '../../core/component';

describe('defineComponent', () => {
  it('attaches the schema to the component', () => {
    const schema = z.object({ name: z.string() });
    const comp = defineComponent(schema, ({ name }) => name);
    expect(comp.schema).toBe(schema);
  });

  it('sets displayName when provided', () => {
    const schema = z.object({});
    const comp = defineComponent(schema, () => null, 'MyComp');
    expect(comp.displayName).toBe('MyComp');
  });

  it('leaves displayName undefined when not provided', () => {
    const schema = z.object({});
    const comp = defineComponent(schema, () => null);
    expect(comp.displayName).toBeUndefined();
  });

  it('returns a callable component function', () => {
    const schema = z.object({ value: z.number() });
    const comp = defineComponent(schema, ({ value }) => value * 2);
    expect(comp({ value: 5 })).toBe(10);
  });
});
