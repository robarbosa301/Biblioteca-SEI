/* Folha dos documentos da escola: a mesma arte das folhas de aula (mascote, placa, título,
   barra de identificação, cartão branco e rodapé), com os textos de cada documento desenhados
   no próprio aparelho. Devolve imagens prontas para a impressão, o PDF e o Word. */
(function () {
  'use strict';
  const BASE = { cab: 'assets/docs/folha-cab.jpg?v=1', fundo: 'assets/docs/folha-fundo.jpg?v=1', logo: 'assets/docs/logo-sei.jpg?v=1' };
  const FONTES = [['SEI Rubik', 'assets/fonts/Rubik-ExtraBold.ttf', '800'], ['SEI Barlow', 'assets/fonts/BarlowCondensed-SemiBold.ttf', '600'], ['SEI Poppins', 'assets/fonts/Poppins-Bold.ttf', '700']];
  let pronto = null;
  const img = src => new Promise((ok, er) => { const i = new Image(); i.onload = () => ok(i); i.onerror = er; i.src = src; });
  function preparar() {
    if (pronto) return pronto;
    const fs = FONTES.map(([n, u, w]) => { try { const f = new FontFace(n, `url(${u})`, { weight: w }); return f.load().then(x => { document.fonts.add(x); }).catch(() => {}); } catch (e) { return Promise.resolve(); } });
    return (pronto = Promise.all([img(BASE.cab), img(BASE.fundo), img(BASE.logo), ...fs]).then(([c, f, l]) => ({ c, f, l })));
  }
  const F = (w, px, fam) => `${w} ${px}px '${fam}', Arial, sans-serif`;
  // texto que cabe numa largura, diminuindo a fonte
  function cabe(x, t, w, px, fam, peso, min) { let p = px; x.font = F(peso, p, fam); while (p > (min || 10) && x.measureText(t).width > w) { p -= 1; x.font = F(peso, p, fam); } return p; }
  // quebra em até 2 linhas equilibradas
  function duas(t) { const ps = t.split(' '); if (ps.length < 2) return [t]; let best = [t], dif = 1e9; for (let i = 1; i < ps.length; i++) { const a = ps.slice(0, i).join(' '), b = ps.slice(i).join(' '); const d = Math.abs(a.length - b.length); if (d < dif) { dif = d; best = [a, b]; } } return best; }

  function titulo(x, t, cx, cy, w, h) {
    let linhas = [t]; let p = cabe(x, t, w, 74, 'SEI Rubik', 800, 30);
    if (p < 48 && t.includes(' ')) { linhas = duas(t); p = Math.min(...linhas.map(l => cabe(x, l, w, 50, 'SEI Rubik', 800, 24))); }
    x.font = F(800, p, 'SEI Rubik'); x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
    const lh = p * 1.02; const y0 = cy - (linhas.length - 1) * lh / 2;
    linhas.forEach((l, i) => {
      const y = y0 + i * lh;
      x.save(); x.shadowColor = 'rgba(40,140,255,.85)'; x.shadowBlur = 16; x.strokeStyle = '#fff'; x.lineWidth = p * .2; x.strokeText(l, cx, y); x.restore();
      x.strokeStyle = '#fff'; x.lineWidth = p * .16; x.strokeText(l, cx, y);
      const g = x.createLinearGradient(0, y - p / 2, 0, y + p / 2); g.addColorStop(0, '#2f7bff'); g.addColorStop(.55, '#0d47d9'); g.addColorStop(1, '#082c9e');
      x.fillStyle = g; x.fillText(l, cx, y);
    });
    // risco embaixo, como nas folhas
    const yb = y0 + (linhas.length - 1) * lh + p * .62; const wl = Math.min(w, Math.max(...linhas.map(l => x.measureText(l).width))) * .9;
    const g2 = x.createLinearGradient(cx - wl / 2, 0, cx + wl / 2, 0); g2.addColorStop(0, 'rgba(13,71,217,0)'); g2.addColorStop(.5, '#0d47d9'); g2.addColorStop(1, 'rgba(13,71,217,0)');
    x.strokeStyle = g2; x.lineWidth = 4; x.beginPath(); x.moveTo(cx - wl / 2, yb + 6); x.quadraticCurveTo(cx, yb - 2, cx + wl / 2, yb + 6); x.stroke();
  }
  function placa(x, grande, linhas) {
    const cx = 460, w = 220; x.textAlign = 'center'; x.textBaseline = 'middle';
    const n = linhas.filter(Boolean).length;
    let p = cabe(x, grande, w, 64, 'SEI Rubik', 800, 26); const yG = n ? 118 : 160;
    x.font = F(800, p, 'SEI Rubik'); x.save(); x.shadowColor = 'rgba(0,0,0,.6)'; x.shadowOffsetY = 3; x.shadowBlur = 4;
    const g = x.createLinearGradient(0, yG - p / 2, 0, yG + p / 2); g.addColorStop(0, '#fff27a'); g.addColorStop(.5, '#ffd21c'); g.addColorStop(1, '#ffb300'); x.fillStyle = g; x.fillText(grande, cx, yG); x.restore();
    let y = yG + p * .5 + 26;
    linhas.filter(Boolean).forEach(l => { const q = cabe(x, l, w - 10, 40, 'SEI Barlow', 600, 18); x.font = F(600, q, 'SEI Barlow'); x.fillStyle = '#fff'; x.fillText(l, cx, y); y += q * 1.08; });
    // risquinho amarelo
    x.strokeStyle = '#ffd21c'; x.lineWidth = 4; x.beginPath(); x.moveTo(cx - 70, Math.min(y + 2, 262)); x.quadraticCurveTo(cx, Math.min(y - 4, 256), cx + 70, Math.min(y + 2, 262)); x.stroke();
  }
  function barra(x, campos) {
    const cols = [[78, 600], [660, 905]], rows = [323, 359];
    campos.slice(0, 4).forEach(([rot, val], i) => {
      const [x0, x1] = cols[i < 2 ? 0 : 1], y = rows[i % 2];
      x.textAlign = 'left'; x.textBaseline = 'middle';
      x.font = F(700, 19, 'SEI Poppins'); x.fillStyle = '#1340c9'; const r = rot + ':'; x.fillText(r, x0, y + 1); const wr = x.measureText(r).width + 8;
      const xv = x0 + wr, wv = x1 - xv;
      if (val) { const p = cabe(x, val, wv, 20, 'SEI Poppins', 700, 11); x.font = F(700, p, 'SEI Poppins'); x.fillStyle = '#0b1f5c'; x.fillText(val, xv, y + 1); }
      else { x.strokeStyle = '#1340c9'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(xv, y + 11); x.lineTo(x1, y + 11); x.stroke(); }
    });
  }
  function seloF(x, a, b) { x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillStyle = '#7fe3ff'; x.font = F(700, 15, 'SEI Poppins'); x.fillText(a || '', 1022, 326); if (b) { const p = cabe(x, b, 168, 26, 'SEI Poppins', 700, 12); x.font = F(700, p, 'SEI Poppins'); x.fillStyle = '#fff'; x.fillText(b, 1022, 357); } }
  function rodape(x, a, b, num, y, bx) {
    x.textBaseline = 'middle'; x.textAlign = 'left'; let xx = 36;
    x.font = F(600, 27, 'SEI Barlow'); x.fillStyle = '#fff'; x.fillText(a, xx, y); xx += x.measureText(a).width + 14;
    if (b) { x.strokeStyle = '#2a8fe0'; x.lineWidth = 2; x.beginPath(); x.moveTo(xx, y - 15); x.lineTo(xx, y + 15); x.stroke(); xx += 14; const q = cabe(x, b, 445 - xx, 27, 'SEI Barlow', 600, 16); x.font = F(600, q, 'SEI Barlow'); x.fillStyle = '#45d4ff'; x.fillText(b, xx, y); }
    if (num) { x.textAlign = 'center'; const p = cabe(x, num, 46, 30, 'SEI Rubik', 800, 14); x.font = F(800, p, 'SEI Rubik'); x.fillStyle = '#0d47d9'; x.fillText(num, bx, y + 1); }
  }
  function banda(x, t, sub, campos) {
    x.textAlign = 'left'; x.textBaseline = 'alphabetic';
    const p = cabe(x, t, 470, 50, 'SEI Poppins', 700, 24); x.font = F(700, p, 'SEI Poppins'); x.fillStyle = '#8fb3ec'; x.fillText(t, 172, 70);
    const q = cabe(x, sub, 470, 27, 'SEI Poppins', 700, 14); x.font = F(700, q, 'SEI Poppins'); x.fillStyle = '#fff'; x.fillText(sub, 172, 104);
    campos.slice(0, 2).forEach(([r, v], i) => { const y = [56, 98][i]; x.font = F(700, 22, 'SEI Poppins'); x.fillStyle = '#fff'; const rr = r + ':'; x.fillText(rr, 660, y); const xv = 660 + x.measureText(rr).width + 10;
      if (v) { const s = cabe(x, v, 1040 - xv, 22, 'SEI Poppins', 700, 11); x.font = F(700, s, 'SEI Poppins'); x.fillStyle = '#9fdcff'; x.fillText(v, xv, y); } else { x.strokeStyle = '#fff'; x.lineWidth = 2; x.beginPath(); x.moveTo(xv, y + 4); x.lineTo(1035, y + 4); x.stroke(); } });
  }

  /* ---------- cabeçalho institucional (Secretaria, Coordenação, Direção) ---------- */
  const rr = (x, a, b, w, h, r) => { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); };
  function selo(x, cx, cy, R, linhas, volta) {
    // anel dourado
    const g = x.createLinearGradient(cx - R, cy - R, cx + R, cy + R); g.addColorStop(0, '#fff1a8'); g.addColorStop(.35, '#e6b422'); g.addColorStop(.7, '#fff0a0'); g.addColorStop(1, '#b8860b');
    x.save(); x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 14; x.shadowOffsetY = 4; x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.fillStyle = g; x.fill(); x.restore();
    x.beginPath(); x.arc(cx, cy, R - 9, 0, Math.PI * 2); const g2 = x.createRadialGradient(cx, cy - 20, 10, cx, cy, R); g2.addColorStop(0, '#163f9c'); g2.addColorStop(1, '#071a4d'); x.fillStyle = g2; x.fill();
    x.beginPath(); x.arc(cx, cy, R - 34, 0, Math.PI * 2); x.strokeStyle = 'rgba(230,180,34,.9)'; x.lineWidth = 2; x.stroke();
    // texto em volta
    x.save(); x.font = F(700, 13, 'SEI Poppins'); x.fillStyle = '#ffd34d'; x.textAlign = 'center'; x.textBaseline = 'middle';
    const rt = R - 22, esp = 1.6; const ws = [...volta].map(ch => x.measureText(ch).width + esp); const ang = ws.reduce((a, b) => a + b, 0) / rt; let a0 = -Math.PI / 2 - ang / 2;
    [...volta].forEach((ch, i) => { const da = ws[i] / rt; x.save(); x.translate(cx + Math.cos(a0 + da / 2) * rt, cy + Math.sin(a0 + da / 2) * rt); x.rotate(a0 + da / 2 + Math.PI / 2); x.fillText(ch, 0, 0); x.restore(); a0 += da; });
    x.restore();
    x.save(); x.fillStyle = '#ffd34d'; for (let k = 0; k < 5; k++) { const aa = Math.PI / 2 + (k - 2) * 0.22; x.beginPath(); x.arc(cx + Math.cos(aa) * rt, cy + Math.sin(aa) * rt, k === 2 ? 4.5 : 3, 0, Math.PI * 2); x.fill(); } x.restore();
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = F(700, 14, 'SEI Poppins'); x.fillStyle = '#9fdcff'; x.fillText(linhas[0], cx, cy - 14);
    const p = cabe(x, linhas[1], (R - 40) * 2, 25, 'SEI Rubik', 800, 12); x.font = F(800, p, 'SEI Rubik'); x.fillStyle = '#fff'; x.fillText(linhas[1], cx, cy + 12);
    if (linhas[2]) { const z = cabe(x, linhas[2], (R - 48) * 2, 11, 'SEI Poppins', 700, 7); x.font = F(700, z, 'SEI Poppins'); x.fillStyle = '#ffd34d'; x.fillText(linhas[2], cx, cy + 36); }
  }
  function cabFormal(x, o, l, vidro) {
    // painel
    x.save(); rr(x, 34, 22, 1172, 268, 26); x.clip();
    if (vidro) { const g = x.createLinearGradient(0, 22, 0, 290); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#e8f1ff'); x.fillStyle = g; x.fillRect(0, 0, 1240, 420);
      x.globalAlpha = .06; x.strokeStyle = '#0b2a6b'; x.lineWidth = 2; for (let k = -400; k < 1400; k += 22) { x.beginPath(); x.moveTo(k, 300); x.lineTo(k + 280, 0); x.stroke(); } x.globalAlpha = 1; }
    else { const g = x.createLinearGradient(0, 0, 1240, 0); g.addColorStop(0, '#0540a0'); g.addColorStop(.26, '#06307f'); g.addColorStop(.6, '#071c55'); g.addColorStop(1, '#0a2f86'); x.fillStyle = g; x.fillRect(0, 0, 1240, 420);
      x.globalAlpha = .07; x.strokeStyle = '#9fdcff'; x.lineWidth = 2; for (let k = -400; k < 1400; k += 22) { x.beginPath(); x.moveTo(k, 300); x.lineTo(k + 280, 0); x.stroke(); } x.globalAlpha = 1; }
    // logo com as bordas esfumadas no painel
    const lc = document.createElement('canvas'); lc.width = 380; lc.height = 248; const lx = lc.getContext('2d'); lx.drawImage(l, 0, 0, 380, 248);
    lx.globalCompositeOperation = 'destination-in'; const rg = lx.createRadialGradient(190, 124, 70, 190, 124, 200); rg.addColorStop(0, 'rgba(0,0,0,1)'); rg.addColorStop(.62, 'rgba(0,0,0,1)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); lx.fillStyle = rg; lx.fillRect(0, 0, 380, 248);
    if (vidro) { x.save(); rr(x, 50, 38, 330, 236, 20); x.clip(); x.drawImage(l, 50, 38, 330, 236); x.restore(); rr(x, 50, 38, 330, 236, 20); x.strokeStyle = '#d7b44a'; x.lineWidth = 2; x.stroke(); } else x.drawImage(lc, 40, 32);
    x.restore();
    // moldura dourada fina do painel
    rr(x, 34, 22, 1172, 268, 26); const gd = x.createLinearGradient(0, 0, 1240, 0); gd.addColorStop(0, '#b8860b'); gd.addColorStop(.5, '#ffe58a'); gd.addColorStop(1, '#b8860b'); x.strokeStyle = gd; x.lineWidth = 3; x.stroke();
    rr(x, 44, 32, 1152, 248, 20); x.strokeStyle = 'rgba(255,229,138,.35)'; x.lineWidth = 1.2; x.stroke();
    // centro: instituição, título, setor
    const cx = 690, w = 470; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = F(600, 25, 'SEI Barlow'); x.fillStyle = vidro ? '#a07812' : '#ffd34d'; const inst = 'S I S T E M A   D E   E N S I N O   I N C E N T I V O'; cabe(x, inst, w, 25, 'SEI Barlow', 600, 14); x.fillText(inst, cx, 66);
    const T = o.titulo.toUpperCase(); let linhas = [T]; let p = cabe(x, T, w, 60, 'SEI Rubik', 800, 30);
    if (p < 40 && T.includes(' ')) { linhas = duas(T); p = Math.min(...linhas.map(t => cabe(x, t, w, 44, 'SEI Rubik', 800, 22))); }
    x.font = F(800, p, 'SEI Rubik'); const lh = p * 1.05; const y0 = 140 - (linhas.length - 1) * lh / 2;
    linhas.forEach((t, i) => { const y = y0 + i * lh; x.save(); x.shadowColor = 'rgba(0,0,0,.55)'; x.shadowBlur = 8; x.shadowOffsetY = 3; const gt = x.createLinearGradient(0, y - p / 2, 0, y + p / 2); if (vidro) { x.shadowColor = 'rgba(11,42,107,.25)'; x.shadowBlur = 4; x.shadowOffsetY = 2; gt.addColorStop(0, '#0d47d9'); gt.addColorStop(1, '#071c55'); } else { gt.addColorStop(0, '#ffffff'); gt.addColorStop(1, '#cfe6ff'); } x.fillStyle = gt; x.fillText(t, cx, y); x.restore(); });
    // divisor com losango
    const yd = 140 + (linhas.length - 1) * lh / 2 + p * .62 + 6; x.strokeStyle = gd; x.lineWidth = 2;
    x.beginPath(); x.moveTo(cx - 190, yd); x.lineTo(cx - 14, yd); x.moveTo(cx + 14, yd); x.lineTo(cx + 190, yd); x.stroke();
    x.save(); x.translate(cx, yd); x.rotate(Math.PI / 4); x.fillStyle = '#ffd34d'; x.fillRect(-6, -6, 12, 12); x.restore();
    const sub = (o.rodape || []).filter(Boolean).join('  ·  ').toUpperCase(); const q = cabe(x, sub, w, 22, 'SEI Poppins', 700, 12); x.font = F(700, q, 'SEI Poppins'); x.fillStyle = vidro ? '#1d5fd6' : '#9fdcff'; x.fillText(sub, cx, yd + 32);
    // selo à direita
    selo(x, 1060, 156, 104, ['COD. INEP', '15590798', 'SÃO MIGUEL DO GUAMÁ'], 'AUTORIZADO PELO CEE · RES. Nº 614/2024');
    // barra de identificação
    x.save(); x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 10; x.shadowOffsetY = 3; rr(x, 34, 302, 1172, 86, 16); x.fillStyle = '#fff'; x.fill(); x.restore();
    rr(x, 34, 302, 1172, 86, 16); x.strokeStyle = '#d7b44a'; x.lineWidth = 1.5; x.stroke();
    x.fillStyle = '#0b2a6b'; rr(x, 34, 302, 12, 86, 6); x.fill();
    const cols = [[66, 560], [586, 880], [906, 1186]]; const cs = (o.campos || []).slice(0, 4);
    const pos = [[0, 0], [0, 1], [1, 0], [1, 1]];
    x.strokeStyle = '#e3e8f2'; x.lineWidth = 1.5; [574, 894].forEach(xx => { x.beginPath(); x.moveTo(xx, 314); x.lineTo(xx, 376); x.stroke(); }); x.beginPath(); x.moveTo(60, 345); x.lineTo(880, 345); x.stroke();
    cs.forEach(([r, v], i) => { const [c, rw] = pos[i]; const [a, b] = cols[c]; const y = rw ? 365 : 325; x.textAlign = 'left'; x.textBaseline = 'middle';
      x.font = F(700, 13, 'SEI Poppins'); x.fillStyle = '#6b7fa8'; const R = r.toUpperCase(); x.fillText(R, a, y - 1); const wr = x.measureText(R).width + 10;
      if (v) { const pp = cabe(x, v, b - a - wr, 19, 'SEI Poppins', 700, 10); x.font = F(700, pp, 'SEI Poppins'); x.fillStyle = '#0b1f5c'; x.fillText(v, a + wr, y); }
      else { x.strokeStyle = '#9aa9c8'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(a + wr, y + 9); x.lineTo(b, y + 9); x.stroke(); } });
    // 3ª coluna: Nº de protocolo / via
    x.textAlign = 'left'; x.font = F(700, 13, 'SEI Poppins'); x.fillStyle = '#6b7fa8'; x.fillText('EMITIDO POR', 906, 325); x.font = F(700, 17, 'SEI Poppins'); x.fillStyle = '#0b1f5c'; x.fillText(o.rodape ? o.rodape[0] : '', 906, 352 + 4);
  }
  const cache = new Map();
  /* o: { titulo, placa: {grande, linhas[]}, campos: [[rótulo, valor] x4], selo: [a, b], rodape: [a, b], num, curto } */
  async function compor(o) {
    const k = JSON.stringify(o); if (cache.has(k)) return cache.get(k);
    const { c, f, l } = await preparar();
    const cv = document.createElement('canvas'); cv.width = 1240; cv.height = 420; let x = cv.getContext('2d'); x.drawImage(c, 0, 0);
    if (o.estilo === 'folha') { placa(x, o.placa.grande, o.placa.linhas || []); titulo(x, o.titulo, 790, 210, 330, 90); barra(x, o.campos || []); seloF(x, ...(o.selo || [])); }
    else cabFormal(x, o, l, o.estilo === 'claro');
    const cab = cv.toDataURL('image/jpeg', .9);
    const fv = document.createElement('canvas'); fv.width = 1240; fv.height = 1754; x = fv.getContext('2d'); x.drawImage(f, 0, 0);
    banda(x, o.curto || o.titulo, (o.rodape || []).filter(Boolean).join(' — '), (o.campos || []).filter(cp => cp[1]).slice(0, 2));
    rodape(x, ...(o.rodape || ['', '']), o.num || '', 1715, 1175);
    const fundo = fv.toDataURL('image/jpeg', .88);
    // faixa de cima da folha 2 (para os avisos com 2 cópias por folha)
    const bv = document.createElement('canvas'); bv.width = 1240; bv.height = 146; bv.getContext('2d').drawImage(fv, 0, 0);
    const r = { cab, fundo, banda: bv.toDataURL('image/jpeg', .9) }; cache.set(k, r); return r;
  }
  window.seiFolha = { compor, preparar };
})();
