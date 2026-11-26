/* Listão dos Aprovados: monta um painel grande e divide em folhas A4 para imprimir, cortar e montar */
(function () {
  'use strict';
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const TURMAS = ['Maternal', 'Pré I', 'Pré II', '1º ano', '2º ano', '3º ano', '4º ano', '5º ano', '6º ano', '7º ano', '8º ano', '9º ano', '1ª série (Médio)', '2ª série (Médio)', '3ª série (Convênio)', 'Pré-vestibular'];
  const CORES = ['#ef6c00', '#2e7d32', '#1565c0', '#c62828', '#00838f', '#ad1457', '#283593', '#00695c', '#6a1b9a', '#b8860b', '#d84315', '#0277bd', '#558b2f', '#4527a0', '#00796b', '#5d4037'];
  const corDe = t => CORES[Math.max(0, TURMAS.indexOf(t)) % CORES.length];
  // tamanhos do painel: colunas × linhas de folhas, e a folha em pé (p) ou deitada (l), para o painel em pé
  const TAM = [['1 folha A4', 1, 1, 'p'], ['2 folhas (tamanho A3)', 1, 2, 'l'], ['4 folhas (tamanho A2)', 2, 2, 'p'], ['8 folhas (tamanho A1)', 2, 4, 'l'], ['9 folhas (3 × 3)', 3, 3, 'p'], ['16 folhas (tamanho A0)', 4, 4, 'p']];
  const M = 7; // margem de corte em cada folha (mm)
  const CHAVE = 'sei-listao';
  const anoPad = () => { const d = new Date(); return String(d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1); };
  let st = { ano: anoPad(), titulo: 'APROVADOS', chamada: 'É OFICIAL: VOCÊS PASSARAM! 🎉', sub: 'Cada nome aqui é uma conquista. Orgulho do SEI! 💙', balao: 'Eu sabia que vocês conseguiam! 😄', modo: 'geral', tam: 2, ori: 'p', fundo: 'festa', turmas: [] };
  try { const s = JSON.parse(localStorage.getItem(CHAVE) || 'null'); if (s) st = Object.assign(st, s); } catch (e) {}
  if (st.sub === 'Parabéns pela conquista!') st.sub = 'Cada nome aqui é uma conquista. Orgulho do SEI! 💙';
  const guardar = () => { try { localStorage.setItem(CHAVE, JSON.stringify(st)); } catch (e) {} };
  const nomesDe = t => (t.nomes || '').split(/\r?\n/).map(s => s.replace(/^\s*\d+[\s.)-]*/, '').trim()).filter(Boolean);
  const MARCA = /\s*(\*+|\(10\)|⭐\s*10|⭐|nota\s*10)\s*$/i;
  const itensDe = t => nomesDe(t).map(x => ({ n: x.replace(MARCA, '').trim(), dez: MARCA.test(x) })).filter(x => x.n);

  /* ---------- medidas ---------- */
  function medidas() {
    const [, c0, r0, o0] = TAM[st.tam] || TAM[2]; const deitado = st.ori === 'l';
    const c = deitado ? r0 : c0, r = deitado ? c0 : r0, o = deitado ? (o0 === 'p' ? 'l' : 'p') : o0;
    const tw = (o === 'p' ? 210 : 297) - 2 * M, th = (o === 'p' ? 297 : 210) - 2 * M;
    return { c, r, o, tw, th, W: c * tw, H: r * th };
  }

  /* ---------- o cartaz ---------- */
  function confete(W, H, n) { let s = 7, h = ''; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280; const cs = ['#ffd34d', '#ff7aa8', '#7ff0ff', '#9cff8a', '#ffffff', '#ffb74d'];
    for (let i = 0; i < n; i++) { const x = rnd() * W, y = rnd() * H * .3, w = Math.min(W, H) * (.006 + rnd() * .01); h += `<i style="position:absolute;left:${x}mm;top:${y}mm;width:${w}mm;height:${w * 2.2}mm;background:${cs[i % cs.length]};transform:rotate(${rnd() * 180}deg);border-radius:${w * .3}mm;opacity:.85"></i>`; } return h; }
  const NEON = [['#fff35c', '#ffd600'], ['#ff9be8', '#ff2bd6'], ['#8ff8ff', '#00d9ff'], ['#b8ff7a', '#39e600'], ['#ffc46b', '#ff7b00'], ['#d7b8ff', '#9d5cff']];
  const GRITOS = ['Arrasaram! 🚀', 'Turma nota mil! ✨', 'Missão cumprida! ✅', 'Que orgulho! 💙', 'Bora pro próximo! 🔥', 'Vocês brilharam! 🌟', 'Show de turma! 🎉', 'Mandaram bem! 👏'];
  const neonDe = t => NEON[Math.max(0, TURMAS.indexOf(t)) % NEON.length];
  function montar(lista, W, H) {
    const deitado = W > H, s = Math.min(W, H * .78), p = s * .035, festa = st.fundo !== 'leve';
    const hdr = deitado ? Math.min(H * .27, W * .17) : Math.min(H * .22, W * .32), rod = Math.max(H * .045, 9);
    const el = document.createElement('div'); el.className = 'cz ' + (festa ? 'festa' : 'leve') + (lista.length === 1 && st.modo === 'turma' ? ' cz-uma' : '');
    Object.assign(el.style, { width: W + 'mm', height: H + 'mm', padding: `${p * .6}mm ${p}mm ${p * .3}mm` });
    const hm = hdr * .74, hl = hdr * .36, livre = W - 2 * p - hm * 560 / 495 - hl * 533 / 383 - 2 * p * .8 - hl * .1, uma = st.modo === 'turma' && lista.length === 1;
    const tit = Math.min(hdr * .31, livre / (Math.max(5, (st.titulo || 'APROVADOS').length) * .7)), lin = Math.min(hdr * .085, livre / 26);
    const tot = lista.reduce((a, t) => a + t.nomes.length, 0), dez = lista.reduce((a, t) => a + t.nomes.filter(x => x.dez).length, 0);
    const conta = `<span class="cz-conta" style="font-size:${lin * .9}mm;margin-top:${hdr * .05}mm">🎓 <strong>${tot}</strong> aprovado${tot === 1 ? '' : 's'}${dez ? ` &nbsp;·&nbsp; <em>⭐10</em> <strong>${dez}</strong> tiraram nota 10` : ''}</span>`;
    el.innerHTML = `<div class="cz-luz"></div>${festa ? `<div class="cz-conf">${confete(W, H, Math.round(40 + W * H / 4000))}</div>` : ''}
      <div class="cz-cab" style="height:${hdr}mm;gap:${p * .8}mm;${festa ? `margin-bottom:${p * .5}mm` : `margin:-${p * .6}mm -${p}mm ${p * .6}mm;padding:${hdr * .06}mm ${p}mm;box-sizing:content-box;border-bottom-width:${hdr * .035}mm`}">
        <div class="cz-masc" style="height:${hm}mm;width:${hm * 560 / 495}mm"><img src="assets/docs/mascote-sei.png?v=14" alt="" style="height:${hm}mm">
          ${st.balao ? `<div class="cz-balao" style="font-size:${Math.min(lin * .8, hdr * .07)}mm;width:${hm * .62}mm;padding:.4em .55em;border-width:${hdr * .012}mm;left:${hm * .62}mm;top:-${hdr * .02}mm">${esc(st.balao)}</div>` : ''}</div>
        <div class="cz-tit">${st.chamada ? `<span class="cz-chama" style="font-size:${lin}mm;padding:.2em .9em;margin-bottom:${hdr * .04}mm;border-width:${hdr * .01}mm">${esc(st.chamada)}</span>` : ''}
          <b class="cz-grande" style="font-size:${tit}mm">${esc(st.titulo || 'APROVADOS')}</b>
          <span style="margin-top:${hdr * .03}mm">${uma ? `<i class="cz-pill t" style="font-size:${lin * 1.15}mm">${esc(lista[0].turma)}</i> ` : ''}<i class="cz-pill" style="font-size:${lin * 1.15}mm">${esc(st.ano)}</i></span>
          ${st.sub ? `<span class="cz-sub" style="font-size:${Math.min(lin * 1.05, livre / (st.sub.length * .5 + 2))}mm;margin-top:${hdr * .04}mm">${esc(st.sub)}</span>` : ''}${conta}</div>
        <img class="m" src="assets/docs/logo-sei.png" alt="" style="height:${hl}mm;background:#fff;border-radius:${hdr * .08}mm;padding:${hdr * .03}mm">
      </div>
      <div class="cz-corpo"><div class="cz-cols"></div></div>
      <div class="cz-rod" style="height:${rod}mm;font-size:${Math.min(rod * .3, (W - 2 * p) / ((dez ? 118 : 95) * .5))}mm">${dez ? '<em>⭐10</em>&nbsp;= tirou nota 10! &nbsp;·&nbsp; ' : ''}Família SEI 💛 Aqui se faz educação com qualidade &nbsp;·&nbsp; Nos vemos em ${(+st.ano || new Date().getFullYear()) + 1}! 🚀</div>`;
    return { el, p };
  }
  // acha o maior tamanho de letra (e o número de colunas) que faz todos os nomes caberem
  function ajustar(el, p, lista) {
    const cols = el.querySelector('.cz-cols'), corpo = el.querySelector('.cz-corpo'), uma = el.classList.contains('cz-uma'), mb = p * .45;
    cols.style.cssText = `display:flex;gap:${p * .6}mm;align-items:${uma ? 'center' : 'flex-start'};height:100%`;
    const bloco = (t, k, f) => { const n = t.nomes, q = Math.ceil(n.length / k), partes = Array.from({ length: k }, (_, i) => n.slice(i * q, i * q + q)), [cl, cf] = neonDe(t.turma), ix = Math.max(0, TURMAS.indexOf(t.turma)), d = n.filter(x => x.dez).length;
      return `<div class="cz-bloco" style="font-size:${f}mm;margin-bottom:${mb}mm;background:${cl}" data-rot="${[-1.1, .8, -.5, 1.2, -.8, .5][ix % 6]}"><i class="cz-fita"></i><h3 style="font-size:${f * 1.3}mm;padding:.55em .5em .1em">${esc(t.turma)}</h3><p class="cz-grito" style="font-size:${f * .78}mm;color:${cf === '#fff35c' ? '#8a6d00' : '#0b1a4a'}">${GRITOS[ix % GRITOS.length]} · ${n.length} 🎓${d ? ` · ${d} ⭐10` : ''}</p><div style="display:flex;gap:1.2em;padding:.25em .8em .65em;border-top:.12em dashed rgba(11,26,74,.25);margin:0 .5em">${partes.map(ps => `<ol style="flex:1 1 0;min-width:0;padding:0">${ps.map(x => `<li>${esc(x.n)}${x.dez ? '<b class="dez">⭐10</b>' : ''}</li>`).join('')}</ol>`).join('')}</div></div>`; };
    const monta = (f, k) => {
      cols.innerHTML = ''; const nova = () => { const c = document.createElement('div'); c.style.cssText = 'flex:1 1 0;min-width:0'; cols.append(c); return c; };
      if (uma) { nova().innerHTML = bloco(lista[0], k, f); return; }
      const cs = Array.from({ length: k }, nova); cs[0].innerHTML = lista.map(t => bloco(t, 1, f)).join(''); const bs = [...cs[0].children], alt = bs.map(b => b.offsetHeight + 1);
      const parte = cap => { const g = [[]]; let acc = 0; alt.forEach((h, i) => { if (acc && acc + h > cap) { g.push([]); acc = 0; } g[g.length - 1].push(i); acc += h; }); return g; };
      let lo = Math.max(...alt), hi = alt.reduce((a, b) => a + b, 0); while (hi - lo > 1) { const m = (lo + hi) / 2; if (parte(m).length <= k) hi = m; else lo = m; }
      parte(hi).forEach((g, ci) => g.forEach(i => (cs[ci] || cs[k - 1]).append(bs[i])));
    };
    const cabe = () => { const lim = corpo.clientHeight + 1; return [...cols.children].every(c => c.offsetHeight <= lim) && cols.scrollWidth <= cols.clientWidth + 1 && [...el.querySelectorAll('.cz-bloco li')].every(li => li.scrollWidth <= li.clientWidth + 1); };
    let melhor = null; const res = []; const max = Math.min(el.offsetWidth / 96 * 25.4 * .05, 40);
    for (let k = 1; k <= 8; k++) {
      let lo = 1.2, hi = max; monta(lo, k); if (!cabe()) continue;
      for (let i = 0; i < 12; i++) { const m = (lo + hi) / 2; monta(m, k); if (cabe()) lo = m; else hi = m; }
      res.push([lo, k]);
    }
    const fmax = Math.max(0, ...res.map(r => r[0])); melhor = res.filter(r => r[0] >= fmax * (uma ? .9 : .97)).pop() || [1.2, 8]; monta(melhor[0], melhor[1]);
    // sobrou espaço embaixo: abre as linhas para o painel ficar cheio
    const lim = corpo.clientHeight, alto = Math.max(...[...cols.children].map(c => c.offsetHeight));
    if (alto < lim * .97) { let lh = 1.28 * Math.min(1.9, lim / alto); const ols = [...el.querySelectorAll('.cz-bloco ol')]; for (let i = 0; i < 8; i++) { ols.forEach(o => { o.style.lineHeight = lh; }); if ([...cols.children].every(c => c.offsetHeight <= lim)) break; lh = 1.28 + (lh - 1.28) * .8; } if (![...cols.children].every(c => c.offsetHeight <= lim)) ols.forEach(o => { o.style.lineHeight = 1.28; }); }
    el.querySelectorAll('.cz-bloco').forEach(b => { b.style.transform = `rotate(${(+b.dataset.rot || 0) * (uma ? .3 : 1)}deg)`; });
    return melhor;
  }
  const carregar = (g, src) => window[g] ? Promise.resolve() : new Promise((ok, er) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = er; document.head.append(s); });
  async function render(lista, escala) {
    const { W, H } = medidas(); const { el, p } = montar(lista, W, H);
    const fora = document.createElement('div'); Object.assign(fora.style, { position: 'absolute', left: '0', top: '0', zIndex: '-5', pointerEvents: 'none' }); fora.append(el); document.body.append(fora);
    await Promise.all([...el.querySelectorAll('img')].map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; }))); if (document.fonts) { await document.fonts.load('10px SeiRubik'); await document.fonts.load('10px SeiPoppins'); }
    const fit = ajustar(el, p, lista);
    await carregar('html2pdf', 'assets/vendor/html2pdf.bundle.min.js'); await carregar('html2canvas', 'assets/vendor/html2canvas-1.4.1.min.js');
    const pxmm = 96 / 25.4, area = W * H * pxmm * pxmm; const sc = escala || Math.min(150 / 96, Math.sqrt(15.5e6 / area));
    const r = el.getBoundingClientRect(); const canvas = await html2canvas(el, { ignoreElements: n => n.parentElement === document.body && !n.contains(el), scale: sc, useCORS: true, backgroundColor: '#ffffff', logging: false, x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height, windowWidth: Math.max(document.documentElement.clientWidth, Math.ceil(r.width)), windowHeight: Math.max(innerHeight, Math.ceil(r.height)), scrollX: 0, scrollY: 0 });
    fora.remove(); return { canvas, fit, W, H };
  }
  const paineis = () => { const t = st.turmas.map(x => ({ turma: x.turma, nomes: itensDe(x) })).filter(x => x.turma && x.nomes.length); return st.modo === 'turma' ? t.map(x => [x]) : t.length ? [t] : []; };

  /* ---------- PDF em folhas A4 ---------- */
  async function gerarPdf() {
    const ps = paineis(); if (!ps.length) return alert('Coloque pelo menos uma turma com nomes.');
    const bt = $('#lt-pdf'); bt.disabled = true; const t0 = bt.textContent;
    try {
      const md = medidas(); let doc = null, total = 0;
      for (let i = 0; i < ps.length; i++) {
        bt.textContent = `⏳ Montando o painel ${i + 1} de ${ps.length}…`;
        const { canvas } = await render(ps[i]); const nome = ps.length > 1 ? ps[i][0].turma : 'Painel geral';
        if (!doc) doc = await html2pdf().set({ jsPDF: { unit: 'mm', format: 'a4', orientation: 'p' } }).from('<div></div>').toPdf().get('pdf'); else doc.addPage('a4', 'p');
        guia(doc, canvas, md, nome);
        const kx = canvas.width / md.W;
        for (let r = 0; r < md.r; r++) for (let c = 0; c < md.c; c++) {
          doc.addPage('a4', md.o); const pw = md.o === 'p' ? 210 : 297, ph = md.o === 'p' ? 297 : 210;
          const sx = Math.round(c * md.tw * kx), sy = Math.round(r * md.th * kx), sw = Math.round(md.tw * kx), sh = Math.round(md.th * kx);
          const cv = document.createElement('canvas'); cv.width = sw; cv.height = sh; cv.getContext('2d').drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
          doc.addImage(cv.toDataURL('image/jpeg', .9), 'JPEG', M, M, md.tw, md.th, undefined, 'FAST');
          doc.setDrawColor(120); doc.setLineWidth(.2); const L = 5;
          for (const [x, y] of [[M, M], [M + md.tw, M], [M, M + md.th], [M + md.tw, M + md.th]]) { doc.line(x - L - 1, y, x - 1, y); doc.line(x + 1, y, x + L + 1, y); doc.line(x, y - L - 1, x, y - 1); doc.line(x, y + 1, x, y + L + 1); }
          const n = r * md.c + c + 1; doc.setFontSize(8); doc.setTextColor(90); doc.text(`Folha ${n} de ${md.r * md.c}  ·  linha ${r + 1}, coluna ${c + 1}  ·  ${nome}`, pw / 2, ph - 2.5, { align: 'center' }); total++;
        }
      }
      doc.save(`Listao-dos-Aprovados-${st.ano}${st.modo === 'turma' ? '-por-turma' : ''}.pdf`);
      bt.textContent = `✅ PDF pronto: ${total} folhas`; setTimeout(() => { bt.textContent = t0; }, 4000);
    } catch (e) { alert('Não consegui gerar o PDF: ' + (e && e.message || e)); bt.textContent = t0; }
    bt.disabled = false;
  }
  function guia(doc, canvas, md, nome) { // primeira folha: como montar
    doc.setFontSize(18); doc.setTextColor(11, 42, 91); doc.text('Como montar o painel', 105, 20, { align: 'center' });
    doc.setFontSize(11); doc.setTextColor(40); doc.text(`${nome}  ·  ${md.r * md.c} folha(s) A4  ·  painel de ${Math.round(md.W / 10)} × ${Math.round(md.H / 10)} cm`, 105, 28, { align: 'center' });
    const maxW = 150, maxH = 170, k = Math.min(maxW / md.W, maxH / md.H), w = md.W * k, h = md.H * k, x = (210 - w) / 2, y = 36;
    const cv = document.createElement('canvas'); const ks = Math.min(1, 1400 / canvas.width); cv.width = canvas.width * ks; cv.height = canvas.height * ks; cv.getContext('2d').drawImage(canvas, 0, 0, cv.width, cv.height);
    doc.addImage(cv.toDataURL('image/jpeg', .8), 'JPEG', x, y, w, h); doc.setDrawColor(230, 180, 34); doc.setLineWidth(.6);
    for (let c = 1; c < md.c; c++) doc.line(x + w * c / md.c, y, x + w * c / md.c, y + h); for (let r = 1; r < md.r; r++) doc.line(x, y + h * r / md.r, x + w, y + h * r / md.r); doc.rect(x, y, w, h);
    doc.setFontSize(Math.max(10, 22 - md.c * 3)); doc.setTextColor(255, 211, 77);
    for (let r = 0; r < md.r; r++) for (let c = 0; c < md.c; c++) { const cx = x + w * (c + .5) / md.c, cy = y + h * (r + .5) / md.r; doc.setFillColor(11, 42, 91); doc.circle(cx, cy, 5, 'F'); doc.text(String(r * md.c + c + 1), cx, cy + 1.6, { align: 'center' }); }
    const passos = ['1. Imprima em TAMANHO REAL (100%), sem "ajustar à página".', '2. Em cada folha, corte a margem branca seguindo as marcas cinzas dos cantos.', '3. Monte as folhas na ordem dos números acima (o número também está no rodapé de cada folha).', '4. Junte as bordas sem sobrepor e prenda com fita por trás ou cole numa cartolina.'];
    doc.setFontSize(10.5); doc.setTextColor(40); passos.forEach((t, i) => doc.text(t, 22, y + h + 12 + i * 7));
  }

  /* ---------- puxar do cadastro e do diário ---------- */
  async function puxar(turma) {
    const D = window.seiDados; if (!D) return null; const [al, bol] = await Promise.all([D.listar('alunos'), D.listar('boletins')]);
    const lista = al.filter(a => a.turma === turma && (a.situacao || 'Ativo') !== 'Transferido' && a.situacao !== 'Desistente').sort((a, b) => a.nome.localeCompare(b.nome)); let fora = 0, semNota = 0;
    const ok = lista.filter(a => { const b = (((bol.find(x => x.id === a.id) || {}).anos || {})[st.ano]) || {}; const ns = b.notas || {}; if (!Object.keys(ns).length) { semNota++; return true; }
      const rec = Object.values(ns).some(d => d['Recuperação'] !== undefined || d['Recuperação Final'] !== undefined);
      const baixa = Object.values(ns).some(d => { const v = ['1ª Avaliação', '2ª Avaliação', '3ª Avaliação', '4ª Avaliação'].map(k => d[k]).filter(x => x !== undefined); return v.length && v.reduce((s, x) => s + x, 0) / v.length < 6; });
      if (rec || baixa) { fora++; return false; } return true; });
    const dez = a => { const ns = ((((bol.find(x => x.id === a.id) || {}).anos || {})[st.ano]) || {}).notas || {}; return Object.values(ns).some(d => Object.values(d).some(v => +v === 10)); };
    return { nomes: ok.map(a => a.nome + (dez(a) ? ' *' : '')), fora, semNota, total: lista.length };
  }

  /* ---------- tela ---------- */
  function desenhar() {
    const md = medidas();
    $('#lt').innerHTML = `<section class="es-sec"><h2>🏆 Listão dos Aprovados</h2><p class="es-dica">Monte o painel com os alunos <b>aprovados sem recuperação</b>. O site ajusta o tamanho das letras para caber todo mundo e divide o painel em <b>folhas A4</b> numeradas, prontas para imprimir, cortar e montar.</p>
      <form class="es-form" id="lt-f"><div class="es-g3"><label>Chamada (em cima)<input name="chamada" value="${esc(st.chamada)}"></label><label>Título<input name="titulo" value="${esc(st.titulo)}"></label><label>Ano<input name="ano" value="${esc(st.ano)}" inputmode="numeric"></label></div>
      <div class="es-g2"><label>Frase<input name="sub" value="${esc(st.sub)}"></label><label>Balão do mascote<input name="balao" value="${esc(st.balao)}"></label></div>
      <div class="es-g3"><label>Painel<select name="modo"><option value="geral" ${st.modo === 'geral' ? 'selected' : ''}>Um painel com todas as turmas</option><option value="turma" ${st.modo === 'turma' ? 'selected' : ''}>Um painel para cada turma</option></select></label>
      <label>Tamanho<select name="tam">${TAM.map((t, i) => `<option value="${i}" ${i === +st.tam ? 'selected' : ''}>${t[0]}</option>`).join('')}</select></label>
      <label>Posição<select name="ori"><option value="p" ${st.ori === 'p' ? 'selected' : ''}>Em pé</option><option value="l" ${st.ori === 'l' ? 'selected' : ''}>Deitado</option></select></label>
      <label>Fundo<select name="fundo"><option value="festa" ${st.fundo === 'festa' ? 'selected' : ''}>Azul festivo</option><option value="leve" ${st.fundo === 'leve' ? 'selected' : ''}>Branco (gasta menos tinta)</option></select></label></div>
      <p class="es-dica" style="margin:0">📐 Cada painel: <b>${md.c * md.r} folha(s) A4</b> (${md.c} × ${md.r}) · tamanho final <b>${Math.round(md.W / 10)} × ${Math.round(md.H / 10)} cm</b>${st.modo === 'turma' ? ` · ${paineis().length} painel(is)` : ''}.</p></form>
      <h2 style="margin-top:16px">🎓 Turmas e nomes</h2><p class="es-dica">Um nome por linha. Quem tirou <b>nota 10</b>: coloque um <b>*</b> no fim do nome (ex.: <i>Ana Clara Souza *</i>) e ele ganha o selo <b>⭐10</b> no painel. Ao puxar do cadastro, o site marca sozinho quem tem nota 10 no diário.</p><div class="es-acoes"><button class="b main" id="lt-todas">↧ Puxar todas as turmas do cadastro</button><select id="lt-add" class="es-busca" style="flex:0 1 220px"><option value="">➕ Adicionar turma…</option>${TURMAS.filter(t => !st.turmas.some(x => x.turma === t)).map(t => `<option>${t}</option>`).join('')}</select></div>
      <div class="lt-turmas">${st.turmas.map((t, i) => `<div class="lt-turma" style="--c:${corDe(t.turma)}"><div class="es-linha"><b style="color:${corDe(t.turma)};font-size:17px;flex:1">${esc(t.turma)}</b><span class="chip">${nomesDe(t).length} nome(s)${itensDe(t).some(x => x.dez) ? ' · ⭐10 ' + itensDe(t).filter(x => x.dez).length : ''}</span><button class="b" data-puxa="${i}">↧ Puxar do cadastro</button><button class="b" data-tira="${i}" title="Tirar a turma">🗑️</button></div><textarea data-nomes="${i}" placeholder="Um nome por linha. Nota 10: * no fim">${esc(t.nomes)}</textarea></div>`).join('') || '<div class="es-vazio"><b>Nenhuma turma ainda.</b>Adicione as turmas e digite (ou cole) um nome por linha — ou puxe do cadastro da Gestão Escolar.</div>'}</div>
      <div class="es-acoes" style="margin-top:14px"><button class="b" id="lt-ver">👀 Ver prévia</button><button class="b main" id="lt-pdf">📄 Gerar PDF para imprimir</button></div><div id="lt-prev"></div></section>`;
    $('#lt-f').oninput = $('#lt-f').onchange = e => { const f = new FormData($('#lt-f')); const antes = st.modo + st.tam + st.ori; Object.assign(st, { titulo: f.get('titulo'), chamada: f.get('chamada'), balao: f.get('balao'), ano: f.get('ano').trim(), sub: f.get('sub'), modo: f.get('modo'), tam: +f.get('tam'), ori: f.get('ori'), fundo: f.get('fundo') }); guardar(); if (e.type === 'change' && antes !== st.modo + st.tam + st.ori) desenhar(); };
    $$('[data-nomes]').forEach(t => { t.oninput = () => { st.turmas[+t.dataset.nomes].nomes = t.value; guardar(); const tt = st.turmas[+t.dataset.nomes], dz = itensDe(tt).filter(x => x.dez).length; t.closest('.lt-turma').querySelector('.chip').textContent = nomesDe(tt).length + ' nome(s)' + (dz ? ' · ⭐10 ' + dz : ''); }; });
    $('#lt-add').onchange = e => { if (!e.target.value) return; st.turmas.push({ turma: e.target.value, nomes: '' }); st.turmas.sort((a, b) => TURMAS.indexOf(a.turma) - TURMAS.indexOf(b.turma)); guardar(); desenhar(); };
  }
  document.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
    if (d.tira) { if (confirm('Tirar esta turma do painel?')) { st.turmas.splice(+d.tira, 1); guardar(); desenhar(); } return; }
    if (d.puxa) { const t = st.turmas[+d.puxa]; const r = await puxar(t.turma); if (!r || !r.total) return alert('Nenhum aluno do ' + t.turma + ' no cadastro deste aparelho. Cadastre na Gestão Escolar ou digite os nomes.');
      if (t.nomes.trim() && !confirm('Trocar os nomes digitados pelos do cadastro?')) return; t.nomes = r.nomes.join('\n'); guardar(); desenhar();
      alert(`${r.nomes.length} aluno(s) no listão do ${t.turma}.` + (r.fora ? `\n${r.fora} ficaram de fora (recuperação ou média abaixo de 6 no diário).` : '') + (r.semNota ? `\n${r.semNota} sem notas no diário: confira antes de imprimir.` : '')); return; }
    if (b.id === 'lt-todas') { const D = window.seiDados; const al = D ? await D.listar('alunos') : []; const ts = TURMAS.filter(t => al.some(a => a.turma === t)); if (!ts.length) return alert('Nenhum aluno cadastrado neste aparelho. Cadastre na Gestão Escolar ou adicione as turmas e digite os nomes.');
      let fora = 0, sem = 0; for (const t of ts) { const r = await puxar(t); fora += r.fora; sem += r.semNota; const x = st.turmas.find(y => y.turma === t); if (x) x.nomes = r.nomes.join('\n'); else st.turmas.push({ turma: t, nomes: r.nomes.join('\n') }); }
      st.turmas.sort((a, c) => TURMAS.indexOf(a.turma) - TURMAS.indexOf(c.turma)); guardar(); desenhar(); alert(`${ts.length} turma(s) puxada(s).` + (fora ? `\n${fora} aluno(s) ficaram de fora (recuperação ou média abaixo de 6).` : '') + (sem ? `\n${sem} aluno(s) sem notas no diário: confira os nomes.` : '')); return; }
    if (b.id === 'lt-ver') { const ps = paineis(); if (!ps.length) return alert('Coloque pelo menos uma turma com nomes.'); b.disabled = true; b.textContent = '⏳ Montando…';
      const md = medidas(); const { canvas, fit } = await render(ps[0], Math.min(1, 1100 / (md.W * 96 / 25.4))); const g = canvas.getContext('2d'); g.strokeStyle = 'rgba(255,211,77,.9)'; g.setLineDash([12, 8]); g.lineWidth = 3;
      for (let c = 1; c < md.c; c++) { const x = canvas.width * c / md.c; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, canvas.height); g.stroke(); } for (let r = 1; r < md.r; r++) { const y = canvas.height * r / md.r; g.beginPath(); g.moveTo(0, y); g.lineTo(canvas.width, y); g.stroke(); }
      $('#lt-prev').innerHTML = '<div class="lt-prev"></div>'; $('#lt-prev .lt-prev').append(canvas); $('#lt-prev .lt-prev').insertAdjacentHTML('beforeend', `<p>Prévia${ps.length > 1 ? ` do 1º de ${ps.length} painéis` : ''} · as linhas tracejadas mostram onde cada folha A4 termina · letra dos nomes com ${(fit[0] / .3528).toFixed(0)} pt</p>`);
      b.disabled = false; b.textContent = '👀 Ver prévia'; $('#lt-prev').scrollIntoView({ behavior: 'smooth' }); return; }
    if (b.id === 'lt-pdf') return gerarPdf();
  });
  desenhar();
})();
