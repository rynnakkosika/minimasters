// Minimal test runner shared by the browser (tests/index.html) and Node (tests/run-node.mjs).

const tests = [];
const reports = [];

export function test(name, fn) {
  tests.push({ name, fn });
}

export function report(text) {
  reports.push(text);
}

function fmt(v) {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export function assert(cond, message = 'assertion failed') {
  if (!cond) throw new Error(message);
}

export function assertEqual(actual, expected, message = '') {
  if (fmt(actual) !== fmt(expected)) {
    throw new Error(`${message ? message + ': ' : ''}expected ${fmt(expected)}, got ${fmt(actual)}`);
  }
}

export function assertThrows(fn, message = 'expected to throw') {
  let threw = false;
  try {
    fn();
  } catch {
    threw = true;
  }
  if (!threw) throw new Error(message);
}

export async function run(log = console.log) {
  let pass = 0;
  let fail = 0;
  for (const t of tests) {
    try {
      await t.fn();
      pass++;
      log({ ok: true, name: t.name });
    } catch (e) {
      fail++;
      log({ ok: false, name: t.name, error: e && e.stack ? e.stack : String(e) });
    }
  }
  return { pass, fail, reports: reports.slice() };
}
