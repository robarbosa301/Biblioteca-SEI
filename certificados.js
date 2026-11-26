/* Certificados (Aluno Nota 10 e Aluno Destaque/AEE) e folha de medalhas, no modelo da escola */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const P = 'assets/premiacao/', V = '?v=1';
  const TIPOS = { nota10: { nome: 'Aluno Nota 10', fundo: P + 'cert-nota10.jpg' + V, medalha: 'ALUNO NOTA 10', cor: '#1e4fb8' }, destaque: { nome: 'Aluno Destaque (AEE)', fundo: P + 'cert-destaque.jpg' + V, medalha: 'ALUNO DESTAQUE', cor: '#ef6c00' } };
  const TEXTO = 'É com muita honra que o SEI (Sistema de Ensino Incentivo) parabeniza o(a) prezado(a) aluno(a) {NOME}, pela sua dedicação e desempenho no {BIMESTRE} Bimestre de {ANO}.';
  const CHAVE = 'sei-certificados';
  const anoPad = () => { const d = new Date(); return String(d.getMonth() >= 1 ? d.getFullYear() : d.getFullYear() - 1); };
  let st = { bim: '3º', ano: anoPad(), texto: TEXTO, nota10: '', destaque: '' };
  try { Object.assign(st, JSON.parse(localStorage.getItem(CHAVE) || '{}')); } catch (e) {}
  const guardar = () => { try { localStorage.setItem(CHAVE, JSON.stringify(st)); } catch (e) {} };
  const nomes = tipo => (st[tipo] || '').split(/\r?\n/).map(s => s.replace(/^\s*\d+[\s.)-]*/, '').trim().toUpperCase()).filter(Boolean);
  const carregar = (g, src) => window[g] ? Promise.resolve() : new Promise((ok, er) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = er; document.head.append(s); });
  const imagem = src => new Promise((ok, er) => { const i = new Image(); i.onload = () => ok(i); i.onerror = er; i.src = src; });

  /* ---------- texto do certificado (justificado, nome em negrito itálico) ---------- */
  // medidas do modelo, em pontos (folha A4 deitada 842 × 595)
  const G = { x: 20, w: 805, base: 291.5, tam: 28.7, entre: 40.6, maxLin: 4, esc: .785 }; // esc: letra condensada como no modelo (80%)
  function pedacos(nome) {
    const t = (st.texto || TEXTO).replace(/\{BIMESTRE\}/g, st.bim).replace(/\{ANO\}/g, st.ano), [a, b = ''] = t.split('{NOME}'), out = [];
    const poe = (s, f) => s.split(/\s+/).filter(Boolean).forEach(w => out.push({ t: w, f })); poe(a, 'bold');
    nome.split(/\s+/).filter(Boolean).forEach(w => out.push({ t: w, f: 'bolditalic' }));
    const m = /^([,.;:!?]+)(.*)$/s.exec(b); if (m) { out.push({ t: m[1], f: 'bold', cola: true }); poe(m[2], 'bold'); } else poe(b, 'bold');
    return out;
  }
  // quebra em linhas; mede(texto, fonte) devolve a largura no tamanho atual
  function linhas(tk, mede, larg) {
    const ls = [[]]; let w = 0; const esp = mede(' ', 'bold');
    tk.forEach(p => { const pw = mede(p.t, p.f), add = (ls[ls.length - 1].length && !p.cola ? esp : 0) + pw; if (w + add > larg && ls[ls.length - 1].length && !p.cola) { ls.push([]); w = 0; } ls[ls.length - 1].push(Object.assign({ w: pw }, p)); w += (ls[ls.length - 1].length > 1 && !p.cola ? esp : 0) + pw; });
    return ls;
  }
  function escreve(doc, nome) {
    const tk = pedacos(nome); let tam = G.tam, ls;
    const mede = (t, f) => { doc.setFont('times', f); doc.setFontSize(tam); return doc.getTextWidth(t) * G.esc; };
    for (;;) { ls = linhas(tk, mede, G.w); if (ls.length <= G.maxLin || tam < 16) break; tam -= 1; }
    const lh = G.entre * tam / G.tam; doc.setTextColor(0, 0, 0); doc.internal.write(`${G.esc * 100} Tz`);
    ls.forEach((l, i) => { const ultima = i === ls.length - 1, gaps = l.filter((p, k) => k && !p.cola).length, soma = l.reduce((s, p) => s + p.w, 0), esp = mede(' ', 'bold');
      const extra = ultima || !gaps ? esp : (G.w - soma) / gaps; let x = G.x; const y = G.base + i * lh;
      l.forEach((p, k) => { if (k && !p.cola) x += extra; doc.setFont('times', p.f); doc.setFontSize(tam); doc.text(p.t, x, y); x += p.w; }); });
    doc.internal.write('100 Tz');
  }

  /* ---------- medalha ---------- */
  let baseMed = null;
  async function medalha(tipo) {
    if (!baseMed) baseMed = await imagem(P + 'medalha-base.png' + V);
    if (document.fonts) await document.fonts.load('40px SeiRubik');
    const cv = document.createElement('canvas'); cv.width = baseMed.width; cv.height = baseMed.height; const g = cv.getContext('2d'); g.drawImage(baseMed, 0, 0);
    const W = cv.width, k = W / 93.96, linha = (txt, tam, y, max) => { const f = tam * k; g.font = `${f}px SeiRubik, "Arial Black", sans-serif`; const sx = Math.min(.86, max * W / g.measureText(txt).width);
      g.save(); g.translate(W / 2, y * k); g.scale(sx, 1); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = f * .2; g.strokeStyle = '#231f20'; g.strokeText(txt, 0, 0); g.fillStyle = '#fff200'; g.fillText(txt, 0, 0); g.restore(); };
    linha(`${TIPOS[tipo].medalha} (${st.ano})`, 10.2, 32.6, .84); linha(`${st.bim} BIMESTRE`, 6.6, 43.2, .34);
    return cv;
  }
  // folha A4 em pé: 6 por linha, 8 linhas (48 por folha), no tamanho do modelo (33 mm)
  const MED = { d: 93.97, h: 96.13, passoX: 95.24, passoY: 99.21, x0: 12.7, y0: 22.7, col: 6, lin: 8 };
  async function medalhasLista() { const l = []; for (const t of ['nota10', 'destaque']) { const n = nomes(t).length; if (!n) continue; const cv = await medalha(t), url = cv.toDataURL('image/png'); for (let i = 0; i < n; i++) l.push({ t, url }); } return l; }

  /* ---------- PDF ---------- */
  const novoPdf = async (o) => { await carregar('html2pdf', 'assets/vendor/html2pdf.bundle.min.js'); return html2pdf().set({ jsPDF: { unit: 'pt', format: 'a4', orientation: o } }).from('<div></div>').toPdf().get('pdf'); };
  async function certificadosPdf() {
    const todos = ['nota10', 'destaque'].flatMap(t => nomes(t).map(n => [t, n])); if (!todos.length) return alert('Coloque pelo menos um nome.');
    const doc = await novoPdf('l'), fundos = {};
    for (const [i, [t, n]] of todos.entries()) { if (i) doc.addPage('a4', 'l'); if (!fundos[t]) fundos[t] = await imagem(TIPOS[t].fundo); doc.addImage(fundos[t], 'JPEG', 0, 0, 841.89, 595.28, 'f-' + t, 'FAST'); escreve(doc, n); }
    doc.save(`Certificados-${st.bim}-Bimestre-${st.ano}.pdf`);
  }
  async function medalhasPdf() {
    const l = await medalhasLista(); if (!l.length) return alert('Coloque pelo menos um nome.');
    const doc = await novoPdf('p'), por = MED.col * MED.lin;
    l.forEach((m, i) => { if (i && i % por === 0) doc.addPage('a4', 'p'); const j = i % por, c = j % MED.col, r = Math.floor(j / MED.col); doc.addImage(m.url, 'PNG', MED.x0 + c * MED.passoX, MED.y0 + r * MED.passoY, MED.d, MED.h, 'm-' + m.t, 'FAST'); });
    doc.save(`Medalhas-${st.bim}-Bimestre-${st.ano}.pdf`);
  }

  /* ---------- Word ---------- */
  const X = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
  const desenho = (rid, id, cx, cy, ancorado) => { const g = `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${id}" name="Imagem ${id}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic>`;
    return ancorado ? `<w:r><w:drawing><wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="1" behindDoc="1" locked="1" layoutInCell="1" allowOverlap="1"><wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="page"><wp:posOffset>0</wp:posOffset></wp:positionH><wp:positionV relativeFrom="page"><wp:posOffset>0</wp:posOffset></wp:positionV><wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapNone/><wp:docPr id="${id}" name="Fundo ${id}"/><wp:cNvGraphicFramePr/>${g}</wp:anchor></w:drawing></w:r>`
      : `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="Medalha ${id}"/><wp:cNvGraphicFramePr/>${g}</wp:inline></w:drawing></w:r>`; };
  async function docx(corpo, midias, cabecalhos) {
    await carregar('JSZip', 'assets/vendor/jszip.min.js'); const z = new JSZip();
    z.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpeg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>${cabecalhos.map((h, i) => `<Override PartName="/word/header${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>`).join('')}</Types>`);
    z.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
    z.file('word/settings.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:zoom w:percent="100"/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>');
    let rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rSet" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>';
    for (const m of midias) { z.file('word/media/' + m.arq, m.dados); rels += `<Relationship Id="${m.rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${m.arq}"/>`; }
    cabecalhos.forEach((h, i) => { if (h.dados) z.file('word/media/' + h.arq, h.dados); z.file(`word/header${i + 1}.xml`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr ${NS}><w:p><w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr>${h.xml}</w:p></w:hdr>`); z.file(`word/_rels/header${i + 1}.xml.rels`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="${h.rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${h.arq}"/></Relationships>`); rels += `<Relationship Id="rH${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header${i + 1}.xml"/>`; });
    z.file('word/_rels/document.xml.rels', rels + '</Relationships>');
    z.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NS}><w:body>${corpo}</w:body></w:document>`);
    return z.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }
  const baixar = (blob, nome) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); };
  const bytes = async src => (await fetch(src)).arrayBuffer();
  async function certificadosWord() {
    const grupos = ['nota10', 'destaque'].map(t => [t, nomes(t)]).filter(g => g[1].length); if (!grupos.length) return alert('Coloque pelo menos um nome.');
    const midias = [], cabs = []; let corpo = '';
    const rPr = it => `<w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/>${it ? '<w:i/>' : ''}<w:w w:val="80"/><w:sz w:val="57"/></w:rPr>`;
    for (const [gi, [t, ns]] of grupos.entries()) {
      const arq = `fundo-${t}.jpeg`, rid = 'rF' + gi; midias.push({ arq, rid: 'rDoc' + gi, dados: await bytes(TIPOS[t].fundo) }); cabs.push({ rid, arq, xml: desenho(rid, 900 + gi, 10692000, 7560000, true) });
      ns.forEach((n, i) => { const txt = (st.texto || TEXTO).replace(/\{BIMESTRE\}/g, st.bim).replace(/\{ANO\}/g, st.ano), [a, b = ''] = txt.split('{NOME}'), ult = i === ns.length - 1, fimSec = ult;
        const sect = `<w:sectPr><w:headerReference w:type="default" r:id="rH${gi + 1}"/><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/><w:pgMar w:top="5180" w:right="340" w:bottom="400" w:left="400" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr>`;
        const pPr = `<w:pPr>${i ? '<w:pageBreakBefore/>' : ''}<w:spacing w:before="0" w:after="0" w:line="812" w:lineRule="exact"/><w:jc w:val="both"/>${fimSec && gi < grupos.length - 1 ? sect : ''}</w:pPr>`;
        corpo += `<w:p>${pPr}<w:r>${rPr(0)}<w:t xml:space="preserve">${X(a)}</w:t></w:r><w:r>${rPr(1)}<w:t xml:space="preserve">${X(n)}</w:t></w:r><w:r>${rPr(0)}<w:t xml:space="preserve">${X(b)}</w:t></w:r></w:p>`;
        if (fimSec && gi === grupos.length - 1) corpo += sect; });
    }
    // as imagens de fundo ficam nos cabeçalhos (cada tipo com o seu)
    const z = await docx(corpo, [], cabs.map((c, i) => Object.assign(c, { dados: midias[i].dados })));
    baixar(z, `Certificados-${st.bim}-Bimestre-${st.ano}.docx`);
  }
  async function medalhasWord() {
    const l = await medalhasLista(); if (!l.length) return alert('Coloque pelo menos um nome.');
    const midias = [], rid = {}; let id = 1;
    for (const t of [...new Set(l.map(m => m.t))]) { const url = l.find(m => m.t === t).url; rid[t] = 'rM' + t; midias.push({ arq: `medalha-${t}.png`, rid: rid[t], dados: await (await fetch(url)).arrayBuffer() }); }
    const cx = Math.round(MED.d * 12700), cy = Math.round(MED.h * 12700), colW = Math.round(MED.passoX * 20), linH = Math.round(MED.passoY * 20); let corpo = '';
    for (let i = 0; i < l.length; i += MED.col) { const lin = l.slice(i, i + MED.col);
      corpo += `<w:tr><w:trPr><w:cantSplit/><w:trHeight w:val="${linH}" w:hRule="exact"/></w:trPr>${Array.from({ length: MED.col }, (_, k) => `<w:tc><w:tcPr><w:tcW w:w="${colW}" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr><w:p><w:pPr><w:spacing w:before="0" w:after="0"/><w:jc w:val="center"/></w:pPr>${lin[k] ? desenho(rid[lin[k].t], id++, cx, cy, false) : ''}</w:p></w:tc>`).join('')}</w:tr>`; }
    const tbl = `<w:tbl><w:tblPr><w:tblW w:w="${colW * MED.col}" w:type="dxa"/><w:jc w:val="center"/><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${`<w:gridCol w:w="${colW}"/>`.repeat(MED.col)}</w:tblGrid>${corpo}</w:tbl>`;
    const sect = '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="454" w:right="226" w:bottom="226" w:left="226" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr>';
    baixar(await docx(tbl + '<w:p/>' + sect, midias, []), `Medalhas-${st.bim}-Bimestre-${st.ano}.docx`);
  }

  /* ---------- puxar do diário e do AEE ---------- */
  async function puxarNota10() {
    const D = window.seiDados; if (!D) return alert('Cadastro indisponível neste aparelho.'); const [al, bol] = await Promise.all([D.listar('alunos'), D.listar('boletins')]); const av = st.bim.replace('º', 'ª') + ' Avaliação';
    const l = al.filter(a => { const ns = ((((bol.find(b => b.id === a.id) || {}).anos || {})[st.ano]) || {}).notas || {}; return Object.values(ns).some(d => +d[av] === 10); }).map(a => a.nome.toUpperCase()).sort();
    if (!l.length) return alert(`Nenhum aluno com nota 10 na ${av} de ${st.ano} no diário deste aparelho. Digite os nomes.`); st.nota10 = l.join('\n'); guardar(); desenhar(); alert(l.length + ' aluno(s) com nota 10 na ' + av + '.');
  }
  async function puxarAee() {
    const D = window.seiDados, l = new Set(); if (D) (await D.listar('alunos')).filter(a => a.aee && (a.situacao || 'Ativo') === 'Ativo').forEach(a => l.add(a.nome.toUpperCase()));
    await new Promise(ok => { try { const r = indexedDB.open('sei-aee'); r.onsuccess = () => { const db = r.result; if (!db.objectStoreNames.contains('alunos')) return ok(); const q = db.transaction('alunos').objectStore('alunos').getAll(); q.onsuccess = () => { (q.result || []).forEach(a => a.nome && l.add(a.nome.toUpperCase())); ok(); }; q.onerror = ok; }; r.onerror = ok; } catch (e) { ok(); } });
    if (!l.size) return alert('Nenhum aluno do AEE cadastrado neste aparelho. Digite os nomes.'); st.destaque = [...l].sort().join('\n'); guardar(); desenhar(); alert(l.size + ' aluno(s) do AEE.');
  }

  /* ---------- tela ---------- */
  function previa(tipo, nome) {
    const t = (st.texto || TEXTO).replace(/\{BIMESTRE\}/g, st.bim).replace(/\{ANO\}/g, st.ano), [a, b = ''] = t.split('{NOME}');
    return `<div class="ct-folha" style="background-image:url(${TIPOS[tipo].fundo})"><p>${esc(a)}<i>${esc(nome)}</i>${esc(b)}</p></div>`;
  }
  function desenhar() {
    const n1 = nomes('nota10'), n2 = nomes('destaque'), tot = n1.length + n2.length, folhasMed = Math.ceil(tot / (MED.col * MED.lin));
    $('#ct').innerHTML = `<section class="es-sec"><h2>🏅 Certificados e medalhas</h2><p class="es-dica">No modelo da escola. Escolha o bimestre, coloque os nomes e baixe os <b>certificados</b> (um por folha A4 deitada) e a <b>folha de medalhas</b> (48 por folha A4, 3,3 cm cada) — em PDF ou Word.</p>
      <form class="es-form" id="ct-f"><div class="es-g3"><label>Bimestre<select name="bim">${['1º', '2º', '3º', '4º'].map(b => `<option ${b === st.bim ? 'selected' : ''}>${b}</option>`).join('')}</select></label><label>Ano<input name="ano" inputmode="numeric" value="${esc(st.ano)}"></label></div>
      <label>Texto do certificado <small>({NOME}, {BIMESTRE} e {ANO} são trocados sozinhos)</small><textarea name="texto" style="min-height:80px">${esc(st.texto)}</textarea></label><div class="es-acoes" style="margin:0"><button type="button" class="b" id="ct-padrao">↺ Texto padrão</button></div></form>
      <div class="es-g2" style="margin-top:14px">
        <div class="lt-turma" style="--c:#1e4fb8"><div class="es-linha"><b style="flex:1;font-size:17px">🔟 Aluno Nota 10</b><span class="chip">${n1.length}</span><button class="b" id="ct-p10">↧ Puxar do diário</button></div><textarea data-l="nota10" placeholder="Um nome por linha">${esc(st.nota10)}</textarea></div>
        <div class="lt-turma" style="--c:#ef6c00"><div class="es-linha"><b style="flex:1;font-size:17px">⭐ Aluno Destaque (AEE)</b><span class="chip">${n2.length}</span><button class="b" id="ct-paee">↧ Puxar do AEE</button></div><textarea data-l="destaque" placeholder="Um nome por linha">${esc(st.destaque)}</textarea></div></div>
      <div class="es-acoes" style="margin-top:14px"><button class="b main" id="ct-cpdf">📄 Certificados (PDF)</button><button class="b" id="ct-cdoc">⬇ Certificados (Word)</button><button class="b main" id="ct-mpdf">🏅 Medalhas (PDF)</button><button class="b" id="ct-mdoc">⬇ Medalhas (Word)</button></div>
      <p class="es-dica">${tot ? `Vai gerar <b>${tot} certificado(s)</b> e <b>${tot} medalha(s)</b> em ${folhasMed} folha(s). Imprima em tamanho real (100%).` : 'Coloque os nomes para gerar.'}</p>
      <h2 style="margin-top:10px">👀 Prévia</h2><div class="ct-prev">${n1.length ? previa('nota10', n1[0]) : ''}${n2.length ? previa('destaque', n2[0]) : ''}${!tot ? previa('nota10', 'NOME DO ALUNO') : ''}<div class="ct-meds" id="ct-meds"></div></div></section>`;
    const f = $('#ct-f'); f.oninput = f.onchange = e => { const d = new FormData(f); const re = e.type === 'change' && (st.bim !== d.get('bim') || st.ano !== d.get('ano').trim()); Object.assign(st, { bim: d.get('bim'), ano: d.get('ano').trim(), texto: d.get('texto') }); guardar(); if (re) desenhar(); else document.querySelectorAll('.ct-folha p').forEach((p, i) => { const tipo = i === 1 || (!n1.length && n2.length) ? 'destaque' : 'nota10'; const nm = (tipo === 'nota10' ? n1[0] : n2[0]) || 'NOME DO ALUNO'; p.outerHTML = previa(tipo, nm).replace(/^<div[^>]*>|<\/div>$/g, ''); }); };
    document.querySelectorAll('[data-l]').forEach(t => { t.oninput = () => { st[t.dataset.l] = t.value; guardar(); }; t.onchange = desenhar; });
    ajustaPrev(); (async () => { const box = $('#ct-meds'); for (const t of ['nota10', 'destaque']) { if (!nomes(t).length && tot) continue; const cv = await medalha(t); cv.style.width = '110px'; cv.style.height = 'auto'; box.append(cv); } })();
  }
  function ajustaPrev() { document.querySelectorAll('.ct-folha').forEach(d => { d.style.fontSize = (d.clientWidth * G.tam / 842) + 'px'; }); }
  addEventListener('resize', ajustaPrev);
  document.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b || !b.id.startsWith('ct-')) return;
    if (b.id === 'ct-padrao') { st.texto = TEXTO; guardar(); return desenhar(); }
    if (b.id === 'ct-p10') return puxarNota10();
    if (b.id === 'ct-paee') return puxarAee();
    const fn = { 'ct-cpdf': certificadosPdf, 'ct-cdoc': certificadosWord, 'ct-mpdf': medalhasPdf, 'ct-mdoc': medalhasWord }[b.id]; if (!fn) return;
    const t0 = b.textContent; b.disabled = true; b.textContent = '⏳ Gerando…'; try { await fn(); } catch (er) { alert('Não consegui gerar: ' + (er && er.message || er)); } b.disabled = false; b.textContent = t0;
  });
  desenhar();
})();
