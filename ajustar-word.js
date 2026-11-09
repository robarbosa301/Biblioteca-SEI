/* Ajustar Word: deixa o conteúdo colado dentro das colunas do modelo SEI.
   Roda só no navegador; o arquivo não sai do computador do professor. */
(function () {
  const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const WP = 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing';
  const A = 'http://schemas.openxmlformats.org/drawingml/2006/main';
  const EMU = 635; // EMU por twip
  const CELL_PAD = 108 * 2; // margem padrão das células (esq + dir)

  const kids = (el, ns, name) => Array.from(el.childNodes).filter(n => n.nodeType === 1 && n.namespaceURI === ns && n.localName === name);
  const kid = (el, ns, name) => kids(el, ns, name)[0] || null;
  const num = (el, name) => { const v = el && el.getAttributeNS(W, name); return v == null || v === '' ? null : parseInt(v, 10); };
  const setW = (el, name, v) => el.setAttributeNS(W, 'w:' + name, String(Math.round(v)));

  function columnWidth(body) {
    const sect = kid(body, W, 'sectPr');
    let pgW = 11906, L = 1440, R = 1440, n = 1, sp = 720, cw = null;
    if (sect) {
      const pg = kid(sect, W, 'pgSz'); if (pg && num(pg, 'w')) pgW = num(pg, 'w');
      const m = kid(sect, W, 'pgMar'); if (m) { L = num(m, 'left') ?? L; R = num(m, 'right') ?? R; }
      const c = kid(sect, W, 'cols');
      if (c) {
        n = num(c, 'num') || 1; sp = num(c, 'space') ?? sp;
        const cs = kids(c, W, 'col').map(x => num(x, 'w')).filter(Boolean);
        if (cs.length) cw = Math.min(...cs);
      }
    }
    return cw || Math.floor((pgW - L - R - (n - 1) * sp) / n);
  }

  function fixPara(p, avail, stats) {
    const pPr = kid(p, W, 'pPr');
    let left = 0;
    if (pPr) {
      // quebras de seção coladas mudam as colunas: remover
      kids(pPr, W, 'sectPr').forEach(s => { pPr.removeChild(s); stats.secoes++; });
      kids(pPr, W, 'framePr').forEach(s => { pPr.removeChild(s); stats.recuos++; });
      const ind = kid(pPr, W, 'ind');
      if (ind) {
        let ch = false;
        for (const k of ['left', 'start', 'right', 'end']) {
          const v = num(ind, k); if (v == null) continue;
          if (v < 0) { setW(ind, k, 0); ch = true; }
          else if (v > avail * 0.4) { setW(ind, k, Math.round(avail * 0.1)); ch = true; }
        }
        for (const k of ['hanging', 'firstLine']) {
          const v = num(ind, k); if (v != null && v > avail * 0.3) { setW(ind, k, Math.round(avail * 0.08)); ch = true; }
        }
        for (const k of ['leftChars', 'startChars', 'rightChars', 'endChars', 'hangingChars', 'firstLineChars']) {
          if (ind.hasAttributeNS(W, k)) { ind.removeAttributeNS(W, k); ch = true; }
        }
        if (ch) stats.recuos++;
        left = Math.max(0, (num(ind, 'left') ?? num(ind, 'start') ?? 0)) - (num(ind, 'hanging') || 0);
      }
      const tabs = kid(pPr, W, 'tabs');
      if (tabs) kids(tabs, W, 'tab').forEach(t => { const pos = num(t, 'pos'); if (pos != null && (pos > avail || pos < 0)) { tabs.removeChild(t); stats.recuos++; } });
    }
    const room = Math.max(avail - Math.max(0, left), avail * 0.5);
    fitDrawings(p, room, stats);
  }

  function fitDrawings(scope, room, stats) {
    const doc = scope.ownerDocument;
    // imagens flutuantes viram imagens na linha do texto
    Array.from(scope.getElementsByTagNameNS(WP, 'anchor')).forEach(anc => {
      const inl = doc.createElementNS(WP, 'wp:inline');
      ['distT', 'distB', 'distL', 'distR'].forEach(a => inl.setAttribute(a, '0'));
      for (const name of ['extent', 'effectExtent', 'docPr', 'cNvGraphicFramePr']) {
        const e = kid(anc, WP, name); if (e) inl.appendChild(e.cloneNode(true));
      }
      const g = kid(anc, A, 'graphic'); if (!g) return;
      if (!kid(inl, WP, 'effectExtent')) { const ee = doc.createElementNS(WP, 'wp:effectExtent'); ['l', 't', 'r', 'b'].forEach(a => ee.setAttribute(a, '0')); inl.insertBefore(ee, kid(inl, WP, 'docPr')); }
      inl.appendChild(g.cloneNode(true));
      anc.parentNode.replaceChild(inl, anc);
      stats.flutuantes++;
    });
    const max = room * EMU;
    Array.from(scope.getElementsByTagNameNS(WP, 'inline')).forEach(inl => {
      const ext = kid(inl, WP, 'extent'); if (!ext) return;
      const cx = parseInt(ext.getAttribute('cx'), 10), cy = parseInt(ext.getAttribute('cy'), 10);
      if (!(cx > max)) return;
      const f = max / cx;
      ext.setAttribute('cx', String(Math.round(cx * f))); ext.setAttribute('cy', String(Math.round(cy * f)));
      Array.from(inl.getElementsByTagNameNS(A, 'ext')).forEach(e => {
        if (e.parentNode && e.parentNode.localName === 'xfrm' && parseInt(e.getAttribute('cx'), 10) === cx) {
          e.setAttribute('cx', String(Math.round(cx * f))); e.setAttribute('cy', String(Math.round(parseInt(e.getAttribute('cy'), 10) * f)));
        }
      });
      stats.imagens++;
    });
    // imagens antigas (VML)
    Array.from(scope.getElementsByTagName('v:shape')).concat(Array.from(scope.getElementsByTagName('v:rect'))).forEach(s => {
      let st = s.getAttribute('style') || '';
      const mw = st.match(/width:\s*([\d.]+)pt/), mh = st.match(/height:\s*([\d.]+)pt/);
      let ch = false;
      if (/position:\s*absolute/.test(st)) { st = st.replace(/position:\s*absolute;?/g, '').replace(/margin-(left|top):[^;]*;?/g, '').replace(/mso-position-[^;]*;?/g, ''); ch = true; }
      if (mw) { const wpt = parseFloat(mw[1]), maxpt = room / 20; if (wpt > maxpt) { const f = maxpt / wpt; st = st.replace(mw[0], 'width:' + (wpt * f).toFixed(1) + 'pt'); if (mh) st = st.replace(mh[0], 'height:' + (parseFloat(mh[1]) * f).toFixed(1) + 'pt'); ch = true; } }
      if (ch) { s.setAttribute('style', st); stats.imagens++; }
    });
  }

  function fitTable(tbl, avail, stats) {
    const doc = tbl.ownerDocument;
    let tblPr = kid(tbl, W, 'tblPr');
    if (!tblPr) { tblPr = doc.createElementNS(W, 'w:tblPr'); tbl.insertBefore(tblPr, tbl.firstChild); }
    const grid = kid(tbl, W, 'tblGrid');
    const cols = grid ? kids(grid, W, 'gridCol') : [];
    const sum = cols.reduce((s, c) => s + (num(c, 'w') || 0), 0);
    const ind = kid(tblPr, W, 'tblInd'); if (ind && (num(ind, 'w') || 0) !== 0) { setW(ind, 'w', 0); ind.setAttributeNS(W, 'w:type', 'dxa'); }
    kids(tblPr, W, 'tblpPr').forEach(x => tblPr.removeChild(x)); // tabela flutuante
    const target = avail;
    let f = 1;
    if (sum > target) f = target / sum;
    let tw = kid(tblPr, W, 'tblW');
    if (!tw) { tw = doc.createElementNS(W, 'w:tblW'); tblPr.appendChild(tw); }
    const twType = tw.getAttributeNS(W, 'type');
    const twVal = num(tw, 'w') || 0;
    if (f < 1 || (twType === 'dxa' && twVal > target) || (twType === 'pct' && twVal > 5000)) {
      cols.forEach(c => setW(c, 'w', (num(c, 'w') || 0) * f));
      Array.from(tbl.getElementsByTagNameNS(W, 'tr')).filter(tr => tr.parentNode === tbl).forEach(tr => {
        kids(tr, W, 'tc').forEach(tc => { const pr = kid(tc, W, 'tcPr'); const w = pr && kid(pr, W, 'tcW'); if (w && w.getAttributeNS(W, 'type') === 'dxa') setW(w, 'w', (num(w, 'w') || 0) * f); });
      });
      tw.setAttributeNS(W, 'w:type', 'dxa'); setW(tw, 'w', Math.min(target, (twType === 'dxa' ? twVal : sum) * f || target));
      let lay = kid(tblPr, W, 'tblLayout'); if (!lay) { lay = doc.createElementNS(W, 'w:tblLayout'); tblPr.appendChild(lay); }
      lay.setAttributeNS(W, 'w:type', 'fixed');
      stats.tabelas++;
    }
    const widths = cols.map(c => num(c, 'w') || 0);
    kids(tbl, W, 'tr').forEach(tr => {
      let gi = 0;
      kids(tr, W, 'trPr').forEach(trPr => { const gb = kid(trPr, W, 'gridBefore'); if (gb) gi += num(gb, 'val') || 0; });
      kids(tr, W, 'tc').forEach(tc => {
        const pr = kid(tc, W, 'tcPr'); const gs = pr && kid(pr, W, 'gridSpan'); const span = gs ? (num(gs, 'val') || 1) : 1;
        let cw = widths.slice(gi, gi + span).reduce((s, x) => s + x, 0); gi += span;
        if (!cw) cw = target / Math.max(1, widths.length || 1);
        walk(tc, Math.max(cw - CELL_PAD, 300), stats);
      });
    });
  }

  function walk(container, avail, stats) {
    Array.from(container.childNodes).forEach(el => {
      if (el.nodeType !== 1) return;
      if (el.namespaceURI === W && el.localName === 'p') fixPara(el, avail, stats);
      else if (el.namespaceURI === W && el.localName === 'tbl') fitTable(el, avail, stats);
      else if (el.namespaceURI === W && el.localName === 'sdt') { const c = kid(el, W, 'sdtContent'); if (c) walk(c, avail, stats); }
      else if (el.namespaceURI === W && (el.localName === 'customXml' || el.localName === 'smartTag')) walk(el, avail, stats);
    });
  }

  async function ajustar(file) {
    const zip = await JSZip.loadAsync(file);
    const f = zip.file('word/document.xml');
    if (!f) throw new Error('Este arquivo não parece ser um documento do Word (.docx).');
    const xml = await f.async('string');
    const dom = new DOMParser().parseFromString(xml, 'application/xml');
    if (dom.getElementsByTagName('parsererror').length) throw new Error('Não foi possível ler o documento.');
    const body = dom.getElementsByTagNameNS(W, 'body')[0];
    const stats = { recuos: 0, tabelas: 0, imagens: 0, flutuantes: 0, secoes: 0 };
    walk(body, columnWidth(body), stats);
    zip.file('word/document.xml', new XMLSerializer().serializeToString(dom));
    if (window.seiWordPB && seiWordPB.ativo()) stats.pb = await seiWordPB.clarear(zip); // moldura clara para P&B
    const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', compression: 'DEFLATE' });
    return { blob, stats };
  }

  window.seiAjustarWord = ajustar;

  window.seiBotaoAjustar = function (host) {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.docx'; input.hidden = true;
    const b = document.createElement('button'); b.className = 'blank-word adjust-word'; b.textContent = '✓ Ajustar Word preenchido';
    b.title = 'Envie o modelo depois de colar as questões: tudo volta para dentro das colunas';
    const msg = document.createElement('p'); msg.className = 'word-hint adjust-msg';
    b.onclick = () => input.click();
    input.onchange = async () => {
      const file = input.files[0]; input.value = ''; if (!file) return;
      b.disabled = true; msg.textContent = 'Ajustando…';
      try {
        const { blob, stats } = await ajustar(file);
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = file.name.replace(/\.docx$/i, '') + ' (ajustado).docx';
        document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        const tot = stats.recuos + stats.tabelas + stats.imagens + stats.flutuantes + stats.secoes;
        msg.textContent = tot ? `Pronto! Corrigidos: ${stats.recuos} recuo(s), ${stats.tabelas} tabela(s), ${stats.imagens + stats.flutuantes} imagem(ns)${stats.secoes ? ', ' + stats.secoes + ' quebra(s) de seção' : ''}. O arquivo ajustado foi baixado.` : 'Pronto! Nada precisava de ajuste. O arquivo foi baixado.';
        if (stats.pb) msg.textContent += ' Moldura clara para impressão em preto e branco.';
      } catch (e) { msg.textContent = 'Não consegui ajustar: ' + e.message; }
      b.disabled = false;
    };
    host.append(b, input);
    return msg;
  };
})();
