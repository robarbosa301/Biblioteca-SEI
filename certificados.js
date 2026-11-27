/* Certificados (Aluno Nota 10 e Aluno Destaque/AEE) e medalhas — arte nova da escola, estilo post */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const TIPOS = {
    nota10: { rotulo: 'ALUNO NOTA 10', emoji: '⭐', grande: 'NOTA 10', cor: '#ffd600', cor2: '#ffb300', texto2: '#0b1a4a', claro: 'rgba(255,214,0,.35)', painel: 'linear-gradient(180deg,#fff8a6 0,#ffe11a 45%,#ffb800 100%)', brilho: '#ffd600', balao: 'Você é demais! 🌟',
      texto: 'Você mandou muito bem no {BIMESTRE} bimestre de {ANO} e conquistou a nota máxima! 🎉 Sua dedicação inspira a gente. Continue brilhando: o SEI tem muito orgulho de você!' },
    destaque: { rotulo: 'ALUNO DESTAQUE', emoji: '🧩', pecas: true, grande: 'DESTAQUE', cor: '#5dff4a', cor2: '#00c853', texto2: '#06183f', claro: 'rgba(93,255,74,.32)', painel: 'linear-gradient(180deg,#d6ffb8 0,#6dff52 45%,#00c853 100%)', brilho: '#5dff4a', balao: 'Cada jeito de aprender é especial! 🧩',
      texto: 'Cada conquista sua no {BIMESTRE} bimestre de {ANO} mostrou garra, esforço e coragem. 💙 Você é destaque e inspira toda a Família SEI. Siga em frente: a gente acredita em você!' },
    aprovado: { rotulo: 'ALUNO APROVADO', emoji: '🎓', grande: 'APROVADO', cor: '#ff9a1f', cor2: '#ff6a00', texto2: '#0b1a4a', claro: 'rgba(255,154,31,.32)', painel: 'linear-gradient(180deg,#ffe0b0 0,#ffb347 45%,#ff7a00 100%)', brilho: '#ff9a1f', balao: 'Partiu próxima série! 🚀', anual: true,
      texto: 'Parabéns, você foi aprovado(a) no ano letivo de {ANO}! 🎓 Foi um ano de esforço e conquistas. Agora é comemorar e seguir em frente: a Família SEI tem orgulho de você!' }
  };
  const TIPOS_L = ['nota10', 'destaque', 'aprovado'];
  const CHAVE = 'sei-certificados2';
  let st = { bim: '3º', ano: String(new Date().getFullYear()), nota10: '', destaque: '', aprovado: '', txt_nota10: TIPOS.nota10.texto, txt_destaque: TIPOS.destaque.texto, txt_aprovado: TIPOS.aprovado.texto, tamMed: 33 };
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
  // medalha "Nº 1 em aprovação": a mão fazendo o número 1, com o lema ao redor (SVG convertido em PNG)
  const UM = (() => { const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 320"><defs>
      <linearGradient id="o" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff8c4"/><stop offset=".35" stop-color="#ffd21f"/><stop offset=".7" stop-color="#e39a00"/><stop offset="1" stop-color="#ffe680"/></linearGradient>
      <linearGradient id="pele" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#f3f7ff"/><stop offset="1" stop-color="#c9d8f5"/></linearGradient><radialGradient id="c" cx=".5" cy=".4" r=".6"><stop offset="0" stop-color="#2f7bff"/><stop offset=".7" stop-color="#0b2a8a"/><stop offset="1" stop-color="#061650"/></radialGradient>
      <path id="cima" d="M44 122 A76 76 0 0 1 196 122"/><path id="baixo" d="M36 122 A84 84 0 0 0 204 122"/></defs>
      <path d="M92 196 L54 316 L80 300 L94 318 L130 206Z" fill="#00d9ff" stroke="#0b2a6b" stroke-width="3"/><path d="M148 196 L186 316 L160 300 L146 318 L110 206Z" fill="#1e6bff" stroke="#0b2a6b" stroke-width="3"/>
      <polygon points="120.0,10.0 130.7,20.6 143.3,12.4 151.5,25.0 165.6,19.7 171.0,33.7 185.8,31.4 188.3,46.2 203.2,47.1 202.5,62.0 217.0,66.0 213.2,80.5 226.5,87.4 219.8,100.8 231.4,110.3 222.0,122.0 231.4,133.7 219.8,143.2 226.5,156.6 213.2,163.5 217.0,178.0 202.5,182.0 203.2,196.9 188.3,197.8 185.8,212.6 171.0,210.3 165.6,224.3 151.5,219.0 143.3,231.6 130.7,223.4 120.0,234.0 109.3,223.4 96.7,231.6 88.5,219.0 74.4,224.3 69.0,210.3 54.2,212.6 51.7,197.8 36.8,196.9 37.5,182.0 23.0,178.0 26.8,163.5 13.5,156.6 20.2,143.2 8.6,133.7 18.0,122.0 8.6,110.3 20.2,100.8 13.5,87.4 26.8,80.5 23.0,66.0 37.5,62.0 36.8,47.1 51.7,46.2 54.2,31.4 69.0,33.7 74.4,19.7 88.5,25.0 96.7,12.4 109.3,20.6" fill="url(#o)" stroke="#9a6a00" stroke-width="3"/>
      <circle cx="120" cy="122" r="96" fill="url(#c)" stroke="#fff3a8" stroke-width="4"/>
      <circle cx="120" cy="122" r="60" fill="none" stroke="#ffd21f" stroke-width="3" stroke-dasharray="2 5"/>
      <g transform="translate(121 124) scale(1.16) translate(-46 -49)">
        <g transform="translate(1.8 2.6)" fill="#061650" opacity=".45"><path d="M28.5 47 C27 34 26.5 20 28.5 13.5 C30.5 8 40 8 42 13.5 C44 20 44.5 34 42.5 46 L73 70 C69 82 59 87 46 87.5 C32 88 20.5 81.5 17 70 C14 60 17 48 27.5 45.5Z"/><ellipse cx="73.5" cy="60" rx="7" ry="8.5"/><ellipse cx="65" cy="52.5" rx="7.8" ry="10.5"/><ellipse cx="53.5" cy="47" rx="9" ry="14"/></g>
        <g fill="url(#pele)" stroke="#0b1a4a" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round">
        <path d="M28.5 47 C27 34 26.5 20 28.5 13.5 C30.5 8 40 8 42 13.5 C44 20 44.5 34 42.5 46"/>
        <path d="M27.5 45.5 C17 48 14 60 17 70 C20.5 81.5 32 88 46 87.5 C59 87 69 82 73 70 L50 56 Z"/>
        <ellipse cx="73.5" cy="60" rx="7" ry="8.5" transform="rotate(-20 73.5 60)"/><ellipse cx="65" cy="52.5" rx="7.8" ry="10.5" transform="rotate(-12 65 52.5)"/><ellipse cx="53.5" cy="47" rx="9" ry="14" transform="rotate(-6 53.5 47)"/>
        <path d="M17.5 66 C15 55 20 47 30 45.5 C38 44.5 45 47 45.5 52 C46 57 40 60 35.5 61.5 C40 63 44 68 44.5 76"/><path d="M35.5 61.5 C39.5 63 43.5 68 44.5 76" fill="none"/></g>
        <g fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" opacity=".95"><path d="M31.5 16 C30.8 24 30.8 32 31.5 38"/><path d="M48.5 38 C47.8 42 48 46 48.8 49"/><path d="M21.5 58 C20.5 63 21 68 23 72"/></g>
        <g fill="none" stroke="#8fa8d8" stroke-width="1.4" stroke-linecap="round"><path d="M31 41 C34 42.5 38 42.5 41 41"/><path d="M60.5 46 C62 48 62 50 61 52"/><path d="M70 55 C71 56.5 71 58 70 59.5"/></g></g></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); })();
  let umPng = null;
  const prepararUm = () => umPng ? Promise.resolve(umPng) : new Promise(ok => { const im = new Image(); im.onload = async () => {
    try { if (document.fonts) await document.fonts.load('60px SeiRubik'); } catch (e) {}
    const K = 4, c = document.createElement('canvas'); c.width = 240 * K; c.height = 320 * K; const g = c.getContext('2d'); g.drawImage(im, 0, 0, c.width, c.height);
    const ouro = (y0, y1) => { const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, '#fffbe0'); gr.addColorStop(.45, '#ffd84a'); gr.addColorStop(.75, '#e8a300'); gr.addColorStop(1, '#fff0a0'); return gr; };
    const letra = (ch, x, y, ang, px, fill) => { g.save(); g.translate(x, y); g.rotate(ang); g.font = `${px}px SeiRubik, "Arial Black", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
      g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = px * .18; g.shadowOffsetY = px * .06; g.lineWidth = px * .2; g.strokeStyle = '#061650'; g.strokeText(ch, 0, 0); g.shadowColor = 'transparent'; g.fillStyle = fill(px); g.fillText(ch, 0, 0); g.restore(); };
    const arco = (txt, cx, cy, r, px, cima, fill, esp = 1.06) => { g.font = `${px}px SeiRubik, "Arial Black", sans-serif`; const ws = [...txt].map(ch => g.measureText(ch).width * esp), tot = ws.reduce((a, b) => a + b, 0); let a = -tot / r / 2;
      [...txt].forEach((ch, k) => { const m = a + ws[k] / 2 / r; if (cima) letra(ch, cx + r * Math.sin(m), cy - r * Math.cos(m), m, px, fill); else letra(ch, cx + r * Math.sin(m), cy + r * Math.cos(m), -m, px, fill); a += ws[k] / r; }); };
    // "Nº 1 EM APROVAÇÃO" contornando o círculo
    arco('Nº 1 EM APROVAÇÃO', 120 * K, 122 * K, 79 * K, 17 * K, true, px => ouro(-px / 2, px / 2));
    // faixa "HONRA AO MÉRITO" cruzando a medalha
    const fy = 196 * K, R = 520 * K, fcy = fy - R, larg = 196 * K, alt = 26 * K;
    const curva = (dy) => { g.beginPath(); for (let t = -1; t <= 1.0001; t += .05) { const x = 120 * K + t * larg / 2, y = fcy + Math.sqrt(R * R - (x - 120 * K) ** 2) + dy; t === -1 ? g.moveTo(x, y) : g.lineTo(x, y); } };
    for (const lado of [-1, 1]) { const x0 = 120 * K + lado * (larg / 2 - 4 * K), yb = fcy + Math.sqrt(R * R - (larg / 2) ** 2) + 5 * K, a2 = alt / 2;
      g.beginPath(); g.moveTo(x0, yb - a2); g.lineTo(x0 + lado * 24 * K, yb - a2); g.lineTo(x0 + lado * 15 * K, yb); g.lineTo(x0 + lado * 24 * K, yb + a2); g.lineTo(x0, yb + a2); g.closePath();
      const gt = g.createLinearGradient(0, yb - a2, 0, yb + a2); gt.addColorStop(0, '#1e4fb8'); gt.addColorStop(1, '#061650'); g.fillStyle = gt; g.fill(); g.lineWidth = 1.3 * K; g.strokeStyle = '#ffd21f'; g.stroke(); }
    g.save(); curva(-alt / 2); for (let t = 1; t >= -1.0001; t -= .05) { const x = 120 * K + t * larg / 2, y = fcy + Math.sqrt(R * R - (x - 120 * K) ** 2) + alt / 2; g.lineTo(x, y); } g.closePath();
    const fb = g.createLinearGradient(0, fy - alt, 0, fy + alt); fb.addColorStop(0, '#2f7bff'); fb.addColorStop(.5, '#1240b8'); fb.addColorStop(1, '#0b2a8a'); g.fillStyle = fb; g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 6 * K; g.shadowOffsetY = 2 * K; g.fill(); g.shadowColor = 'transparent'; g.lineWidth = 2.6 * K / 2; g.strokeStyle = '#ffd21f'; g.stroke(); g.restore();
    arco('HONRA AO MÉRITO', 120 * K, fcy, R - 1.2 * K, 14.5 * K, false, px => ouro(-px / 2, px / 2), 1.04);
    umPng = c.toDataURL('image/png'); ok(umPng); }; im.onerror = () => ok(UM); im.src = UM; });
  function confete() { let s = 3, h = ''; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280, cs = ['#ffd600', '#00d9ff', '#ffffff', '#4f8bff', '#7df9ff', '#ffe600'];
    for (let i = 0; i < 46; i++) { const lado = i % 2, x = lado ? 196 + rnd() * 80 : 6 + rnd() * 80, y = 14 + rnd() * 46, w = 1.2 + rnd() * 1.6; h += `<i style="left:${x}mm;top:${y}mm;width:${w}mm;height:${w * 2.4}mm;background:${cs[i % cs.length]};transform:rotate(${rnd() * 180}deg)"></i>`; }
    return h; }
  // peças de quebra-cabeça coloridas (símbolo da inclusão) para o Aluno Destaque do AEE
  const PECA_D = 'M20 30 H40 C36 22 40 14 50 14 C60 14 64 22 60 30 H80 V50 C88 46 96 50 96 60 C96 70 88 74 80 70 V90 H60 C64 82 60 74 50 74 C40 74 36 82 40 90 H20 V70 C12 74 4 70 4 60 C4 50 12 46 20 50 Z';
  const pecaPng = {};
  const desenhaPeca = c => pecaPng[c] || (pecaPng[c] = (() => { const k = 3, cv = document.createElement('canvas'); cv.width = cv.height = 100 * k; const g = cv.getContext('2d'); g.scale(k, k); const p = new Path2D(PECA_D);
    g.fillStyle = c; g.fill(p); g.lineWidth = 4; g.lineJoin = 'round'; g.strokeStyle = '#ffffff'; g.stroke(p); const gr = g.createLinearGradient(0, 14, 0, 90); gr.addColorStop(0, 'rgba(255,255,255,.35)'); gr.addColorStop(.5, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fill(p); return cv.toDataURL('image/png'); })());
  function pecas() { let s = 7, h = ''; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280, cs = ['#ff3b3b', '#ffd600', '#00c853', '#00b8ff', '#ff7a00', '#9d5cff'];
    for (let i = 0; i < 16; i++) { const lado = i % 2, x = lado ? 198 + rnd() * 74 : 12 + rnd() * 70, y = 12 + rnd() * 46, w = 8.5 + rnd() * 5; h += `<img alt="" src="${desenhaPeca(cs[i % cs.length])}" style="position:absolute;left:${x}mm;top:${y}mm;width:${w}mm;height:${w}mm;transform:rotate(${rnd() * 360}deg);opacity:.92;filter:drop-shadow(0 .4mm .6mm rgba(0,0,0,.35))">`; }
    return h; }
  // folha do certificado (A4 deitada, em mm). semTexto: só a arte, para o fundo do Word
  function certificado(tipo, nome, semTexto) {
    const T = TIPOS[tipo], el = document.createElement('div'), nm = bonito(nome), some = semTexto ? ' style="visibility:hidden"' : ''; el.className = 'ct-art';
    el.innerHTML = `<div class="ca-bg"></div><div class="ca-vinheta"></div><div class="ca-conf">${T.pecas ? pecas() : confete()}</div><div class="ca-linha"></div>
      <img class="ca-logo" src="assets/docs/logo-sei.png" alt="">
      <span class="ca-chip" style="background:${T.cor};color:${T.texto2}">${T.anual ? 'ANO LETIVO' : esc(st.bim) + ' BIMESTRE'} · ${esc(st.ano)}</span><span class="ca-insta">@_sei01</span>
      <div class="ca-tit"><i>✦</i>CERTIFICADO<i>✦</i></div>
      <div class="ca-tipo" style="background:linear-gradient(90deg,${T.cor},${T.cor2});color:${T.texto2}">${T.emoji} ${T.rotulo} ${T.emoji}</div>
      <div class="ca-para"${some}>Este certificado vai para</div>
      <div class="ca-nome" style="background:${T.painel};box-shadow:0 0 5mm ${T.brilho},0 1.5mm 3mm rgba(0,0,0,.35),inset 0 -1mm 0 rgba(0,0,0,.12)"><span style="font-size:${tamNomeMm(nm)}mm${semTexto ? ';visibility:hidden' : ''}">${esc(nm)}</span></div>
      <p class="ca-msg"${some}>${esc(msg(tipo))}</p>
      <div class="ca-palco"><span class="ca-luz" style="background:radial-gradient(circle,${T.claro} 0,rgba(0,217,255,0) 70%)"></span><img class="ca-masc" src="assets/docs/mascote-sei.png?v=14" alt=""><div class="ca-podio"><span class="d">2º</span><span class="um">🏆 1º</span><span class="t">3º</span></div><div class="ca-balao">${esc(T.balao)}</div></div>
      <div class="ca-data">São Miguel do Guamá – PA, ____ de ___________ de ${esc(st.ano)}.</div><div class="ca-ass"><div><i></i>Direção</div><div><i></i>Coordenação pedagógica</div></div>
      <div class="ca-legal">Sistema de Ensino Incentivo · Credenciado pelo Certificado nº 059, de 17/04/2006<br>Autorizado pela Resolução nº 614, de 14/11/2024 – CEE/PA · Código INEP 15590798</div><div class="ca-um"><img src="${umPng || UM}" alt=""></div>`;
    return el;
  }
  // medalha redonda (desenhada a 60 mm e reduzida na folha)
  function medalha(tipo) {
    const T = TIPOS[tipo], el = document.createElement('div'); el.className = 'md-art';
    el.innerHTML = `<div class="md-anel" style="background:linear-gradient(135deg,#ffd600,#00d9ff 55%,#1e6bff)"><div class="md-disco">
      <div class="md-risc">${rabiscos(56, 56, .22)}</div><img class="md-logo" src="assets/docs/logo-sei.png" alt="">
      <div class="md-grande" style="font-size:${tipo === 'nota10' ? 11 : 8.4}mm;color:${tipo === 'nota10' ? '#fff200' : tipo === 'aprovado' ? '#ffc46b' : '#7df9ff'};text-shadow:0 0 1.4mm ${T.cor},0 .6mm 0 #0b2a6b">${T.grande}</div>
      <div class="md-fita" style="background:${T.cor};color:${T.texto2}">${T.anual ? 'ANO LETIVO' : esc(st.bim) + ' BIMESTRE'} · ${esc(st.ano)}</div>
      <img class="md-masc" src="assets/docs/mascote-sei.png?v=14" alt=""><div class="md-estrela">${T.emoji}</div></div></div>`;
    return el;
  }
  async function render(el, dpi, transparente) {
    if (!umPng) { await prepararUm(); const im = el.querySelector('.ca-um img'); if (im) im.src = umPng; }
    const fora = document.createElement('div'); Object.assign(fora.style, { position: 'absolute', left: '0', top: '0', zIndex: '-5', pointerEvents: 'none' }); fora.append(el); document.body.append(fora);
    await Promise.all([...el.querySelectorAll('img')].map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; }))); if (document.fonts) { await document.fonts.load('10px SeiRubik'); await document.fonts.load('10px SeiPoppins'); }
    await carregar('html2canvas', 'assets/vendor/html2canvas-1.4.1.min.js');
    const r = el.getBoundingClientRect(); const cv = await html2canvas(el, { ignoreElements: n => n.parentElement === document.body && !n.contains(el), scale: dpi / 96, useCORS: true, backgroundColor: transparente ? null : '#ffffff', logging: false, x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height, windowWidth: Math.max(document.documentElement.clientWidth, Math.ceil(r.width)), windowHeight: Math.max(innerHeight, Math.ceil(r.height)), scrollX: 0, scrollY: 0 });
    fora.remove(); return cv;
  }

  /* ---------- PDF ---------- */
  const novoPdf = async o => { await carregar('html2pdf', 'assets/vendor/html2pdf.bundle.min.js'); return html2pdf().set({ jsPDF: { unit: 'mm', format: 'a4', orientation: o } }).from('<div></div>').toPdf().get('pdf'); };
  const lista = () => TIPOS_L.flatMap(t => nomes(t).map(n => [t, n]));
  async function certificadosPdf(aviso) {
    const l = lista(); if (!l.length) return alert('Coloque pelo menos um nome.'); const doc = await novoPdf('l');
    for (const [i, [t, n]] of l.entries()) { aviso(`⏳ ${i + 1} de ${l.length}…`); const cv = await render(certificado(t, n), 170); if (i) doc.addPage('a4', 'l'); doc.addImage(cv.toDataURL('image/jpeg', .9), 'JPEG', 0, 0, 297, 210, undefined, 'FAST'); }
    doc.save(`Certificados-${st.bim}-Bimestre-${st.ano}.pdf`);
  }
  // grade das medalhas na folha A4 em pé, conforme o tamanho escolhido
  const grade = (dd) => { const d = dd || +st.tamMed || 33, passo = d + 1.2, col = Math.floor((210 - 6 + 1.2) / passo + 1e-6), lin = Math.floor((297 - 8 + 1.2) / passo + 1e-6); return { d, passo, col, lin, x0: (210 - (col - 1) * passo - d) / 2, y0: (297 - (lin - 1) * passo - d) / 2 }; };
  async function medalhasImgs() { const out = {}; for (const t of TIPOS_L) if (nomes(t).length) out[t] = (await render(medalha(t), 300, true)).toDataURL('image/png'); return out; }
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
    const grupos = TIPOS_L.map(t => [t, nomes(t)]).filter(g => g[1].length); if (!grupos.length) return alert('Coloque pelo menos um nome.');
    const cabs = []; let corpo = '';
    for (const [gi, [t, ns]] of grupos.entries()) {
      aviso('⏳ Desenhando a arte…'); const cv = await render(certificado(t, 'x', true), 170);
      cabs.push({ rid: 'rF' + gi, arq: `fundo-${t}.jpeg`, dados: await (await fetch(cv.toDataURL('image/jpeg', .9))).arrayBuffer(), xml: desenho('rF' + gi, 900 + gi, 297 * 36000, 210 * 36000, true) });
      const sect = `<w:sectPr><w:headerReference w:type="default" r:id="rH${gi + 1}"/><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/><w:pgMar w:top="${tw(Mm.para)}" w:right="${tw(Mm.lado)}" w:bottom="${tw(8)}" w:left="${tw(Mm.lado)}" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr>`;
      ns.forEach((n, i) => { const nm = bonito(n), fim = i === ns.length - 1, rp = (fonte, sz, cor, b) => `<w:rPr><w:rFonts w:ascii="${fonte}" w:hAnsi="${fonte}" w:cs="${fonte}"/>${b ? '<w:b/>' : ''}<w:color w:val="${cor}"/><w:sz w:val="${Math.round(sz * 2)}"/></w:rPr>`;
        corpo += `<w:p><w:pPr>${i ? '<w:pageBreakBefore/>' : ''}<w:spacing w:before="0" w:after="0" w:line="${tw(Mm.lParaN)}" w:lineRule="exact"/><w:jc w:val="center"/></w:pPr><w:r>${rp('Arial', 12.5, '7DF9FF', 1)}<w:t>Este certificado vai para</w:t></w:r></w:p>`;
        corpo += `<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="${tw(Mm.lNome)}" w:lineRule="exact"/><w:jc w:val="center"/></w:pPr><w:r>${rp('Arial Black', tamNomeMm(nm) * 2.835 * .9, '0B1A4A', 1)}<w:t xml:space="preserve">${X(nm)}</w:t></w:r></w:p>`;
        corpo += `<w:p><w:pPr><w:spacing w:before="${tw(Mm.antesMsg)}" w:after="0" w:line="${tw(Mm.lMsg)}" w:lineRule="exact"/><w:ind w:left="${tw(Mm.msgRec)}" w:right="${tw(Mm.msgRec)}"/><w:jc w:val="center"/>${fim && gi < grupos.length - 1 ? sect : ''}</w:pPr><w:r>${rp('Arial', 14.5, 'EAF2FF', 0)}<w:t xml:space="preserve">${X(msg(t))}</w:t></w:r></w:p>`;
        if (fim && gi === grupos.length - 1) corpo += sect; });
    }
    baixar(await docx(corpo, [], cabs), `Certificados-${st.bim}-Bimestre-${st.ano}.docx`);
  }
  // posições (mm) do texto no certificado — as mesmas do CSS (.ca-para, .ca-nome, .ca-msg)
  const Mm = { para: 89, lParaN: 8, lNome: 22, antesMsg: 3, lMsg: 8.2, lado: 30, msgRec: 0 };
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
  function puxarListao() {
    let l = []; try { const x = JSON.parse(localStorage.getItem('sei-listao') || 'null'); l = ((x && x.turmas) || []).flatMap(t => (t.nomes || '').split(/\r?\n/).map(n => n.replace(/^\s*\d+[\s.)-]*/, '').replace(/\s*\*+\s*$/, '').trim()).filter(Boolean)); } catch (e) {}
    if (!l.length) return alert('O listão dos aprovados deste aparelho está vazio. Monte o listão primeiro ou digite os nomes.'); st.aprovado = l.join('\n'); guardar(); desenhar(); alert(l.length + ' aluno(s) aprovados trazidos do listão.');
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
    const n3 = nomes('aprovado'), itens = [['nota10', n1[0] || 'Nome do Aluno'], ...(n2.length ? [['destaque', n2[0]]] : []), ...(n3.length ? [['aprovado', n3[0]]] : [])], cvs = [], meds = [];
    for (const [t, n] of itens) cvs.push(await render(certificado(t, n), 60));
    for (const t of TIPOS_L) meds.push(await render(medalha(t), 110, true));
    if (vez !== prevVez) return; box.innerHTML = ''; cvs.forEach(c => { c.className = 'ct-cv'; box.append(c); }); const m = document.createElement('div'); m.className = 'ct-meds'; meds.forEach(c => { c.style.width = '120px'; c.style.height = 'auto'; m.append(c); }); box.append(m);
  }
  function desenhar() {
    const n1 = nomes('nota10'), n2 = nomes('destaque'), n3 = nomes('aprovado'), tot = n1.length + n2.length + n3.length, g = grade();
    $('#ct').innerHTML = `<section class="es-sec"><h2>🏅 Certificados e medalhas</h2><p class="es-dica">Arte nova da escola, no estilo dos nossos posts. Escolha o bimestre (o certificado de aprovado é do ano letivo), coloque os nomes e baixe os <b>certificados</b> (um por folha A4 deitada) e as <b>medalhas</b>, em PDF ou Word.</p>
      <form class="es-form" id="ct-f"><div class="es-g3"><label>Bimestre<select name="bim">${['1º', '2º', '3º', '4º'].map(b => `<option ${b === st.bim ? 'selected' : ''}>${b}</option>`).join('')}</select></label><label>Ano<input name="ano" inputmode="numeric" value="${esc(st.ano)}"></label>
      <label>Tamanho da medalha<select name="tamMed">${[[33, '3,3 cm'], [40, '4 cm'], [50, '5 cm']].map(([v, t]) => [v, `${t} (${grade(v).col * grade(v).lin} por folha)`]).map(([v, t]) => `<option value="${v}" ${+st.tamMed === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label></div>
      <label>Mensagem do Aluno Nota 10 <small>({BIMESTRE} e {ANO} são trocados sozinhos)</small><textarea name="txt_nota10" style="min-height:70px">${esc(st.txt_nota10)}</textarea></label>
      <label>Mensagem do Aluno Destaque (AEE)<textarea name="txt_destaque" style="min-height:70px">${esc(st.txt_destaque)}</textarea></label><label>Mensagem do Aluno Aprovado<textarea name="txt_aprovado" style="min-height:70px">${esc(st.txt_aprovado)}</textarea></label><div class="es-acoes" style="margin:0"><button type="button" class="b" id="ct-padrao">↺ Mensagens padrão</button></div></form>
      <div class="es-g2" style="margin-top:14px">
        <div class="lt-turma" style="--c:#ff2bd6"><div class="es-linha"><b style="flex:1;font-size:17px">⭐ Aluno Nota 10</b><span class="chip">${n1.length}</span><button class="b" id="ct-p10">↧ Puxar do diário</button></div><textarea data-l="nota10" placeholder="Um nome por linha">${esc(st.nota10)}</textarea></div>
        <div class="lt-turma" style="--c:#00b8d9"><div class="es-linha"><b style="flex:1;font-size:17px">💙 Aluno Destaque (AEE)</b><span class="chip">${n2.length}</span><button class="b" id="ct-paee">↧ Puxar do AEE</button></div><textarea data-l="destaque" placeholder="Um nome por linha">${esc(st.destaque)}</textarea></div>
        <div class="lt-turma" style="--c:#ff9a1f"><div class="es-linha"><b style="flex:1;font-size:17px">🎓 Aluno Aprovado</b><span class="chip">${n3.length}</span><button class="b" id="ct-plist">↧ Puxar do listão</button></div><textarea data-l="aprovado" placeholder="Um nome por linha">${esc(st.aprovado)}</textarea></div></div>
      <div class="es-acoes" style="margin-top:14px"><button class="b main" id="ct-cpdf">📄 Certificados (PDF)</button><button class="b" id="ct-cdoc">⬇ Certificados (Word)</button><button class="b main" id="ct-mpdf">🏅 Medalhas (PDF)</button><button class="b" id="ct-mdoc">⬇ Medalhas (Word)</button></div>
      <p class="es-dica">${tot ? `Vai gerar <b>${tot} certificado(s)</b> e <b>${tot} medalha(s)</b> em ${Math.ceil(tot / (g.col * g.lin))} folha(s). Imprima em tamanho real (100%).` : 'Coloque os nomes para gerar.'}</p>
      <h2 style="margin-top:10px">👀 Prévia</h2><div class="ct-prev" id="ct-prev"><p class="es-dica">⏳ Desenhando…</p></div></section>`;
    let t = null; const f = $('#ct-f'); f.oninput = f.onchange = e => { const d = new FormData(f); Object.assign(st, { bim: d.get('bim'), ano: d.get('ano').trim(), tamMed: +d.get('tamMed'), txt_nota10: d.get('txt_nota10'), txt_destaque: d.get('txt_destaque'), txt_aprovado: d.get('txt_aprovado') }); guardar(); if (e.type === 'change' && e.target.tagName === 'SELECT') return desenhar(); clearTimeout(t); t = setTimeout(previa, 700); };
    document.querySelectorAll('[data-l]').forEach(x => { x.oninput = () => { st[x.dataset.l] = x.value; guardar(); }; x.onchange = desenhar; });
    previa();
  }
  document.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b || !b.id.startsWith('ct-')) return;
    if (b.id === 'ct-padrao') { st.txt_nota10 = TIPOS.nota10.texto; st.txt_destaque = TIPOS.destaque.texto; st.txt_aprovado = TIPOS.aprovado.texto; guardar(); return desenhar(); }
    if (b.id === 'ct-p10') return puxarNota10();
    if (b.id === 'ct-paee') return puxarAee();
    if (b.id === 'ct-plist') return puxarListao();
    const fn = { 'ct-cpdf': certificadosPdf, 'ct-cdoc': certificadosWord, 'ct-mpdf': medalhasPdf, 'ct-mdoc': medalhasWord }[b.id]; if (!fn) return;
    const t0 = b.textContent; b.disabled = true; b.textContent = '⏳ Gerando…'; try { await fn(m => { b.textContent = m; }); } catch (er) { alert('Não consegui gerar: ' + (er && er.message || er)); } b.disabled = false; b.textContent = t0;
  });
  desenhar();
})();
