const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Writable } = require('node:stream');
const oracledb = require('oracledb');
const db = require('../oracle/sommaireDepotDB');

const row = { NO_RECU: 123, NO_DOSS: 42, CO_MODE_PAIE: 'C', MODE_PAIE: 'Carte', CO_TYP_TRANS_PAIE: 'A', NM_TRANS_PAIE: 'Licence', NO_POST_CPTA: '123', MT_DU: 23 };
let rows = [row, row];
db.getLieux = async () => [{ CODE_LIEU: '01', DESCRIPTION_LIEU: 'Québec' }];
db.getSommaire = async () => rows;
oracledb.getConnection = async () => ({ close: async () => {} });
const { app } = require('../server');
const { genererSommaire } = require('../services/sommairePdf');

test('routes protégées et lectures du sommaire', async () => {
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal((await fetch(base + '/api/sommaire-depot/lieux')).status, 401);
    assert.equal((await fetch(base + '/sommaire-depot', { redirect: 'manual' })).status, 302);
    const login = await fetch(base + '/connect', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ user: 'test', password: 'test' }) });
    assert.equal(login.status, 200);
    const headers = { cookie: login.headers.get('set-cookie').split(';')[0] };
    assert.equal((await fetch(base + '/sommaire-depot', { headers })).status, 200);
    assert.equal((await fetch(base + '/api/sommaire-depot/lieux', { headers })).status, 200);
    assert.equal((await fetch(base + '/api/sommaire-depot?date_recu=2026-02-30&endroit=01', { headers })).status, 400);
    const params = '?date_recu=2026-01-01&endroit=01&bordereau=test';
    assert.equal((await (await fetch(base + '/api/sommaire-depot' + params, { headers })).json()).length, 2);
    const pdf = await fetch(base + '/api/sommaire-depot/pdf' + params, { headers });
    assert.equal(pdf.status, 200);
    assert.match(pdf.headers.get('content-type'), /application\/pdf/);
    assert.equal(Buffer.from(await pdf.arrayBuffer()).subarray(0, 5).toString(), '%PDF-');
    rows = [];
    assert.equal((await (await fetch(base + '/api/sommaire-depot' + params, { headers })).json()).length, 0);
    assert.equal((await fetch(base + '/api/sommaire-depot/pdf' + params, { headers })).status, 404);
    rows = null;
    assert.equal((await fetch(base + '/api/sommaire-depot/pdf' + params, { headers })).status, 500);
  } finally { server.close(); }
});

test('PDF multipage avec nombreux groupes', async () => {
  const chunks = [];
  const out = new Writable({ write(chunk, encoding, cb) { chunks.push(chunk); cb(); } });
  const finished = new Promise((resolve, reject) => { out.on('finish', resolve); out.on('error', reject); });
  const data = Array.from({ length: 90 }, (_, i) => ({ ...row, CO_TYP_TRANS_PAIE: String(i), CO_MODE_PAIE: String(i) }));
  genererSommaire(out, data, { date_recu: '2026-01-01', lieu: 'Québec', bordereau: 'test' });
  await finished;
  const pdf = Buffer.concat(chunks).toString('latin1');
  assert.match(pdf, /^%PDF-/);
  assert.ok((pdf.match(/\/Type\s*\/Page\b/g) || []).length > 2);
});
