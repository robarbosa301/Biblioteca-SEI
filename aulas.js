(function () {
  'use strict';
  const A = window.seiAulas, $ = s => document.querySelector(s), esc = A.esc;
  let todas = [], per = 'mes', ref = new Date(), aba = 'aulas';
  const fmt = d => d.split('-').reverse().join('/');
  const ymd = d => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 10); };
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  function intervalo() {
    const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
    if (per === 'semana') { const ini = new Date(d); ini.setDate(d.getDate() - ((d.getDay() + 6) % 7)); const fim = new Date(ini); fim.setDate(ini.getDate() + 6); return [ymd(ini), ymd(fim), `Semana de ${fmt(ymd(ini))} a ${fmt(ymd(fim))}`]; }
    if (per === 'mes') { const ini = new Date(d.getFullYear(), d.getMonth(), 1), fim = new Date(d.getFullYear(), d.getMonth() + 1, 0); return [ymd(ini), ymd(fim), MESES[d.getMonth()].replace(/^./, c => c.toUpperCase()) + ' de ' + d.getFullYear()]; }
    if (per === 'ano') return [d.getFullYear() + '-01-01', d.getFullYear() + '-12-31', 'Ano de ' + d.getFullYear()];
    return ['0000', '9999', 'Todas as aulas'];
  }
  function mover(n) { if (per === 'semana') ref.setDate(ref.getDate() + 7 * n); else if (per === 'mes') ref.setMonth(ref.getMonth() + n); else if (per === 'ano') ref.setFullYear(ref.getFullYear() + n); desenhar(); }
  const doProf = () => todas.filter(a => a.professor === $('#prof').value);
  function filtradas() {
    const [i, f] = intervalo(), t = $('#fTurma').value, d = $('#fDisc').value;
    return doProf().filter(a => (a.data || '') >= i && (a.data || '') <= f && (!t || a.etapa + ' · ' + a.turma === t) && (!d || a.disciplina === d));
  }
  async function carregar() {
    todas = await A.todas();
    const ps = [...new Set([...A.professores(), ...todas.map(a => a.professor)].filter(Boolean))].sort();
    const atual = A.professorAtual();
    $('#prof').innerHTML = ps.length ? ps.map(p => `<option ${p === atual ? 'selected' : ''}>${esc(p)}</option>`).join('') : '<option value="">(nenhum)</option>';
    opcoes(); desenhar();
  }
  function opcoes() {
    const l = doProf(); const tv = $('#fTurma').value, dv = $('#fDisc').value;
    $('#fTurma').innerHTML = '<option value="">Todas as turmas</option>' + [...new Set(l.map(a => a.etapa + ' · ' + a.turma))].sort().map(x => `<option ${x === tv ? 'selected' : ''}>${esc(x)}</option>`).join('');
    $('#fDisc').innerHTML = '<option value="">Todas as disciplinas</option>' + [...new Set(l.map(a => a.disciplina))].sort().map(x => `<option ${x === dv ? 'selected' : ''}>${esc(x)}</option>`).join('');
  }
  function desenhar() {
    $('#perTxt').textContent = intervalo()[2]; $('#ant').hidden = $('#prox').hidden = per === 'tudo';
    document.querySelectorAll('.periodo button').forEach(b => b.classList.toggle('on', b.dataset.p === per));
    document.querySelectorAll('.abas button').forEach(b => b.classList.toggle('on', b.dataset.aba === aba));
    ['aulas', 'diario', 'painel'].forEach(x => { $('#aba-' + x).hidden = x !== aba; });
    const l = filtradas();
    if (aba === 'aulas') abaAulas(l); else if (aba === 'diario') abaDiario(l); else abaPainel(l);
  }
  const vazio = () => `<div class="vazio"><p>Nenhuma aula neste período.</p><p>Monte uma folha em “Montar folha no site” e toque em <b>💾 Salvar aula</b>.</p><a class="b main" href="index.html">Ir para a Biblioteca</a></div>`;

  function abaAulas(l) {
    if (!l.length) { $('#aba-aulas').innerHTML = vazio(); return; }
    $('#aba-aulas').innerHTML = `<div class="cards">${l.map(a => `<article class="aula">
      <div class="topo"><b>${fmt(a.data)}</b><span class="tag">${esc(a.tipo || 'Aula')}</span></div>
      <h3>${esc(a.disciplina)} <small>${esc(a.etapa)} · ${esc(a.turma)}</small></h3>
      <p class="cont">${esc(a.conteudo || 'Sem conteúdo informado')}</p>
      ${(a.habilidades || []).length ? `<p class="hab">${a.habilidades.map(h => `<span>${h}</span>`).join('')}</p>` : ''}
      <div class="acoes"><a class="b main" href="montar.html#f=${encodeURIComponent(a.src)}&aula=${a.id}">Abrir</a><button class="b" data-dup="${a.id}">Duplicar</button><button class="b ghost" data-del="${a.id}">Excluir</button></div>
    </article>`).join('')}</div>`;
  }
  function abaDiario(l) {
    if (!l.length) { $('#aba-diario').innerHTML = vazio(); return; }
    const linhas = [...l].sort((a, b) => a.data.localeCompare(b.data));
    $('#aba-diario').innerHTML = `<div class="dtopo no-print"><button class="b" onclick="print()">🖨 Imprimir diário</button><button class="b" id="csv">⬇ Planilha (CSV)</button></div>
    <h2 class="so-print">Diário de aula — ${esc($('#prof').value)} — ${esc(intervalo()[2])}</h2>
    <div class="tab"><table><thead><tr><th>Data</th><th>Turma</th><th>Disciplina</th><th>Conteúdo</th><th>BNCC</th><th>O que foi feito / observações</th></tr></thead><tbody>
    ${linhas.map(a => `<tr><td>${fmt(a.data)}</td><td>${esc(a.etapa)}<br>${esc(a.turma)}</td><td>${esc(a.disciplina)}</td><td>${esc(a.conteudo)}${a.livre ? `<br><small>${esc(a.livre)}</small>` : ''}</td><td>${(a.habilidades || []).join('<br>')}</td>
      <td><textarea data-diario="${a.id}" rows="2" aria-label="Observações da aula">${esc(a.diario || '')}</textarea></td></tr>`).join('')}
    </tbody></table></div>`;
    $('#csv').onclick = () => {
      const q = v => '"' + String(v || '').replace(/"/g, '""') + '"';
      const t = 'Data;Etapa;Turma;Disciplina;Tipo;Conteúdo;Habilidades BNCC;Outra habilidade;Diário\n' + linhas.map(a => [fmt(a.data), a.etapa, a.turma, a.disciplina, a.tipo, a.conteudo, (a.habilidades || []).join(' '), a.livre, a.diario].map(q).join(';')).join('\n');
      baixar('﻿' + t, `diario-${$('#prof').value}-${intervalo()[2]}.csv`, 'text/csv');
    };
  }
  async function abaPainel(l) {
    const el = $('#aba-painel');
    if (!l.length) { el.innerHTML = vazio(); return; }
    const conta = (arr, f) => { const m = new Map(); arr.forEach(x => [].concat(f(x)).forEach(k => k && m.set(k, (m.get(k) || 0) + 1))); return [...m].sort((a, b) => b[1] - a[1]); };
    const habs = new Set(l.flatMap(a => a.habilidades || []));
    const porDisc = conta(l, a => a.disciplina), porTurma = conta(l, a => a.etapa + ' · ' + a.turma), porCont = conta(l, a => (a.conteudo || '').trim()).slice(0, 8);
    // aulas ao longo do tempo
    let serie;
    if (per === 'ano' || per === 'tudo') { const m = conta(l, a => a.data.slice(0, 7)); serie = (per === 'ano' ? MESES.map((n, i) => [ref.getFullYear() + '-' + String(i + 1).padStart(2, '0'), n.slice(0, 3)]) : [...new Set(l.map(a => a.data.slice(0, 7)))].sort().map(k => [k, MESES[+k.slice(5) - 1].slice(0, 3) + '/' + k.slice(2, 4)])).map(([k, n]) => [n, (m.find(x => x[0] === k) || [0, 0])[1]]); }
    else { const [i, f] = intervalo(); serie = []; for (let d = new Date(i + 'T12:00'); ymd(d) <= f; d.setDate(d.getDate() + 1)) { const k = ymd(d); serie.push([per === 'semana' ? ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'][d.getDay()] : String(d.getDate()), l.filter(a => a.data === k).length]); } }
    el.innerHTML = `<div class="tiles"><div><b>${l.length}</b><span>aulas</span></div><div><b>${porDisc.length}</b><span>disciplinas</span></div><div><b>${porTurma.length}</b><span>turmas</span></div><div><b>${habs.size}</b><span>habilidades BNCC</span></div></div>
      <div class="graf"><h3>Aulas no período</h3>${colunas(serie)}</div>
      <div class="g2"><div class="graf"><h3>Por disciplina</h3>${barras(porDisc)}</div><div class="graf"><h3>Por turma</h3>${barras(porTurma)}</div></div>
      <div class="graf"><h3>Conteúdos mais trabalhados</h3>${barras(porCont)}</div>
      <div class="graf" id="cobertura"><h3>Cobertura da BNCC — onde focar</h3><p class="dica">Escolha a turma e a disciplina para ver as habilidades já trabalhadas e as que ainda faltam.</p>
        <div class="cob-sel"><select id="cobSel">${conta(doProf(), a => a.src + '|' + a.etapa + ' · ' + a.turma + ' · ' + a.disciplina).map(([k]) => `<option value="${esc(k.split('|')[0])}">${esc(k.split('|')[1])}</option>`).join('')}</select></div><div id="cobOut"></div></div>`;
    const cob = async () => {
      const src = $('#cobSel').value; const todasH = await A.habilidades(src);
      const feitas = new Map(); doProf().filter(a => a.src === src).forEach(a => (a.habilidades || []).forEach(h => feitas.set(h, (feitas.get(h) || 0) + 1)));
      if (!todasH.length) { $('#cobOut').innerHTML = '<p class="dica">A BNCC não traz habilidades específicas para esta disciplina/turma.</p>'; return; }
      const ok = todasH.filter(h => feitas.has(h.codigo)), falta = todasH.filter(h => !feitas.has(h.codigo)), pct = Math.round(ok.length / todasH.length * 100);
      const grupos = new Map(); falta.forEach(h => { const g = h.tema || 'Outras'; grupos.set(g, (grupos.get(g) || []).concat(h)); });
      $('#cobOut').innerHTML = `<div class="prog" role="img" aria-label="${pct}% das habilidades trabalhadas"><div style="width:${pct}%"></div></div>
        <p class="prog-t"><b>${ok.length}</b> de <b>${todasH.length}</b> habilidades trabalhadas (${pct}%) em todas as aulas salvas desta turma e disciplina.</p>
        <details ${falta.length ? 'open' : ''}><summary>⚠️ Ainda não trabalhadas (${falta.length}) — onde focar</summary>${[...grupos].map(([g, hs]) => `<h4>${esc(g)}</h4><ul>${hs.map(h => `<li><b>${h.codigo}</b> ${esc(h.texto)}</li>`).join('')}</ul>`).join('')}</details>
        <details><summary>✅ Já trabalhadas (${ok.length})</summary><ul>${ok.map(h => `<li><b>${h.codigo}</b> <span class="vezes">${feitas.get(h.codigo)}×</span> ${esc(h.texto)}</li>`).join('')}</ul></details>`;
    };
    $('#cobSel').onchange = cob; cob();
  }
  function barras(d) {
    if (!d.length) return '<p class="dica">Sem dados.</p>';
    const mx = Math.max(...d.map(x => x[1]));
    return `<div class="barras">${d.map(([n, v]) => `<div class="br" title="${esc(n)}: ${v} aula${v > 1 ? 's' : ''}"><span class="n">${esc(n)}</span><span class="t"><i style="width:${v / mx * 100}%"></i></span><b>${v}</b></div>`).join('')}</div>`;
  }
  function colunas(d) {
    const mx = Math.max(1, ...d.map(x => x[1]));
    return `<div class="cols" style="grid-template-columns:repeat(${d.length},1fr)">${d.map(([n, v]) => `<div class="cl" title="${esc(n)}: ${v} aula${v === 1 ? '' : 's'}"><span class="v">${v || ''}</span><i style="height:${v / mx * 100}%"></i><span class="n">${esc(n)}</span></div>`).join('')}</div>`;
  }
  function baixar(txt, nome, tipo) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: tipo })); a.download = nome.replace(/[\\/:*?"<>|]/g, '-'); document.body.append(a); a.click(); a.remove(); }

  document.addEventListener('click', async e => {
    const t = e.target;
    if (t.matches('.abas button')) { aba = t.dataset.aba; desenhar(); }
    if (t.matches('.periodo button')) { per = t.dataset.p; ref = new Date(); desenhar(); }
    if (t.dataset.del && confirm('Excluir esta aula? Isso não pode ser desfeito.')) { await A.apagar(t.dataset.del); carregar(); }
    if (t.dataset.dup) { const a = await A.pegar(t.dataset.dup); const c = Object.assign(JSON.parse(JSON.stringify(a)), { id: A.novoId(), criada: Date.now(), data: A.hoje() }); await A.gravar(c); carregar(); }
  });
  document.addEventListener('change', async e => {
    if (e.target.dataset.diario) { const a = await A.pegar(e.target.dataset.diario); a.diario = e.target.value; await A.gravar(a); const x = todas.find(y => y.id === a.id); if (x) x.diario = a.diario; }
  });
  $('#ant').onclick = () => mover(-1); $('#prox').onclick = () => mover(1);
  $('#prof').onchange = () => { A.definirProfessor($('#prof').value); opcoes(); desenhar(); };
  $('#fTurma').onchange = $('#fDisc').onchange = desenhar;
  $('#exp').onclick = async () => baixar(JSON.stringify({ tipo: 'sei-aulas', versao: 1, exportado: new Date().toISOString(), aulas: await A.todas() }), `aulas-sei-${A.hoje()}.json`, 'application/json');
  $('#imp').onchange = async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try { const j = JSON.parse(await f.text()); if (j.tipo !== 'sei-aulas') throw 0; for (const a of j.aulas) { await A.gravar(a); A.definirProfessor(a.professor); } alert(j.aulas.length + ' aulas importadas.'); carregar(); }
    catch (err) { alert('Este arquivo não é uma cópia de aulas da Biblioteca SEI.'); }
  };
  carregar();
})();
