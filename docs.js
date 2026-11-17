/* Documentos da Secretaria e da Coordenação: formulários, lista do que já foi feito e impressão
   no formato da escola. Tudo fica guardado neste aparelho (IndexedDB "sei-docs"). */
(function () {
  'use strict';
  const SETOR = document.body.dataset.setor; // 'secretaria' | 'coordenacao'
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const br = s => esc(s).replace(/\n/g, '<br>');
  const hoje = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  const fmt = d => (d || '').split('-').reverse().join('/');
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const extenso = d => { if (!d) return ''; const [y, m, dd] = d.split('-'); return `${+dd} de ${MESES[+m - 1]} de ${y}`; };
  const novoId = () => 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const CIDADE = 'São Miguel do Guamá — PA';

  /* ---------- armazenamento ---------- */
  let dbp = null;
  const abrir = () => dbp || (dbp = new Promise((res, rej) => { const r = indexedDB.open('sei-docs', 1); r.onupgradeneeded = () => r.result.createObjectStore('docs', { keyPath: 'id' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }));
  const tx = (modo, fn) => abrir().then(d => new Promise((res, rej) => { const t = d.transaction('docs', modo); const o = fn(t.objectStore('docs')); t.oncomplete = () => res(o && o.result !== undefined ? o.result : o); t.onerror = () => rej(t.error); }));
  const todos = () => tx('readonly', s => s.getAll()).then(l => l || []);
  const gravar = o => { o.atualizado = Date.now(); return tx('readwrite', s => s.put(o)).then(() => o); };
  const apagar = id => tx('readwrite', s => s.delete(id));
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}

  /* ---------- turmas e disciplinas (da própria Biblioteca) ---------- */
  // etapas (mesmos cartões da página inicial)
  const ETAPAS = {
    f1: { nome: 'Fundamental I', pos: '3.77% 55.4%', turmas: ['1º ano', '2º ano', '3º ano', '4º ano', '5º ano'] },
    f2: { nome: 'Fundamental II', pos: '96.2% 55.4%', turmas: ['6º ano', '7º ano', '8º ano', '9º ano'] },
    em: { nome: 'Ensino Médio', pos: '3.77% 79%', turmas: ['1ª série (Médio)', '2ª série (Médio)'] },
    cv: { nome: 'Convênio', pos: '96.2% 79%', turmas: ['3ª série (Convênio)'] },
    pv: { nome: 'Pré-vestibular', pos: '50% 95.5%', largo: true, turmas: ['Pré-vestibular'] }
  };
  // Secretaria dividida por segmento
  const SEGS = {
    ai: { nome: 'Anos Iniciais', icone: '🧸', desc: '1º ao 5º ano', turmas: ['1º ano', '2º ano', '3º ano', '4º ano', '5º ano'] },
    ef: { nome: 'Ensino Fundamental', icone: '📘', desc: '6º ao 9º ano', turmas: ['6º ano', '7º ano', '8º ano', '9º ano'] },
    em: { nome: 'Ensino Médio', icone: '🔬', desc: '1ª e 2ª série e Convênio (3ª série)', turmas: ['1ª série (Médio)', '2ª série (Médio)', '3ª série (Convênio)'] },
    pv: { nome: 'Pré-vestibular', icone: '🎓', desc: 'Turmas do pré-vestibular', turmas: ['Pré-vestibular'] }
  };
  let seg = null, segDoc = null;
  const turmasAtuais = () => (edit && edit.seg && SEGS[edit.seg]) ? SEGS[edit.seg].turmas : etapa ? ETAPAS[etapa].turmas : TURMAS;
  const doSeg = d => SETOR !== 'secretaria' || !seg || d.seg === seg;
  const etapaDe = t => Object.keys(ETAPAS).find(k => ETAPAS[k].turmas.includes(t));
  let etapa = null;
  const TURMAS = ['1º ano', '2º ano', '3º ano', '4º ano', '5º ano', '6º ano', '7º ano', '8º ano', '9º ano', '1ª série (Médio)', '2ª série (Médio)', '3ª série (Convênio)', 'Pré-vestibular'];
  let mol = null;
  async function disciplinas(turma) {
    if (!mol) { try { mol = await (await fetch('assets/montar/molduras.json?v=10')).json(); } catch (e) { mol = {}; } }
    const A = window.seiAulas; const alvo = (turma || '').replace(/ \(.*\)$/, '');
    return [...new Set(Object.keys(mol).map(s => A.info(s)).filter(i => i.turma === alvo || (alvo === 'Pré-vestibular' && i.turma === 'Pré-vestibular')).map(i => i.disciplina))].sort((a, b) => a.localeCompare(b, 'pt'));
  }

  /* ---------- campos ---------- */
  const v = id => ($('#' + id) || {}).value || '';
  const lab = (r, h, full) => `<label class="${full ? 'full' : ''}"><span>${r}</span>${h}</label>`;
  const inp = (id, val, ph, type) => `<input id="${id}" type="${type || 'text'}" value="${esc(val || '')}" placeholder="${esc(ph || '')}">`;
  const txt = (id, val, ph, rows) => `<textarea id="${id}" rows="${rows || 5}" placeholder="${esc(ph || '')}">${esc(val || '')}</textarea>`;
  const sel = (id, val, ops) => `<select id="${id}">${ops.map(o => `<option ${o === val ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
  const ler = ids => Object.fromEntries(ids.map(i => [i, v(i).trim()]));

  /* ---------- tipos de documento ---------- */
  const proxNum = (l, tipo, ano) => 1 + l.filter(d => d.tipo === tipo && (d.data || '').startsWith(ano)).reduce((m, d) => Math.max(m, +d.numero || 0), 0);
  const TIPOS = {
    memorando: {
      nome: 'Memorando', icone: '📨', desc: 'Comunicação interna, numerada', setores: ['secretaria', 'coordenacao'],
      titulo: d => `Memorando nº ${d.numero}/${(d.data || '').slice(0, 4)} — ${d.assunto || ''}`,
      novo: l => ({ data: hoje(), numero: proxNum(l, 'memorando', hoje().slice(0, 4)) }),
      form: d => `<div class="g3">${lab('Número', inp('numero', d.numero, '', 'number'))}${lab('Data', inp('data', d.data, '', 'date'))}${lab('De', inp('de', d.de, 'Ex.: Secretaria'))}</div>
        <div class="g2">${lab('Para', inp('para', d.para, 'Ex.: Professores do Ensino Médio'))}${lab('Assunto', inp('assunto', d.assunto))}</div>
        ${lab('Texto', txt('texto', d.texto, 'Escreva a mensagem', 9), 1)}<div class="g2">${lab('Quem assina', inp('assinante', d.assinante))}${lab('Cargo', inp('cargo', d.cargo, 'Ex.: Secretária Escolar'))}</div>`,
      campos: ['numero', 'data', 'de', 'para', 'assunto', 'texto', 'assinante', 'cargo'],
      doc: d => `${cab('MEMORANDO')}<p class="doc-num"><b>Memorando nº ${esc(d.numero)}/${esc((d.data || '').slice(0, 4))}</b><span>${CIDADE.split(' —')[0]}, ${extenso(d.data)}.</span></p>
        <table class="doc-id"><tr><th>De</th><td>${esc(d.de)}</td></tr><tr><th>Para</th><td>${esc(d.para)}</td></tr><tr><th>Assunto</th><td>${esc(d.assunto)}</td></tr></table>
        <div class="doc-corpo">${br(d.texto)}</div>${assina(d.assinante, d.cargo)}`
    },
    oficio: {
      nome: 'Ofício', icone: '📜', desc: 'Para órgãos e instituições, numerado', setores: ['secretaria', 'coordenacao'],
      titulo: d => `Ofício nº ${d.numero}/${(d.data || '').slice(0, 4)} — ${d.assunto || ''}`,
      novo: l => ({ data: hoje(), numero: proxNum(l, 'oficio', hoje().slice(0, 4)), fecho: 'Atenciosamente,' }),
      form: d => `<div class="g2">${lab('Número', inp('numero', d.numero, '', 'number'))}${lab('Data', inp('data', d.data, '', 'date'))}</div>
        ${lab('Destinatário (nome, cargo e órgão)', txt('dest', d.dest, 'Ex.: Ao Senhor Fulano de Tal\nSecretário Municipal de Educação\nSão Miguel do Guamá — PA', 3), 1)}
        ${lab('Assunto', inp('assunto', d.assunto), 1)}${lab('Texto', txt('texto', d.texto, 'Prezado(a) Senhor(a),', 9), 1)}
        <div class="g3">${lab('Fecho', inp('fecho', d.fecho))}${lab('Quem assina', inp('assinante', d.assinante))}${lab('Cargo', inp('cargo', d.cargo, 'Ex.: Diretora'))}</div>`,
      campos: ['numero', 'data', 'dest', 'assunto', 'texto', 'fecho', 'assinante', 'cargo'],
      doc: d => `${cab('OFÍCIO')}<p class="doc-num"><b>Ofício nº ${esc(d.numero)}/${esc((d.data || '').slice(0, 4))}</b><span>${CIDADE.split(' —')[0]}, ${extenso(d.data)}.</span></p>
        <div class="doc-dest">${br(d.dest)}</div><p><b>Assunto:</b> ${esc(d.assunto)}</p><div class="doc-corpo">${br(d.texto)}</div><p>${esc(d.fecho)}</p>${assina(d.assinante, d.cargo)}`
    },
    aviso: {
      nome: 'Aviso / Comunicado', icone: '📢', desc: 'Para pais, alunos ou professores', setores: ['secretaria', 'coordenacao', 'avisos'],
      titulo: d => d.titulo || 'Aviso',
      novo: () => ({ data: hoje(), publico: 'Senhores pais e responsáveis' }),
      form: d => `<div class="g2">${lab('Título', inp('titulo', d.titulo, 'Ex.: Reunião de pais'))}${lab('Data', inp('data', d.data, '', 'date'))}</div>
        ${lab('Para', sel('publico', d.publico, ['Senhores pais e responsáveis', 'Alunos', 'Professores', 'Comunidade escolar', 'Funcionários']), 1)}
        ${lab('Mensagem', txt('texto', d.texto, '', 9), 1)}<div class="g2">${lab('Quem assina', inp('assinante', d.assinante, 'Ex.: A Direção'))}${lab('Cópias por folha', sel('copias', d.copias || '1', ['1', '2']))}</div>`,
      campos: ['titulo', 'data', 'publico', 'texto', 'assinante', 'copias'],
      doc: d => { const um = `<div class="doc-aviso">${cab('COMUNICADO')}<h2>${esc(d.titulo)}</h2><p class="doc-para">${esc(d.publico)},</p><div class="doc-corpo grande">${br(d.texto)}</div><p class="doc-fim">${CIDADE.split(' —')[0]}, ${extenso(d.data)}.<br><b>${esc(d.assinante)}</b></p></div>`; return d.copias === '2' ? `<div class="doc-2">${um}<hr class="doc-corte">${um}</div>` : um; }
    },
    calendario: {
      nome: 'Calendário escolar', icone: '🗓️', desc: 'Ano letivo, feriados, avaliações', setores: ['secretaria', 'coordenacao', 'calendario'],
      titulo: d => 'Calendário escolar ' + (d.ano || ''),
      novo: () => { const y = new Date().getFullYear(); return { ano: String(y), inicio: y + '-02-03', fim: y + '-12-12', eventos: [] }; },
      form: d => `<div class="g3">${lab('Ano', inp('ano', d.ano))}${lab('Início das aulas', inp('inicio', d.inicio, '', 'date'))}${lab('Fim das aulas', inp('fim', d.fim, '', 'date'))}</div>
        <h4>Datas do ano</h4><div id="evs">${(d.eventos || []).map(linhaEv).join('')}</div><button type="button" class="b" id="maisEv">➕ Adicionar data</button>
        <p class="dica">Dias letivos: contados de segunda a sexta entre o início e o fim, tirando feriados e recessos. Marque “Letivo (sábado)” para sábados letivos.</p>`,
      campos: ['ano', 'inicio', 'fim'],
      extra: d => { d.eventos = [...document.querySelectorAll('.ev')].map(r => ({ de: r.querySelector('.ev-de').value, ate: r.querySelector('.ev-ate').value, tipo: r.querySelector('.ev-tipo').value, desc: r.querySelector('.ev-desc').value.trim() })).filter(e => e.de); },
      depois: () => { $('#maisEv').onclick = () => $('#evs').insertAdjacentHTML('beforeend', linhaEv({})); $('#evs').onclick = e => { if (e.target.matches('.ev-x')) e.target.closest('.ev').remove(); }; },
      doc: d => docCalendario(d)
    },
    boletim: {
      nome: 'Boletim', icone: '📊', desc: 'Notas das 4 avaliações e recuperações', setores: ['secretaria'],
      titulo: d => `Boletim — ${d.aluno || ''} (${d.turma || ''})`,
      novo: () => ({ ano: String(new Date().getFullYear()), turma: '6º ano', notas: {} }),
      form: d => `<div class="g3">${lab('Aluno(a)', inp('aluno', d.aluno))}${lab('Turma', sel('turma', d.turma, turmasAtuais()))}${lab('Letra / turno', inp('classe', d.classe, 'A, B, Manhã'))}</div>
        <div class="g3">${lab('Ano', inp('ano', d.ano))}${lab('Média para aprovação', inp('minima', d.minima || '6,0'))}${lab('Data de emissão', inp('data', d.data || hoje(), '', 'date'))}</div>
        <h4>Notas</h4><div class="tab"><table class="notas" id="notas"></table></div>${lab('Observações', txt('obs', d.obs, '', 2), 1)}`,
      campos: ['aluno', 'turma', 'classe', 'ano', 'minima', 'data', 'obs'],
      depois: async d => { const montar = async () => { const ds = await disciplinas(v('turma')); const n = d.notas || {}; $('#notas').innerHTML = `<thead><tr><th>Disciplina</th>${COLS.map(c => `<th>${c[1]}</th>`).join('')}<th>Média</th><th>Faltas</th></tr></thead><tbody>${ds.map(x => `<tr data-d="${esc(x)}"><td>${esc(x)}</td>${COLS.map(c => `<td><input class="nt" data-c="${c[0]}" inputmode="decimal" value="${esc((n[x] || {})[c[0]] || '')}"></td>`).join('')}<td class="md">${esc(media(n[x]))}</td><td><input class="nt" data-c="faltas" inputmode="numeric" value="${esc((n[x] || {}).faltas || '')}"></td></tr>`).join('')}</tbody>`; }; await montar(); $('#turma').onchange = async () => { d.notas = lerNotas(); await montar(); }; $('#notas').oninput = e => { const tr = e.target.closest('tr'); if (tr) tr.querySelector('.md').textContent = media(lerLinha(tr)); }; },
      extra: d => { d.notas = lerNotas(); },
      doc: d => docBoletim(d)
    },
    horario: {
      nome: 'Horário de aula', icone: '🕒', desc: 'Grade semanal de cada turma', setores: ['secretaria', 'coordenacao', 'horarios'],
      titulo: d => `Horário — ${d.turma || ''}${d.classe ? ' ' + d.classe : ''}${d.turno ? ' (' + d.turno + ')' : ''}`,
      novo: () => ({ turma: '6º ano', turno: 'Manhã', dias: 'Segunda a sexta', aulas: [['07:00', '07:50'], ['07:50', '08:40'], ['08:40', '09:30'], ['INTERVALO', ''], ['09:50', '10:40'], ['10:40', '11:30']], grade: {} }),
      form: d => `<div class="g3">${lab('Turma', sel('turma', d.turma, turmasAtuais()))}${lab('Letra', inp('classe', d.classe, 'A, B…'))}${lab('Turno', inp('turno', d.turno, 'Manhã, Tarde, Noite'))}</div>
        <div class="g2">${lab('Dias', sel('dias', d.dias, ['Segunda a sexta', 'Segunda a sábado']))}${lab('Válido a partir de', inp('data', d.data || hoje(), '', 'date'))}</div>
        <p class="dica">Em cada horário, escolha a disciplina e escreva o professor. Para o intervalo, escreva <b>INTERVALO</b> no início.</p>
        <div class="tab"><table class="grade" id="grade"></table></div><button type="button" class="b" id="maisAula">➕ Mais um horário</button>`,
      campos: ['turma', 'classe', 'turno', 'dias', 'data'],
      depois: async d => { const montar = async () => { const ds = await disciplinas(v('turma')); const dias = DIAS(v('dias')); const g = d.grade || {};
          $('#grade').innerHTML = `<thead><tr><th>Horário</th>${dias.map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${(d.aulas || []).map((a, i) => { const iv = /^interv/i.test(a[0]); return `<tr><td class="hr"><input class="hi" value="${esc(a[0])}"> <input class="hf" value="${esc(a[1])}" ${iv ? 'hidden' : ''}></td>${iv ? `<td colspan="${dias.length}" class="iv">INTERVALO</td>` : dias.map(x => { const c = (g[i + '|' + x] || {}); return `<td><select class="gd" data-k="${i}|${x}"><option value="">—</option>${ds.map(s => `<option ${c.d === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select><input class="gp" data-k="${i}|${x}" placeholder="Professor(a)" value="${esc(c.p || '')}"></td>`; }).join('')}</tr>`; }).join('')}</tbody>`; };
        await montar(); const guarda = () => { d.aulas = [...document.querySelectorAll('#grade tbody tr')].map(r => [r.querySelector('.hi').value, r.querySelector('.hf').value]); d.grade = lerGrade(); };
        $('#turma').onchange = $('#dias').onchange = async () => { guarda(); await montar(); };
        $('#grade').onchange = async e => { if (e.target.matches('.hi')) { guarda(); await montar(); } };
        $('#maisAula').onclick = async () => { guarda(); d.aulas.push(['', '']); await montar(); }; },
      extra: d => { d.aulas = [...document.querySelectorAll('#grade tbody tr')].map(r => [r.querySelector('.hi').value.trim(), r.querySelector('.hf').value.trim()]).filter(a => a[0] || a[1]); d.grade = lerGrade(); },
      doc: d => docHorario(d)
    },
    ata: {
      nome: 'Ata de reunião', icone: '📝', desc: 'Reuniões pedagógicas, de pais, conselho', setores: ['coordenacao', 'secretaria'],
      titulo: d => `Ata — ${d.tipoR || 'Reunião'} (${fmt(d.data)})`,
      novo: () => ({ data: hoje(), tipoR: 'Reunião pedagógica', local: 'Sala dos professores' }),
      form: d => `<div class="g3">${lab('Tipo de reunião', sel('tipoR', d.tipoR, ['Reunião pedagógica', 'Reunião de pais e responsáveis', 'Conselho de classe', 'Reunião administrativa', 'Planejamento']))}${lab('Data', inp('data', d.data, '', 'date'))}${lab('Horário', inp('hora', d.hora, '', 'time'))}</div>
        ${lab('Local', inp('local', d.local), 1)}${lab('Pauta', txt('pauta', d.pauta, '1. …\n2. …', 4), 1)}${lab('Participantes', txt('part', d.part, 'Nomes (um por linha)', 4), 1)}
        ${lab('O que foi discutido e decidido', txt('texto', d.texto, '', 9), 1)}<div class="g2">${lab('Quem redigiu (secretário/a da reunião)', inp('assinante', d.assinante))}${lab('Quem presidiu', inp('presidente', d.presidente))}</div>`,
      campos: ['tipoR', 'data', 'hora', 'local', 'pauta', 'part', 'texto', 'assinante', 'presidente'],
      doc: d => `${cab('ATA DE REUNIÃO')}<table class="doc-id"><tr><th>Reunião</th><td>${esc(d.tipoR)}</td></tr><tr><th>Data e horário</th><td>${fmt(d.data)}${d.hora ? ' às ' + esc(d.hora) : ''}</td></tr><tr><th>Local</th><td>${esc(d.local)}</td></tr></table>
        ${bloco('Pauta', d.pauta)}${bloco('Participantes', d.part)}${bloco('Registro da reunião', d.texto, true)}
        <p class="doc-fim">Nada mais havendo a tratar, eu, ${esc(d.assinante || '____________________')}, lavrei a presente ata, que vai assinada por mim e pelos presentes.</p>
        <div class="doc-ass"><div><span></span>${esc(d.assinante || 'Secretário(a) da reunião')}</div><div><span></span>${esc(d.presidente || 'Presidente da reunião')}</div></div>`
    },
    ocorrencia: {
      nome: 'Registro de ocorrência', icone: '⚠️', desc: 'Fatos com alunos, providências e ciência', setores: ['coordenacao'],
      titulo: d => `Ocorrência — ${d.aluno || ''} (${fmt(d.data)})`,
      novo: () => ({ data: hoje(), turma: '6º ano' }),
      form: d => `<div class="g3">${lab('Aluno(a)', inp('aluno', d.aluno))}${lab('Turma', sel('turma', d.turma, turmasAtuais()))}${lab('Letra / turno', inp('classe', d.classe))}</div>
        <div class="g3">${lab('Data', inp('data', d.data, '', 'date'))}${lab('Horário', inp('hora', d.hora, '', 'time'))}${lab('Registrado por', inp('quem', d.quem))}</div>
        ${lab('O que aconteceu', txt('texto', d.texto, '', 7), 1)}${lab('Providências tomadas', txt('prov', d.prov, '', 4), 1)}${lab('Responsável pelo aluno', inp('resp', d.resp), 1)}`,
      campos: ['aluno', 'turma', 'classe', 'data', 'hora', 'quem', 'texto', 'prov', 'resp'],
      doc: d => `${cab('REGISTRO DE OCORRÊNCIA')}<table class="doc-id"><tr><th>Aluno(a)</th><td>${esc(d.aluno)}</td></tr><tr><th>Turma</th><td>${esc([d.turma, d.classe].filter(Boolean).join(' · '))}</td></tr><tr><th>Data e horário</th><td>${fmt(d.data)}${d.hora ? ' às ' + esc(d.hora) : ''}</td></tr><tr><th>Registrado por</th><td>${esc(d.quem)}</td></tr></table>
        ${bloco('O que aconteceu', d.texto, true)}${bloco('Providências tomadas', d.prov, true)}
        <p class="doc-fim">Declaro estar ciente do registro acima.</p><div class="doc-ass"><div><span></span>Coordenação</div><div><span></span>${esc(d.resp || 'Responsável pelo aluno')}</div><div><span></span>Aluno(a)</div></div>`
    },
    convocacao: {
      nome: 'Convocação de responsáveis', icone: '📩', desc: 'Chamar os pais à escola', setores: ['coordenacao', 'secretaria', 'avisos'],
      titulo: d => `Convocação — ${d.aluno || ''}`,
      novo: () => ({ data: hoje(), turma: '6º ano' }),
      form: d => `<div class="g3">${lab('Aluno(a)', inp('aluno', d.aluno))}${lab('Turma', sel('turma', d.turma, turmasAtuais()))}${lab('Letra / turno', inp('classe', d.classe))}</div>
        <div class="g3">${lab('Comparecer no dia', inp('dia', d.dia, '', 'date'))}${lab('Horário', inp('hora', d.hora, '', 'time'))}${lab('Procurar por', inp('com', d.com, 'Ex.: Coordenação pedagógica'))}</div>
        ${lab('Motivo', txt('texto', d.texto, '', 4), 1)}<div class="g2">${lab('Data do documento', inp('data', d.data, '', 'date'))}${lab('Cópias por folha', sel('copias', d.copias || '2', ['1', '2']))}</div>`,
      campos: ['aluno', 'turma', 'classe', 'dia', 'hora', 'com', 'texto', 'data', 'copias'],
      doc: d => { const um = `<div class="doc-aviso">${cab('CONVOCAÇÃO')}<p class="doc-para">Senhor(a) responsável pelo(a) aluno(a) <b>${esc(d.aluno)}</b>, ${esc([d.turma, d.classe].filter(Boolean).join(' '))}:</p><div class="doc-corpo grande">Solicitamos o seu comparecimento à escola no dia <b>${fmt(d.dia) || '___/___/_____'}</b>${d.hora ? ', às <b>' + esc(d.hora) + '</b>' : ''}, para conversar com ${esc(d.com || 'a coordenação')}.${d.texto ? '<br><br><b>Assunto:</b> ' + br(d.texto) : ''}<br><br>Contamos com a sua presença.</div><p class="doc-fim">${CIDADE.split(' —')[0]}, ${extenso(d.data)}.</p><div class="doc-ass"><div><span></span>Coordenação</div><div><span></span>Ciente do responsável</div></div></div>`; return d.copias === '2' ? `<div class="doc-2">${um}<hr class="doc-corte">${um}</div>` : um; }
    }
  };
  const COLS = [['a1', '1ª Aval.'], ['a2', '2ª Aval.'], ['a3', '3ª Aval.'], ['a4', '4ª Aval.'], ['r1', '1ª Rec.'], ['r2', '2ª Rec.']];
  const num = s => { const n = parseFloat(String(s || '').replace(',', '.')); return isNaN(n) ? null : n; };
  function media(n) { if (!n) return ''; const a = ['a1', 'a2', 'a3', 'a4'].map(k => num(n[k])); if (a.some(x => x === null)) return ''; // recuperação substitui a menor nota quando for maior
    let l = [...a]; for (const r of ['r1', 'r2'].map(k => num(n[k])).filter(x => x !== null)) { const i = l.indexOf(Math.min(...l)); if (r > l[i]) l[i] = r; }
    return (l.reduce((s, x) => s + x, 0) / 4).toFixed(1).replace('.', ','); }
  const lerLinha = tr => Object.fromEntries([...tr.querySelectorAll('.nt')].map(i => [i.dataset.c, i.value.trim()]));
  const lerNotas = () => Object.fromEntries([...document.querySelectorAll('#notas tbody tr')].map(tr => [tr.dataset.d, lerLinha(tr)]));
  const DIAS = d => d === 'Segunda a sábado' ? ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'] : ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
  const lerGrade = () => { const g = {}; document.querySelectorAll('#grade .gd').forEach(s => { const k = s.dataset.k; const p = document.querySelector(`#grade .gp[data-k="${k}"]`); if (s.value || (p && p.value.trim())) g[k] = { d: s.value, p: p ? p.value.trim() : '' }; }); return g; };
  const TIPOS_EV = ['Feriado', 'Recesso / férias', 'Avaliação', 'Recuperação', 'Reunião', 'Evento', 'Letivo (sábado)', 'Planejamento'];
  const COR_EV = { 'Feriado': '#e53935', 'Recesso / férias': '#fb8c00', 'Avaliação': '#1e88e5', 'Recuperação': '#8e24aa', 'Reunião': '#43a047', 'Evento': '#00acc1', 'Letivo (sábado)': '#3949ab', 'Planejamento': '#6d4c41' };
  const linhaEv = e => `<div class="ev"><input type="date" class="ev-de" value="${esc(e.de || '')}"><input type="date" class="ev-ate" value="${esc(e.ate || '')}" title="Até (opcional)"><select class="ev-tipo">${TIPOS_EV.map(t => `<option ${e.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}</select><input class="ev-desc" placeholder="Descrição" value="${esc(e.desc || '')}"><button type="button" class="b ghost ev-x" title="Tirar">✕</button></div>`;

  /* ---------- impressão ---------- */
  const NOME_SETOR = { secretaria: 'Secretaria Escolar', coordenacao: 'Coordenação Pedagógica', avisos: 'Secretaria Escolar', calendario: 'Secretaria Escolar', horarios: 'Coordenação Pedagógica' }[SETOR];
  const cab = titulo => `<div class="doc-cab"><img src="assets/portal/icone-192.png" alt=""><div><b>SISTEMA DE ENSINO INCENTIVO</b><span>${NOME_SETOR}${segDoc && SEGS[segDoc] ? ' — ' + SEGS[segDoc].nome : ''}</span><small>${CIDADE}</small></div><em>${esc(titulo)}</em></div>`;
  const bloco = (t, val, alto) => `<div class="doc-b"><h4>${t}</h4><div class="doc-t${alto ? ' alto' : ''}">${val ? br(val) : '&nbsp;'}</div></div>`;
  const assina = (n, c) => `<div class="doc-ass um"><div><span></span><b>${esc(n || '')}</b><br>${esc(c || '')}</div></div>`;
  function diasDe(e) { const out = []; if (!e.de) return out; const a = new Date(e.de + 'T12:00'), b = new Date((e.ate || e.de) + 'T12:00'); for (let d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) out.push(d.toISOString().slice(0, 10)); return out; }
  function letivos(d) {
    if (!d.inicio || !d.fim) return null; const fora = new Set(), sab = new Set();
    (d.eventos || []).forEach(e => diasDe(e).forEach(x => { if (e.tipo === 'Feriado' || e.tipo === 'Recesso / férias') fora.add(x); if (e.tipo === 'Letivo (sábado)') sab.add(x); }));
    let n = 0; for (let x = new Date(d.inicio + 'T12:00'); x <= new Date(d.fim + 'T12:00'); x.setDate(x.getDate() + 1)) { const k = x.toISOString().slice(0, 10), w = x.getDay(); if ((w >= 1 && w <= 5 && !fora.has(k)) || sab.has(k)) n++; }
    return n;
  }
  function docCalendario(d) {
    const marca = {}; (d.eventos || []).forEach(e => diasDe(e).forEach(x => { marca[x] = marca[x] || e.tipo; }));
    const y = +d.ano || new Date().getFullYear();
    const mes = m => { const p = new Date(y, m, 1).getDay(); const n = new Date(y, m + 1, 0).getDate(); let c = '<tr>' + '<td></td>'.repeat(p);
      for (let i = 1; i <= n; i++) { const k = `${y}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`; const t = marca[k]; const fds = (p + i - 1) % 7 === 0 || (p + i - 1) % 7 === 6; c += `<td class="${fds ? 'fds' : ''}${k === d.inicio || k === d.fim ? ' ini' : ''}" ${t ? `style="background:${COR_EV[t]};color:#fff"` : ''}>${i}</td>`; if ((p + i) % 7 === 0) c += '</tr><tr>'; }
      return `<div class="cal-m"><h5>${MESES[m].toUpperCase()}</h5><table><tr>${'DSTQQSS'.split('').map(x => `<th>${x}</th>`).join('')}</tr>${c}</tr></table></div>`; };
    const ev = [...(d.eventos || [])].sort((a, b) => a.de.localeCompare(b.de));
    const nl = letivos(d);
    return `${cab('CALENDÁRIO ESCOLAR ' + y)}<div class="cal">${[...Array(12).keys()].map(mes).join('')}</div>
      <div class="cal-leg">${Object.entries(COR_EV).map(([t, c]) => `<span><i style="background:${c}"></i>${t}</span>`).join('')}<span><i class="ini"></i>Início / fim das aulas</span></div>
      <p class="cal-res"><b>Início das aulas:</b> ${fmt(d.inicio)} · <b>Fim:</b> ${fmt(d.fim)}${nl !== null ? ` · <b>Dias letivos:</b> ${nl}` : ''}</p>
      ${ev.length ? `<table class="doc-id cal-ev">${ev.map(e => `<tr><th>${fmt(e.de)}${e.ate && e.ate !== e.de ? ' a ' + fmt(e.ate) : ''}</th><td><i style="background:${COR_EV[e.tipo]}"></i>${esc(e.tipo)}${e.desc ? ' — ' + esc(e.desc) : ''}</td></tr>`).join('')}</table>` : ''}`;
  }
  function docBoletim(d) {
    const n = d.notas || {}; const ds = Object.keys(n); const min = num(d.minima) || 6;
    return `${cab('BOLETIM ESCOLAR ' + (d.ano || ''))}<table class="doc-id"><tr><th>Aluno(a)</th><td>${esc(d.aluno)}</td></tr><tr><th>Turma</th><td>${esc([d.turma, d.classe].filter(Boolean).join(' · '))}</td></tr></table>
      <table class="doc-bol"><thead><tr><th>Disciplina</th>${COLS.map(c => `<th>${c[1]}</th>`).join('')}<th>Média</th><th>Faltas</th><th>Situação</th></tr></thead><tbody>${ds.map(x => { const m = media(n[x]); const mn = num(m); return `<tr><td>${esc(x)}</td>${COLS.map(c => `<td>${esc(n[x][c[0]] || '')}</td>`).join('')}<td><b>${esc(m)}</b></td><td>${esc(n[x].faltas || '')}</td><td>${mn === null ? '' : mn >= min ? 'Aprovado' : 'Em recuperação'}</td></tr>`; }).join('')}</tbody></table>
      <p class="doc-rev">Média para aprovação: ${esc(d.minima || '6,0')}. A nota da recuperação substitui a menor nota das avaliações quando for maior.</p>${d.obs ? bloco('Observações', d.obs) : ''}
      <p class="doc-fim">${CIDADE.split(' —')[0]}, ${extenso(d.data)}.</p><div class="doc-ass"><div><span></span>Secretaria</div><div><span></span>Responsável</div></div>`;
  }
  function docHorario(d) {
    const dias = DIAS(d.dias); const g = d.grade || {};
    return `${cab('HORÁRIO DE AULA')}<table class="doc-id"><tr><th>Turma</th><td>${esc([d.turma, d.classe].filter(Boolean).join(' '))}${d.turno ? ' · ' + esc(d.turno) : ''}</td></tr><tr><th>Válido a partir de</th><td>${fmt(d.data)}</td></tr></table>
      <table class="doc-hor"><thead><tr><th>Horário</th>${dias.map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${(d.aulas || []).map((a, i) => /^interv/i.test(a[0]) ? `<tr class="iv"><td colspan="${dias.length + 1}">INTERVALO${a[1] ? ' · ' + esc(a[1]) : ''}</td></tr>` : `<tr><td class="hr">${esc(a[0])}${a[1] ? '<br>' + esc(a[1]) : ''}</td>${dias.map(x => { const c = g[i + '|' + x] || {}; return `<td><b>${esc(c.d || '')}</b>${c.p ? '<small>' + esc(c.p) + '</small>' : ''}</td>`; }).join('')}</tr>`).join('')}</tbody></table>`;
  }

  /* ---------- telas ---------- */
  let lista = [], tipo = null, edit = null;
  const meus = () => Object.entries(TIPOS).filter(([, t]) => t.setores.includes(SETOR));
  async function carregar() { lista = (await todos()).filter(d => d.setor === SETOR); tela(); }
  function tela() {
    const p = $('#docs');
    if (edit) return formulario();
    const unico = meus().length === 1;
    if (unico) tipo = meus()[0][0];
    if (tipo === 'horario' && SETOR === 'horarios' && !etapa) {
      const n = k => lista.filter(d => d.tipo === 'horario' && etapaDe(d.turma) === k).length;
      p.innerHTML = `<p class="dica">Escolha a etapa para ver os horários de cada turma.</p><div class="etapas">${Object.entries(ETAPAS).map(([k, e]) => `<button class="etapa${e.largo ? ' larga' : ''}" data-et="${k}" style="background-position:${e.pos}" aria-label="${e.nome}">${n(k) ? `<span class="et-n">${n(k)} horário${n(k) === 1 ? '' : 's'}</span>` : ''}</button>`).join('')}</div>`;
      return;
    }
    if (SETOR === 'secretaria' && !seg) {
      p.innerHTML = `<p class="dica">Escolha o segmento. Cada um tem os seus documentos.</p><div class="tiles-doc segs">${Object.entries(SEGS).map(([k, g]) => { const n = lista.filter(d => d.seg === k).length; return `<button class="tile-doc seg" data-seg="${k}"><span class="ti">${g.icone}</span><b>${g.nome}</b><small>${g.desc}</small><em>${n ? n + ' documento' + (n > 1 ? 's' : '') : 'abrir'}</em></button>`; }).join('')}</div>`;
      return;
    }
    if (!tipo) {
      p.innerHTML = `${seg ? `<nav class="trilha"><button class="b ghost" data-volta="seg">‹ Secretaria</button><span>›</span><b class="tr-atual">${SEGS[seg].icone} ${SEGS[seg].nome}</b></nav>` : ''}<div class="tiles-doc">${meus().map(([k, t]) => { const n = lista.filter(d => d.tipo === k && doSeg(d)).length; return `<button class="tile-doc" data-t="${k}"><span class="ti">${t.icone}</span><b>${t.nome}</b><small>${t.desc}</small><em>${n ? n + ' salvo' + (n > 1 ? 's' : '') : 'novo'}</em></button>`; }).join('')}
        ${SETOR === 'coordenacao' ? `<a class="tile-doc" href="aulas.html"><span class="ti">🗒️</span><b>Controle das avaliações</b><small>Em “Minhas aulas”, aba Avaliações: 4 avaliações e 2 recuperações por turma</small><em>abrir</em></a><a class="tile-doc" href="aee.html"><span class="ti">🤝</span><b>AEE</b><small>Alunos atendidos, fichas e PEI</small><em>abrir</em></a>` : ''}</div>`;
      return;
    }
    const t = TIPOS[tipo]; const ordT = d => TURMAS.indexOf(d.turma) * 100 + ((d.classe || ' ').charCodeAt(0) % 100); const l = lista.filter(d => d.tipo === tipo && doSeg(d) && (!etapa || etapaDe(d.turma) === etapa)).sort((a, b) => tipo === 'horario' ? ordT(a) - ordT(b) : (b.data || b.ano || '').localeCompare(a.data || a.ano || '') || (b.criado || 0) - (a.criado || 0));
    const voltaTxt = etapa ? 'Etapas' : unico ? '' : seg ? SEGS[seg].nome : { secretaria: 'Secretaria', coordenacao: 'Coordenação', avisos: 'Avisos' }[SETOR];
    p.innerHTML = `${voltaTxt && (!unico || etapa) ? `<nav class="trilha"><button class="b ghost" data-volta="1">‹ ${esc(voltaTxt)}</button><span>›</span><b class="tr-atual">${t.icone} ${etapa ? ETAPAS[etapa].nome : t.nome}</b></nav>` : ''}
      <div class="acoes"><button class="b main" id="novoDoc">➕ Novo ${t.nome.toLowerCase().split(' /')[0]}</button></div>
      ${l.length ? `<div class="cards">${l.map(d => `<article class="aula"><div class="topo"><b>${fmt(d.data) || esc(d.ano || '')}</b><span class="tag">${t.icone}</span></div><h3>${esc(t.titulo(d))}</h3>
        <div class="acoes"><button class="b main" data-imp="${d.id}">🖨 Imprimir</button><button class="b" data-ed="${d.id}">Editar</button><button class="b" data-dup="${d.id}">Duplicar</button><button class="b ghost" data-del="${d.id}">Excluir</button></div></article>`).join('')}</div>`
        : `<p class="dica">Nenhum documento ainda. Toque em “Novo” para começar.</p>`}`;
    $('#novoDoc').onclick = () => { edit = Object.assign({ tipo, setor: SETOR }, seg ? { seg } : {}, t.novo(lista.filter(doSeg))); if (seg && edit.turma !== undefined) edit.turma = SEGS[seg].turmas[0]; if (etapa && edit.turma !== undefined) edit.turma = ETAPAS[etapa].turmas[0]; tela(); };
  }
  async function formulario() {
    const t = TIPOS[edit.tipo];
    $('#docs').innerHTML = `<nav class="trilha"><button class="b ghost" data-volta="2">‹ ${t.nome}</button></nav><form class="ficha" id="fDoc"><h3>${t.icone} ${edit.id ? 'Editar' : 'Novo'}: ${t.nome}</h3>${t.form(edit)}
      <div class="acoes"><button class="b main" type="submit">💾 Salvar</button><button class="b" type="button" id="salvaImp">💾 Salvar e imprimir</button><button class="b ghost" type="button" data-volta="2">Cancelar</button></div></form>`;
    if (t.depois) await t.depois(edit);
    const salvar = async () => { Object.assign(edit, ler(t.campos)); if (t.extra) t.extra(edit); if (!edit.id) { edit.id = novoId(); edit.criado = Date.now(); } await gravar(edit); const d = edit; aviso('Documento salvo.'); edit = null; await carregar(); return d; };
    $('#fDoc').onsubmit = async e => { e.preventDefault(); await salvar(); };
    $('#salvaImp').onclick = async () => imprimir(await salvar());
  }
  async function imprimir(d) {
    const t = TIPOS[d.tipo]; segDoc = d.seg || null; document.body.dataset.doc = d.tipo;
    $('#imprimir').innerHTML = t.doc(d);
    const im = $('#imprimir img'); if (im && !im.complete) await new Promise(r => { im.onload = im.onerror = r; });
    window.print();
  }
  let avT = null;
  function aviso(x) { let a = $('#aeeAviso'); if (!a) { a = document.createElement('div'); a.id = 'aeeAviso'; a.className = 'no-print'; document.body.append(a); } a.textContent = '✅ ' + x; a.hidden = false; clearTimeout(avT); avT = setTimeout(() => { a.hidden = true; }, 2500); }
  document.addEventListener('click', async e => {
    const b = e.target.closest('button,a'); if (!b) return;
    if (b.dataset.t) { tipo = b.dataset.t; edit = null; tela(); scrollTo(0, 0); }
    if (b.dataset.et) { etapa = b.dataset.et; tela(); scrollTo(0, 0); }
    if (b.dataset.seg) { seg = b.dataset.seg; tipo = null; tela(); scrollTo(0, 0); }
    if (b.dataset.volta) { if (b.dataset.volta === 'seg') { seg = null; tipo = null; } else if (b.dataset.volta === '1') { if (etapa) etapa = null; else tipo = null; } edit = null; tela(); }
    if (b.dataset.imp) imprimir(lista.find(d => d.id === b.dataset.imp));
    if (b.dataset.ed) { edit = JSON.parse(JSON.stringify(lista.find(d => d.id === b.dataset.ed))); tela(); }
    if (b.dataset.dup) { const o = JSON.parse(JSON.stringify(lista.find(d => d.id === b.dataset.dup))); delete o.id; o.data = hoje(); if (o.numero) o.numero = proxNum(lista.filter(doSeg), o.tipo, hoje().slice(0, 4)); edit = o; tela(); }
    if (b.dataset.del && confirm('Excluir este documento?')) { await apagar(b.dataset.del); carregar(); }
  });
  const baixar = (x, nome) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([x], { type: 'application/json' })); a.download = nome; document.body.append(a); a.click(); a.remove(); };
  $('#exp').onclick = async () => baixar(JSON.stringify({ tipo: 'sei-docs', setor: SETOR, exportado: new Date().toISOString(), docs: lista }), `${SETOR}-sei-${hoje()}.json`);
  $('#imp').onchange = async e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; try { const j = JSON.parse(await f.text()); if (j.tipo !== 'sei-docs') throw 0; for (const o of j.docs) await gravar(o); alert(j.docs.length + ' documento(s) importado(s).'); carregar(); } catch (err) { alert('Este arquivo não é uma cópia de documentos da Biblioteca SEI.'); } };
  carregar();
})();
