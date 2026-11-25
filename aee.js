/* AEE — Atendimento Educacional Especializado: alunos, fichas de atendimento, PEI e atividade adaptada.
   Tudo fica guardado neste aparelho (IndexedDB "sei-aee"). */
(function () {
  'use strict';
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const br = s => esc(s).replace(/\n/g, '<br>');
  const hoje = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  const fmt = d => (d || '').split('-').reverse().join('/');
  const novoId = () => 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  /* ---------- armazenamento ---------- */
  let dbp = null;
  const abrir = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open('sei-aee', 3);
    r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains('alunos')) d.createObjectStore('alunos', { keyPath: 'id' }); for (const n of ['atend', 'pei', 'parecer', 'docs']) if (!d.objectStoreNames.contains(n)) d.createObjectStore(n, { keyPath: 'id' }).createIndex('aluno', 'aluno'); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
  const tx = (st, modo, fn) => abrir().then(d => new Promise((res, rej) => { const t = d.transaction(st, modo); const o = fn(t.objectStore(st)); t.oncomplete = () => res(o && o.result !== undefined ? o.result : o); t.onerror = () => rej(t.error); }));
  const todos = st => tx(st, 'readonly', s => s.getAll()).then(l => l || []);
  const gravar = (st, o) => { o.atualizado = Date.now(); return tx(st, 'readwrite', s => s.put(o)).then(() => o); };
  const apagar = (st, id) => tx(st, 'readwrite', s => s.delete(id));
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}

  /* ---------- listas ---------- */
  const NECESSIDADES = ['TEA (autismo)', 'TDAH', 'Deficiência intelectual', 'Deficiência física', 'Deficiência visual / baixa visão', 'Deficiência auditiva / surdez', 'Altas habilidades / superdotação', 'Dislexia', 'Discalculia', 'Síndrome de Down', 'Atraso no desenvolvimento'];
  const APRENDE = ['Imagens e figuras', 'Letra ampliada', 'Leitura em voz alta', 'Material concreto', 'Instruções curtas', 'Rotina visual', 'Tempo extra', 'Jogos', 'Tecnologia / tablet', 'Atividade em dupla', 'Ambiente silencioso', 'Música'];
  const RECURSOS = ['Jogos pedagógicos', 'Material concreto', 'Fichas com imagens', 'Alfabeto móvel', 'Material ampliado', 'Tablet / computador', 'Pranchas de comunicação', 'Massinha / sensorial', 'Livro / história', 'Atividade impressa adaptada'];
  const PARTICIPA = ['Realizou com autonomia', 'Realizou com apoio parcial', 'Realizou com apoio total', 'Não realizou'];
  const ADAPTA = ['Avaliação adaptada', 'Tempo estendido', 'Leitura da prova pelo professor', 'Menos questões por folha', 'Letra ampliada', 'Uso de imagens', 'Mediador / apoio em sala', 'Material concreto', 'Sentar próximo ao professor', 'Enunciados curtos', 'Pausas durante a atividade'];
  const AREAS = [['comunicacao', 'Comunicação e linguagem'], ['cognitivo', 'Cognitivo e acadêmico'], ['social', 'Socioafetivo e comportamento'], ['autonomia', 'Autonomia e vida diária'], ['motor', 'Coordenação motora']];
  const SERIES = ['1º ano', '2º ano', '3º ano', '4º ano', '5º ano', '6º ano', '7º ano', '8º ano', '9º ano', '1ª série (Médio)', '2ª série (Médio)', '3ª série (Médio)'];

  let alunos = [], atual = null, aba = 'perfil', edit = null;
  const chips = (nome, lista, marcados) => `<div class="chips">${lista.map(x => `<label><input type="checkbox" name="${nome}" value="${esc(x)}" ${(marcados || []).includes(x) ? 'checked' : ''}><span>${esc(x)}</span></label>`).join('')}</div>`;
  const marcados = (raiz, nome) => [...raiz.querySelectorAll(`input[name="${nome}"]:checked`)].map(i => i.value);
  const campo = (rot, html, cls) => `<label class="${cls || ''}"><span>${rot}</span>${html}</label>`;
  const txt = (id, v, ph, rows) => `<textarea id="${id}" rows="${rows || 3}" placeholder="${esc(ph || '')}">${esc(v || '')}</textarea>`;
  const inp = (id, v, ph, type) => `<input id="${id}" type="${type || 'text'}" value="${esc(v || '')}" placeholder="${esc(ph || '')}">`;
  const val = id => ($('#' + id) || {}).value || '';

  /* ---------- lista de alunos ---------- */
  async function carregar(sel) {
    alunos = (await todos('alunos')).sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
    if (sel) atual = alunos.find(a => a.id === sel) || null; else if (atual) atual = alunos.find(a => a.id === atual.id) || null;
    lista(); painel();
  }
  function lista() {
    const q = $('#busca').value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const l = alunos.filter(a => !q || a.nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(q));
    $('#alunos').innerHTML = l.length ? l.map(a => `<button class="al ${atual && atual.id === a.id ? 'on' : ''}" data-al="${a.id}"><b>${esc(a.nome)}</b><small>${esc([a.serie, a.classe].filter(Boolean).join(' '))}${(a.necessidades || []).length ? ' · ' + esc(a.necessidades[0]) : ''}</small></button>`).join('')
      : `<p class="dica">${alunos.length ? 'Nenhum aluno encontrado.' : 'Nenhum aluno cadastrado ainda.'}</p>`;
  }

  /* ---------- painel do aluno ---------- */
  function painel() {
    const p = $('#painel');
    if (!atual) {
      p.innerHTML = `<div class="vazio"><h2>🤝 Atendimento Educacional Especializado</h2><p>Cadastre cada aluno atendido pelo AEE com as necessidades e o jeito como aprende melhor. Depois, registre os atendimentos, monte o Plano Educacional Individualizado (PEI) e crie atividades adaptadas no padrão da escola.</p><button class="b main" onclick="document.getElementById('novoAluno').click()">➕ Cadastrar aluno</button></div>`;
      return;
    }
    const abas = [['perfil', '👤 Perfil'], ['atend', '🗂️ Atendimentos'], ['pei', '🎯 PEI'], ['parecer', '📄 Parecer'], ['docs', '📑 Relatórios AEE'], ['ativ', '✏️ Atividade adaptada']];
    p.innerHTML = `<div class="topo-al"><h2>${esc(atual.nome)}</h2><small>${esc([atual.serie, atual.classe, atual.turno].filter(Boolean).join(' · '))}</small></div>
      <nav class="abas-al">${abas.map(([k, n]) => `<button data-aba="${k}" class="${aba === k ? 'on' : ''}">${n}</button>`).join('')}</nav><section id="cont"></section>`;
    ({ perfil, atend, pei, parecer, docs: relatorios, ativ })[aba]();
  }

  // Perfil
  function perfil() {
    const a = atual || {};
    $('#cont').innerHTML = `<form id="fPerfil" class="ficha">
      <div class="g2">${campo('Nome do aluno *', inp('pNome', a.nome, 'Nome completo'))}${campo('Data de nascimento', inp('pNasc', a.nascimento, '', 'date'))}</div>
      <div class="g3">${campo('Série', `<select id="pSerie"><option value="">—</option>${SERIES.map(s => `<option ${a.serie === s ? 'selected' : ''}>${s}</option>`).join('')}</select>`)}${campo('Turma', inp('pClasse', a.classe, 'A, B…'))}${campo('Turno', inp('pTurno', a.turno, 'Manhã, Tarde'))}</div>
      <div class="g2">${campo('Responsável', inp('pResp', a.responsavel, 'Nome do responsável'))}${campo('Telefone do responsável', inp('pTel', a.telefone, '(91) 9…', 'tel'))}</div>
      <div class="g2">${campo('Professor(a) regente', inp('pRegente', a.regente))}${campo('Profissional do AEE', inp('pAee', a.profissional))}</div>
      ${campo('Necessidades / condição', chips('nec', NECESSIDADES, a.necessidades) + inp('pNecOutra', a.necOutra, 'Outra (opcional)'), 'full')}
      ${campo('Laudo / informações de saúde (opcional)', txt('pLaudo', a.laudo, 'Ex.: laudo de 2025; usa óculos; medicação no horário da tarde…', 2), 'full')}
      ${campo('Pontos fortes', txt('pFortes', a.fortes, 'O que o aluno já faz bem'), 'full')}
      ${campo('Interesses', txt('pInteresses', a.interesses, 'Temas, brincadeiras, personagens de que gosta', 2), 'full')}
      ${campo('Dificuldades', txt('pDific', a.dificuldades, 'O que ainda é difícil'), 'full')}
      ${campo('Como aprende melhor', chips('apr', APRENDE, a.aprende) + inp('pAprOutra', a.aprendeOutra, 'Outro (opcional)'), 'full')}
      <div class="acoes"><button class="b main" type="submit">💾 Salvar</button><button class="b" type="button" data-vermod="perfil">👁 Ver ficha</button>${atual.id ? `<button class="b" type="button" data-imp="perfil">🖨 Imprimir ficha do aluno</button><button class="b" type="button" data-baixa="word" data-imp2="perfil">⬇ Word</button><button class="b" type="button" data-baixa="pdf" data-imp2="perfil">⬇ PDF</button><button class="b ghost" type="button" id="delAluno">Excluir aluno</button>` : ''}</div>
    </form>`;
    $('#fPerfil').onsubmit = async e => {
      e.preventDefault(); const f = e.target; const nome = val('pNome').trim(); if (!nome) { alert('Escreva o nome do aluno.'); return; }
      const o = Object.assign(atual.id ? atual : { id: novoId(), criado: Date.now() }, {
        nome, nascimento: val('pNasc'), serie: val('pSerie'), classe: val('pClasse').trim(), turno: val('pTurno').trim(), responsavel: val('pResp').trim(), telefone: val('pTel').trim(),
        regente: val('pRegente').trim(), profissional: val('pAee').trim(), necessidades: marcados(f, 'nec'), necOutra: val('pNecOutra').trim(), laudo: val('pLaudo').trim(),
        fortes: val('pFortes').trim(), interesses: val('pInteresses').trim(), dificuldades: val('pDific').trim(), aprende: marcados(f, 'apr'), aprendeOutra: val('pAprOutra').trim()
      });
      await gravar('alunos', o); aviso('Perfil salvo.'); carregar(o.id);
    };
    const del = $('#delAluno'); if (del) del.onclick = async () => {
      if (!confirm(`Excluir ${atual.nome} e todos os atendimentos e PEIs dele? Isso não pode ser desfeito.`)) return;
      for (const st of ['atend', 'pei', 'parecer', 'docs']) for (const x of (await todos(st)).filter(x => x.aluno === atual.id)) await apagar(st, x.id);
      await apagar('alunos', atual.id); atual = null; aba = 'perfil'; carregar();
    };
  }
  const necTxt = a => [...(a.necessidades || []), a.necOutra].filter(Boolean).join(', ');
  const aprTxt = a => [...(a.aprende || []), a.aprendeOutra].filter(Boolean).join(', ');

  // Atendimentos
  async function atend() {
    const l = (await todos('atend')).filter(x => x.aluno === atual.id).sort((a, b) => (b.data || '').localeCompare(a.data || ''));
    if (edit && edit.tipo === 'atend') return formAtend(edit.obj);
    $('#cont').innerHTML = `<div class="acoes"><button class="b main" id="novoAt">➕ Registrar atendimento</button><button class="b" data-vermod="atend">👁 Ver modelo</button>${l.length ? `<button class="b" data-imp="atend-todos">🖨 Imprimir todos (${l.length})</button>` : ''}</div>
      ${l.length ? `<div class="cards">${l.map(x => `<article class="aula"><div class="topo"><b>${fmt(x.data)}${x.inicio ? ' · ' + esc(x.inicio) + (x.fim ? '–' + esc(x.fim) : '') : ''}</b><span class="tag">${esc(x.modalidade || 'Individual')}</span></div>
        <h3>${esc(x.objetivo || 'Atendimento')}</h3>${x.participacao ? `<p class="cont"><b>${esc(x.participacao)}</b></p>` : ''}<p class="cont">${esc((x.atividades || '').slice(0, 160))}</p>
        <div class="acoes"><button class="b main" data-ver="atend" data-id="${x.id}">👁 Ver</button><button class="b" data-imp="atend" data-id="${x.id}">🖨 Imprimir</button><button class="b" data-baixa="word" data-imp2="atend" data-id="${x.id}">⬇ Word</button><button class="b" data-baixa="pdf" data-imp2="atend" data-id="${x.id}">⬇ PDF</button><button class="b" data-edat="${x.id}">Editar</button><button class="b ghost" data-delat="${x.id}">Excluir</button></div></article>`).join('')}</div>`
        : '<p class="dica">Nenhum atendimento registrado. Toque em “Registrar atendimento” depois de cada encontro.</p>'}`;
    $('#novoAt').onclick = () => { edit = { tipo: 'atend', obj: { data: hoje(), profissional: atual.profissional } }; atend(); };
  }
  function formAtend(x) {
    $('#cont').innerHTML = `<form id="fAt" class="ficha"><h3>${x.id ? 'Editar' : 'Novo'} atendimento</h3>
      <div class="g3">${campo('Data', inp('aData', x.data, '', 'date'))}${campo('Início', inp('aIni', x.inicio, '', 'time'))}${campo('Fim', inp('aFim', x.fim, '', 'time'))}</div>
      <div class="g2">${campo('Tipo de atendimento', `<select id="aMod">${['Individual', 'Em grupo', 'Na sala comum', 'Com a família'].map(m => `<option ${x.modalidade === m ? 'selected' : ''}>${m}</option>`).join('')}</select>`)}${campo('Profissional', inp('aProf', x.profissional))}</div>
      ${campo('Objetivo do atendimento', inp('aObj', x.objetivo, 'Ex.: reconhecer as vogais'), 'full')}
      ${campo('Atividades realizadas', txt('aAtiv', x.atividades, 'O que foi feito no atendimento'), 'full')}
      ${campo('Recursos utilizados', chips('rec', RECURSOS, x.recursos) + inp('aRecOutro', x.recOutro, 'Outro (opcional)'), 'full')}
      ${campo('Participação do aluno', `<div class="chips radio">${PARTICIPA.map(p => `<label><input type="radio" name="part" value="${p}" ${x.participacao === p ? 'checked' : ''}><span>${p}</span></label>`).join('')}</div>`, 'full')}
      ${campo('Comportamento e observações', txt('aObs', x.observacoes, 'Como o aluno estava, o que chamou atenção'), 'full')}
      ${campo('Próximos passos', txt('aProx', x.proximos, 'O que fazer no próximo atendimento', 2), 'full')}
      <div class="acoes"><button class="b main" type="submit">💾 Salvar atendimento</button><button class="b ghost" type="button" id="cancAt">Cancelar</button></div></form>`;
    $('#cancAt').onclick = () => { edit = null; atend(); };
    $('#fAt').onsubmit = async e => {
      e.preventDefault(); const f = e.target; const p = f.querySelector('input[name=part]:checked');
      const o = Object.assign(x.id ? x : { id: novoId(), aluno: atual.id, criado: Date.now() }, {
        data: val('aData') || hoje(), inicio: val('aIni'), fim: val('aFim'), modalidade: val('aMod'), profissional: val('aProf').trim(), objetivo: val('aObj').trim(), atividades: val('aAtiv').trim(),
        recursos: marcados(f, 'rec'), recOutro: val('aRecOutro').trim(), participacao: p ? p.value : '', observacoes: val('aObs').trim(), proximos: val('aProx').trim()
      });
      await gravar('atend', o); edit = null; aviso('Atendimento salvo.'); atend();
    };
  }

  // PEI
  async function pei() {
    if (edit && edit.tipo === 'pei') return formPei(edit.obj);
    const l = (await todos('pei')).filter(x => x.aluno === atual.id).sort((a, b) => (b.ano + b.periodo).localeCompare(a.ano + a.periodo));
    $('#cont').innerHTML = `<p class="dica">O PEI (Plano Educacional Individualizado) organiza os objetivos e as adaptações do aluno para o período. Revise a cada semestre.</p>
      <div class="acoes"><button class="b main" id="novoPei">➕ Novo PEI</button><button class="b" data-vermod="pei">👁 Ver modelo</button></div>
      ${l.length ? `<div class="cards">${l.map(x => `<article class="aula"><div class="topo"><b>${esc(x.periodo)} de ${esc(x.ano)}</b><span class="tag">PEI</span></div>
        <h3>${esc(x.frequencia || '')}</h3><p class="cont">${esc((x.obj_cognitivo || x.obj_comunicacao || '').slice(0, 150))}</p>
        <div class="acoes"><button class="b main" data-ver="pei" data-id="${x.id}">👁 Ver</button><button class="b" data-imp="pei" data-id="${x.id}">🖨 Imprimir</button><button class="b" data-baixa="word" data-imp2="pei" data-id="${x.id}">⬇ Word</button><button class="b" data-baixa="pdf" data-imp2="pei" data-id="${x.id}">⬇ PDF</button><button class="b" data-edpei="${x.id}">Editar</button><button class="b" data-duppei="${x.id}">Copiar para novo período</button><button class="b ghost" data-delpei="${x.id}">Excluir</button></div></article>`).join('')}</div>` : ''}`;
    $('#novoPei').onclick = () => { edit = { tipo: 'pei', obj: { ano: String(new Date().getFullYear()), periodo: new Date().getMonth() < 6 ? '1º semestre' : '2º semestre', necessidades: necTxt(atual), potencialidades: [atual.fortes, atual.interesses].filter(Boolean).join('\n') } }; pei(); };
  }
  function formPei(x) {
    $('#cont').innerHTML = `<form id="fPei" class="ficha"><h3>${x.id ? 'Editar' : 'Novo'} PEI</h3>
      <div class="g3">${campo('Ano', inp('eAno', x.ano))}${campo('Período', `<select id="ePer">${['1º semestre', '2º semestre', 'Anual', '1º bimestre', '2º bimestre', '3º bimestre', '4º bimestre'].map(p => `<option ${x.periodo === p ? 'selected' : ''}>${p}</option>`).join('')}</select>`)}${campo('Frequência do AEE', inp('eFreq', x.frequencia, 'Ex.: 2 vezes por semana, 50 min'))}</div>
      ${campo('Necessidades educacionais', txt('eNec', x.necessidades, '', 2), 'full')}
      ${campo('Potencialidades (o que já faz bem e do que gosta)', txt('ePot', x.potencialidades, '', 3), 'full')}
      <h4>Objetivos para o período</h4>
      ${AREAS.map(([k, n]) => campo(n, txt('o_' + k, x['obj_' + k], 'Ex.: ' + ({ comunicacao: 'pedir ajuda usando frases curtas', cognitivo: 'ler palavras simples; somar até 10 com material concreto', social: 'esperar a vez em jogos em grupo', autonomia: 'organizar o próprio material', motor: 'recortar seguindo uma linha' })[k], 2), 'full')).join('')}
      ${campo('Adaptações nas aulas e avaliações', chips('adp', ADAPTA, x.adaptacoes) + txt('eAdpTxt', x.adaptacoesTxt, 'Outras adaptações', 2), 'full')}
      ${campo('Recursos e tecnologia assistiva', txt('eRec', x.recursos, 'Ex.: pranchas de comunicação, alfabeto móvel, tablet', 2), 'full')}
      ${campo('Estratégias de ensino', txt('eEst', x.estrategias, 'Como o conteúdo vai ser trabalhado', 3), 'full')}
      ${campo('Orientações ao professor regente e à família', txt('eOri', x.orientacoes, '', 3), 'full')}
      ${campo('Como será avaliado', txt('eAval', x.avaliacao, 'Ex.: observação diária, portfólio de atividades, avaliação adaptada', 2), 'full')}
      <div class="g2">${campo('Revisão prevista em', inp('eRev', x.revisao, '', 'date'))}${campo('Profissional do AEE', inp('eProf', x.profissional || atual.profissional))}</div>
      <div class="acoes"><button class="b main" type="submit">💾 Salvar PEI</button><button class="b ghost" type="button" id="cancPei">Cancelar</button></div></form>`;
    $('#cancPei').onclick = () => { edit = null; pei(); };
    $('#fPei').onsubmit = async e => {
      e.preventDefault(); const f = e.target;
      const o = Object.assign(x.id ? x : { id: novoId(), aluno: atual.id, criado: Date.now() }, {
        ano: val('eAno').trim(), periodo: val('ePer'), frequencia: val('eFreq').trim(), necessidades: val('eNec').trim(), potencialidades: val('ePot').trim(),
        adaptacoes: marcados(f, 'adp'), adaptacoesTxt: val('eAdpTxt').trim(), recursos: val('eRec').trim(), estrategias: val('eEst').trim(), orientacoes: val('eOri').trim(),
        avaliacao: val('eAval').trim(), revisao: val('eRev'), profissional: val('eProf').trim()
      });
      AREAS.forEach(([k]) => { o['obj_' + k] = val('o_' + k).trim(); });
      await gravar('pei', o); edit = null; aviso('PEI salvo.'); pei();
    };
  }

  // Parecer neuropsicopedagógico: capa da escola + texto do parecer
  const SEC_PAR = [['motivo', 'Motivo do encaminhamento', 'Quem encaminhou e por quê'], ['historico', 'Histórico e informações relevantes', 'Desenvolvimento, saúde, família, vida escolar'],
    ['instrumentos', 'Procedimentos e instrumentos utilizados', 'Entrevista, observação, testes, provas, atividades'], ['cognitivo', 'Aspectos cognitivos', 'Atenção, memória, raciocínio, funções executivas'],
    ['linguagem', 'Linguagem, leitura e escrita', ''], ['matematica', 'Raciocínio lógico-matemático', ''], ['motor', 'Aspectos psicomotores', ''],
    ['socio', 'Aspectos socioemocionais e comportamentais', ''], ['conclusao', 'Conclusão / síntese', ''], ['escola', 'Orientações à escola e aos professores', ''],
    ['familia', 'Orientações à família', ''], ['encaminha', 'Encaminhamentos', 'Ex.: fonoaudiologia, psicologia, neuropediatria']];
  const PROF_PAR = { nome: 'Sâmea Thaíse F. Cunha', cargo: 'Neuropsicopedagoga' };
  async function parecer() {
    if (edit && edit.tipo === 'parecer') return formParecer(edit.obj);
    const l = (await todos('parecer')).filter(x => x.aluno === atual.id).sort((a, b) => (b.data || '').localeCompare(a.data || ''));
    $('#cont').innerHTML = `<p class="dica">Parecer com a capa da escola. Aluno, turma e ano escolar entram na capa automaticamente.</p>
      <div class="acoes"><button class="b main" id="novoPar">➕ Novo parecer</button><button class="b" data-vermod="parecer">👁 Ver modelo</button></div>
      ${l.length ? `<div class="cards">${l.map(x => `<article class="aula"><div class="topo"><b>${fmt(x.data)}</b><span class="tag">Parecer</span></div><h3>${esc((x.conclusao || x.motivo || 'Parecer neuropsicopedagógico').slice(0, 120))}</h3>
        <div class="acoes"><button class="b main" data-ver="parecer" data-id="${x.id}">👁 Ver</button><button class="b" data-imp="parecer" data-id="${x.id}">🖨 Imprimir</button><button class="b" data-baixa="word" data-imp2="parecer" data-id="${x.id}">⬇ Word</button><button class="b" data-baixa="pdf" data-imp2="parecer" data-id="${x.id}">⬇ PDF</button><button class="b" data-edpar="${x.id}">✏️ Editar</button><button class="b ghost" data-delpar="${x.id}">Excluir</button></div></article>`).join('')}</div>` : ''}`;
    $('#novoPar').onclick = () => { edit = { tipo: 'parecer', obj: { data: hoje(), turma: [atual.serie, atual.classe].filter(Boolean).join(' ').replace(/ \(Médio\)/, ''), turno: atual.turno, ano: String(new Date().getFullYear()) } }; parecer(); };
  }
  function formParecer(x) {
    $('#cont').innerHTML = `<form id="fPar" class="ficha"><h3>${x.id ? 'Editar' : 'Novo'} parecer neuropsicopedagógico</h3>
      <div class="g3">${campo('Turma (capa)', inp('rTurma', x.turma, 'Ex.: 3º ano B'))}${campo('Ano escolar (capa)', inp('rAno', x.ano))}${campo('Data do parecer', inp('rData', x.data, '', 'date'))}</div>
      ${SEC_PAR.map(([k, n, ph]) => campo(n, txt('r_' + k, x[k], ph, k === 'conclusao' ? 5 : 3), 'full')).join('')}
      <div class="acoes"><button class="b main" type="submit">💾 Salvar parecer</button><button class="b ghost" type="button" id="cancPar">Cancelar</button></div></form>`;
    $('#cancPar').onclick = () => { edit = null; parecer(); };
    $('#fPar').onsubmit = async e => {
      e.preventDefault();
      const o = Object.assign(x.id ? x : { id: novoId(), aluno: atual.id, criado: Date.now() }, { turma: val('rTurma').trim(), ano: val('rAno').trim(), data: val('rData') || hoje() });
      SEC_PAR.forEach(([k]) => { o[k] = val('r_' + k).trim(); });
      await gravar('parecer', o); edit = null; aviso('Parecer salvo.'); parecer();
    };
  }
  // capa: a arte da escola com os campos escritos por cima (vira uma imagem só, para PDF e Word)
  async function capaParecer(a, x) {
    const im = await new Promise((ok, er) => { const i = new Image(); i.onload = () => ok(i); i.onerror = er; i.src = 'assets/docs/capa-parecer.jpg'; });
    const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; const g = c.getContext('2d'); g.drawImage(im, 0, 0);
    const k = c.width / 905; if (document.fonts && document.fonts.load) { try { await document.fonts.load('800 30px "SEI Rubik"'); } catch (e) {} }
    const escreve = (t, x0, x1, y) => { if (!t) return; let sz = 27; g.font = `800 ${sz * k}px "SEI Rubik", Arial, sans-serif`; while (g.measureText(t).width > (x1 - x0) * k && sz > 14) { sz--; g.font = `800 ${sz * k}px "SEI Rubik", Arial, sans-serif`; } g.fillStyle = '#0b2a5b'; g.textBaseline = 'alphabetic'; g.fillText(t, (x0 + 6) * k, (y - 6) * k); };
    escreve(a.nome, 362, 828, 731); escreve(x.turma, 322, 828, 800); escreve(x.ano, 440, 825, 870);
    return c.toDataURL('image/jpeg', 0.92);
  }
  async function docParecer(a, x) {
    const capa = await capaParecer(a, x);
    const corpo = SEC_PAR.filter(([k]) => x[k]).map(([k, n]) => bloco(n, x[k])).join('');
    return `<div class="doc-pag par-capa"><img src="${capa}" width="620" alt="Capa do parecer"></div><div class="doc-pag par-corpo"><img class="par-agua" src="assets/docs/marca-dagua.jpg" alt="">${cab('PARECER NEUROPSICOPEDAGÓGICO')}${idAluno(a)}<table class="doc-id"><tr><th>Turma</th><td>${esc(x.turma)}</td></tr><tr><th>Data do parecer</th><td>${fmt(x.data)}</td></tr></table>${corpo}
      <p class="doc-fim">São Miguel do Guamá — PA, ${fmt(x.data)}.</p><div class="doc-ass um"><div><span></span><b>${PROF_PAR.nome}</b><br>${PROF_PAR.cargo}</div></div></div>`;
  }

  // Atividade adaptada (Montar folha em uma coluna, letra grande)
  let mol = null;
  async function ativ() {
    if (!mol) { try { mol = await (await fetch('assets/montar/molduras.json?v=10')).json(); } catch (e) { mol = {}; } }
    const A = window.seiAulas; const ops = Object.keys(mol).map(src => ({ src, i: A.info(src) }));
    const series = [...new Set(ops.map(o => o.i.etapa + ' · ' + o.i.turma))];
    const pref = series.find(s => atual.serie && s.includes(atual.serie.replace(/ \(Médio\)/, ''))) || series[0];
    $('#cont').innerHTML = `<div class="ficha"><p class="dica">A atividade adaptada usa a mesma folha da escola, em <b>uma coluna só</b>, com <b>letra grande</b> e mais espaço entre as linhas. Cole ou importe a atividade e ajuste para ${esc(atual.nome.split(' ')[0])}.</p>
      ${atual.aprende && atual.aprende.length ? `<p class="lembra">💡 ${esc(atual.nome.split(' ')[0])} aprende melhor com: <b>${esc(aprTxt(atual))}</b></p>` : ''}
      <div class="g2">${campo('Série', `<select id="tSerie">${series.map(s => `<option ${s === pref ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select>`)}${campo('Disciplina', '<select id="tDisc"></select>')}</div>
      <div class="acoes"><button class="b main" id="abrirAd">✏️ Abrir folha adaptada</button></div></div>`;
    const disc = () => { const s = val('tSerie'); $('#tDisc').innerHTML = ops.filter(o => o.i.etapa + ' · ' + o.i.turma === s).sort((a, b) => a.i.disciplina.localeCompare(b.i.disciplina, 'pt')).map(o => `<option value="${esc(o.src)}">${esc(o.i.disciplina)}</option>`).join(''); };
    $('#tSerie').onchange = disc; disc();
    $('#abrirAd').onclick = () => { try { sessionStorage.setItem('sei-voltar', location.href); } catch (e) {} location.href = 'montar.html#f=' + encodeURIComponent(val('tDisc')) + '&adaptada=1'; };
  }

  /* ---------- Relatórios AEE: EOCA, PDI, RDA e REA ---------- */
  const EOCA_Q = ['Você sabe por que está aqui comigo hoje? O que achou da ideia?', 'O que acha que vai fazer?', 'Você quer estar aqui ou veio porque sua família, a escola ou o seu professor pediu?', 'Eles têm razão? (sim / não)', 'Alguma repetência? Qual?', 'Como foi sua entrada na escola atual?', 'Estudou em outras? Como era?', 'O que mais gosta de fazer na escola?', 'O que não gosta?', 'Você gosta de estudar? Acha que os estudos são importantes? Por quê?',
    'Qual sua disciplina favorita?', 'Desde quando?', 'Qual disciplina você não gosta? Desde quando?', 'Você gosta de seus professores?', 'Quando você não entende uma explicação, o que você faz?', 'Onde você senta na classe? Onde gostaria de sentar?', 'Quem são suas companhias na escola?', 'Você faz as atividades de casa? Onde você faz? Quem ajuda a realizá-las?', 'Quais atividades escolares você acha mais difíceis?', 'Quais atividades você mais gosta de fazer?',
    'Como é o comportamento dos alunos da sua sala?', 'O que você faz quando não está na escola?', 'O que você acha da sua escola?', 'Você se considera um(a) bom(boa) aluno(a)?', 'Você acha que tem alguma dificuldade em aprender?', 'Como é a sua família? Onde mora? Com quem mora?', 'Como você é tratado(a) pela sua família?', 'Você tem contato com seus avós, tios, primos?', 'Você gosta de ler?', 'Se pudesse e tivesse que fazer algo por um aluno parecido com você em sala de aula, o que aconselharia aos pais? E aos professores?', 'Qual profissão você deseja seguir?'];
  const EOCA_TEM = ['Fala muito durante todo o tempo da sessão', 'Fala pouco durante todo o tempo da sessão', 'Verbaliza bem as palavras', 'Expressa-se com facilidade', 'Apresenta dificuldades para se expressar verbalmente', 'Fala de suas ideias, vontades e desejos', 'Mostra-se retraído(a) para se expor', 'Sua fala tem lógica e sequência de fatos', 'Parece viver num mundo de fantasias', 'Tem consciência do que é real e do que é imaginário', 'Conversa sem constrangimento'];
  const EOCA_DIN = ['O tom de voz é baixo', 'O tom de voz é alto', 'Sabe usar o tom de voz adequadamente', 'Gesticula muito para falar', 'Não consegue ficar sentado(a)', 'Tem atenção e concentração', 'Anda o tempo todo', 'Muda de lugar e troca de materiais constantemente', 'Pensa antes de criar ou montar algo', 'Apresenta baixa tolerância à frustração', 'Diante de dificuldades, desiste fácil', 'Tem persistência e paciência', 'Realiza as atividades com capricho', 'Mostra-se desorganizado(a) e descuidado(a)', 'Possui hábitos de higiene e zelo com os materiais', 'Sabe usar os materiais disponíveis e conhece a utilidade de cada um', 'Ao pegar os materiais, devolve no lugar depois de usá-los', 'Não guarda o material que usou', 'Apresenta iniciativa', 'Ocupa todo o espaço disponível', 'Possui boa postura corporal', 'Deixa cair objetos que pega', 'Faz brincadeiras simbólicas', 'Expressa sentimentos nas brincadeiras', 'Leitura adequada à escolaridade', 'Interpretação de texto adequada à escolaridade', 'Faz cálculos', 'Escrita adequada à escolaridade'];
  const EOCA_PROD = ['Desenha e depois escreve', 'Escreve primeiro e depois desenha', 'Apresenta os seus desenhos com forma e compreensão', 'Não consegue contar ou falar sobre os seus desenhos ou escrita', 'Nega-se a descrever sua produção', 'Sente prazer ao terminar sua atividade e mostrar', 'Demonstra insatisfação com os seus feitos', 'Sente-se capaz de executar o que foi proposto', 'Sente-se incapaz de executar o que foi proposto', 'Os desenhos estão no nível da idade do(a) aluno(a)', 'Prefere atividades que lhe possibilitem construir, montar e criar', 'Fica preso(a) ao papel e lápis', 'Executa a atividade com tranquilidade', 'Demonstra agressividade em seus desenhos e criações', 'Demonstra agressividade no comportamento', 'É criativo(a)'];
  const EOCA_HIP = [['Nível cognitivo', ['Pré-operatório intuitivo global', 'Pré-operatório intuitivo articulado', 'Em transição do pré-operatório para o operatório concreto', 'Operatório concreto', 'Operatório concreto em transição para o hipotético-dedutivo/formal', 'Formal']],
    ['Nível de leitura', ['Pré-silábico', 'Silábico sem valor', 'Silábico com valor', 'Silábico-alfabético', 'Alfabético']],
    ['Outros', ['Rejeição da leitura e da escrita (evita escrever durante a sessão, prefere jogos)', 'Vínculo negativo com a aprendizagem sistemática', 'Vínculo positivo com a aprendizagem sistemática', 'Não articula o pensar com o fazer', 'Dificuldade com planejamento e organização', 'Medo ao ataque (resiste ao contato com o material; prefere falar a fazer)', 'Baixa autoestima (descontente com suas produções; “não sei”, “não consigo”)', 'Perfeccionismo; autoexigência', 'Fixação oral (coloca objetos na boca, mastiga lápis e borracha, rói unhas)', 'Necessidade de agradar (característica sedutora)', 'Melhor rendimento e interesse na aprendizagem assistemática', 'Melhor rendimento e interesse na aprendizagem sistemática', 'Problemas de visão', 'Problemas na fala', 'Suspeita de dislexia, TDAH ou outro distúrbio', 'Dificuldade com a coordenação motora']]];
  const EOCA_MOD = [['Hipoassimilativa', 'Bastante tímido(a), quase não fala, não explora os objetos na mesa, costuma querer ficar em uma mesma atividade.'], ['Hiperassimilativa', 'Traz vários assuntos enquanto realiza a atividade; conversa, pergunta, questiona, mas não costuma ouvir porque já está formulando outra pergunta. Prende-se aos detalhes e não observa o todo.'],
    ['Hipoacomodativa', 'Apresenta dificuldade de estabelecer vínculos emocionais e cognitivos. Pode ser confundido(a) com preguiça. Explora pouco os objetos, como se eles fossem machucá-lo(a). Normalmente permanece em uma mesma atividade.'], ['Hiperacomodativa', 'Tem dificuldade de criar, prefere copiar, repete o que aprende sem questionar nem investigar; é muito obediente, aceita tudo, é submisso(a).'], ['Assimilação e acomodação', 'Estão em equilíbrio.']];
  const EOCA_QUADRO = [['tem', 'Temática'], ['din', 'Dinâmica'], ['prod', 'Produto'], ['obst', 'Obstáculos que emergem na relação com o conhecimento'], ['hip', 'Hipótese']];
  const PDI_FREQ = ['1 vez por semana', '2 vezes por semana', '3 vezes por semana'], PDI_TEMPO = ['45 minutos por atendimento', '60 minutos por atendimento'], PDI_COMP = ['Atendimento individual', 'Atendimento em grupo'], PDI_LEIT = ['Pré-silábico', 'Silábico', 'Silábico-alfabético', 'Alfabético'];
  const PDI_RES = [['r_percepcao', 'Cognitivo — percepção'], ['r_atencao', 'Cognitivo — atenção'], ['r_memoria', 'Cognitivo — memória'], ['r_raciocinio', 'Cognitivo — raciocínio lógico e matemático'], ['r_ling_oral', 'Linguagem oral'], ['r_ling_le', 'Linguagem da leitura e escrita'], ['r_motora', 'Função motora'], ['r_social', 'Função social']];
  const PDI_DET = [['Percepção', [['d_cinest', 'Cinestésica'], ['d_espacial', 'Espacial'], ['d_visual', 'Visual'], ['d_auditiva', 'Auditiva'], ['d_tatil', 'Tátil'], ['d_temporal', 'Temporal']]], ['Atenção e concentração', [['d_atencao', 'Atenção e concentração']]], ['Memória', [['d_mem_global', 'Global'], ['d_mem_aud', 'Auditiva'], ['d_mem_vis', 'Visual']]], ['Raciocínio lógico e matemático', [['d_raciocinio', 'Raciocínio lógico e matemático']]], ['Linguagem', [['d_oral', 'Oral'], ['d_leitura', 'Leitura e escrita']]], ['Função motora', [['d_ampla', 'Coordenação motora ampla'], ['d_fina', 'Coordenação motora fina']]], ['Área social', [['d_social', 'Área social']]]];
  const RDA_SEC = [['apresentacao', 'Apresentação do(a) aluno(a)', 'Quem é, como chegou ao AEE, rotina de atendimentos'], ['cognitivo', 'Desenvolvimento cognitivo e acadêmico', 'Atenção, memória, raciocínio, leitura, escrita, matemática'], ['linguagem', 'Comunicação e linguagem', ''], ['social', 'Desenvolvimento socioafetivo e comportamento', ''], ['motor', 'Desenvolvimento motor e autonomia', ''], ['avancos', 'Avanços observados no período', ''], ['desafios', 'Desafios que permanecem', ''], ['encaminha', 'Orientações e encaminhamentos', 'Para a família, a escola e o próximo ano']];
  const DOCS_AEE = { eoca: ['🧩', 'EOCA', 'Entrevista Operativa Centrada na Aprendizagem', 'Entrevista com o aluno, roteiro de observação e quadro de hipóteses'], pdi: ['🎯', 'PDI', 'Plano de Desenvolvimento Individual', 'Planejamento do AEE: identificação, frequência, atividades e funções'], rda: ['📘', 'RDA', 'Relatório de Desenvolvimento do Aluno', 'Relatório do período (semestre ou ano), por áreas do desenvolvimento'], rea: ['📈', 'REA', 'Relatório de Evolução do Aluno', 'Registro de intervenções e estratégias, data a data (puxa os atendimentos)'] };
  const idade = n => { if (!n) return ''; const [y, m, d] = n.split('-').map(Number), h = new Date(); let i = h.getFullYear() - y; if (h.getMonth() + 1 < m || (h.getMonth() + 1 === m && h.getDate() < d)) i--; return i > 0 && i < 40 ? i + ' anos' : ''; };
  const serieA = a => [a.serie, a.classe].filter(Boolean).join(' ').replace(/ \(Médio\)/, '');
  const cks = (nome, lista, marc) => `<div class="chips">${lista.map(x => `<label><input type="checkbox" name="${nome}" value="${esc(x)}" ${(marc || []).includes(x) ? 'checked' : ''}><span>${esc(x)}</span></label>`).join('')}</div>`;
  const rad = (nome, lista, v) => `<div class="chips">${lista.map(x => `<label><input type="radio" name="${nome}" value="${esc(x)}" ${v === x ? 'checked' : ''}><span>${esc(x)}</span></label>`).join('')}</div>`;
  const umRad = (raiz, nome) => { const i = raiz.querySelector(`input[name="${nome}"]:checked`); return i ? i.value : ''; };
  async function relatorios() {
    if (edit && edit.tipo === 'doc') return formDoc(edit.obj);
    const l = (await todos('docs')).filter(x => x.aluno === atual.id).sort((a, b) => (b.data || '').localeCompare(a.data || ''));
    $('#cont').innerHTML = `<p class="dica">Documentos do AEE no padrão da escola. Os dados do aluno entram sozinhos; o que ficar em branco sai com linhas para preencher à mão.</p>
      <div class="cards">${Object.entries(DOCS_AEE).map(([k, [ic, sig, nome, desc]]) => { const meus = l.filter(x => x.tipo === k); return `<article class="aula"><div class="topo"><b>${ic} ${sig}</b><span class="tag">${meus.length} salvo(s)</span></div><h3>${nome}</h3><p class="dica">${desc}</p>
        <div class="acoes"><button class="b main" data-novodoc="${k}">➕ Novo</button><button class="b" data-vermod="${k}">👁 Ver modelo</button><button class="b" data-baixa="word" data-imp2="${k}">⬇ Word em branco</button><button class="b" data-baixa="pdf" data-imp2="${k}">⬇ PDF em branco</button></div>
        ${meus.map(x => `<div class="doc-linha"><b>${fmt(x.data)}</b> ${esc(x.periodo || '')} <span class="acoes"><button class="b" data-ver="${k}" data-id="${x.id}">👁 Ver</button><button class="b" data-imp="${k}" data-id="${x.id}">🖨</button><button class="b" data-baixa="word" data-imp2="${k}" data-id="${x.id}">⬇ Word</button><button class="b" data-baixa="pdf" data-imp2="${k}" data-id="${x.id}">⬇ PDF</button><button class="b" data-eddoc="${x.id}">✏️</button><button class="b ghost" data-deldoc="${x.id}">🗑</button></span></div>`).join('')}</article>`; }).join('')}</div>`;
  }
  const novoDoc = tipo => { const a = atual; const b = { tipo, data: hoje(), profissional: a.profissional || '', regente: a.regente || '' };
    if (tipo === 'eoca') Object.assign(b, { escola: 'Sistema de Ensino Incentivo' });
    if (tipo === 'pdi') Object.assign(b, { periodo: 'Ano letivo de ' + new Date().getFullYear(), deficiencia: necTxt(a), laudo: a.laudo ? 'Sim' : '', responsavel: a.responsavel || '', celular: a.telefone || '', familiar: '', escolar: [a.fortes && 'Pontos fortes: ' + a.fortes, a.dificuldades && 'Dificuldades: ' + a.dificuldades].filter(Boolean).join('\n') });
    if (tipo === 'rda') Object.assign(b, { area: necTxt(a), periodo: 'Ano letivo de ' + new Date().getFullYear() });
    if (tipo === 'rea') Object.assign(b, { diagnostico: necTxt(a), cargo: 'Neuropsicopedagoga', linhas: [] });
    return b; };
  function formDoc(x) {
    const k = x.tipo, [ic, sig, nome] = DOCS_AEE[k]; let h = '';
    if (k === 'eoca') h = `<div class="g3">${campo('Data da entrevista', inp('dData', x.data, '', 'date'))}${campo('Escola', inp('dEscola', x.escola))}${campo('Profissional', inp('dProf', x.profissional))}</div>
      <h4>Entrevista</h4>${EOCA_Q.map((q, i) => campo(`${i + 1}) ${q}`, txt('q' + i, (x.resp || [])[i], '', 2), 'full')).join('')}
      <h4>Roteiro de observação — temática</h4>${cks('tem', EOCA_TEM, x.tem)}${campo('Observação', txt('dObsTem', x.obsTem, '', 2), 'full')}
      <h4>Dinâmica <small>(postura corporal, gestos, maneira de pegar os materiais, expressões, olhares)</small></h4>${cks('din', EOCA_DIN, x.din)}${campo('Observação', txt('dObsDin', x.obsDin, '', 2), 'full')}
      <h4>Produto <small>(o que o aluno realizou: desenho, escrita, construção)</small></h4>${cks('prod', EOCA_PROD, x.prod)}${campo('Observação', txt('dObsProd', x.obsProd, '', 2), 'full')}${campo('Conclusão', txt('dConc', x.conclusao, '', 4), 'full')}
      <h4>Quadro sugestivo de hipóteses</h4>${EOCA_HIP.map(([g, l], i) => `<p class="dica"><b>${g}</b></p>${cks('hip' + i, l, x['hip' + i])}`).join('')}${campo('Outras hipóteses', inp('dOutrasHip', x.outrasHip), 'full')}
      <h4>Modalidade de aprendizagem</h4>${cks('mod', EOCA_MOD.map(m => m[0]), x.mod)}
      <h4>Quadro E.O.C.A.</h4>${EOCA_QUADRO.map(([c, n]) => `<div class="g2">${campo(n + ' — ação do sujeito', txt('qa_' + c, x['qa_' + c], '', 2))}${campo(n + ' — possíveis causas', txt('qc_' + c, x['qc_' + c], '', 2))}</div>`).join('')}${campo('Delineamento da investigação', txt('dDelin', x.delineamento, '', 3), 'full')}`;
    if (k === 'pdi') h = `<p class="lembra">💡 Caro(a) professor(a), o planejamento pedagógico para alunos público-alvo da educação especial é organizado por meio do PDI (Plano de Desenvolvimento Individual). Este documento deve ser contínuo, construído desde o início do ano letivo, e deverá ser visto, revisto, adaptado e acrescido à medida que as metas traçadas forem sendo alcançadas. <small>(Esta orientação não sai na impressão.)</small></p><div class="g3">${campo('Período de execução', inp('dPer', x.periodo))}${campo('Data', inp('dData', x.data, '', 'date'))}${campo('Possui laudo', `<select id="dLaudo">${['', 'Sim', 'Não', 'Em investigação'].map(o => `<option ${x.laudo === o ? 'selected' : ''}>${o}</option>`).join('')}</select>`)}</div>
      ${campo('Tipo de deficiência / condição', inp('dDef', x.deficiencia), 'full')}
      <div class="g3">${campo('Nome da mãe', inp('dMae', x.mae))}${campo('Nome do pai', inp('dPai', x.pai))}${campo('Ou responsável', inp('dResp', x.responsavel))}</div>
      <div class="g3">${campo('Celular (mãe)', inp('dCelM', x.celMae, '', 'tel'))}${campo('Celular (pai)', inp('dCelP', x.celPai, '', 'tel'))}${campo('Celular (responsável)', inp('dCel', x.celular, '', 'tel'))}</div>
      <div class="g2">${campo('Professor(a) da sala regular', inp('dReg', x.regente))}${campo('Professor(a) do AEE', inp('dProf', x.profissional))}</div>
      ${campo('Âmbito familiar', txt('dFam', x.familiar, 'Rotina, apoio da família, informações relevantes', 3), 'full')}${campo('Âmbito escolar', txt('dEsc', x.escolar, 'Como está na escola, pontos fortes, dificuldades', 3), 'full')}${campo('Objetivo do plano', txt('dObj', x.objetivo, '', 3), 'full')}
      <div class="g3">${campo('Frequência semanal (Sala de Recursos)', rad('freq', PDI_FREQ, x.freq))}${campo('Tempo de atendimento', rad('tempo', PDI_TEMPO, x.tempo))}${campo('Composição do atendimento', rad('comp', PDI_COMP, x.comp))}</div>
      <h4>Atividades pedagógicas a serem desenvolvidas</h4>${campo('Função cognitiva', txt('dAtCog', x.atCog, '', 3), 'full')}${campo('Função motora', txt('dAtMot', x.atMot, '', 3), 'full')}${campo('Função social', txt('dAtSoc', x.atSoc, '', 3), 'full')}
      ${campo('Nível de leitura e escrita (psicogênese)', rad('leit', PDI_LEIT, x.leit), 'full')}${campo('Estágios matemáticos e desenvolvimento emocional', txt('dMatEmo', x.matEmo, '', 3), 'full')}
      <h4>Avaliação por funções</h4>${PDI_RES.map(([c, n]) => campo(n, txt(c, x[c], '', 2), 'full')).join('')}
      <h4>Detalhamento</h4>${PDI_DET.map(([g, l]) => l.map(([c, n]) => campo(l.length > 1 ? g + ' — ' + n : n, txt(c, x[c], '', 2), 'full')).join('')).join('')}`;
    if (k === 'rda') h = `<div class="g3">${campo('Período', inp('dPer', x.periodo))}${campo('Data do relatório', inp('dData', x.data, '', 'date'))}${campo('Área de deficiência', inp('dArea', x.area))}</div>
      <div class="g2">${campo('Professor(a) da sala regular', inp('dReg', x.regente))}${campo('Professor(a) do AEE', inp('dProf', x.profissional))}</div>
      ${RDA_SEC.map(([c, n, ph]) => campo(n, txt('s_' + c, x[c], ph, 3), 'full')).join('')}`;
    if (k === 'rea') h = `<div class="g3">${campo('Profissional', inp('dProf', x.profissional))}${campo('Cargo', inp('dCargo', x.cargo))}${campo('Diagnóstico', inp('dDiag', x.diagnostico))}</div>
      <div class="g3">${campo('Período — de', inp('dDe', x.de, '', 'date'))}${campo('até', inp('dAte', x.ate, '', 'date'))}${campo('Data do documento', inp('dData', x.data, '', 'date'))}</div>
      <h4>Registro de intervenções</h4><p class="dica">Uma linha por encontro. Use “Puxar atendimentos” para trazer o que já foi registrado na aba Atendimentos no período escolhido.</p>
      <div id="reaLin">${(x.linhas || []).map(linhaRea).join('')}</div><div class="acoes"><button type="button" class="b" id="reaMais">➕ Linha</button><button type="button" class="b" id="reaPuxa">⤵ Puxar atendimentos do período</button></div>`;
    $('#cont').innerHTML = `<form id="fDoc" class="ficha"><h3>${ic} ${x.id ? 'Editar' : 'Novo'}: ${nome} (${sig})</h3>${h}<div class="acoes"><button class="b main" type="submit">💾 Salvar</button><button class="b ghost" type="button" id="cancDoc">Cancelar</button></div></form>`;
    $('#cancDoc').onclick = () => { edit = null; relatorios(); };
    if (k === 'rea') { $('#reaMais').onclick = () => $('#reaLin').insertAdjacentHTML('beforeend', linhaRea({})); $('#reaLin').onclick = e => { if (e.target.matches('.rea-x')) e.target.closest('.rea-l').remove(); };
      $('#reaPuxa').onclick = async () => { const de = val('dDe'), ate = val('dAte'); const at = (await todos('atend')).filter(o => o.aluno === atual.id && (!de || o.data >= de) && (!ate || o.data <= ate)).sort((a, b) => (a.data || '').localeCompare(b.data || ''));
        if (!at.length) return alert('Nenhum atendimento registrado nesse período.'); $('#reaLin').insertAdjacentHTML('beforeend', at.map(o => linhaRea({ data: o.data, estrategias: [o.atividades, [...(o.recursos || []), o.recOutro].filter(Boolean).join(', ')].filter(Boolean).join('\nRecursos: '), objetivos: o.objetivo, avaliacao: [o.participacao, o.observacoes].filter(Boolean).join(' — ') })).join('')); }; }
    $('#fDoc').onsubmit = async e => { e.preventDefault(); const f = e.target; const o = Object.assign(x.id ? x : { id: novoId(), aluno: atual.id, criado: Date.now() }, { tipo: k, data: val('dData') || hoje(), profissional: val('dProf').trim() });
      if (k === 'eoca') { Object.assign(o, { escola: val('dEscola').trim(), resp: EOCA_Q.map((_, i) => val('q' + i).trim()), tem: marcados(f, 'tem'), din: marcados(f, 'din'), prod: marcados(f, 'prod'), obsTem: val('dObsTem').trim(), obsDin: val('dObsDin').trim(), obsProd: val('dObsProd').trim(), conclusao: val('dConc').trim(), mod: marcados(f, 'mod'), outrasHip: val('dOutrasHip').trim(), delineamento: val('dDelin').trim() }); EOCA_HIP.forEach((_, i) => { o['hip' + i] = marcados(f, 'hip' + i); }); EOCA_QUADRO.forEach(([c]) => { o['qa_' + c] = val('qa_' + c).trim(); o['qc_' + c] = val('qc_' + c).trim(); }); }
      if (k === 'pdi') { Object.assign(o, { periodo: val('dPer').trim(), laudo: val('dLaudo'), deficiencia: val('dDef').trim(), mae: val('dMae').trim(), pai: val('dPai').trim(), responsavel: val('dResp').trim(), celMae: val('dCelM').trim(), celPai: val('dCelP').trim(), celular: val('dCel').trim(), regente: val('dReg').trim(), familiar: val('dFam').trim(), escolar: val('dEsc').trim(), objetivo: val('dObj').trim(), freq: umRad(f, 'freq'), tempo: umRad(f, 'tempo'), comp: umRad(f, 'comp'), atCog: val('dAtCog').trim(), atMot: val('dAtMot').trim(), atSoc: val('dAtSoc').trim(), leit: umRad(f, 'leit'), matEmo: val('dMatEmo').trim() }); PDI_RES.forEach(([c]) => { o[c] = val(c).trim(); }); PDI_DET.forEach(([, l]) => l.forEach(([c]) => { o[c] = val(c).trim(); })); }
      if (k === 'rda') { Object.assign(o, { periodo: val('dPer').trim(), area: val('dArea').trim(), regente: val('dReg').trim() }); RDA_SEC.forEach(([c]) => { o[c] = val('s_' + c).trim(); }); }
      if (k === 'rea') { Object.assign(o, { cargo: val('dCargo').trim(), diagnostico: val('dDiag').trim(), de: val('dDe'), ate: val('dAte'), periodo: [fmt(val('dDe')), fmt(val('dAte'))].filter(Boolean).join(' a '), linhas: [...document.querySelectorAll('.rea-l')].map(r => ({ data: r.querySelector('.rl-d').value, estrategias: r.querySelector('.rl-e').value.trim(), objetivos: r.querySelector('.rl-o').value.trim(), avaliacao: r.querySelector('.rl-a').value.trim() })).filter(l => l.data || l.estrategias || l.objetivos || l.avaliacao) }); }
      await gravar('docs', o); edit = null; aviso(sig + ' salvo.'); relatorios(); };
  }
  const linhaRea = l => `<div class="rea-l"><input type="date" class="rl-d" value="${esc(l.data || '')}"><textarea class="rl-e" rows="2" placeholder="Estratégias e atividades">${esc(l.estrategias || '')}</textarea><textarea class="rl-o" rows="2" placeholder="Objetivos / capacidades">${esc(l.objetivos || '')}</textarea><textarea class="rl-a" rows="2" placeholder="Avaliação / evolução">${esc(l.avaliacao || '')}</textarea><button type="button" class="b ghost rea-x" title="Tirar linha">✕</button></div>`;
  /* impressão dos relatórios */
  const MESES_A = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const dataExt = d => { if (!d) return `_____ de ____________________ de ${new Date().getFullYear()}`; const [y, m, dd] = d.split('-'); return `${+dd} de ${MESES_A[+m - 1]} de ${y}`; };
  const linhasV = n => '<p class="ae-l">&nbsp;</p>'.repeat(n);
  const resp = (v, n) => v ? `<p class="ae-r">${br(v)}</p>` : linhasV(n);
  const secA = (t, quebra) => `<p class="ae-sec"${quebra ? ' style="page-break-before:always;break-before:page"' : ''}>${t}</p>`;
  const ckTab = (lista, marc, cols) => { cols = cols || 2; const m = marc || []; let h = ''; for (let i = 0; i < lista.length; i += cols) h += `<tr>${lista.slice(i, i + cols).map(x => `<td width="${Math.floor(100 / cols)}%">${m.includes(x) ? '☒' : '☐'} ${esc(x)}</td>`).join('')}${i + cols > lista.length ? '<td></td>'.repeat(i + cols - lista.length) : ''}</tr>`; return `<table class="ae-ck" width="100%">${h}</table>`; };
  const opts = (rot, lista, v) => `<p class="ae-op"><b>${rot}:</b> ${lista.map(x => `${v === x ? '☒' : '☐'} ${esc(x)}`).join('&nbsp;&nbsp;&nbsp; ')}</p>`;
  const rotV = (r, v, n) => v ? `<p class="ae-q"><b>${r}:</b> ${br(v)}</p>` : `<p class="ae-q"><b>${r}:</b></p>${linhasV(n || 1)}`;
  const blocoL = (t, v, n) => v ? bloco(t, v) : `<div class="doc-b ae-bl"><h4>${t}</h4></div>${linhasV(n || 3)}`;
  const fecho = (x, nomes) => `<p class="doc-fim ae-data">São Miguel do Guamá — PA, ${dataExt(x.data)}.</p>${assin(nomes)}`;
  function docEoca(a, x) {
    const r = x.resp || [];
    return cab('ENTREVISTA OPERATIVA CENTRADA NA APRENDIZAGEM') + `<table class="doc-id">${linha('Nome', esc(a.nome))}${linha('Idade', esc(idade(a.nascimento)))}${linha('Escola', esc(x.escola || 'Sistema de Ensino Incentivo'))}${linha('Ano', esc(serieA(a)))}${linha('Data da entrevista', fmt(x.data))}</table>`
      + secA('ENTREVISTA') + EOCA_Q.map((q, i) => `<p class="ae-q"><b>${i + 1})</b> ${esc(q)}</p>${resp(r[i], i === 3 ? 1 : 2)}`).join('')
      + secA('ROTEIRO DE OBSERVAÇÃO — E.O.C.A.') + '<p class="ae-q"><b>Em relação à temática</b></p>' + ckTab(EOCA_TEM, x.tem) + rotV('Observação', x.obsTem, 3)
      + '<p class="ae-q"><b>Em relação à dinâmica</b> <small>(postura corporal, gestos, maneira de pegar os materiais, expressões faciais, olhares)</small></p>' + ckTab(EOCA_DIN, x.din) + rotV('Observação', x.obsDin, 3)
      + '<p class="ae-q"><b>Em relação ao produto</b> <small>(o que o(a) aluno(a) realizou: o que deixa impresso no papel ou na sua construção)</small></p>' + ckTab(EOCA_PROD, x.prod) + rotV('Observação', x.obsProd, 3) + rotV('Conclusão', x.conclusao, 5)
      + secA('QUADRO SUGESTIVO DE HIPÓTESES') + EOCA_HIP.map(([g, l], i) => `<table class="ae-tb" width="100%"><thead><tr><th width="90%">${g.toUpperCase()}</th><th width="10%">✓</th></tr></thead><tbody>${l.map(it => `<tr><td>${esc(it)}</td><td align="center">${(x['hip' + i] || []).includes(it) ? '✓' : ''}</td></tr>`).join('')}</tbody></table>`).join('') + rotV('Outras hipóteses', x.outrasHip, 1)
      + secA('QUADRO DE MODALIDADES DE APRENDIZAGEM') + `<table class="ae-tb" width="100%"><thead><tr><th width="26%">MODALIDADE</th><th width="64%">CARACTERÍSTICAS</th><th width="10%">✓</th></tr></thead><tbody>${EOCA_MOD.map(([m, dsc]) => `<tr><td><b>${m.toUpperCase()}</b></td><td>${dsc}</td><td align="center">${(x.mod || []).includes(m) ? '✓' : ''}</td></tr>`).join('')}</tbody></table>`
      + secA('QUADRO E.O.C.A.') + `<table class="ae-tb ae-alto" width="100%"><thead><tr><th width="26%">ASPECTOS</th><th width="37%">AÇÃO DO SUJEITO</th><th width="37%">POSSÍVEIS CAUSAS</th></tr></thead><tbody>${EOCA_QUADRO.map(([c, n]) => `<tr><td><b>${n}</b></td><td>${x['qa_' + c] ? br(x['qa_' + c]) : '&nbsp;'}</td><td>${x['qc_' + c] ? br(x['qc_' + c]) : '&nbsp;'}</td></tr>`).join('')}<tr><td colspan="3"><b>Delineamento da investigação:</b> ${x.delineamento ? br(x.delineamento) : '<br><br><br>'}</td></tr></tbody></table>`
      + fecho(x, [`<b>${esc(x.profissional || '')}</b><br>Profissional do AEE`]);
  }
  function docPdi(a, x) {
    return cab('PLANO DE DESENVOLVIMENTO INDIVIDUAL — PDI')
      + secA('IDENTIFICAÇÃO') + `<table class="doc-id">${linha('Período de execução', esc(x.periodo))}${linha('Escola', 'Sistema de Ensino Incentivo')}${linha('Nome', esc(a.nome))}${linha('Ano escolar / turma / turno', esc([a.serie, a.classe, a.turno].filter(Boolean).join(' · ')))}${linha('Data de nascimento', fmt(a.nascimento))}${linha('Tipo de deficiência', esc(x.deficiencia))}${linha('Possui laudo', esc(x.laudo))}${linha('Nome da mãe', esc(x.mae))}${linha('Nome do pai', esc(x.pai))}${linha('Ou responsável', esc(x.responsavel))}${linha('Celular', esc([x.celMae && 'Mãe: ' + x.celMae, x.celPai && 'Pai: ' + x.celPai, x.celular && 'Responsável: ' + x.celular].filter(Boolean).join(' · ')))}${linha('Professor(a) da sala regular', esc(x.regente))}${linha('Professor(a) do AEE', esc(x.profissional))}</table>`
      + blocoL('Âmbito familiar', x.familiar) + blocoL('Âmbito escolar', x.escolar) + blocoL('Objetivo do plano', x.objetivo)
      + secA('ORGANIZAÇÃO DO ATENDIMENTO') + opts('Frequência semanal na Sala de Recursos Multifuncional', PDI_FREQ, x.freq) + opts('Tempo de atendimento', PDI_TEMPO, x.tempo) + opts('Composição do atendimento', PDI_COMP, x.comp)
      + secA('ATIVIDADES PEDAGÓGICAS A SEREM DESENVOLVIDAS') + blocoL('Função cognitiva', x.atCog, 4) + blocoL('Função motora', x.atMot, 4) + blocoL('Função social', x.atSoc, 4)
      + opts('Nível de leitura e escrita (psicogênese)', PDI_LEIT, x.leit) + rotV('Estágios matemáticos e desenvolvimento emocional', x.matEmo, 2)
      + secA('AVALIAÇÃO POR FUNÇÕES') + PDI_RES.map(([c, n]) => rotV(n, x[c], 2)).join('')
      + secA('DETALHAMENTO DA FUNÇÃO COGNITIVA, LINGUAGEM, MOTORA E SOCIAL') + PDI_DET.map(([g, l]) => `<p class="ae-q"><b>${g.toUpperCase()}</b></p>` + l.map(([c, n]) => l.length > 1 ? rotV(n, x[c], 1) : resp(x[c], 2)).join('')).join('')
      + fecho(x, [`<b>${esc(x.profissional || '')}</b><br>Professor(a) do AEE`, `<b>${esc(x.regente || '')}</b><br>Professor(a) da sala regular`, 'Coordenação Pedagógica', 'Responsável']);
  }
  function docRda(a, x) {
    const tem = RDA_SEC.some(([c]) => x[c]);
    return cab('RELATÓRIO DE DESENVOLVIMENTO DO ALUNO — RDA') + `<table class="doc-id">${linha('Aluno(a)', esc(a.nome))}${linha('Data de nascimento', fmt(a.nascimento))}${linha('Ano', esc(serieA(a)))}${linha('Área de deficiência', esc(x.area))}${linha('Professor(a) da sala regular', esc(x.regente))}${linha('Professor(a) do AEE', esc(x.profissional))}${linha('Período', esc(x.periodo))}</table>`
      + (tem ? RDA_SEC.filter(([c]) => x[c]).map(([c, n]) => bloco(n, x[c])).join('') : secA('RELATÓRIO') + linhasV(14))
      + fecho(x, [`<b>${esc(x.profissional || '')}</b><br>Professor(a) do AEE`, 'Coordenação Pedagógica']);
  }
  function docRea(a, x) {
    const ls = (x.linhas || []).length ? x.linhas : Array.from({ length: 5 }, () => ({}));
    return cab('RELATÓRIO DE EVOLUÇÃO DO ALUNO — REA') + '<p class="ae-sub">Registro de intervenções e estratégias neuropsicopedagógicas</p>'
      + `<table class="doc-id">${linha(esc(x.cargo || 'Profissional'), esc(x.profissional))}${linha('Período', esc(x.periodo))}${linha('Aluno(a)', esc(a.nome))}${linha('Data de nascimento', fmt(a.nascimento))}${linha('Ano / série', esc(serieA(a)))}${linha('Diagnóstico', esc(x.diagnostico))}</table>`
      + `<table class="ae-tb ae-rea" width="100%"><thead><tr><th width="12%">DATA</th><th width="32%">ESTRATÉGIAS E ATIVIDADES</th><th width="28%">OBJETIVOS / CAPACIDADES</th><th width="28%">AVALIAÇÃO / EVOLUÇÃO</th></tr></thead><tbody>${ls.map(l => `<tr class="ae-rl"><td align="center">${fmt(l.data) || '&nbsp;'}</td><td>${l.estrategias ? br(l.estrategias) : '&nbsp;'}</td><td>${l.objetivos ? br(l.objetivos) : '&nbsp;'}</td><td>${l.avaliacao ? br(l.avaliacao) : '&nbsp;'}</td></tr>`).join('')}</tbody></table>`
      + fecho(x, [`<b>${esc(x.profissional || '')}</b><br>${esc(x.cargo || 'Profissional do AEE')}`, 'Responsável familiar']);
  }
  const DOC_FN = { eoca: docEoca, pdi: docPdi, rda: docRda, rea: docRea };
  const docDe = async (tipo, id) => id ? (await todos('docs')).find(o => o.id === id) : Object.assign(novoDoc(tipo), { data: '' });
  /* ---------- impressão no formato da escola ---------- */
  // Cabeçalho: a arte aprovada do site (mascote, Nº 1 em aprovação e logo) com o título na faixa
  const tamTit = t => t.length <= 24 ? Math.min(22, Math.round(330 / Math.max(8, t.length) * 10) / 10) : Math.max(8.5, Math.min(11.5, Math.round(600 / t.length * 10) / 10));
  const cab0 = titulo => `<div class="sei-cab"><div class="sei-cab-tx"><strong class="${titulo.length > 24 ? 'duas' : ''}" style="font-size:${tamTit(titulo)}pt">${esc(titulo)}</strong></div></div><div class="sei-fita"><b>SISTEMA DE ENSINO INCENTIVO</b> · ATENDIMENTO EDUCACIONAL ESPECIALIZADO</div>`;
  // cabeçalho institucional (o mesmo da Secretaria e da Coordenação); o parecer mantém a capa própria
  let FOLHA = null, nCabA = 0;
  const cab = titulo => !FOLHA ? cab0(titulo) : (nCabA++ ? `<img class="folha-banda" src="${FOLHA.banda}" alt="">` : `<img class="folha-cab" src="${FOLHA.cab}" alt="">`);
  const NOME_DOC = { perfil: 'Ficha do Aluno', atend: 'Ficha de Atendimento', 'atend-todos': 'Ficha de Atendimento', pei: 'Plano Educacional Individualizado', eoca: 'Entrevista Operativa (EOCA)', pdi: 'Plano de Desenvolvimento Individual', rda: 'Relatório de Desenvolvimento', rea: 'Relatório de Evolução' };
  async function prepFolha(tipo, x) {
    FOLHA = null; nCabA = 0; document.body.classList.remove('folha');
    if (!window.seiFolha || !NOME_DOC[tipo] || !atual) return;
    const tit = NOME_DOC[tipo], dt = x && x.data ? fmt(x.data) : DOC_FN[tipo] ? '' : x && x.ano ? (x.periodo || '') + ' ' + x.ano : fmt(new Date().toISOString().slice(0, 10));
    const o = { estilo: 'formal', titulo: tit, curto: tit, placa: { grande: 'AEE', linhas: ['ATENDIMENTO', 'EDUCACIONAL'] }, campos: [['Documento', tit], ['Aluno(a)', atual.nome || ''], ['Data', dt], ['Turma', [atual.serie, atual.classe].filter(Boolean).join(' ')]], selo: ['COD. INEP', '15590798'], rodape: ['AEE', 'Atendimento Educacional Especializado'], num: 'SEI' };
    FOLHA = await window.seiFolha.compor(o); nCabA = 0;
    document.body.classList.add('folha'); document.body.style.setProperty('--fundo-doc', `url(${FOLHA.fundo})`);
  }
  const rodape = () => `<div class="sei-rod"><span>📍 Tv. Padre Sátiro, 442 — São Miguel do Guamá/PA</span><span>📞 (91) 9 8124-8323</span><span>📷 @_sei01</span><span class="rod-qr"><img src="assets/docs/qr-whatsapp.png" width="62" alt="QR Code do WhatsApp da escola"><br>Fale com a escola</span></div>`;
  const linha = (r, v) => `<tr><th>${r}</th><td>${v || '&nbsp;'}</td></tr>`;
  const bloco = (t, v, alto) => `<div class="doc-b"><h4>${t}</h4><div class="doc-t${alto ? ' alto' : ''}">${v ? br(v) : '&nbsp;'}</div></div>`;
  const idAluno = a => `<table class="doc-id">${linha('Aluno(a)', esc(a.nome))}${linha('Série / turma / turno', esc([a.serie, a.classe, a.turno].filter(Boolean).join(' · ')))}${linha('Data de nascimento', fmt(a.nascimento))}${linha('Necessidades', esc(necTxt(a)))}</table>`;
  const assin = ns => `<div class="doc-ass">${ns.map(n => `<div><span></span>${n}</div>`).join('')}</div>`;
  function docPerfil(a) {
    return cab('FICHA DO ALUNO') + idAluno(a) + `<table class="doc-id">${linha('Responsável', esc(a.responsavel) + (a.telefone ? ' · ' + esc(a.telefone) : ''))}${linha('Professor(a) regente', esc(a.regente))}${linha('Profissional do AEE', esc(a.profissional))}</table>`
      + bloco('Laudo / informações de saúde', a.laudo) + bloco('Pontos fortes', a.fortes) + bloco('Interesses', a.interesses) + bloco('Dificuldades', a.dificuldades) + bloco('Como aprende melhor', aprTxt(a))
      + assin(['Profissional do AEE', 'Responsável']) + rodape();
  }
  function docAtend(a, x) {
    return `<div class="doc-pag">${cab('FICHA DE ATENDIMENTO')}${idAluno(a)}<table class="doc-id">${linha('Data / horário', fmt(x.data) + (x.inicio ? ' · ' + esc(x.inicio) + (x.fim ? ' às ' + esc(x.fim) : '') : ''))}${linha('Tipo de atendimento', esc(x.modalidade))}${linha('Profissional', esc(x.profissional))}</table>`
      + bloco('Objetivo', x.objetivo) + bloco('Atividades realizadas', x.atividades, true) + bloco('Recursos utilizados', [...(x.recursos || []), x.recOutro].filter(Boolean).join(', '))
      + `<div class="doc-b"><h4>Participação do aluno</h4><div class="doc-t doc-op">${PARTICIPA.map(p => `<span>${x.participacao === p ? '☒' : '☐'} ${p}</span>`).join('')}</div></div>`
      + bloco('Comportamento e observações', x.observacoes, true) + bloco('Próximos passos', x.proximos) + assin(['Profissional do AEE', 'Coordenação']) + rodape() + '</div>';
  }
  function docPei(a, x) {
    return cab('PLANO EDUCACIONAL INDIVIDUALIZADO — PEI') + idAluno(a) + `<table class="doc-id">${linha('Período', esc(x.periodo + ' de ' + x.ano))}${linha('Frequência do AEE', esc(x.frequencia))}${linha('Professor(a) regente', esc(a.regente))}${linha('Profissional do AEE', esc(x.profissional))}</table>`
      + bloco('Necessidades educacionais', x.necessidades) + bloco('Potencialidades', x.potencialidades)
      + `<div class="doc-b"><h4>Objetivos para o período</h4><table class="doc-obj">${AREAS.map(([k, n]) => `<tr><th>${n}</th><td>${x['obj_' + k] ? br(x['obj_' + k]) : '&nbsp;'}</td></tr>`).join('')}</table></div>`
      + bloco('Adaptações nas aulas e avaliações', [...(x.adaptacoes || []), x.adaptacoesTxt].filter(Boolean).join('; ')) + bloco('Recursos e tecnologia assistiva', x.recursos) + bloco('Estratégias de ensino', x.estrategias)
      + bloco('Orientações ao professor regente e à família', x.orientacoes) + bloco('Como será avaliado', x.avaliacao) + (x.revisao ? `<p class="doc-rev">Revisão prevista em ${fmt(x.revisao)}.</p>` : '')
      + assin(['Profissional do AEE', 'Professor(a) regente', 'Coordenação', 'Responsável']) + rodape();
  }
  async function montarDoc(tipo, id) {
    if (tipo === 'perfil') return docPerfil(atual);
    if (tipo === 'atend') return docAtend(atual, (await todos('atend')).find(x => x.id === id));
    if (tipo === 'atend-todos') return (await todos('atend')).filter(x => x.aluno === atual.id).sort((a, b) => (a.data || '').localeCompare(b.data || '')).map(x => docAtend(atual, x)).join('');
    if (tipo === 'pei') return docPei(atual, (await todos('pei')).find(x => x.id === id));
    if (tipo === 'parecer') return docParecer(atual, (await todos('parecer')).find(x => x.id === id));
    if (DOC_FN[tipo]) return DOC_FN[tipo](atual, await docDe(tipo, id));
    return '';
  }
  async function baixarAee(fmt, tipo, id) {
    const xs = tipo === 'atend' ? (await todos('atend')).find(x => x.id === id) : tipo === 'pei' ? (await todos('pei')).find(x => x.id === id) : DOC_FN[tipo] ? await docDe(tipo, id) : null;
    await prepFolha(tipo, xs); const h = await montarDoc(tipo, id); const nome = ({ perfil: 'Ficha do aluno', atend: 'Ficha de atendimento', pei: 'PEI', parecer: 'Parecer neuropsicopedagógico', 'atend-todos': 'Atendimentos', eoca: 'EOCA', pdi: 'PDI', rda: 'RDA', rea: 'REA' })[tipo] + ' - ' + atual.nome;
    return fmt === 'pdf' ? seiBaixar.pdf(h, nome, FOLHA) : seiBaixar.word(h, nome, '', FOLHA);
  }
  async function imprimir(tipo, id) {
    let h = ''; await prepFolha(tipo, tipo === 'atend' ? (await todos('atend')).find(x => x.id === id) : tipo === 'pei' ? (await todos('pei')).find(x => x.id === id) : DOC_FN[tipo] ? await docDe(tipo, id) : null);
    if (tipo === 'perfil') h = docPerfil(atual);
    if (tipo === 'atend') h = docAtend(atual, (await todos('atend')).find(x => x.id === id));
    if (tipo === 'atend-todos') h = (await todos('atend')).filter(x => x.aluno === atual.id).sort((a, b) => (a.data || '').localeCompare(b.data || '')).map(x => docAtend(atual, x)).join('');
    if (tipo === 'pei') h = docPei(atual, (await todos('pei')).find(x => x.id === id));
    if (tipo === 'parecer') h = await docParecer(atual, (await todos('parecer')).find(x => x.id === id));
    if (DOC_FN[tipo]) h = DOC_FN[tipo](atual, await docDe(tipo, id));
    $('#imprimir').innerHTML = h;
    await Promise.all([...document.querySelectorAll('#imprimir img')].map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; })));
    window.print();
  }

  /* ---------- prévia em janela ---------- */
  const MODELO = { atend: () => ({ data: hoje(), profissional: (atual || {}).profissional }), pei: () => ({ ano: String(new Date().getFullYear()), periodo: new Date().getMonth() < 6 ? '1º semestre' : '2º semestre' }), parecer: () => ({ data: hoje(), ano: String(new Date().getFullYear()) }) };
  async function verPrevia(tipo, id) {
    let w = $('#pvJan'); if (!w) { document.body.insertAdjacentHTML('beforeend', '<div id="pvJan" class="pv-jan no-print"><div class="pv-jan-in"><div class="pv-bar"><b>👁 Prévia</b><small id="pvJanSub"></small><button type="button" class="b ghost" id="pvJanX">✕ Fechar</button></div><div class="pv-box" id="pvJanBox"><div class="pv-pag sei-pdf" id="pvJanPag"></div></div></div></div>'); w = $('#pvJan'); $('#pvJanX').onclick = () => { w.hidden = true; }; w.onclick = e => { if (e.target === w) w.hidden = true; }; }
    w.hidden = false; const pag = $('#pvJanPag'); pag.innerHTML = '<p style="padding:20mm;text-align:center;font-size:14pt">Carregando…</p>';
    const a = atual && (atual.nome || atual.id) ? atual : { nome: '', necessidades: [], aprende: [] }; const guard = atual; atual = a;
    let x = null; if (DOC_FN[tipo]) x = await docDe(tipo, id); else if (id) x = (await todos(tipo === 'atend' ? 'atend' : tipo)).find(o => o.id === id); else if (MODELO[tipo]) x = MODELO[tipo]();
    $('#pvJanSub').textContent = id ? '' : 'Modelo em branco';
    await prepFolha(tipo, x); let h = '';
    if (tipo === 'perfil') h = docPerfil(a); if (tipo === 'atend') h = docAtend(a, x); if (tipo === 'pei') h = docPei(a, x); if (tipo === 'parecer') h = await docParecer(a, x); if (DOC_FN[tipo]) h = DOC_FN[tipo](a, x);
    atual = guard; pag.innerHTML = h; pag.style.setProperty('--pvfundo', FOLHA && FOLHA.fundo ? `url(${FOLHA.fundo})` : 'url(assets/docs/moldura-doc.jpg?v=3)');
    await Promise.all([...pag.querySelectorAll('img')].map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; })));
    const box = $('#pvJanBox'); const k = box.clientWidth / pag.offsetWidth; pag.style.transform = `scale(${k})`; box.style.height = Math.ceil(pag.offsetHeight * k) + 'px';
  }
  /* ---------- eventos ---------- */
  let avT = null;
  function aviso(t) { let a = $('#aeeAviso'); if (!a) { a = document.createElement('div'); a.id = 'aeeAviso'; a.className = 'no-print'; document.body.append(a); } a.textContent = '✅ ' + t; a.hidden = false; clearTimeout(avT); avT = setTimeout(() => { a.hidden = true; }, 2500); }
  document.addEventListener('click', async e => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.al) { atual = alunos.find(a => a.id === t.dataset.al); aba = 'perfil'; edit = null; lista(); painel(); if (innerWidth < 800) $('#painel').scrollIntoView(); return; }
    if (t.dataset.aba && t.closest('.abas-al')) { aba = t.dataset.aba; edit = null; painel(); return; }
    if (t.dataset.vermod) { verPrevia(t.dataset.vermod); return; }
    if (t.dataset.ver) { verPrevia(t.dataset.ver, t.dataset.id); return; }
    if (t.dataset.imp) { imprimir(t.dataset.imp, t.dataset.id); return; }
    if (t.dataset.baixa) { baixarAee(t.dataset.baixa, t.dataset.imp2, t.dataset.id); return; }
    if (t.dataset.edat) { edit = { tipo: 'atend', obj: (await todos('atend')).find(x => x.id === t.dataset.edat) }; atend(); }
    if (t.dataset.delat && confirm('Excluir este atendimento?')) { await apagar('atend', t.dataset.delat); atend(); }
    if (t.dataset.edpei) { edit = { tipo: 'pei', obj: (await todos('pei')).find(x => x.id === t.dataset.edpei) }; pei(); }
    if (t.dataset.duppei) { const o = JSON.parse(JSON.stringify((await todos('pei')).find(x => x.id === t.dataset.duppei))); delete o.id; o.revisao = ''; edit = { tipo: 'pei', obj: o }; pei(); }
    if (t.dataset.delpei && confirm('Excluir este PEI?')) { await apagar('pei', t.dataset.delpei); pei(); }
    if (t.dataset.edpar) { edit = { tipo: 'parecer', obj: (await todos('parecer')).find(x => x.id === t.dataset.edpar) }; parecer(); }
    if (t.dataset.delpar && confirm('Excluir este parecer?')) { await apagar('parecer', t.dataset.delpar); parecer(); }
    if (t.dataset.novodoc) { edit = { tipo: 'doc', obj: novoDoc(t.dataset.novodoc) }; relatorios(); }
    if (t.dataset.eddoc) { edit = { tipo: 'doc', obj: (await todos('docs')).find(x => x.id === t.dataset.eddoc) }; relatorios(); }
    if (t.dataset.deldoc && confirm('Excluir este documento?')) { await apagar('docs', t.dataset.deldoc); relatorios(); }
  });
  $('#novoAluno').onclick = () => { atual = { necessidades: [], aprende: [] }; aba = 'perfil'; edit = null; lista(); $('#painel').innerHTML = `<div class="topo-al"><h2>Novo aluno</h2></div><section id="cont"></section>`; perfil(); setTimeout(() => $('#pNome').focus(), 50); };
  $('#busca').oninput = lista;
  const baixar = (txt, nome) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'application/json' })); a.download = nome; document.body.append(a); a.click(); a.remove(); };
  $('#exp').onclick = async () => baixar(JSON.stringify({ tipo: 'sei-aee', versao: 1, exportado: new Date().toISOString(), alunos: await todos('alunos'), atend: await todos('atend'), pei: await todos('pei'), parecer: await todos('parecer'), docs: await todos('docs') }), `aee-sei-${hoje()}.json`);
  $('#imp').onchange = async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try { const j = JSON.parse(await f.text()); if (j.tipo !== 'sei-aee') throw 0; for (const st of ['alunos', 'atend', 'pei', 'parecer', 'docs']) for (const o of j[st] || []) await gravar(st, o); alert(`${(j.alunos || []).length} aluno(s) importado(s).`); carregar(); }
    catch (err) { alert('Este arquivo não é uma cópia do AEE da Biblioteca SEI.'); }
  };
  carregar();
})();
