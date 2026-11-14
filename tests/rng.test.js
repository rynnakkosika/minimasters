import { test, assert, assertEqual } from './runner.js';
import { createRng, withRng } from '../src/engine/rng.js';

test('rng: same seed gives the same sequence', () => {
  const a = createRng(42);
  const b = createRng(42);
  for (let i = 0; i < 100; i++) assertEqual(a.next(), b.next());
});

test('rng: different seeds differ', () => {
  assert(createRng(1).next() !== createRng(2).next());
});

test('rng: values stay in [0, 1) and int() in range', () => {
  const r = createRng(7);
  for (let i = 0; i < 1000; i++) {
    const v = r.next();
    assert(v >= 0 && v < 1);
    const n = r.int(3, 5);
    assert(n >= 3 && n <= 5);
  }
});

test('rng: shuffle is deterministic and keeps all items', () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8];
  const a = createRng(9).shuffle(items);
  const b = createRng(9).shuffle(items);
  assertEqual(a, b);
  assertEqual(a.slice().sort(), items);
});

test('rng: state can be saved and restored mid-sequence', () => {
  const r = createRng(123);
  r.next();
  r.next();
  const saved = r.getState();
  const expected = [r.next(), r.next()];
  const restored = createRng(saved);
  assertEqual([restored.next(), restored.next()], expected);
});

test('rng: withRng advances the stored state', () => {
  const obj = { rng: 5 };
  const first = withRng(obj, (r) => r.next());
  const second = withRng(obj, (r) => r.next());
  assert(first !== second);
  const ref = createRng(5);
  assertEqual([first, second], [ref.next(), ref.next()]);
});
