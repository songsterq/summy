const { test } = require("node:test");
const assert = require('node:assert');
const { debounce, cleanText } = require('../utils.js');

test('cleanText adds spaces and trims', () => {
  assert.strictEqual(cleanText('Hello.World'), 'Hello. World');
  assert.strictEqual(cleanText(' Hi!Hello '), 'Hi! Hello');
});

test('debounce calls function once', async () => {
  let count = 0;
  const inc = () => { count++; };
  const debounced = debounce(inc, 50);
  debounced();
  debounced();
  debounced();
  await new Promise(r => setTimeout(r, 80));
  assert.strictEqual(count, 1);
});
