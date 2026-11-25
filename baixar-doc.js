/* Baixar documentos da escola em Word (.doc, editável) e em PDF.
   PDF: html2pdf (assets/vendor, licença MIT), gerado no próprio aparelho.
   Word: arquivo "página da web em arquivo único" que o Word abre e edita, com as imagens dentro. */
(function () {
  'use strict';
  const carregar = src => new Promise((ok, erro) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = erro; document.head.appendChild(s); });
  const nomeArq = n => (n || 'documento').replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim().slice(0, 90);
  const espera = el => Promise.all([...el.querySelectorAll('img')].map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; })));
  function aviso(t) { let a = document.getElementById('aeeAviso'); if (!a) { a = document.createElement('div'); a.id = 'aeeAviso'; a.className = 'no-print'; document.body.append(a); } a.textContent = t; a.hidden = false; clearTimeout(aviso.t); aviso.t = setTimeout(() => { a.hidden = true; }, 3000); }

  /* ---------- PDF ---------- */
  // PDF com a moldura da escola em todas as páginas (fundo, borda, rodapé com QR Code)
  const MARG0 = { t: 13, l: 14, r: 14, b: 31 }, MARG_F = { t: 27, l: 12, r: 12, b: 14 }, CAB_MM = 420 * 210 / 1240;
  const imgCarrega = src => new Promise((ok, er) => { const i = new Image(); i.onload = () => ok(i); i.onerror = er; i.src = src; });
  async function pdf(html, nome, fol) {
    const MARG = fol ? MARG_F : MARG0;
    aviso('⏳ Gerando o PDF…');
    if (!window.html2pdf) await carregar('assets/vendor/html2pdf.bundle.min.js');
    const fora = document.createElement('div'); Object.assign(fora.style, { position: 'fixed', left: '-10000px', top: '0', width: (210 - MARG.l - MARG.r) + 'mm' });
    const caixa = document.createElement('div'); caixa.className = 'sei-pdf';
    Object.assign(caixa.style, { width: (210 - MARG.l - MARG.r) + 'mm', background: 'transparent', display: 'block' });
    caixa.innerHTML = html; fora.append(caixa); document.body.append(fora);
    if (fol) caixa.querySelectorAll('img.folha-cab').forEach(im => { const s = document.createElement('div'); s.style.height = (CAB_MM - MARG.t + 3) + 'mm'; im.replaceWith(s); });
    try {
      await espera(caixa); if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const opt = { margin: [MARG.t, MARG.l, MARG.b, MARG.r], html2canvas: { scale: 2, useCORS: true, backgroundColor: null }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['.doc-b', '.sei-cab', '.doc-ass', 'tr', '.cal-m', '.doc-aviso'] } };
      const canvas = await html2pdf().set(opt).from(caixa).toContainer().then(function () { this.prop.container.style.background = 'transparent'; if (this.prop.overlay) this.prop.overlay.style.background = 'transparent'; }).toCanvas().get('canvas');
      const base = await html2pdf().set({ jsPDF: opt.jsPDF }).from('<div></div>').toPdf().get('pdf');
      const doc = base; // já vem com uma página A4 em branco
      const moldura = await imgCarrega(fol ? fol.fundo : 'assets/docs/moldura-doc.jpg?v=3'); const cabImg = fol && fol.cab ? await imgCarrega(fol.cab) : null;
      const larg = 210 - MARG.l - MARG.r, alt = 297 - MARG.t - MARG.b, pxmm = canvas.width / larg, pagPx = Math.floor(alt * pxmm);
      const n = Math.max(1, Math.ceil((canvas.height - 2) / pagPx));
      for (let p = 0; p < n; p++) {
        if (p) doc.addPage();
        doc.addImage(moldura, 'JPEG', 0, 0, 210, 297, 'moldura', 'FAST');
        if (p === 0 && cabImg && html.includes('folha-cab')) doc.addImage(cabImg, 'JPEG', 0, 0, 210, CAB_MM, 'cabfolha', 'FAST');
        const h = Math.min(pagPx, canvas.height - p * pagPx); if (h <= 0) break;
        const c = document.createElement('canvas'); c.width = canvas.width; c.height = h;
        c.getContext('2d').drawImage(canvas, 0, p * pagPx, canvas.width, h, 0, 0, canvas.width, h);
        doc.addImage(c.toDataURL('image/png'), 'PNG', MARG.l, MARG.t, larg, h / pxmm, undefined, 'FAST');
      }
      doc.save(nomeArq(nome) + '.pdf');
      aviso('✅ PDF baixado.');
    } catch (e) { alert('Não consegui gerar o PDF: ' + (e && e.message || e)); }
    fora.remove();
  }

  /* ---------- Word ---------- */
  // O Word não entende flex/grid: troca as partes de layout por tabelas
  function paraWord(html, fol) {
    const d = document.createElement('div'); d.innerHTML = html;
    if (fol && fol.cab) { d.querySelectorAll('img.folha-cab').forEach(im => { const p = document.createElement('p'); p.className = 'w-espaco'; p.innerHTML = '&nbsp;'; im.replaceWith(p); }); d.querySelectorAll('.sei-rod').forEach(x => x.remove()); }
    d.querySelectorAll('.par-agua').forEach(x => x.remove()); // o Word não põe imagem atrás do texto
    d.querySelectorAll('img.folha-cab,img.folha-banda').forEach(im => { const p = document.createElement('p'); p.setAttribute('align', 'center'); const cabI = im.classList.contains('folha-cab'); const nw = im.naturalWidth || (cabI ? 1240 : 1172), nh = im.naturalHeight || (cabI ? 420 : 132); p.innerHTML = `<img src="${im.getAttribute('src')}" width="680" data-w="${nw}" data-h="${nh}">`; im.replaceWith(p); });
    d.querySelectorAll('.sei-cab').forEach(c => {
      const st = c.querySelector('strong'); const t = document.createElement('div');
      t.innerHTML = `<p align="center"><img src="assets/docs/cab-doc.jpg?v=3" width="680"></p><p class="w-tit-c">${st.innerHTML}</p>`;
      c.replaceWith(...t.childNodes);
    });
    d.querySelectorAll('.cfs').forEach(c => { const t = document.createElement('table'); t.className = 'w-cfs'; t.setAttribute('width', '100%'); t.innerHTML = `<tr>${[...c.children].map(f => `<td valign="bottom"><small>${(f.querySelector('small') || {}).textContent || ''}</small><br><b>${((f.querySelector('b') || {}).textContent || '').trim() || '__________________________'}</b></td>`).join('')}</tr>`; c.replaceWith(t); });
    d.querySelectorAll('[style*="page-break-before"]').forEach(x => { if (x.previousElementSibling || x.parentNode !== d) x.insertAdjacentHTML('beforebegin', '<p><br style="page-break-before:always"></p>'); x.style.pageBreakBefore = ''; x.style.breakBefore = ''; });
    d.querySelectorAll('.doc-2.metade').forEach(g => { g.querySelectorAll(':scope > .doc-aviso').forEach(v => { const t = document.createElement('table'); t.className = 'ml-cx'; t.setAttribute('width', '100%'); t.innerHTML = `<tr class="ml-cxr"><td width="100%" valign="top">${v.innerHTML}</td></tr>`; v.replaceWith(t); }); g.querySelectorAll(':scope > .ml-gap').forEach(x => { x.outerHTML = '<p class="ml-gapw">&nbsp;</p>'; }); });
    d.querySelectorAll('.ml-grp').forEach(x => x.insertAdjacentHTML('afterend', '<p class="ml-sp">&nbsp;</p>'));
    d.querySelectorAll('.cv-txt').forEach(x => { if (!x.querySelector('p,div')) x.innerHTML = x.innerHTML.split(/<br>\s*<br>/).map(p => `<p class="cv-txt">${p}</p>`).join(''); });
    d.querySelectorAll('.eq-faixa').forEach(f => { const sm = f.querySelector('small'), bb = f.querySelector('b'); const t = document.createElement('table'); t.className = 'eq-fx'; t.setAttribute('width', '100%'); t.innerHTML = `<tr class="eq-fxr"><td width="100%" align="center" style="background:#0b2a6b;color:#ffffff">${sm ? `<small style="color:#ffd34d">${sm.innerHTML}</small><br>` : ''}<b style="color:#ffffff">${bb ? bb.innerHTML : ''}</b></td></tr>`; f.replaceWith(t); });
    d.querySelectorAll('.eq-faixa small, .eq-faixa-a small, .calp-sem').forEach(x => x.insertAdjacentHTML('afterend', '<br>'));
    d.querySelectorAll('.sei-fita').forEach(f => { const p = document.createElement('p'); p.className = 'w-fita'; p.innerHTML = f.innerHTML; f.replaceWith(p); });
    d.querySelectorAll('.sei-rod').forEach(r => { const t = document.createElement('table'); t.className = 'w-rod'; t.setAttribute('width', '100%'); t.innerHTML = `<tr>${[...r.children].map(s => `<td class="w-azul2">${s.innerHTML}</td>`).join('')}</tr>`; r.replaceWith(t); });
    d.querySelectorAll('.doc-num').forEach(n => { const t = document.createElement('table'); t.setAttribute('width', '100%'); t.innerHTML = `<tr><td>${n.children[0].outerHTML}</td><td align="right">${n.children[1] ? n.children[1].innerHTML : ''}</td></tr>`; n.replaceWith(t); });
    d.querySelectorAll('.doc-ass').forEach(a => { const ds = [...a.children]; const t = document.createElement('table'); t.className = 'w-ass'; t.setAttribute('width', '100%'); let h = ''; for (let i = 0; i < ds.length; i += 2) h += `<tr>${ds.slice(i, i + 2).map(x => `<td align="center" width="50%"><br><br>______________________________<br>${x.innerHTML.replace(/<span><\/span>/, '')}</td>`).join('')}</tr>`; t.innerHTML = h; a.replaceWith(t); });
    d.querySelectorAll('img.cm-ic').forEach(i => i.remove());
    d.querySelectorAll('.bol-graf').forEach(x => x.remove());
    d.querySelectorAll('.eq-posts').forEach(g => { const cs = [...g.children]; const t = document.createElement('table'); t.className = 'eq-pw'; t.setAttribute('width', '100%'); let h = ''; const L = (r, n) => `<small style="color:#5a6b8c">${r}: ${'_'.repeat(n)}</small>`;
      const cel = c => { if (!c) return '<td width="17%"></td><td width="32%"></td>'; const pc = c.querySelector('.eq-pc'), vz = c.classList.contains('eq-novo'), cor = vz ? '#e3e9f3' : pc.dataset.cor || '#0b2a6b';
        const n = (pc.querySelector('.eq-pn') || {}).textContent || '', comp = (pc.querySelector('b') || {}).innerHTML || '', nome = (c.querySelector('.eq-pnm') || {}).innerHTML || '';
        return `<td width="17%" style="background:${cor};color:${vz ? '#7d8aa5' : '#ffffff'}"><small style="color:${vz ? '#7d8aa5' : '#ffe58a'}">${n}</small><br>${comp}</td><td width="32%" class="eq-pwt">${vz ? `${L('NOME E COMPONENTE', 20)}<br>${L('WHATSAPP', 26)}<br>${L('ASSINATURA', 24)}` : `<b>${nome}</b><br>${L('WHATSAPP', 26)}<br>${L('ASSINATURA', 24)}`}</td>`; };
      for (let i = 0; i < cs.length; i += 2) h += `<tr class="eq-pr">${cel(cs[i])}<td width="2%"></td>${cel(cs[i + 1])}</tr><tr class="eq-pg"><td colspan="5"></td></tr>`;
      t.innerHTML = h; g.replaceWith(t); });
    d.querySelectorAll('.eq-card small').forEach(x => x.insertAdjacentHTML('afterend', '<br>'));
    d.querySelectorAll('.eq-adm').forEach(g => { const cs = [...g.children]; const t = document.createElement('table'); t.setAttribute('width', '100%'); t.className = 'doc-id'; let h = ''; for (let i = 0; i < cs.length; i += 2) h += `<tr>${cs.slice(i, i + 2).map(c => `<td width="50%">${c.innerHTML}</td>`).join('')}</tr>`; t.innerHTML = h; g.replaceWith(t); }); d.querySelectorAll('.eq-faixa b').forEach(x => x.insertAdjacentHTML('afterend', '<br>'));
    d.querySelectorAll('.av-t th:not(.avi)').forEach(x => x.setAttribute('align', 'center')); d.querySelectorAll('.avg-n').forEach(x => x.insertAdjacentHTML('afterend', '&nbsp;&nbsp;')); d.querySelectorAll('.av-t td.avc').forEach(x => { const i = x.querySelector('i'); const c = i && i.style.borderColor || '#1e4fb8'; x.innerHTML = `<span style="color:${c};font-size:8.5pt">◯</span>`; x.setAttribute('align', 'center'); }); d.querySelectorAll('.av-ab').forEach(x => { const n = (x.querySelector('.av-n') || {}).textContent || '', q = (x.querySelector('.av-abq b') || {}).innerHTML || ''; const k = x.querySelectorAll('.av-abl i').length || 3; const t = document.createElement('div'); t.innerHTML = `<p class="av-bq"><b class="av-num">&nbsp;${n}&nbsp;</b>  <b>${q}</b></p>${Array.from({ length: k }, (_, i) => `<p class="av-bl${i === k - 1 ? ' av-bl-fim' : ''}">&nbsp;</p>`).join('')}<p class="av-bgap">&nbsp;</p>`; x.replaceWith(...t.childNodes); }); d.querySelectorAll('.av-t tr').forEach(tr => { const cs = [...tr.children]; if (cs.length > 2) { const w = cs.length > 6 ? 9 : 11; cs.forEach((c, i) => c.setAttribute('width', i ? w + '%' : (100 - (cs.length - 1) * w) + '%')); } else if (cs.length === 2) cs.forEach((c, i) => c.setAttribute('width', i ? '20%' : '80%')); });
    d.querySelectorAll('.rc-agua, .rc-masc').forEach(x => x.remove()); d.querySelectorAll('.rc-can-logo, .rc-top > img').forEach(x => x.setAttribute('width', '80')); d.querySelectorAll('.rc-tit-img').forEach(x => x.setAttribute('width', '150'));
    d.querySelectorAll('.mapa-t tr').forEach(tr => { const cs = [...tr.children]; const n = cs.length - 2; cs.forEach((c, i) => c.setAttribute('width', i === 0 ? '5%' : i === 1 ? '41%' : Math.floor(54 / n) + '%')); }); d.querySelectorAll('.mapa-top b').forEach(x => x.insertAdjacentHTML('beforebegin', '<br>'));
    d.querySelectorAll('.etq-logo').forEach(x => x.setAttribute('width', '150')); d.querySelectorAll('.etq-masc').forEach(x => x.setAttribute('width', '150')); d.querySelectorAll('.etq-selo').forEach(x => x.setAttribute('width', '260'));
    d.querySelectorAll('img.hc-ic, img.hc-tr, .hcA .hcx > i').forEach(x => x.remove()); d.querySelectorAll('.hcC-h img').forEach(x => x.setAttribute('width', '14')); d.querySelectorAll('img.hcD-art').forEach(x => { x.setAttribute('width', '100'); x.dataset.w = '520'; x.dataset.h = '280'; });
    d.querySelectorAll('.ct-fx, .ct-bg, .ct-ic').forEach(x => x.remove()); d.querySelectorAll('.ct-logo').forEach(x => x.setAttribute('width', '70')); d.querySelectorAll('.ct-foto img').forEach(x => x.setAttribute('width', '80')); d.querySelectorAll('.ct-qr').forEach(x => x.setAttribute('width', '70')); d.querySelectorAll('.bol-foto').forEach(x => x.setAttribute('width', '56'));
    d.querySelectorAll('.cart-par').forEach(c => { const t = document.createElement('table'); t.setAttribute('width', '100%'); t.className = 'doc-id'; t.innerHTML = `<tr>${[...c.querySelectorAll('.cart')].map(k => `<td valign="top" width="50%">${k.innerHTML}</td>`).join('')}</tr>`; c.replaceWith(t); });
    d.querySelectorAll('.hc small, .hh b, .hh small, .bol-st b, .bol-st em, .bol-nome b, .hor-top b, .cal-res2 b').forEach(x => x.insertAdjacentHTML('beforebegin', '<br>'));
    d.querySelectorAll('.bol-t tr').forEach(tr => { const cs = [...tr.children]; cs.forEach((c, i) => c.setAttribute('width', i === 0 ? '24%' : i === cs.length - 1 ? '13%' : Math.floor(63 / (cs.length - 2)) + '%')); });
    d.querySelectorAll('.bol-tags i').forEach(x => x.insertAdjacentHTML('afterend', '   '));
    d.querySelectorAll('.cm-ev i').forEach(i => { const b = document.createElement('b'); b.style.color = i.style.background; b.textContent = i.textContent + ' '; i.replaceWith(b); });
    d.querySelectorAll('.cm-h').forEach(h => { const p = document.createElement('p'); p.className = 'w-mes'; p.style.background = h.style.background; p.innerHTML = `${h.querySelector('b').innerHTML}${h.querySelector('span') ? ' · ' + h.querySelector('span').innerHTML : ''}`; h.replaceWith(p); });
    d.querySelectorAll('.calp').forEach(c => { const ms = [...c.children]; const t = document.createElement('table'); t.setAttribute('width', '100%'); let h = ''; for (let i = 0; i < ms.length; i += 3) h += `<tr>${ms.slice(i, i + 3).map(m => `<td valign="top" width="33%">${m.innerHTML}</td>`).join('')}</tr>`; t.innerHTML = h; c.replaceWith(t); });
    d.querySelectorAll('.calp-tot').forEach(x => { x.outerHTML = `<p class="w-tot">${x.textContent.replace(/\s+/g, ' ').trim()}</p>`; });
    d.querySelectorAll('.cal').forEach(c => { const ms = [...c.children]; const t = document.createElement('table'); t.setAttribute('width', '100%'); let h = ''; for (let i = 0; i < ms.length; i += 4) h += `<tr>${ms.slice(i, i + 4).map(m => `<td valign="top" width="25%">${m.innerHTML}</td>`).join('')}</tr>`; t.innerHTML = h; c.replaceWith(t); });
    d.querySelectorAll('.doc-b h4').forEach(h => { const p = document.createElement('p'); p.className = 'w-h4'; p.innerHTML = h.innerHTML; h.replaceWith(p); });
    d.querySelectorAll('.doc-t').forEach(x => { const t = document.createElement('table'); t.className = 'w-caixa'; t.setAttribute('width', '100%'); t.innerHTML = `<tr><td>${x.innerHTML}</td></tr>`; x.replaceWith(t); });
    d.querySelectorAll('.doc-corte').forEach(x => { x.outerHTML = '<p class="w-corte">- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - recorte aqui</p>'; });
    d.querySelectorAll('.doc-pag').forEach((x, i, l) => { if (i < l.length - 1) x.insertAdjacentHTML('afterend', '<br clear="all" style="page-break-before:always">'); });
    return d.innerHTML;
  }
  /* HTML simples -> WordprocessingML (.docx) */
  const X = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const hex = c => { if (!c) return null; c = c.trim(); let m = /^#([0-9a-f]{6})$/i.exec(c); if (m) return m[1].toUpperCase(); m = /^#([0-9a-f]{3})$/i.exec(c); if (m) return m[1].split('').map(x => x + x).join('').toUpperCase(); m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c); return m ? [m[1], m[2], m[3]].map(v => (+v).toString(16).padStart(2, '0')).join('').toUpperCase() : null; };
  // aparência por classe
  const P = { 'w-sm': { r: { cor: '8BF5FF', sz: 7.5, b: 1 } }, 'w-tit': { r: { cor: 'FFFFFF', sz: 20, b: 1, font: 'Arial Black' }, esp: [20, 0] }, 'w-tit-p': { r: { cor: 'FFFFFF', sz: 12, b: 1, font: 'Arial Black' }, esp: [20, 0] }, 'w-tit-c': { jc: 'center', fill: '0B2A5B', r: { cor: 'FFFFFF', sz: 22, b: 1, font: 'Arial Black' }, esp: [40, 0] },
    'w-fita': { jc: 'center', fill: '0A3A9C', r: { cor: 'FFFFFF', sz: 7.5, b: 1 }, esp: [0, 160] }, 'w-h4': { fill: '0B2A5B', r: { cor: 'FFFFFF', sz: 8.5, b: 1, caps: 1 }, esp: [140, 0] },
    'w-corte': { jc: 'center', r: { cor: '888888', sz: 8 } }, 'doc-para': { r: { b: 1, sz: 12 } }, 'doc-fim': { esp: [200, 0] }, 'doc-rev': { r: { sz: 9 } }, 'doc-num': {},
    'doc-corpo': { linha: 1.5 }, 'grande': { r: { sz: 12.5 } }, 'cal-res': { r: { sz: 9 } }, 'cal-leg': { r: { sz: 8 } }, 'doc-dest': { r: { b: 1 } }, 'cm-ev': { r: { sz: 7 } }, 'cal-leg2': { r: { sz: 7 } }, 'w-mes': { jc: 'center', r: { cor: 'FFFFFF', b: 1, sz: 9.5 }, esp: [60, 40] }, 'w-tot': { jc: 'right', r: { b: 1, sz: 11, cor: '0B2A6B' }, esp: [120, 0] }, 'w-espaco': { esp: [0, 0], alto: 1 }, 'av-int': { fill: 'EEF4FD', esp: [0, 120] }, 'eq-faixa': { fill: '0B2A6B', jc: 'center', r: { cor: 'FFD34D', b: 1, sz: 10 }, esp: [0, 100] }, 'av-fim': { jc: 'center', r: { b: 1, cor: '1E4FB8' } }, 'av-instr': { r: { sz: 8.5 }, esp: [0, 80] }, 'av-ck': { r: { sz: 9 }, esp: [40, 80] }, 'av-sec': { fill: '0B2A6B', r: { cor: 'FFFFFF', b: 1, sz: 8 }, esp: [120, 80] }, 'av-nps-l': { r: { sz: 7.5, cor: '5A6B8C' }, esp: [20, 100] }, 'av-nota': { r: { sz: 8, cor: '0A7A5A', i: 1 }, esp: [0, 80] }, 'av-dev': { fill: 'F7F9FD', r: { sz: 8.5 }, esp: [80, 40] }, 'eq-obs': { r: { sz: 7.5, cor: '5A6B8C', i: 1 }, esp: [40, 0] }, 'eq-li': { r: { sz: 9.5 }, esp: [0, 60] }, 'eq-faixa-a': { jc: 'center', r: { cor: 'FFFFFF', b: 1, sz: 11 }, esp: [0, 380] }, 'cv-tit': { jc: 'center', r: { b: 1, sz: 15, cor: '0B2A6B' }, esp: [60, 120] }, 'cv-lei': { fill: 'F7F9FD', r: { sz: 8.5, i: 1, cor: '33415F' }, esp: [120, 120] }, 'cv-fim': { jc: 'center', r: { b: 1, sz: 11, cor: '1E4FB8' }, esp: [160, 60] }, 'cv-txt': { jc: 'both', linha: 1.4, r: { sz: 11.5 } }, 'fm-ola': { r: { b: 1, sz: 11, cor: '1E4FB8' }, esp: [0, 40] }, 'fm-tit': { r: { b: 1, sz: 17, cor: '0B2A6B' }, esp: [0, 100] }, 'fm-txt': { jc: 'both', linha: 1.4, r: { sz: 11 } }, 'fm-l': { r: { sz: 10 }, esp: [20, 20] }, 'fm-sec': { r: { b: 1, sz: 8.5, cor: '1E4FB8' }, esp: [100, 60] }, 'fm-ppp': { fill: 'FFF8E1', r: { sz: 9.5 }, esp: [80, 80] }, 'fm-can-t': { r: { b: 1, sz: 8.5, cor: '0B2A6B' }, esp: [40, 40] }, 'fm-can-o': { r: { sz: 9.5 }, esp: [40, 0] }, 'fm-obr': { jc: 'center', r: { b: 1, sz: 10, cor: '1E4FB8' }, esp: [0, 120] }, 'av-bq': { fill: 'EEF4FD', r: { b: 1, sz: 9, cor: '0B2A6B' }, esp: [0, 0], kn: 1, bdr: '<w:top w:val="single" w:sz="4" w:space="2" w:color="C9D6EA"/><w:left w:val="single" w:sz="36" w:space="4" w:color="1E4FB8"/><w:bottom w:val="dashed" w:sz="4" w:space="2" w:color="9AB3DE"/><w:right w:val="single" w:sz="4" w:space="4" w:color="C9D6EA"/>' }, 'av-bl': { esp: [0, 0], exato: 390, kn: 1, bdr: '<w:left w:val="single" w:sz="36" w:space="4" w:color="1E4FB8"/><w:bottom w:val="dashed" w:sz="4" w:space="2" w:color="9AB3DE"/><w:right w:val="single" w:sz="4" w:space="4" w:color="C9D6EA"/><w:between w:val="dashed" w:sz="4" w:space="2" w:color="9AB3DE"/>' }, 'av-bl-fim': { kn: 0, bdr: '<w:left w:val="single" w:sz="36" w:space="4" w:color="1E4FB8"/><w:bottom w:val="single" w:sz="4" w:space="2" w:color="C9D6EA"/><w:right w:val="single" w:sz="4" w:space="4" w:color="C9D6EA"/>' }, 'av-bgap': { esp: [0, 0], exato: 150 }, 'ml-ola': { r: { b: 1, sz: 12, cor: '1E4FB8' }, esp: [0, 40] }, 'ml-txt': { linha: 1.3, r: { sz: 10.5 }, esp: [0, 0] }, 'ml-gh': { r: { b: 1, sz: 10.5 }, esp: [0, 40], linha: 1.6 }, 'ml-tit': { jc: 'center', r: { b: 1, sz: 13 }, esp: [40, 100] }, 'ml-rod': { fill: 'F7F9FD', r: { sz: 8.5 }, esp: [100, 0] }, 'ml-i': { r: { sz: 10 }, esp: [0, 0], exato: 340, bdr: '<w:bottom w:val="dashed" w:sz="4" w:space="2" w:color="DFE7F3"/>' }, 'ml-sp': { esp: [0, 0], exato: 260 }, 'ml-gapw': { esp: [0, 0], exato: 2608 }, 'ml-fim': { jc: 'center', r: { b: 1, sz: 11 }, esp: [160, 0] }, 'av-num': { r: { cor: 'FFD34D', hl: '0B2A6B', b: 1, sz: 9 } }, 'avg-n': { r: { cor: 'FFD34D', hl: '0B2A6B', b: 1, sz: 7 } }, 'av-anon': { r: { b: 1, cor: '0A7A5A', sz: 8 } }, 'eq-tit': { jc: 'center', r: { b: 1, sz: 15, cor: '0B2A6B' } }, 'ct-adm': { jc: 'center', r: { b: 1, sz: 7.5, cor: '0B2A6B' } }, 'doc-inep': { jc: 'center', r: { sz: 8, cor: '0B2A5B', b: 1 }, esp: [0, 200] }, 'dec': { jc: 'both', linha: 1.7, r: { sz: 12 } }, 'doc-data': { jc: 'right', esp: [240, 0] }, 'ress-sit': { esp: [160, 0] } };
  const T = { 'w-cab': { fill: '0A3A9C', borda: null, cor: 'FFFFFF' }, 'w-rod': { fill: '0B2A5B', borda: null, cor: 'FFFFFF', sz: 8, b: 1 }, 'w-caixa': { borda: '0B2A5B' }, 'w-ass': { borda: null },
    'doc-id': { borda: '777777', th: 'E8F1FF', thCor: '0B2A5B' }, 'doc-obj': { borda: '777777', th: 'E8F1FF', thCor: '0B2A5B' }, 'doc-bol': { borda: '777777', th: '0A3A9C', thCor: 'FFFFFF', jc: 'center', sz: 9 },
    'doc-hor': { borda: '777777', th: '0A3A9C', thCor: 'FFFFFF', jc: 'center', sz: 9 }, 'mapa-t': { borda: 'B9C6DD', th: '0B2A6B', thCor: 'FFFFFF', sz: 8 }, 'av-t': { borda: 'C9D6EA', th: '0B2A6B', thCor: 'FFFFFF', sz: 8 }, 'fq-t': { borda: 'B9C6DD', th: '0B2A6B', thCor: 'FFFFFF', sz: 7, jc: 'center' }, 'hist-t': { borda: 'B9C6DD', th: '0B2A6B', thCor: 'FFFFFF', sz: 7, jc: 'center' }, 'vl-t': { borda: 'B9C6DD', th: 'EEF4FD', thCor: '0B2A6B', sz: 6, jc: 'center' }, 'bol-t': { borda: 'D5DEF0', th: '0B2A6B', thCor: 'FFFFFF', jc: 'center', sz: 8.5 }, 'mapa-top': { borda: 'FFFFFF', fill: 'F1F5FC', cor: '0B2A6B', jc: 'center', sz: 8 }, 'hor-top': { borda: 'FFFFFF', fill: 'F1F5FC', cor: '0B2A6B', jc: 'center', sz: 8 }, 'cal-res2': { borda: 'FFFFFF', fill: 'DBE9FF', cor: '0B2A6B', jc: 'center', sz: 8 }, 'w-cfs': { borda: null, sz: 9 }, 'av-nps': { borda: 'FFFFFF', jc: 'center', sz: 9.5, b: 1, cor: '0B2A6B' }, 'eq-pw': { borda: null, sz: 8 }, 'cv-ev': { borda: 'FFFFFF', sz: 10.5 }, 'fm-ev': { borda: null, sz: 10 }, 'ml-top': { borda: null, sz: 10.5 }, 'ml-cx': { borda: null, sz: 10 }, 'ml-g': { borda: null, sz: 10 }, 'ml-av': { borda: 'FFFFFF', sz: 8.5 }, 'fm-mot': { borda: null, sz: 9.5, jc: 'center' }, 'fm-prog': { borda: 'FFFFFF', fill: 'F3F6FC', sz: 10 }, 'fm-cant': { borda: null, sz: 9 }, 'eq-fx': { borda: 'D4A72C', sz: 11 }, 'eq-r': { borda: 'C9D6EA', th: '0B2A6B', thCor: 'FFFFFF', sz: 8.5 } };
  function docx(html) {
    const d = document.createElement('div'); d.innerHTML = html; const imgs = []; let id = 1;
    const rPr = r => `<w:rPr><w:rFonts w:ascii="${r.font || 'Arial'}" w:hAnsi="${r.font || 'Arial'}" w:cs="${r.font || 'Arial'}"/>${r.b ? '<w:b/>' : ''}${r.i ? '<w:i/>' : ''}${r.caps ? '<w:caps/>' : ''}${r.cor ? `<w:color w:val="${r.cor}"/>` : ''}${r.u ? '<w:u w:val="single"/>' : ''}${r.hl ? `<w:shd w:val="clear" w:color="auto" w:fill="${r.hl}"/>` : ''}<w:sz w:val="${Math.round((r.sz || 10.5) * 2)}"/><w:szCs w:val="${Math.round((r.sz || 10.5) * 2)}"/></w:rPr>`;
    const estiloEl = (el, r) => { r = Object.assign({}, r); const t = el.tagName; if (t === 'B' || t === 'STRONG' || t === 'TH' || t === 'H2' || t === 'H4' || t === 'H5') r.b = 1; if (t === 'I' || t === 'EM') r.i = 1; if (t === 'SMALL') r.sz = (r.sz || 10.5) * 0.85;
      if (t === 'H2') { r.sz = 17; r.cor = '0A3A9C'; } for (const c of el.classList || []) if (P[c] && P[c].r) Object.assign(r, P[c].r); const cor = hex(el.style && el.style.color); if (cor) r.cor = cor;
      if (t === 'U') r.u = 1; const st = el.style; if (st) { if (/underline/.test(st.textDecoration || st.textDecorationLine || '')) r.u = 1; if (/bold|[6-9]00/.test(st.fontWeight || '')) r.b = 1; if (st.fontStyle === 'italic') r.i = 1;
        const fs = /([\d.]+)(pt|px)/.exec(st.fontSize || ''); if (fs) r.sz = fs[2] === 'px' ? +fs[1] * .75 : +fs[1]; if (st.fontFamily) r.font = st.fontFamily.split(',')[0].replace(/["']/g, '').trim();
        const hl = el.tagName === 'SPAN' && hex(st.backgroundColor); if (hl) r.hl = hl; }
      return r; };
    function runs(node, r) {
      let out = '';
      for (const n of node.childNodes) {
        if (n.nodeType === 3) { const t = n.nodeValue.replace(/\s+/g, ' '); if (t) out += `<w:r>${rPr(r)}<w:t xml:space="preserve">${X(t)}</w:t></w:r>`; continue; }
        if (n.nodeType !== 1) continue;
        if (n.tagName === 'BR') { out += /page-break/.test(n.getAttribute('style') || '') ? '<w:r><w:br w:type="page"/></w:r>' : '<w:r><w:br/></w:r>'; continue; }
        if (n.tagName === 'IMG') { out += imagem(n); continue; }
        if (n.tagName === 'I' && !n.textContent && n.style.background) { const c = hex(n.style.background) || '000000'; out += `<w:r>${rPr(Object.assign({}, r, { cor: c }))}<w:t xml:space="preserve">■ </w:t></w:r>`; continue; }
        out += runs(n, estiloEl(n, r));
      }
      return out;
    }
    function imagem(n) {
      if (n.classList.contains('w-fundo')) { const src = n.getAttribute('src'); const rid = 'rIdImg' + id; imgs.push({ src, rid, nome: 'img' + id + '.jpeg', ext: 'jpeg' }); const k = id++; const cx = W_TW * 635, cy = Math.round(cx * (+n.dataset.h || 96) / (+n.dataset.w || 1172));
        return `<w:r><w:drawing><wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="${2 + k}" behindDoc="1" locked="0" layoutInCell="1" allowOverlap="1"><wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="column"><wp:posOffset>0</wp:posOffset></wp:positionH><wp:positionV relativeFrom="paragraph"><wp:posOffset>-${Math.round(cy * .26)}</wp:posOffset></wp:positionV><wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapNone/><wp:docPr id="${k}" name="Faixa ${k}"/><wp:cNvGraphicFramePr/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${k}" name="faixa${k}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:anchor></w:drawing></w:r>`; }
      const src = n.getAttribute('src'); const w = +n.getAttribute('width') || n.naturalWidth || 100; const nat = n.dataset.w ? [+n.dataset.w, +n.dataset.h] : [w, w];
      const h = Math.round(w * nat[1] / nat[0]); const rid = 'rIdImg' + id; const ext = /\.jpe?g|^data:image\/jpe?g/i.test(src) ? 'jpeg' : 'png'; imgs.push({ src, rid, nome: 'img' + id + '.' + ext, ext }); const cx = w * 9525, cy = h * 9525; const k = id++;
      return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${k}" name="Imagem ${k}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${k}" name="img${k}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
    }
    function par(el, r, extra) {
      const cls = [...(el.classList || [])]; let jc = (el.getAttribute && el.getAttribute('align')) || null, fill = null, esp = null, linha = null;
      let bdr = '', exato = 0, kn = 0; for (const c of cls) if (P[c]) { if (P[c].jc) jc = P[c].jc; if (P[c].fill) fill = P[c].fill; if (P[c].esp) esp = P[c].esp; if (P[c].linha) linha = P[c].linha; if (P[c].bdr) bdr = P[c].bdr; if (P[c].exato) exato = P[c].exato; if ('kn' in P[c]) kn = P[c].kn; }
      if (el.tagName === 'H2' || el.tagName === 'H5') jc = 'center'; if (el.tagName === 'H5') fill = '0A3A9C'; const bgc = el.style && hex(el.style.background || el.style.backgroundColor); if (bgc && el.tagName === 'P') fill = bgc;
      if (extra) { if (extra.jc && !jc) jc = extra.jc; if (extra.linha && !linha) linha = extra.linha; }
      const sty = el.style; let ind = 0, pre = '';
      if (sty) { const ta = sty.textAlign; if (ta) jc = ta === 'justify' ? 'both' : ta; const lh = parseFloat(sty.lineHeight); if (lh && lh < 4) linha = lh; const ml = /([\d.]+)px/.exec(sty.marginLeft || sty.paddingLeft || ''); if (ml) ind = Math.round(+ml[1] * 15); }
      if (el.tagName === 'BLOCKQUOTE') ind = ind || 600;
      if (el.tagName === 'LI') { const ol = el.parentNode && el.parentNode.tagName === 'OL'; pre = ol ? ([...el.parentNode.children].indexOf(el) + 1) + '. ' : '• '; ind = ind || 360; }
      const rr = estiloEl(el, r); if (el.tagName === 'H5') { rr.cor = 'FFFFFF'; rr.sz = 7.5; }
      if (cls.includes('w-gap')) return '<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="270" w:lineRule="exact"/></w:pPr></w:p>';
      if (cls.includes('w-espaco')) return `<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="${Math.round(W_ESP * 56.7)}" w:lineRule="exact"/></w:pPr><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>`;
      const conteudo = (pre ? `<w:r>${rPr(rr)}<w:t xml:space="preserve">${pre}</w:t></w:r>` : '') + runs(el, rr);
      return `<w:p><w:pPr>${kn ? '<w:keepNext/>' : ''}${bdr ? `<w:pBdr>${bdr}</w:pBdr>` : ''}${fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${fill}"/>` : ''}<w:spacing w:before="${esp ? esp[0] : 0}" w:after="${esp ? esp[1] : 80}"${exato ? ` w:line="${exato}" w:lineRule="exact"` : linha ? ` w:line="${Math.round(240 * linha)}" w:lineRule="auto"` : ''}/>${ind ? `<w:ind w:left="${ind}"/>` : ''}${jc ? `<w:jc w:val="${jc === 'right' ? 'right' : jc}"/>` : ''}</w:pPr>${conteudo}</w:p>`;
    }
    const BLOCO = /^(P|DIV|H1|H2|H3|H4|H5|TABLE|UL|OL|LI|BLOCKQUOTE|SECTION|ARTICLE|HR)$/;
    function blocos(node, r, extra) {
      let out = '', inl = document.createElement('span');
      const flush = () => { if (inl.childNodes.length && (inl.textContent.trim() || inl.querySelector('img,br'))) out += par(inl, r, extra); inl = document.createElement('span'); };
      for (const n of [...node.childNodes]) {
        if (n.nodeType === 1 && BLOCO.test(n.tagName)) {
          flush();
          if (n.tagName === 'TABLE') out += tabela(n, r);
          else if (n.tagName === 'HR') out += '<w:p/>';
          else if (n.querySelector && n.querySelector('p,div,table,h1,h2,h3,h4,h5,li,ul,ol,blockquote')) { const pj = [...n.classList].map(c => P[c]).filter(Boolean); const ex = Object.assign({}, extra, ...pj.map(x => ({ ...(x.jc ? { jc: x.jc } : {}), ...(x.linha ? { linha: x.linha } : {}) }))); out += blocos(n, estiloEl(n, r), ex); }
          else out += par(n, r, extra);
        } else inl.appendChild(n.cloneNode(true));
      }
      flush(); return out;
    }
    function tabela(t, r0) {
      const cls = [...t.classList]; const cfg = Object.assign({ borda: null }, ...cls.map(c => T[c] || {}));
      if (t.closest('.cal-m')) Object.assign(cfg, { borda: null, sz: 7, jc: 'center' });
      if (t.classList.contains('cm-t')) Object.assign(cfg, { borda: null, sz: 7.5, jc: 'center' });
      const rows = [...t.querySelectorAll(':scope > tbody > tr, :scope > thead > tr, :scope > tr')];
      const ncols = Math.max(1, ...rows.map(tr => [...tr.children].reduce((s, c) => s + (+c.getAttribute('colspan') || 1), 0)));
      const b = cfg.borda ? `<w:tblBorders>${['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(x => `<w:${x} w:val="single" w:sz="4" w:space="0" w:color="${cfg.borda}"/>`).join('')}</w:tblBorders>` : `<w:tblBorders>${['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(x => `<w:${x} w:val="nil"/>`).join('')}</w:tblBorders>`;
      const lin = (o, v, c, z = 4) => `<w:${o} w:val="${v}" w:sz="${z}" w:space="0" w:color="${c}"/>`;
      const bx = t.classList.contains('eq-fx') ? `<w:tblBorders>${['top', 'left', 'bottom', 'right'].map(o => lin(o, 'single', 'D4A72C', 18)).join('')}</w:tblBorders>` : t.classList.contains('av-t') ? `<w:tblBorders>${lin('top', 'single', 'C9D6EA')}${lin('left', 'single', 'C9D6EA')}${lin('bottom', 'single', 'C9D6EA')}${lin('right', 'single', 'C9D6EA')}${lin('insideH', 'single', 'E3EAF5')}${t.classList.contains('av-ap') ? lin('insideV', 'single', 'E3EAF5') : '<w:insideV w:val="nil"/>'}</w:tblBorders>` : t.classList.contains('av-box') ? '<w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="C9D6EA"/><w:left w:val="single" w:sz="36" w:space="0" w:color="1E4FB8"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="C9D6EA"/><w:right w:val="single" w:sz="4" w:space="0" w:color="C9D6EA"/><w:insideH w:val="dashed" w:sz="4" w:space="0" w:color="9AB3DE"/><w:insideV w:val="nil"/></w:tblBorders>' : b;
      const aninh = !!(t.parentElement && t.parentElement.closest('table')); const fr = rows.find(tr => [...tr.children].length === ncols && [...tr.children].every(c => c.getAttribute('width')));
      let cols = null; if (!aninh) { if (fr) { const ps = [...fr.children].map(c => parseFloat(c.getAttribute('width')) || 1); const sm = ps.reduce((a, b) => a + b, 0); cols = ps.map(p => Math.round(p * W_TW / sm)); } else cols = Array(ncols).fill(Math.round(W_TW / ncols)); }
      let x = `<w:tbl><w:tblPr>${aninh ? '<w:tblW w:w="5000" w:type="pct"/>' : `<w:tblW w:w="${W_TW}" w:type="dxa"/><w:tblInd w:w="0" w:type="dxa"/>`}${bx}<w:tblLayout w:type="${cols && fr ? 'fixed' : 'autofit'}"/><w:tblCellMar><w:left w:w="70" w:type="dxa"/><w:right w:w="70" w:type="dxa"/></w:tblCellMar><w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/></w:tblPr><w:tblGrid>${cols ? cols.map(v => `<w:gridCol w:w="${v}"/>`).join('') : (fr ? [...fr.children].map(c => `<w:gridCol w:w="${Math.round(parseInt(c.getAttribute('width')) * 96)}"/>`).join('') : '<w:gridCol w:w="1000"/>'.repeat(ncols))}</w:tblGrid>`;
      for (const tr of rows) {
        const cab_ = tr.parentNode.tagName === 'THEAD', junto = cab_ || tr.classList.contains('avg') || ((t.classList.contains('av-auto') || t.classList.contains('av-cont')) && tr.nextElementSibling) || tr.classList.contains('av-boxq') || (tr.classList.contains('av-boxl') && tr.nextElementSibling);
        const boxq = tr.classList.contains('av-boxq'), boxl = tr.classList.contains('av-boxl');
        x += `<w:tr><w:trPr><w:cantSplit/>${cab_ ? '<w:tblHeader/>' : ''}${tr.classList.contains('pr-l') ? '<w:trHeight w:val="600" w:hRule="atLeast"/>' : tr.parentNode.parentNode.classList && tr.parentNode.parentNode.classList.contains('cv-ev') || t.classList.contains('cv-ev') ? '<w:trHeight w:val="720" w:hRule="atLeast"/>' : tr.classList.contains('ml-cxr') ? '<w:trHeight w:val="5669" w:hRule="exact"/>' : tr.classList.contains('eq-fxr') ? '<w:trHeight w:val="700" w:hRule="atLeast"/>' : tr.classList.contains('eq-pr') ? '<w:trHeight w:val="860" w:hRule="atLeast"/>' : tr.classList.contains('eq-pg') ? '<w:trHeight w:val="110" w:hRule="exact"/>' : boxl ? '<w:trHeight w:val="320" w:hRule="exact"/>' : t.classList.contains('av-t') && !cab_ && !tr.classList.contains('avg') && !t.classList.contains('av-ap') ? '<w:trHeight w:val="262" w:hRule="exact"/>' : ''}</w:trPr>`;
        let ci = 0;
        for (const c of tr.children) {
          const th = c.tagName === 'TH'; let fill = cfg.fill || null; let r = Object.assign({}, r0, { sz: cfg.sz || r0.sz, b: cfg.b || r0.b });
          if (cfg.cor) r.cor = cfg.cor; if (th && cfg.th) { fill = cfg.th; r.cor = cfg.thCor; r.b = 1; }
          if (c.classList.contains('w-azul')) { fill = '0A3A9C'; r.cor = 'FFFFFF'; } if (c.classList.contains('w-azul2')) { fill = '0B2A5B'; r.cor = 'FFFFFF'; r.b = 1; r.sz = 8; }
          if (tr.classList.contains('iv')) { fill = 'FFE17A'; r.b = 1; } if (tr.classList.contains('avg') || tr.classList.contains('hg') || tr.classList.contains('eq-tot')) { fill = 'DBE9FF'; r.cor = '0B2A6B'; r.b = 1; r.sz = 7.5; } if (c.classList.contains('mt-a') || c.classList.contains('ht-tur') || c.classList.contains('cr-a')) { fill = '0B2A6B'; r.cor = 'FFD34D'; r.b = 1; }
          if (tr.classList.contains('fq-x') || c.classList.contains('vx')) { fill = 'EEF4FD'; r.cor = '1E4FB8'; } if (tr.classList.contains('fq-r')) { fill = 'FDECEB'; r.cor = 'C62828'; } const bg = hex(c.style.background || c.style.backgroundColor); if (bg) { fill = bg; r.cor = hex(c.style.color) || 'FFFFFF'; r.b = 1; }
          if (c.classList.contains('fds')) r.cor = '999999'; if (tr.classList.contains('av-boxq')) { fill = 'EEF4FD'; r.cor = '0B2A6B'; r.b = 1; r.sz = 9; } if (tr.classList.contains('av-boxl')) fill = 'FFFFFF'; if (c.classList.contains('eq-pwt')) { fill = 'F3F6FC'; r.cor = '0B1F5C'; } if (c.classList.contains('fm-inf')) fill = 'F3F7FE';
          const span = +c.getAttribute('colspan') || 1; const w = c.getAttribute('width');
          const jc = c.getAttribute('align') || (th && cfg.th ? (cfg.jc || 'left') : cfg.jc) || null;
          let inner = blocos(c, r, { jc }); if (!inner) inner = '<w:p/>'; if (junto) inner = inner.replace(/<w:pPr>(?!<w:keepNext\/>)/g, '<w:pPr><w:keepNext/>').replace(/<w:p\/>/g, '<w:p><w:pPr><w:keepNext/></w:pPr></w:p>');
          const tw = cols ? cols.slice(ci, ci + span).reduce((a, b) => a + b, 0) : 0; ci += span;
          x += `<w:tc><w:tcPr>${tw ? `<w:tcW w:w="${tw}" w:type="dxa"/>` : w ? `<w:tcW w:w="${parseInt(w) * 50}" w:type="pct"/>` : ''}${span > 1 ? `<w:gridSpan w:val="${span}"/>` : ''}${fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${fill}"/>` : ''}<w:vAlign w:val="${c.getAttribute('valign') === 'bottom' ? 'bottom' : c.getAttribute('valign') === 'top' ? 'top' : 'center'}"/></w:tcPr>${inner}</w:tc>`;
        }
        x += '</w:tr>';
      }
      return x + '</w:tbl><w:p><w:pPr><w:spacing w:before="0" w:after="60" w:line="240" w:lineRule="auto"/><w:rPr><w:sz w:val="8"/></w:rPr></w:pPr></w:p>';
    }
    const corpo = blocos(d, { sz: 10.5 });
    return { corpo, imgs };
  }
  const W_MARG = { t: 27, l: 12, r: 12, b: 18 }; let W_ESP = 0, W_TW = 10206;
  const ancora = (rid, id, nome, cxmm, cymm, z) => `<w:p><w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr><w:r><w:drawing><wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="${z}" behindDoc="1" locked="1" layoutInCell="1" allowOverlap="1"><wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="page"><wp:posOffset>0</wp:posOffset></wp:positionH><wp:positionV relativeFrom="page"><wp:posOffset>0</wp:posOffset></wp:positionV><wp:extent cx="${Math.round(cxmm * 36000)}" cy="${Math.round(cymm * 36000)}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapNone/><wp:docPr id="${id}" name="${nome}"/><wp:cNvGraphicFramePr/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${id}" name="${nome}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${Math.round(cxmm * 36000)}" cy="${Math.round(cymm * 36000)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:anchor></w:drawing></w:r></w:p>`;
  async function word(html, nome, rotulo, fol) { if (fol && fol.duas) fol = Object.assign({}, fol, { cab: '' }); // 2 por folha: cada metade tem a sua faixa, sem o cabeçalho grande
    aviso('⏳ Gerando o arquivo do Word…');
    try {
      if (!window.JSZip) await carregar('assets/vendor/jszip.min.js');
      const comArte = !!(fol && fol.fundo && !fol.livre); W_TW = comArte ? 10546 : 10206; W_ESP = comArte && fol.cab ? 420 * 210 / 1240 - W_MARG.t + 3 : 0; const tmp = document.createElement('div'); tmp.innerHTML = paraWord(html, comArte ? fol : null);
      // tamanho real das imagens (proporção)
      await Promise.all([...tmp.querySelectorAll('img')].map(im => new Promise(ok => { const i = new Image(); i.onload = () => { im.dataset.w = i.naturalWidth; im.dataset.h = i.naturalHeight; ok(); }; i.onerror = ok; i.src = im.getAttribute('src'); })));
      const { corpo, imgs } = docx(tmp.innerHTML);
      const zip = new JSZip();
      zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpeg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>' + (comArte ? '<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/header2.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>' : '') + '</Types>');
      zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
      zip.file('word/styles.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial" w:eastAsia="Arial"/><w:sz w:val="21"/><w:szCs w:val="21"/><w:lang w:val="pt-BR"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="80" w:line="259" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>');
      zip.file('word/settings.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:zoom w:percent="100"/><w:defaultTabStop w:val="708"/><w:characterSpacingControl w:val="doNotCompress"/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>');
      let rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdSt" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdSet" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>';
      for (const im of imgs) { const r = await fetch(im.src); zip.file('word/media/' + im.nome, await r.arrayBuffer()); rels += `<Relationship Id="${im.rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${im.nome}"/>`; }
      let secHdr = '', marg = '<w:pgMar w:top="794" w:right="850" w:bottom="794" w:left="850" w:header="0" w:footer="0" w:gutter="0"/>';
      if (comArte) { const bin = async u => (await fetch(u)).arrayBuffer(); zip.file('word/media/fundo.jpeg', await bin(fol.fundo)); if (fol.cab) zip.file('word/media/cab.jpeg', await bin(fol.cab));
        const ns = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
        const hrel = extra => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rFundo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/fundo.jpeg"/>${extra}</Relationships>`;
        zip.file('word/header1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr ${ns}>${ancora('rFundo', 901, 'Fundo', 210, 297, 1)}</w:hdr>`); zip.file('word/_rels/header1.xml.rels', hrel(''));
        zip.file('word/header2.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr ${ns}>${ancora('rFundo', 902, 'Fundo', 210, 297, 1)}${fol.cab ? ancora('rCab', 903, 'Cabecalho', 210, 420 * 210 / 1240, 2) : ''}</w:hdr>`); zip.file('word/_rels/header2.xml.rels', hrel(fol.cab ? '<Relationship Id="rCab" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/cab.jpeg"/>' : ''));
        rels += '<Relationship Id="rH1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/><Relationship Id="rH2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header2.xml"/>';
        secHdr = '<w:headerReference w:type="default" r:id="rH1"/><w:headerReference w:type="first" r:id="rH2"/>'; const mm = v => Math.round(v * 56.7);
        marg = `<w:pgMar w:top="${mm(W_MARG.t)}" w:right="${mm(W_MARG.r)}" w:bottom="${mm(W_MARG.b)}" w:left="${mm(W_MARG.l)}" w:header="0" w:footer="0" w:gutter="0"/><w:titlePg/>`; }
      zip.file('word/_rels/document.xml.rels', rels + '</Relationships>');
      zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>${corpo}<w:sectPr>${secHdr}<w:pgSz w:w="11906" w:h="16838"/>${marg.replace('<w:titlePg/>', '')}${marg.includes('titlePg') ? '<w:titlePg/>' : ''}</w:sectPr></w:body></w:document>`);
      const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', compression: 'DEFLATE' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nomeArq(nome) + '.docx';
      document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      aviso('✅ Arquivo do Word baixado.');
    } catch (e) { alert('Não consegui gerar o arquivo do Word: ' + (e && e.message || e)); }
  }
  window.seiBaixar = { pdf, word, paraWord };
})();
