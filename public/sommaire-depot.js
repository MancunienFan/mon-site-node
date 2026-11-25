const form = document.getElementById('depot-form');
const status = document.getElementById('depot-status');
const result = document.getElementById('depot-result');
const pdf = document.getElementById('depot-pdf');
let criteria;
let generation = 0;
async function lire(url) {
  const response = await fetch(url);
  if (response.status === 401) throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
  if (!response.ok) throw new Error('Impossible de charger les données.');
  return response.json();
}
lire('/api/sommaire-depot/lieux').then(lieux => {
  form.endroit.replaceChildren(new Option('Sélectionner un lieu', ''));
  lieux.forEach(l => form.endroit.add(new Option(l.DESCRIPTION_LIEU || l.NOM_LIEU, l.CODE_LIEU)));
}).catch(e => { status.textContent = e.message; });
form.addEventListener('input', () => { generation++; pdf.disabled = true; criteria = null; result.replaceChildren(); status.textContent = ''; });
form.addEventListener('submit', async e => {
  e.preventDefault(); pdf.disabled = true; criteria = null; result.replaceChildren(); status.textContent = 'Chargement…';
  const requestGeneration = ++generation;
  const params = new URLSearchParams(new FormData(form));
  try {
    const rows = await lire('/api/sommaire-depot?' + params);
    if (requestGeneration !== generation) return;
    for (const row of rows) {
      const tr = document.createElement('tr');
      for (const key of ['NO_RECU','NM_TRANS_PAIE','NO_DOSS','EVENEMENT','MODE_PAIE','MT_DU']) {
        const td = document.createElement('td'); td.textContent = key === 'MT_DU' && row[key] != null ? Number(row[key]).toLocaleString('fr-CA', {style:'currency', currency:'CAD'}) : (row[key] ?? ''); tr.append(td);
      }
      result.append(tr);
    }
    status.textContent = rows.length ? `${rows.length} ligne(s)` : 'Aucune donnée pour ces critères.';
    if (rows.length) { criteria = params; pdf.disabled = false; }
  } catch (error) { if (requestGeneration === generation) status.textContent = error.message; }
});
pdf.addEventListener('click', () => { if (criteria) window.location.href = '/api/sommaire-depot/pdf?' + criteria; });
