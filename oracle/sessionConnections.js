const entries = new Map();
const TTL = 60 * 60 * 1000;

function register(id, connection) {
  if (entries.has(id)) throw new Error('Session déjà associée');
  entries.set(id, { connection, expires: Date.now() + TTL, queue: Promise.resolve(), closing: false });
}
function has(id) {
  const entry = entries.get(id);
  if (!entry || entry.closing) return false;
  if (entry.expires <= Date.now()) { void close(id).catch(() => {}); return false; }
  return true;
}
function touch(id) { if (has(id)) entries.get(id).expires = Date.now() + TTL; }
async function run(id, action) {
  if (!has(id)) { const error = new Error('Session Oracle expirée'); error.code = 'SESSION_ORACLE'; throw error; }
  const entry = entries.get(id);
  const task = entry.queue.then(async () => {
    if (entry.closing || entry.expires <= Date.now()) { const error = new Error('Session Oracle expirée'); error.code = 'SESSION_ORACLE'; throw error; }
    try { return await action(entry.connection); }
    catch (error) {
      if (/^(NJS-003|NJS-500|NJS-501|DPI-1010|DPI-1080|ORA-03113|ORA-03114|ORA-03135)/.test(error.code || error.message || '')) {
        entry.closing = true;
        setImmediate(async () => { try { await entry.queue; await entry.connection.close(); } catch (_) {} finally { entries.delete(id); } });
        error.code = 'SESSION_ORACLE';
      }
      throw error;
    }
  });
  entry.queue = task.catch(() => {});
  return task;
}
async function close(id) {
  const entry = entries.get(id);
  if (!entry || entry.closing) return;
  entry.closing = true;
  await entry.queue;
  try { await entry.connection.close(); } finally { entries.delete(id); }
}
async function closeAll() { await Promise.allSettled([...entries.keys()].map(close)); }
const timer = setInterval(() => { for (const [id, entry] of entries) if (entry.expires <= Date.now()) void close(id).catch(() => {}); }, 30000);
timer.unref();
module.exports = { register, has, touch, run, close, closeAll };
