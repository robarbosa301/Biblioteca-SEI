/* Folha dos documentos da escola: a mesma arte das folhas de aula (mascote, placa, título,
   barra de identificação, cartão branco e rodapé), com os textos de cada documento desenhados
   no próprio aparelho. Devolve imagens prontas para a impressão, o PDF e o Word. */
(function () {
  'use strict';
  const BASE = { cab: 'assets/docs/folha-cab.jpg?v=1', fundo: 'assets/docs/folha-fundo.jpg?v=1', logo: 'assets/docs/logo-sei.jpg?v=1', logoT: 'assets/docs/logo-sei.png?v=3' };
  const FONTES = [['SEI Rubik', 'assets/fonts/Rubik-ExtraBold.ttf', '800'], ['SEI Barlow', 'assets/fonts/BarlowCondensed-SemiBold.ttf', '600'], ['SEI Poppins', 'assets/fonts/Poppins-Bold.ttf', '700']];
  let pronto = null;
  const img = src => new Promise((ok, er) => { const i = new Image(); i.onload = () => ok(i); i.onerror = er; i.src = src; });
  function preparar() {
    if (pronto) return pronto;
    const fs = FONTES.map(([n, u, w]) => { try { const f = new FontFace(n, `url(${u})`, { weight: w }); return f.load().then(x => { document.fonts.add(x); }).catch(() => {}); } catch (e) { return Promise.resolve(); } });
    return (pronto = Promise.all([img(BASE.cab), img(BASE.fundo), img(BASE.logo), img(BASE.logoT), ...fs]).then(([c, f, l, lt]) => ({ c, f, l, lt })));
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
    { const pa = cabe(x, a, 250, 27, 'SEI Barlow', 600, 14); x.font = F(600, pa, 'SEI Barlow'); } x.fillStyle = '#fff'; x.fillText(a, xx, y); xx += x.measureText(a).width + 14;
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

  /* desenhos de traço no fundo (estilo do cabeçalho das folhas) */
  const ICONES = {
    livro: x => { x.beginPath(); x.moveTo(0, -18); x.quadraticCurveTo(-14, -24, -30, -18); x.lineTo(-30, 18); x.quadraticCurveTo(-14, 12, 0, 18); x.quadraticCurveTo(14, 12, 30, 18); x.lineTo(30, -18); x.quadraticCurveTo(14, -24, 0, -18); x.lineTo(0, 18); x.stroke(); [-8, 0, 8].forEach(k => { x.beginPath(); x.moveTo(-24, k - 4); x.lineTo(-6, k - 4); x.moveTo(6, k - 4); x.lineTo(24, k - 4); x.stroke(); }); },
    lapis: x => { x.beginPath(); x.rect(-30, -7, 46, 14); x.moveTo(16, -7); x.lineTo(32, 0); x.lineTo(16, 7); x.moveTo(-22, -7); x.lineTo(-22, 7); x.stroke(); },
    capelo: x => { x.beginPath(); x.moveTo(-32, -6); x.lineTo(0, -20); x.lineTo(32, -6); x.lineTo(0, 8); x.closePath(); x.moveTo(-18, 0); x.lineTo(-18, 14); x.quadraticCurveTo(0, 24, 18, 14); x.lineTo(18, 0); x.moveTo(28, -4); x.lineTo(28, 16); x.stroke(); },
    lampada: x => { x.beginPath(); x.arc(0, -6, 16, Math.PI * .8, Math.PI * .2); x.lineTo(7, 16); x.lineTo(-7, 16); x.closePath(); x.moveTo(-6, 21); x.lineTo(6, 21); x.stroke(); [[-26, -6, -34, -6], [26, -6, 34, -6], [0, -30, 0, -38], [-19, -25, -24, -31], [19, -25, 24, -31]].forEach(([a, b, c, d]) => { x.beginPath(); x.moveTo(a, b); x.lineTo(c, d); x.stroke(); }); },
    estrela: x => { x.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 9 : 22, a = -Math.PI / 2 + i * Math.PI / 5; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.closePath(); x.stroke(); },
    globo: x => { x.beginPath(); x.arc(0, 0, 22, 0, Math.PI * 2); x.moveTo(-22, 0); x.lineTo(22, 0); x.stroke(); x.beginPath(); x.ellipse(0, 0, 10, 22, 0, 0, Math.PI * 2); x.stroke(); x.beginPath(); x.moveTo(-19, -11); x.lineTo(19, -11); x.moveTo(-19, 11); x.lineTo(19, 11); x.stroke(); },
    atomo: x => { [0, Math.PI / 3, -Math.PI / 3].forEach(r => { x.beginPath(); x.ellipse(0, 0, 28, 10, r, 0, Math.PI * 2); x.stroke(); }); x.beginPath(); x.arc(0, 0, 4, 0, Math.PI * 2); x.fill(); },
    balao: x => { x.beginPath(); x.moveTo(-26, -16); x.lineTo(26, -16); x.quadraticCurveTo(30, -16, 30, -12); x.lineTo(30, 10); x.quadraticCurveTo(30, 14, 26, 14); x.lineTo(-6, 14); x.lineTo(-16, 24); x.lineTo(-14, 14); x.lineTo(-26, 14); x.quadraticCurveTo(-30, 14, -30, 10); x.lineTo(-30, -12); x.quadraticCurveTo(-30, -16, -26, -16); x.stroke(); [-12, 0, 12].forEach(k => { x.beginPath(); x.arc(k, -1, 3, 0, Math.PI * 2); x.fill(); }); },
    regua: x => { x.beginPath(); x.rect(-34, -8, 68, 16); for (let k = -28; k <= 28; k += 7) { x.moveTo(k, -8); x.lineTo(k, k % 14 ? -3 : 0); } x.stroke(); },
    prancheta: x => { x.beginPath(); x.rect(-18, -22, 36, 46); x.rect(-8, -27, 16, 9); for (let k = -8; k <= 14; k += 8) { x.moveTo(-10, k); x.lineTo(10, k); } x.stroke(); },
    abc: x => { x.font = F(800, 30, 'SEI Rubik'); x.textAlign = 'center'; x.textBaseline = 'middle'; x.strokeText('ABC', 0, 0); },
    n123: x => { x.font = F(800, 30, 'SEI Rubik'); x.textAlign = 'center'; x.textBaseline = 'middle'; x.strokeText('1 2 3', 0, 0); },
    mais: x => { x.font = F(800, 26, 'SEI Rubik'); x.textAlign = 'center'; x.textBaseline = 'middle'; x.strokeText('a + b', 0, 0); }
  };
  const ONDE = [['abc', 70, 52, -.25, 1], ['lapis', 395, 50, -.6, 1], ['estrela', 470, 120, .2, .9], ['livro', 420, 250, -.1, 1.1], ['lampada', 545, 240, .1, .9],
    ['balao', 850, 240, .08, 1], ['atomo', 905, 70, 0, .9], ['globo', 835, 120, 0, .8], ['regua', 560, 46, .2, .9], ['capelo', 780, 46, -.1, .9], ['n123', 1180, 270, -.2, .7],
    ['prancheta', 1180, 70, .15, .8], ['mais', 960, 262, -.12, .9], ['estrela', 300, 268, -.3, .6], ['lapis', 640, 268, .4, .8], ['estrela', 1000, 30, .3, .5], ['livro', 120, 270, .15, .8]];
  function desenhos(x, cor) {
    x.save(); x.strokeStyle = cor; x.fillStyle = cor; x.lineWidth = 2.6; x.lineJoin = 'round'; x.lineCap = 'round';
    for (const [n, a, b, r, k] of ONDE) { x.save(); x.translate(a, b); x.rotate(r); x.scale(k, k); ICONES[n](x); x.restore(); }
    x.restore();
  }

  // efeito atrás da logo no cabeçalho escuro
  function halo(x, gx, gy, tipo) {
    const brilho = (r, a) => { const g = x.createRadialGradient(gx, gy, 5, gx, gy, r); g.addColorStop(0, `rgba(80,180,255,${a})`); g.addColorStop(.5, `rgba(30,111,232,${a * .5})`); g.addColorStop(1, 'rgba(30,111,232,0)'); x.fillStyle = g; x.beginPath(); x.ellipse(gx, gy, r * 1.15, r * .78, 0, 0, Math.PI * 2); x.fill(); };
    if (tipo === 'suave') { brilho(260, .95); brilho(140, .5); return; }
    if (tipo === 'curva') { // faixas de luz curvas, como o "swoosh" da logo, seguindo para o título
      brilho(210, .7);
      [[0, 1, .9, 9], [24, .85, .6, 5], [-22, .7, .45, 3.5]].forEach(([d, k, a, w]) => {
        const g = x.createLinearGradient(gx - 160, 0, gx + 330, 0); g.addColorStop(0, 'rgba(120,210,255,0)'); g.addColorStop(.3, `rgba(150,220,255,${a})`); g.addColorStop(.75, `rgba(90,180,255,${a * .6})`); g.addColorStop(1, 'rgba(90,180,255,0)');
        x.strokeStyle = g; x.lineWidth = w; x.lineCap = 'round'; x.beginPath(); x.moveTo(gx - 170, gy + 95 + d); x.quadraticCurveTo(gx + 40, gy + 150 * k + d, gx + 330, gy + 40 + d); x.stroke(); });
      return; }
    if (tipo === 'bolhas') { // pontos de luz desfocados
      brilho(210, .65);
      [[-150, -85, 34, .5], [175, -95, 26, .55], [190, 75, 40, .4], [-175, 70, 24, .55], [70, -118, 18, .6], [-50, 122, 28, .45], [240, -10, 16, .65], [-210, -5, 18, .6], [120, 128, 20, .5], [280, 60, 12, .6], [-100, -120, 12, .6]].forEach(([dx, dy, r, a]) => { const g = x.createRadialGradient(gx + dx, gy + dy, 0, gx + dx, gy + dy, r); g.addColorStop(0, `rgba(170,225,255,${a})`); g.addColorStop(1, 'rgba(170,225,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(gx + dx, gy + dy, r, 0, Math.PI * 2); x.fill(); });
    }
  }

  // faixa compacta no cabeçalho escuro (páginas 2 em diante e cada via dos avisos em 2 vias)
  function bandaFormal(x, o, lt) {
    const fv = x.canvas; x.drawImage(fv, 0, 1742, 1240, 10, 0, 0, 1240, 9); x.drawImage(fv, 0, 420, 34, 146, 0, 0, 34, 146); x.drawImage(fv, 1206, 420, 34, 146, 1206, 0, 34, 146); x.drawImage(fv, 34, 1742, 1172, 10, 34, 138, 1172, 8);
    x.save(); rr(x, 34, 8, 1172, 132, 20); x.clip();
    const g = x.createLinearGradient(0, 0, 1240, 0); g.addColorStop(0, '#0a2f86'); g.addColorStop(.5, '#071c55'); g.addColorStop(1, '#0a2f86'); x.fillStyle = g; x.fillRect(0, 0, 1240, 150);
    x.globalAlpha = .05; x.strokeStyle = '#9fdcff'; x.lineWidth = 2; for (let k = -400; k < 1400; k += 22) { x.beginPath(); x.moveTo(k, 150); x.lineTo(k + 150, 0); x.stroke(); } x.globalAlpha = 1;
    x.save(); x.translate(0, -6); x.scale(1, .5); desenhos(x, 'rgba(120,200,255,.20)'); x.restore();
    if (lt) { const h = 118, w = h * lt.width / lt.height; x.save(); x.shadowColor = 'rgba(0,10,40,.6)'; x.shadowBlur = 10; x.shadowOffsetY = 3; x.drawImage(lt, 145 - w / 2, 14, w, h); x.restore(); }
    x.restore();
    rr(x, 34, 8, 1172, 132, 20); const gd = x.createLinearGradient(0, 0, 1240, 0); gd.addColorStop(0, '#b8860b'); gd.addColorStop(.5, '#ffe58a'); gd.addColorStop(1, '#b8860b'); x.strokeStyle = gd; x.lineWidth = 3; x.stroke();
    const cx = 610, w = 560; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = F(600, 17, 'SEI Barlow'); x.fillStyle = '#ffd34d'; x.fillText('S I S T E M A   D E   E N S I N O   I N C E N T I V O', cx, 30);
    const T = o.titulo.toUpperCase(); const p = cabe(x, T, w, 46, 'SEI Rubik', 800, 20); x.font = F(800, p, 'SEI Rubik');
    x.save(); x.shadowColor = 'rgba(0,0,0,.55)'; x.shadowBlur = 6; x.shadowOffsetY = 2; const gt = x.createLinearGradient(0, 50, 0, 92); gt.addColorStop(0, '#fff'); gt.addColorStop(1, '#cfe6ff'); x.fillStyle = gt; x.fillText(T, cx, 70); x.restore();
    const cs = (o.campos || []).filter(c => c[1]).slice(0, 2).map(([r, v]) => `${r}: ${v}`); const sub = [((o.rodape || [])[0] || '').toUpperCase(), ...cs].filter(Boolean).join('   ·   ');
    const q = cabe(x, sub, w + 40, 16, 'SEI Poppins', 700, 10); x.font = F(700, q, 'SEI Poppins'); x.fillStyle = '#9fdcff'; x.fillText(sub, cx, 112);
    // selo pequeno
    const sx = 1100, sy = 74, R = 52; const gs = x.createLinearGradient(sx - R, sy - R, sx + R, sy + R); gs.addColorStop(0, '#fff1a8'); gs.addColorStop(.35, '#e6b422'); gs.addColorStop(.7, '#fff0a0'); gs.addColorStop(1, '#b8860b');
    x.beginPath(); x.arc(sx, sy, R, 0, Math.PI * 2); x.fillStyle = gs; x.fill(); x.beginPath(); x.arc(sx, sy, R - 6, 0, Math.PI * 2); x.fillStyle = '#0b2363'; x.fill();
    x.beginPath(); x.arc(sx, sy, R - 12, 0, Math.PI * 2); x.strokeStyle = 'rgba(230,180,34,.9)'; x.lineWidth = 1.5; x.stroke();
    x.font = F(700, 11, 'SEI Poppins'); x.fillStyle = '#9fdcff'; x.fillText('COD. INEP', sx, sy - 13); x.font = F(800, 17, 'SEI Rubik'); x.fillStyle = '#fff'; x.fillText('15590798', sx, sy + 5); x.font = F(700, 9, 'SEI Poppins'); x.fillStyle = '#ffd34d'; x.fillText('CEE · 614/2024', sx, sy + 23);
  }
  function cabFormal(x, o, l, vidro, lt) {
    // painel
    x.save(); rr(x, 34, 22, 1172, 268, 26); x.clip();
    if (vidro) { const g = x.createLinearGradient(0, 22, 0, 290); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#e8f1ff'); x.fillStyle = g; x.fillRect(0, 0, 1240, 420);
      x.globalAlpha = .04; x.strokeStyle = '#0b2a6b'; x.lineWidth = 2; for (let k = -400; k < 1400; k += 22) { x.beginPath(); x.moveTo(k, 300); x.lineTo(k + 280, 0); x.stroke(); } x.globalAlpha = 1;
      if (lt) desenhos(x, 'rgba(30,111,232,.30)'); }
    else { const g = x.createLinearGradient(0, 0, 1240, 0); g.addColorStop(0, '#0a2f86'); g.addColorStop(.5, '#071c55'); g.addColorStop(1, '#0a2f86'); x.fillStyle = g; x.fillRect(0, 0, 1240, 420);
      x.globalAlpha = .05; x.strokeStyle = '#9fdcff'; x.lineWidth = 2; for (let k = -400; k < 1400; k += 22) { x.beginPath(); x.moveTo(k, 300); x.lineTo(k + 280, 0); x.stroke(); } x.globalAlpha = 1;
      desenhos(x, 'rgba(120,200,255,.22)'); }
    // logo com as bordas esfumadas no painel
    const lc = document.createElement('canvas'); lc.width = 380; lc.height = 248; const lx = lc.getContext('2d'); lx.drawImage(l, 0, 0, 380, 248);
    lx.globalCompositeOperation = 'destination-in'; const rg = lx.createRadialGradient(190, 124, 70, 190, 124, 200); rg.addColorStop(0, 'rgba(0,0,0,1)'); rg.addColorStop(.62, 'rgba(0,0,0,1)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); lx.fillStyle = rg; lx.fillRect(0, 0, 380, 248);
    if (vidro && lt) { const h = 236, w = h * lt.width / lt.height; x.save(); x.shadowColor = 'rgba(7,28,85,.35)'; x.shadowBlur = 10; x.shadowOffsetY = 3; x.drawImage(lt, 215 - w / 2, 40, w, h); x.restore(); }
    else if (vidro) { x.save(); rr(x, 50, 38, 330, 236, 20); x.clip(); x.drawImage(l, 50, 38, 330, 236); x.restore(); rr(x, 50, 38, 330, 236, 20); x.strokeStyle = '#d7b44a'; x.lineWidth = 2; x.stroke(); } else if (lt) { // escuro: logo sem fundo, com brilho azul atrás (como nas folhas)
      const h = 240, w = h * lt.width / lt.height, lx0 = 212 - w / 2, ly0 = 36, gx = 205, gy = 160;
      x.save(); x.shadowColor = 'rgba(0,10,40,.6)'; x.shadowBlur = 16; x.shadowOffsetY = 5; x.drawImage(lt, lx0, ly0, w, h); x.restore(); }
    else x.drawImage(lc, 40, 32);
    x.restore();
    // moldura dourada fina do painel
    rr(x, 34, 22, 1172, 268, 26); const gd = x.createLinearGradient(0, 0, 1240, 0); gd.addColorStop(0, '#b8860b'); gd.addColorStop(.5, '#ffe58a'); gd.addColorStop(1, '#b8860b'); x.strokeStyle = gd; x.lineWidth = 3; x.stroke();
    rr(x, 44, 32, 1152, 248, 20); x.strokeStyle = 'rgba(255,229,138,.35)'; x.lineWidth = 1.2; x.stroke();
    // centro: instituição, título, setor
    const cx = 660, w = 470, wt = 530; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = F(600, 25, 'SEI Barlow'); x.fillStyle = vidro ? '#a07812' : '#ffd34d'; const inst = 'S I S T E M A   D E   E N S I N O   I N C E N T I V O'; cabe(x, inst, w, 25, 'SEI Barlow', 600, 14); x.fillText(inst, cx, 66);
    const T = o.titulo.toUpperCase(); let linhas = [T]; let p = cabe(x, T, wt, 80, 'SEI Rubik', 800, 30);
    if (p < 52 && T.includes(' ')) { linhas = duas(T); p = Math.min(...linhas.map(t => cabe(x, t, wt, 52, 'SEI Rubik', 800, 22))); }
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
    x.textAlign = 'left'; x.font = F(700, 13, 'SEI Poppins'); x.fillStyle = '#6b7fa8'; x.fillText('EMITIDO POR', 906, 325); { const em = o.rodape ? o.rodape[0] : ''; const pe = cabe(x, em, 280, 17, 'SEI Poppins', 700, 10); x.font = F(700, pe, 'SEI Poppins'); x.fillStyle = '#0b1f5c'; x.fillText(em, 906, 352 + 4); }
  }


  // desenhos de traço por disciplina (carteirinha)
  const DISC = {
    mat: x => { x.font = F(800, 46, 'SEI Rubik'); x.textAlign = 'center'; x.textBaseline = 'middle'; x.strokeText('π', -48, 0); x.beginPath(); x.moveTo(-10, 6); x.lineTo(0, 22); x.lineTo(16, -22); x.lineTo(56, -22); x.stroke(); x.font = F(700, 26, 'SEI Rubik'); x.strokeText('x²', 38, 2);
      x.beginPath(); x.moveTo(-70, 48); x.lineTo(-20, 48); x.lineTo(-70, 12); x.closePath(); x.stroke(); x.font = F(800, 30, 'SEI Rubik'); x.strokeText('∑', 30, 48); },
    port: x => { x.beginPath(); x.moveTo(0, -30); x.quadraticCurveTo(-26, -40, -52, -30); x.lineTo(-52, 30); x.quadraticCurveTo(-26, 20, 0, 30); x.quadraticCurveTo(26, 20, 52, 30); x.lineTo(52, -30); x.quadraticCurveTo(26, -40, 0, -30); x.lineTo(0, 30); x.stroke();
      x.font = F(800, 24, 'SEI Rubik'); x.textAlign = 'center'; x.textBaseline = 'middle'; x.strokeText('Aa', -26, -4); x.beginPath(); for (const yy of [-10, 2, 14]) { x.moveTo(10, yy); x.lineTo(42, yy); } x.stroke();
      x.beginPath(); x.moveTo(40, -60); x.quadraticCurveTo(70, -80, 78, -46); x.quadraticCurveTo(58, -40, 46, -26); x.closePath(); x.moveTo(46, -26); x.lineTo(34, -12); x.stroke(); },
    cien: x => { x.beginPath(); x.moveTo(-18, -50); x.lineTo(-18, -8); x.lineTo(-44, 40); x.quadraticCurveTo(-46, 50, -36, 50); x.lineTo(36, 50); x.quadraticCurveTo(46, 50, 44, 40); x.lineTo(18, -8); x.lineTo(18, -50); x.moveTo(-26, -50); x.lineTo(26, -50); x.moveTo(-34, 22); x.lineTo(34, 22); x.stroke();
      [[-12, 34, 4], [8, 30, 3], [0, 10, 3]].forEach(([a, b, r]) => { x.beginPath(); x.arc(a, b, r, 0, Math.PI * 2); x.stroke(); });
      x.save(); x.translate(70, -10); for (let i = 0; i < 2; i++) { x.beginPath(); for (let t = 0; t <= 1.001; t += .05) { const yy = -40 + t * 80, xx = Math.sin(t * Math.PI * 2 + i * Math.PI) * 12; t ? x.lineTo(xx, yy) : x.moveTo(xx, yy); } x.stroke(); } for (let t = .1; t < 1; t += .2) { const yy = -40 + t * 80; x.beginPath(); x.moveTo(Math.sin(t * Math.PI * 2) * 12, yy); x.lineTo(Math.sin(t * Math.PI * 2 + Math.PI) * 12, yy); x.stroke(); } x.restore(); },
    geo: x => { x.beginPath(); x.arc(0, 0, 40, 0, Math.PI * 2); x.stroke(); x.beginPath(); x.ellipse(0, 0, 18, 40, 0, 0, Math.PI * 2); x.stroke(); x.beginPath(); x.moveTo(-40, 0); x.lineTo(40, 0); x.moveTo(-35, -20); x.lineTo(35, -20); x.moveTo(-35, 20); x.lineTo(35, 20); x.stroke();
      x.save(); x.translate(70, 30); x.beginPath(); x.arc(0, 0, 22, 0, Math.PI * 2); x.stroke(); x.beginPath(); x.moveTo(0, -16); x.lineTo(5, 0); x.lineTo(0, 16); x.lineTo(-5, 0); x.closePath(); x.fill(); x.font = F(800, 11, 'SEI Poppins'); x.textAlign = 'center'; x.fillText('N', 0, -26); x.restore(); },
    arte: x => { x.beginPath(); x.moveTo(0, -40); x.bezierCurveTo(46, -42, 62, 4, 40, 26); x.bezierCurveTo(24, 40, 22, 18, 6, 26); x.bezierCurveTo(-8, 34, 2, 48, -18, 44); x.bezierCurveTo(-54, 38, -56, -38, 0, -40); x.stroke();
      [[-24, -14], [-4, -24], [18, -18], [-28, 12]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 6, 0, Math.PI * 2); x.stroke(); }); x.beginPath(); x.moveTo(50, -50); x.lineTo(14, 4); x.moveTo(56, -44); x.lineTo(46, -56); x.stroke(); },
    hist: x => { x.beginPath(); x.moveTo(-40, -36); x.lineTo(40, -36); x.lineTo(32, -46); x.lineTo(-32, -46); x.closePath(); x.moveTo(-36, 40); x.lineTo(36, 40); x.moveTo(-40, 48); x.lineTo(40, 48); for (const xx of [-26, -9, 9, 26]) { x.moveTo(xx - 5, -36); x.lineTo(xx - 5, 40); x.moveTo(xx + 5, -36); x.lineTo(xx + 5, 40); } x.stroke();
      x.save(); x.translate(72, 4); x.beginPath(); x.moveTo(-14, -26); x.lineTo(14, -26); x.lineTo(-14, 26); x.lineTo(14, 26); x.closePath(); x.stroke(); x.restore(); },
    quim: x => { [[-30, 0], [0, -18], [30, 0], [30, 34], [0, 52], [-30, 34]].forEach((p, i, l) => { const q = l[(i + 1) % 6]; x.beginPath(); x.moveTo(p[0], p[1]); x.lineTo(q[0], q[1]); x.stroke(); }); x.beginPath(); x.arc(0, 17, 16, 0, Math.PI * 2); x.stroke();
      x.font = F(700, 20, 'SEI Rubik'); x.textAlign = 'center'; x.strokeText('H₂O', 70, -10); },
    ingles: x => { x.beginPath(); x.moveTo(-60, -26); x.lineTo(60, -26); x.quadraticCurveTo(68, -26, 68, -18); x.lineTo(68, 18); x.quadraticCurveTo(68, 26, 60, 26); x.lineTo(-20, 26); x.lineTo(-36, 42); x.lineTo(-34, 26); x.lineTo(-60, 26); x.quadraticCurveTo(-68, 26, -68, 18); x.lineTo(-68, -18); x.quadraticCurveTo(-68, -26, -60, -26); x.stroke();
      x.font = F(800, 24, 'SEI Rubik'); x.textAlign = 'center'; x.textBaseline = 'middle'; x.strokeText('Hello!', 0, 0); },
    ef: x => { x.beginPath(); x.arc(0, 0, 36, 0, Math.PI * 2); x.stroke(); x.beginPath(); x.moveTo(0, -12); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; x.lineTo(Math.cos(a) * 13, Math.sin(a) * 13); } x.closePath(); x.fill();
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; x.beginPath(); x.moveTo(Math.cos(a) * 13, Math.sin(a) * 13); x.lineTo(Math.cos(a) * 36, Math.sin(a) * 36); x.stroke(); } },
    fis: x => { x.font = F(800, 30, 'SEI Rubik'); x.textAlign = 'center'; x.textBaseline = 'middle'; x.strokeText('E=mc²', 0, 0); x.beginPath(); x.ellipse(0, 0, 70, 24, -.2, 0, Math.PI * 2); x.stroke(); }
  };
  /* fundo da carteirinha: azul com desenhos de traço, faixas de luz, brilhos e pontinhos */
  const fundoCart = {};
  function cartaoFundo(verso) {
    const k = verso ? 'v' : 'f'; if (fundoCart[k]) return fundoCart[k];
    const W = 1011, H = 638, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    let sd = verso ? 7 : 3; const rnd = () => (sd = (sd * 9301 + 49297) % 233280) / 233280;
    let g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#051238'); g.addColorStop(.5, '#0a2f86'); g.addColorStop(1, '#1652c9'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    const glow = (cx, cy, r, cor) => { const gg = x.createRadialGradient(cx, cy, 0, cx, cy, r); gg.addColorStop(0, cor); gg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gg; x.fillRect(0, 0, W, H); };
    glow(verso ? 180 : 820, verso ? 520 : 170, 420, 'rgba(60,150,255,.45)'); glow(verso ? 900 : 90, verso ? 90 : 560, 300, 'rgba(255,211,77,.10)');
    // linhas diagonais finas
    x.save(); x.globalAlpha = .06; x.strokeStyle = '#bfe6ff'; x.lineWidth = 1.5; for (let i = -H; i < W; i += 16) { x.beginPath(); x.moveTo(i, H); x.lineTo(i + H, 0); x.stroke(); } x.restore();
    // trama de pontinhos num canto
    x.save(); x.fillStyle = '#9fdcff'; for (let yy = 0; yy < 220; yy += 14) for (let xx = 0; xx < 260; xx += 14) { const d = Math.hypot(xx, yy) / 330; if (d > 1) continue; x.globalAlpha = .28 * (1 - d); x.beginPath(); x.arc(verso ? W - 20 - xx : W - 20 - xx, verso ? H - 60 - yy : 20 + yy, 2.6 * (1 - d) + .6, 0, Math.PI * 2); x.fill(); } x.restore();
    // desenhos das disciplinas (poucos, maiores e bem definidos)
    x.save(); x.strokeStyle = 'rgba(170,225,255,.5)'; x.fillStyle = 'rgba(170,225,255,.5)'; x.lineWidth = 3.4; x.lineJoin = 'round'; x.lineCap = 'round';
    const L = verso ? [['ingles', 610, 330, -.06, .85], ['fis', 590, 470, -.05, .85], ['quim', 905, 455, -.1, .8], ['hist', 110, 455, 0, .75], ['ef', 300, 470, 0, .8]]
      : [['mat', 900, 212, -.1, .95], ['cien', 590, 250, .08, .7], ['port', 520, 322, -.06, .7]];
    for (const [n, a, b, r, k] of L) { x.save(); x.translate(a, b); x.rotate(r); x.scale(k, k); DISC[n](x); x.restore(); }
    x.restore();
    // faixas de luz curvas
    [[0, .9, 6], [30, .55, 3], [-26, .4, 2.2]].forEach(([d, a, w]) => { const lg = x.createLinearGradient(0, 0, W, 0); lg.addColorStop(0, 'rgba(140,215,255,0)'); lg.addColorStop(.35, `rgba(170,230,255,${a})`); lg.addColorStop(.7, `rgba(255,220,120,${a * .7})`); lg.addColorStop(1, 'rgba(255,220,120,0)');
      x.strokeStyle = lg; x.lineWidth = w; x.beginPath(); if (verso) { x.moveTo(-40, 470 + d); x.bezierCurveTo(300, 600 + d, 650, 380 + d, W + 40, 520 + d); } else { x.moveTo(-40, 600 + d); x.bezierCurveTo(260, 540 + d, 600, 660 + d, W + 40, 470 + d); } x.stroke(); });
    // brilhos
    const brilho = (bx, by, r, a) => { x.save(); x.globalAlpha = a; x.fillStyle = '#fff'; x.beginPath(); x.moveTo(bx, by - r); x.quadraticCurveTo(bx, by, bx + r, by); x.quadraticCurveTo(bx, by, bx, by + r); x.quadraticCurveTo(bx, by, bx - r, by); x.quadraticCurveTo(bx, by, bx, by - r); x.fill(); x.restore(); };
    for (let i = 0; i < 16; i++) brilho(rnd() * W, rnd() * H, 6 + rnd() * 12, .25 + rnd() * .45);
    x.save(); x.fillStyle = '#fff'; for (let i = 0; i < 60; i++) { x.globalAlpha = .15 + rnd() * .35; x.beginPath(); x.arc(rnd() * W, rnd() * H, .8 + rnd() * 1.8, 0, Math.PI * 2); x.fill(); } x.restore();
    return (fundoCart[k] = c.toDataURL('image/jpeg', .9));
  }
  const cache = new Map();
  /* o: { titulo, placa: {grande, linhas[]}, campos: [[rótulo, valor] x4], selo: [a, b], rodape: [a, b], num, curto } */
  async function compor(o) {
    const k = JSON.stringify(o); if (cache.has(k)) return cache.get(k);
    const { c, f, l, lt } = await preparar();
    const cv = document.createElement('canvas'); cv.width = 1240; cv.height = 420; let x = cv.getContext('2d'); x.drawImage(c, 0, 0);
    if (o.estilo === 'folha') { placa(x, o.placa.grande, o.placa.linhas || []); titulo(x, o.titulo, 790, 210, 330, 90); barra(x, o.campos || []); seloF(x, ...(o.selo || [])); }
    else cabFormal(x, o, l, o.estilo === 'claro' || o.estilo === 'claro2', o.estilo === 'claro' ? null : lt);
    const cab = cv.toDataURL('image/jpeg', .9);
    const fv = document.createElement('canvas'); fv.width = 1240; fv.height = 1754; x = fv.getContext('2d'); x.drawImage(f, 0, 0);
    // marca-d'água: a logo da escola, bem clara, no centro da área branca (todas as páginas)
    if (o.agua === 'duas' && lt) { const w = 470, h = w * lt.height / lt.width; x.save(); x.globalAlpha = .07; [460, 1358].forEach(cy => x.drawImage(lt, 620 - w / 2, cy - h / 2, w, h)); x.restore(); }
    else if (o.agua !== false && lt) { const w = 760, h = w * lt.height / lt.width; x.save(); x.globalAlpha = .07; x.drawImage(lt, 620 - w / 2, 1000 - h / 2, w, h); x.restore(); }
    if (o.estilo === 'folha') banda(x, o.curto || o.titulo, (o.rodape || []).filter(Boolean).join(' — '), (o.campos || []).filter(cp => cp[1]).slice(0, 2));
    else bandaFormal(x, o, lt);
    rodape(x, ...(o.rodape || ['', '']), o.num || '', 1715, 1175);
    const fundo = fv.toDataURL('image/jpeg', .88);
    // faixa de cima da folha 2 (para os avisos com 2 cópias por folha)
    const bv = document.createElement('canvas'); if (o.estilo === 'folha') { bv.width = 1240; bv.height = 146; bv.getContext('2d').drawImage(fv, 0, 0); } else { bv.width = 1172; bv.height = 132; bv.getContext('2d').drawImage(fv, 34, 8, 1172, 132, 0, 0, 1172, 132); }
    const r = { cab, fundo, banda: bv.toDataURL('image/jpeg', .9) }; cache.set(k, r); return r;
  }
  window.seiFolha = { compor, preparar, cartaoFundo: v => preparar().then(() => cartaoFundo(v)) };
})();
