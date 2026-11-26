/* Listão dos Aprovados: arte no estilo post (cores neon), em folhas A4 para montar ou numa impressão só */
(function () {
  'use strict';
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const TURMAS = ['Maternal', 'Pré I', 'Pré II', '1º ano', '2º ano', '3º ano', '4º ano', '5º ano', '6º ano', '7º ano', '8º ano', '9º ano', '1ª série (Médio)', '2ª série (Médio)', '3ª série (Convênio)', 'Pré-vestibular'];
  // cor clara (fundo dos nomes) e cor forte (faixa da turma), em neon
  const NEON = [['#fff35c', '#ffd600'], ['#ff9be8', '#ff2bd6'], ['#8ff8ff', '#00d9ff'], ['#b8ff7a', '#39e600'], ['#ffc46b', '#ff7b00'], ['#d7b8ff', '#9d5cff']];
  const neonDe = t => NEON[Math.max(0, TURMAS.indexOf(t)) % NEON.length];
  const clarear = (h, k) => { const n = parseInt(h.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v + (255 - v) * k)); return '#' + c.map(v => v.toString(16).padStart(2, '0')).join(''); };
  const GRITOS = ['Arrasaram! 🚀', 'Turma nota mil! ✨', 'Missão cumprida! ✅', 'Que orgulho! 💙', 'Bora pro próximo! 🔥', 'Vocês brilharam! 🌟', 'Show de turma! 🎉', 'Mandaram bem! 👏'];
  // tamanhos: colunas × linhas de folhas A4 e a folha em pé (p) ou deitada (l), para o painel em pé
  const TAM = [['1 folha A4', 1, 1, 'p'], ['2 folhas · A3', 1, 2, 'l'], ['4 folhas · A2', 2, 2, 'p'], ['8 folhas · A1', 2, 4, 'l'], ['9 folhas · 3 × 3', 3, 3, 'p'], ['16 folhas · A0', 4, 4, 'p']];
  const M = 7; // margem de corte em cada folha (mm)
  const CHAVE = 'sei-listao';
  const anoPad = () => { const d = new Date(); return String(d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1); };
  const PADRAO = { titulo: 'APROVADOS', chamada: 'É OFICIAL: VOCÊS PASSARAM! 🎉', sub: 'Cada nome aqui é uma conquista. Orgulho do SEI! 💙', balao: 'Eu sabia que vocês conseguiam! 😄',
    fala1: 'Professores: Vocês arrasaram! 👏', fala2: 'Famílias: Que orgulho de vocês! 💙', tags: '#AprovadosSEI #FamíliaSEI #OrgulhoSEI' };
  let st = Object.assign({ ano: anoPad(), modo: 'geral', tam: 2, ori: 'p', fundo: 'festa', turmas: [] }, PADRAO);
  try { const s = JSON.parse(localStorage.getItem(CHAVE) || 'null'); if (s) st = Object.assign(st, s); } catch (e) {}
  const guardar = () => { try { localStorage.setItem(CHAVE, JSON.stringify(st)); } catch (e) {} };
  const nomesDe = t => (t.nomes || '').split(/\r?\n/).map(s => s.replace(/^\s*\d+[\s.)-]*/, '').replace(/\s*\*+\s*$/, '').trim()).filter(Boolean);

  /* ---------- medidas ---------- */
  function medidas() {
    const [, c0, r0, o0] = TAM[st.tam] || TAM[2]; const deitado = st.ori === 'l';
    const c = deitado ? r0 : c0, r = deitado ? c0 : r0, o = deitado ? (o0 === 'p' ? 'l' : 'p') : o0;
    const pw = o === 'p' ? 210 : 297, ph = o === 'p' ? 297 : 210, tw = pw - 2 * M, th = ph - 2 * M;
    return { c, r, o, pw, ph, tw, th, W: c * tw, H: r * th, Wf: c * pw, Hf: r * ph };
  }

  /* ---------- a arte ---------- */
  // fundo com as disciplinas: Matemática, Português, Ciências, Física, Química, História, Geografia, Inglês, Arte, Ed. Física, Filosofia…
  const DISC = ['π', '📐', '∑', '√x', '➗', 'x²', 'Aa', '📖', '✍️', '🧬', '🔬', '🌱', '⚛️', 'E=mc²', '🧲', '🧪', 'H₂O', '⚗️', '🏛️', '📜', '🌎', '🧭', '🗺️', 'Hello!', 'ABC', '🎨', '🎭', '⚽', '🏅', '💭', '🌳', '🦜', '🎵', '💡', '🔭', 'Δ', '∞', '📊', '🖋️', '🧮'];
  function fundoDisc(W, H, festa) {
    let s = 11, h = ''; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280, base = Math.min(W, H), cel = base * .1, tam = base * .042;
    const cs = festa ? ['#7df9ff', '#ff7ae0', '#fff35c', '#b8ff7a', '#d7b8ff'] : ['#00a7c4', '#d61fb0', '#c9a800', '#2fa800', '#7a3dff']; let i = 0;
    for (let y = -cel * .3; y < H; y += cel) for (let x = -cel * .3; x < W; x += cel) { const t = DISC[i++ % DISC.length], emo = /\p{Extended_Pictographic}/u.test(t), dx = x + rnd() * cel * .55, dy = y + rnd() * cel * .55;
      h += `<span style="position:absolute;left:${dx}mm;top:${dy}mm;font-size:${tam * (emo ? 1 : .8) * (.8 + rnd() * .5)}mm;transform:rotate(${(rnd() - .5) * 40}deg);opacity:${festa ? (emo ? .22 : .38) : (emo ? .14 : .22)};color:${cs[i % cs.length]};font-family:SeiRubik,Arial Black,sans-serif;white-space:nowrap">${t}</span>`; }
    return h;
  }
  function montar(lista, W, H) {
    const deitado = W > H, s = Math.min(W, H * .78), p = s * .035, festa = st.fundo !== 'leve', uma = st.modo === 'turma' && lista.length === 1;
    const topo = s * .075, hero = deitado ? Math.min(H * .3, W * .18) : Math.min(H * .25, W * .36), rod = Math.max(s * .06, 10);
    const el = document.createElement('div'); el.className = 'cz ' + (festa ? 'festa' : 'leve') + (uma ? ' cz-uma' : '');
    Object.assign(el.style, { width: W + 'mm', height: H + 'mm', padding: `0 ${p}mm` });
    const palco = hero * 1.05, livre = W - 2 * p - palco - p, tot = lista.reduce((a, t) => a + t.nomes.length, 0);
    const tit = Math.min(hero * .3, livre / (Math.max(5, (st.titulo || 'APROVADOS').length) * .7)), lin = Math.min(hero * .075, livre / 26);
    const mh = hero * .8, deg = [hero * .1, hero * .16, hero * .07]; // altura do mascote e dos degraus do pódio
    el.innerHTML = `<div class="cz-disc">${fundoDisc(W, H, festa)}</div>
      <div class="cz-topo" style="height:${topo}mm;font-size:${topo * .3}mm;margin:0 -${p}mm;padding:0 ${p}mm">
        <span class="cz-avatar" style="width:${topo * .72}mm;height:${topo * .72}mm"><img src="assets/docs/logo-sei.png" alt="" style="width:80%"></span>
        <span class="cz-perfil"><b>Sistema de Ensino Incentivo 💙</b><small>@_sei01 · São Miguel do Guamá – PA</small></span><span class="cz-pontos">• • •</span></div>
      <div class="cz-hero" style="height:${hero}mm;gap:${p}mm;margin:${p * .35}mm 0 ${p * .45}mm">
        <div class="cz-palco" style="width:${palco}mm;height:${hero}mm">
          <div class="cz-podio" style="height:${deg[1]}mm">${[1, 0, 2].map(k => `<span class="g${k}" style="height:${deg[k]}mm;font-size:${deg[k] * .55}mm">${k + 1}º</span>`).join('')}</div>
          <img class="cz-masc" src="assets/docs/mascote-sei.png?v=14" alt="" style="height:${mh}mm;bottom:${deg[0] - hero * .005}mm">
          <span class="cz-sombra" style="bottom:${deg[0] - hero * .02}mm;width:${mh * .55}mm;height:${hero * .045}mm"></span>
          ${st.balao ? `<div class="cz-balao" style="font-size:${Math.min(lin * .85, hero * .062)}mm;width:${palco * .46}mm;left:${palco * .56}mm;top:${hero * .02}mm">${esc(st.balao)}</div>` : ''}</div>
        <div class="cz-tit">${st.chamada ? `<span class="cz-chama" style="font-size:${lin}mm;margin-bottom:${hero * .035}mm">${esc(st.chamada)}</span>` : ''}
          <b class="cz-grande" style="font-size:${tit}mm">${esc(st.titulo || 'APROVADOS')}</b>
          <span style="margin-top:${hero * .025}mm">${uma ? `<i class="cz-pill t" style="font-size:${lin * 1.15}mm">${esc(lista[0].turma)}</i> ` : ''}<i class="cz-pill" style="font-size:${lin * 1.15}mm">${esc(st.ano)}</i> <i class="cz-pill v" style="font-size:${lin * 1.15}mm">🎓 ${tot} aprovado${tot === 1 ? '' : 's'}</i></span>
          ${st.sub ? `<span class="cz-sub" style="font-size:${Math.min(lin * 1.05, livre / (st.sub.length * .5 + 2))}mm;margin-top:${hero * .035}mm">${esc(st.sub)}</span>` : ''}
          <span class="cz-falas" style="font-size:${Math.min(lin * .85, livre / ((st.fala1 + st.fala2).length * .5 + 6))}mm;margin-top:${hero * .04}mm">${[st.fala1, st.fala2].filter(Boolean).map((f, i) => { const [quem, ...r] = f.split(':'); return `<span class="cz-fala f${i}">${r.length ? `<b>${esc(quem)}</b> ${esc(r.join(':').trim())}` : esc(f)}</span>`; }).join('')}</span></div>
      </div>
      <div class="cz-corpo"><div class="cz-cols"></div></div>
      <div class="cz-acoes" style="height:${rod}mm;font-size:${Math.min(rod * .27, (W - 2 * p) / ((st.tags || '').length * .52 + 62))}mm;margin:0 -${p}mm;padding:0 ${p}mm"><span class="cz-ic">❤️ 💬 ➤</span><span>Curtido por toda a <b>Família SEI</b> 💛 · Nos vemos em ${(+st.ano || new Date().getFullYear()) + 1}! 🚀</span><span class="cz-tags">${esc(st.tags || '')}</span></div>`;
    return { el, p };
  }
  // acha o maior tamanho de letra (e o número de colunas) que faz todos os nomes caberem
  function ajustar(el, p, lista) {
    const cols = el.querySelector('.cz-cols'), corpo = el.querySelector('.cz-corpo'), uma = el.classList.contains('cz-uma'), mb = p * .55;
    cols.style.cssText = `display:flex;gap:${p * .6}mm;align-items:${uma ? 'center' : 'flex-start'};height:100%`;
    const bloco = (t, k, f) => { const n = t.nomes, q = Math.ceil(n.length / k), partes = Array.from({ length: k }, (_, i) => n.slice(i * q, i * q + q)), [cl, cf] = neonDe(t.turma), ix = Math.max(0, TURMAS.indexOf(t.turma)), tint = clarear(cl, .55);
      return `<div class="cz-bloco" style="font-size:${f}mm;margin-bottom:${mb}mm;box-shadow:0 0 .7em ${cf},0 .3em .8em rgba(0,0,0,.35)"><div class="cz-faixa" style="background:linear-gradient(90deg,${cf},${cl})"><h3 style="font-size:${f * 1.3}mm">${esc(t.turma)}</h3><span class="cz-grito" style="font-size:${f * .78}mm">${GRITOS[ix % GRITOS.length]}</span><span class="cz-qt" style="font-size:${f * .78}mm">${n.length} 🎓</span></div><div class="cz-nomes" style="gap:.5em">${partes.map(ps => `<ol style="flex:1 1 0;min-width:0">${ps.map(x => `<li style="background:${tint};border-left-color:${cf}">${esc(x)}</li>`).join('')}</ol>`).join('')}</div></div>`; };
    const monta = (f, k) => {
      cols.innerHTML = ''; const nova = () => { const c = document.createElement('div'); c.style.cssText = 'flex:1 1 0;min-width:0'; cols.append(c); return c; };
      if (uma) { nova().innerHTML = bloco(lista[0], k, f); return; }
      const cs = Array.from({ length: k }, nova); cs[0].innerHTML = lista.map(t => bloco(t, 1, f)).join(''); const bs = [...cs[0].children], alt = bs.map(b => b.offsetHeight + 1);
      const parte = cap => { const g = [[]]; let acc = 0; alt.forEach((h, i) => { if (acc && acc + h > cap) { g.push([]); acc = 0; } g[g.length - 1].push(i); acc += h; }); return g; };
      let lo = Math.max(...alt), hi = alt.reduce((a, b) => a + b, 0); while (hi - lo > 1) { const m = (lo + hi) / 2; if (parte(m).length <= k) hi = m; else lo = m; }
      parte(hi).forEach((g, ci) => g.forEach(i => (cs[ci] || cs[k - 1]).append(bs[i])));
    };
    const cabe = () => { const lim = corpo.clientHeight + 1; return [...cols.children].every(c => c.offsetHeight <= lim) && cols.scrollWidth <= cols.clientWidth + 1 && [...el.querySelectorAll('.cz-bloco li')].every(li => li.scrollWidth <= li.clientWidth + 1); };
    const res = []; const max = Math.min(el.offsetWidth / 96 * 25.4 * .05, 40);
    for (let k = 1; k <= 8; k++) {
      let lo = 1.2, hi = max; monta(lo, k); if (!cabe()) continue;
      for (let i = 0; i < 12; i++) { const m = (lo + hi) / 2; monta(m, k); if (cabe()) lo = m; else hi = m; }
      monta(lo, k); if (!uma && [...cols.children].some(c => !c.children.length)) continue; // coluna vazia: não serve
      res.push([lo, k]);
    }
    const fmax = Math.max(0, ...res.map(r => r[0])), melhor = res.filter(r => r[0] >= fmax * (uma ? .9 : .97)).pop() || [1.2, 8]; monta(melhor[0], melhor[1]);
    // sobrou espaço embaixo: as etiquetas dos nomes ficam mais altas, até o painel ficar cheio
    const lim = corpo.clientHeight, alto = Math.max(...[...cols.children].map(c => c.offsetHeight)), lis = [...el.querySelectorAll('.cz-bloco li')];
    if (alto < lim * .97) { let q = Math.min(3, 1 + (lim / alto - 1) * 2.2); const poe = v => lis.forEach(li => { li.style.paddingTop = li.style.paddingBottom = .12 * v + 'em'; li.style.marginBottom = .22 * v + 'em'; }); const ok = () => [...cols.children].every(c => c.offsetHeight <= lim);
      for (let i = 0; i < 10; i++) { poe(q); if (ok()) break; q = 1 + (q - 1) * .8; } if (!ok()) poe(1); }
    el.querySelectorAll('.cz-grito').forEach(g => { if (g.scrollWidth > g.clientWidth + 1) g.textContent = ''; });
    return melhor;
  }
  const carregar = (g, src) => window[g] ? Promise.resolve() : new Promise((ok, er) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = er; document.head.append(s); });
  async function render(lista, { escala, W, H } = {}) {
    if (!W) ({ W, H } = medidas()); const { el, p } = montar(lista, W, H);
    const fora = document.createElement('div'); Object.assign(fora.style, { position: 'absolute', left: '0', top: '0', zIndex: '-5', pointerEvents: 'none' }); fora.append(el); document.body.append(fora);
    await Promise.all([...el.querySelectorAll('img')].map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; }))); if (document.fonts) { await document.fonts.load('10px SeiRubik'); await document.fonts.load('10px SeiPoppins'); }
    const fit = ajustar(el, p, lista);
    await carregar('html2pdf', 'assets/vendor/html2pdf.bundle.min.js'); await carregar('html2canvas', 'assets/vendor/html2canvas-1.4.1.min.js');
    const pxmm = 96 / 25.4, area = W * H * pxmm * pxmm; const sc = escala || Math.min(150 / 96, Math.sqrt(15.5e6 / area));
    const r = el.getBoundingClientRect(); const canvas = await html2canvas(el, { ignoreElements: n => n.parentElement === document.body && !n.contains(el), scale: sc, useCORS: true, backgroundColor: '#ffffff', logging: false, x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height, windowWidth: Math.max(document.documentElement.clientWidth, Math.ceil(r.width)), windowHeight: Math.max(innerHeight, Math.ceil(r.height)), scrollX: 0, scrollY: 0 });
    fora.remove(); return { canvas, fit, W, H };
  }
  const paineis = () => { const t = st.turmas.map(x => ({ turma: x.turma, nomes: nomesDe(x) })).filter(x => x.turma && x.nomes.length); return st.modo === 'turma' ? t.map(x => [x]) : t.length ? [t] : []; };
  const nomeDe = (ps, i) => ps.length > 1 ? ps[i][0].turma : 'Painel geral';
  const novoPdf = (fmt, o) => html2pdf().set({ jsPDF: { unit: 'mm', format: fmt, orientation: o } }).from('<div></div>').toPdf().get('pdf');
  async function comBotao(id, fn) { const bt = $(id), t0 = bt.textContent; bt.disabled = true; try { await fn(t => { bt.textContent = t; }); } catch (e) { alert('Não consegui gerar: ' + (e && e.message || e)); } bt.disabled = false; setTimeout(() => { bt.textContent = t0; }, 3500); }

  /* ---------- saída 1: folhas A4 para montar ---------- */
  const gerarFolhas = () => comBotao('#lt-pdf', async msg => {
    const ps = paineis(); if (!ps.length) return alert('Coloque pelo menos uma turma com nomes.');
    const md = medidas(); let doc = null, total = 0;
    for (let i = 0; i < ps.length; i++) {
      msg(`⏳ Montando ${i + 1} de ${ps.length}…`); const { canvas } = await render(ps[i]), nome = nomeDe(ps, i);
      if (!doc) doc = await novoPdf('a4', 'p'); else doc.addPage('a4', 'p');
      guia(doc, canvas, md, nome); const kx = canvas.width / md.W;
      for (let r = 0; r < md.r; r++) for (let c = 0; c < md.c; c++) {
        doc.addPage('a4', md.o);
        const sx = Math.round(c * md.tw * kx), sy = Math.round(r * md.th * kx), sw = Math.round(md.tw * kx), sh = Math.round(md.th * kx);
        const cv = document.createElement('canvas'); cv.width = sw; cv.height = sh; cv.getContext('2d').drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
        doc.addImage(cv.toDataURL('image/jpeg', .9), 'JPEG', M, M, md.tw, md.th, undefined, 'FAST');
        doc.setDrawColor(120); doc.setLineWidth(.2); const L = 5;
        for (const [x, y] of [[M, M], [M + md.tw, M], [M, M + md.th], [M + md.tw, M + md.th]]) { doc.line(x - L - 1, y, x - 1, y); doc.line(x + 1, y, x + L + 1, y); doc.line(x, y - L - 1, x, y - 1); doc.line(x, y + 1, x, y + L + 1); }
        doc.setFontSize(8); doc.setTextColor(90); doc.text(`Folha ${r * md.c + c + 1} de ${md.r * md.c}  ·  linha ${r + 1}, coluna ${c + 1}  ·  ${nome}`, md.pw / 2, md.ph - 2.5, { align: 'center' }); total++;
      }
    }
    doc.save(`Listao-dos-Aprovados-${st.ano}${st.modo === 'turma' ? '-por-turma' : ''}-folhas-A4.pdf`); msg(`✅ PDF pronto: ${total} folhas A4`);
  });
  function guia(doc, canvas, md, nome) { // primeira folha: como montar
    doc.setFontSize(18); doc.setTextColor(11, 42, 91); doc.text('Como montar o painel', 105, 20, { align: 'center' });
    doc.setFontSize(11); doc.setTextColor(40); doc.text(`${nome}  ·  ${md.r * md.c} folha(s) A4  ·  painel de ${Math.round(md.W / 10)} × ${Math.round(md.H / 10)} cm`, 105, 28, { align: 'center' });
    const k = Math.min(150 / md.W, 170 / md.H), w = md.W * k, h = md.H * k, x = (210 - w) / 2, y = 36;
    const cv = document.createElement('canvas'); const ks = Math.min(1, 1400 / canvas.width); cv.width = canvas.width * ks; cv.height = canvas.height * ks; cv.getContext('2d').drawImage(canvas, 0, 0, cv.width, cv.height);
    doc.addImage(cv.toDataURL('image/jpeg', .8), 'JPEG', x, y, w, h); doc.setDrawColor(230, 180, 34); doc.setLineWidth(.6);
    for (let c = 1; c < md.c; c++) doc.line(x + w * c / md.c, y, x + w * c / md.c, y + h); for (let r = 1; r < md.r; r++) doc.line(x, y + h * r / md.r, x + w, y + h * r / md.r); doc.rect(x, y, w, h);
    doc.setFontSize(Math.max(10, 22 - md.c * 3)); doc.setTextColor(255, 211, 77);
    for (let r = 0; r < md.r; r++) for (let c = 0; c < md.c; c++) { const cx = x + w * (c + .5) / md.c, cy = y + h * (r + .5) / md.r; doc.setFillColor(11, 42, 91); doc.circle(cx, cy, 5, 'F'); doc.text(String(r * md.c + c + 1), cx, cy + 1.6, { align: 'center' }); }
    const passos = ['1. Imprima em TAMANHO REAL (100%), sem "ajustar à página".', '2. Em cada folha, corte a margem branca seguindo as marcas cinzas dos cantos.', '3. Monte as folhas na ordem dos números acima (o número também está no rodapé de cada folha).', '4. Junte as bordas sem sobrepor e prenda com fita por trás ou cole numa cartolina.'];
    doc.setFontSize(10.5); doc.setTextColor(40); passos.forEach((t, i) => doc.text(t, 22, y + h + 12 + i * 7));
  }

  /* ---------- saída 2: a arte inteira numa impressão só ---------- */
  const gerarArte = () => comBotao('#lt-arte', async msg => {
    const ps = paineis(); if (!ps.length) return alert('Coloque pelo menos uma turma com nomes.');
    const md = medidas(), o = md.Wf > md.Hf ? 'l' : 'p'; let doc = null;
    for (let i = 0; i < ps.length; i++) { msg(`⏳ Montando ${i + 1} de ${ps.length}…`); const { canvas } = await render(ps[i], { W: md.Wf, H: md.Hf });
      if (!doc) doc = await novoPdf([md.Wf, md.Hf], o); else doc.addPage([md.Wf, md.Hf], o);
      doc.addImage(canvas.toDataURL('image/jpeg', .92), 'JPEG', 0, 0, md.Wf, md.Hf, undefined, 'FAST'); }
    doc.save(`Listao-dos-Aprovados-${st.ano}${st.modo === 'turma' ? '-por-turma' : ''}-arte-${Math.round(md.Wf / 10)}x${Math.round(md.Hf / 10)}cm.pdf`); msg('✅ Arte pronta');
  });
  /* ---------- saída 3: imagem para postar ---------- */
  const gerarImagem = () => comBotao('#lt-png', async msg => {
    const ps = paineis(); if (!ps.length) return alert('Coloque pelo menos uma turma com nomes.');
    const md = medidas();
    for (let i = 0; i < ps.length; i++) { msg(`⏳ Imagem ${i + 1} de ${ps.length}…`); const { canvas } = await render(ps[i], { W: md.Wf, H: md.Hf, escala: Math.min(2, 2200 / (md.Wf * 96 / 25.4)) });
      const blob = await new Promise(ok => canvas.toBlob(ok, 'image/png')); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `Aprovados-${st.ano}-${nomeDe(ps, i).replace(/[^\wÀ-ú]+/g, '-')}.png`; document.body.append(a); a.click(); a.remove(); await new Promise(r => setTimeout(r, 600)); }
    msg('✅ Imagem pronta');
  });

  /* ---------- puxar do cadastro e do diário ---------- */
  async function puxar(turma) {
    const D = window.seiDados; if (!D) return null; const [al, bol] = await Promise.all([D.listar('alunos'), D.listar('boletins')]);
    const lista = al.filter(a => a.turma === turma && (a.situacao || 'Ativo') !== 'Transferido' && a.situacao !== 'Desistente').sort((a, b) => a.nome.localeCompare(b.nome)); let fora = 0, semNota = 0;
    const ok = lista.filter(a => { const b = (((bol.find(x => x.id === a.id) || {}).anos || {})[st.ano]) || {}; const ns = b.notas || {}; if (!Object.keys(ns).length) { semNota++; return true; }
      const rec = Object.values(ns).some(d => d['Recuperação'] !== undefined || d['Recuperação Final'] !== undefined);
      const baixa = Object.values(ns).some(d => { const v = ['1ª Avaliação', '2ª Avaliação', '3ª Avaliação', '4ª Avaliação'].map(k => d[k]).filter(x => x !== undefined); return v.length && v.reduce((s, x) => s + x, 0) / v.length < 6; });
      if (rec || baixa) { fora++; return false; } return true; });
    return { nomes: ok.map(a => a.nome), fora, semNota, total: lista.length };
  }

  /* ---------- tela ---------- */
  function desenhar() {
    const md = medidas(), n = paineis().length;
    $('#lt').innerHTML = `<section class="es-sec"><h2>🏆 Listão dos Aprovados</h2><p class="es-dica">É só colocar os nomes: a arte se ajusta sozinha à quantidade de alunos de cada turma, sem perder o formato. Saem as duas versões: <b>folhas A4 para montar</b> e a <b>arte inteira numa impressão só</b> (gráfica ou impressora grande).</p>
      <form class="es-form" id="lt-f"><div class="es-g3"><label>Chamada (em cima)<input name="chamada" value="${esc(st.chamada)}"></label><label>Título<input name="titulo" value="${esc(st.titulo)}"></label><label>Ano<input name="ano" value="${esc(st.ano)}" inputmode="numeric"></label></div>
      <div class="es-g2"><label>Frase<input name="sub" value="${esc(st.sub)}"></label><label>Balão do mascote<input name="balao" value="${esc(st.balao)}"></label><label>Comentário 1 (quem: mensagem)<input name="fala1" value="${esc(st.fala1)}"></label><label>Comentário 2 (quem: mensagem)<input name="fala2" value="${esc(st.fala2)}"></label></div>
      <label>Hashtags<input name="tags" value="${esc(st.tags)}"></label>
      <div class="es-g3"><label>Painel<select name="modo"><option value="geral" ${st.modo === 'geral' ? 'selected' : ''}>Um painel com todas as turmas</option><option value="turma" ${st.modo === 'turma' ? 'selected' : ''}>Um painel para cada turma</option></select></label>
      <label>Tamanho<select name="tam">${TAM.map((t, i) => `<option value="${i}" ${i === +st.tam ? 'selected' : ''}>${t[0]}</option>`).join('')}</select></label>
      <label>Posição<select name="ori"><option value="p" ${st.ori === 'p' ? 'selected' : ''}>Em pé</option><option value="l" ${st.ori === 'l' ? 'selected' : ''}>Deitado</option></select></label>
      <label>Fundo<select name="fundo"><option value="festa" ${st.fundo === 'festa' ? 'selected' : ''}>Neon (fundo escuro)</option><option value="leve" ${st.fundo === 'leve' ? 'selected' : ''}>Claro (gasta menos tinta)</option></select></label></div>
      <p class="es-dica" style="margin:0">📐 <b>Folhas A4:</b> ${md.c * md.r} folha(s) por painel (${md.c} × ${md.r}), painel montado de ${Math.round(md.W / 10)} × ${Math.round(md.H / 10)} cm · <b>Impressão só:</b> arte de ${Math.round(md.Wf / 10)} × ${Math.round(md.Hf / 10)} cm${st.modo === 'turma' ? ` · ${n} painel(is)` : ''}.</p>
      <div class="es-acoes" style="margin:0"><button type="button" class="b" id="lt-padrao">↺ Voltar os textos ao padrão</button></div></form>
      <h2 style="margin-top:16px">🎓 Turmas e nomes</h2><p class="es-dica">Um nome por linha. A quantidade pode mudar à vontade: o site recalcula o tamanho das letras.</p><div class="es-acoes"><button class="b main" id="lt-todas">↧ Puxar todas as turmas do cadastro</button><select id="lt-add" class="es-busca" style="flex:0 1 220px"><option value="">➕ Adicionar turma…</option>${TURMAS.filter(t => !st.turmas.some(x => x.turma === t)).map(t => `<option>${t}</option>`).join('')}</select></div>
      <div class="lt-turmas">${st.turmas.map((t, i) => `<div class="lt-turma" style="--c:${neonDe(t.turma)[1]}"><div class="es-linha"><b style="font-size:17px;flex:1">${esc(t.turma)}</b><span class="chip">${nomesDe(t).length} nome(s)</span><button class="b" data-puxa="${i}">↧ Puxar do cadastro</button><button class="b" data-tira="${i}" title="Tirar a turma">🗑️</button></div><textarea data-nomes="${i}" placeholder="Um nome por linha">${esc(t.nomes)}</textarea></div>`).join('') || '<div class="es-vazio"><b>Nenhuma turma ainda.</b>Adicione as turmas e digite (ou cole) um nome por linha — ou puxe do cadastro da Gestão Escolar.</div>'}</div>
      <div class="es-acoes" style="margin-top:14px"><button class="b" id="lt-ver">👀 Ver prévia</button><button class="b main" id="lt-pdf">🧩 PDF em folhas A4 (para montar)</button><button class="b main" id="lt-arte">🖼️ Arte inteira (uma impressão só)</button><button class="b" id="lt-png">📱 Imagem para postar</button></div><div id="lt-prev"></div></section>`;
    $('#lt-f').oninput = $('#lt-f').onchange = e => { const f = new FormData($('#lt-f')); const antes = st.modo + st.tam + st.ori; Object.assign(st, { titulo: f.get('titulo'), chamada: f.get('chamada'), balao: f.get('balao'), fala1: f.get('fala1'), fala2: f.get('fala2'), tags: f.get('tags'), ano: f.get('ano').trim(), sub: f.get('sub'), modo: f.get('modo'), tam: +f.get('tam'), ori: f.get('ori'), fundo: f.get('fundo') }); guardar(); if (e.type === 'change' && antes !== st.modo + st.tam + st.ori) desenhar(); };
    $$('[data-nomes]').forEach(t => { t.oninput = () => { st.turmas[+t.dataset.nomes].nomes = t.value; guardar(); t.closest('.lt-turma').querySelector('.chip').textContent = nomesDe(st.turmas[+t.dataset.nomes]).length + ' nome(s)'; }; });
    $('#lt-add').onchange = e => { if (!e.target.value) return; st.turmas.push({ turma: e.target.value, nomes: '' }); st.turmas.sort((a, b) => TURMAS.indexOf(a.turma) - TURMAS.indexOf(b.turma)); guardar(); desenhar(); };
  }
  document.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
    if (b.id === 'lt-padrao') { Object.assign(st, PADRAO); guardar(); return desenhar(); }
    if (d.tira) { if (confirm('Tirar esta turma do painel?')) { st.turmas.splice(+d.tira, 1); guardar(); desenhar(); } return; }
    if (d.puxa) { const t = st.turmas[+d.puxa]; const r = await puxar(t.turma); if (!r || !r.total) return alert('Nenhum aluno do ' + t.turma + ' no cadastro deste aparelho. Cadastre na Gestão Escolar ou digite os nomes.');
      if (t.nomes.trim() && !confirm('Trocar os nomes digitados pelos do cadastro?')) return; t.nomes = r.nomes.join('\n'); guardar(); desenhar();
      alert(`${r.nomes.length} aluno(s) no listão do ${t.turma}.` + (r.fora ? `\n${r.fora} ficaram de fora (recuperação ou média abaixo de 6 no diário).` : '') + (r.semNota ? `\n${r.semNota} sem notas no diário: confira antes de imprimir.` : '')); return; }
    if (b.id === 'lt-todas') { const D = window.seiDados; const al = D ? await D.listar('alunos') : []; const ts = TURMAS.filter(t => al.some(a => a.turma === t)); if (!ts.length) return alert('Nenhum aluno cadastrado neste aparelho. Cadastre na Gestão Escolar ou adicione as turmas e digite os nomes.');
      let fora = 0, sem = 0; for (const t of ts) { const r = await puxar(t); fora += r.fora; sem += r.semNota; const x = st.turmas.find(y => y.turma === t); if (x) x.nomes = r.nomes.join('\n'); else st.turmas.push({ turma: t, nomes: r.nomes.join('\n') }); }
      st.turmas.sort((a, c) => TURMAS.indexOf(a.turma) - TURMAS.indexOf(c.turma)); guardar(); desenhar(); alert(`${ts.length} turma(s) puxada(s).` + (fora ? `\n${fora} aluno(s) ficaram de fora (recuperação ou média abaixo de 6).` : '') + (sem ? `\n${sem} aluno(s) sem notas no diário: confira os nomes.` : '')); return; }
    if (b.id === 'lt-ver') { const ps = paineis(); if (!ps.length) return alert('Coloque pelo menos uma turma com nomes.'); b.disabled = true; b.textContent = '⏳ Montando…';
      try { const md = medidas(); const { canvas, fit } = await render(ps[0], { escala: Math.min(1, 1100 / (md.W * 96 / 25.4)) }); const g = canvas.getContext('2d'); g.strokeStyle = 'rgba(255,211,77,.9)'; g.setLineDash([12, 8]); g.lineWidth = 3;
        for (let c = 1; c < md.c; c++) { const x = canvas.width * c / md.c; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, canvas.height); g.stroke(); } for (let r = 1; r < md.r; r++) { const y = canvas.height * r / md.r; g.beginPath(); g.moveTo(0, y); g.lineTo(canvas.width, y); g.stroke(); }
        $('#lt-prev').innerHTML = '<div class="lt-prev"></div>'; $('#lt-prev .lt-prev').append(canvas); $('#lt-prev .lt-prev').insertAdjacentHTML('beforeend', `<p>Prévia${ps.length > 1 ? ` do 1º de ${ps.length} painéis` : ''} · as linhas tracejadas mostram onde cada folha A4 termina · letra dos nomes com ${(fit[0] / .3528).toFixed(0)} pt</p>`);
        $('#lt-prev').scrollIntoView({ behavior: 'smooth' }); } catch (er) { alert('Não consegui montar a prévia: ' + er.message); }
      b.disabled = false; b.textContent = '👀 Ver prévia'; return; }
    if (b.id === 'lt-pdf') return gerarFolhas();
    if (b.id === 'lt-arte') return gerarArte();
    if (b.id === 'lt-png') return gerarImagem();
  });
  desenhar();
})();
