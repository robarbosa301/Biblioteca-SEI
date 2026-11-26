/* Certificados (Aluno Nota 10 e Aluno Destaque/AEE) e medalhas — arte nova da escola, estilo post */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const TIPOS = {
    nota10: { rotulo: 'ALUNO NOTA 10', emoji: '⭐', grande: 'NOTA 10', cor: '#ffd600', cor2: '#ffb300', texto2: '#0b1a4a', claro: 'rgba(255,214,0,.35)', balao: 'Você é demais! 🌟',
      texto: 'Você mandou muito bem no {BIMESTRE} bimestre de {ANO} e conquistou a nota máxima! 🎉 Sua dedicação inspira a gente. Continue brilhando: o SEI tem muito orgulho de você!' },
    destaque: { rotulo: 'ALUNO DESTAQUE', emoji: '💙', grande: 'DESTAQUE', cor: '#00d9ff', cor2: '#1e6bff', texto2: '#06183f', claro: 'rgba(0,217,255,.35)', balao: 'Orgulho de você! 💙',
      texto: 'Cada conquista sua no {BIMESTRE} bimestre de {ANO} mostrou garra, esforço e coragem. 💙 Você é destaque e inspira toda a Família SEI. Siga em frente: a gente acredita em você!' }
  };
  const CHAVE = 'sei-certificados2';
  let st = { bim: '3º', ano: String(new Date().getFullYear()), nota10: '', destaque: '', txt_nota10: TIPOS.nota10.texto, txt_destaque: TIPOS.destaque.texto, tamMed: 33 };
  try { Object.assign(st, JSON.parse(localStorage.getItem(CHAVE) || '{}')); } catch (e) {}
  const guardar = () => { try { localStorage.setItem(CHAVE, JSON.stringify(st)); } catch (e) {} };
  const nomes = tipo => (st[tipo] || '').split(/\r?\n/).map(s => s.replace(/^\s*\d+[\s.)-]*/, '').trim()).filter(Boolean);
  // no certificado o nome sai com iniciais maiúsculas
  const bonito = n => n.toLowerCase().replace(/(^|\s)(\S)/g, (m, a, b) => a + b.toUpperCase()).replace(/ (Da|De|Do|Das|Dos|E)(?= )/g, w => w.toLowerCase());
  const tamNomeMm = nm => Math.min(17, 255 / Math.max(8, nm.length * .62));
  const msg = tipo => (st['txt_' + tipo] || TIPOS[tipo].texto).replace(/\{BIMESTRE\}/g, st.bim).replace(/\{ANO\}/g, st.ano);
  const carregar = (g, src) => window[g] ? Promise.resolve() : new Promise((ok, er) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = er; document.head.append(s); });

  /* ---------- artes ---------- */
  const DISC = ['π', '📐', '∑', 'x²', 'Aa', '📖', '✍️', '🧬', '🔬', '🌱', '⚛️', 'E=mc²', '🧪', 'H₂O', '🏛️', '📜', '🌎', '🧭', 'Hello!', 'ABC', '🎨', '🎭', '⚽', '🏅', '💭', '🌳', '🦜', '🎵', '💡', '🔭', 'Δ', '🧮'];
  function rabiscos(W, H, op) { let s = 5, h = '', i = 0; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280, cel = Math.min(W, H) * .13, cs = ['#7df9ff', '#ffe600', '#8fb8ff', '#7df9ff', '#ffffff'];
    for (let y = -cel * .2; y < H; y += cel) for (let x = -cel * .2; x < W; x += cel) { const t = DISC[i++ % DISC.length], emo = /\p{Extended_Pictographic}/u.test(t);
      h += `<span style="position:absolute;left:${x + rnd() * cel * .5}mm;top:${y + rnd() * cel * .5}mm;font-size:${cel * (emo ? .3 : .24)}mm;transform:rotate(${(rnd() - .5) * 40}deg);opacity:${emo ? op * .7 : op};color:${cs[i % cs.length]};font-family:SeiRubik,Arial Black,sans-serif;white-space:nowrap">${t}</span>`; }
    return h; }
  // selo "Honra ao Mérito" desenhado em SVG
  const selo = (() => { const pts = []; for (let i = 0; i < 48; i++) { const a = i * Math.PI / 24, r = i % 2 ? 84 : 96; pts.push((100 + r * Math.sin(a)).toFixed(1) + ',' + (98 - r * Math.cos(a)).toFixed(1)); }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 250"><defs><linearGradient id="o" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff7b0"/><stop offset=".45" stop-color="#ffd21f"/><stop offset="1" stop-color="#d18f00"/></linearGradient></defs><path d="M62 150 L40 246 L72 226 L96 248 L104 160Z" fill="#ff2bd6"/><path d="M138 150 L160 246 L128 226 L104 248 L96 160Z" fill="#00b8d9"/><polygon points="${pts.join(' ')}" fill="url(#o)" stroke="#b37800" stroke-width="2"/><circle cx="100" cy="98" r="70" fill="none" stroke="#fffbd6" stroke-width="4" stroke-dasharray="3 6"/><text x="100" y="80" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="15" text-anchor="middle" fill="#7a4d00">★ ★ ★</text><text x="100" y="106" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="27" text-anchor="middle" fill="#0b1a4a">HONRA</text><text x="100" y="130" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="17" text-anchor="middle" fill="#0b1a4a">AO MÉRITO</text></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); })();
  let seloPng = null;
  const prepararSelo = () => seloPng ? Promise.resolve(seloPng) : new Promise(ok => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = 800; c.height = 1000; c.getContext('2d').drawImage(im, 0, 0, 800, 1000); seloPng = c.toDataURL('image/png'); ok(seloPng); }; im.onerror = () => ok(selo); im.src = selo; });
  function confete() { let s = 3, h = ''; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280, cs = ['#ffd600', '#00d9ff', '#ffffff', '#4f8bff', '#7df9ff', '#ffe600'];
    for (let i = 0; i < 46; i++) { const lado = i % 2, x = lado ? 196 + rnd() * 80 : 6 + rnd() * 80, y = 14 + rnd() * 46, w = 1.2 + rnd() * 1.6; h += `<i style="left:${x}mm;top:${y}mm;width:${w}mm;height:${w * 2.4}mm;background:${cs[i % cs.length]};transform:rotate(${rnd() * 180}deg)"></i>`; }
    return h; }
  // folha do certificado (A4 deitada, em mm). semTexto: só a arte, para o fundo do Word
  function certificado(tipo, nome, semTexto) {
    const T = TIPOS[tipo], el = document.createElement('div'), nm = bonito(nome), some = semTexto ? ' style="visibility:hidden"' : ''; el.className = 'ct-art';
    el.innerHTML = `<div class="ca-moldura" style="background:linear-gradient(135deg,#ffd600,#00d9ff 50%,#1e6bff)"></div>
      <div class="ca-folha"><div class="ca-risc">${rabiscos(285, 198, .2)}</div>
        <div class="ca-topo"><img src="assets/docs/logo-sei.png" alt=""><div><b>Sistema de Ensino Incentivo</b><small>Aqui se faz educação com qualidade · @_sei01</small></div><span class="ca-chip" style="background:${T.cor};color:${T.texto2}">${esc(st.bim)} BIMESTRE · ${esc(st.ano)}</span></div>
        <div class="ca-conf">${confete()}</div><div class="ca-tit"><i>✦</i>CERTIFICADO<i>✦</i></div>
        <div class="ca-tipo" style="background:linear-gradient(90deg,${T.cor},${T.cor2});color:${T.texto2}">${T.emoji} ${T.rotulo} ${T.emoji}</div>
        <div class="ca-para"${some}>Este certificado vai para</div>
        <div class="ca-nome"><span style="font-size:${tamNomeMm(nm)}mm${semTexto ? ';visibility:hidden' : ''}">${esc(nm)}</span></div>
        <p class="ca-msg"${some}>${esc(msg(tipo))}</p>
        <div class="ca-palco"><span class="ca-luz" style="background:radial-gradient(circle,${T.claro} 0,rgba(0,217,255,0) 70%)"></span><img class="ca-masc" src="assets/docs/mascote-sei.png?v=14" alt=""><div class="ca-podio"><span class="d">2º</span><span class="um">🏆 1º</span><span class="t">3º</span></div><div class="ca-balao" style="border-color:${T.cor}">${esc(T.balao)}</div></div>
        <div class="ca-data">São Miguel do Guamá – PA, ____ de ___________ de ${esc(st.ano)}.</div><div class="ca-ass"><div><i></i>Direção</div><div><i></i>Coordenação pedagógica</div></div>
        <img class="ca-selo" src="assets/docs/selo-honra.png?v=1" alt="">
        <div class="ca-rod">São Miguel do Guamá – PA · Família SEI 💛 #OrgulhoSEI</div>
      </div>`;
    return el;
  }
  // medalha redonda (desenhada a 60 mm e reduzida na folha)
  function medalha(tipo) {
    const T = TIPOS[tipo], el = document.createElement('div'); el.className = 'md-art';
    el.innerHTML = `<div class="md-anel" style="background:linear-gradient(135deg,#ffd600,#00d9ff 55%,#1e6bff)"><div class="md-disco">
      <div class="md-risc">${rabiscos(56, 56, .22)}</div><img class="md-logo" src="assets/docs/logo-sei.png" alt="">
      <div class="md-grande" style="font-size:${tipo === 'nota10' ? 11 : 8.4}mm;color:${tipo === 'nota10' ? '#fff200' : '#7df9ff'};text-shadow:0 0 1.4mm ${T.cor},0 .6mm 0 #0b2a6b">${T.grande}</div>
      <div class="md-fita" style="background:${T.cor};color:${T.texto2}">${esc(st.bim)} BIMESTRE · ${esc(st.ano)}</div>
      <img class="md-masc" src="assets/docs/mascote-sei.png?v=14" alt=""><div class="md-estrela">${tipo === 'nota10' ? '⭐' : '💙'}</div></div></div>`;
    return el;
  }
  async function render(el, dpi, transparente) {
    const fora = document.createElement('div'); Object.assign(fora.style, { position: 'absolute', left: '0', top: '0', zIndex: '-5', pointerEvents: 'none' }); fora.append(el); document.body.append(fora);
    await Promise.all([...el.querySelectorAll('img')].map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; }))); if (document.fonts) { await document.fonts.load('10px SeiRubik'); await document.fonts.load('10px SeiPoppins'); }
    await carregar('html2canvas', 'assets/vendor/html2canvas-1.4.1.min.js');
    const r = el.getBoundingClientRect(); const cv = await html2canvas(el, { ignoreElements: n => n.parentElement === document.body && !n.contains(el), scale: dpi / 96, useCORS: true, backgroundColor: transparente ? null : '#ffffff', logging: false, x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height, windowWidth: Math.max(document.documentElement.clientWidth, Math.ceil(r.width)), windowHeight: Math.max(innerHeight, Math.ceil(r.height)), scrollX: 0, scrollY: 0 });
    fora.remove(); return cv;
  }

  /* ---------- PDF ---------- */
  const novoPdf = async o => { await carregar('html2pdf', 'assets/vendor/html2pdf.bundle.min.js'); return html2pdf().set({ jsPDF: { unit: 'mm', format: 'a4', orientation: o } }).from('<div></div>').toPdf().get('pdf'); };
  const lista = () => ['nota10', 'destaque'].flatMap(t => nomes(t).map(n => [t, n]));
  async function certificadosPdf(aviso) {
    const l = lista(); if (!l.length) return alert('Coloque pelo menos um nome.'); const doc = await novoPdf('l');
    for (const [i, [t, n]] of l.entries()) { aviso(`⏳ ${i + 1} de ${l.length}…`); const cv = await render(certificado(t, n), 170); if (i) doc.addPage('a4', 'l'); doc.addImage(cv.toDataURL('image/jpeg', .9), 'JPEG', 0, 0, 297, 210, undefined, 'FAST'); }
    doc.save(`Certificados-${st.bim}-Bimestre-${st.ano}.pdf`);
  }
  // grade das medalhas na folha A4 em pé, conforme o tamanho escolhido
  const grade = (dd) => { const d = dd || +st.tamMed || 33, passo = d + 1.2, col = Math.floor((210 - 6 + 1.2) / passo + 1e-6), lin = Math.floor((297 - 8 + 1.2) / passo + 1e-6); return { d, passo, col, lin, x0: (210 - (col - 1) * passo - d) / 2, y0: (297 - (lin - 1) * passo - d) / 2 }; };
  async function medalhasImgs() { const out = {}; for (const t of ['nota10', 'destaque']) if (nomes(t).length) out[t] = (await render(medalha(t), 300, true)).toDataURL('image/png'); return out; }
  async function medalhasPdf(aviso) {
    const l = lista(); if (!l.length) return alert('Coloque pelo menos um nome.'); aviso('⏳ Desenhando…'); const imgs = await medalhasImgs(), g = grade(), por = g.col * g.lin, doc = await novoPdf('p');
    l.forEach(([t], i) => { if (i && i % por === 0) doc.addPage('a4', 'p'); const j = i % por; doc.addImage(imgs[t], 'PNG', g.x0 + (j % g.col) * g.passo, g.y0 + Math.floor(j / g.col) * g.passo, g.d, g.d, 'm-' + t, 'FAST'); });
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
    cabecalhos.forEach((h, i) => { z.file('word/media/' + h.arq, h.dados); z.file(`word/header${i + 1}.xml`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr ${NS}><w:p><w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr>${h.xml}</w:p></w:hdr>`); z.file(`word/_rels/header${i + 1}.xml.rels`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="${h.rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${h.arq}"/></Relationships>`); rels += `<Relationship Id="rH${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header${i + 1}.xml"/>`; });
    z.file('word/_rels/document.xml.rels', rels + '</Relationships>');
    z.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NS}><w:body>${corpo}</w:body></w:document>`);
    return z.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }
  const baixar = (blob, nome) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); };
  const tw = mm => Math.round(mm * 56.7);
  async function certificadosWord(aviso) {
    const grupos = ['nota10', 'destaque'].map(t => [t, nomes(t)]).filter(g => g[1].length); if (!grupos.length) return alert('Coloque pelo menos um nome.');
    const cabs = []; let corpo = '';
    for (const [gi, [t, ns]] of grupos.entries()) {
      aviso('⏳ Desenhando a arte…'); const cv = await render(certificado(t, 'x', true), 170);
      cabs.push({ rid: 'rF' + gi, arq: `fundo-${t}.jpeg`, dados: await (await fetch(cv.toDataURL('image/jpeg', .9))).arrayBuffer(), xml: desenho('rF' + gi, 900 + gi, 297 * 36000, 210 * 36000, true) });
      const sect = `<w:sectPr><w:headerReference w:type="default" r:id="rH${gi + 1}"/><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/><w:pgMar w:top="${tw(Mm.para)}" w:right="${tw(Mm.lado)}" w:bottom="${tw(8)}" w:left="${tw(Mm.lado)}" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr>`;
      ns.forEach((n, i) => { const nm = bonito(n), fim = i === ns.length - 1, rp = (fonte, sz, cor, b) => `<w:rPr><w:rFonts w:ascii="${fonte}" w:hAnsi="${fonte}" w:cs="${fonte}"/>${b ? '<w:b/>' : ''}<w:color w:val="${cor}"/><w:sz w:val="${Math.round(sz * 2)}"/></w:rPr>`;
        corpo += `<w:p><w:pPr>${i ? '<w:pageBreakBefore/>' : ''}<w:spacing w:before="0" w:after="0" w:line="${tw(Mm.lParaN)}" w:lineRule="exact"/><w:jc w:val="center"/></w:pPr><w:r>${rp('Arial', 12.5, '7DF9FF', 1)}<w:t>Este certificado vai para</w:t></w:r></w:p>`;
        corpo += `<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="${tw(Mm.lNome)}" w:lineRule="exact"/><w:jc w:val="center"/></w:pPr><w:r>${rp('Arial Black', tamNomeMm(nm) * 2.835 * .9, 'FFFFFF', 1)}<w:t xml:space="preserve">${X(nm)}</w:t></w:r></w:p>`;
        corpo += `<w:p><w:pPr><w:spacing w:before="${tw(Mm.antesMsg)}" w:after="0" w:line="${tw(Mm.lMsg)}" w:lineRule="exact"/><w:ind w:left="${tw(Mm.msgRec)}" w:right="${tw(Mm.msgRec)}"/><w:jc w:val="center"/>${fim && gi < grupos.length - 1 ? sect : ''}</w:pPr><w:r>${rp('Arial', 14.5, 'EAF2FF', 0)}<w:t xml:space="preserve">${X(msg(t))}</w:t></w:r></w:p>`;
        if (fim && gi === grupos.length - 1) corpo += sect; });
    }
    baixar(await docx(corpo, [], cabs), `Certificados-${st.bim}-Bimestre-${st.ano}.docx`);
  }
  // posições (mm) do texto no certificado — as mesmas do CSS (.ca-para, .ca-nome, .ca-msg)
  const Mm = { para: 77, lParaN: 8, lNome: 22, antesMsg: 2, lMsg: 8.2, lado: 30, msgRec: 0 };
  async function medalhasWord(aviso) {
    const l = lista(); if (!l.length) return alert('Coloque pelo menos um nome.'); aviso('⏳ Desenhando…'); const imgs = await medalhasImgs(), g = grade(), midias = [], rid = {};
    for (const t of Object.keys(imgs)) { rid[t] = 'rM' + t; midias.push({ arq: `medalha-${t}.png`, rid: rid[t], dados: await (await fetch(imgs[t])).arrayBuffer() }); }
    const cx = Math.round(g.d * 36000), colW = tw(g.passo); let corpo = '', id = 1;
    for (let i = 0; i < l.length; i += g.col) { const lin = l.slice(i, i + g.col);
      corpo += `<w:tr><w:trPr><w:cantSplit/><w:trHeight w:val="${tw(g.passo)}" w:hRule="exact"/></w:trPr>${Array.from({ length: g.col }, (_, k) => `<w:tc><w:tcPr><w:tcW w:w="${colW}" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr><w:p><w:pPr><w:spacing w:before="0" w:after="0"/><w:jc w:val="center"/></w:pPr>${lin[k] ? desenho(rid[lin[k][0]], id++, cx, cx, false) : ''}</w:p></w:tc>`).join('')}</w:tr>`; }
    const tbl = `<w:tbl><w:tblPr><w:tblW w:w="${colW * g.col}" w:type="dxa"/><w:jc w:val="center"/><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${`<w:gridCol w:w="${colW}"/>`.repeat(g.col)}</w:tblGrid>${corpo}</w:tbl>`;
    baixar(await docx(tbl + `<w:p/><w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="${tw(g.y0)}" w:right="226" w:bottom="226" w:left="226" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr>`, midias, []), `Medalhas-${st.bim}-Bimestre-${st.ano}.docx`);
  }

  /* ---------- puxar do diário e do AEE ---------- */
  async function puxarNota10() {
    const D = window.seiDados; if (!D) return; const [al, bol] = await Promise.all([D.listar('alunos'), D.listar('boletins')]); const av = st.bim.replace('º', 'ª') + ' Avaliação';
    const l = al.filter(a => { const ns = ((((bol.find(b => b.id === a.id) || {}).anos || {})[st.ano]) || {}).notas || {}; return Object.values(ns).some(d => +d[av] === 10); }).map(a => a.nome).sort();
    if (!l.length) return alert(`Nenhum aluno com nota 10 na ${av} de ${st.ano} no diário deste aparelho. Digite os nomes.`); st.nota10 = l.join('\n'); guardar(); desenhar(); alert(l.length + ' aluno(s) com nota 10 na ' + av + '.');
  }
  async function puxarAee() {
    const D = window.seiDados, l = new Set(); if (D) (await D.listar('alunos')).filter(a => a.aee && (a.situacao || 'Ativo') === 'Ativo').forEach(a => l.add(a.nome));
    await new Promise(ok => { try { const r = indexedDB.open('sei-aee'); r.onsuccess = () => { const db = r.result; if (!db.objectStoreNames.contains('alunos')) return ok(); const q = db.transaction('alunos').objectStore('alunos').getAll(); q.onsuccess = () => { (q.result || []).forEach(a => a.nome && l.add(a.nome)); ok(); }; q.onerror = ok; }; r.onerror = ok; } catch (e) { ok(); } });
    if (!l.size) return alert('Nenhum aluno do AEE cadastrado neste aparelho. Digite os nomes.'); st.destaque = [...l].sort().join('\n'); guardar(); desenhar(); alert(l.size + ' aluno(s) do AEE.');
  }

  /* ---------- tela ---------- */
  let prevVez = 0;
  async function previa() {
    const vez = ++prevVez, box = $('#ct-prev'); if (!box) return; const n1 = nomes('nota10'), n2 = nomes('destaque');
    const itens = [['nota10', n1[0] || 'Nome do Aluno'], ...(n2.length ? [['destaque', n2[0]]] : [])], cvs = [], meds = [];
    for (const [t, n] of itens) cvs.push(await render(certificado(t, n), 60));
    for (const t of ['nota10', 'destaque']) meds.push(await render(medalha(t), 110, true));
    if (vez !== prevVez) return; box.innerHTML = ''; cvs.forEach(c => { c.className = 'ct-cv'; box.append(c); }); const m = document.createElement('div'); m.className = 'ct-meds'; meds.forEach(c => { c.style.width = '120px'; c.style.height = 'auto'; m.append(c); }); box.append(m);
  }
  function desenhar() {
    const n1 = nomes('nota10'), n2 = nomes('destaque'), tot = n1.length + n2.length, g = grade();
    $('#ct').innerHTML = `<section class="es-sec"><h2>🏅 Certificados e medalhas</h2><p class="es-dica">Arte nova da escola, no estilo dos nossos posts. Escolha o bimestre, coloque os nomes e baixe os <b>certificados</b> (um por folha A4 deitada) e as <b>medalhas</b>, em PDF ou Word.</p>
      <form class="es-form" id="ct-f"><div class="es-g3"><label>Bimestre<select name="bim">${['1º', '2º', '3º', '4º'].map(b => `<option ${b === st.bim ? 'selected' : ''}>${b}</option>`).join('')}</select></label><label>Ano<input name="ano" inputmode="numeric" value="${esc(st.ano)}"></label>
      <label>Tamanho da medalha<select name="tamMed">${[[33, '3,3 cm'], [40, '4 cm'], [50, '5 cm']].map(([v, t]) => [v, `${t} (${grade(v).col * grade(v).lin} por folha)`]).map(([v, t]) => `<option value="${v}" ${+st.tamMed === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label></div>
      <label>Mensagem do Aluno Nota 10 <small>({BIMESTRE} e {ANO} são trocados sozinhos)</small><textarea name="txt_nota10" style="min-height:70px">${esc(st.txt_nota10)}</textarea></label>
      <label>Mensagem do Aluno Destaque (AEE)<textarea name="txt_destaque" style="min-height:70px">${esc(st.txt_destaque)}</textarea></label><div class="es-acoes" style="margin:0"><button type="button" class="b" id="ct-padrao">↺ Mensagens padrão</button></div></form>
      <div class="es-g2" style="margin-top:14px">
        <div class="lt-turma" style="--c:#ff2bd6"><div class="es-linha"><b style="flex:1;font-size:17px">⭐ Aluno Nota 10</b><span class="chip">${n1.length}</span><button class="b" id="ct-p10">↧ Puxar do diário</button></div><textarea data-l="nota10" placeholder="Um nome por linha">${esc(st.nota10)}</textarea></div>
        <div class="lt-turma" style="--c:#00b8d9"><div class="es-linha"><b style="flex:1;font-size:17px">💙 Aluno Destaque (AEE)</b><span class="chip">${n2.length}</span><button class="b" id="ct-paee">↧ Puxar do AEE</button></div><textarea data-l="destaque" placeholder="Um nome por linha">${esc(st.destaque)}</textarea></div></div>
      <div class="es-acoes" style="margin-top:14px"><button class="b main" id="ct-cpdf">📄 Certificados (PDF)</button><button class="b" id="ct-cdoc">⬇ Certificados (Word)</button><button class="b main" id="ct-mpdf">🏅 Medalhas (PDF)</button><button class="b" id="ct-mdoc">⬇ Medalhas (Word)</button></div>
      <p class="es-dica">${tot ? `Vai gerar <b>${tot} certificado(s)</b> e <b>${tot} medalha(s)</b> em ${Math.ceil(tot / (g.col * g.lin))} folha(s). Imprima em tamanho real (100%).` : 'Coloque os nomes para gerar.'}</p>
      <h2 style="margin-top:10px">👀 Prévia</h2><div class="ct-prev" id="ct-prev"><p class="es-dica">⏳ Desenhando…</p></div></section>`;
    let t = null; const f = $('#ct-f'); f.oninput = f.onchange = e => { const d = new FormData(f); Object.assign(st, { bim: d.get('bim'), ano: d.get('ano').trim(), tamMed: +d.get('tamMed'), txt_nota10: d.get('txt_nota10'), txt_destaque: d.get('txt_destaque') }); guardar(); if (e.type === 'change' && e.target.tagName === 'SELECT') return desenhar(); clearTimeout(t); t = setTimeout(previa, 700); };
    document.querySelectorAll('[data-l]').forEach(x => { x.oninput = () => { st[x.dataset.l] = x.value; guardar(); }; x.onchange = desenhar; });
    previa();
  }
  document.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b || !b.id.startsWith('ct-')) return;
    if (b.id === 'ct-padrao') { st.txt_nota10 = TIPOS.nota10.texto; st.txt_destaque = TIPOS.destaque.texto; guardar(); return desenhar(); }
    if (b.id === 'ct-p10') return puxarNota10();
    if (b.id === 'ct-paee') return puxarAee();
    const fn = { 'ct-cpdf': certificadosPdf, 'ct-cdoc': certificadosWord, 'ct-mpdf': medalhasPdf, 'ct-mdoc': medalhasWord }[b.id]; if (!fn) return;
    const t0 = b.textContent; b.disabled = true; b.textContent = '⏳ Gerando…'; try { await fn(m => { b.textContent = m; }); } catch (er) { alert('Não consegui gerar: ' + (er && er.message || er)); } b.disabled = false; b.textContent = t0;
  });
  desenhar();
})();
