/* Fórmulas e símbolos: equações do Word (OMML) viram MathML; fonte Symbol vira letra grega. */
(() => {
  const OMML = 'http://schemas.openxmlformats.org/officeDocument/2006/math';

  // Fonte Symbol (e caracteres 0xF0xx que o Word usa para ela) → Unicode
  const SYM = {
    A:'Α',B:'Β',C:'Χ',D:'Δ',E:'Ε',F:'Φ',G:'Γ',H:'Η',I:'Ι',J:'ϑ',K:'Κ',L:'Λ',M:'Μ',N:'Ν',O:'Ο',P:'Π',Q:'Θ',R:'Ρ',S:'Σ',T:'Τ',U:'Υ',V:'ς',W:'Ω',X:'Ξ',Y:'Ψ',Z:'Ζ',
    a:'α',b:'β',c:'χ',d:'δ',e:'ε',f:'φ',g:'γ',h:'η',i:'ι',j:'ϕ',k:'κ',l:'λ',m:'μ',n:'ν',o:'ο',p:'π',q:'θ',r:'ρ',s:'σ',t:'τ',u:'υ',v:'ϖ',w:'ω',x:'ξ',y:'ψ',z:'ζ',
    '"':'∀','$':'∃',"'":'∋','*':'∗','-':'−','@':'≅','\\':'∴','^':'⊥','`':'‾','~':'∼',
    '\xA1':'ϒ','\xA2':'′','\xA3':'≤','\xA4':'⁄','\xA5':'∞','\xA6':'ƒ','\xA7':'♣','\xA8':'♦','\xA9':'♥','\xAA':'♠','\xAB':'↔','\xAC':'←','\xAD':'↑','\xAE':'→','\xAF':'↓',
    '\xB0':'°','\xB1':'±','\xB2':'″','\xB3':'≥','\xB4':'×','\xB5':'∝','\xB6':'∂','\xB7':'•','\xB8':'÷','\xB9':'≠','\xBA':'≡','\xBB':'≈','\xBC':'…','\xBD':'⏐','\xBE':'⎯','\xBF':'↵',
    '\xC0':'ℵ','\xC1':'ℑ','\xC2':'ℜ','\xC3':'℘','\xC4':'⊗','\xC5':'⊕','\xC6':'∅','\xC7':'∩','\xC8':'∪','\xC9':'⊃','\xCA':'⊇','\xCB':'⊄','\xCC':'⊂','\xCD':'⊆','\xCE':'∈','\xCF':'∉',
    '\xD0':'∠','\xD1':'∇','\xD2':'®','\xD3':'©','\xD4':'™','\xD5':'∏','\xD6':'√','\xD7':'⋅','\xD8':'¬','\xD9':'∧','\xDA':'∨','\xDB':'⇔','\xDC':'⇐','\xDD':'⇑','\xDE':'⇒','\xDF':'⇓',
    '\xE0':'◊','\xE1':'〈','\xE5':'∑','\xF1':'〉','\xF2':'∫'
  };
  const symChar = ch => {
    let c = ch.charCodeAt(0);
    if (c >= 0xF020 && c <= 0xF0FF) c -= 0xF000;
    return SYM[String.fromCharCode(c)] || (c !== ch.charCodeAt(0) ? String.fromCharCode(c) : ch);
  };
  const symText = s => s.replace(/[\s\S]/g, symChar);
  // caracteres da área privada (0xF0xx) que sobraram de símbolos do Word
  const pua = s => s.replace(/[\uF020-\uF0FF]/g, symChar);

  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ---------- OMML → MathML (funciona com o XML do .docx e com o HTML colado do Word) ---------- */
  const nome = el => {
    if (el.nodeType !== 1) return null;
    if (el.namespaceURI === OMML) return el.localName;
    const n = (el.localName || el.tagName || '').toLowerCase();
    return n.startsWith('m:') ? n.slice(2) : null;
  };
  const norm = n => n && n.toLowerCase();
  function filhos(el) {
    const out = [];
    for (const c of Array.from(el.childNodes)) {
      if (c.nodeType !== 1) continue;
      if (nome(c)) out.push(c);
      else out.push(...filhos(c)); // span, i, w:… : só embrulham
    }
    return out;
  }
  const filho = (el, n) => filhos(el).find(c => norm(nome(c)) === n);
  const val = el => {
    if (!el) return null;
    for (const a of ['m:val', 'val']) if (el.hasAttribute(a)) return el.getAttribute(a);
    const v = el.getAttributeNS && el.getAttributeNS(OMML, 'val'); return v || null;
  };
  const prop = (el, pr, p) => { const x = filho(el, pr); return x ? filho(x, p) : null; };
  const on = el => !!el && !/^(0|off|false)$/i.test(val(el) || 'on');
  const linha = s => s ? `<mrow>${s}</mrow>` : '<mrow></mrow>';
  const ACENTO = { '\u0302':'^', '\u0303':'~', '\u0307':'˙', '\u0308':'¨', '\u20D7':'→', '\u20D6':'←', '\u20E1':'↔', '\u0304':'¯', '\u0305':'¯', '\u0301':'´', '\u0300':'`', '\u030C':'ˇ', '\u0306':'˘', '\u030A':'˚' };
  const OPS = '+-−=<>≤≥≠≈≡±∓×÷·⋅∙/\\|()[]{}⟨⟩,;:!∑∏∫∮∂∇→←↔⇒⇔⇐↑↓∞∈∉⊂⊃⊆⊇∪∩∧∨¬∀∃%′″‰°∝∼≅⊥∥∠…⋯';

  function tokens(txt, normal, juntar) {
    let out = '';
    const re = /(\d+(?:[.,]\d+)*)|(\s+)|([A-Za-zÀ-ÿ\u0370-\u03FF\u1F00-\u1FFF]+)|([\s\S])/g; let m;
    while ((m = re.exec(txt))) {
      if (m[1]) out += `<mn>${esc(m[1])}</mn>`;
      else if (m[2]) out += m[2].length > 1 ? '<mspace width="0.5em"></mspace>' : '<mspace width="0.25em"></mspace>';
      else if (m[3]) {
        if (juntar || normal) out += `<mi${normal && m[3].length === 1 ? ' mathvariant="normal"' : ''}>${esc(m[3])}</mi>`;
        else for (const ch of m[3]) out += `<mi>${esc(ch)}</mi>`;
      }
      else out += OPS.includes(m[4]) ? `<mo>${esc(m[4] === '-' ? '−' : m[4])}</mo>` : `<mi>${esc(m[4])}</mi>`;
    }
    return out;
  }
  function textoRun(r) {
    // o texto da corrida, sem as propriedades
    let s = '';
    const walk = n => { for (const c of Array.from(n.childNodes)) { if (c.nodeType === 3) s += c.nodeValue; else if (c.nodeType === 1) { const nm = norm(nome(c)); if (nm === 'rpr') continue; if (/rpr$/i.test(c.localName || '')) continue; walk(c); } } };
    walk(r); return pua(s.replace(/\u00A0/g, ' '));
  }
  function conv(el, ctx = {}) {
    const n = norm(nome(el));
    const kids = () => filhos(el).map(c => conv(c, ctx)).join('');
    const parte = (p, c2 = ctx) => { const x = filho(el, p); return linha(x ? filhos(x).map(c => conv(c, c2)).join('') : ''); };
    switch (n) {
      case null: return '';
      case 'r': {
        const sty = val(prop(el, 'rpr', 'sty')); const nor = prop(el, 'rpr', 'nor');
        return tokens(textoRun(el), sty === 'p' || sty === 'b' || on(nor), ctx.func);
      }
      case 'omathpara': return filhos(el).map(c => conv(c, ctx)).join('<mspace linebreak="newline"></mspace>');
      case 'f': {
        const t = val(prop(el, 'fpr', 'type'));
        if (t === 'lin') return `<mrow>${parte('num')}<mo>/</mo>${parte('den')}</mrow>`;
        return `<mfrac${t === 'noBar' ? ' linethickness="0"' : ''}>${parte('num')}${parte('den')}</mfrac>`;
      }
      case 'ssup': return `<msup>${parte('e')}${parte('sup')}</msup>`;
      case 'ssub': return `<msub>${parte('e')}${parte('sub')}</msub>`;
      case 'ssubsup': return `<msubsup>${parte('e')}${parte('sub')}${parte('sup')}</msubsup>`;
      case 'spre': return `<mmultiscripts>${parte('e')}<mprescripts></mprescripts>${parte('sub')}${parte('sup')}</mmultiscripts>`;
      case 'rad': {
        const deg = filho(el, 'deg'); const hide = on(prop(el, 'radpr', 'deghide'));
        if (hide || !deg || !filhos(deg).length) return `<msqrt>${parte('e')}</msqrt>`;
        return `<mroot>${parte('e')}${parte('deg')}</mroot>`;
      }
      case 'd': {
        const pr = filho(el, 'dpr');
        const pega = (p, def) => { const x = pr && filho(pr, p); if (!x) return def; const v = val(x); return v == null ? '' : v; };
        const a = pega('begchr', '('), b = pega('endchr', ')'), s = pega('sepchr', '|');
        const es = filhos(el).filter(c => norm(nome(c)) === 'e').map(c => linha(filhos(c).map(k => conv(k, ctx)).join('')));
        return `<mrow>${a ? `<mo fence="true">${esc(a)}</mo>` : ''}${es.join(s ? `<mo separator="true">${esc(s)}</mo>` : '')}${b ? `<mo fence="true">${esc(b)}</mo>` : ''}</mrow>`;
      }
      case 'nary': {
        const pr = filho(el, 'narypr');
        const chrEl = pr && filho(pr, 'chr'); const chr = chrEl ? (val(chrEl) || '∫') : '∫';
        const und = (pr && val(filho(pr, 'limloc'))) === 'undOvr' || (!pr || !filho(pr, 'limloc')) && /[∑∏∐⋃⋂⋁⋀]/.test(chr);
        const subH = pr && on(filho(pr, 'subhide'));
        const supH = pr && on(filho(pr, 'suphide'));
        const op = `<mo largeop="true" movablelimits="false">${esc(chr)}</mo>`;
        const sub = subH ? '' : parte('sub'), sup = supH ? '' : parte('sup');
        let base;
        if (sub && sup) base = und ? `<munderover>${op}${sub}${sup}</munderover>` : `<msubsup>${op}${sub}${sup}</msubsup>`;
        else if (sub) base = und ? `<munder>${op}${sub}</munder>` : `<msub>${op}${sub}</msub>`;
        else if (sup) base = und ? `<mover>${op}${sup}</mover>` : `<msup>${op}${sup}</msup>`;
        else base = op;
        return `<mrow>${base}${parte('e')}</mrow>`;
      }
      case 'acc': {
        const c = val(prop(el, 'accpr', 'chr')) || '\u0302';
        return `<mover accent="true">${parte('e')}<mo stretchy="${c === '\u20D7' || c === '\u20D6' ? 'true' : 'false'}">${esc(ACENTO[c] || c)}</mo></mover>`;
      }
      case 'bar': {
        const pos = val(prop(el, 'barpr', 'pos')) || 'bot';
        return pos === 'top' ? `<mover accent="true">${parte('e')}<mo>¯</mo></mover>` : `<munder accentunder="true">${parte('e')}<mo>_</mo></munder>`;
      }
      case 'groupchr': {
        const c = val(prop(el, 'groupchrpr', 'chr')) || '⏟'; const pos = val(prop(el, 'groupchrpr', 'pos')) || 'bot';
        return pos === 'top' ? `<mover>${parte('e')}<mo>${esc(c)}</mo></mover>` : `<munder>${parte('e')}<mo>${esc(c)}</mo></munder>`;
      }
      case 'limlow': return `<munder>${parte('e')}${parte('lim')}</munder>`;
      case 'limupp': return `<mover>${parte('e')}${parte('lim')}</mover>`;
      case 'func': return `<mrow>${parte('fname', { ...ctx, func: true })}<mo>\u2061</mo>${parte('e')}</mrow>`;
      case 'eqarr': return `<mtable columnalign="left">${filhos(el).filter(c => norm(nome(c)) === 'e').map(c => `<mtr><mtd>${linha(filhos(c).map(k => conv(k, ctx)).join(''))}</mtd></mtr>`).join('')}</mtable>`;
      case 'm': return `<mrow><mo>(</mo><mtable>${filhos(el).filter(c => norm(nome(c)) === 'mr').map(r => `<mtr>${filhos(r).filter(c => norm(nome(c)) === 'e').map(c => `<mtd>${linha(filhos(c).map(k => conv(k, ctx)).join(''))}</mtd>`).join('')}</mtr>`).join('')}</mtable><mo>)</mo></mrow>`;
      case 'borderbox': return `<menclose notation="box">${parte('e')}</menclose>`;
      case 'phant': return on(prop(el, 'phantpr', 'show')) ? parte('e') : `<mphantom>${parte('e')}</mphantom>`;
      default:
        if (/pr$/.test(n)) return '';
        return linha(kids());
    }
  }
  // Devolve o MathML de um <m:oMath> ou <m:oMathPara>
  function ommlParaMathML(el) {
    const n = norm(nome(el));
    const bloco = n === 'omathpara';
    const corpo = bloco ? filhos(el).filter(c => norm(nome(c)) === 'omath').map(c => linha(filhos(c).map(k => conv(k)).join(''))).join('<mspace linebreak="newline"></mspace>') : linha(filhos(el).map(k => conv(k)).join(''));
    return `<math${bloco ? ' display="block"' : ''}>${corpo}</math>`;
  }

  /* ---------- colagem do Word: equações nos comentários "msEquation" ---------- */
  function prepararHTML(html) {
    if (!html) return html;
    html = html.replace(/<!--\[if gte msEquation 12\]>([\s\S]*?)<!\[endif\]-->/gi, (_, omml) => {
      const fixo = omml.replace(/<(m:\w+)([^<>]*?)\/>/gi, '<$1$2></$1>');
      const d = new DOMParser().parseFromString('<body>' + fixo + '</body>', 'text/html');
      const eq = e => /^m:omath(para)?$/i.test(e.tagName);
      const raizes = Array.from(d.body.querySelectorAll('*')).filter(e => eq(e) && !Array.from(ancestrais(e)).some(eq));
      return raizes.map(ommlParaMathML).join('');
    });
    // a imagem de reserva da equação (file:///…) não serve: sai
    html = html.replace(/<!\[if !msEquation\]>[\s\S]*?<!\[endif\]>/gi, '');
    return html;
  }
  function* ancestrais(e) { let p = e.parentElement; while (p) { yield p; p = p.parentElement; } }

  // Antes da limpeza: Symbol → Unicode e fórmulas da web (KaTeX, MathJax, Wikipédia) só com o MathML
  const isSymbolFont = st => /font-family\s*:\s*["']?symbol\b/i.test(st) || /mso-symbol-font-family\s*:\s*symbol/i.test(st) || /mso-char-type\s*:\s*symbol/i.test(st);
  function prepararDOM(root) {
    root.querySelectorAll('.katex-html,.MathJax_Preview,.MathJax_SVG_Display>.MathJax_SVG,img.mwe-math-fallback-image-inline,img.mwe-math-fallback-image-display,annotation,annotation-xml').forEach(e => e.remove());
    root.querySelectorAll('mjx-container,.MathJax,.MathJax_Display,.MathJax_SVG,.MathJax_CHTML').forEach(c => {
      if (!c.isConnected) return; const m = c.querySelector('math');
      if (m) c.replaceWith(m); else c.remove();
    });
    const tw = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT); const textos = []; let t;
    while ((t = tw.nextNode())) textos.push(t);
    for (const tx of textos) {
      let sym = false;
      for (let p = tx.parentElement; p && p !== root; p = p.parentElement) {
        const st = (p.getAttribute('style') || '') + ';' + (p.getAttribute('face') ? 'font-family:' + p.getAttribute('face') : '');
        if (/(^|;)\s*font-family\s*:/i.test(st) && !isSymbolFont(st)) break;
        if (isSymbolFont(st)) { sym = true; break; }
      }
      tx.nodeValue = sym ? symText(tx.nodeValue) : pua(tx.nodeValue);
    }
  }

  /* ---------- MathML que fica na folha ---------- */
  const TAGS = new Set(['math','mrow','mi','mn','mo','ms','mtext','mspace','msup','msub','msubsup','mfrac','msqrt','mroot','mover','munder','munderover','mmultiscripts','mprescripts','none','mtable','mtr','mtd','mlabeledtr','menclose','mphantom','mpadded','mstyle','merror','semantics','mfenced']);
  const ATTRS = new Set(['display','mathvariant','linethickness','accent','accentunder','stretchy','fence','separator','separators','open','close','notation','columnalign','rowalign','columnspacing','rowspacing','displaystyle','scriptlevel','lspace','rspace','form','largeop','movablelimits','symmetric','width','height','depth','linebreak','columnspan','rowspan']);
  const NS = 'http://www.w3.org/1998/Math/MathML';
  function limparMath(m, doc = document) {
    const copia = (n) => {
      if (n.nodeType === 3) return doc.createTextNode(pua(n.nodeValue));
      if (n.nodeType !== 1) return null;
      const tag = (n.localName || '').toLowerCase().replace(/^m:/, '');
      if (tag === 'annotation' || tag === 'annotation-xml') return null;
      if (tag === 'semantics') { const f = Array.from(n.children)[0]; return f ? copia(f) : null; }
      if (!TAGS.has(tag)) { // algo estranho dentro da fórmula: só o texto
        const r = doc.createElementNS(NS, 'mrow'); for (const c of Array.from(n.childNodes)) { const x = copia(c); if (x) r.appendChild(x); } return r;
      }
      const e = doc.createElementNS(NS, tag === 'mfenced' ? 'mrow' : tag);
      for (const a of Array.from(n.attributes)) if (ATTRS.has(a.name.toLowerCase()) && !/[<>]|javascript:/i.test(a.value)) e.setAttribute(a.name.toLowerCase(), a.value);
      if (tag === 'mfenced') {
        const kids = Array.from(n.children).map(copia).filter(Boolean);
        const sep = (n.getAttribute('separators') ?? ',').trim();
        const mo = (t, k) => { const o = doc.createElementNS(NS, 'mo'); o.setAttribute(k, 'true'); o.textContent = t; return o; };
        e.appendChild(mo(n.getAttribute('open') ?? '(', 'fence'));
        kids.forEach((k, i) => { if (i && sep) e.appendChild(mo(sep[Math.min(i - 1, sep.length - 1)], 'separator')); e.appendChild(k); });
        e.appendChild(mo(n.getAttribute('close') ?? ')', 'fence'));
        return e;
      }
      for (const c of Array.from(n.childNodes)) { const x = copia(c); if (x) e.appendChild(x); }
      return e;
    };
    const r = copia(m);
    // frações no tamanho do texto (miúdas não saem legíveis na impressão)
    if (r && r.localName === 'math' && !r.hasAttribute('displaystyle')) r.setAttribute('displaystyle', 'true');
    return r;
  }

  /* ---------- importar Word: equações e símbolos antes do mammoth ---------- */
  const MARCA = i => `\u27E6SEIMATH${i}\u27E7`;
  async function prepararDocx(arrayBuffer) {
    if (!window.JSZip) return { arrayBuffer, formulas: [] };
    const zip = await JSZip.loadAsync(arrayBuffer);
    const f = zip.file('word/document.xml'); if (!f) return { arrayBuffer, formulas: [] };
    const xml = await f.async('string');
    if (!/<m:oMath|<w:sym|Symbol|[\uF020-\uF0FF]/.test(xml)) return { arrayBuffer, formulas: [] };
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) return { arrayBuffer, formulas: [] };
    const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    const formulas = [];
    const run = txt => { const r = doc.createElementNS(W, 'w:r'); const t = doc.createElementNS(W, 'w:t'); t.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve'); t.textContent = txt; r.appendChild(t); return r; };
    // equações: do maior para dentro (oMathPara primeiro)
    for (const tag of ['oMathPara', 'oMath']) {
      for (const m of Array.from(doc.getElementsByTagNameNS(OMML, tag))) {
        if (!m.isConnected || !m.parentNode) continue;
        const i = formulas.push(ommlParaMathML(m)) - 1;
        const r = run(MARCA(i));
        // oMathPara fica como parágrafo próprio no Word: dentro de w:p já está ok
        m.parentNode.replaceChild(r, m);
      }
    }
    // símbolos inseridos (w:sym) → caractere
    for (const s of Array.from(doc.getElementsByTagNameNS(W, 'sym'))) {
      const font = s.getAttributeNS(W, 'font') || ''; const code = parseInt(s.getAttributeNS(W, 'char') || '0', 16);
      let ch = String.fromCharCode(code >= 0xF000 ? code - 0xF000 : code);
      if (/symbol/i.test(font)) ch = symChar(ch);
      const t = doc.createElementNS(W, 'w:t'); t.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve'); t.textContent = ch;
      s.parentNode.replaceChild(t, s);
    }
    // corridas escritas com a fonte Symbol
    for (const r of Array.from(doc.getElementsByTagNameNS(W, 'r'))) {
      const fonts = r.getElementsByTagNameNS(W, 'rFonts')[0];
      const sym = fonts && /symbol/i.test((fonts.getAttributeNS(W, 'ascii') || '') + (fonts.getAttributeNS(W, 'hAnsi') || '') + (fonts.getAttributeNS(W, 'cs') || ''));
      for (const t of Array.from(r.getElementsByTagNameNS(W, 't'))) t.textContent = sym ? symText(t.textContent) : pua(t.textContent);
      if (sym) fonts.parentNode.removeChild(fonts);
    }
    zip.file('word/document.xml', new XMLSerializer().serializeToString(doc));
    return { arrayBuffer: await zip.generateAsync({ type: 'arraybuffer' }), formulas };
  }
  function devolverFormulas(html, formulas) {
    if (!formulas.length) return html;
    return html.replace(/\u27E6SEIMATH(\d+)\u27E7/g, (_, i) => formulas[+i] || '');
  }

  window.seiFormulas = { prepararHTML, prepararDOM, limparMath, ommlParaMathML, prepararDocx, devolverFormulas, symText };
})();
