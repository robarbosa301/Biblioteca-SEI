/* Montar folha: Salvar aula (pasta do professor), abrir aula salva e começar nova. */
(function () {
  'use strict';
  const A = window.seiAulas, $ = s => document.querySelector(s), esc = A.esc;
  const params = () => new URLSearchParams(location.hash.slice(1));
  let aberta = null; // aula carregada (para "Atualizar esta aula")

  const bar = $('#bar .grp'); if (!bar) return;
  const bSalvar = document.createElement('button'); bSalvar.className = 'b salvar'; bSalvar.id = 'bSalvarAula'; bSalvar.textContent = '💾 Salvar aula';
  const bMinhas = document.createElement('a'); bMinhas.className = 'b'; bMinhas.href = 'aulas.html'; bMinhas.textContent = '📁 Minhas aulas';
  bar.prepend(bSalvar, bMinhas);

  const dlg = document.createElement('dialog'); dlg.id = 'dlgAula'; dlg.className = 'no-print';
  dlg.innerHTML = `<form method="dialog" class="fa">
    <div class="dh">💾 Salvar aula <small>fica guardada na pasta do professor, neste aparelho</small></div>
    <div class="fa-corpo">
      <label>Professor(a)<input id="faProf" list="faProfs" required placeholder="Seu nome"><datalist id="faProfs"></datalist></label>
      <div class="fa-l2"><label>Data da aula<input id="faData" type="date" required></label><label>Tipo<input id="faTipo" placeholder="Aula, Revisão, Atividade…"></label></div>
      <p class="fa-info" id="faInfo"></p>
      <label>Conteúdo / tema da aula<input id="faCont" required placeholder="Ex.: Frações equivalentes"></label>
      <div class="fa-bncc"><b>Habilidades da BNCC trabalhadas</b> <small id="faBnccN"></small>
        <div id="faSel" class="fa-chips"></div>
        <input id="faBusca" type="search" placeholder="Buscar habilidade por código ou palavra (ex.: EF06MA07, fração)">
        <div id="faLista" class="fa-lista"></div>
        <label class="fa-livre">Outra habilidade / objetivo (opcional)<input id="faLivre" placeholder="Ex.: Ler e compreender um diálogo em espanhol"></label>
      </div>
      <label>Diário de aula: o que foi feito e observações<textarea id="faDiario" rows="3" placeholder="Ex.: Correção da atividade 3; turma participativa; retomar exercício 5 na próxima aula."></textarea></label>
    </div>
    <div class="df"><button class="b ghost" value="cancel">Cancelar</button><button class="b" value="atualizar" id="faAtualizar" hidden>Atualizar esta aula</button><button class="b main" value="nova" id="faNova">Salvar aula</button></div>
  </form>`;
  document.body.append(dlg);
  const toast = document.createElement('div'); toast.id = 'faToast'; toast.className = 'no-print'; toast.hidden = true; document.body.append(toast);

  let lista = [], sel = new Set();
  function desenharLista() {
    const q = $('#faBusca').value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    const f = lista.filter(h => !q || (h.codigo + ' ' + h.texto + ' ' + h.tema).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().includes(q)).slice(0, 80);
    $('#faLista').innerHTML = f.length ? f.map(h => `<label class="fa-h"><input type="checkbox" value="${h.codigo}" ${sel.has(h.codigo) ? 'checked' : ''}><span><b>${h.codigo}</b> ${esc(h.texto)}${h.tema ? `<i>${esc(h.tema)}</i>` : ''}</span></label>`).join('') : `<p class="fa-vazio">${lista.length ? 'Nenhuma habilidade encontrada.' : 'A BNCC não traz habilidades específicas para esta disciplina/turma. Use o campo “Outra habilidade”.'}</p>`;
    $('#faSel').innerHTML = [...sel].map(c => `<button type="button" data-c="${c}" title="Tirar">${c} ✕</button>`).join('');
    $('#faBnccN').textContent = sel.size ? `(${sel.size} marcada${sel.size > 1 ? 's' : ''})` : '';
  }
  dlg.addEventListener('change', e => { if (e.target.matches('.fa-h input')) { e.target.checked ? sel.add(e.target.value) : sel.delete(e.target.value); desenharLista(); } });
  dlg.addEventListener('click', e => { const c = e.target.closest('#faSel button'); if (c) { sel.delete(c.dataset.c); desenharLista(); } });
  dlg.addEventListener('input', e => { if (e.target.id === 'faBusca') desenharLista(); });

  async function abrirDialogo() {
    const st = window.seiMontar.estado(), inf = A.info(st.src);
    if (!st.blocks.length && !confirm('A folha está vazia. Salvar mesmo assim?')) return;
    $('#faProfs').innerHTML = A.professores().map(p => `<option value="${esc(p)}">`).join('');
    $('#faProf').value = (aberta && aberta.professor) || A.professorAtual();
    $('#faData').value = (aberta && aberta.data) || A.hoje();
    $('#faTipo').value = (st.identificacao || '').trim();
    $('#faCont').value = (aberta && aberta.conteudo) || st.conteudo || '';
    $('#faDiario').value = (aberta && aberta.diario) || '';
    $('#faLivre').value = (aberta && aberta.livre) || '';
    $('#faInfo').textContent = `${inf.etapa} · ${inf.turma} · ${inf.disciplina}`;
    sel = new Set((aberta && aberta.habilidades) || []);
    $('#faAtualizar').hidden = !aberta; $('#faNova').textContent = aberta ? 'Salvar como nova aula' : 'Salvar aula';
    $('#faBusca').value = ''; lista = []; desenharLista();
    dlg.showModal();
    try { lista = await A.habilidades(st.src); } catch (e) { lista = []; }
    desenharLista();
  }
  bSalvar.onclick = abrirDialogo;

  dlg.addEventListener('close', async () => {
    const acao = dlg.returnValue; if (acao !== 'nova' && acao !== 'atualizar') return;
    const prof = $('#faProf').value.trim(); if (!prof) return;
    A.definirProfessor(prof);
    const st = window.seiMontar.estado(), inf = A.info(st.src);
    const base = acao === 'atualizar' && aberta ? aberta : { id: A.novoId(), criada: Date.now() };
    const aula = Object.assign(base, {
      professor: prof, data: $('#faData').value || A.hoje(), tipo: $('#faTipo').value.trim(), conteudo: $('#faCont').value.trim(),
      habilidades: [...sel], livre: $('#faLivre').value.trim(), diario: $('#faDiario').value.trim(),
      etapa: inf.etapa, turma: inf.turma, disciplina: inf.disciplina, src: st.src,
      folha: { blocks: st.blocks, conteudo: st.conteudo, identificacao: st.identificacao }
    });
    await A.gravar(aula); aberta = aula;
    const p = params(); p.set('aula', aula.id); history.replaceState(null, '', '#' + p.toString());
    mostrarToast(`Aula salva na pasta de <b>${esc(prof)}</b>.`, true);
  });

  function mostrarToast(html, comNova) {
    toast.innerHTML = `<span>✅ ${html}</span>${comNova ? '<button class="b main" id="faNovaFolha">➕ Começar nova aula</button>' : ''}<a class="b" href="aulas.html">📁 Ver minhas aulas</a><button class="b ghost" id="faFechar">✕</button>`;
    toast.hidden = false;
    const nf = $('#faNovaFolha'); if (nf) nf.onclick = () => { window.seiMontar.novaFolha(); aberta = null; const p = params(); p.delete('aula'); history.replaceState(null, '', '#' + p.toString()); toast.hidden = true; };
    $('#faFechar').onclick = () => { toast.hidden = true; };
  }

  // abrir uma aula salva: montar.html#f=...&aula=ID  (a aula salva só muda se você escolher "Atualizar esta aula")
  window.addEventListener('sei-montar-pronto', async () => {
    const id = params().get('aula'); if (!id) return;
    const a = await A.pegar(id); if (!a) return;
    aberta = a; window.seiMontar.carregar(a.folha || {});
    mostrarToast(`Aula de <b>${esc(a.data.split('-').reverse().join('/'))}</b> aberta. Ao salvar, escolha “Salvar como nova aula” para não mexer nesta.`, false);
  });
})();
