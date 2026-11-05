/* Controles compartilhados da folha e da edição de trechos selecionados. */
(() => {
  const fonts = ['Arial','Calibri','Times New Roman','Verdana','Georgia','Courier New'];
  function toolbar(container, actions) {
    container.className = 'format-toolbar no-print';
    container.setAttribute('role', 'toolbar'); container.setAttribute('aria-label', 'Formatação do texto');
    const controls = [];
    const field = (label, action, values) => {
      const wrap = document.createElement('label'); wrap.textContent = label;
      const select = document.createElement('select'); select.setAttribute('aria-label', label);
      values.forEach(([value, name]) => { const option = document.createElement('option'); option.value = value; option.textContent = name; select.append(option); });
      select.onchange = () => actions.apply(action, select.value);
      wrap.append(select); container.append(wrap); controls.push([action, select]);
    };
    const button = (label, caption, action) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = caption;
      b.title = label; b.setAttribute('aria-label', label);
      b.onmousedown = e => e.preventDefault();
      b.onclick = () => action === 'undo' ? actions.undo() : action === 'redo' ? actions.redo() : actions.apply(action);
      container.append(b); controls.push([action, b]);
    };
    field('Fonte', 'fontFamily', fonts.map(f => [f, f]));
    field('Tamanho', 'fontSize', [8,9,10,11,12,14,16,18,20,24,28,36,48,72].map(n => [n, n + ' pt']));
    button('Negrito', 'N', 'bold'); button('Itálico', 'I', 'italic'); button('Sublinhado', 'S', 'underline');
    field('Alinhamento', 'textAlign', [['left','Esquerda'],['center','Centro'],['right','Direita'],['justify','Justificado']]);
    field('Entrelinhas', 'lineHeight', [[1,'Simples'],[1.15,'1,15'],[1.5,'1,5'],[2,'Duplo'],[2.5,'2,5']]);
    field('Após parágrafo', 'marginBottom', [0,3,6,12,18,24].map(n => [n, n + ' pt']));
    button('Lista com marcadores', '• Lista', 'insertUnorderedList');
    button('Lista numerada', '1. Lista', 'insertOrderedList');
    button('Diminuir recuo', '⇤', 'outdent'); button('Aumentar recuo', '⇥', 'indent');
    button('Desfazer', '↶', 'undo'); button('Refazer', '↷', 'redo');
    return {
      update(state = {}) {
        for (const [action, control] of controls) {
          control.disabled = action === 'undo' ? !state.canUndo : action === 'redo' ? !state.canRedo : !state.enabled;
          if (control.tagName === 'SELECT' && state[action] != null) control.value = String(state[action]);
          if (['bold','italic','underline'].includes(action)) control.setAttribute('aria-pressed', String(!!state[action]));
        }
      }
    };
  }
  function editor(ed, container) {
    let selection = null, busy = false, past = [], future = [];
    const snapshot = () => ed.innerHTML;
    const selectEnd = () => { const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); selection = r.cloneRange(); };
    const restoreSelection = () => {
      ed.focus();
      if (selection && ed.contains(selection.commonAncestorContainer)) { const s = getSelection(); s.removeAllRanges(); s.addRange(selection); }
      else selectEnd();
    };
    const remember = html => { past.push(html); if (past.length > 40) past.shift(); future = []; };
    const sync = () => {
      const s = getSelection(); const node = s.anchorNode;
      const el = node && ed.contains(node) ? (node.nodeType === 1 ? node : node.parentElement) : ed.firstElementChild || ed;
      const css = getComputedStyle(el);
      bar.update({enabled:true, canUndo:past.length > 0, canRedo:future.length > 0,
        fontFamily:css.fontFamily.split(',')[0].replace(/["']/g,''), fontSize:Math.round(parseFloat(css.fontSize) * .75),
        textAlign:css.textAlign === 'start' ? 'left' : css.textAlign,
        lineHeight:Math.round(parseFloat(css.lineHeight) / parseFloat(css.fontSize) * 100) / 100,
        marginBottom:Math.round(parseFloat(css.marginBottom) * .75),
        bold:document.queryCommandState('bold'),italic:document.queryCommandState('italic'),underline:document.queryCommandState('underline')});
    };
    const step = redo => {
      const from = redo ? future : past, to = redo ? past : future;
      if (!from.length) return;
      to.push(snapshot()); ed.innerHTML = from.pop(); selectEnd(); ed.focus(); sync();
    };
    const apply = (action, value) => {
      restoreSelection(); const before = snapshot(); busy = true;
      if (action === 'fontFamily') document.execCommand('fontName', false, value);
      else if (action === 'fontSize') {
        document.execCommand('fontSize', false, '7');
        ed.querySelectorAll('font[size="7"]').forEach(font => { font.removeAttribute('size'); font.style.fontSize = value + 'pt'; });
      } else if (['textAlign','lineHeight','marginBottom'].includes(action)) {
        const s = getSelection(), range = s.rangeCount && s.getRangeAt(0);
        let nodes = Array.from(ed.querySelectorAll('p,li,h1,h2,h3,h4,h5,h6,blockquote'))
          .filter(n => range && range.intersectsNode(n));
        if (!nodes.length) {
          document.execCommand('formatBlock', false, 'p');
          const n = getSelection().anchorNode;
          const p = (n.nodeType === 1 ? n : n.parentElement).closest('p,li');
          if (p && ed.contains(p)) nodes = [p];
        }
        nodes.forEach(n => n.style[action] = action === 'marginBottom' ? value + 'pt' : value);
      } else document.execCommand(action, false, null);
      busy = false;
      if (snapshot() !== before) remember(before);
      const s = getSelection(); if (s.rangeCount) selection = s.getRangeAt(0).cloneRange();
      sync();
    };
    const bar = toolbar(container, {apply, undo:() => step(false), redo:() => step(true)});
    document.addEventListener('selectionchange', () => {
      const s = getSelection(); if (s.rangeCount && ed.contains(s.anchorNode)) { selection = s.getRangeAt(0).cloneRange(); sync(); }
    });
    ed.addEventListener('beforeinput', () => { if (!busy) remember(snapshot()); });
    ed.addEventListener('input', sync);
    ed.addEventListener('paste', () => { if (!busy) remember(snapshot()); }, true);
    ed.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && ['z','y'].includes(e.key.toLowerCase())) {
        e.preventDefault(); step(e.key.toLowerCase() === 'y' || e.shiftKey);
      }
    });
    return {reset() { past = []; future = []; selection = null; bar.update({enabled:true,canUndo:false,canRedo:false}); }, sync};
  }
  window.seiFormat = {toolbar, editor};
})();
