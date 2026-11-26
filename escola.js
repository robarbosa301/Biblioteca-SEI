/* Gestão Escolar: painel "Hoje", cronograma com prazos automáticos e cadastro de alunos e funcionários */
(function () {
  'use strict';
  const D = window.seiDados, $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- tabelas fixas ---------- */
  const ETAPAS = { ei: ['Educação Infantil', ['Maternal', 'Pré I', 'Pré II']], f1: ['Fundamental I', ['1º ano', '2º ano', '3º ano', '4º ano', '5º ano']], f2: ['Fundamental II', ['6º ano', '7º ano', '8º ano', '9º ano']],
    em: ['Ensino Médio', ['1ª série (Médio)', '2ª série (Médio)']], cv: ['Convênio', ['3ª série (Convênio)']], pv: ['Pré-vestibular', ['Pré-vestibular']] };
  const TURMAS = Object.values(ETAPAS).flatMap(e => e[1]);
  const etapaDe = t => Object.keys(ETAPAS).find(k => ETAPAS[k][1].includes(t)) || '';
  const PERFIS = { direcao: '⭐ Direção', secretaria: '🗂️ Secretaria', coordenacao: '🧩 Coordenação', professor: '👩‍🏫 Professores', aee: '🤝 AEE', financeiro: '💰 Financeiro', familias: '👨‍👩‍👧 Famílias' };
  const FUNCOES = [['Direção', 'direcao'], ['Secretaria', 'secretaria'], ['Coordenação pedagógica', 'coordenacao'], ['Professor(a)', 'professor'], ['AEE', 'aee'], ['Financeiro', 'financeiro'], ['Apoio / serviços gerais', 'apoio']];
  const GRUPOS = ['1ª Avaliação', '2ª Avaliação', '3ª Avaliação', '4ª Avaliação', 'Recuperação', 'Planejamento', 'Reunião', 'Conselho de Classe', 'Matrícula', 'Evento', 'Outra'];
  const COR = { '1ª Avaliação': '#1e4fb8', '2ª Avaliação': '#2e7d32', '3ª Avaliação': '#ef6c00', '4ª Avaliação': '#6a1b9a', 'Recuperação': '#c62828', 'Planejamento': '#6d4c41', 'Reunião': '#00838f', 'Conselho de Classe': '#ad1457', 'Matrícula': '#0b2a6b', 'Evento': '#00acc1', 'Outra': '#5a6f8e' };
  const ETAPA_AV = { questoes: '📝', prontas: '🖨️', provas: '✏️', notas: '📊' };

  /* ---------- datas ---------- */
  const pd = s => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, m - 1, d); };
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const soma = (s, n) => { const d = pd(s); d.setDate(d.getDate() + n); return iso(d); };
  const util = s => { const d = pd(s), w = d.getDay(); if (w === 6) d.setDate(d.getDate() - 1); if (w === 0) d.setDate(d.getDate() - 2); return iso(d); }; // prazo no fim de semana -> sexta antes
  const utilDepois = s => { const d = pd(s), w = d.getDay(); if (w === 6) d.setDate(d.getDate() + 2); if (w === 0) d.setDate(d.getDate() + 1); return iso(d); };
  const hoje = () => iso(new Date());
  const dif = (a, b) => Math.round((pd(b) - pd(a)) / 864e5);
  const SEM = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'], MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const fmt = s => s ? s.slice(8, 10) + '/' + s.slice(5, 7) : '';
  const fmtS = s => s ? SEM[pd(s).getDay()] + ', ' + fmt(s) : '';
  const periodo = it => it.de && it.ate && it.de !== it.ate ? `${fmtS(it.de)} a ${fmtS(it.ate)}` : fmtS(it.ate || it.de);
  const falta = n => n === 0 ? 'termina hoje' : n === 1 ? 'falta 1 dia' : n > 0 ? `faltam ${n} dias` : n === -1 ? 'venceu ontem' : `venceu há ${-n} dias`;

  /* ---------- estado ---------- */
  let comunicados = [], emEntregas = null, aba = 'hoje', sub = 'alunos', pessoas = [], alunos = [], crono = [], filtroG = '', busca = '', editando = null;
  const anoAtual = () => { const d = new Date(); return String(d.getMonth() >= 9 ? d.getFullYear() + 1 : d.getFullYear()); };
  let ano = anoAtual();
  const eu = () => D.usuario();
  const gestor = () => ['direcao', 'secretaria', 'coordenacao'].includes(eu().perfil);
  async function carregar() { [pessoas, alunos, crono, boletins, notasDocs, freqDocs, comunicados] = await Promise.all(['pessoas', 'alunos', 'cronograma', 'boletins', 'notas', 'frequencia', 'comunicados'].map(c => D.listar(c))); pessoas.sort((a, b) => a.nome.localeCompare(b.nome)); alunos.sort((a, b) => a.nome.localeCompare(b.nome)); }

  /* ---------- regras do cronograma ---------- */
  const profsDe = it => pessoas.filter(p => p.ativo !== false && p.perfil === 'professor' && (!(it.etapas || []).length || !(p.etapas || []).length || p.etapas.some(e => it.etapas.includes(e))));
  const entregue = (it, p) => !!(it.entregas || {})[p.id];
  function estado(it) {
    const h = hoje(), de = it.de || it.ate, ate = it.ate || it.de; if (!ate) return ['futuro', 'sem data'];
    if (it.controle) { const ps = profsDe(it), ok = ps.filter(p => entregue(it, p)).length; if (ps.length && ok === ps.length) return ['ok', '✅ todos entregaram']; }
    else if (it.feito) return ['ok', '✅ concluído'];
    if (h < de) { const n = dif(h, de); return [n <= 7 ? 'breve' : 'futuro', n <= 7 ? `⏳ começa em ${n} dia${n > 1 ? 's' : ''}` : `começa ${fmt(de)}`]; }
    if (h <= ate) return ['aberto', '🟢 ' + falta(dif(h, ate))];
    return it.controle ? ['atrasado', '🔴 ' + falta(dif(h, ate))] : ['encerrado', 'encerrado'];
  }
  const meu = (it, u) => u.perfil === 'direcao' || (it.quem || []).includes(u.perfil) || (it.cobra || []).includes(u.perfil);
  const telZap = t => { let n = String(t || '').replace(/\D/g, ''); if (!n) return ''; if (n.length <= 11) n = '55' + n; return n; };
  const zap = (p, it) => { const n = telZap(p.whatsapp); if (!n) return ''; const msg = `Olá, ${p.nome.split(' ')[0]}! 😊 Lembrete do SEI: “${it.titulo}” vai até ${fmtS(it.ate)} (${falta(dif(hoje(), it.ate))}). Pode nos enviar? Obrigado(a)!`; return `https://wa.me/${n}?text=${encodeURIComponent(msg)}`; };

  // gera as etapas de uma avaliação a partir da semana de provas
  function etapasAvaliacao(g, de, ate, etapas, extras) {
    const q2 = util(soma(de, -15)), q1 = utilDepois(soma(q2, -6)), pr = util(soma(de, -3)), n2 = util(soma(ate, 7)), base = { ano, grupo: g, etapas };
    const l = [
      { ...base, etapa: 'questoes', titulo: `Entrega das questões — ${g}`, de: q1, ate: q2, quem: ['professor'], cobra: ['secretaria', 'coordenacao'], controle: true, obs: 'Professores enviam as questões das provas à secretaria.' },
      { ...base, etapa: 'prontas', titulo: `Provas prontas — ${g}`, de: utilDepois(soma(q2, 1)), ate: pr, quem: ['secretaria', 'coordenacao'], cobra: ['direcao'], obs: 'Revisão, montagem e impressão das provas.' },
      { ...base, etapa: 'provas', titulo: `Semana de provas — ${g}`, de, ate, quem: ['professor', 'secretaria', 'coordenacao', 'familias'], cobra: [] },
      { ...base, etapa: 'notas', titulo: `Entrega das notas — ${g}`, de: utilDepois(soma(ate, 1)), ate: n2, quem: ['professor'], cobra: ['secretaria'], controle: true, obs: 'Professores lançam e entregam as notas.' }];
    if (extras.conselho) l.push({ ...base, etapa: 'outra', grupo: 'Conselho de Classe', titulo: `Conselho de Classe — ${g}`, de: utilDepois(soma(n2, 3)), ate: utilDepois(soma(n2, 3)), quem: ['direcao', 'coordenacao', 'professor'], cobra: [] });
    if (extras.reuniao) l.push({ ...base, etapa: 'outra', grupo: 'Reunião', titulo: `Reunião de pais — resultados da ${g}`, de: utilDepois(soma(n2, 7)), ate: utilDepois(soma(n2, 7)), quem: ['coordenacao', 'secretaria', 'familias'], cobra: ['direcao'] });
    return l;
  }
  // semanas de provas sugeridas: do calendário pedagógico deste aparelho, se houver
  function calendarios() { return new Promise(ok => { try { const r = indexedDB.open('sei-docs', 1); r.onupgradeneeded = () => r.result.createObjectStore('docs', { keyPath: 'id' }); r.onsuccess = () => { const t = r.result.transaction('docs').objectStore('docs').getAll(); t.onsuccess = () => ok((t.result || []).filter(d => d.tipo === 'calendario')); t.onerror = () => ok([]); }; r.onerror = () => ok([]); } catch (e) { ok([]); } }); }
  const ultimaSemana = fim => { let f = util(fim); const d = pd(f); d.setDate(d.getDate() - (d.getDay() - 1)); return [iso(d), f]; }; // segunda a sexta da última semana
  async function sugestaoProvas(a) {
    const cal = (await calendarios()).filter(c => c.ano === a).sort((x, y) => (y.atualizado || 0) - (x.atualizado || 0))[0]; const s = [null, null, null, null];
    if (cal) {
      (cal.eventos || []).filter(e => e.tipo === 'Avaliação' && e.de).forEach(e => { const m = /([1-4])\s*ª/.exec(e.desc || ''); if (!m) return; const i = +m[1] - 1, f = e.ate || e.de; s[i] = s[i] ? [s[i][0] < e.de ? s[i][0] : e.de, s[i][1] > f ? s[i][1] : f] : [e.de, f]; });
      const bim = cal.divisoes && cal.divisoes.bim; for (let i = 0; i < 4; i++) if (!s[i] && bim && bim[i] && bim[i][1]) s[i] = ultimaSemana(bim[i][1]);
      if (s.some(x => !x) && cal.inicio && cal.fim) { const t = dif(cal.inicio, cal.fim); for (let i = 0; i < 4; i++) if (!s[i]) s[i] = ultimaSemana(soma(cal.inicio, Math.round(t * (i + 1) / 4))); }
      return { s, de: 'calendário pedagógico de ' + a };
    }
    const pad = [`${a}-04-24`, `${a}-06-26`, `${a}-09-25`, `${a}-11-27`]; return { s: pad.map(ultimaSemana), de: '' };
  }

  /* ---------- quem está usando ---------- */
  function montaVerComo() {
    const u = eu(), sel = $('#vercomo'); if (D.nuvem && D.nuvem.usuario) { sel.innerHTML = `<option>${esc(u.nome || u.email)}</option>`; sel.disabled = true; return; }
    const ops = [['direcao', 'Direção'], ['secretaria', 'Secretaria'], ['coordenacao', 'Coordenação'], ['aee', 'AEE'], ['financeiro', 'Financeiro']].map(([p, n]) => `<option value="${p}|" ${u.perfil === p ? 'selected' : ''}>Ver como: ${n}</option>`)
      .concat(pessoas.filter(p => p.perfil === 'professor' && p.ativo !== false).map(p => `<option value="professor|${p.id}" ${u.pessoaId === p.id ? 'selected' : ''}>Prof. ${esc(p.nome)}</option>`));
    sel.innerHTML = ops.join(''); sel.onchange = () => { const [perfil, id] = sel.value.split('|'); const p = pessoas.find(x => x.id === id); D.verComo({ perfil, pessoaId: id || '', nome: p ? p.nome : sel.selectedOptions[0].textContent.replace('Ver como: ', '') }); };
  }

  /* ---------- HOJE ---------- */
  function cardHoje(it, u) {
    const [cl, txt] = estado(it), c = COR[it.grupo] || '#1a73e8'; let corpo = '';
    if (it.controle) {
      const ps = profsDe(it), ok = ps.filter(p => entregue(it, p));
      if (u.perfil === 'professor') { const p = pessoas.find(x => x.id === u.pessoaId); if (p) corpo = entregue(it, p) ? `<p>✅ Você já entregou. Obrigado!</p>` : (cl === 'atrasado' ? `<p>⚠️ <b>O prazo venceu em ${fmtS(it.ate)}.</b> Envie à secretaria o quanto antes.</p>` : cl === 'breve' ? `<p>⏳ O período de entrega começa em <b>${fmtS(it.de)}</b> e vai até <b>${fmtS(it.ate)}</b>.</p>` : `<p>📢 <b>Está no período de entrega.</b> Envie à secretaria até <b>${fmtS(it.ate)}</b>.</p>`) + `<div class="es-linha"><button class="b main" data-entreguei="${it.id}">✅ Já entreguei</button></div>`; }
      else {
        corpo = `<div class="es-barra"><i style="width:${ps.length ? Math.round(ok.length * 100 / ps.length) : 0}%"></i></div><p><b>${ok.length} de ${ps.length}</b> professores entregaram.</p>`;
        const pend = ps.filter(p => !entregue(it, p));
        if (pend.length && (it.cobra || []).concat(['direcao']).includes(u.perfil)) corpo += `<ul class="es-pend">${pend.map(p => `<li><b>⏳ ${esc(p.nome)}</b>${zap(p, it) ? `<a class="b es-zap" href="${zap(p, it)}" target="_blank" rel="noopener">💬 Cobrar</a>` : '<span class="chip">sem WhatsApp</span>'}<button class="b" data-recebi="${it.id}|${p.id}">✔ Recebido</button></li>`).join('')}</ul>`;
        if (!ps.length) corpo += '<p class="es-dica">Cadastre os professores (aba Cadastro) para acompanhar as entregas.</p>';
      }
    } else if (it.obs) corpo = `<p>${esc(it.obs)}</p>`;
    return `<article class="es-card" style="--c:${c}"><div class="es-linha"><span class="chip ${cl}">${txt}</span><span class="chip">${esc(it.grupo)}</span></div><h3>${ETAPA_AV[it.etapa] || '📌'} ${esc(it.titulo)}</h3><div class="es-data">🗓️ ${periodo(it)}</div>${corpo}</article>`;
  }
  function telaHoje() {
    const u = eu(), h = hoje(), meus = crono.filter(it => meu(it, u));
    const agora = meus.filter(it => { const [cl] = estado(it); if (cl === 'aberto' || cl === 'breve') return true; if (cl === 'atrasado') return u.perfil !== 'professor' || !entregue(it, { id: u.pessoaId }); return false; }).sort((a, b) => (a.ate || '').localeCompare(b.ate || ''));
    const prox = meus.filter(it => (it.de || it.ate) > h && dif(h, it.de || it.ate) > 7 && dif(h, it.de || it.ate) <= 45).sort((a, b) => (a.de || '').localeCompare(b.de || ''));
    let x = `<section class="es-sec"><h2>📌 Hoje, ${fmtS(h)} <small>${esc(u.nome || '')}</small></h2>`;
    if (!crono.length) x += `<div class="es-vazio"><b>Ainda não há cronograma.</b>Monte o cronograma do ano na aba 🗓️ Cronograma: o site calcula sozinho os prazos de questões, provas prontas e notas.<br><br><button class="b main" data-ir="crono">🗓️ Montar o cronograma</button></div>`;
    else if (!agora.length) x += `<div class="es-vazio"><b>🎉 Nada pendente para você agora.</b>Os próximos prazos aparecem abaixo.</div>`;
    else {
      const atras = agora.filter(it => estado(it)[0] === 'atrasado').length, abertos = agora.filter(it => estado(it)[0] === 'aberto').length;
      x += `<div class="es-num"><div style="--c:#2e7d32"><b>${abertos}</b><span>prazos abertos</span></div><div style="--c:#8a5a00"><b>${agora.length - abertos - atras}</b><span>começam nesta semana</span></div><div style="--c:#b3261e"><b>${atras}</b><span>atrasados</span></div></div>`;
      x += `<div class="es-grid">${agora.map(it => cardHoje(it, u)).join('')}</div>`;
    }
    x += '</section>';
    if (gestor()) { const cs = comunicados.slice().sort((a, b) => (b.data || '').localeCompare(a.data || '')).slice(0, 6);
      x += `<section class="es-sec"><h2>📢 Comunicados para as famílias</h2><div class="es-acoes"><button class="b main" id="es-novocom">➕ Novo comunicado</button></div>${cs.length ? `<div class="es-grid">${cs.map(c => `<article class="es-card" style="--c:#00838f"><div class="es-linha"><span class="chip">${fmtS(c.data)}</span><span class="chip">${(c.turmas || []).length ? esc(c.turmas.join(', ')) : 'Todas as turmas'}</span></div><h3>${esc(c.titulo)}</h3><p>${esc(c.texto).slice(0, 180)}${(c.texto || '').length > 180 ? '…' : ''}</p><div class="es-linha"><button class="b" data-edcom="${c.id}">✏️ Editar</button><button class="b" data-delcom="${c.id}">🗑️</button></div></article>`).join('')}</div>` : '<p class="es-dica">Os comunicados aparecem na Área das Famílias de cada aluno.</p>'}</section>`; }
    if (prox.length) x += `<section class="es-sec"><h2>🔭 Próximas semanas</h2><div class="es-grid">${prox.slice(0, 9).map(it => `<article class="es-card" style="--c:${COR[it.grupo] || '#1a73e8'}"><div class="es-linha"><span class="chip">${esc(it.grupo)}</span></div><h3>${ETAPA_AV[it.etapa] || '📌'} ${esc(it.titulo)}</h3><div class="es-data">🗓️ ${periodo(it)}</div></article>`).join('')}</div></section>`;
    return x;
  }

  function telaCom(c) {
    c = c || { titulo: '', texto: '', turmas: [], data: hoje() };
    $('#es').innerHTML = `<form class="es-form" id="es-fcom"><h3>📢 ${c.id ? 'Editar' : 'Novo'} comunicado para as famílias</h3>
      <div class="es-g2"><label>Título<input name="titulo" required value="${esc(c.titulo)}" placeholder="Ex.: Reunião de pais — 1ª Avaliação"></label><label>Data<input type="date" name="data" value="${c.data}"></label></div>
      <label>Mensagem<textarea name="texto" required style="min-height:140px">${esc(c.texto)}</textarea></label>
      <div><b>Para quais turmas</b> <small>(nenhuma marcada = todas)</small><div class="es-marcas">${TURMAS.map(t => `<label><input type="checkbox" name="t" value="${t}" ${(c.turmas || []).includes(t) ? 'checked' : ''}> ${t}</label>`).join('')}</div></div>
      <div class="es-acoes"><button class="b main">📢 Publicar para as famílias</button><button type="button" class="b" data-ir="hoje">Cancelar</button></div></form>`;
    $('#es-fcom').onsubmit = async e => { e.preventDefault(); const f = new FormData(e.target); Object.assign(c, { titulo: f.get('titulo').trim(), texto: f.get('texto').trim(), data: f.get('data') || hoje(), turmas: f.getAll('t') }); await D.salvar('comunicados', c); aba = 'hoje'; desenhar(); };
  }

  /* ---------- CRONOGRAMA ---------- */
  function telaCrono() {
    const l = crono.filter(it => it.ano === ano && (!filtroG || it.grupo === filtroG)).sort((a, b) => (a.de || a.ate || '').localeCompare(b.de || b.ate || ''));
    const anos = [...new Set(crono.map(it => it.ano).concat([ano, anoAtual()]))].sort();
    let x = `<section class="es-sec"><h2>🗓️ Cronograma de atividades <select id="es-ano" class="es-busca" style="flex:0 0 auto;min-width:96px;font-size:15px">${anos.map(a => `<option ${a === ano ? 'selected' : ''}>${a}</option>`).join('')}</select></h2>
      ${gestor() ? '' : '<p class="es-dica">Só a direção, a secretaria e a coordenação mudam o cronograma.</p>'}<div class="es-acoes">${gestor() ? `<button class="b main" id="es-gerar">⚙️ ${crono.some(it => it.ano === ano && /Avaliação/.test(it.grupo)) ? 'Refazer prazos das avaliações' : 'Montar as 4 avaliações'}</button><button class="b" id="es-nova">➕ Nova atividade</button>` : ''}${l.length ? '<button class="b" id="es-pdf">📄 PDF para o mural</button><button class="b" id="es-word">⬇ Word</button>' : ''}</div>
      <div class="es-sub">${['', ...GRUPOS].filter(g => !g || crono.some(it => it.ano === ano && it.grupo === g)).map(g => `<button data-fg="${g}" class="${g === filtroG ? 'on' : ''}">${g || 'Tudo'}</button>`).join('')}</div>`;
    if (!l.length) x += `<div class="es-vazio"><b>Cronograma de ${ano} vazio.</b>Toque em <b>⚙️ Montar as 4 avaliações</b>: informe as semanas de provas e o site calcula os prazos de entrega das questões (15 dias antes), provas prontas (3 dias antes) e notas (7 dias depois).</div>`;
    let mes = '';
    x += l.map(it => { const m = (it.de || it.ate || '').slice(0, 7), [cl, txt] = estado(it); let cab = ''; if (m !== mes) { mes = m; cab = `${m ? `</div><div class="es-mes">${MESES[+m.slice(5) - 1]}</div><div class="es-grid">` : ''}`; }
      const ps = it.controle ? profsDe(it) : [], ok = ps.filter(p => entregue(it, p)).length;
      return cab + `<article class="es-card" style="--c:${COR[it.grupo] || '#1a73e8'}"><div class="es-linha"><span class="chip ${cl}">${txt}</span><span class="chip">${esc(it.grupo)}</span></div><h3>${ETAPA_AV[it.etapa] || '📌'} ${esc(it.titulo)}</h3><div class="es-data">🗓️ ${periodo(it)}</div>
        <p>👥 ${(it.quem || []).map(q => PERFIS[q] || q).join(' · ') || '—'}${(it.cobra || []).length ? `<br>📣 Acompanha: ${it.cobra.map(q => PERFIS[q] || q).join(' · ')}` : ''}</p>${it.controle ? `<div class="es-barra"><i style="width:${ps.length ? Math.round(ok * 100 / ps.length) : 0}%"></i></div><p>${ok} de ${ps.length} entregaram</p>` : ''}
        ${gestor() ? `<div class="es-linha"><button class="b" data-ed="${it.id}">✏️ Editar</button>${it.controle ? `<button class="b" data-acomp="${it.id}">📋 Entregas</button>` : `<button class="b" data-feito="${it.id}">${it.feito ? '↩ Reabrir' : '✅ Concluído'}</button>`}<button class="b" data-del="${it.id}" title="Apagar">🗑️</button></div>` : ''}</article>`; }).join('').replace(/^<\/div>/, '') + (l.length ? '</div>' : '');
    return x + '</section>';
  }
  async function telaGerar() {
    const { s, de } = await sugestaoProvas(ano), atuais = crono.filter(it => it.ano === ano && it.etapa === 'provas');
    const val = i => { const a = atuais.find(it => it.grupo === `${i + 1}ª Avaliação`); return a ? [a.de, a.ate] : s[i] || ['', '']; };
    $('#es').innerHTML = `<form class="es-form" id="es-fg"><h3>⚙️ Avaliações de ${ano}</h3>
      <p class="es-dica">Informe a <b>semana de provas</b> de cada avaliação${de ? ` (já preenchida pelo <b>${esc(de)}</b>)` : ' (sugestão: última semana de cada bimestre — confira)'}. O site calcula:<br>📝 <b>entrega das questões</b>: 1 semana, terminando 15 dias antes · 🖨️ <b>provas prontas</b>: 3 dias antes · 📊 <b>notas</b>: até 7 dias depois. Prazos que caem no fim de semana passam para a sexta-feira.</p>
      ${[0, 1, 2, 3].map(i => `<div class="es-av"><b>${i + 1}ª Avaliação</b><label>Provas de<input type="date" name="de${i}" value="${val(i)[0]}"></label><label>até<input type="date" name="ate${i}" value="${val(i)[1]}"></label></div>`).join('')}
      <div><b>Etapas que fazem prova</b><div class="es-marcas">${Object.entries(ETAPAS).filter(([k]) => k !== 'ei').map(([k, e]) => `<label><input type="checkbox" name="et" value="${k}" ${k !== 'pv' ? 'checked' : ''}> ${e[0]}</label>`).join('')}</div></div>
      <div><b>Incluir também</b><div class="es-marcas"><label><input type="checkbox" name="conselho" checked> Conselho de Classe (3 dias após as notas)</label><label><input type="checkbox" name="reuniao" checked> Reunião de pais (1 semana após as notas)</label></div></div>
      ${atuais.length ? '<p class="es-aviso">As etapas das avaliações já existentes serão refeitas com as novas datas. As entregas já marcadas são mantidas.</p>' : ''}
      <div class="es-acoes"><button class="b main">✅ Calcular e salvar</button><button type="button" class="b" data-ir="crono">Cancelar</button></div></form>`;
    $('#es-fg').onsubmit = async e => { e.preventDefault(); const f = new FormData(e.target), et = f.getAll('et'), extras = { conselho: f.get('conselho'), reuniao: f.get('reuniao') };
      const novos = []; for (let i = 0; i < 4; i++) { const d = f.get('de' + i), a = f.get('ate' + i) || d; if (d) novos.push(...etapasAvaliacao(`${i + 1}ª Avaliação`, d, a, et, extras)); }
      if (!novos.length) return alert('Informe pelo menos uma semana de provas.');
      const velhos = crono.filter(it => it.ano === ano && it.gerado);
      for (const n of novos) { const v = velhos.find(o => o.titulo === n.titulo); n.gerado = true; if (v) { n.id = v.id; n.entregas = v.entregas || {}; n.feito = v.feito; } await D.salvar('cronograma', n); }
      for (const v of velhos) if (!novos.some(n => n.id === v.id)) await D.apagar('cronograma', v.id);
      aba = 'crono'; await desenhar(); };
  }
  function telaItem(it) {
    it = it || { ano, grupo: 'Evento', titulo: '', de: '', ate: '', quem: [], cobra: [], etapas: [] };
    const marcas = (n, sel) => `<div class="es-marcas">${Object.entries(PERFIS).map(([k, v]) => `<label><input type="checkbox" name="${n}" value="${k}" ${(sel || []).includes(k) ? 'checked' : ''}> ${v}</label>`).join('')}</div>`;
    $('#es').innerHTML = `<form class="es-form" id="es-fi"><h3>${it.id ? '✏️ Editar atividade' : '➕ Nova atividade'}</h3>
      <label>O que é<input name="titulo" required value="${esc(it.titulo)}" placeholder="Ex.: Entrega dos planejamentos do 2º bimestre"></label>
      <div class="es-g3"><label>Tipo<select name="grupo">${GRUPOS.map(g => `<option ${g === it.grupo ? 'selected' : ''}>${g}</option>`).join('')}</select></label><label>De<input type="date" name="de" value="${it.de || ''}"></label><label>Até (prazo)<input type="date" name="ate" value="${it.ate || ''}"></label></div>
      <div><b>Quem faz / quem é avisado</b>${marcas('quem', it.quem)}</div>
      <div><b>Quem acompanha e cobra</b>${marcas('cobra', it.cobra)}</div>
      <label class="es-marcas" style="flex-direction:row"><input type="checkbox" name="controle" ${it.controle ? 'checked' : ''} style="width:auto"> Cada professor precisa entregar (o site mostra quem já entregou e quem falta)</label>
      <div><b>Etapas envolvidas</b> <small>(em branco = todas)</small><div class="es-marcas">${Object.entries(ETAPAS).map(([k, e]) => `<label><input type="checkbox" name="et" value="${k}" ${(it.etapas || []).includes(k) ? 'checked' : ''}> ${e[0]}</label>`).join('')}</div></div>
      <label>Observação<textarea name="obs" placeholder="Detalhes, local, o que entregar…">${esc(it.obs || '')}</textarea></label>
      <div class="es-acoes"><button class="b main">💾 Salvar</button><button type="button" class="b" data-ir="crono">Cancelar</button></div></form>`;
    $('#es-fi').onsubmit = async e => { e.preventDefault(); const f = new FormData(e.target);
      Object.assign(it, { titulo: f.get('titulo').trim(), grupo: f.get('grupo'), de: f.get('de') || f.get('ate'), ate: f.get('ate') || f.get('de'), quem: f.getAll('quem'), cobra: f.getAll('cobra'), controle: !!f.get('controle'), etapas: f.getAll('et'), obs: f.get('obs').trim() });
      if (!it.ate) return alert('Informe a data.'); if (it.de > it.ate) [it.de, it.ate] = [it.ate, it.de]; it.ano = it.ate.slice(0, 4);
      await D.salvar('cronograma', it); aba = 'crono'; await desenhar(); };
  }
  function telaEntregas(it) {
    const ps = profsDe(it); emEntregas = it.id;
    $('#es').innerHTML = `<section class="es-sec"><h2>📋 ${esc(it.titulo)} <small>${periodo(it)}</small></h2><div class="es-acoes"><button class="b" data-ir="${aba}">‹ Voltar</button></div>
      ${ps.length ? `<ul class="es-pend">${ps.map(p => { const ok = (it.entregas || {})[p.id]; return `<li class="${ok ? 'feito' : ''}"><b>${ok ? '✅' : '⏳'} ${esc(p.nome)}</b>${ok ? `<span class="chip ok">entregue ${fmt(ok.em)}${ok.por ? ' · ' + esc(ok.por) : ''}</span><button class="b" data-desf="${it.id}|${p.id}">↩ Desfazer</button>` : `${zap(p, it) ? `<a class="b es-zap" href="${zap(p, it)}" target="_blank" rel="noopener">💬 Cobrar</a>` : ''}<button class="b" data-recebi="${it.id}|${p.id}">✔ Recebido</button>`}</li>`; }).join('')}</ul>` : '<div class="es-vazio"><b>Nenhum professor cadastrado para estas etapas.</b>Cadastre na aba 👥 Cadastro → Funcionários.</div>'}</section>`;
  }
  async function marcar(id, pid, on) { const it = crono.find(x => x.id === id); if (!it) return; it.entregas = it.entregas || {}; if (on) it.entregas[pid] = { em: hoje(), por: eu().nome || '' }; else delete it.entregas[pid]; await D.salvar('cronograma', it); }

  // documento para o mural (PDF / Word com a arte da escola)
  function docCrono() {
    const l = crono.filter(it => it.ano === ano).sort((a, b) => (a.de || a.ate).localeCompare(b.de || b.ate)), av = [1, 2, 3, 4].map(i => `${i}ª Avaliação`).filter(g => l.some(it => it.grupo === g && it.gerado));
    const NOMES = { questoes: ['📝', 'Entrega das questões'], prontas: ['🖨️', 'Provas prontas'], provas: ['✏️', 'Semana de provas'], notas: ['📊', 'Entrega das notas'] };
    let h = `<p style="font-size:10pt;color:#24324f;margin:0 0 6px">Prazos de ${ano} para professores, secretaria, coordenação e direção. Prazos que caem no fim de semana já foram passados para a sexta-feira.</p>`;
    for (const g of av) { const c = COR[g];
      h += `<table width="100%" style="border-collapse:collapse;table-layout:fixed;width:100%;margin:8px 0 4px"><tr><td style="background:${c};padding:5px 10px"><b style="font-size:12pt;color:#ffffff">${g}</b></td></tr></table><table width="100%" style="border-collapse:collapse;table-layout:fixed;width:100%"><tr>` +
        ['questoes', 'prontas', 'provas', 'notas'].map((e, k) => { const it = l.find(x => x.grupo === g && x.etapa === e); return `${k ? '<td width="1.5%"></td>' : ''}<td width="23.8%" data-fill="#F3F6FC" style="background:#f3f6fc;padding:6px 8px;vertical-align:top"><p style="font-size:9.5pt;color:${c};font-weight:bold;margin:0">${NOMES[e][0]} ${NOMES[e][1]}</p><p style="font-size:9pt;color:#0b2a6b;font-weight:bold;margin:2px 0 0">${it ? periodo(it) : '—'}</p></td>`; }).join('') + '</tr></table>';
    }
    const outras = l.filter(it => !(it.gerado && ['questoes', 'prontas', 'provas', 'notas'].includes(it.etapa)));
    if (outras.length) { h += `<table width="100%" style="border-collapse:collapse;table-layout:fixed;width:100%;margin:12px 0 4px"><tr><td style="background:#0b2a6b;padding:5px 10px"><b style="font-size:12pt;color:#ffffff">Outras atividades</b></td></tr></table>`;
      h += '<table width="100%" style="border-collapse:collapse;table-layout:fixed;width:100%">' + outras.map((it, i) => `<tr><td width="4%" style="background:${COR[it.grupo] || '#5a6f8e'}"></td><td width="20%" data-fill="${i % 2 ? '#FFFFFF' : '#F3F6FC'}" style="background:${i % 2 ? '#fff' : '#f3f6fc'};padding:4px 8px"><p style="font-size:9pt;color:#0b2a6b;font-weight:bold;margin:0">${periodo(it)}</p></td><td width="76%" data-fill="${i % 2 ? '#FFFFFF' : '#F3F6FC'}" style="background:${i % 2 ? '#fff' : '#f3f6fc'};padding:4px 8px"><p style="font-size:9pt;color:#24324f;margin:0"><b>${esc(it.titulo)}</b>${(it.quem || []).length ? ' — ' + it.quem.map(q => (PERFIS[q] || q).replace(/^\S+ /, '')).join(', ') : ''}</p></td></tr>`).join('') + '</table>'; }
    return h;
  }
  async function exportar(tipo) {
    const F = await window.seiFolha.compor({ estilo: 'folha', titulo: 'Cronograma de Atividades', curto: `Cronograma de Atividades ${ano}`, placa: { grande: ano, linhas: ['CRONOGRAMA', 'DE ATIVIDADES'] },
      campos: [['Documento', 'Cronograma de atividades'], ['Ano letivo', ano], ['Para', 'Professores e equipe'], ['Emitido por', 'Direção']], selo: ['COD. INEP', '15590798'], rodape: ['Direção', 'Sistema de Ensino Incentivo'], num: 'SEI' });
    const html = `<img class="folha-cab" src="${F.cab}" alt="">` + docCrono();
    if (tipo === 'pdf') await window.seiBaixar.pdf(html, `Cronograma de Atividades ${ano}`, F); else await window.seiBaixar.word(html, `Cronograma de Atividades ${ano}`, '', F);
  }

  /* ---------- CADASTRO ---------- */
  function telaCad() {
    const q = busca.trim().toLowerCase(); let x = `<section class="es-sec"><div class="es-sub"><button data-sub="alunos" class="${sub === 'alunos' ? 'on' : ''}">🎒 Alunos (${alunos.length})</button><button data-sub="func" class="${sub === 'func' ? 'on' : ''}">👩‍🏫 Funcionários (${pessoas.length})</button></div>
      <div class="es-acoes"><input class="es-busca" id="es-busca" type="search" placeholder="🔎 Procurar pelo nome" value="${esc(busca)}">${!gestor() ? '' : sub === 'alunos' ? '<button class="b main" id="es-novoal">➕ Novo aluno</button><button class="b" id="es-colar">📋 Colar lista de nomes</button>' : '<button class="b main" id="es-novofu">➕ Novo funcionário</button><button class="b" id="es-trazer">↧ Trazer professores do Horário</button>'}</div>`;
    if (sub === 'alunos') {
      const l = alunos.filter(a => !q || a.nome.toLowerCase().includes(q));
      if (!alunos.length) x += '<div class="es-vazio"><b>Nenhum aluno cadastrado.</b>Cadastre um por um ou use <b>📋 Colar lista de nomes</b> para lançar a turma inteira de uma vez.</div>';
      for (const t of TURMAS.concat([''])) { const lt = l.filter(a => (a.turma || '') === t); if (!lt.length) continue;
        x += `<div class="es-turma">${t ? esc(t) : 'Sem turma'} <span>${lt.length} aluno${lt.length > 1 ? 's' : ''}</span></div><div class="es-grid">` + lt.map(a => { const r = a.responsaveis || [];
          return `<article class="es-card" style="--c:#1e4fb8"><h3>${esc(a.nome)}</h3><div class="es-linha">${a.aee ? '<span class="chip">🤝 AEE</span>' : ''}${a.situacao && a.situacao !== 'Ativo' ? `<span class="chip atrasado">${esc(a.situacao)}</span>` : ''}${r.some(x => x.acesso && x.email) ? '<span class="chip ok">👨‍👩‍👧 acesso dos pais</span>' : ''}</div>${r.filter(x => x.nome).map(x => `<p>👤 ${esc(x.nome)}${x.parentesco ? ` (${esc(x.parentesco)})` : ''}${x.whatsapp ? ` · 📱 ${esc(x.whatsapp)}` : ''}</p>`).join('')}${gestor() ? `<div class="es-linha"><button class="b" data-edal="${a.id}">✏️ Editar</button></div>` : ''}</article>`; }).join('') + '</div>'; }
    } else {
      const l = pessoas.filter(p => !q || p.nome.toLowerCase().includes(q));
      if (!pessoas.length) x += '<div class="es-vazio"><b>Nenhum funcionário cadastrado.</b>Cadastre a equipe com a função e o WhatsApp: é com ele que a secretaria cobra os prazos em um toque. Se os professores já estão no Horário de aula, use <b>↧ Trazer professores do Horário</b>.</div>';
      for (const [fn, pf] of FUNCOES) { const lf = l.filter(p => p.perfil === pf); if (!lf.length) continue;
        x += `<div class="es-turma">${esc(fn)} <span>${lf.length}</span></div><div class="es-grid">` + lf.map(p => `<article class="es-card" style="--c:#2e7d32"><h3>${esc(p.nome)}</h3><div class="es-linha">${p.ativo === false ? '<span class="chip atrasado">inativo</span>' : ''}${(p.etapas || []).map(e => `<span class="chip">${esc(ETAPAS[e] ? ETAPAS[e][0] : e)}</span>`).join('')}</div>${(p.disciplinas || []).length ? `<p>📚 ${esc(p.disciplinas.join(', '))}</p>` : ''}${p.whatsapp ? `<p>📱 ${esc(p.whatsapp)}</p>` : ''}${gestor() ? `<div class="es-linha"><button class="b" data-edfu="${p.id}">✏️ Editar</button></div>` : ''}</article>`).join('') + '</div>'; }
    }
    return x + '</section>';
  }
  function telaAluno(a) {
    a = a || { nome: '', turma: '', situacao: 'Ativo', responsaveis: [{}, {}] }; const r = (a.responsaveis || []).concat([{}, {}]).slice(0, 2);
    $('#es').innerHTML = `<form class="es-form" id="es-fa"><h3>${a.id ? '✏️ Editar aluno' : '➕ Novo aluno'}</h3>
      <label>Nome completo<input name="nome" required value="${esc(a.nome)}"></label>
      <div class="es-g3"><label>Turma<select name="turma"><option value="">—</option>${TURMAS.map(t => `<option ${t === a.turma ? 'selected' : ''}>${t}</option>`).join('')}</select></label><label>Nascimento<input type="date" name="nasc" value="${a.nasc || ''}"></label><label>Situação<select name="situacao">${['Ativo', 'Transferido', 'Desistente', 'Concluiu'].map(s => `<option ${s === a.situacao ? 'selected' : ''}>${s}</option>`).join('')}</select></label></div>
      <label class="es-marcas" style="flex-direction:row"><input type="checkbox" name="aee" ${a.aee ? 'checked' : ''} style="width:auto"> Atendido(a) pelo AEE</label>
      ${r.map((x, i) => `<div class="es-resp"><b>👤 Responsável ${i + 1}</b><div class="es-g2"><label>Nome<input name="rn${i}" value="${esc(x.nome || '')}"></label><label>Parentesco<input name="rp${i}" value="${esc(x.parentesco || '')}" placeholder="Mãe, pai, avó…"></label><label>WhatsApp<input name="rw${i}" inputmode="tel" value="${esc(x.whatsapp || '')}" placeholder="(91) 9 0000-0000"></label><label>E-mail (para o acesso dos pais)<input name="re${i}" type="email" value="${esc(x.email || '')}"></label></div><label class="es-marcas" style="flex-direction:row"><input type="checkbox" name="ra${i}" ${x.acesso ? 'checked' : ''} style="width:auto"> Acesso à área dos pais liberado</label></div>`).join('')}
      <label>Observações<textarea name="obs">${esc(a.obs || '')}</textarea></label>
      <div class="es-acoes"><button class="b main">💾 Salvar</button><button type="button" class="b" data-ir="cad">Cancelar</button>${a.id ? `<button type="button" class="b" data-delal="${a.id}">🗑️ Apagar</button>` : ''}</div></form>`;
    $('#es-fa').onsubmit = async e => { e.preventDefault(); const f = new FormData(e.target);
      Object.assign(a, { nome: f.get('nome').trim(), turma: f.get('turma'), nasc: f.get('nasc'), situacao: f.get('situacao'), aee: !!f.get('aee'), obs: f.get('obs').trim(),
        responsaveis: [0, 1].map(i => ({ nome: f.get('rn' + i).trim(), parentesco: f.get('rp' + i).trim(), whatsapp: f.get('rw' + i).trim(), email: f.get('re' + i).trim().toLowerCase(), acesso: !!f.get('ra' + i) })).filter(x => x.nome || x.email || x.whatsapp) });
      a.etapa = etapaDe(a.turma); await D.salvar('alunos', a); aba = 'cad'; sub = 'alunos'; await desenhar(); };
  }
  function telaColar() {
    $('#es').innerHTML = `<form class="es-form" id="es-fc"><h3>📋 Colar lista de nomes</h3><p class="es-dica">Um nome por linha. Nomes que já estão cadastrados na mesma turma são ignorados.</p>
      <label>Turma<select name="turma" required><option value="">Escolha…</option>${TURMAS.map(t => `<option>${t}</option>`).join('')}</select></label><label>Nomes<textarea name="nomes" style="min-height:200px" required></textarea></label>
      <div class="es-acoes"><button class="b main">💾 Cadastrar</button><button type="button" class="b" data-ir="cad">Cancelar</button></div></form>`;
    $('#es-fc').onsubmit = async e => { e.preventDefault(); const f = new FormData(e.target), t = f.get('turma'); const ja = new Set(alunos.filter(a => a.turma === t).map(a => a.nome.toLowerCase())); let n = 0;
      for (const nome of f.get('nomes').split(/\r?\n/).map(s => s.replace(/^\s*\d+[\s.)-]*/, '').trim()).filter(Boolean)) { if (ja.has(nome.toLowerCase())) continue; ja.add(nome.toLowerCase()); await D.salvar('alunos', { nome, turma: t, etapa: etapaDe(t), situacao: 'Ativo', responsaveis: [] }); n++; }
      alert(n + ' aluno(s) cadastrado(s) no ' + t + '.'); aba = 'cad'; sub = 'alunos'; await desenhar(); };
  }
  function telaFunc(p) {
    p = p || { nome: '', perfil: 'professor', etapas: [], disciplinas: [], ativo: true };
    $('#es').innerHTML = `<form class="es-form" id="es-ff"><h3>${p.id ? '✏️ Editar funcionário' : '➕ Novo funcionário'}</h3>
      <div class="es-g2"><label>Nome completo<input name="nome" required value="${esc(p.nome)}"></label><label>Função<select name="perfil">${FUNCOES.map(([n, k]) => `<option value="${k}" ${k === p.perfil ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label>WhatsApp<input name="whatsapp" inputmode="tel" value="${esc(p.whatsapp || '')}" placeholder="(91) 9 0000-0000"></label><label>E-mail (Gmail, para o login)<input name="email" type="email" value="${esc(p.email || '')}"></label></div>
      <div><b>Etapas em que atua</b><div class="es-marcas">${Object.entries(ETAPAS).map(([k, e]) => `<label><input type="checkbox" name="et" value="${k}" ${(p.etapas || []).includes(k) ? 'checked' : ''}> ${e[0]}</label>`).join('')}</div></div>
      <label>Disciplinas (separe por vírgula)<input name="disc" value="${esc((p.disciplinas || []).join(', '))}" placeholder="Matemática, Física"></label>
      <label class="es-marcas" style="flex-direction:row"><input type="checkbox" name="ativo" ${p.ativo !== false ? 'checked' : ''} style="width:auto"> Ativo(a) na escola</label>
      <div class="es-acoes"><button class="b main">💾 Salvar</button><button type="button" class="b" data-ir="cad">Cancelar</button>${p.id ? `<button type="button" class="b" data-delfu="${p.id}">🗑️ Apagar</button>` : ''}</div></form>`;
    $('#es-ff').onsubmit = async e => { e.preventDefault(); const f = new FormData(e.target);
      Object.assign(p, { nome: f.get('nome').trim(), perfil: f.get('perfil'), whatsapp: f.get('whatsapp').trim(), email: f.get('email').trim().toLowerCase(), etapas: f.getAll('et'), disciplinas: f.get('disc').split(',').map(s => s.trim()).filter(Boolean), ativo: !!f.get('ativo') });
      await D.salvar('pessoas', p); aba = 'cad'; sub = 'func'; await desenhar(); };
  }
  async function trazerHorario() {
    const docs = await new Promise(ok => { try { const r = indexedDB.open('sei-docs', 1); r.onupgradeneeded = () => r.result.createObjectStore('docs', { keyPath: 'id' }); r.onsuccess = () => { const t = r.result.transaction('docs').objectStore('docs').getAll(); t.onsuccess = () => ok(t.result || []); }; r.onerror = () => ok([]); } catch (e) { ok([]); } });
    const ja = new Set(pessoas.map(p => p.nome.toLowerCase())); let n = 0;
    for (const d of docs.filter(d => d.tipo === 'professor' && d.nome)) { if (ja.has(d.nome.toLowerCase())) continue; await D.salvar('pessoas', { nome: d.nome, perfil: 'professor', etapas: (d.etapas || []).filter(k => ETAPAS[k]), disciplinas: d.disciplinas || [], ativo: true }); n++; }
    alert(n ? n + ' professor(es) trazido(s) do Horário de aula. Complete o WhatsApp de cada um.' : 'Nenhum professor novo encontrado no Horário de aula deste aparelho.'); await desenhar();
  }

  /* ---------- DIÁRIO: notas, frequência e relatórios ---------- */
  const DISC_PAD = ['Língua Portuguesa', 'Matemática', 'Ciências', 'História', 'Geografia', 'Inglês', 'Arte', 'Educação Física', 'Estudos Amazônicos', 'Redação', 'Literatura', 'Biologia', 'Física', 'Química', 'Filosofia', 'Sociologia', 'Ensino Religioso'];
  const AVAL = ['1ª Avaliação', '2ª Avaliação', '3ª Avaliação', '4ª Avaliação', 'Recuperação'], SEMESTRES = ['1º semestre', '2º semestre'];
  let dTurma = '', dDisc = '', dModo = 'notas', dAv = '1ª Avaliação', dData = '', boletins = [], notasDocs = [], freqDocs = [];
  const anoD = () => hoje().slice(0, 4); // diário: sempre o ano letivo em curso
  const minhaPessoa = () => pessoas.find(p => p.id === eu().pessoaId);
  function turmasMinhas() { const p = eu().perfil === 'professor' ? minhaPessoa() : null; return p && (p.etapas || []).length ? TURMAS.filter(t => p.etapas.includes(etapaDe(t))) : TURMAS; }
  function discsMinhas() { const p = eu().perfil === 'professor' ? minhaPessoa() : null; if (p && (p.disciplinas || []).length) return p.disciplinas; const l = [...new Set(pessoas.flatMap(x => x.disciplinas || []).concat(DISC_PAD))]; return l; }
  const daTurma = t => alunos.filter(a => a.turma === t && (a.situacao || 'Ativo') === 'Ativo');
  const idNota = () => `${anoD()}|${dTurma}|${dDisc}|${dAv}`, idFreq = () => `${dTurma}|${dDisc}|${dData}`;
  function telaDiario() {
    if (!gestor() && dModo === 'bol') dModo = 'notas'; const ts = turmasMinhas(); if (!ts.includes(dTurma)) dTurma = ''; const ei = etapaDe(dTurma) === 'ei'; if (ei && dModo === 'notas') dModo = 'rel'; if (!ei && dModo === 'rel') dModo = 'notas';
    if (!dData) dData = hoje(); const ds0 = discsMinhas(), ds = ei ? ['Turma (professora regente)'].concat(ds0.filter(d => /Física|Inglês|Arte/.test(d))) : ds0; if (dDisc && !ds.includes(dDisc)) dDisc = '';
    let x = `<section class="es-sec"><h2>📒 Diário <small>${esc(eu().nome || '')}</small></h2>
      <div class="es-g3" style="margin-bottom:12px"><label class="es-form" style="padding:8px">Turma<select id="d-turma"><option value="">Escolha…</option>${ts.map(t => `<option ${t === dTurma ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
      ${dModo === 'bol' ? '' : `<label class="es-form" style="padding:8px">${ei ? 'Campo / professor(a)' : 'Disciplina'}<select id="d-disc"><option value="">Escolha…</option>${ds.map(d => `<option ${d === dDisc ? 'selected' : ''}>${esc(d)}</option>`).join('')}</select></label>`}</div>
      <div class="es-sub">${(ei ? [['rel', '📝 Relatório'], ['freq', '✅ Frequência']] : [['notas', '📊 Notas'], ['freq', '✅ Frequência']]).concat(gestor() ? [['bol', '📋 Boletim da turma']] : []).map(([k, v]) => `<button data-dmodo="${k}" class="${k === dModo ? 'on' : ''}">${v}</button>`).join('')}</div>`;
    if (!dTurma || (!dDisc && dModo !== 'bol')) return x + `<div class="es-vazio"><b>Escolha a turma${dModo === 'bol' ? '' : ' e a disciplina'}.</b>${alunos.length ? '' : 'Antes, cadastre os alunos na aba 👥 Cadastro.'}</div></section>`;
    const al = daTurma(dTurma); if (!al.length) return x + '<div class="es-vazio"><b>Nenhum aluno ativo nesta turma.</b>Cadastre os alunos na aba 👥 Cadastro.</div></section>';
    if (dModo === 'notas') { const doc = notasDocs.find(n => n.id === idNota()) || { valores: {} };
      x += `<form class="es-form" id="d-fn"><div class="es-linha"><b>Avaliação</b> <select id="d-av" style="width:auto">${AVAL.map(a => `<option ${a === dAv ? 'selected' : ''}>${a}</option>`).join('')}</select>${doc.por ? `<span class="chip ok">salvo por ${esc(doc.por)}</span>` : ''}</div>
        <ul class="es-pend">${al.map((a, i) => `<li><b>${i + 1}. ${esc(a.nome)}</b><input name="n_${a.id}" inputmode="decimal" style="width:90px" placeholder="0 a 10" value="${doc.valores[a.id] ?? ''}"></li>`).join('')}</ul>
        <div class="es-acoes"><button class="b main">💾 Salvar notas</button></div></form>`; }
    else if (dModo === 'freq') { const doc = freqDocs.find(f => f.id === idFreq()) || { faltas: [] }; const dias = freqDocs.filter(f => f.turma === dTurma && f.disciplina === dDisc).length;
      x += `<form class="es-form" id="d-ff"><div class="es-linha"><b>Dia da aula</b> <input type="date" id="d-data" value="${dData}" style="width:auto"><span class="chip">${dias} aula${dias === 1 ? '' : 's'} registrada${dias === 1 ? '' : 's'}</span>${doc.por ? `<span class="chip ok">salvo por ${esc(doc.por)}</span>` : ''}</div>
        <p class="es-dica">Todos começam <b>presentes</b>. Toque em quem <b>faltou</b>.</p>
        <ul class="es-pend">${al.map((a, i) => `<li><b>${i + 1}. ${esc(a.nome)}</b><label class="es-marcas" style="flex-direction:row;font-weight:700"><input type="checkbox" name="f_${a.id}" ${doc.faltas.includes(a.id) ? 'checked' : ''} style="width:22px;height:22px"> Faltou</label></li>`).join('')}</ul>
        <div class="es-acoes"><button class="b main">💾 Salvar frequência</button></div></form>`; }
    else if (dModo === 'rel') { const sem = dAv.includes('semestre') ? dAv : SEMESTRES[0];
      x += `<form class="es-form" id="d-fr"><div class="es-linha"><b>Período</b> <select id="d-sem" style="width:auto">${SEMESTRES.map(s => `<option ${s === sem ? 'selected' : ''}>${s}</option>`).join('')}</select></div><p class="es-dica">Relatório descritivo de cada criança (aparece para a família). Escreva como a criança está se desenvolvendo, o que conquistou e o que vamos estimular.</p>
        ${al.map(a => { const b = boletins.find(x => x.id === a.id), t = (((b || {}).anos || {})[anoD()] || {}).relatorios || {}; return `<label>${esc(a.nome)}<textarea name="r_${a.id}">${esc((t[dDisc] || {})[sem] || '')}</textarea></label>`; }).join('')}
        <div class="es-acoes"><button class="b main">💾 Salvar relatórios</button></div></form>`; }
    else { const dsT = [...new Set(boletins.flatMap(b => Object.keys((((b.anos || {})[anoD()] || {}).notas) || {})))].sort();
      x += `<div class="es-linha" style="margin-bottom:8px"><b>Avaliação</b> <select id="d-av" class="es-busca" style="flex:0 0 auto">${AVAL.map(a => `<option ${a === dAv ? 'selected' : ''}>${a}</option>`).join('')}</select></div>`;
      x += dsT.length ? `<div style="overflow:auto;background:#fff;border-radius:12px"><table style="min-width:0;font-size:14px"><thead><tr><th style="text-align:left;padding:6px">Aluno</th>${dsT.map(d => `<th style="padding:6px">${esc(d)}</th>`).join('')}<th style="padding:6px">Faltas</th></tr></thead><tbody>${al.map(a => { const b = (((boletins.find(x => x.id === a.id) || {}).anos || {})[anoD()]) || {}; const fal = Object.values(b.faltas || {}).reduce((s, n) => s + n, 0);
        return `<tr><td style="padding:6px;border-top:1px solid #e3eaf5">${esc(a.nome)}</td>${dsT.map(d => { const v = ((b.notas || {})[d] || {})[dAv]; return `<td style="text-align:center;padding:6px;border-top:1px solid #e3eaf5;${v !== undefined && +v < 6 ? 'color:#b3261e;font-weight:700' : ''}">${v ?? '—'}</td>`; }).join('')}<td style="text-align:center;padding:6px;border-top:1px solid #e3eaf5">${fal}</td></tr>`; }).join('')}</tbody></table></div><p class="es-dica" style="margin-top:8px">Notas abaixo de 6 em vermelho.</p>` : '<div class="es-vazio"><b>Nenhuma nota lançada nesta turma ainda.</b></div>'; }
    return x + '</section>';
  }
  async function salvarNotas(f) {
    const al = daTurma(dTurma), valores = {}; let erro = '';
    for (const a of al) { let v = (f.get('n_' + a.id) || '').trim().replace(',', '.'); if (v === '') continue; if (isNaN(v) || +v < 0 || +v > 10) { erro = a.nome; break; } valores[a.id] = Math.round(+v * 10) / 10; }
    if (erro) return alert('Nota inválida para ' + erro + '. Use números de 0 a 10.');
    await D.salvar('notas', { id: idNota(), ano: anoD(), turma: dTurma, disciplina: dDisc, av: dAv, valores, alunos: al.map(a => a.id), profId: eu().pessoaId || '' });
    for (const a of al) if (a.id in valores) await D.mesclar('boletins', a.id, { nome: a.nome, turma: a.turma, anos: { [anoD()]: { turma: a.turma, notas: { [dDisc]: { [dAv]: valores[a.id] } } } } });
    alert('Notas salvas: ' + Object.keys(valores).length + ' aluno(s).'); desenhar();
  }
  async function salvarFreq(f) {
    const al = daTurma(dTurma), faltas = al.filter(a => f.get('f_' + a.id)).map(a => a.id);
    await D.salvar('frequencia', { id: idFreq(), ano: dData.slice(0, 4), turma: dTurma, disciplina: dDisc, data: dData, faltas, alunos: al.map(a => a.id) });
    const docs = (await D.listar('frequencia')).filter(x => x.turma === dTurma && x.disciplina === dDisc && x.ano === dData.slice(0, 4));
    for (const a of al) { const n = docs.filter(x => (x.faltas || []).includes(a.id)).length; await D.mesclar('boletins', a.id, { nome: a.nome, turma: a.turma, anos: { [dData.slice(0, 4)]: { turma: a.turma, faltas: { [dDisc]: n }, aulas: { [dDisc]: docs.length } } } }); }
    alert(`Frequência de ${fmt(dData)} salva: ${faltas.length} falta(s).`); desenhar();
  }
  async function salvarRel(f) {
    const sem = $('#d-sem').value;
    for (const a of daTurma(dTurma)) { const t = (f.get('r_' + a.id) || '').trim(); await D.mesclar('boletins', a.id, { nome: a.nome, turma: a.turma, anos: { [anoD()]: { turma: a.turma, relatorios: { [dDisc]: { [sem]: t } } } } }); }
    alert('Relatórios salvos.'); desenhar();
  }

  /* ---------- ACESSOS (só com a nuvem ligada, só a Direção) ---------- */
  let pararUs = null, usuarios = [];
  const NOME_P = { direcao: 'Direção', secretaria: 'Secretaria', coordenacao: 'Coordenação', professor: 'Professor(a)', aee: 'AEE', financeiro: 'Financeiro', familia: 'Família' };
  function telaAcessos() {
    if (!pararUs) pararUs = D.nuvem.usuarios(l => { usuarios = l.sort((a, b) => (a.nome || a.email).localeCompare(b.nome || b.email)); if (aba === 'acessos' && !document.activeElement.closest('#es-fu')) telaAcessos(); });
    const eq = usuarios.filter(u => u.perfil !== 'familia'), fam = usuarios.filter(u => u.perfil === 'familia');
    const linha = u => `<li class="${u.ativo === false ? 'feito' : ''}"><b>${u.ativo === false ? '⛔' : '✅'} ${esc(u.nome || u.email)}<br><small>${esc(u.email)}</small></b><span class="chip">${NOME_P[u.perfil] || u.perfil}${u.perfil === 'familia' ? ' · ' + (u.alunos || []).length + ' aluno(s)' : ''}</span>${u.email === D.nuvem.usuario.email ? '<span class="chip ok">você</span>' : `<button class="b" data-usat="${esc(u.email)}">${u.ativo === false ? '✅ Liberar' : '⛔ Bloquear'}</button>`}</li>`;
    $('#es').innerHTML = `<section class="es-sec"><h2>🔐 Quem pode entrar</h2><p class="es-dica">Só entra quem estiver liberado aqui. Bloquear tira o acesso na hora, em todos os aparelhos.</p>
      <div class="es-acoes"><button class="b main" id="es-libeq">👩‍🏫 Liberar a equipe do cadastro</button><button class="b main" id="es-libpais">👨‍👩‍👧 Liberar os pais do cadastro</button></div>
      <form class="es-form" id="es-fu"><h3>➕ Liberar um e-mail</h3><div class="es-g3"><label>E-mail<input name="email" type="email" required></label><label>Nome<input name="nome"></label><label>Perfil<select name="perfil">${Object.entries(NOME_P).filter(([k]) => k !== 'familia').map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label></div><div class="es-acoes"><button class="b main">✅ Liberar</button></div></form>
      <h2 style="margin-top:18px">👥 Equipe <small>${eq.length}</small></h2><ul class="es-pend">${eq.map(linha).join('') || '<li>Ninguém ainda.</li>'}</ul>
      <h2 style="margin-top:18px">👨‍👩‍👧 Famílias <small>${fam.length}</small></h2><ul class="es-pend">${fam.map(linha).join('') || '<li>Nenhuma família liberada. Marque “Acesso à área dos pais” no cadastro do aluno e toque em “Liberar os pais do cadastro”.</li>'}</ul></section>`;
    $('#es-fu').onsubmit = async e => { e.preventDefault(); const f = new FormData(e.target); await D.nuvem.salvarUsuario({ email: f.get('email').trim(), nome: f.get('nome').trim(), perfil: f.get('perfil'), ativo: true }); e.target.reset(); };
  }
  async function liberarEquipe() { await carregar(); let n = 0; for (const p of pessoas.filter(p => p.email && p.ativo !== false && p.perfil !== 'apoio')) { await D.nuvem.salvarUsuario({ email: p.email, nome: p.nome, perfil: p.perfil, pessoaId: p.id, ativo: true }); n++; } alert(n ? n + ' pessoa(s) da equipe liberada(s).' : 'Nenhum funcionário com e-mail no cadastro.'); }
  async function liberarPais() {
    await carregar(); const m = {};
    for (const a of alunos.filter(a => a.situacao !== 'Transferido' && a.situacao !== 'Desistente')) for (const r of a.responsaveis || []) if (r.email && r.acesso) { const k = r.email.toLowerCase(); m[k] = m[k] || { nome: r.nome, alunos: [] }; m[k].alunos.push(a.id); }
    for (const [email, x] of Object.entries(m)) await D.nuvem.salvarUsuario({ email, nome: x.nome, perfil: 'familia', alunos: x.alunos, ativo: true });
    let bl = 0; for (const u of usuarios.filter(u => u.perfil === 'familia' && !m[u.email] && u.ativo !== false)) { await D.nuvem.salvarUsuario({ email: u.email, ativo: false, alunos: [] }); bl++; }
    alert(`${Object.keys(m).length} família(s) liberada(s)${bl ? ` e ${bl} bloqueada(s) (sem acesso no cadastro)` : ''}.`);
  }

  /* ---------- desenho e eventos ---------- */
  async function desenhar() {
    emEntregas = null; await carregar(); montaVerComo(); $$('#abas button').forEach(b => b.classList.toggle('on', b.dataset.aba === aba));
    const nv = D.nuvem && D.nuvem.usuario, dir = nv && nv.perfil === 'direcao'; $('[data-aba=acessos]').hidden = !dir; if (aba === 'acessos' && !dir) aba = 'hoje';
    if (nv) $('#es-onde').innerHTML = `☁️ Conectado como <b>${esc(nv.nome)}</b> (${esc(nv.email)}). Tudo o que você salva aparece nos outros aparelhos da escola. <button class="b" id="es-sair">Sair</button>`;
    if (aba === 'acessos') return telaAcessos();
    $('#es').innerHTML = aba === 'hoje' ? telaHoje() : aba === 'crono' ? telaCrono() : aba === 'diario' ? telaDiario() : telaCad();
    if (aba === 'diario') { const on = (sel, f) => { const el = $(sel); if (el) el.onchange = f; };
      on('#d-turma', e => { dTurma = e.target.value; desenhar(); }); on('#d-disc', e => { dDisc = e.target.value; desenhar(); }); on('#d-av', e => { dAv = e.target.value; desenhar(); }); on('#d-data', e => { dData = e.target.value; desenhar(); }); on('#d-sem', e => { dAv = e.target.value; desenhar(); });
      const fs = { '#d-fn': salvarNotas, '#d-ff': salvarFreq, '#d-fr': salvarRel }; for (const [k, fn] of Object.entries(fs)) { const fm = $(k); if (fm) fm.onsubmit = e => { e.preventDefault(); fn(new FormData(fm)); }; } }
    const bu = $('#es-busca'); if (bu) bu.oninput = () => { busca = bu.value; const p = bu.selectionStart; desenhar().then(() => { const n = $('#es-busca'); n.focus(); n.setSelectionRange(p, p); }); };
    const an = $('#es-ano'); if (an) an.onchange = () => { ano = an.value; filtroG = ''; desenhar(); };
  }
  $('#abas').onclick = e => { const b = e.target.closest('button'); if (b) { aba = b.dataset.aba; desenhar(); } };
  $('#es').addEventListener('click', async e => {
    const b = e.target.closest('button,a'); if (!b) return; const d = b.dataset, item = id => crono.find(x => x.id === id);
    if (d.ir) { aba = d.ir; return desenhar(); }
    if (b.id === 'es-novocom') return telaCom();
    if (d.edcom) return telaCom(comunicados.find(c => c.id === d.edcom));
    if (d.delcom) { if (confirm('Apagar este comunicado? Ele some da área das famílias.')) { await D.apagar('comunicados', d.delcom); await desenhar(); } return; }
    if (b.id === 'es-libeq') return liberarEquipe();
    if (b.id === 'es-libpais') return liberarPais();
    if (d.usat) { const u = usuarios.find(x => x.email === d.usat); return D.nuvem.salvarUsuario({ email: u.email, ativo: u.ativo === false }); }
    if (b.id === 'es-gerar') return telaGerar();
    if (b.id === 'es-nova') return telaItem();
    if (b.id === 'es-pdf') return exportar('pdf');
    if (b.id === 'es-word') return exportar('word');
    if (d.fg !== undefined) { filtroG = d.fg; return desenhar(); }
    if (d.ed) return telaItem(item(d.ed));
    if (d.acomp) return telaEntregas(item(d.acomp));
    if (d.feito) { const it = item(d.feito); it.feito = !it.feito; await D.salvar('cronograma', it); return desenhar(); }
    if (d.del) { if (confirm('Apagar esta atividade do cronograma?')) { await D.apagar('cronograma', d.del); await desenhar(); } return; }
    if (d.entreguei) { await marcar(d.entreguei, eu().pessoaId, true); return desenhar(); }
    if (d.recebi || d.desf) { const [id, pid] = (d.recebi || d.desf).split('|'); const ali = emEntregas; await marcar(id, pid, !!d.recebi); if (ali) { await carregar(); return telaEntregas(item(id)); } return desenhar(); }
    if (d.sub) { sub = d.sub; busca = ''; return desenhar(); }
    if (d.dmodo) { dModo = d.dmodo; return desenhar(); }
    if (b.id === 'es-novoal') return telaAluno();
    if (b.id === 'es-colar') return telaColar();
    if (b.id === 'es-novofu') return telaFunc();
    if (b.id === 'es-trazer') return trazerHorario();
    if (d.edal) return telaAluno(alunos.find(a => a.id === d.edal));
    if (d.edfu) return telaFunc(pessoas.find(p => p.id === d.edfu));
    if (d.delal) { if (confirm('Apagar este aluno do cadastro?')) { await D.apagar('alunos', d.delal); aba = 'cad'; await desenhar(); } return; }
    if (d.delfu) { if (confirm('Apagar este funcionário do cadastro?')) { await D.apagar('pessoas', d.delfu); aba = 'cad'; await desenhar(); } return; }
  });
  // cópia de segurança
  $('#es-exp').onclick = async () => { const l = await D.tudo(); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify({ sei: 'escola', em: new Date().toISOString(), itens: l })], { type: 'application/json' })); a.download = `SEI-gestao-${hoje()}.json`; document.body.append(a); a.click(); a.remove(); };
  $('#es-imp').onchange = async e => { const f = e.target.files[0]; if (!f) return; try { const j = JSON.parse(await f.text()); if (j.sei !== 'escola') throw new Error('arquivo de outro tipo'); await D.importar(j.itens || []); alert('Cópia importada.'); await desenhar(); } catch (er) { alert('Não consegui importar: ' + er.message); } e.target.value = ''; };
  D.ouvir(() => { if (!document.querySelector('#es form') && !emEntregas && aba !== 'diario') desenhar(); });
  document.addEventListener('sei-nuvem', () => desenhar());
  document.addEventListener('click', e => { if (e.target.id === 'es-sair' && D.nuvem) D.nuvem.sair(); });
  const h = location.hash.slice(1); if (['hoje', 'crono', 'diario', 'cad', 'acessos'].includes(h)) aba = h;
  desenhar();
})();
