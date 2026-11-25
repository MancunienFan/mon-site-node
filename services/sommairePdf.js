const PDFDocument = require('pdfkit');

function genererSommaire(res, lignes, infos) {
  const doc = new PDFDocument({ size: 'LETTER', margin: 20, bufferPages: true, autoFirstPage: false });
  doc.pipe(res);
  const money = n => (n / 100).toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' $';
  const modes = new Map(), types = new Map();
  let total = 0, y;
  const add = (map, key, label, cents) => { const item = map.get(key) || { label, cents: 0 }; item.cents += cents; map.set(key, item); };
  for (const r of lignes) {
    const cents = Math.round(Number(r.MT_DU || 0) * 100); total += cents;
    add(modes, String(r.CO_MODE_PAIE), r.MODE_PAIE || '', cents);
    add(types, String(r.CO_TYP_TRANS_PAIE), [r.NM_TRANS_PAIE || '', r.NO_POST_CPTA || ''], cents);
  }
  function page() {
    doc.addPage(); doc.font('Helvetica').fontSize(8).text(new Date().toLocaleString('fr-CA'), 20, 20, { width: 120 });
    doc.font('Helvetica-Bold').fontSize(9).text('Régie des alcools, des courses et des jeux\nSommaire de dépôt\n(courses)', 140, 20, { width: 332, align: 'center' });
    doc.text('131E', 20, 48); y = 100;
    const labels = ['Reçu', 'Type paiement', 'Dossier', 'Événement', 'Mode paiement', 'Montant'];
    const xs = [20, 91, 210, 282, 390, 523];
    labels.forEach((v, i) => doc.fontSize(8).text(v, xs[i], y, { width: i === 5 ? 68 : xs[i + 1] - xs[i] - 3, align: i === 5 ? 'right' : 'left' }));
    doc.moveTo(20, 113).lineTo(592, 113).stroke(); y = 120;
  }
  page();
  for (const r of lignes) {
    const values = [r.NO_RECU, r.NM_TRANS_PAIE, r.NO_DOSS, r.EVENEMENT, r.MODE_PAIE, money(Math.round(Number(r.MT_DU || 0) * 100))].map(v => String(v ?? ''));
    const xs = [20, 91, 210, 282, 390, 523], widths = [68,116,69,105,130,69];
    doc.font('Helvetica').fontSize(8);
    const h = Math.max(14, ...values.map((v, i) => doc.heightOfString(v, { width: widths[i] }) + 4));
    if (y + h > 750) page();
    values.forEach((v, i) => doc.text(v, xs[i], y, { width: widths[i], align: i === 5 ? 'right' : 'left' })); y += h;
  }
  const modeRows = [...modes.values()];
  const typeRows = [...types.values()];
  const entries = Math.max(modeRows.length, typeRows.length);
  const chunkSize = 24;
  let offset = 0;
  do {
  const count = Math.min(chunkSize, entries - offset);
  const last = offset + count >= entries;
  const boxHeight = 85 + count * 15;
  if (y + boxHeight + (last ? 120 : 0) > 750) page();
  doc.rect(20, y, 572, boxHeight).stroke();
  doc.font('Helvetica-Bold').fontSize(8).text(`Numéro bordereau : ${infos.bordereau}`, 25, y + 6, { width: 185 }).text(`Date dépôt : ${infos.date_recu}`, 212, y + 6, { width: 150 }).text(`Lieu dépôt : ${infos.lieu}`, 365, y + 6, { width: 220 });
  doc.moveTo(20, y + 22).lineTo(592, y + 22).stroke();
  doc.text('Mode paiement', 30, y + 30).text('Total', 190, y + 30).text('Type paiement', 255, y + 30).text('Poste comptable', 390, y + 30).text('Total', 535, y + 30);
  doc.font('Helvetica');
  modeRows.slice(offset, offset + count).forEach((v, i) => { doc.text(v.label, 30, y + 45 + i * 15, {width:155, height:14, ellipsis:true}); doc.text(money(v.cents), 180, y + 45 + i * 15, {width:65,align:'right'}); });
  typeRows.slice(offset, offset + count).forEach((v, i) => { doc.text(v.label[0], 255, y + 45 + i * 15, {width:130, height:14, ellipsis:true}); doc.text(String(v.label[1]), 390, y + 45 + i * 15, {width:120, height:14, ellipsis:true}); doc.text(money(v.cents), 520, y + 45 + i * 15, {width:65,align:'right'}); });
  if (last) doc.font('Helvetica-Bold').text(`Montant des droits et des frais : ${money(total)}`, 25, y + boxHeight - 20).text(`Montant encaissé : ${money(total)}`, 320, y + boxHeight - 20);
  y += boxHeight + 25;
  offset += count;
  if (!last) page();
  } while (offset < entries);
  doc.text('Date  ____________________', 45, y).text('Signature  ______________________________', 260, y);
  doc.rect(20, y + 25, 572, 65).stroke().text('Remarques (no. dossier, montant encaissé en surplus, poste comptable concerné) :', 25, y + 30);
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) { doc.switchToPage(i); doc.font('Helvetica').fontSize(8).text(`${i + 1} / ${range.count}`, 545, 30, {width:45, align:'right'}); }
  doc.end();
}
module.exports = { genererSommaire };
