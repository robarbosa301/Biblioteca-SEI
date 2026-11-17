/* Avaliações: 4 avaliações e 2 recuperações no ano.
   - Montar folha: botão "📝 Avaliação" põe o quadro da prova (valor, nota, instruções, assinatura)
     no início da folha e troca o cabeçalho para AVALIAÇÃO 01, RECUPERAÇÃO 01…
   - Biblioteca: "↓ Word — Avaliação" baixa o modelo de questões já como prova. */
(function () {
  'use strict';
  const TIPOS = ['1ª Avaliação', '2ª Avaliação', '3ª Avaliação', '4ª Avaliação', '1ª Recuperação', '2ª Recuperação'];
  const INSTR = 'Leia com atenção cada questão antes de responder. Use caneta azul ou preta. Questões rasuradas não serão consideradas. Boa prova!';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ident = t => { const m = /^(\d)ª\s+(\S+)/.exec(t || ''); return m ? { palavra: m[2], numero: '0' + m[1] } : null; };
  const valorTxt = v => { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? '' : n.toFixed(1).replace('.', ',') + ' ponto' + (n === 1 ? '' : 's'); };

  /* ---------- Montar folha ---------- */
  function blocoProva(o) {
    const t = document.createElement('table'); t.className = 'prova-cab';
    t.innerHTML = `<tbody><tr><td><b>${esc(o.tipo.toUpperCase())}</b>${o.disciplina ? ' — ' + esc(o.disciplina) : ''}</td><td><b>Valor:</b> ${esc(valorTxt(o.valor))}</td><td><b>Nota:</b></td></tr>`
      + (o.instrucoes ? `<tr><td colspan="3"><b>Instruções:</b> ${esc(o.instrucoes)}</td></tr>` : '')
      + (o.assinatura ? `<tr><td colspan="3"><b>Assinatura do responsável:</b></td></tr>` : '') + '</tbody>';
    return t;
  }
  function montar() {
    const bar = document.querySelector('#bar .grp'); if (!bar || !window.seiMontar) return;
    const b = document.createElement('button'); b.className = 'b'; b.id = 'bAvaliacao'; b.textContent = '📝 Avaliação';
    b.title = 'Transformar esta folha em prova: 1ª a 4ª Avaliação ou 1ª/2ª Recuperação';
    bar.insertBefore(b, document.getElementById('bTexto'));
    const dlg = document.createElement('dialog'); dlg.id = 'dlgAval'; dlg.className = 'no-print';
    dlg.innerHTML = `<form method="dialog" class="fa">
      <div class="dh">📝 Folha de avaliação <small>4 avaliações e 2 recuperações no ano</small></div>
      <div class="fa-corpo">
        <label>Qual avaliação?<select id="avTipo">${TIPOS.map(t => `<option>${t}</option>`).join('')}</select></label>
        <label>Valor da prova (pontos)<input id="avValor" inputmode="decimal" value="10"></label>
        <label>Instruções para o aluno<textarea id="avInstr" rows="3"></textarea></label>
        <label class="fa-livre" style="flex-direction:row;align-items:center;gap:8px"><input type="checkbox" id="avAss" checked> Linha para assinatura do responsável</label>
        <p class="fa-info">O quadro da prova vai para o início da folha e o cabeçalho passa a mostrar, por exemplo, “AVALIAÇÃO 01”. Dá para editar o quadro depois, como qualquer texto.</p>
      </div>
      <div class="df"><button class="b ghost" value="tirar" id="avTirar">Voltar a ser aula</button><button class="b ghost" value="cancel">Cancelar</button><button class="b main" value="ok">Aplicar</button></div>
    </form>`;
    document.body.append(dlg);
    const achar = () => window.seiMontar.blocks.find(x => /class="prova-cab"|<b>Valor:<\/b>/.test(x.html));
    b.onclick = () => {
      const st = window.seiMontar.estado();
      document.getElementById('avTipo').value = TIPOS.includes(st.avaliacao) ? st.avaliacao : TIPOS[0];
      const ia = document.getElementById('avInstr'); if (!ia.value) ia.value = INSTR;
      document.getElementById('avTirar').hidden = !st.avaliacao;
      dlg.showModal();
    };
    dlg.addEventListener('close', () => {
      const r = dlg.returnValue, M = window.seiMontar, st = M.estado();
      const velho = achar();
      if (r === 'tirar') {
        if (velho) M.removerBloco(velho.id);
        M.definir({ avaliacao: '', identificacao: /fundamental-/.test(st.src) ? 'Atividades 01' : 'Revisão 01' });
        return;
      }
      if (r !== 'ok') return;
      const tipo = document.getElementById('avTipo').value, id = ident(tipo);
      const disc = window.seiAulas ? window.seiAulas.info(st.src).disciplina : '';
      if (velho) M.removerBloco(velho.id);
      M.inserirNoInicio([blocoProva({ tipo, disciplina: disc, valor: document.getElementById('avValor').value, instrucoes: document.getElementById('avInstr').value.trim(), assinatura: document.getElementById('avAss').checked })]);
      M.definir({ avaliacao: tipo, identificacao: id.palavra + ' ' + id.numero });
    });
  }

  /* ---------- Word: modelo de questões vira prova ---------- */
  const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const xe = s => esc(s).replace(/'/g, '&apos;');
  function run(txt, bold, cor) {
    return `<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>${bold ? '<w:b/>' : ''}${cor ? `<w:color w:val="${cor}"/>` : ''}<w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:t xml:space="preserve">${xe(txt)}</w:t></w:r>`;
  }
  function celula(conteudo, span, w) {
    return `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="pct"/>${span > 1 ? `<w:gridSpan w:val="${span}"/>` : ''}<w:vAlign w:val="center"/></w:tcPr><w:p><w:pPr><w:spacing w:before="40" w:after="40"/></w:pPr>${conteudo}</w:p></w:tc>`;
  }
  function tabelaProva(o, cor) {
    const borda = `w:val="single" w:sz="6" w:space="0" w:color="${cor}"`;
    let x = `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top ${borda}/><w:left ${borda}/><w:bottom ${borda}/><w:right ${borda}/><w:insideH ${borda}/><w:insideV ${borda}/></w:tblBorders><w:tblCellMar><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar><w:tblLook w:val="0000"/></w:tblPr><w:tblGrid><w:gridCol w:w="2600"/><w:gridCol w:w="1400"/><w:gridCol w:w="1000"/></w:tblGrid>`;
    x += `<w:tr>${celula(run(o.tipo.toUpperCase(), true, cor) + run(o.disciplina ? ' — ' + o.disciplina : ''), 1, 2600)}${celula(run('Valor: ', true) + run(valorTxt(o.valor)), 1, 1400)}${celula(run('Nota:', true), 1, 1000)}</w:tr>`;
    if (o.instrucoes) x += `<w:tr>${celula(run('Instruções: ', true) + run(o.instrucoes), 3, 5000)}</w:tr>`;
    if (o.assinatura) x += `<w:tr>${celula(run('Assinatura do responsável:', true), 3, 5000)}</w:tr>`;
    return x + '</w:tbl><w:p><w:pPr><w:spacing w:before="0" w:after="60"/></w:pPr></w:p>';
  }
  async function wordProva(zip, o) {
    const f = zip.file('word/document.xml'); let xml = await f.async('string');
    const id = ident(o.tipo);
    const troca = (tag, txt) => { xml = xml.replace(new RegExp(`(<w:tag w:val="${tag}"/>[\\s\\S]*?<w:sdtContent>[\\s\\S]*?<w:t[^>]*>)[^<]*(</w:t>)`), (m, a, b) => a + xe(txt) + b); };
    if (id) {
      troca('sei-tipo', id.palavra); troca('sei-numero', id.numero);
      // palavra longa (RECUPERAÇÃO): letra menor para caber na caixa
      if (id.palavra.length > 9) xml = xml.replace(/<w:sdt>(?:(?!<\/w:sdt>)[\s\S])*?<w:tag w:val="sei-tipo"\/>[\s\S]*?<\/w:sdt>/, m => m.replace(/<w:sz w:val="25"\/><w:szCs w:val="25"\/>/g, '<w:sz w:val="19"/><w:szCs w:val="19"/>'));
    }
    const fill = (o.cor || '#0B2A5B').replace('#', '').toUpperCase();
    xml = xml.replace('<w:body>', '<w:body>' + tabelaProva(o, fill));
    zip.file('word/document.xml', xml);
  }
  // botão da página da disciplina
  function botaoWord(urlDocx, nomeBase, disciplina, cor) {
    const w = document.createElement('button'); w.className = 'blank-word'; w.textContent = '↓ Word — Avaliação';
    w.title = 'Modelo de questões já como prova: 1ª a 4ª Avaliação ou 1ª/2ª Recuperação';
    w.onclick = async () => {
      let d = document.getElementById('dlgAvalWord');
      if (!d) {
        d = document.createElement('dialog'); d.id = 'dlgAvalWord';
        d.innerHTML = `<form method="dialog" class="av-word"><h3>📝 Word — Avaliação</h3>
          <label>Qual avaliação?<select id="avwTipo">${TIPOS.map(t => `<option>${t}</option>`).join('')}</select></label>
          <label>Valor (pontos)<input id="avwValor" inputmode="decimal" value="10"></label>
          <label class="linha"><input type="checkbox" id="avwAss" checked> Assinatura do responsável</label>
          <div class="av-bt"><button value="cancel">Cancelar</button><button value="ok" class="ok">Baixar</button></div></form>`;
        document.body.append(d);
      }
      d.returnValue = ''; d.showModal();
      await new Promise(r => d.addEventListener('close', r, { once: true }));
      if (d.returnValue !== 'ok') return;
      const o = { tipo: d.querySelector('#avwTipo').value, valor: d.querySelector('#avwValor').value, instrucoes: INSTR, assinatura: d.querySelector('#avwAss').checked, disciplina, cor };
      w.disabled = true; const txt = w.innerHTML;
      try {
        const zip = await JSZip.loadAsync(await (await fetch(urlDocx)).arrayBuffer());
        await wordProva(zip, o);
        const pb = window.seiWordPB && seiWordPB.ativo(); if (pb) await seiWordPB.clarear(zip);
        const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', compression: 'DEFLATE' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = (nomeBase + ' - ' + o.tipo + (pb ? ' (preto e branco)' : '') + '.docx').replace(/[\/:*?"<>|]/g, '-');
        document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      } catch (e) { alert('Não consegui montar a avaliação: ' + e.message); }
      w.disabled = false; w.innerHTML = txt;
    };
    return w;
  }

  window.seiAvaliacao = { TIPOS, botaoWord, wordProva, blocoProva };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar); else montar();
})();
