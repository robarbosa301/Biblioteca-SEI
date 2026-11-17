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
    const r = indexedDB.open('sei-aee', 2);
    r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains('alunos')) d.createObjectStore('alunos', { keyPath: 'id' }); for (const n of ['atend', 'pei', 'parecer']) if (!d.objectStoreNames.contains(n)) d.createObjectStore(n, { keyPath: 'id' }).createIndex('aluno', 'aluno'); };
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
    const abas = [['perfil', '👤 Perfil'], ['atend', '🗂️ Atendimentos'], ['pei', '🎯 PEI'], ['parecer', '📄 Parecer'], ['ativ', '✏️ Atividade adaptada']];
    p.innerHTML = `<div class="topo-al"><h2>${esc(atual.nome)}</h2><small>${esc([atual.serie, atual.classe, atual.turno].filter(Boolean).join(' · '))}</small></div>
      <nav class="abas-al">${abas.map(([k, n]) => `<button data-aba="${k}" class="${aba === k ? 'on' : ''}">${n}</button>`).join('')}</nav><section id="cont"></section>`;
    ({ perfil, atend, pei, parecer, ativ })[aba]();
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
      <div class="acoes"><button class="b main" type="submit">💾 Salvar</button>${atual.id ? `<button class="b" type="button" data-imp="perfil">🖨 Imprimir ficha do aluno</button><button class="b" type="button" data-baixa="word" data-imp2="perfil">⬇ Word</button><button class="b" type="button" data-baixa="pdf" data-imp2="perfil">⬇ PDF</button><button class="b ghost" type="button" id="delAluno">Excluir aluno</button>` : ''}</div>
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
      for (const st of ['atend', 'pei', 'parecer']) for (const x of (await todos(st)).filter(x => x.aluno === atual.id)) await apagar(st, x.id);
      await apagar('alunos', atual.id); atual = null; aba = 'perfil'; carregar();
    };
  }
  const necTxt = a => [...(a.necessidades || []), a.necOutra].filter(Boolean).join(', ');
  const aprTxt = a => [...(a.aprende || []), a.aprendeOutra].filter(Boolean).join(', ');

  // Atendimentos
  async function atend() {
    const l = (await todos('atend')).filter(x => x.aluno === atual.id).sort((a, b) => (b.data || '').localeCompare(a.data || ''));
    if (edit && edit.tipo === 'atend') return formAtend(edit.obj);
    $('#cont').innerHTML = `<div class="acoes"><button class="b main" id="novoAt">➕ Registrar atendimento</button>${l.length ? `<button class="b" data-imp="atend-todos">🖨 Imprimir todos (${l.length})</button>` : ''}</div>
      ${l.length ? `<div class="cards">${l.map(x => `<article class="aula"><div class="topo"><b>${fmt(x.data)}${x.inicio ? ' · ' + esc(x.inicio) + (x.fim ? '–' + esc(x.fim) : '') : ''}</b><span class="tag">${esc(x.modalidade || 'Individual')}</span></div>
        <h3>${esc(x.objetivo || 'Atendimento')}</h3>${x.participacao ? `<p class="cont"><b>${esc(x.participacao)}</b></p>` : ''}<p class="cont">${esc((x.atividades || '').slice(0, 160))}</p>
        <div class="acoes"><button class="b main" data-imp="atend" data-id="${x.id}">🖨 Imprimir</button><button class="b" data-baixa="word" data-imp2="atend" data-id="${x.id}">⬇ Word</button><button class="b" data-baixa="pdf" data-imp2="atend" data-id="${x.id}">⬇ PDF</button><button class="b" data-edat="${x.id}">Editar</button><button class="b ghost" data-delat="${x.id}">Excluir</button></div></article>`).join('')}</div>`
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
      <div class="acoes"><button class="b main" id="novoPei">➕ Novo PEI</button></div>
      ${l.length ? `<div class="cards">${l.map(x => `<article class="aula"><div class="topo"><b>${esc(x.periodo)} de ${esc(x.ano)}</b><span class="tag">PEI</span></div>
        <h3>${esc(x.frequencia || '')}</h3><p class="cont">${esc((x.obj_cognitivo || x.obj_comunicacao || '').slice(0, 150))}</p>
        <div class="acoes"><button class="b main" data-imp="pei" data-id="${x.id}">🖨 Imprimir</button><button class="b" data-baixa="word" data-imp2="pei" data-id="${x.id}">⬇ Word</button><button class="b" data-baixa="pdf" data-imp2="pei" data-id="${x.id}">⬇ PDF</button><button class="b" data-edpei="${x.id}">Editar</button><button class="b" data-duppei="${x.id}">Copiar para novo período</button><button class="b ghost" data-delpei="${x.id}">Excluir</button></div></article>`).join('')}</div>` : ''}`;
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
      <div class="acoes"><button class="b main" id="novoPar">➕ Novo parecer</button></div>
      ${l.length ? `<div class="cards">${l.map(x => `<article class="aula"><div class="topo"><b>${fmt(x.data)}</b><span class="tag">Parecer</span></div><h3>${esc((x.conclusao || x.motivo || 'Parecer neuropsicopedagógico').slice(0, 120))}</h3>
        <div class="acoes"><button class="b main" data-imp="parecer" data-id="${x.id}">🖨 Imprimir</button><button class="b" data-baixa="word" data-imp2="parecer" data-id="${x.id}">⬇ Word</button><button class="b" data-baixa="pdf" data-imp2="parecer" data-id="${x.id}">⬇ PDF</button><button class="b" data-edpar="${x.id}">✏️ Editar</button><button class="b ghost" data-delpar="${x.id}">Excluir</button></div></article>`).join('')}</div>` : ''}`;
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

  /* ---------- impressão no formato da escola ---------- */
  // Cabeçalho: a arte aprovada do site (mascote, Nº 1 em aprovação e logo) com o título na faixa
  const tamTit = t => Math.max(8.5, Math.min(15, Math.round(230 / Math.max(10, t.length) * 10) / 10));
  const cab = titulo => `<div class="sei-cab"><div class="sei-cab-tx"><strong style="font-size:${tamTit(titulo)}pt">${esc(titulo)}</strong></div></div><div class="sei-fita"><b>SISTEMA DE ENSINO INCENTIVO</b> · ATENDIMENTO EDUCACIONAL ESPECIALIZADO</div>`;
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
    return '';
  }
  async function baixarAee(fmt, tipo, id) {
    const h = await montarDoc(tipo, id); const nome = ({ perfil: 'Ficha do aluno', atend: 'Ficha de atendimento', pei: 'PEI', parecer: 'Parecer neuropsicopedagógico', 'atend-todos': 'Atendimentos' })[tipo] + ' - ' + atual.nome;
    return fmt === 'pdf' ? seiBaixar.pdf(h, nome) : seiBaixar.word(h, nome);
  }
  async function imprimir(tipo, id) {
    let h = '';
    if (tipo === 'perfil') h = docPerfil(atual);
    if (tipo === 'atend') h = docAtend(atual, (await todos('atend')).find(x => x.id === id));
    if (tipo === 'atend-todos') h = (await todos('atend')).filter(x => x.aluno === atual.id).sort((a, b) => (a.data || '').localeCompare(b.data || '')).map(x => docAtend(atual, x)).join('');
    if (tipo === 'pei') h = docPei(atual, (await todos('pei')).find(x => x.id === id));
    if (tipo === 'parecer') h = await docParecer(atual, (await todos('parecer')).find(x => x.id === id));
    $('#imprimir').innerHTML = h;
    await Promise.all([...document.querySelectorAll('#imprimir img')].map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; })));
    window.print();
  }

  /* ---------- eventos ---------- */
  let avT = null;
  function aviso(t) { let a = $('#aeeAviso'); if (!a) { a = document.createElement('div'); a.id = 'aeeAviso'; a.className = 'no-print'; document.body.append(a); } a.textContent = '✅ ' + t; a.hidden = false; clearTimeout(avT); avT = setTimeout(() => { a.hidden = true; }, 2500); }
  document.addEventListener('click', async e => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.al) { atual = alunos.find(a => a.id === t.dataset.al); aba = 'perfil'; edit = null; lista(); painel(); if (innerWidth < 800) $('#painel').scrollIntoView(); return; }
    if (t.dataset.aba && t.closest('.abas-al')) { aba = t.dataset.aba; edit = null; painel(); return; }
    if (t.dataset.imp) { imprimir(t.dataset.imp, t.dataset.id); return; }
    if (t.dataset.baixa) { baixarAee(t.dataset.baixa, t.dataset.imp2, t.dataset.id); return; }
    if (t.dataset.edat) { edit = { tipo: 'atend', obj: (await todos('atend')).find(x => x.id === t.dataset.edat) }; atend(); }
    if (t.dataset.delat && confirm('Excluir este atendimento?')) { await apagar('atend', t.dataset.delat); atend(); }
    if (t.dataset.edpei) { edit = { tipo: 'pei', obj: (await todos('pei')).find(x => x.id === t.dataset.edpei) }; pei(); }
    if (t.dataset.duppei) { const o = JSON.parse(JSON.stringify((await todos('pei')).find(x => x.id === t.dataset.duppei))); delete o.id; o.revisao = ''; edit = { tipo: 'pei', obj: o }; pei(); }
    if (t.dataset.delpei && confirm('Excluir este PEI?')) { await apagar('pei', t.dataset.delpei); pei(); }
    if (t.dataset.edpar) { edit = { tipo: 'parecer', obj: (await todos('parecer')).find(x => x.id === t.dataset.edpar) }; parecer(); }
    if (t.dataset.delpar && confirm('Excluir este parecer?')) { await apagar('parecer', t.dataset.delpar); parecer(); }
  });
  $('#novoAluno').onclick = () => { atual = { necessidades: [], aprende: [] }; aba = 'perfil'; edit = null; lista(); $('#painel').innerHTML = `<div class="topo-al"><h2>Novo aluno</h2></div><section id="cont"></section>`; perfil(); setTimeout(() => $('#pNome').focus(), 50); };
  $('#busca').oninput = lista;
  const baixar = (txt, nome) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'application/json' })); a.download = nome; document.body.append(a); a.click(); a.remove(); };
  $('#exp').onclick = async () => baixar(JSON.stringify({ tipo: 'sei-aee', versao: 1, exportado: new Date().toISOString(), alunos: await todos('alunos'), atend: await todos('atend'), pei: await todos('pei'), parecer: await todos('parecer') }), `aee-sei-${hoje()}.json`);
  $('#imp').onchange = async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try { const j = JSON.parse(await f.text()); if (j.tipo !== 'sei-aee') throw 0; for (const st of ['alunos', 'atend', 'pei', 'parecer']) for (const o of j[st] || []) await gravar(st, o); alert(`${(j.alunos || []).length} aluno(s) importado(s).`); carregar(); }
    catch (err) { alert('Este arquivo não é uma cópia do AEE da Biblioteca SEI.'); }
  };
  carregar();
})();
