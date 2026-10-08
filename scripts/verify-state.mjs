import fs from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
const code = ts.transpileModule(fs.readFileSync('lib/state.ts', 'utf8'), {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { initial, validateState, restoreState, mergeChanges } = await import(
  'data:text/javascript;base64,' + Buffer.from(code).toString('base64')
);
assert(validateState(initial));
assert(!validateState({ ...initial, notes: [] }));
assert(!validateState({ ...initial, saved: 'bad' }));
assert(!validateState({ ...initial, feedback: { x: 2 } }));
assert.deepEqual(restoreState({ saved: [], following: [] }).posts, []);
assert.throws(() => restoreState({ saved: [false] }));
const local = {
  ...initial,
  saved: [...initial.saved, 'new-local'],
  notes: { ...initial.notes, local: 'local note' },
  comments: { p: ['my comment'] },
  replies: { t: ['my reply'] },
};
const remote = {
  ...initial,
  saved: [...initial.saved, 'new-remote'],
  notes: { ...initial.notes, remote: 'remote note' },
  comments: { p: ['their comment'] },
  replies: { t: ['their reply'] },
};
const merged = mergeChanges(initial, local, remote);
assert(
  merged.saved.includes('new-local') && merged.saved.includes('new-remote'),
);
assert(merged.notes.local && merged.notes.remote);
assert.deepEqual(merged.comments.p, ['their comment', 'my comment']);
assert.deepEqual(merged.replies.t, ['their reply', 'my reply']);
const deleted = mergeChanges(
  initial,
  { ...initial, saved: initial.saved.slice(1) },
  remote,
);
assert(!deleted.saved.includes(initial.saved[0]));
assert(deleted.saved.includes('new-remote'));
console.log(
  'Verified state validation, v2 migration and concurrent arrays/notes/comments/replies.',
);
if (process.argv.includes('--api')) {
  const origin = 'http://localhost:5173';
  const read = await fetch(origin + '/api/state');
  assert.equal(read.status, 200);
  const cookie = read.headers.get('set-cookie')?.split(';')[0];
  assert(cookie);
  const empty = await read.json();
  assert.equal(empty.state, null);
  assert.equal(empty.revision, 0);
  const put = await fetch(origin + '/api/state', {
    method: 'PUT',
    headers: { cookie, origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ state: local, revision: 0 }),
  });
  assert.equal(put.status, 200);
  assert.equal((await put.json()).revision, 1);
  const get = await fetch(origin + '/api/state', { headers: { cookie } });
  const saved = await get.json();
  assert.deepEqual(saved.state, local);
  const other = await fetch(origin + '/api/state');
  assert.equal((await other.json()).state, null, 'Visitors must be isolated');
  const conflict = await fetch(origin + '/api/state', {
    method: 'PUT',
    headers: { cookie, origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ state: initial, revision: 0 }),
  });
  assert.equal(conflict.status, 409);
  assert.deepEqual((await conflict.json()).state, local);
  const forbidden = await fetch(origin + '/api/state', {
    method: 'PUT',
    headers: { cookie, origin: 'https://unrelated.example' },
    body: '{}',
  });
  assert.equal(forbidden.status, 403);
  const invalid = await fetch(origin + '/api/state', {
    method: 'PUT',
    headers: { cookie, origin },
    body: JSON.stringify({ state: {}, revision: 1 }),
  });
  assert.equal(invalid.status, 422);
  for (const body of ['null', '{broken']) {
    const malformed = await fetch(origin + '/api/state', { method: 'PUT', headers: {cookie,origin}, body });
    assert.equal(malformed.status, body === 'null' ? 422 : 400);
  }
  const form = new FormData();
  form.set('name', 'research-test.md');
  form.set('content', '# Export\n\nActual notes and discussion.');
  const exported = await fetch(origin + '/api/export', {
    method: 'POST',
    headers: { origin },
    body: form,
  });
  assert.equal(exported.status, 200);
  assert(exported.headers.get('content-disposition').startsWith('attachment;'));
  assert.equal(await exported.text(), form.get('content'));
  console.log(
    'Verified real D1 reads/writes, visitor isolation, revision conflict, origin/schema rejection and HTTP attachment content.',
  );
}
