/**
 * OpenClaw adapter smoke test
 * Run: node test.js
 * Requires: SAVEME_AGENT_API_KEY env var
 */

import { saveMeMemory } from './index.js';

if (!process.env.SAVEME_AGENT_API_KEY) {
  console.error('SAVEME_AGENT_API_KEY is not set. Export it and retry.');
  process.exit(1);
}

console.log('Running OpenClaw adapter smoke test...\n');

try {
  // 0. Verify key/capabilities
  const status = await saveMeMemory.status();
  console.log('✅ status():', status.auth_type, status.capabilities);

  // 1. Write a memory
  const seed = Date.now();
  const created = await saveMeMemory.remember({
    title: `OpenClaw adapter test ${seed}`,
    content: `This memory was written by the OpenClaw adapter smoke test at ${new Date(seed).toISOString()}.`,
    summary: 'OpenClaw adapter smoke test memory',
    tags: ['smoke-test', 'openclaw', 'nia'],
    project: 'save-me',
    type: 'fact',
    confidence: 0.99,
    metadata: { seed },
  });
  console.log('✅ remember():', created.memory?.id);

  // 2. Fetch it back
  const fetched = await saveMeMemory.get(created.memory.id);
  console.log('✅ get():', fetched.title);

  // 3. Search for it
  const results = await saveMeMemory.search(`OpenClaw adapter test ${seed}`, { project: 'save-me' });
  console.log('✅ search():', results.length, 'result(s)');

  // 4. List recent
  const recent = await saveMeMemory.list({ project: 'save-me', limit: 5 });
  console.log('✅ list():', recent.length, 'result(s)');

  // 5. Context lookup
  const context = await saveMeMemory.contextFor('openclaw adapter test');
  console.log('✅ contextFor():\n', context);

  // 6. Update
  const updated = await saveMeMemory.update(created.memory.id, {
    summary: 'Updated by smoke test',
    tags: ['smoke-test', 'openclaw', 'nia', 'updated'],
  });
  console.log('✅ update():', updated.summary || '(ok)');

  // 7. Batch write
  const batch = await saveMeMemory.batchRemember([
    {
      title: 'Batch test memory A',
      content: 'First batch item from OpenClaw adapter test.',
      type: 'fact',
      project: 'save-me',
    },
    {
      title: 'Batch test memory B',
      content: 'Second batch item from OpenClaw adapter test.',
      type: 'fact',
      project: 'save-me',
    },
  ]);
  console.log('✅ batchRemember():', batch.length, 'created');

  console.log('\n✅ All tests passed.');
} catch (err) {
  console.error('\n❌ Test failed:', err.message);
  process.exit(1);
}
