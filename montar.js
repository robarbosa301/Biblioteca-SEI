/* Montar folha no site: cola, encaixa em duas colunas e imprime igual à tela. */
(function () {
  'use strict';
  const K = 21 / 1024, PSM = 0.5, F = (21 - 2 * PSM) / 21, OY = (29.7 - 29.7 * F) / 2, CH = 112;
  const $ = s => document.querySelector(s);
  const pagesEl = $('#pages'), measure = $('#measure');
  const src = decodeURIComponent((location.hash.match(/f=([^&]+)/) || [])[1] || '');
  let geo = null, blocks = [], selId = null, nextId = 1, conteudo = '', identificacao = /fundamental-/.test(decodeURIComponent(location.hash)) ? 'Atividades 01' : 'Revisão 01';
  const advanced = /assets\/(pre-vestibular|ensino-medio|convenio)\//.test(src);
  const KEY = 'sei-montar:' + src;

  /* ---------- armazenamento (IndexedDB, com folga para imagens) ---------- */
  const db = (() => {
    let p = null;
    const open = () => p || (p = new Promise((res, rej) => {
      try { const r = indexedDB.open('sei-montar', 1); r.onupgradeneeded = () => r.result.createObjectStore('folhas'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); }
    }));
    return {
      get: k => open().then(d => new Promise(res => { const q = d.transaction('folhas').objectStore('folhas').get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(null); })).catch(() => null),
      set: (k, v) => open().then(d => new Promise(res => { const t = d.transaction('folhas', 'readwrite'); t.objectStore('folhas').put(v, k); t.oncomplete = res; t.onerror = res; })).catch(() => null)
    };
  })();
  let saveT = null;
  const persist = () => db.set(KEY, { blocks, conteudo, identificacao });
  const save = () => { clearTimeout(saveT); saveT = setTimeout(persist, 300); };
  addEventListener('pagehide', persist);
  let past = [], future = [];
  const snapshot = () => ({blocks:blocks.map(b => ({...b})), selId, nextId});
  const remember = () => { past.push(snapshot()); if (past.length > 40) past.shift(); future = []; };
  const historyStep = redo => {
    const from = redo ? future : past, to = redo ? past : future;
    if (!from.length) return;
    to.push(snapshot()); const state = from.pop(); blocks = state.blocks; selId = state.selId; nextId = state.nextId;
    render(); save(); updateToolbar();
  };
  let mainFormat = null;
  function updateToolbar() {
    if (!mainFormat) return;
    const b = blocks.find(b => b.id === selId), tmp = document.createElement('div');
    if (b) tmp.innerHTML = b.html;
    const e = tmp.firstElementChild, st = e ? e.style : {};
    mainFormat.update({enabled:!!e && !e.classList.contains('quebra'),canUndo:past.length>0,canRedo:future.length>0,
      fontFamily:(st.fontFamily || 'Arial').replace(/["']/g,''),fontSize:parseFloat(st.fontSize)||10,
      textAlign:st.textAlign || (e && e.classList.contains('sz-center') ? 'center' : e && e.classList.contains('sz-right') ? 'right' : e && e.classList.contains('sz-justify') ? 'justify' : 'left'),
      lineHeight:st.lineHeight||1.15,marginBottom:parseFloat(st.marginBottom)||0,
      bold:st.fontWeight==='bold',italic:st.fontStyle==='italic',underline:st.textDecoration==='underline'});
  }
  function formatBlock(action, value) {
    const b = blocks.find(b => b.id === selId); if (!b) return;
    const tmp = document.createElement('div'); tmp.innerHTML = b.html; let e = tmp.firstElementChild;
    if (!e || e.classList.contains('quebra')) return;
    remember();
    if (action === 'bold') e.style.fontWeight = e.style.fontWeight === 'bold' ? 'normal' : 'bold';
    else if (action === 'italic') e.style.fontStyle = e.style.fontStyle === 'italic' ? 'normal' : 'italic';
    else if (action === 'underline') e.style.textDecoration = e.style.textDecoration === 'underline' ? 'none' : 'underline';
    else if (['fontFamily','fontSize','textAlign','lineHeight','marginBottom'].includes(action)) {
      if (action !== 'marginBottom') e.querySelectorAll('*').forEach(child => {
        child.style[action] = '';
        if (action === 'fontSize') child.removeAttribute('size');
        if (action === 'fontFamily') child.removeAttribute('face');
      });
      e.style[action] = ['fontSize','marginBottom'].includes(action) ? value + 'pt' : value;
    } else if (action === 'indent' || action === 'outdent') {
      e.style.marginLeft = Math.max(0,Math.min(72,(parseFloat(e.style.marginLeft)||0) + (action==='indent'?12:-12))) + 'pt';
    } else if (action === 'insertUnorderedList' || action === 'insertOrderedList') {
      const tag = action === 'insertOrderedList' ? 'OL' : 'UL';
      if (e.tagName === tag) {
        const p = document.createElement('p'); p.setAttribute('style',e.getAttribute('style')||'');
        Array.from(e.children).forEach((li,i) => { if(i) p.appendChild(document.createElement('br')); while(li.firstChild) p.appendChild(li.firstChild); }); e=p;
      } else if (e.tagName === 'OL' || e.tagName === 'UL') {
        const list=document.createElement(tag);list.setAttribute('style',e.getAttribute('style')||'');list.innerHTML=e.innerHTML;e=list;
      } else {
        const list=document.createElement(tag),li=document.createElement('li');list.setAttribute('style',e.getAttribute('style')||'');li.innerHTML=e.innerHTML;list.appendChild(li);e=list;
      }
    }
    b.html = e.outerHTML; render(); save(); updateToolbar();
  }

  /* ---------- limpeza do que foi colado ---------- */
  const INLINE = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'SUB', 'SUP', 'BR']);
  const UNWRAP = new Set(['SPAN', 'FONT', 'A', 'ABBR', 'MARK', 'SMALL', 'BIG', 'LABEL', 'CODE', 'S', 'DEL', 'INS', 'O:P', 'SECTION', 'ARTICLE', 'MAIN', 'HEADER', 'FOOTER', 'FIGURE', 'FIGCAPTION', 'CENTER', 'NOBR', 'TIME', 'CITE', 'Q', 'DFN', 'KBD', 'SAMP', 'VAR', 'PICTURE']);
  const DROP = new Set(['SCRIPT', 'STYLE', 'META', 'LINK', 'TITLE', 'HEAD', 'NOSCRIPT', 'IFRAME', 'OBJECT', 'EMBED', 'SVG', 'CANVAS', 'VIDEO', 'AUDIO', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'FORM', 'NAV', 'XML', 'SOURCE', 'TEMPLATE']);
  let faltouImagem = 0;

  // Mantém a formatação escolhida, sem trazer estilos de página do Word colado.
  function copyFormat(from, to, inline = false) {
    if (!from.style) return;
    const st = from.style;
    const families = ['Arial','Calibri','Times New Roman','Verdana','Georgia','Courier New','Tahoma'];
    const family = (st.fontFamily || from.getAttribute('face') || '').split(',')[0].replace(/["']/g, '').trim();
    if (families.some(f => f.toLowerCase() === family.toLowerCase())) to.style.fontFamily = family;
    const size = st.fontSize.match(/^([\d.]+)(pt|px)$/i);
    if (size) to.style.fontSize = Math.max(6, Math.min(72, +size[1] * (size[2] === 'px' ? .75 : 1))) + 'pt';
    if (!size && from.tagName === 'FONT' && from.getAttribute('size')) {
      const points = [8,10,12,14,18,24,36][+from.getAttribute('size') - 1];
      if (points) to.style.fontSize = points + 'pt';
    }
    if (['bold','700','800','900'].includes(st.fontWeight)) to.style.fontWeight = 'bold';
    if (st.fontStyle === 'italic') to.style.fontStyle = 'italic';
    if ((st.textDecorationLine || st.textDecoration).includes('underline')) to.style.textDecoration = 'underline';
    if (!inline) {
      if (['left','center','right','justify'].includes(st.textAlign)) to.style.textAlign = st.textAlign;
      if (/^\d+(\.\d+)?$/.test(st.lineHeight)) to.style.lineHeight = Math.max(1, Math.min(3, +st.lineHeight));
      for (const prop of ['marginBottom','marginLeft']) {
        const val = st[prop].match(/^([\d.]+)(pt|px)$/i);
        if (val) to.style[prop] = Math.max(0, Math.min(72, +val[1] * (val[2] === 'px' ? .75 : 1))) + 'pt';
      }
    }
  }

  function cleanInline(node, out) {
    for (const n of Array.from(node.childNodes)) {
      if (n.nodeType === 3) { out.appendChild(document.createTextNode(n.nodeValue.replace(/\s+/g, ' '))); continue; }
      if (n.nodeType !== 1) continue;
      const t = n.tagName.toUpperCase();
      if (DROP.has(t)) continue;
      if (t === 'MATH') { const m = seiFormulas.limparMath(n); if (m) out.appendChild(m); continue; }
      if (t === 'IMG') { const im = img(n); if (im) out.appendChild(im); continue; }
      if (INLINE.has(t)) { const e = document.createElement(t === 'STRONG' ? 'b' : t === 'EM' ? 'i' : t.toLowerCase()); copyFormat(n, e, true); if (t !== 'BR') cleanInline(n, e); out.appendChild(e); continue; }
      if (t === 'SPAN' || t === 'FONT') {
        const e = document.createElement('span'); copyFormat(n, e, true); cleanInline(n, e);
        if (e.getAttribute('style')) out.appendChild(e); else while (e.firstChild) out.appendChild(e.firstChild);
        continue;
      }
      const st = (n.getAttribute && n.getAttribute('style')) || '';
      if (/font-weight\s*:\s*(bold|[6-9]00)/i.test(st) || /font-style\s*:\s*italic/i.test(st) || /text-decoration[^;]*underline/i.test(st) || /vertical-align\s*:\s*(super|sub)/i.test(st)) {
        let e = out;
        const wrap = tag => { const w = document.createElement(tag); e.appendChild(w); e = w; };
        if (/font-weight\s*:\s*(bold|[6-9]00)/i.test(st)) wrap('b');
        if (/font-style\s*:\s*italic/i.test(st)) wrap('i');
        if (/text-decoration[^;]*underline/i.test(st)) wrap('u');
        if (/vertical-align\s*:\s*super/i.test(st)) wrap('sup'); else if (/vertical-align\s*:\s*sub/i.test(st)) wrap('sub');
        cleanInline(n, e); continue;
      }
      cleanInline(n, out);
    }
  }
  function img(n) {
    const s = n.getAttribute('src') || '';
    if (!s || /^(file:|blob:|cid:|ms-)/i.test(s) || n.getAttribute('v:shapes') && !/^(data:|https?:)/i.test(s)) { faltouImagem++; return null; }
    const e = document.createElement('img'); e.src = s; e.alt = '';
    const w = parseFloat(n.getAttribute('width')) || 0; if (w > 0) e.setAttribute('data-w', Math.round(w));
    return e;
  }
  function align(n, e) {
    const a = ((n.getAttribute && (n.getAttribute('align') || '')) + ';' + ((n.getAttribute && n.getAttribute('style')) || '')).toLowerCase();
    const m = a.match(/text-align\s*:\s*(center|right|justify)/) || a.match(/^(center|right|justify)/);
    if (m) e.className = 'sz-' + m[1];
  }
  const hasContent = e => e.textContent.replace(/ /g, ' ').trim() || e.querySelector('img,table,math');
  function cleanTable(t) {
    const out = document.createElement('table'); copyFormat(t, out); const tb = document.createElement('tbody'); out.appendChild(tb);
    const rows = Array.from(t.querySelectorAll('tr')).filter(r => r.closest('table') === t);
    for (const r of rows) {
      const tr = document.createElement('tr');
      for (const c of Array.from(r.children)) {
        if (!/^T[DH]$/.test(c.tagName.toUpperCase())) continue;
        const td = document.createElement(c.tagName.toUpperCase() === 'TH' ? 'th' : 'td'); copyFormat(c, td);
        for (const a of ['colspan', 'rowspan']) { const v = c.getAttribute(a); if (v && +v > 1) td.setAttribute(a, v); }
        const inner = cleanBlocks(c); inner.forEach(b => td.appendChild(b));
        tr.appendChild(td);
      }
      if (tr.children.length) tb.appendChild(tr);
    }
    return tb.children.length ? out : null;
  }
  function cleanList(l) {
    const out = document.createElement(l.tagName.toUpperCase() === 'OL' ? 'ol' : 'ul'); copyFormat(l, out);
    for (const li of Array.from(l.children)) {
      if (li.tagName.toUpperCase() !== 'LI') continue;
      const e = document.createElement('li'); copyFormat(li, e); cleanInline(li, e);
      li.querySelectorAll(':scope > ul, :scope > ol').forEach(sub => { const s = cleanList(sub); if (s) e.appendChild(s); });
      if (hasContent(e)) out.appendChild(e);
    }
    return out.children.length ? out : null;
  }
  function cleanBlocks(root) {
    const out = []; let cur = null;
    const flush = () => { if (cur && hasContent(cur)) out.push(cur); cur = null; };
    const walk = node => {
      for (const n of Array.from(node.childNodes)) {
        if (n.nodeType === 3) { if (n.nodeValue.trim()) { cur = cur || document.createElement('p'); cur.appendChild(document.createTextNode(n.nodeValue.replace(/\s+/g, ' '))); } continue; }
        if (n.nodeType !== 1) continue;
        const t = n.tagName.toUpperCase();
        if (DROP.has(t)) continue;
        if (t === 'TABLE') { flush(); const x = cleanTable(n); if (x) out.push(x); continue; }
        if (t === 'UL' || t === 'OL') { flush(); const x = cleanList(n); if (x) out.push(x); continue; }
        if (/^(P|H[1-6]|LI|BLOCKQUOTE|PRE|DT|DD|CAPTION)$/.test(t) || (t === 'DIV' && !n.querySelector('p,div,table,ul,ol,h1,h2,h3,h4,h5,h6'))) {
          flush(); const p = document.createElement('p'); align(n, p); copyFormat(n, p);
          if (/^H[1-6]$/.test(t)) { const b = document.createElement('b'); cleanInline(n, b); p.appendChild(b); } else cleanInline(n, p);
          // parágrafo vazio do Word: mantém só um respiro
          if (hasContent(p)) out.push(p); else if (out.length && out[out.length - 1].tagName === 'P' && !out[out.length - 1].dataset.vazio) { const v = document.createElement('p'); v.dataset.vazio = '1'; v.innerHTML = '&nbsp;'; out.push(v); }
          continue;
        }
        if (t === 'IMG') { const im = img(n); if (im) { cur = cur || document.createElement('p'); cur.appendChild(im); } continue; }
        if (t === 'MATH') {
          const m = seiFormulas.limparMath(n); if (!m) continue;
          if (m.getAttribute('display') === 'block') { flush(); const p = document.createElement('p'); p.className = 'sz-center'; p.appendChild(m); out.push(p); }
          else { cur = cur || document.createElement('p'); cur.appendChild(m); }
          continue;
        }
        if (t === 'HR') { flush(); continue; }
        if (INLINE.has(t) || UNWRAP.has(t)) {
          if (n.querySelector && n.querySelector('p,div,table,ul,ol,h1,h2,h3,h4,h5,h6')) { flush(); walk(n); }
          else { cur = cur || document.createElement('p'); cleanInline({ childNodes: [n] }, cur); }
          continue;
        }
        flush(); walk(n);
      }
    };
    walk(root); flush();
    while (out.length && out[out.length - 1].dataset && out[out.length - 1].dataset.vazio) out.pop();
    return out;
  }
  function htmlToBlocks(html) {
    const d = new DOMParser().parseFromString(seiFormulas.prepararHTML(html), 'text/html');
    seiFormulas.prepararDOM(d.body); // fórmulas do Word e da web, letras gregas da fonte Symbol
    // Word: listas "MsoListParagraph" chegam como parágrafos com marcador — continuam como parágrafos
    return cleanBlocks(d.body);
  }
  function textToBlocks(txt) {
    return txt.replace(/\r/g, '').split(/\n/).map(l => { const p = document.createElement('p'); if (l.trim()) p.textContent = l; else { p.innerHTML = '&nbsp;'; p.dataset.vazio = '1'; } return p; })
      .filter((p, i, a) => !(p.dataset.vazio && (i === 0 || a[i - 1].dataset.vazio)));
  }

  /* ---------- inserir / editar ---------- */
  function insertBlocks(els) {
    if (!els.length) return;
    remember();
    const items = els.map(e => ({ id: nextId++, html: e.outerHTML }));
    let at = blocks.length;
    if (selId != null) { const i = blocks.findIndex(b => b.id === selId); if (i >= 0) at = i + 1; }
    blocks.splice(at, 0, ...items);
    selId = items[items.length - 1].id;
    aviso();
    render(); save();
  }
  function aviso() {
    const a = $('#aviso');
    if (faltouImagem) {
      a.hidden = false;
      a.textContent = `${faltouImagem} imagem(ns) não vieram junto com a cópia (acontece ao copiar do Word para o navegador). Use “📄 Importar Word” para trazer o arquivo inteiro com as imagens, ou copie a imagem sozinha e cole.`;
      faltouImagem = 0;
    } else a.hidden = true;
  }
  const readAsDataURL = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
  async function imageBlock(file) {
    const url = await readAsDataURL(file);
    const p = document.createElement('p'); p.className = 'sz-center'; const im = document.createElement('img'); im.src = url; p.appendChild(im); return p;
  }
  async function handleClipboard(dt) {
    const files = Array.from(dt.files || []).filter(f => /^image\//.test(f.type));
    const html = dt.getData && dt.getData('text/html');
    const txt = dt.getData && dt.getData('text/plain');
    if (html && html.trim()) {
      let els = htmlToBlocks(html);
      // print do Word copiado como imagem + html sem imagem: usa o arquivo de imagem
      if (!els.some(e => e.querySelector && e.querySelector('img')) && files.length && faltouImagem) { faltouImagem = 0; for (const f of files) els.push(await imageBlock(f)); }
      insertBlocks(els); return;
    }
    if (files.length) { const els = []; for (const f of files) els.push(await imageBlock(f)); insertBlocks(els); return; }
    if (txt) insertBlocks(textToBlocks(txt));
  }
  document.addEventListener('paste', e => {
    if ($('#dlg').open || (e.target.closest && e.target.closest('.campo'))) return;
    e.preventDefault(); handleClipboard(e.clipboardData);
  });
  $('#bColar').onclick = async () => {
    try {
      const items = await navigator.clipboard.read(); const dt = { files: [], data: {} };
      for (const it of items) {
        for (const t of it.types) {
          const b = await it.getType(t);
          if (/^image\//.test(t)) dt.files.push(new File([b], 'img', { type: t }));
          else if (t === 'text/html' || t === 'text/plain') dt.data[t] = await b.text();
        }
      }
      dt.getData = t => dt.data[t] || '';
      handleClipboard(dt);
    } catch (e) {
      alert('Para colar, aperte Ctrl+V (no celular: toque e segure na folha e escolha Colar).');
    }
  };
  $('#bWord').onclick = () => $('#fWord').click();
  $('#fWord').onchange = async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try {
      const prep = await seiFormulas.prepararDocx(await f.arrayBuffer());
      const r = await mammoth.convertToHtml({ arrayBuffer: prep.arrayBuffer }, { convertImage: mammoth.images.dataUri, ignoreEmptyParagraphs: false });
      insertBlocks(htmlToBlocks(seiFormulas.devolverFormulas(r.value, prep.formulas)));
    } catch (err) { alert('Não consegui ler este arquivo do Word: ' + err.message); }
  };
  $('#bImg').onclick = () => $('#fImg').click();
  $('#fImg').onchange = async e => { const f = e.target.files[0]; e.target.value = ''; if (f) insertBlocks([await imageBlock(f)]); };
  $('#bTexto').onclick = () => { const p = document.createElement('p'); p.textContent = 'Novo texto'; insertBlocks([p]); openEdit(selId); };
  $('#bQuebra').onclick = () => { const d = document.createElement('div'); d.className = 'quebra'; insertBlocks([d]); };
  $('#bLimpar').onclick = () => { if (blocks.length && confirm('Apagar todo o conteúdo desta folha?')) { remember(); blocks = []; selId = null; render(); save(); } };
  $('#bPrint').onclick = () => { seiPrint.mode('color'); select(null); setTimeout(() => window.print(), 50); };
  // Preto e branco: mesma folha, com a moldura na versão clara (o fundo escuro gastaria tinta e esconderia a caneta)
  async function moldurasPB() {
    const fr = Array.from(pagesEl.querySelectorAll('.frame'));
    await Promise.all(fr.map(im => new Promise(ok => {
      const pb = im.src.replace(/-p([12])\.jpg(\?[^#]*)?$/, '-p$1-pb.jpg?v=8');
      if (pb === im.src) return ok();
      im.onload = im.onerror = () => ok(); im.src = pb;
    })));
  }
  $('#bPrintBW').onclick = async () => { seiPrint.mode('bw'); select(null); await moldurasPB(); setTimeout(() => window.print(), 50); };

  function select(id) { selId = id; document.querySelectorAll('.col .on').forEach(e => e.classList.remove('on')); if (id != null) document.querySelectorAll(`.col [data-id="${id}"]`).forEach(e => e.classList.add('on')); $('#sel').hidden = id == null; updateToolbar(); }
  const move = d => { const i = blocks.findIndex(b => b.id === selId); const j = i + d; if (i < 0 || j < 0 || j >= blocks.length) return; remember(); [blocks[i], blocks[j]] = [blocks[j], blocks[i]]; render(); save(); };
  $('#sUp').onclick = () => move(-1);
  $('#sDown').onclick = () => move(1);
  $('#sDel').onclick = () => { const i = blocks.findIndex(b => b.id === selId); if (i < 0) return; remember(); blocks.splice(i, 1); selId = blocks[i] ? blocks[i].id : (blocks[i - 1] ? blocks[i - 1].id : null); render(); save(); };
  $('#sEdit').onclick = () => openEdit(selId);
  document.addEventListener('keydown', e => {
    if ($('#dlg').open || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    if ((e.ctrlKey || e.metaKey) && ['z','y'].includes(e.key.toLowerCase())) { e.preventDefault(); historyStep(e.key.toLowerCase()==='y'||e.shiftKey); return; }
    if (inline) return;
    if (selId != null && (e.key === 'Delete' || e.key === 'Backspace')) { e.preventDefault(); $('#sDel').onclick(); }
    if (selId != null && e.key === 'Escape') select(null);
  });
  mainFormat = seiFormat.toolbar($('#formatToolbar'), {apply:formatBlock,undo:()=>historyStep(false),redo:()=>historyStep(true)});
  updateToolbar();
  const richFormat = seiFormat.editor($('#ed'), $('#dialogToolbar'));
  let inline = null;
  // Editar direto na folha: duplo clique no texto; Enter cria linha nova; clicar fora salva.
  function editarNaFolha(el) {
    const id = +el.dataset.id; if (!['P','UL','OL','DIV'].includes(el.tagName) || el.classList.contains('quebra')) { openEdit(id); return; }
    if (document.querySelectorAll(`.col [data-id="${id}"]`).length > 1) { openEdit(id); return; }
    if (inline) return;
    const b = blocks.find(x => x.id === id); if (!b) return;
    inline = { id, el }; select(null); el.classList.add('editando'); el.contentEditable = 'true'; el.focus();
    const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
    const fim = () => {
      if (!inline || inline.el !== el) return; inline = null; el.contentEditable = 'false'; el.classList.remove('editando');
      const i = blocks.findIndex(x => x.id === id); if (i < 0) return;
      const tmp = document.createElement('div'); tmp.innerHTML = el.innerHTML.replace(/<div>/g, '<p>').replace(/<\/div>/g, '</p>');
      if (el.tagName === 'UL' || el.tagName === 'OL') { const w = document.createElement(el.tagName.toLowerCase()); w.innerHTML = el.innerHTML; tmp.replaceChildren(w); }
      const els = cleanBlocks(tmp); if (!els.length) { remember(); blocks.splice(i, 1); render(); save(); return; }
      if (el.tagName === 'P' && el.className) els.forEach(x => { if (x.tagName === 'P' && !x.className) x.className = el.className; });
      remember(); const items = els.map(x => ({ id: nextId++, html: x.outerHTML }));
      blocks.splice(i, 1, ...items); render(); save();
    };
    el.addEventListener('blur', fim, { once: true });
    el.addEventListener('keydown', ev => { ev.stopPropagation(); if (ev.key === 'Escape') el.blur(); });
    el.addEventListener('paste', ev => { ev.preventDefault(); ev.stopPropagation(); const t = ev.clipboardData.getData('text/plain'); document.execCommand('insertText', false, t); });
  }
  let editing = null;
  function openEdit(id) {
    const b = blocks.find(x => x.id === id); if (!b) return;
    editing = id; $('#ed').innerHTML = b.html; richFormat.reset(); $('#dlg').showModal(); setTimeout(() => $('#ed').focus(), 30);
  }
  $('#dlg').addEventListener('close', () => {
    if ($('#dlg').returnValue !== 'ok' || editing == null) { editing = null; return; }
    const i = blocks.findIndex(b => b.id === editing); editing = null; if (i < 0) return;
    remember();
    const els = cleanBlocks($('#ed'));
    const items = els.map(e => ({ id: nextId++, html: e.outerHTML }));
    blocks.splice(i, 1, ...items); selId = items.length ? items[items.length - 1].id : null; render(); save();
  });
  $('#ed').addEventListener('paste', e => {
    e.preventDefault(); const html = e.clipboardData.getData('text/html'); const txt = e.clipboardData.getData('text/plain');
    const els = html ? htmlToBlocks(html) : textToBlocks(txt || '');
    const frag = document.createDocumentFragment(); els.forEach(x => frag.appendChild(x));
    const s = getSelection(); if (s.rangeCount) { const r = s.getRangeAt(0); r.deleteContents(); r.insertNode(frag); }
  });

  /* ---------- paginação: esquerda → direita → próxima página ---------- */
  const cm = v => v.toFixed(3) + 'cm';
  function colBoxes(first) {
    const L = PSM + 0.85 * F, gap = 0.45, W = (21 - 2 * L - gap) / 2;
    const top = first ? OY + (geo.cut * K + 0.25) * F : OY + (CH * K + 0.45) * F;
    const bot = OY + (geo.bh * K + 0.35) * F;
    const H = 29.7 - top - bot;
    return [{ x: L, y: top, w: W, h: H }, { x: L + W + gap, y: top, w: W, h: H }];
  }
  function makePage(n) {
    const wrap = document.createElement('div'); wrap.className = 'pwrap';
    const pg = document.createElement('div'); pg.className = 'page'; wrap.appendChild(pg);
    const fr = document.createElement('img'); fr.className = 'frame'; fr.alt = '';
    fr.src = 'assets/montar/' + geo.f + (n === 0 ? '-p1.jpg' : '-p2.jpg') + '?v=6-ponto';
    if (geo.fullPage) Object.assign(fr.style, {left: '0', top: '0', width: '210mm', height: '297mm'});
    pg.appendChild(fr);
    if (n === 0) {
      const c = document.createElement('input'); c.className = 'campo'; c.placeholder = geo.turma ? 'Digite a turma' : 'Digite o conteúdo'; c.value = conteudo;
      c.style.left = cm((geo.ul[1] * K + 0.05) * F + PSM); c.style.top = cm(OY + geo.ul[0] * K * F - 0.36); c.style.width = cm((geo.turma ? 2.6 : 3.4) * F); c.style.height = '0.34cm';
      c.oninput = () => { conteudo = c.value; save(); };
      pg.appendChild(c);
      if (geo.idColor) {
        // Identificação: [ícone] TIPO | NÚMERO — os dois editáveis, na fonte da arte
        const box = (x0, y0, x1, y1) => ({ left: cm(PSM + x0 * K * F), top: cm(OY + y0 * K * F), width: cm((x1 - x0) * K * F), height: cm((y1 - y0) * K * F) });
        const partes = (identificacao || '').trim().match(/^(.*?)\s*(\d+)?$/) || ['', identificacao, ''];
        const tipo = document.createElement('input'); tipo.className = 'campo id-tipo'; tipo.maxLength = 14;
        tipo.setAttribute('aria-label', 'Tipo da folha: Aula, Revisão, Atividade…'); tipo.value = partes[1] || '';
        Object.assign(tipo.style, box(834, 264, 928, 302));
        const sep = document.createElement('span'); sep.className = 'id-sep'; sep.style.background = '#' + geo.idColor;
        Object.assign(sep.style, box(931.5, 264, 933.3, 303));
        const num = document.createElement('input'); num.className = 'campo id-num'; num.maxLength = 3;
        num.setAttribute('aria-label', 'Número da folha'); num.value = partes[2] || ''; num.style.color = '#' + geo.idColor;
        Object.assign(num.style, box(937, 257, 991, 309));
        const upd = () => { identificacao = (tipo.value.trim() + ' ' + num.value.trim()).trim(); save(); };
        tipo.oninput = upd; num.oninput = upd;
        pg.append(sep, tipo, num);
      }
    }
    const cols = colBoxes(n === 0).map(b => { const d = document.createElement('div'); d.className = 'col'; Object.assign(d.style, { left: cm(b.x), top: cm(b.y), width: cm(b.w), height: cm(b.h) }); pg.appendChild(d); return d; });
    {
      const box = colBoxes(n === 0)[0];
      const divider = document.createElement('div'); divider.className = 'column-divider'; divider.setAttribute('aria-hidden', 'true');
      divider.style.setProperty('--divider-color', geo.dividerColor || '#087dce');
      Object.assign(divider.style, { left: '10.5cm', top: cm(box.y), height: cm(box.h) }); pg.appendChild(divider);
      const mark = document.createElement('span'); mark.className='divider-mark'; mark.textContent='Nº 1 EM APROVAÇÃO'; divider.appendChild(mark);
      for (const position of ['start','end']) { const cap=document.createElement('span');cap.className='divider-cap '+position;divider.appendChild(cap); }
    }
    if (advanced) {
      const number = document.createElement('span'); number.className = 'auto-page-number';
      number.textContent = String(n + 1).padStart(2, '0'); number.setAttribute('aria-label', 'Página ' + (n + 1));
      const [px, py, pw, ph] = geo.page || [943, 1391, 50, 35];
      if (geo.pageColor) number.style.color = geo.pageColor;
      Object.assign(number.style, { left: cm(PSM + px * K * F), top: cm(OY + py * K * F), width: cm(pw * K * F), height: cm(ph * K * F) }); pg.appendChild(number);
    }
    return { wrap, pg, cols };
  }
  const fits = col => col.scrollHeight <= col.clientHeight + 0.5;
  function splitText(el, col) {
    // corta o parágrafo na última palavra que cabe; devolve [parte que fica, resto]
    // fórmulas não se partem: o texto delas não conta como ponto de corte
    const texts = []; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, { acceptNode: n => n.nodeType === 1 ? (n.localName === 'math' ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP) : NodeFilter.FILTER_ACCEPT }); let t, total = 0;
    while ((t = w.nextNode())) { texts.push([t, total]); total += t.nodeValue.length; }
    if (total < 2) return null;
    const at = k => { for (let i = texts.length - 1; i >= 0; i--) if (texts[i][1] <= k) return [texts[i][0], Math.min(k - texts[i][1], texts[i][0].nodeValue.length)]; return [texts[0][0], 0]; };
    const head = k => { const r = document.createRange(); r.setStart(el, 0); const [n, o] = at(k); r.setEnd(n, o); const c = el.cloneNode(false); c.appendChild(r.cloneContents()); return c; };
    const tail = k => { const r = document.createRange(); const [n, o] = at(k); r.setStart(n, o); r.setEnd(el, el.childNodes.length); const c = el.cloneNode(false); c.appendChild(r.cloneContents()); return c; };
    let lo = 0, hi = total, best = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1; const h = head(mid); col.appendChild(h); const ok = fits(col); col.removeChild(h);
      if (ok) { best = mid; lo = mid + 1; } else hi = mid - 1;
    }
    const full = texts.map(x => x[0].nodeValue).join('');
    let k = best; while (k > 0 && !/\s/.test(full[k - 1]) && best - k < 60) k--; if (k === 0) k = best;
    if (k <= 0) return null;
    return [head(k), tail(k)];
  }
  function splitChildren(el, col, sel) {
    // listas e tabelas: quebra por item/linha
    const items = Array.from(el.querySelectorAll(sel === 'tr' ? ':scope > tbody > tr, :scope > thead > tr, :scope > tr' : sel));
    if (items.length < 2) return null;
    const shell = () => { const c = el.cloneNode(false); if (sel === 'tr') c.appendChild(document.createElement('tbody')); return c; };
    const put = (c, x) => (sel === 'tr' ? c.firstChild : c).appendChild(x.cloneNode(true));
    const a = shell(); col.appendChild(a); let n = 0;
    for (const x of items) { put(a, x); if (!fits(col)) { (sel === 'tr' ? a.firstChild : a).lastChild.remove(); break; } n++; }
    col.removeChild(a);
    if (n === 0) return null;
    const b = shell(); if (sel === 'tr' && items[0].querySelector('th') && n > 1) put(b, items[0]); items.slice(n).forEach(x => put(b, x));
    if (el.tagName === 'OL') b.setAttribute('start', (parseInt(el.getAttribute('start') || '1', 10)) + n);
    return [a, b];
  }
  let renderToken = 0;
  async function render() {
    const tok = ++renderToken;
    if (!geo) return;
    measure.innerHTML = '';
    const pages = []; let pi = 0, ci = 0;
    const page = i => { while (pages.length <= i) { const p = makePage(pages.length); measure.appendChild(p.wrap); pages.push(p); } return pages[i]; };
    page(0);
    const col = () => page(pi).cols[ci];
    const advance = () => { ci++; if (ci > 1) { ci = 0; pi++; } };
    // espera as imagens para medir certo
    const tmp = document.createElement('div'); tmp.innerHTML = blocks.map(b => b.html).join('');
    await Promise.all(Array.from(tmp.querySelectorAll('img')).map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; })));
    if (tok !== renderToken) return;
    for (const b of blocks) {
      const t = document.createElement('div'); t.innerHTML = b.html; let el = t.firstElementChild; if (!el) continue;
      if (el.classList.contains('quebra')) { el.dataset.id = b.id; col().appendChild(el); if (col().children.length > 1) advance(); else el.remove(); continue; }
      let guard = 0;
      while (el && guard++ < 400) {
        el.dataset.id = b.id;
        const c = col(); c.appendChild(el);
        if (fits(c)) { el = null; break; }
        c.removeChild(el);
        const alone = c.children.length === 0;
        let parts = null;
        if (el.tagName === 'P' && el.querySelector('img') && !el.textContent.trim()) {
          if (alone) { el.querySelectorAll('img').forEach(im => { im.style.maxHeight = (c.clientHeight - 8) + 'px'; im.style.width = 'auto'; }); c.appendChild(el); el = null; break; }
        } else if (el.tagName === 'P') parts = splitText(el, c);
        else if (el.tagName === 'UL' || el.tagName === 'OL') parts = splitChildren(el, c, ':scope > li');
        else if (el.tagName === 'TABLE') parts = splitChildren(el, c, 'tr');
        if (parts) { parts[0].dataset.id = b.id; c.appendChild(parts[0]); el = parts[1]; advance(); continue; }
        if (alone) { c.appendChild(el); el = null; break; } // não cabe nem sozinho: fica cortado só na tela
        advance();
      }
    }
    // mostrar
    const scale = Math.min(1, (document.documentElement.clientWidth - 24) / (210 / 25.4 * 96));
    pagesEl.innerHTML = '';
    pages.forEach(p => {
      p.wrap.style.width = (210 / 25.4 * 96 * scale) + 'px'; p.wrap.style.height = (297 / 25.4 * 96 * scale) + 'px';
      p.pg.style.transform = `scale(${scale})`; pagesEl.appendChild(p.wrap);
    });
    if (!blocks.length) { const v = document.createElement('div'); v.className = 'vazio'; const b = colBoxes(true)[0]; Object.assign(v.style, { left: cm(b.x), top: cm(b.y), width: cm(21 - 2 * b.x) }); v.textContent = 'Cole aqui (Ctrl+V) o seu material, ou use “📄 Importar Word”.'; pages[0].pg.appendChild(v); }
    pagesEl.querySelectorAll('.col [data-id]').forEach(e => e.addEventListener('click', ev => { ev.stopPropagation(); select(+e.dataset.id); }));
    pagesEl.querySelectorAll('.col [data-id]').forEach(e => e.addEventListener('dblclick', ev => { ev.stopPropagation(); editarNaFolha(e); }));
    select(blocks.some(b => b.id === selId) ? selId : null);
  }
  pagesEl.addEventListener('click', () => select(null));
  let rt = null; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(render, 200); });
  addEventListener('beforeprint', () => {
    pagesEl.querySelectorAll('.page').forEach(p => { p.style.transform = 'none'; });
  });
  addEventListener('afterprint', () => { seiPrint.mode('color'); render(); });

  /* ---------- início ---------- */
  (async () => {
    let mol = {};
    try { mol = await (await fetch('assets/montar/molduras.json?v=8')).json(); } catch (e) {}
    geo = mol[src];
    if (!geo) { pagesEl.innerHTML = '<p style="text-align:center;padding:40px">Abra esta ferramenta pelo botão “Montar folha no site” de uma disciplina.</p>'; return; }
    const parts = geo.f.split('/'); const nome = parts[parts.length - 1].replace(/-/g, ' ');
    $('#titulo').textContent = 'Montar folha · ' + nome.charAt(0).toUpperCase() + nome.slice(1);
    const back = sessionStorage.getItem('sei-voltar'); if (back) $('#voltar').href = back;
    const saved = await db.get(KEY);
    if (saved && saved.blocks) { blocks = saved.blocks; conteudo = saved.conteudo || ''; identificacao = saved.identificacao ?? identificacao; nextId = blocks.reduce((m, b) => Math.max(m, b.id), 0) + 1; }
    render();
    window.dispatchEvent(new CustomEvent('sei-montar-pronto', { detail: { src, geo } }));
  })();
  window.seiMontar = { htmlToBlocks, insertBlocks, get blocks() { return blocks; },
    estado() { return { src, blocks: JSON.parse(JSON.stringify(blocks)), conteudo, identificacao }; },
    carregar(st) { remember(); blocks = JSON.parse(JSON.stringify(st.blocks || [])); conteudo = st.conteudo || ''; identificacao = st.identificacao || identificacao; nextId = blocks.reduce((m, b) => Math.max(m, b.id), 0) + 1; selId = null; render(); persist(); },
    novaFolha() { remember(); blocks = []; conteudo = ''; selId = null; render(); persist(); },
    get geo() { return geo; } };
})();
