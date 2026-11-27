/* Área das Famílias: cada responsável vê só os próprios filhos (com a nuvem ligada) */
(function () {
  'use strict';
  const D = window.seiDados, $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pd = s => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, m - 1, d); };
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const hoje = () => iso(new Date()), dif = (a, b) => Math.round((pd(b) - pd(a)) / 864e5);
  const SEM = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'], MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const fmtS = s => s ? `${SEM[pd(s).getDay()]}, ${s.slice(8, 10)}/${s.slice(5, 7)}` : '';
  const periodo = it => it.de && it.ate && it.de !== it.ate ? `${fmtS(it.de)} a ${fmtS(it.ate)}` : fmtS(it.ate || it.de);
  const EI = ['Maternal', 'Pré I', 'Pré II'], AVAL = ['1ª Avaliação', '2ª Avaliação', '3ª Avaliação', '4ª Avaliação', 'Recuperação'];
  const LISTA = { 'Maternal': 'maternal', 'Pré I': 'pre-i', 'Pré II': 'pre-ii', '1º ano': '1-ano', '2º ano': '2-ano', '3º ano': '3-ano', '4º ano': '4-ano', '5º ano': '5-ano' };
  const ZAP = '5591981248323';
  let filho = '';

  async function desenhar() {
    const nv = D.nuvem && D.nuvem.ligada, u = nv ? D.nuvem.usuario : null; if (nv && !u) return; // esperando o login
    let alunos = await D.listar('alunos'); if (u && u.perfil === 'familia') alunos = alunos.filter(a => (u.alunos || []).includes(a.id));
    alunos.sort((a, b) => a.nome.localeCompare(b.nome));
    const sel = $('#pa-filho'); $('#pa-filho-l').hidden = alunos.length < 2 && !!nv;
    if (!alunos.find(a => a.id === filho)) filho = alunos[0] ? alunos[0].id : '';
    sel.innerHTML = alunos.map(a => `<option value="${a.id}" ${a.id === filho ? 'selected' : ''}>${esc(a.nome.split(' ').slice(0, 2).join(' '))}</option>`).join(''); sel.onchange = () => { filho = sel.value; desenhar(); };
    if (u) $('#pa-rod').innerHTML = `Conectado como <b>${esc(u.nome || u.email)}</b>. <button class="b" id="pa-sair">Sair</button> · Dúvidas? Secretaria: <a href="https://wa.me/${ZAP}" style="color:#ffd34d;font-weight:700">(91) 9 8124-8323</a>`;
    let x = nv ? '' : '<p class="es-aviso">👀 <b>Prévia neste aparelho.</b> A Área das Famílias abre de verdade quando a nuvem for ligada: cada responsável entra com o próprio e-mail e vê só os filhos dele. Aqui aparecem os alunos cadastrados neste aparelho.</p>';
    const a = alunos.find(z => z.id === filho);
    if (!a) { $('#pa-filho-l').hidden = true; $('#pa').innerHTML = x + (nv ? '<div class="es-vazio"><b>Nenhum aluno ligado a esta conta.</b>Peça à secretaria para conferir o seu e-mail no cadastro do aluno.</div>' : '<div class="es-vazio"><b>Nenhum aluno cadastrado neste aparelho.</b>Cadastre os alunos na <a href="escola.html#cad">Gestão Escolar</a> para ver a prévia.</div>'); return; }
    const [bols, crono, coms] = await Promise.all([D.listar('boletins'), D.listar('cronograma'), D.listar('comunicados')]);
    const ano = hoje().slice(0, 4), b = ((bols.find(z => z.id === a.id) || {}).anos || {})[ano] || {}, ei = EI.includes(a.turma), h = hoje();
    x += `<section class="es-sec"><div class="es-card" style="--c:#e6b422;flex-direction:row;align-items:center;gap:14px"><img src="assets/docs/mascote-sei.png?v=14" alt="" width="64" height="57"><div><h3 style="font-size:19px;color:#0b2a5b">${esc(a.nome)}</h3><p>🏫 ${esc(a.turma || 'Turma a definir')} · Ano letivo ${ano}</p></div></div></section>`;
    // avisos
    const cs = coms.filter(c => !(c.turmas || []).length || c.turmas.includes(a.turma)).filter(c => !c.data || dif(c.data, h) <= 60).sort((p, q) => (q.data || '').localeCompare(p.data || ''));
    x += `<section class="es-sec"><h2>📢 Avisos da escola</h2>${cs.length ? `<div class="es-grid">${cs.map(c => `<article class="es-card" style="--c:#00838f"><span class="chip">${fmtS(c.data)}</span><h3>${esc(c.titulo)}</h3><p style="white-space:pre-line">${esc(c.texto)}</p></article>`).join('')}</div>` : '<p class="es-dica">Nenhum aviso novo.</p>'}</section>`;
    // agenda
    const ag = crono.filter(it => (it.quem || []).includes('familias') && (it.ate || it.de) >= h && dif(h, it.de || it.ate) <= 45).sort((p, q) => (p.de || '').localeCompare(q.de || ''));
    x += `<section class="es-sec"><h2>🗓️ Próximas datas <small>${MESES[new Date().getMonth()]} e as próximas semanas</small></h2>${ag.length ? `<div class="es-grid">${ag.map(it => `<article class="es-card" style="--c:${/Avalia/.test(it.grupo) ? '#1e4fb8' : '#00838f'}"><div class="es-data">🗓️ ${periodo(it)}</div><h3>${/provas/i.test(it.titulo) ? '✏️' : /Reuni/.test(it.titulo) ? '👨‍👩‍👧' : '📌'} ${esc(it.titulo)}</h3>${it.obs ? `<p>${esc(it.obs)}</p>` : ''}</article>`).join('')}</div>` : '<p class="es-dica">Nenhuma data marcada para as próximas semanas.</p>'}<div class="es-acoes" style="margin-top:10px"><a class="b" href="calendario.html">📅 Calendário escolar completo</a></div></section>`;
    // desempenho
    if (ei) { const rel = b.relatorios || {}; const blocos = Object.entries(rel).flatMap(([q, sem]) => Object.entries(sem).filter(([, t]) => t).map(([s, t]) => [q, s, t]));
      x += `<section class="es-sec"><h2>🌱 Desenvolvimento</h2>${blocos.length ? blocos.map(([q, s, t]) => `<article class="es-card" style="--c:#2e7d32;margin-bottom:10px"><span class="chip">${esc(s)} · ${esc(q.replace(' (professora regente)', ''))}</span><p style="white-space:pre-line">${esc(t)}</p></article>`).join('') : '<p class="es-dica">Os relatórios de desenvolvimento aparecem aqui ao fim de cada semestre.</p>'}`; }
    else { const ds = Object.keys(b.notas || {}).sort(); const avs = AVAL.filter(av => ds.some(d => (b.notas[d] || {})[av] !== undefined));
      x += `<section class="es-sec"><h2>📊 Notas e frequência</h2>${ds.length ? `<div style="overflow:auto;background:#fff;border-radius:12px"><table style="min-width:0;font-size:14px"><thead><tr><th style="text-align:left;padding:8px">Disciplina</th>${avs.map(v => `<th style="padding:8px">${v.replace(' Avaliação', '').replace('Recuperação', 'Rec.')}</th>`).join('')}<th style="padding:8px">Faltas</th></tr></thead><tbody>${ds.map(d => `<tr><td style="padding:8px;border-top:1px solid #e3eaf5;font-weight:600">${esc(d)}</td>${avs.map(v => { const n = (b.notas[d] || {})[v]; return `<td style="text-align:center;padding:8px;border-top:1px solid #e3eaf5;${n !== undefined && n < 6 ? 'color:#b3261e;font-weight:800' : ''}">${n ?? '—'}</td>`; }).join('')}<td style="text-align:center;padding:8px;border-top:1px solid #e3eaf5">${(b.faltas || {})[d] ?? 0}</td></tr>`).join('')}</tbody></table></div><p class="es-dica" style="margin-top:6px">Média para aprovação: 6. Notas abaixo disso aparecem em vermelho.</p>` : '<p class="es-dica">As notas aparecem aqui assim que os professores lançarem.</p>'}`; }
    const aulas = Object.values(b.aulas || {}).reduce((s, n) => s + n, 0), faltas = Object.values(b.faltas || {}).reduce((s, n) => s + n, 0);
    if (aulas) x += `<div class="es-num" style="margin-top:12px"><div style="--c:#2e7d32"><b>${Math.round((aulas - faltas) * 100 / aulas)}%</b><span>de frequência</span></div><div style="--c:#1e4fb8"><b>${aulas}</b><span>aulas registradas</span></div><div style="--c:#b3261e"><b>${faltas}</b><span>faltas</span></div></div>`;
    x += '</section>';
    // material e documentos
    const pedir = t => `https://wa.me/${ZAP}?text=${encodeURIComponent(`Olá! Sou responsável por ${a.nome} (${a.turma || ''}). Gostaria de solicitar: ${t}.`)}`;
    x += `<section class="es-sec"><h2>📄 Documentos e material</h2><div class="es-grid">
      ${LISTA[a.turma] ? `<article class="es-card" style="--c:#ef6c00"><h3>🎒 Lista de material 2027</h3><p>Lista do ${esc(a.turma)}. Entrega até 15/01/2027.</p><div class="es-linha"><a class="b main" href="assets/material/2027/lista-material-2027-${LISTA[a.turma]}.pdf" target="_blank" rel="noopener">📄 Abrir</a></div></article>` : ''}
      <article class="es-card" style="--c:#0b2a6b"><h3>📘 ${ei ? 'PPP da Educação Infantil' : 'Regimento Escolar'}</h3><p>${ei ? 'Projeto Político-Pedagógico 2027–2031: como cuidamos e educamos as crianças.' : 'As regras da escola: avaliação, frequência e convivência.'}</p><div class="es-linha"><a class="b main" href="${ei ? 'assets/institucional/ppp-educacao-infantil-2027.pdf?v=3' : 'assets/institucional/regimento-escolar.pdf?v=2'}" target="_blank" rel="noopener">📄 Abrir</a><a class="b" href="institucional.html">Todos</a></div></article>
      <article class="es-card" style="--c:#2e7d32"><h3>📝 Contrato e declarações</h3><p>Peça uma cópia do contrato, declaração de matrícula ou de frequência. A secretaria envia pelo WhatsApp.</p><div class="es-linha"><a class="b es-zap" href="${pedir('cópia do contrato')}" target="_blank" rel="noopener">💬 Contrato</a><a class="b es-zap" href="${pedir('declaração de matrícula')}" target="_blank" rel="noopener">💬 Declaração</a></div></article>
      </div></section>`;
    $('#pa').innerHTML = x;
  }
  document.addEventListener('click', e => { if (e.target.id === 'pa-sair' && D.nuvem) D.nuvem.sair(); });
  document.addEventListener('sei-nuvem', desenhar);
  D.ouvir(() => desenhar());
  desenhar();
})();
