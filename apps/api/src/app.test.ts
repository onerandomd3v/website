import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApp } from './app.js';

test('app can be constructed', () => {
  assert.ok(createApp());
});
