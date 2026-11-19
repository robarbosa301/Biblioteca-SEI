/* Editor de texto dos documentos (um "Wordzinho"): fonte, tamanho, negrito, itálico, sublinhado,
   cor, marca-texto, alinhamento, entrelinhas, listas, recuo, limpar e desfazer.
   Troca cada <textarea> do formulário por uma caixa editável; o texto vai para o textarea em HTML. */
(function () {
  'use strict';
  const FONTES = ['Arial', 'Calibri', 'Times New Roman', 'Georgia', 'Verdana', 'Poppins'];
  const TAMS = [8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 24, 28, 36];
  const ENTRE = [['1', 'Simples'], ['1.15', '1,15'], ['1.5', '1,5'], ['1.75', '1,75'], ['2', 'Duplo']];
  const ehHTML = s => /<(p|div|br|b|strong|i|em|u|span|ul|ol|li|blockquote|font)\b/i.test(s || '');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // texto simples (com *negrito*) -> HTML de parágrafos
  const paraHTML = s => ehHTML(s) ? s : !String(s || '').trim() ? '<p><br></p>' : String(s || '').split(/\n\s*\n/).map(p => `<p>${esc(p).replace(/\*([^*\n]+)\*/g, '<b>$1</b>').replace(/\n/g, '<br>')}</p>`).join('') || '<p><br></p>';

  /* ---------- limpeza do HTML (só o que o documento usa) ---------- */
  const TAGS = new Set(['P', 'DIV', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'SPAN', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'FONT', 'SUB', 'SUP']);
  const ESTILOS = ['font-size', 'font-family', 'color', 'background-color', 'text-align', 'line-height', 'margin-left', 'padding-left', 'text-indent', 'font-weight', 'font-style', 'text-decoration', 'text-decoration-line'];
  function limpar(html) {
    const d = new DOMParser().parseFromString(`<div>${html || ''}</div>`, 'text/html').body.firstChild;
    const anda = el => { [...el.childNodes].forEach(n => {
      if (n.nodeType === 3) return; if (n.nodeType !== 1) { n.remove(); return; }
      if (!TAGS.has(n.tagName)) { anda(n); n.replaceWith(...n.childNodes); return; }
      if (n.tagName === 'FONT') { const sp = document.createElement('span'); if (n.color) sp.style.color = n.color; if (n.face) sp.style.fontFamily = n.face; sp.append(...n.childNodes); n.replaceWith(sp); anda(sp); return; }
      const st = n.getAttribute('style') || ''; [...n.attributes].forEach(a => n.removeAttribute(a.name));
      const ok = st.split(';').map(x => x.trim()).filter(x => ESTILOS.includes(x.split(':')[0].trim().toLowerCase()) && !/url\(|expression/i.test(x));
      if (ok.length) n.setAttribute('style', ok.join(';'));
      anda(n); }); };
    anda(d); d.querySelectorAll('p,div').forEach(p => { if (!p.childNodes.length) p.remove(); }); return d.innerHTML;
  }
  window.seiTexto = { ehHTML, limpar, paraHTML };

  /* ---------- barra ---------- */
  function barra(ed) {
    const b = document.createElement('div'); b.className = 'ed-barra no-print'; b.setAttribute('role', 'toolbar'); b.setAttribute('aria-label', 'Formatação do texto');
    b.innerHTML = `<select data-c="fonte" title="Fonte" aria-label="Fonte"><option value="">Fonte</option>${FONTES.map(f => `<option style="font-family:${f}">${f}</option>`).join('')}</select>
      <select data-c="tam" title="Tamanho da letra" aria-label="Tamanho da letra"><option value="">Tam.</option>${TAMS.map(t => `<option value="${t}">${String(t).replace('.', ',')}</option>`).join('')}</select>
      <span class="ed-g"><button type="button" data-c="bold" title="Negrito (Ctrl+B)"><b>N</b></button><button type="button" data-c="italic" title="Itálico (Ctrl+I)"><i>I</i></button><button type="button" data-c="underline" title="Sublinhado (Ctrl+U)"><u>S</u></button></span>
      <label class="ed-cor" title="Cor da letra"><span style="border-bottom:3px solid #c62828">A</span><input type="color" data-c="cor" value="#c62828" aria-label="Cor da letra"></label>
      <label class="ed-cor" title="Marca-texto"><span style="background:#fff176">ab</span><input type="color" data-c="marca" value="#fff176" aria-label="Marca-texto"></label>
      <span class="ed-g"><button type="button" data-c="justifyLeft" title="Alinhar à esquerda">${ic('l')}</button><button type="button" data-c="justifyCenter" title="Centralizar">${ic('c')}</button><button type="button" data-c="justifyRight" title="Alinhar à direita">${ic('r')}</button><button type="button" data-c="justifyFull" title="Justificar">${ic('j')}</button></span>
      <select data-c="entre" title="Espaçamento entre linhas" aria-label="Espaçamento entre linhas"><option value="">Entrelinhas</option>${ENTRE.map(([v, n]) => `<option value="${v}">${n}</option>`).join('')}</select>
      <span class="ed-g"><button type="button" data-c="insertUnorderedList" title="Lista com marcadores">•≡</button><button type="button" data-c="insertOrderedList" title="Lista numerada">1≡</button><button type="button" data-c="outdent" title="Diminuir recuo">⇤</button><button type="button" data-c="indent" title="Aumentar recuo">⇥</button></span>
      <span class="ed-g"><button type="button" data-c="removeFormat" title="Limpar formatação">⌫ Limpar</button><button type="button" data-c="undo" title="Desfazer (Ctrl+Z)">↶</button><button type="button" data-c="redo" title="Refazer (Ctrl+Y)">↷</button></span>`;
    b.addEventListener('mousedown', e => { if (e.target.closest('button')) e.preventDefault(); });
    let sel = null; const guarda = () => { const s = getSelection(); if (s.rangeCount && ed.contains(s.anchorNode)) sel = s.getRangeAt(0).cloneRange(); };
    ed.addEventListener('keyup', guarda); ed.addEventListener('mouseup', guarda); ed.addEventListener('input', guarda); document.addEventListener('selectionchange', () => { if (document.activeElement === ed) guarda(); });
    const volta = () => { const s0 = getSelection(); if (s0.rangeCount && ed.contains(s0.anchorNode)) sel = s0.getRangeAt(0).cloneRange(); ed.focus(); if (sel) { const s = getSelection(); s.removeAllRanges(); s.addRange(sel); } };
    const cmd = (c, v) => { volta(); try { document.execCommand('styleWithCSS', false, true); } catch (e) {} document.execCommand(c, false, v); ed.dispatchEvent(new Event('input', { bubbles: true })); };
    b.addEventListener('click', e => { const t = e.target.closest('button'); if (t) cmd(t.dataset.c); });
    b.addEventListener('change', e => {
      const t = e.target, c = t.dataset.c, v = t.value; if (!v) return;
      if (c === 'fonte') cmd('fontName', v);
      if (c === 'tam') { volta(); try { document.execCommand('styleWithCSS', false, false); } catch (x) {} document.execCommand('fontSize', false, 7); ed.querySelectorAll('font[size="7"]').forEach(f => { const s = document.createElement('span'); s.style.fontSize = v + 'pt'; s.append(...f.childNodes); f.replaceWith(s); }); ed.querySelectorAll('span[style*="xxx-large"],span[style*="-webkit-xxx-large"]').forEach(s => { s.style.fontSize = v + 'pt'; }); ed.dispatchEvent(new Event('input', { bubbles: true })); }
      if (c === 'cor') cmd('foreColor', v);
      if (c === 'marca') cmd('hiliteColor', v);
      if (c === 'entre') { volta(); blocos(ed).forEach(p => { p.style.lineHeight = v; }); ed.dispatchEvent(new Event('input', { bubbles: true })); }
      if (t.tagName === 'SELECT') t.value = '';
    });
    return b;
  }
  function ic(a) { const w = { l: [14, 10, 14, 8], c: [14, 10, 14, 10], r: [14, 10, 14, 8], j: [14, 14, 14, 14] }[a]; const x = (n, k) => a === 'c' ? (16 - n) / 2 : a === 'r' ? 16 - n : 1; return `<svg width="16" height="14" viewBox="0 0 17 14" aria-hidden="true">${w.map((n, k) => `<rect x="${x(n, k)}" y="${1 + k * 3.3}" width="${n}" height="1.8" rx=".9" fill="currentColor"/>`).join('')}</svg>`; }
  // parágrafos da seleção
  function blocos(ed) {
    const s = getSelection(); if (!s.rangeCount) return []; const r = s.getRangeAt(0);
    const bloco = n => { while (n && n !== ed) { if (n.nodeType === 1 && /^(P|DIV|LI|BLOCKQUOTE)$/.test(n.tagName)) return n; n = n.parentNode; } return null; };
    const out = [...ed.querySelectorAll('p,div,li,blockquote')].filter(p => r.intersectsNode(p) && !p.querySelector('p,div,li'));
    const b0 = bloco(r.startContainer); if (b0 && !out.includes(b0)) out.push(b0);
    if (!out.length) { // texto solto: embrulha num parágrafo
      const p = document.createElement('p'); while (ed.firstChild) p.append(ed.firstChild); ed.append(p); out.push(p); }
    return out;
  }

  /* ---------- troca os textareas ---------- */
  function ligar(ta) {
    if (ta.dataset.ed) return; ta.dataset.ed = '1';
    const caixa = document.createElement('div'); caixa.className = 'ed-caixa';
    const ed = document.createElement('div'); ed.className = 'ed-texto'; ed.contentEditable = 'true'; ed.setAttribute('role', 'textbox'); ed.setAttribute('aria-multiline', 'true');
    ed.setAttribute('aria-label', (ta.closest('label') && ta.closest('label').querySelector('span') ? ta.closest('label').querySelector('span').textContent : 'Texto'));
    if (ta.placeholder) ed.dataset.ph = ta.placeholder;
    ed.style.minHeight = Math.max(3, +ta.rows || 4) * 1.6 + 'em';
    const desc = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
    const vazio = () => !ed.textContent.trim() && !ed.querySelector('img');
    const sobe = () => { desc.set.call(ta, vazio() ? '' : limpar(ed.innerHTML)); };
    ed.innerHTML = paraHTML(desc.get.call(ta));
    ed.addEventListener('input', () => { sobe(); ta.dispatchEvent(new Event('input', { bubbles: true })); });
    ed.addEventListener('paste', e => { const h = e.clipboardData.getData('text/html'); const t = e.clipboardData.getData('text/plain'); e.preventDefault(); document.execCommand('insertHTML', false, h ? limpar(h) : paraHTML(t)); });
    // quem escreve no textarea por código (ex.: texto montado da declaração) atualiza a caixa
    Object.defineProperty(ta, 'value', { configurable: true, get() { return desc.get.call(ta); }, set(v) { desc.set.call(ta, v); ed.innerHTML = paraHTML(v); } });
    try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (e) {}
    caixa.append(barra(ed), ed); ta.hidden = true; ta.after(caixa);
  }
  window.seiEditor = { ligar, ligarTodos: raiz => (raiz || document).querySelectorAll('textarea').forEach(ligar) };
})();
