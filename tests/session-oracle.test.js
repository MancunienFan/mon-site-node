const { test } = require('node:test');
const assert = require('node:assert/strict');
const oracle = require('oracledb');
const created = [];
oracle.getConnection = async ({ user, password }) => {
  if (user === 'REFUS') throw Object.assign(new Error('refus'), { errorNum: 1017 });
  const c = { user, password, calls: [], closed: 0, active: 0, max: 0,
    async execute(sql, binds) {
      this.active++; this.max = Math.max(this.max, this.active);
      await new Promise(resolve => setTimeout(resolve, 5));
      this.active--; this.calls.push({ sql, binds });
      if (this.user === 'BOB' && /UPDATE/.test(sql)) throw Object.assign(new Error('refus'), { errorNum: 1031 });
      if (this.lost) throw Object.assign(new Error('perdue'), { code: 'NJS-003' });
      if (/FROM COU\.COUT_VALR_PROP/i.test(sql)) return { rows: [{ CODE_LIEU: '1', DESCRIPTION_LIEU: 'Lieu' }] };
      if (/cout_dcis/i.test(sql)) return { rows: [{ NO_RECU: 1, MT_DU: 10, CO_MODE_PAIE: 'C', CO_TYP_TRANS_PAIE: 'A' }] };
      return { rows: [{ NM_CLI: this.user, PN_CLI: 'Test' }] };
    }, async close() { this.closed++; } };
  created.push(c); return c;
};
const { app } = require('../server');
const connections = require('../oracle/sessionConnections');
test('sessions Oracle isolées, droits, concurrence et fermeture', async () => {
  const server = app.listen(0); await new Promise(r => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  async function login(user) {
    const r = await fetch(base + '/connect', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ user, password: 'MoT de Passe' }) });
    assert.equal(r.status, 200); return { cookie: r.headers.get('set-cookie').split(';')[0] };
  }
  try {
    const a = await login('  aLiCe '), b = await login('bob');
    assert.equal(created[0].user, 'ALICE'); assert.equal(created[0].password, 'MoT de Passe'); assert.equal(created[1].user, 'BOB');
    const p = '?date_recu=2026-01-01&endroit=1&bordereau=1';
    assert.equal((await fetch(base + '/clients/1', { headers: a })).status, 200);
    assert.equal((await fetch(base + '/api/sommaire-depot/pdf' + p, { headers: b })).status, 200);
    const options = h => ({ method: 'POST', headers: { ...h, 'content-type': 'application/json' }, body: JSON.stringify({ id: 1, image: 'data:image/jpeg;base64,YQ==' }) });
    assert.equal((await fetch(base + '/envoyer-photo', options(a))).status, 200);
    assert.equal(created[0].calls.find(c => /UPDATE/.test(c.sql)).binds.co_employe, 'ALICE');
    assert.equal((await fetch(base + '/envoyer-photo', options(b))).status, 403);
    await Promise.all(Array.from({ length: 5 }, () => fetch(base + '/clients/1', { headers: a })));
    assert.equal(created[0].max, 1);
    await fetch(base + '/logout', { method: 'POST', headers: a, redirect: 'manual' });
    assert.equal(created[0].closed, 1);
    assert.equal((await fetch(base + '/clients/1', { headers: a })).status, 401);
    created[1].lost = true;
    assert.equal((await fetch(base + '/clients/1', { headers: b })).status, 401);
    assert.equal((await fetch(base + '/clients/1', { headers: b })).status, 401);
    const refused = await fetch(base + '/connect', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ user: 'refus', password: 'x' }) });
    assert.equal(refused.status, 401);
  } finally { await connections.closeAll(); server.close(); }
});

test('expiration et fermeture après opérations en cours', async () => {
  let release;
  const connection = { closed: 0, async close() { this.closed++; } };
  connections.register('expiry-test', connection);
  const running = connections.run('expiry-test', () => new Promise(r => { release = r; }));
  await new Promise(r => setImmediate(r));
  const now = Date.now;
  Date.now = () => now() + 3600001;
  try { assert.equal(connections.has('expiry-test'), false); } finally { Date.now = now; }
  assert.equal(connection.closed, 0);
  release(); await running;
  await new Promise(r => setImmediate(r));
  assert.equal(connection.closed, 1);
  await assert.rejects(connections.run('expiry-test', () => {}), { code: 'SESSION_ORACLE' });
});
