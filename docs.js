/* Documentos da Secretaria e da Coordenação: formulários, lista do que já foi feito e impressão
   no formato da escola. Tudo fica guardado neste aparelho (IndexedDB "sei-docs"). */
(function () {
  'use strict';
  const SETOR = document.body.dataset.setor; // 'secretaria' | 'coordenacao'
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const rico = s => window.seiTexto && seiTexto.ehHTML(s);
  const br = s => rico(s) ? `<div class="rt">${seiTexto.limpar(s)}</div>` : esc(s).replace(/\n/g, '<br>');
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
    ei: { nome: 'Educação Infantil', simples: '🧸', desc: 'Maternal, Pré I e Pré II', turmas: ['Maternal', 'Pré I', 'Pré II'] },
    f1: { nome: 'Fundamental I', pos: '3.77% 55.4%', turmas: ['1º ano', '2º ano', '3º ano', '4º ano', '5º ano'] },
    f2: { nome: 'Fundamental II', pos: '96.2% 55.4%', turmas: ['6º ano', '7º ano', '8º ano', '9º ano'] },
    em: { nome: 'Ensino Médio', pos: '3.77% 79%', turmas: ['1ª série (Médio)', '2ª série (Médio)'] },
    cv: { nome: 'Convênio', pos: '96.2% 79%', turmas: ['3ª série (Convênio)'] },
    pv: { nome: 'Pré-vestibular', pos: '50% 95.5%', largo: true, turmas: ['Pré-vestibular'] }
  };
  // Secretaria dividida por segmento
  const SEGS = {
    ei: { nome: 'Educação Infantil', icone: '🧸', desc: 'Maternal, Pré I e Pré II', turmas: ['Maternal', 'Pré I', 'Pré II'] },
    ai: { nome: 'Anos Iniciais', icone: '✏️', desc: '1º ao 5º ano', turmas: ['1º ano', '2º ano', '3º ano', '4º ano', '5º ano'] },
    ef: { nome: 'Ensino Fundamental', icone: '📘', desc: '6º ao 9º ano', turmas: ['6º ano', '7º ano', '8º ano', '9º ano'] },
    em: { nome: 'Ensino Médio', icone: '🔬', desc: '1ª e 2ª série e Convênio (3ª série)', turmas: ['1ª série (Médio)', '2ª série (Médio)', '3ª série (Convênio)'] },
    pv: { nome: 'Pré-vestibular', icone: '🎓', desc: 'Turmas do pré-vestibular', turmas: ['Pré-vestibular'] }
  };
  let seg = null, segDoc = null;
  const turmasAtuais = () => (edit && edit.seg && SEGS[edit.seg]) ? SEGS[edit.seg].turmas : etapa ? ETAPAS[etapa].turmas : TURMAS;
  const doSeg = d => SETOR !== 'secretaria' || !seg || d.seg === seg;
  const etapaDe = t => Object.keys(ETAPAS).find(k => ETAPAS[k].turmas.includes(t));
  let etapa = null;
  const TURMAS = ['Maternal', 'Pré I', 'Pré II', '1º ano', '2º ano', '3º ano', '4º ano', '5º ano', '6º ano', '7º ano', '8º ano', '9º ano', '1ª série (Médio)', '2ª série (Médio)', '3ª série (Convênio)', 'Pré-vestibular'];
  let mol = null;
  const CAMPOS_EI = ['O eu, o outro e o nós', 'Corpo, gestos e movimentos', 'Traços, sons, cores e formas', 'Escuta, fala, pensamento e imaginação', 'Espaços, tempos, quantidades, relações e transformações'];
  async function disciplinas(turma) {
    if (['Maternal', 'Pré I', 'Pré II'].includes(turma)) return CAMPOS_EI;
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
      nome: 'Calendário pedagógico', icone: '🗓️', desc: 'Por semestre: dias letivos, feriados, avaliações e eventos', setores: ['secretaria', 'coordenacao', 'calendario'],
      titulo: d => `Calendário pedagógico ${d.semestre && d.semestre !== 'Ano inteiro' ? d.semestre + ' ' : ''}${d.ano || ''}`,
      novo: () => { const y = new Date().getFullYear(); return { ano: String(y), semestre: '1º semestre', inicio: y + '-02-03', fim: y + '-12-12', eventos: [] }; },
      form: d => `<div class="g2">${lab('Ano', inp('ano', d.ano))}${lab('Período', sel('semestre', d.semestre || 'Ano inteiro', ['1º semestre', '2º semestre', 'Ano inteiro']))}</div><div class="g2">${lab('Início das aulas', inp('inicio', d.inicio, '', 'date'))}${lab('Fim das aulas', inp('fim', d.fim, '', 'date'))}</div>
        <h4>Datas do ano</h4><div id="evs">${(d.eventos || []).map(linhaEv).join('')}</div><button type="button" class="b" id="maisEv">➕ Adicionar data</button>
        <p class="dica">Dias letivos: contados de segunda a sexta entre o início e o fim, tirando feriados, pontos facultativos e recessos. Marque “Letivo (sábado)” para sábados letivos. Cada mês mostra os seus dias letivos e as datas embaixo.</p>`,
      campos: ['ano', 'semestre', 'inicio', 'fim'],
      extra: d => { d.eventos = [...document.querySelectorAll('.ev')].map(r => ({ de: r.querySelector('.ev-de').value, ate: r.querySelector('.ev-ate').value, tipo: r.querySelector('.ev-tipo').value, desc: r.querySelector('.ev-desc').value.trim() })).filter(e => e.de); },
      depois: () => { $('#maisEv').onclick = () => $('#evs').insertAdjacentHTML('beforeend', linhaEv({})); $('#evs').onclick = e => { if (e.target.matches('.ev-x')) e.target.closest('.ev').remove(); }; },
      // arte das folhas (mascote e placa), mais alegre que os documentos de secretaria
      arte: d => { const sem = d.semestre && d.semestre !== 'Ano inteiro' ? d.semestre : 'Ano letivo'; const nl = letivos(d, mesesDe(d)); return { estilo: 'folha', titulo: 'Calendário Pedagógico', curto: `Calendário Pedagógico — ${sem} ${d.ano || ''}`, placa: { grande: d.ano || '', linhas: [sem.toUpperCase(), 'ANO LETIVO'] }, campos: [['Documento', 'Calendário pedagógico'], ['Período', `${sem} de ${d.ano || ''}`], ['Aulas', `${fmt(d.inicio)} a ${fmt(d.fim)}`], ['Dias letivos', nl === null ? '' : String(nl)]] }; },
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
        <p class="dica">Em cada horário, escolha a disciplina e o professor. Para o intervalo, escreva <b>INTERVALO</b> no início. O site avisa quando o professor não pode naquele dia e turno, ou já está em outra turma no mesmo horário.</p><div id="alertas" class="alertas"></div><datalist id="profsDL"></datalist>
        <div class="tab"><table class="grade" id="grade"></table></div><button type="button" class="b" id="maisAula">➕ Mais um horário</button>`,
      campos: ['turma', 'classe', 'turno', 'dias', 'data'],
      depois: async d => { const montar = async () => { const ds = await disciplinas(v('turma')); const dias = DIAS(v('dias')); const g = d.grade || {};
          $('#grade').innerHTML = `<thead><tr><th>Horário</th>${dias.map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${(d.aulas || []).map((a, i) => { const iv = /^interv/i.test(a[0]); return `<tr><td class="hr"><input class="hi" value="${esc(a[0])}"> <input class="hf" value="${esc(a[1])}" ${iv ? 'hidden' : ''}></td>${iv ? `<td colspan="${dias.length}" class="iv">INTERVALO</td>` : dias.map(x => { const c = (g[i + '|' + x] || {}); return `<td><select class="gd" data-k="${i}|${x}"><option value="">—</option>${ds.map(s => `<option ${c.d === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select><input class="gp" data-k="${i}|${x}" list="profsDL" placeholder="Professor(a)" value="${esc(c.p || '')}"><span class="alerta-c" data-k="${i}|${x}"></span></td>`; }).join('')}</tr>`; }).join('')}</tbody>`; };
        const montar0 = montar; const montarC = async () => { await montar0(); await ligaChecagem(d); };
        await montarC(); const guarda = () => { d.aulas = [...document.querySelectorAll('#grade tbody tr')].map(r => [r.querySelector('.hi').value, r.querySelector('.hf').value]); d.grade = lerGrade(); };
        $('#turma').onchange = $('#dias').onchange = async () => { guarda(); await montarC(); };
        $('#grade').onchange = async e => { if (e.target.matches('.hi')) { guarda(); await montarC(); } else if (e.target.matches('.hf')) { guarda(); checaForm(d); } else if (e.target.matches('.gd')) { sugere(d, e.target.dataset.k); checaForm(d); } };
        $('#grade').oninput = e => { if (e.target.matches('.gp')) checaForm(d); };
        $('#classe').oninput = $('#turno').oninput = () => checaForm(d);
        $('#maisAula').onclick = async () => { guarda(); d.aulas.push(['', '']); await montarC(); }; },
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
  Object.assign(TIPOS, {
    declaracao: {
      nome: 'Declaração', icone: '🧾', desc: 'Pagamento (IR), serviço prestado, liberação de funcionário, matrícula', setores: ['secretaria'],
      titulo: d => `Declaração — ${MOD_DEC[d.modelo] ? MOD_DEC[d.modelo].curto : ''}${d.nome || d.aluno ? ': ' + (d.modelo === 'pagamento' ? d.aluno || d.resp : d.nome || d.aluno) : ''}`,
      novo: () => ({ data: hoje(), modelo: 'pagamento', turma: '6º ano', anoRef: String(new Date().getFullYear() - 1), cargo: 'Secretária Escolar' }),
      form: d => `${lab('Modelo', `<select id="modelo">${Object.entries(MOD_DEC).map(([k, m]) => `<option value="${k}" ${d.modelo === k ? 'selected' : ''}>${m.nome}</option>`).join('')}</select>`, 1)}
        <div class="g3 m-pagamento">${lab('Responsável que pagou', inp('resp', d.resp, 'Nome completo'))}${lab('RG', inp('rg', d.rg))}${lab('CPF', inp('cpf', d.cpf, '000.000.000-00'))}</div>
        <div class="g3 m-pagamento">${lab('Valor pago (R$)', inp('valor', d.valor, 'Ex.: 7.190,00'))}${lab('Aluno(a)', inp('aluno', d.aluno))}${lab('Ano em que estudou', inp('anoRef', d.anoRef))}</div>
        <div class="g3 m-servico m-liberacao">${lab('Funcionário(a)', inp('nome', d.nome, 'Nome completo'))}${lab('RG', inp('rg2', d.rg2))}${lab('CPF', inp('cpf2', d.cpf2, '000.000.000-00'))}</div>
        <div class="g3 m-servico">${lab('Função', inp('funcao', d.funcao, 'Ex.: Pedagoga'))}${lab('Desde', inp('desde', d.desde, 'Ex.: outubro de 2024'))}${lab('Até', inp('ate', d.ate, 'Ex.: abril de 2026 (ou vazio: até hoje)'))}</div>
        <div class="m-servico">${lab('Atividades (opcional)', inp('ativ', d.ativ, 'Ex.: no planejamento e execução de atividades pedagógicas no AEE'), 1)}</div>
        <div class="g2 m-liberacao">${lab('Ao gestor(a) da escola', inp('gestor', d.gestor, 'Nome do gestor(a)'))}${lab('Escola / órgão (opcional)', inp('escola', d.escola))}</div>
        <div class="g3 m-liberacao">${lab('Motivo / evento', inp('motivo', d.motivo, 'Ex.: XVI Jogos Internos do SEI'))}${lab('Dia(s)', inp('quando', d.quando, 'Ex.: 01, 02 e 03 de outubro de 2025'))}${lab('Turno(s)', inp('turno', d.turno, 'Ex.: tarde e noite'))}</div>
        <div class="g3 m-matricula">${lab('Aluno(a)', inp('alunoM', d.alunoM))}${lab('Nascimento', inp('nasc', d.nasc, '', 'date'))}${lab('Turno', inp('turnoM', d.turnoM, 'Manhã'))}</div>
        <div class="g3 m-pagamento m-matricula">${lab('Série / ano', sel('turma', d.turma, turmasAtuais()))}<span class="m-matricula">${lab('Ano letivo', inp('anoM', d.anoM || String(new Date().getFullYear())))}</span></div>
        ${lab('Texto da declaração <small>(montado sozinho a partir dos campos; pode ajustar e formatar com a barra)</small>', txt('texto', d.texto, '', 7), 1)}<button type="button" class="b ghost" id="refazTx">↻ Montar o texto de novo a partir dos campos</button>
        <div class="g3">${lab('Data', inp('data', d.data, '', 'date'))}${lab('Quem assina', inp('assinante', d.assinante))}${lab('Cargo', inp('cargo', d.cargo))}</div>`,
      campos: ['modelo', 'resp', 'rg', 'cpf', 'valor', 'aluno', 'anoRef', 'nome', 'rg2', 'cpf2', 'funcao', 'desde', 'ate', 'ativ', 'gestor', 'escola', 'motivo', 'quando', 'turno', 'alunoM', 'nasc', 'turnoM', 'turma', 'anoM', 'texto', 'data', 'assinante', 'cargo'],
      depois: d => { const f = $('#fDoc'); const mostra = () => { const m = v('modelo'); f.querySelectorAll('[class*="m-"]').forEach(x => { x.hidden = ![...x.classList].includes('m-' + m); }); };
        const monta = () => { const o = ler(TIPOS.declaracao.campos); $('#texto').value = textoDec(o); };
        mostra(); if (!d.texto) monta();
        let manual = !!d.manual; $('#texto').oninput = () => { manual = d.manual = true; };
        f.addEventListener('input', e => { if (e.target.id !== 'texto' && !e.target.closest('.ed-caixa') && !manual) monta(); });
        $('#modelo').onchange = () => { mostra(); manual = d.manual = false; monta(); };
        $('#refazTx').onclick = () => { manual = d.manual = false; monta(); }; },
      doc: d => `${cab('DECLARAÇÃO')}${inep()}${d.modelo === 'liberacao' && d.gestor ? `<p class="doc-dest">Ao gestor(a) da escola${d.escola ? ' ' + esc(d.escola) : ''}<br>${esc(d.gestor)}</p>` : ''}<div class="doc-corpo dec">${neg(d.texto)}</div><p class="doc-data">${CIDADE.split(' —')[0]} — PA, ${extenso(d.data)}.</p>${assina(d.assinante, d.cargo)}`
    },
    ressalva: {
      nome: 'Ressalva', icone: '📎', desc: 'Matrícula condicional com transferência em andamento', setores: ['secretaria'],
      titulo: d => `Ressalva — ${d.aluno || ''}`,
      novo: () => ({ data: hoje(), turma: '6º ano', sit: 'Cursando', prazo: '30', cargo: 'Secretária Escolar' }),
      form: d => `<div class="g3">${lab('Aluno(a)', inp('aluno', d.aluno))}${lab('Nascimento', inp('nasc', d.nasc, '', 'date'))}${lab('Tem direito à matrícula na', sel('turma', d.turma, turmasAtuais()))}</div>
        <div class="g3">${lab('Situação do aluno(a)', sel('sit', d.sit, SIT_RES))}${lab('Prazo para os documentos (dias)', inp('prazo', d.prazo, '30', 'number'))}${lab('Data', inp('data', d.data, '', 'date'))}</div>
        <div class="g2">${lab('Quem assina', inp('assinante', d.assinante))}${lab('Cargo', inp('cargo', d.cargo))}</div>`,
      campos: ['aluno', 'nasc', 'turma', 'sit', 'prazo', 'data', 'assinante', 'cargo'],
      doc: d => `${cab('RESSALVA')}${inep()}<div class="doc-corpo dec"><p>Declaramos, para fins de matrícula, que deu entrada na secretaria deste Sistema de Ensino o pedido de transferência do(a) aluno(a) <b>${esc((d.aluno || '').toUpperCase()) || '______________________________'}</b>, nascido(a) em ${fmt(d.nasc) || '___/___/_____'}, o(a) qual tem direito à matrícula no(a) <b>${esc(serieNome(d.turma))}</b>.</p><p>Declaramos ainda que os documentos serão entregues no prazo de ${esc(d.prazo || '30')} dias, a contar desta data, servindo esta como condicional para a matrícula.</p></div>
        <div class="ress-sit"><div><b>Situação do aluno(a):</b></div>${SIT_RES.map(s => `<div>( ${s === d.sit ? '<b>X</b>' : '&nbsp;&nbsp;&nbsp;'} ) ${s}</div>`).join('')}</div><p class="doc-data">${CIDADE.split(' —')[0]} — PA, ${extenso(d.data)}.</p>${assina(d.assinante, d.cargo)}`
    }
  });
  /* ---------- declarações e ressalva (modelos da secretaria da escola) ---------- */
  const INEP = '15590798';
  const inep = () => `<p class="doc-inep">${FOLHA ? '' : `COD. INEP: ${INEP} · `}Autorização: Resolução nº 614, de 14 de novembro de 2024 — CEE</p>`;
  const neg = s => rico(s) ? seiTexto.limpar(s).replace(/\*([^*<\n]+)\*/g, '<b>$1</b>') : esc(s).replace(/\*([^*\n]+)\*/g, '<b>$1</b>').split(/\n\s*\n/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
  const SIT_RES = ['Aprovado(a)', 'Reprovado(a)', 'Desistente', 'Cancelou', 'Cursando', 'Dependência'];
  const serieNome = t => { t = t || ''; if (/Médio|Convênio/.test(t)) return t.replace(/ \(.*\)/, '') + ' do Ensino Médio'; if (/º ano/.test(t)) return t + ' do Ensino Fundamental'; if (/Maternal|Pré I/.test(t)) return t + ' da Educação Infantil'; return t; };
  const MOD_DEC = {
    pagamento: { nome: 'Pagamento de mensalidades (para Imposto de Renda)', curto: 'Pagamento' },
    servico: { nome: 'Prestação de serviço (funcionário ou ex-funcionário)', curto: 'Serviço prestado' },
    liberacao: { nome: 'Liberação de funcionário (para outra escola ou órgão)', curto: 'Liberação' },
    matricula: { nome: 'Matrícula do aluno (está estudando na escola)', curto: 'Matrícula' },
    livre: { nome: 'Texto livre', curto: 'Livre' }
  };
  // valor por extenso em reais
  function porExtenso(n) {
    const U = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    const D = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    const C = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
    const ate999 = x => { if (x === 100) return 'cem'; const c = Math.floor(x / 100), r = x % 100; const p = []; if (c) p.push(C[c]); if (r) p.push(r < 20 ? U[r] : D[Math.floor(r / 10)] + (r % 10 ? ' e ' + U[r % 10] : '')); return p.join(' e '); };
    if (!n) return 'zero';
    const mi = Math.floor(n / 1e6), mil = Math.floor(n / 1000) % 1000, r = n % 1000; const p = [];
    if (mi) p.push(mi === 1 ? 'um milhão' : ate999(mi) + ' milhões');
    if (mil) p.push(mil === 1 ? 'mil' : ate999(mil) + ' mil');
    if (r) p.push(ate999(r));
    const sep = (r && (r < 100 || r % 100 === 0)) || (!r && mil && (mil < 100 || mil % 100 === 0)) ? ' e ' : ' ';
    return p.length === 1 ? p[0] : p.slice(0, -1).join(' ') + sep + p[p.length - 1];
  }
  function reais(s) {
    const t = String(s || '').replace(/[R$\s]/g, ''); if (!t) return null;
    const n = parseFloat(t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t); if (isNaN(n)) return null;
    const r = Math.floor(n + 1e-9), c = Math.round((n - r) * 100);
    const num = 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    let ext = r ? porExtenso(r) + (r === 1 ? ' real' : (r % 1e6 === 0 ? ' de reais' : ' reais')) : '';
    if (c) ext += (ext ? ' e ' : '') + porExtenso(c) + (c === 1 ? ' centavo' : ' centavos');
    return `${num} (${ext})`;
  }
  const doc2 = (rg, cpf) => [rg && 'RG nº ' + rg, cpf && 'CPF nº ' + cpf].filter(Boolean).join(' e ');
  function textoDec(o) {
    const L = '______________________________';
    if (o.modelo === 'pagamento') return `Declaramos, para os devidos fins, que o(a) Sr.(a) *${(o.resp || L).toUpperCase()}*${doc2(o.rg, o.cpf) ? ', portador(a) do ' + doc2(o.rg, o.cpf) : ''}, efetuou pagamento na secretaria do Sistema de Ensino Incentivo no valor de *${reais(o.valor) || 'R$ ________'}*, referente às mensalidades de estudos do(a) aluno(a) *${(o.aluno || L).toUpperCase()}*.\n\nAluno(a) devidamente matriculado(a) neste Sistema de Ensino, onde cursou o(a) ${serieNome(o.turma)} no ano de ${o.anoRef || '____'}.`;
    if (o.modelo === 'servico') return `Declaramos, para os devidos fins, que *${(o.nome || L).toUpperCase()}*${doc2(o.rg2, o.cpf2) ? ', portador(a) do ' + doc2(o.rg2, o.cpf2) : ''}, ${o.ate ? 'prestou' : 'presta'} serviços neste Sistema de Ensino como *${(o.funcao || '__________').toUpperCase()}*${o.ativ ? ', atuando ' + o.ativ.replace(/^atuando\s+/i, '') : ''}, desde ${o.desde || '__________'}${o.ate ? ' até ' + o.ate : ' até a presente data'}.`;
    if (o.modelo === 'liberacao') return `Honrados em cumprimentá-lo(a), vimos por meio deste solicitar a liberação do(a) Sr.(a) *${(o.nome || L).toUpperCase()}*${doc2(o.rg2, o.cpf2) ? ', portador(a) do ' + doc2(o.rg2, o.cpf2) : ''}, em razão do(a) ${o.motivo || '__________'}, que ocorrerá ${/^\d|^nos?\b|^dias?\b/i.test(o.quando || '') ? (/^\d/.test(o.quando) ? 'no(s) dia(s) ' : '') + o.quando : 'no dia ' + (o.quando || '__________')}${o.turno ? ', no(s) turno(s) da ' + o.turno : ''}.\n\nSem mais para o momento, reiteramos votos de estima e consideração.\n\nAtenciosamente,`;
    if (o.modelo === 'matricula') return `Declaramos, para os devidos fins, que o(a) aluno(a) *${(o.alunoM || L).toUpperCase()}*${o.nasc ? ', nascido(a) em ' + fmt(o.nasc) : ''}, está regularmente matriculado(a) neste Sistema de Ensino, cursando o(a) *${serieNome(o.turma)}*${o.turnoM ? ', no turno da ' + o.turnoM.toLowerCase() : ''}, no ano letivo de ${o.anoM || new Date().getFullYear()}.`;
    return o.texto || 'Declaramos, para os devidos fins, que ';
  }
  const COLS = [['a1', '1ª Aval.'], ['a2', '2ª Aval.'], ['a3', '3ª Aval.'], ['a4', '4ª Aval.'], ['r1', '1ª Rec.'], ['r2', '2ª Rec.']];
  const num = s => { const n = parseFloat(String(s || '').replace(',', '.')); return isNaN(n) ? null : n; };
  function media(n) { if (!n) return ''; const a = ['a1', 'a2', 'a3', 'a4'].map(k => num(n[k])); if (a.some(x => x === null)) return ''; // recuperação substitui a menor nota quando for maior
    let l = [...a]; for (const r of ['r1', 'r2'].map(k => num(n[k])).filter(x => x !== null)) { const i = l.indexOf(Math.min(...l)); if (r > l[i]) l[i] = r; }
    return (l.reduce((s, x) => s + x, 0) / 4).toFixed(1).replace('.', ','); }
  const lerLinha = tr => Object.fromEntries([...tr.querySelectorAll('.nt')].map(i => [i.dataset.c, i.value.trim()]));
  const lerNotas = () => Object.fromEntries([...document.querySelectorAll('#notas tbody tr')].map(tr => [tr.dataset.d, lerLinha(tr)]));
  const DIAS = d => d === 'Segunda a sábado' ? ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'] : ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
  const lerGrade = () => { const g = {}; document.querySelectorAll('#grade .gd').forEach(s => { const k = s.dataset.k; const p = document.querySelector(`#grade .gp[data-k="${k}"]`); if (s.value || (p && p.value.trim())) g[k] = { d: s.value, p: p ? p.value.trim() : '' }; }); return g; };
  const TIPOS_EV = ['Feriado', 'Ponto facultativo', 'Recesso / férias', 'Avaliação', 'Recuperação', 'Reunião', 'Evento', 'Letivo (sábado)', 'Planejamento'];
  const COR_EV = { 'Feriado': '#e53935', 'Ponto facultativo': '#f06292', 'Recesso / férias': '#fb8c00', 'Avaliação': '#1e88e5', 'Recuperação': '#8e24aa', 'Reunião': '#43a047', 'Evento': '#00acc1', 'Letivo (sábado)': '#3949ab', 'Planejamento': '#6d4c41' };
  const linhaEv = e => `<div class="ev"><input type="date" class="ev-de" value="${esc(e.de || '')}"><input type="date" class="ev-ate" value="${esc(e.ate || '')}" title="Até (opcional)"><select class="ev-tipo">${TIPOS_EV.map(t => `<option ${e.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}</select><input class="ev-desc" placeholder="Descrição" value="${esc(e.desc || '')}"><button type="button" class="b ghost ev-x" title="Tirar">✕</button></div>`;

  /* ---------- impressão ---------- */
  const NOME_SETOR = { secretaria: 'Secretaria Escolar', coordenacao: 'Coordenação Pedagógica', avisos: 'Secretaria Escolar', calendario: 'Secretaria Escolar', horarios: 'Coordenação Pedagógica' }[SETOR];
  // Cabeçalho: a arte aprovada do site (mascote, Nº 1 em aprovação e logo) com o título na faixa
  const tamTit = t => t.length <= 24 ? Math.min(22, Math.round(330 / Math.max(8, t.length) * 10) / 10) : Math.max(8.5, Math.min(11.5, Math.round(600 / t.length * 10) / 10));
  const cab0 = titulo => `<div class="sei-cab"><div class="sei-cab-tx"><strong class="${titulo.length > 24 ? 'duas' : ''}" style="font-size:${tamTit(titulo)}pt">${esc(titulo)}</strong></div></div><div class="sei-fita"><b>SISTEMA DE ENSINO INCENTIVO</b> · ${NOME_SETOR}${segDoc && SEGS[segDoc] ? ' — ' + SEGS[segDoc].nome : ''}</div>`;
  // Folha no estilo das folhas de aula (mascote, placa, título e barra). FOLHA é preenchido antes de imprimir/baixar.
  let FOLHA = null, titCap = null, nCab = 0;
  const cab = titulo => { if (!titCap) titCap = titulo; if (!FOLHA) return cab0(titulo); return FOLHA.duas ? `<img class="folha-banda" src="${FOLHA.banda}" alt="">` : `<img class="folha-cab" src="${FOLHA.cab}" alt="">`; };
  const PEQ = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'a', 'o', 'em', 'para']);
  const tituloCaso = t => t.toLowerCase().split(' ').map((w, i) => i && PEQ.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const PLACA = { secretaria: ['SECRETARIA', 'ESCOLAR'], coordenacao: ['COORDENAÇÃO', 'PEDAGÓGICA'], avisos: ['AVISOS', 'E COMUNICADOS'], calendario: ['CALENDÁRIO', 'ESCOLAR'], horarios: ['HORÁRIOS', 'DE AULA'] };
  function faixa(d) {
    const t = TIPOS[d.tipo]; const ano = (d.data || '').slice(0, 4);
    const docN = t.nome.split(' /')[0] + (d.numero ? ` nº ${d.numero}/${ano}` : '') + (d.modelo && MOD_DEC[d.modelo] ? ' — ' + MOD_DEC[d.modelo].curto : '');
    const quem = d.aluno || d.alunoM ? ['Aluno(a)', d.aluno || d.alunoM] : d.nome ? ['Nome', d.nome] : d.resp ? ['Responsável', d.resp] : d.assunto || d.titulo ? ['Assunto', d.assunto || d.titulo] : d.tipoR ? ['Reunião', d.tipoR] : (d.publico || d.para) ? ['Para', d.publico || d.para] : ['Setor', NOME_SETOR];
    const tur = d.turma ? ['Turma', [d.turma, d.classe].filter(Boolean).join(' ').replace(/ \((Médio|Convênio)\)/, '')] : ['Segmento', segDoc && SEGS[segDoc] ? SEGS[segDoc].nome : 'Todos'];
    return [['Documento', docN], quem, ['Data', fmt(d.data) || d.ano || ''], tur];
  }
  async function prepFolha(d) {
    segDoc = d.seg || null; FOLHA = null; titCap = null; nCab = 0; TIPOS[d.tipo].doc(d); const tit = tituloCaso(titCap || TIPOS[d.tipo].nome);
    const pl = PLACA[SETOR] || PLACA.secretaria; const sg = segDoc && SEGS[segDoc] ? SEGS[segDoc].nome : '';
    const o = { titulo: tit, curto: tit, placa: { grande: pl[0], linhas: [pl[1], sg.toUpperCase()] }, campos: faixa(d), selo: ['COD. INEP', INEP], rodape: [NOME_SETOR, sg || 'Sistema de Ensino Incentivo'], num: 'SEI', estilo: new URLSearchParams(location.search).get('cab') || 'formal' };
    if (TIPOS[d.tipo].arte) Object.assign(o, TIPOS[d.tipo].arte(d));
    FOLHA = Object.assign(await window.seiFolha.compor(o), { duas: d.copias === '2' }); nCab = 0;
    document.body.style.setProperty('--fundo-doc', `url(${FOLHA.fundo})`);
  }
  if (window.seiFolha) document.body.classList.add('folha');
  const rodape = () => `<div class="sei-rod"><span>📍 Tv. Padre Sátiro, 442 — São Miguel do Guamá/PA</span><span>📞 (91) 9 8124-8323</span><span>📷 @_sei01</span><span class="rod-qr"><img src="assets/docs/qr-whatsapp.png" width="62" alt="QR Code do WhatsApp da escola"><br>Fale com a escola</span></div>`;
  const bloco = (t, val, alto) => `<div class="doc-b"><h4>${t}</h4><div class="doc-t${alto ? ' alto' : ''}">${val ? br(val) : '&nbsp;'}</div></div>`;
  const assina = (n, c) => `<div class="doc-ass um"><div><span></span><b>${esc(n || '')}</b><br>${esc(c || '')}</div></div>`;
  function diasDe(e) { const out = []; if (!e.de) return out; const a = new Date(e.de + 'T12:00'), b = new Date((e.ate || e.de) + 'T12:00'); for (let d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) out.push(d.toISOString().slice(0, 10)); return out; }
  const NAO_LETIVO = new Set(['Feriado', 'Ponto facultativo', 'Recesso / férias']);
  function letivos(d, meses) {
    if (!d.inicio || !d.fim) return null; const fora = new Set(), sab = new Set();
    (d.eventos || []).forEach(e => diasDe(e).forEach(x => { if (NAO_LETIVO.has(e.tipo)) fora.add(x); if (e.tipo === 'Letivo (sábado)') sab.add(x); }));
    let n = 0; for (let x = new Date(d.inicio + 'T12:00'); x <= new Date(d.fim + 'T12:00'); x.setDate(x.getDate() + 1)) { const k = x.toISOString().slice(0, 10), w = x.getDay(); if (meses && !meses.includes(x.getMonth())) continue; if ((w >= 1 && w <= 5 && !fora.has(k)) || sab.has(k)) n++; }
    return n;
  }
  const mesesDe = d => d.semestre === '1º semestre' ? [0, 1, 2, 3, 4, 5] : d.semestre === '2º semestre' ? [6, 7, 8, 9, 10, 11] : [...Array(12).keys()];
  const COR_MES = ['#1e6fe8', '#7b3fd6', '#0a9d74', '#f0671f', '#2f47c4', '#d6336c', '#0d8f8f', '#f29f05', '#5b3cc4', '#c62828', '#0b8ed1', '#2e8b3e'];
  const ICO_MES = [
    '<circle cx="12" cy="12" r="4.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
    '<path d="M3 9c0-2 2-3 4.5-3S12 7.5 12 7.5 14.5 6 16.5 6 21 7 21 9c0 4-3 7-5 7s-2.5-2-4-2-2 2-4 2-5-3-5-7z"/><circle cx="8" cy="10" r="1.3"/><circle cx="16" cy="10" r="1.3"/>',
    '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/><path d="M9 15a3 3 0 0 0 3 3"/>',
    '<path d="M12 6c-2-1.5-5-2-8-1.5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-13c-3-.5-6 0-8 1.5zM12 6v13"/>',
    '<circle cx="12" cy="10" r="2.5"/><path d="M12 7.5c0-3 3-4 3-4s1 3-1.5 4.5M14.5 10c3 0 4 3 4 3s-3 1-4.5-1.5M12 12.5c0 3-3 4-3 4s-1-3 1.5-4.5M9.5 10c-3 0-4-3-4-3s3-1 4.5 1.5M12 13v8"/>',
    '<path d="M2 5h20M3 5l2.5 5L8 5l2.5 5L13 5l2.5 5L18 5l2.5 5L22 5M8 21l4-7 4 7M10 18h4"/>',
    '<path d="M12 2 19 9 12 16 5 9z"/><path d="M12 16c0 3 2 3 1 6M5 9h14M12 2v14"/>',
    '<path d="M4 20c4-1 6-6 6-11 3 2 5 5 5 9M15 18c2-3 2-7 0-11 3 1 5 4 5 8"/><path d="M3 20h18"/>',
    '<path d="M5 21V4M5 4h13l-3 4 3 4H5"/>',
    '<ellipse cx="12" cy="9" rx="5" ry="6"/><path d="M12 15l-1 2h2zM12 17c0 2-2 2-1 5"/>',
    '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5M20 10v6"/>',
    '<path d="M12 2l2.4 5 5.6.8-4 3.9.9 5.6L12 14.6 7.1 17.3 8 11.7 4 7.8 9.6 7z"/><path d="M12 17v5M9 22h6"/>'];
  const svgMes = m => `<img class="cm-ic" alt="" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='48' height='48' fill='none' stroke='#ffffff' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'>${ICO_MES[m]}</svg>`)}">`;
  const CURTO_EV = { 'Feriado': 'Feriado', 'Ponto facultativo': 'Facultativo', 'Recesso / férias': 'Recesso' };
  function docCalendario(d) {
    const y = +d.ano || new Date().getFullYear(); const marca = {};
    (d.eventos || []).forEach(e => diasDe(e).forEach(x => { if (!marca[x] || NAO_LETIVO.has(e.tipo)) marca[x] = e.tipo; }));
    const ini = d.inicio, fim = d.fim; const evs = [...(d.eventos || [])].sort((a, b) => a.de.localeCompare(b.de));
    const dd = k => k.slice(8, 10);
    const mes = m => {
      const c = COR_MES[m]; const p = new Date(y, m, 1).getDay(); const n = new Date(y, m + 1, 0).getDate(); const nl = letivos(d, [m]);
      let h = '<tr>' + '<td></td>'.repeat(p);
      for (let i = 1; i <= n; i++) { const k = `${y}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`; const t = marca[k]; const w = (p + i - 1) % 7; const cls = w === 0 ? 'dom' : w === 6 ? 'sab' : '';
        const n2 = String(i).padStart(2, '0'); const ehIni = k === ini || k === fim;
        h += t ? `<td class="${cls}" style="background:${COR_EV[t]};color:#fff"><b>${n2}</b></td>` : `<td class="${cls}${ehIni ? ' ini' : ''}"${ehIni ? ` style="background:#ffd34d;color:#0b2a5b"` : ''}>${n2}</td>`; if (w === 6 && i < n) h += '</tr><tr>'; }
      const me = evs.filter(e => (+e.de.slice(5, 7) - 1) === m && +e.de.slice(0, 4) === y);
      const extra = []; if (ini && +ini.slice(5, 7) - 1 === m && +ini.slice(0, 4) === y) extra.push({ de: ini, tipo: '_ini', desc: 'Início das aulas' }); if (fim && +fim.slice(5, 7) - 1 === m && +fim.slice(0, 4) === y) extra.push({ de: fim, tipo: '_fim', desc: 'Encerramento das aulas' });
      const lista = me.concat(extra).sort((a, b) => a.de.localeCompare(b.de));
      return `<div class="cm"><div class="cm-h" style="background:linear-gradient(120deg,${c},${tintaHex(c, .62)})">${svgMes(m)}<b>${MESES[m].toUpperCase()}</b><em>${String(m + 1).padStart(2, '0')}</em>${nl !== null ? `<span>${nl} dias letivos</span>` : ''}</div>
        <table class="cm-t"><tr>${['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map((x, i) => `<th class="${i === 0 ? 'dom' : ''}" style="color:${i === 0 ? '#e53935' : c}">${x}</th>`).join('')}</tr>${h}</tr></table>
        <div class="cm-ev">${lista.map(e => `<p style="border-left-color:${e.tipo === '_ini' || e.tipo === '_fim' ? '#e0a800' : COR_EV[e.tipo] || c}"><i style="background:${e.tipo === '_ini' || e.tipo === '_fim' ? '#e0a800' : COR_EV[e.tipo] || c}">${dd(e.de)}${e.ate && e.ate !== e.de ? '–' + dd(e.ate) : ''}</i><span>${esc(e.desc || e.tipo)}${CURTO_EV[e.tipo] ? ` <em>(${CURTO_EV[e.tipo]})</em>` : ''}</span></p>`).join('') || '<p class="vazio">—</p>'}</div></div>`;
    };
    const blocos = d.semestre === '1º semestre' ? [[0, 1, 2, 3, 4, 5]] : d.semestre === '2º semestre' ? [[6, 7, 8, 9, 10, 11]] : [[0, 1, 2, 3, 4, 5], [6, 7, 8, 9, 10, 11]];
    const usados = new Set(evs.map(e => e.tipo));
    const leg = `<div class="cal-leg2">${Object.entries(COR_EV).filter(([t]) => usados.has(t)).map(([t, c]) => `<span><i style="background:${c}"></i>${t}</span>`).join('')}<span><i style="background:#ffd34d"></i>Início / fim das aulas</span><span><i class="dom"></i>Domingo</span></div>`;
    const todosM = blocos.flat(); const doPer = e => todosM.includes(+e.de.slice(5, 7) - 1) && +e.de.slice(0, 4) === y;
    const qtd = t => evs.filter(e => doPer(e) && t.includes(e.tipo)).length;
    const resumo = `<table class="cal-res2"><tr><td class="cr-a"><small>${d.semestre && d.semestre !== 'Ano inteiro' ? d.semestre.toUpperCase() : 'ANO LETIVO'}</small><b>${y}</b></td><td><small>INÍCIO DAS AULAS</small><b>${fmt(ini) || '—'}</b></td><td><small>ENCERRAMENTO</small><b>${fmt(fim) || '—'}</b></td><td><small>DIAS LETIVOS</small><b style="color:#0a9d74">${letivos(d, todosM) ?? '—'}</b></td><td><small>AVALIAÇÕES</small><b style="color:#1e6fe8">${qtd(['Avaliação', 'Recuperação'])}</b></td><td><small>FERIADOS</small><b style="color:#e53935">${qtd(['Feriado', 'Ponto facultativo'])}</b></td></tr></table>`;
    return `${cab('CALENDÁRIO PEDAGÓGICO')}${resumo}${blocos.map((b, i) => { const nl = letivos(d, b); const sem = b[0] ? '2º semestre' : '1º semestre';
      return `<div class="calp-pag"${i ? ' style="page-break-before:always;break-before:page"' : ''}>${blocos.length > 1 ? `<h3 class="calp-sem">${sem} · ${y}</h3>` : ''}<div class="calp">${b.map(mes).join('')}</div>
      <div class="calp-rod">${leg}<div class="calp-tot"><span>Dias letivos ${blocos.length > 1 ? 'no ' + sem : d.semestre ? 'no ' + d.semestre : ''}</span><b>${nl === null ? '—' : nl}</b></div></div></div>`; }).join('')}
      ${blocos.length > 1 ? `<p class="calp-ano">Total de dias letivos no ano: <b>${letivos(d)}</b></p>` : ''}`;
  }
  // cor de cada disciplina (a mesma no boletim e no horário)
  const COR_DISC = { 'língua portuguesa': '#1e6fe8', 'português': '#1e6fe8', 'matemática': '#e53935', 'ciências': '#0a9d74', 'biologia': '#2e8b3e', 'física': '#5b3cc4', 'química': '#d6336c', 'história': '#b8860b', 'geografia': '#0d8f8f', 'inglês': '#3949ab', 'espanhol': '#f0671f', 'arte': '#8e24aa', 'artes': '#8e24aa', 'educação física': '#f29f05', 'ensino religioso': '#6d4c41', 'filosofia': '#546e7a', 'sociologia': '#00838f', 'redação': '#c62828', 'literatura': '#ad1457' };
  const PAL = ['#1e6fe8', '#e53935', '#0a9d74', '#5b3cc4', '#f0671f', '#0d8f8f', '#d6336c', '#b8860b', '#3949ab', '#2e8b3e', '#8e24aa', '#f29f05'];
  const COR_N = {}; const corDisc = n => { if (!COR_N._) { Object.entries(COR_DISC).forEach(([k, v]) => { COR_N[normal(k)] = v; }); COR_N._ = 1; } const k = normal(n); if (COR_N[k]) return COR_N[k]; let h = 0; for (const c of k) h = (h * 31 + c.charCodeAt(0)) >>> 0; return PAL[h % PAL.length]; };
  const tinta = (hex, a) => { const m = /^#(..)(..)(..)$/.exec(hex); return m ? `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${a})` : hex; };
  const tintaHex = (hex, a) => { const m = /^#(..)(..)(..)$/.exec(hex); if (!m) return hex; return '#' + [1, 2, 3].map(i => Math.round(255 - (255 - parseInt(m[i], 16)) * a).toString(16).padStart(2, '0')).join(''); };
  const iniciais = n => (n || '').trim().split(/\s+/).filter(w => w.length > 2 || /^[A-ZÁÉÍÓÚ]/.test(w)).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';
  function docBoletim(d) {
    const n = d.notas || {}; const ds = Object.keys(n); const min = num(d.minima) || 6;
    const medias = ds.map(x => num(media(n[x]))).filter(v => v !== null);
    const mg = medias.length ? medias.reduce((a, b) => a + b, 0) / medias.length : null;
    const faltas = ds.reduce((a, x) => a + (parseInt(n[x].faltas) || 0), 0);
    const abaixo = ds.filter(x => { const m = num(media(n[x])); return m !== null && m < min; });
    const sit = !medias.length ? ['Em andamento', '#7a869a'] : abaixo.length ? ['Em recuperação', '#f0671f'] : medias.length === ds.length ? ['Aprovado(a)', '#0a9d74'] : ['Em andamento', '#1e6fe8'];
    const nota = v => { const x = num(v); const c = x === null ? null : x >= min ? '#0a9d74' : x >= min - 1 ? '#f29f05' : '#e53935';
      return x === null ? '<td class="bn vazio">—</td>' : `<td class="bn" style="background:${tintaHex(c, .16)};color:${c}"><b>${esc(String(v).replace('.', ','))}</b></td>`; };
    const tur = [d.turma, d.classe].filter(Boolean).join(' ').replace(/ \((Médio|Convênio)\)/, '');
    return `${cab('BOLETIM ESCOLAR')}
      <table class="bol-aluno"><tr><td class="bol-av" rowspan="2"><span>${esc(iniciais(d.aluno))}</span></td><td class="bol-nome"><small>ALUNO(A)</small><b>${esc(d.aluno || '')}</b></td>
        <td class="bol-st" rowspan="2"><small>MÉDIA GERAL</small><b style="color:${mg === null ? '#7a869a' : mg >= min ? '#0a9d74' : '#e53935'}">${mg === null ? '—' : mg.toFixed(1).replace('.', ',')}</b></td>
        <td class="bol-st" rowspan="2"><small>FALTAS</small><b>${faltas}</b></td>
        <td class="bol-st" rowspan="2"><small>SITUAÇÃO</small><em style="background:${sit[1]}">${sit[0]}</em></td></tr>
        <tr><td class="bol-tags"><i>${esc(tur || '—')}</i><i>Ano letivo ${esc(d.ano || '')}</i><i>Média mínima ${esc(d.minima || '6,0')}</i></td></tr></table>
      <table class="bol-t"><thead><tr><th class="bd">Disciplina</th>${COLS.map(c => `<th>${c[1].replace('Aval.', 'Av.')}</th>`).join('')}<th class="bm">Média</th><th>Faltas</th><th>Situação</th></tr></thead><tbody>
      ${ds.map(x => { const m = media(n[x]); const mn = num(m); const c = corDisc(x); const st = mn === null ? ['', ''] : mn >= min ? ['Aprovado', '#0a9d74'] : ['Recuperação', '#e53935'];
        return `<tr><td class="bd"><i style="background:${c}"></i>${esc(x)}</td>${COLS.map(cc => nota(n[x][cc[0]])).join('')}<td class="bm" ${mn === null ? '' : `style="background:${mn >= min ? '#0a9d74' : '#e53935'};color:#fff"`}><b>${esc(m || '—')}</b></td><td class="bf">${esc(n[x].faltas || '0')}</td><td class="bs">${st[0] ? `<em style="color:${st[1]};border-color:${st[1]}">${st[0]}</em>` : ''}</td></tr>`; }).join('')}</tbody></table>
      ${medias.length ? `<div class="bol-graf"><h4>Desempenho por disciplina</h4><div class="bg-cols">${ds.map(x => { const mn = num(media(n[x])); if (mn === null) return ''; const c = corDisc(x);
        return `<div class="bg-l"><span>${esc(x)}</span><div class="bg-b"><i style="width:${Math.min(100, mn * 10)}%;background:linear-gradient(90deg,${tinta(c, .55)},${c})"></i><u style="left:${min * 10}%"></u></div><b style="color:${c}">${mn.toFixed(1).replace('.', ',')}</b></div>`; }).join('')}</div><p class="bg-leg"><u></u> média mínima (${esc(d.minima || '6,0')})</p></div>` : ''}
      <p class="doc-rev bol-leg"><span style="background:#e6f6f1;color:#0a9d74">≥ média</span><span style="background:#fef3dc;color:#b37400">até 1 ponto abaixo</span><span style="background:#fdeaea;color:#e53935">abaixo da média</span> A nota da recuperação substitui a menor nota das avaliações quando for maior.</p>
      ${d.obs ? bloco('Observações', d.obs) : ''}
      <p class="doc-fim bol-fim">${CIDADE.split(' —')[0]}, ${extenso(d.data)}.</p><div class="doc-ass bol-ass"><div><span></span>Secretaria Escolar</div><div><span></span>Responsável</div></div>`;
  }
  function docHorario(d) {
    const dias = DIAS(d.dias); const g = d.grade || {};
    const usados = new Map(); Object.values(g).forEach(c => { if (c.d) { const k = c.d; if (!usados.has(k)) usados.set(k, new Set()); if (c.p) usados.get(k).add(c.p); } });
    const tur = [d.turma, d.classe].filter(Boolean).join(' ').replace(/ \((Médio|Convênio)\)/, '');
    let n = 0;
    return `${cab('HORÁRIO DE AULA')}
      <table class="hor-top"><tr><td class="ht-tur"><small>TURMA</small><b>${esc(tur || '—')}</b></td><td class="ht-i"><small>TURNO</small><b>${esc(d.turno || '—')}</b></td><td class="ht-i"><small>DIAS</small><b>${esc(d.dias || '')}</b></td><td class="ht-i"><small>VÁLIDO A PARTIR DE</small><b>${fmt(d.data) || '—'}</b></td><td class="ht-i"><small>AULAS POR SEMANA</small><b>${Object.values(g).filter(c => c.d).length}</b></td></tr></table>
      <table class="hor-t"><thead><tr><th class="hh">Horário</th>${dias.map((x, i) => `<th style="background:${['#1e6fe8', '#0a9d74', '#5b3cc4', '#f0671f', '#d6336c', '#0d8f8f'][i]}">${x}</th>`).join('')}</tr></thead><tbody>
      ${(d.aulas || []).map((a, i) => { if (/^interv/i.test(a[0])) return `<tr class="hiv"><td colspan="${dias.length + 1}">☕ INTERVALO${a[1] ? ' · ' + esc(a[1]) : ''}</td></tr>`; n++;
        return `<tr><td class="hh"><em>${n}º</em><b>${esc(a[0])}</b>${a[1] ? `<small>${esc(a[1])}</small>` : ''}</td>${dias.map(x => { const c = g[i + '|' + x] || {}; if (!c.d && !c.p) return '<td class="hc vazio"></td>'; const cor = corDisc(c.d || c.p);
          return `<td class="hc" style="background:${tintaHex(cor, .14)};border-left-color:${cor}"><b style="color:${cor}">${esc(c.d || '')}</b>${c.p ? `<small>${esc(c.p)}</small>` : ''}</td>`; }).join('')}</tr>`; }).join('')}</tbody></table>
      ${usados.size ? `<div class="hor-leg"><h4>Professores da turma</h4><div>${[...usados].map(([dsc, ps]) => `<span style="border-color:${corDisc(dsc)}"><i style="background:${corDisc(dsc)}"></i><b>${esc(dsc)}</b>${ps.size ? ' — ' + esc([...ps].join(', ')) : ''}</span>`).join('')}</div></div>` : ''}`;
  }

  /* ---------- Horários: professores, disponibilidade e conflitos ---------- */
  const DIAS6 = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'], TURNOS = ['Manhã', 'Tarde', 'Noite'];
  const min = t => { const m = /(\d{1,2})[:h.](\d{2})/.exec(t || ''); return m ? +m[1] * 60 + +m[2] : null; };
  const turnoDe = (ini, padrao) => { const m = min(ini); if (m === null) return /tarde/i.test(padrao || '') ? 'Tarde' : /noite/i.test(padrao || '') ? 'Noite' : 'Manhã'; return m < 12 * 60 + 30 ? 'Manhã' : m < 18 * 60 ? 'Tarde' : 'Noite'; };
  const nomeT = h => [h.turma, h.classe].filter(Boolean).join(' ').replace(/ \((Médio|Convênio)\)/, '');
  const normal = s => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');
  const achaProf = nome => profs.find(x => normal(x.nome) === normal(nome));
  let editProf = null;
  const chaveT = x => x.turma + '|' + (x.classe || '') + '|' + (x.turno || '');
  const rotT = k => { const [t, c, tu] = k.split('|'); return nomeT({ turma: t, classe: c }) + (tu ? ' (' + tu + ')' : ''); };
  function turmasConhecidas(ets) {
    const set = new Map(); for (const x of todosHor.concat(planosTodos)) if (!ets.length || ets.includes(etapaDe(x.turma))) set.set(chaveT(x), 1);
    return [...set.keys()].sort((a, b) => TURMAS.indexOf(a.split('|')[0]) - TURMAS.indexOf(b.split('|')[0]) || a.localeCompare(b));
  }
  // o professor dá aula nesta turma? (se ele não marcou turmas, vale para todas da etapa)
  const daTurma = (p, x) => !(p.turmas || []).length || p.turmas.includes(chaveT(x)) || p.turmas.includes(x.turma + '||');
  // todas as aulas de um horário: [{dia, ini, fim, turno, disc, prof, k}]
  function aulasDe(h) {
    const out = []; const g = h.grade || {};
    (h.aulas || []).forEach((a, i) => { if (/^interv/i.test(a[0] || '')) return; const ini = min(a[0]), fim = min(a[1]) ?? (ini !== null ? ini + 50 : null);
      DIAS(h.dias).forEach(dia => { const c = g[i + '|' + dia]; if (c && (c.p || c.d)) out.push({ dia, ini, fim, turno: turnoDe(a[0], h.turno), disc: c.d, prof: (c.p || '').trim(), k: i + '|' + dia, h }); }); });
    return out;
  }
  const choca = (a, b) => a.dia === b.dia && (a.ini === null || b.ini === null ? a.turno === b.turno && a.k.split('|')[0] === b.k.split('|')[0] : a.ini < b.fim && b.ini < a.fim);
  // problemas de uma aula (em relação aos outros horários salvos)
  function problemas(x, outros) {
    const r = []; if (!x.prof) return r; const p = achaProf(x.prof);
    if (!p) { r.push({ n: 1, t: 'Professor(a) não cadastrado(a) — cadastre para o site conferir a disponibilidade.' }); }
    else {
      if (p.disp && p.disp[x.dia + '|' + x.turno] === 0) r.push({ n: 3, t: `${p.nome} não pode na ${x.dia.toLowerCase()} de ${x.turno.toLowerCase()}.` });
      if (x.disc && (p.disciplinas || []).length && !p.disciplinas.includes(x.disc)) r.push({ n: 2, t: `${x.disc} não está entre as disciplinas de ${p.nome}.` });
      if (x.h && x.h.turma && !daTurma(p, x.h)) r.push({ n: 2, t: `${nomeT(x.h)} não está entre as turmas de ${p.nome} neste ano.` });
    }
    for (const o of outros) if (normal(o.prof) === normal(x.prof) && choca(x, o)) r.push({ n: 3, t: `${x.prof} já está no ${nomeT(o.h)} (${o.disc || 'aula'}) nesse horário.` });
    return r;
  }
  function cargaDe(nome, extra) { let n = 0; for (const h of todosHor) for (const a of aulasDe(h)) if (normal(a.prof) === normal(nome)) n++; return n + (extra || 0); }
  function conflitosGerais() {
    const todas = todosHor.flatMap(aulasDe); const out = [];
    const vistos = new Set();
    todas.forEach((x, i) => { const outros = todas.filter((o, j) => j !== i && o.h.id !== x.h.id);
      for (const p of problemas(x, outros)) { if (p.n !== 3) continue;
        const ch = /já está no/.test(p.t) ? 'c|' + normal(x.prof) + '|' + x.dia + '|' + x.ini : 'i|' + x.h.id + '|' + x.k;
        if (vistos.has(ch)) continue; vistos.add(ch);
        const outro = /já está no (.*?) \(/.exec(p.t);
        out.push({ ...p, t: outro ? `${x.prof} está em duas turmas ao mesmo tempo: ${nomeT(x.h)} e ${outro[1]}.` : p.t, onde: `${x.dia} ${x.h.aulas[+x.k.split('|')[0]][0]}` }); } });
    return out;
  }
  // checagem ao vivo no formulário do horário
  function horDoForm(d) { return Object.assign({}, d, { turma: v('turma'), classe: v('classe').trim(), turno: v('turno').trim(), dias: v('dias'), aulas: [...document.querySelectorAll('#grade tbody tr')].map(r => [r.querySelector('.hi').value.trim(), r.querySelector('.hf').value.trim()]), grade: lerGrade() }); }
  function checaForm(d) {
    const h = horDoForm(d); const outros = todosHor.filter(o => o.id !== d.id).flatMap(aulasDe); const mine = aulasDe(h);
    const lista2 = []; document.querySelectorAll('#grade td').forEach(td => td.classList.remove('conflito', 'aviso'));
    document.querySelectorAll('#grade .alerta-c').forEach(sp => { sp.textContent = ''; sp.title = ''; });
    mine.forEach(x => {
      const iguais = mine.filter(o => o !== x && o.prof && normal(o.prof) === normal(x.prof) && o.k !== x.k && choca(x, o)).map(o => ({ prof: o.prof, h: { turma: 'esta mesma turma' }, dia: o.dia, ini: o.ini, fim: o.fim, turno: o.turno, k: o.k, disc: o.disc }));
      const pr = problemas(x, outros.concat(iguais)); if (!pr.length) return;
      const pior = Math.max(...pr.map(z => z.n)); const sp = document.querySelector(`#grade .alerta-c[data-k="${x.k}"]`); const td = sp && sp.closest('td');
      if (td) { td.classList.add(pior === 3 ? 'conflito' : 'aviso'); sp.textContent = pior === 3 ? '⛔' : pior === 2 ? '⚠️' : 'ℹ️'; sp.title = pr.map(z => z.t).join('\n'); }
      pr.forEach(z => lista2.push({ ...z, onde: `${x.dia}, ${h.aulas[+x.k.split('|')[0]][0]}` }));
    });
    // carga semanal
    const porProf = {}; mine.forEach(x => { if (x.prof) porProf[normal(x.prof)] = (porProf[normal(x.prof)] || 0) + 1; });
    for (const [nn, q] of Object.entries(porProf)) { const p = profs.find(z => normal(z.nome) === nn); if (p && +p.max) { const tot = todosHor.filter(o => o.id !== d.id).flatMap(aulasDe).filter(a => normal(a.prof) === nn).length + q; if (tot > +p.max) lista2.push({ n: 2, t: `${p.nome} fica com ${tot} aulas na semana (máximo ${p.max}).`, onde: 'Carga semanal' }); } }
    const box = $('#alertas'); if (!box) return;
    const c = lista2.filter(z => z.n === 3).length, a = lista2.filter(z => z.n < 3).length;
    box.className = 'alertas ' + (c ? 'tem-c' : a ? 'tem-a' : 'ok');
    box.innerHTML = !lista2.length ? (mine.some(x => x.prof) ? '✅ Nenhum conflito: os professores estão disponíveis e não se repetem em outra turma no mesmo horário.' : '') :
      `<b>${c ? '⛔ ' + c + ' conflito' + (c > 1 ? 's' : '') : ''}${c && a ? ' · ' : ''}${a ? '⚠️ ' + a + ' aviso' + (a > 1 ? 's' : '') : ''}</b><ul>${lista2.slice(0, 12).map(z => `<li class="n${z.n}"><span>${esc(z.onde)}:</span> ${esc(z.t)}</li>`).join('')}</ul>`;
  }
  async function ligaChecagem(d) {
    const et = etapaDe(v('turma')); const ds = await disciplinas(v('turma'));
    const daEtapa = profs.filter(p => !(p.etapas || []).length || p.etapas.includes(et));
    $('#profsDL').innerHTML = daEtapa.map(p => `<option value="${esc(p.nome)}">${esc((p.disciplinas || []).filter(x => ds.includes(x)).join(', '))}</option>`).join('');
    checaForm(d);
  }
  // ao escolher a disciplina: se só um professor livre pode dar, já preenche
  function sugere(d, k) {
    const inp = document.querySelector(`#grade .gp[data-k="${k}"]`); const disc = document.querySelector(`#grade .gd[data-k="${k}"]`).value; if (!inp || inp.value.trim() || !disc) return;
    const h = horDoForm(d); const [i, dia] = k.split('|'); const a = h.aulas[+i]; const ini = min(a[0]); const x0 = { dia, ini, fim: min(a[1]) ?? (ini !== null ? ini + 50 : null), turno: turnoDe(a[0], h.turno), disc, k };
    const outros = todosHor.filter(o => o.id !== d.id).flatMap(aulasDe).concat(aulasDe(h).filter(o => o.k !== k));
    const et = etapaDe(h.turma); const livres = profs.filter(p => (p.disciplinas || []).includes(disc) && (!(p.etapas || []).length || p.etapas.includes(et)) && !problemas({ ...x0, prof: p.nome, h }, outros).some(z => z.n === 3));
    if (livres.length === 1) { inp.value = livres[0].nome; inp.classList.add('sugerido'); setTimeout(() => inp.classList.remove('sugerido'), 1500); }
  }
  // tela: lista de professores
  function telaProfs() {
    $('#docs').innerHTML = `<nav class="trilha"><button class="b ghost" data-modo="">‹ Horário de aula</button><span>›</span><b class="tr-atual">👩‍🏫 Professores</b></nav>
      <div class="acoes"><button class="b main" id="novoProf">➕ Cadastrar professor(a)</button></div>
      <p class="dica">A ordem conta: quem informou a disponibilidade primeiro é encaixado primeiro no horário ideal, e os seguintes se ajustam nos horários que sobram. Use ↑ e ↓ para mudar a ordem.</p>
      ${profs.length ? `<div class="cards">${profs.map(p => { const n = cargaDe(p.nome); const ind = Object.values(p.disp || {}).filter(x => x === 0).length; return `<article class="aula"><div class="topo"><b>${esc(p.nome)}</b><span class="tag">${n} aula${n === 1 ? '' : 's'}${+p.max ? ' / ' + p.max : ''}</span></div>
        <p class="cont">${esc((p.etapas || []).map(k => ETAPAS[k] ? ETAPAS[k].nome : k).join(', ') || 'Todas as etapas')}</p><p class="hab">${(p.disciplinas || []).map(x => `<span>${esc(x)}</span>`).join('')}</p>
        <p class="cont">${ind ? '🚫 Não pode em ' + ind + ' período' + (ind > 1 ? 's' : '') + ' da semana' : '✅ Disponível em todos os períodos'}</p>
        ${(p.turmas || []).length ? `<p class="cont">🏫 ${esc(p.turmas.map(rotT).join(', '))}</p>` : ''}
        <div class="acoes"><span class="ordem">${profs.indexOf(p) + 1}º</span><button class="b" data-sobe="${p.id}" title="Passar na frente">↑</button><button class="b" data-desce="${p.id}" title="Passar para trás">↓</button><button class="b" data-edprof="${p.id}">✏️ Editar</button><button class="b ghost" data-delprof="${p.id}">Excluir</button></div></article>`; }).join('')}</div>`
        : '<p class="dica">Cadastre os professores com as etapas, as disciplinas e a disponibilidade. Depois, ao montar os horários, o site avisa os conflitos.</p>'}`;
    $('#novoProf').onclick = () => { editProf = { tipo: 'professor', setor: 'horarios', nome: '', etapas: [], disciplinas: [], disp: {}, max: '' }; modo = 'prof'; tela(); };
  }
  async function discDasEtapas(ets) {
    const ts = (ets.length ? ets : Object.keys(ETAPAS)).flatMap(k => ETAPAS[k].turmas); const set = new Set();
    for (const t of ts) (await disciplinas(t)).forEach(x => set.add(x)); return [...set].sort((a, b) => a.localeCompare(b, 'pt'));
  }
  async function formProf() {
    const p = editProf; const ch = (nome, ops, marc, lab2) => `<div class="chips">${ops.map(o => `<label><input type="checkbox" name="${nome}" value="${esc(o[0])}" ${marc.includes(o[0]) ? 'checked' : ''}><span>${esc(o[1])}</span></label>`).join('')}</div>`;
    const grade = () => `<table class="disp"><thead><tr><th></th>${DIAS6.map(dd => `<th>${dd.slice(0, 3)}</th>`).join('')}</tr></thead><tbody>${TURNOS.map(t => `<tr><th>${t}</th>${DIAS6.map(dd => { const k = dd + '|' + t; const val = p.disp[k] === undefined ? (dd === 'Sábado' || t === 'Noite' ? null : 1) : p.disp[k]; return `<td><button type="button" class="dp ${val === 1 ? 'sim' : val === 0 ? 'nao' : 'nd'}" data-dk="${k}">${val === 1 ? '✓' : val === 0 ? '✕' : '–'}</button></td>`; }).join('')}</tr>`).join('')}</tbody></table>`;
    $('#docs').innerHTML = `<nav class="trilha"><button class="b ghost" data-modo="profs">‹ Professores</button></nav><form class="ficha" id="fProf"><h3>👩‍🏫 ${p.id ? 'Editar' : 'Cadastrar'} professor(a)</h3>
      <div class="g2">${lab('Nome', inp('pNome', p.nome, 'Nome do professor(a)'))}${lab('Máximo de aulas por semana (opcional)', inp('pMax', p.max, 'Ex.: 20', 'number'))}</div>
      <label class="full"><span>Etapas em que dá aula</span>${ch('et', Object.entries(ETAPAS).map(([k, e]) => [k, e.nome]), p.etapas || [])}</label>
      <label class="full"><span>Disciplinas</span><div id="discBox"></div></label>
      <label class="full"><span>Turmas em que vai dar aula neste ano <small>(sem marcar nenhuma, vale para todas as turmas das etapas)</small></span><div id="turBox"></div></label>
      <label class="full"><span>Disponibilidade — toque para marcar: <b class="ok">✓ pode</b> · <b class="no">✕ não pode</b> · – não se aplica</span><div class="tab" id="dispBox">${grade()}</div></label>
      <div class="acoes"><button class="b main" type="submit">💾 Salvar</button><button class="b ghost" type="button" data-modo="profs">Cancelar</button></div></form>`;
    const desenhaDisc = async () => { const ets = [...document.querySelectorAll('input[name=et]:checked')].map(i => i.value); const marc = [...document.querySelectorAll('input[name=di]:checked')].map(i => i.value).concat(p.disciplinas || []); const ds = await discDasEtapas(ets); $('#discBox').innerHTML = ch('di', ds.map(x => [x, x]), marc); };
    const desenhaTur = () => { const ets = [...document.querySelectorAll('input[name=et]:checked')].map(i => i.value); const marc = [...document.querySelectorAll('input[name=tu]:checked')].map(i => i.value).concat(p.turmas || []);
      const conh = turmasConhecidas(ets); const series = (ets.length ? ets : Object.keys(ETAPAS)).flatMap(k => ETAPAS[k].turmas).filter(t => !conh.some(c => c.startsWith(t + '|'))).map(t => t + '||');
      const ops = conh.concat(series).concat(marc.filter(m => !conh.includes(m) && !series.includes(m)));
      $('#turBox').innerHTML = ch('tu', [...new Set(ops)].map(k => [k, k.endsWith('||') ? nomeT({ turma: k.split('|')[0] }) + ' (todas as letras)' : rotT(k)]), marc); };
    await desenhaDisc(); desenhaTur(); document.querySelectorAll('input[name=et]').forEach(i => i.onchange = () => { desenhaDisc(); desenhaTur(); });
    $('#dispBox').onclick = e => { const b = e.target.closest('.dp'); if (!b) return; const k = b.dataset.dk; const cur = b.classList.contains('sim') ? 1 : b.classList.contains('nao') ? 0 : null; const nx = cur === 1 ? 0 : cur === 0 ? null : 1; p.disp[k] = nx; b.className = 'dp ' + (nx === 1 ? 'sim' : nx === 0 ? 'nao' : 'nd'); b.textContent = nx === 1 ? '✓' : nx === 0 ? '✕' : '–'; };
    $('#fProf').onsubmit = async e => {
      e.preventDefault(); const nome = v('pNome').trim().replace(/\s+/g, ' '); if (!nome) { alert('Escreva o nome do professor(a).'); return; }
      if (profs.some(x => x.id !== p.id && normal(x.nome) === normal(nome))) { alert('Já existe um professor com esse nome.'); return; }
      document.querySelectorAll('#dispBox .dp').forEach(b => { p.disp[b.dataset.dk] = b.classList.contains('sim') ? 1 : b.classList.contains('nao') ? 0 : null; });
      p.turmas = [...document.querySelectorAll('input[name=tu]:checked')].map(i => i.value);
      if (p.ordem === undefined) p.ordem = profs.length;
      Object.assign(p, { nome, max: v('pMax').trim(), etapas: [...document.querySelectorAll('input[name=et]:checked')].map(i => i.value), disciplinas: [...document.querySelectorAll('input[name=di]:checked')].map(i => i.value) });
      if (!p.id) { p.id = novoId(); p.criado = Date.now(); }
      await gravar(p); aviso('Professor(a) salvo(a).'); modo = 'profs'; editProf = null; await carregar();
    };
  }
  // quadro: semana de cada professor, em todas as turmas
  function quadroHTML(imp) {
    const todas = todosHor.flatMap(aulasDe).filter(a => a.prof);
    const nomes = [...new Set(profs.map(p => p.nome).concat(todas.map(a => a.prof)).map(n => n.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt'));
    const uniq = []; nomes.forEach(n => { if (!uniq.some(u => normal(u) === normal(n))) uniq.push(n); });
    const conf = conflitosGerais();
    const bloco = nome => { const minhas = todas.filter(a => normal(a.prof) === normal(nome)); const p = achaProf(nome);
      const horas = [...new Set(minhas.map(a => a.ini).filter(x => x !== null))].sort((a, b) => a - b); const hh = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
      const dias = DIAS6.filter(dd => dd !== 'Sábado' || minhas.some(a => a.dia === 'Sábado'));
      const corpo = horas.length ? horas.map(hr => `<tr><th>${hh(hr)}</th>${dias.map(dd => { const aqui = minhas.filter(a => a.dia === dd && a.ini === hr); const ruim = aqui.length > 1 || aqui.some(a => p && p.disp && p.disp[a.dia + '|' + a.turno] === 0); return `<td class="${ruim ? 'conflito' : aqui.length ? 'tem' : ''}">${aqui.map(a => `<b>${esc(nomeT(a.h))}</b><small>${esc(a.disc || '')}</small>`).join('<hr>')}</td>`; }).join('')}</tr>`).join('') : `<tr><td colspan="${dias.length + 1}" class="vazio-q">Sem aulas nos horários salvos.</td></tr>`;
      return `<div class="q-prof"><h4>${esc(nome)} <small>${minhas.length} aula${minhas.length === 1 ? '' : 's'}${p && +p.max ? ' de ' + p.max : ''}${p ? '' : ' · não cadastrado'}</small></h4><div class="tab"><table class="q-tab"><thead><tr><th></th>${dias.map(dd => `<th>${dd}</th>`).join('')}</tr></thead><tbody>${corpo}</tbody></table></div></div>`; };
    return `${conf.length ? `<div class="alertas tem-c"><b>⛔ ${conf.length} conflito${conf.length > 1 ? 's' : ''} nos horários salvos</b><ul>${conf.map(z => `<li class="n3"><span>${esc(z.onde)}:</span> ${esc(z.t)}</li>`).join('')}</ul></div>` : `<div class="alertas ok">✅ Nenhum conflito entre os horários salvos.</div>`}
      ${uniq.length ? uniq.map(bloco).join('') : '<p class="dica">Ainda não há professores nos horários.</p>'}`;
  }
  function telaQuadro() {
    $('#docs').innerHTML = `<nav class="trilha"><button class="b ghost" data-modo="">‹ Horário de aula</button><span>›</span><b class="tr-atual">🧭 Quadro dos professores</b></nav><div class="acoes"><button class="b main" data-impquadro="1">🖨 Imprimir quadro</button></div>${quadroHTML()}`;
  }
  async function imprimirQuadro() { segDoc = null; $('#imprimir').innerHTML = cab('QUADRO DOS PROFESSORES') + quadroHTML(true); await Promise.all([...document.querySelectorAll('#imprimir img')].map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; }))); window.print(); }

  /* ---------- Horário ideal: aulas por semana + gerador automático ---------- */
  let ideal = null;
  const MODELOS = { 'Manhã': [['07:00', '07:50'], ['07:50', '08:40'], ['08:40', '09:30'], ['INTERVALO', ''], ['09:50', '10:40'], ['10:40', '11:30']],
    'Tarde': [['13:00', '13:50'], ['13:50', '14:40'], ['14:40', '15:30'], ['INTERVALO', ''], ['15:50', '16:40'], ['16:40', '17:30']],
    'Noite': [['18:30', '19:20'], ['19:20', '20:10'], ['INTERVALO', ''], ['20:25', '21:15'], ['21:15', '22:05']] };
  const PESO = { 'Língua Portuguesa': 5, 'Matemática': 5, 'Ciências': 3, 'História': 3, 'Geografia': 3, 'Física': 3, 'Química': 3, 'Biologia': 3, 'Inglês': 2, 'Educação Física': 2, 'Espanhol': 1, 'Arte': 1, 'Ensino Religioso': 1, 'Filosofia': 1, 'Sociologia': 1, 'Literatura': 2, 'Redação': 2 };
  const vagas = t => (t.aulas || []).filter(a => !/^interv/i.test(a[0] || '')).length * DIAS(t.dias).length;
  function cargaPadrao(ds, total) {
    // distribui as aulas da semana pelo peso de cada disciplina
    const w = ds.map(d => PESO[d] || 2); const soma = w.reduce((a, b) => a + b, 0) || 1;
    const c = Object.fromEntries(ds.map((d, i) => [d, Math.max(1, Math.floor(total * w[i] / soma))]));
    let falta = total - Object.values(c).reduce((a, b) => a + b, 0);
    const ord = ds.map((d, i) => [d, total * w[i] / soma - c[d] + w[i] / 100]).sort((a, b) => b[1] - a[1]);
    for (let i = 0; falta > 0 && ord.length; i++, falta--) c[ord[i % ord.length][0]]++;
    while (falta < 0) { const d = Object.keys(c).filter(x => c[x] > 1).sort((a, b) => (c[b] - total * (PESO[b] || 2) / soma) - (c[a] - total * (PESO[a] || 2) / soma))[0]; if (!d) break; c[d]--; falta++; }
    return c;
  }
  async function turmasIdeal(et) {
    // turmas da etapa: as que já têm horário + as já preparadas antes (planos salvos)
    const planos = (await todos()).filter(d => d.tipo === 'plano' && etapaDe(d.turma) === et);
    const hs = todosHor.filter(h => etapaDe(h.turma) === et);
    const out = planos.map(x => JSON.parse(JSON.stringify(x)));
    for (const h of hs) if (!out.some(x => x.turma === h.turma && (x.classe || '') === (h.classe || '') && (x.turno || '') === (h.turno || ''))) out.push({ tipo: 'plano', setor: 'horarios', turma: h.turma, classe: h.classe || '', turno: h.turno || 'Manhã', dias: h.dias || 'Segunda a sexta', aulas: JSON.parse(JSON.stringify(h.aulas || MODELOS.Manhã)), carga: null, prof: {} });
    for (const x of out) if (!x.carga) { const ds = await disciplinas(x.turma); x.carga = cargaPadrao(ds, vagas(x)); x.prof = x.prof || {}; }
    return out;
  }
  async function cartaoTurma(x, i) {
    const ds = await disciplinas(x.turma); const et = etapaDe(x.turma);
    const elig = d => profs.filter(p => (p.disciplinas || []).includes(d) && (!(p.etapas || []).length || p.etapas.includes(et)) && daTurma(p, x));
    const tot = ds.reduce((a, d) => a + (+x.carga[d] || 0), 0), vg = vagas(x);
    return `<article class="pl" data-i="${i}"><div class="pl-top"><b>${esc(nomeT(x))}</b> <small>${esc(x.turno || '')}</small><span class="pl-tot ${tot === vg ? 'ok' : 'ruim'}">${tot} de ${vg} aulas</span><button type="button" class="b ghost pl-x" data-plx="${i}" title="Tirar esta turma">✕</button></div>
      <div class="tab"><table class="pl-tab"><thead><tr><th>Disciplina</th><th>Aulas/semana</th><th>Professor(a)</th></tr></thead><tbody>${ds.map(d => { const e = elig(d); return `<tr><td>${esc(d)}</td><td><input class="pl-n" type="number" min="0" max="10" data-i="${i}" data-d="${esc(d)}" value="${+x.carga[d] || 0}"></td><td><select class="pl-p" data-i="${i}" data-d="${esc(d)}"><option value="">${e.length ? 'Automático' : '— sem professor cadastrado —'}</option>${e.map(p => `<option ${x.prof[d] === p.nome ? 'selected' : ''}>${esc(p.nome)}</option>`).join('')}</select></td></tr>`; }).join('')}</tbody></table></div></article>`;
  }
  async function telaIdeal() {
    const P = $('#docs'); const trilha = `<nav class="trilha"><button class="b ghost" data-modo="">‹ Horário de aula</button><span>›</span><b class="tr-atual">✨ Horário ideal${ideal && ideal.etapa ? ' · ' + ETAPAS[ideal.etapa].nome : ''}</b></nav>`;
    if (!ideal || !ideal.etapa) {
      P.innerHTML = trilha + `<p class="dica">Escolha a etapa. O site monta uma prévia para todas as turmas dela ao mesmo tempo, sem repetir professor em duas turmas no mesmo horário.</p><div class="tiles-doc">${Object.entries(ETAPAS).map(([k, e]) => `<button class="tile-doc" data-idet="${k}"><span class="ti">${e.simples || '🏫'}</span><b>${e.nome}</b><small>${esc(e.turmas.join(', ').replace(/ \((Médio|Convênio)\)/g, ''))}</small><em>abrir</em></button>`).join('')}</div>`;
      return;
    }
    if (!ideal.turmas) ideal.turmas = await turmasIdeal(ideal.etapa);
    if (ideal.previa) return telaPrevia(trilha);
    const E = ETAPAS[ideal.etapa];
    P.innerHTML = trilha + `<div class="ficha"><h3>1. Turmas e aulas por semana</h3><p class="dica">Ajuste quantas aulas cada disciplina tem por semana e, se quiser, quem dá. Em “Automático”, o site escolhe entre os professores cadastrados para a disciplina. O total precisa bater com os horários da turma.</p>
      <div id="plCards">${(await Promise.all(ideal.turmas.map(cartaoTurma))).join('')}</div>
      <div class="pl-add"><b>➕ Adicionar turma:</b> ${lab('Série', sel('plT', E.turmas[0], E.turmas))}${lab('Letra', inp('plL', '', 'A, B…'))}${lab('Turno', sel('plTu', 'Manhã', ['Manhã', 'Tarde', 'Noite']))}<button type="button" class="b" id="plAdd">Adicionar</button></div>
      <div class="acoes"><button class="b main" id="gerar">✨ Gerar horário ideal</button><button class="b" id="plSalva">💾 Guardar as aulas por semana</button></div></div>`;
    $('#plCards').oninput = e => { const t = e.target; if (!t.dataset.d) return; const x = ideal.turmas[+t.dataset.i]; if (t.matches('.pl-n')) { x.carga[t.dataset.d] = Math.max(0, +t.value || 0); const c = t.closest('.pl'); const tot = Object.values(x.carga).reduce((a, b) => a + (+b || 0), 0), vg = vagas(x); const sp = c.querySelector('.pl-tot'); sp.textContent = tot + ' de ' + vg + ' aulas'; sp.className = 'pl-tot ' + (tot === vg ? 'ok' : 'ruim'); } };
    $('#plCards').onchange = e => { const t = e.target; if (t.matches('.pl-p')) ideal.turmas[+t.dataset.i].prof[t.dataset.d] = t.value; };
    $('#plCards').onclick = e => { const b = e.target.closest('[data-plx]'); if (b && confirm('Tirar esta turma da prévia?')) { const x = ideal.turmas.splice(+b.dataset.plx, 1)[0]; if (x.id) apagar(x.id); telaIdeal(); } };
    $('#plAdd').onclick = async () => { const tu = v('plTu'); const x = { tipo: 'plano', setor: 'horarios', turma: v('plT'), classe: v('plL').trim(), turno: tu, dias: 'Segunda a sexta', aulas: JSON.parse(JSON.stringify(MODELOS[tu])), prof: {} };
      if (ideal.turmas.some(z => z.turma === x.turma && z.classe === x.classe && z.turno === x.turno)) { alert('Essa turma já está na lista.'); return; }
      x.carga = cargaPadrao(await disciplinas(x.turma), vagas(x)); ideal.turmas.push(x); telaIdeal(); };
    const guardaPlanos = async () => { for (const x of ideal.turmas) { if (!x.id) { x.id = novoId(); x.criado = Date.now(); } await gravar(x); } };
    $('#plSalva').onclick = async () => { await guardaPlanos(); aviso('Aulas por semana guardadas.'); };
    $('#gerar').onclick = async () => {
      const ruins = ideal.turmas.filter(x => Object.values(x.carga).reduce((a, b) => a + (+b || 0), 0) !== vagas(x));
      if (ruins.length && !confirm(`O total de aulas não bate com os horários em: ${ruins.map(nomeT).join(', ')}. Gerar mesmo assim?`)) return;
      await guardaPlanos(); const b = $('#gerar'); b.disabled = true; b.textContent = '⏳ Montando…';
      await new Promise(r => setTimeout(r, 30)); ideal.previa = gerarIdeal(ideal.turmas); telaIdeal();
    };
  }
  // gerador: coloca cada aula num horário livre, respeitando disponibilidade e choques; tenta várias vezes e fica com o melhor
  function gerarIdeal(turmas) {
    const ids = turmas.map(x => x.turma + '|' + x.classe + '|' + x.turno);
    const fixos = todosHor.filter(h => !ids.includes(h.turma + '|' + (h.classe || '') + '|' + (h.turno || ''))).flatMap(aulasDe).filter(a => a.prof);
    const slotsDe = x => { const out = []; (x.aulas || []).forEach((a, i) => { if (/^interv/i.test(a[0] || '')) return; const ini = min(a[0]); DIAS(x.dias).forEach(dia => out.push({ i, dia, ini, fim: min(a[1]) ?? (ini !== null ? ini + 50 : null), turno: turnoDe(a[0], x.turno), k: i + '|' + dia })); }); return out; };
    const dispOk = (pn, s) => { const p = achaProf(pn); return !p || !p.disp || p.disp[s.dia + '|' + s.turno] !== 0; };
    const elig = (x, d) => profs.filter(p => (p.disciplinas || []).includes(d) && (!(p.etapas || []).length || p.etapas.includes(etapaDe(x.turma))) && daTurma(p, x));
    const prio = pn => { const i = profs.findIndex(q => normal(q.nome) === normal(pn)); return i < 0 ? 999 : i; };
    let melhor = null;
    for (let tent = 0; tent < 120; tent++) {
      const ocup = fixos.map(a => ({ prof: normal(a.prof), dia: a.dia, ini: a.ini, fim: a.fim, turno: a.turno, k: a.k }));
      const carga = {}; ocup.forEach(o => { carga[o.prof] = (carga[o.prof] || 0) + 1; });
      const res = turmas.map(x => ({ x, grade: {}, falta: [] }));
      // professor de cada disciplina em cada turma (fixo ou automático, pelo menos ocupado)
      const quem = res.map(r => Object.fromEntries(Object.keys(r.x.carga).map(d => { if (r.x.prof[d]) return [d, r.x.prof[d]]; const e = elig(r.x, d); if (!e.length) return [d, '']; e.sort((a, b) => (carga[normal(a.nome)] || 0) - (carga[normal(b.nome)] || 0) + (Math.random() - .5) * (tent ? 2 : 0)); const pn = e[0].nome; carga[normal(pn)] = (carga[normal(pn)] || 0) + (+r.x.carga[d] || 0); return [d, pn]; })));
      // lista de aulas a colocar, das mais difíceis para as mais fáceis
      const fila = [];
      res.forEach((r, ri) => Object.entries(r.x.carga).forEach(([d, n]) => { for (let j = 0; j < (+n || 0); j++) fila.push({ ri, d, p: quem[ri][d] }); }));
      const livres = it => { const p = achaProf(it.p); return p && p.disp ? Object.values(p.disp).filter(v2 => v2 !== 0).length : 99; };
      // quem cadastrou primeiro escolhe primeiro; nas outras tentativas, pequenas trocas só entre vizinhos de prioridade
      fila.sort((a, b) => prio(a.p) - prio(b.p) || livres(a) - livres(b) || (Math.random() - .5)); if (tent) fila.forEach((_, i) => { if (i && Math.random() < .15 && Math.abs(prio(fila[i].p) - prio(fila[i - 1].p)) <= 1) [fila[i], fila[i - 1]] = [fila[i - 1], fila[i]]; });
      let pena = 0;
      for (const it of fila) {
        const r = res[it.ri]; const cand = [];
        for (const sl of slotsDe(r.x)) {
          if (r.grade[sl.k]) continue;
          if (it.p && (!dispOk(it.p, sl) || ocup.some(o => o.prof === normal(it.p) && o.dia === sl.dia && (o.ini === null || sl.ini === null ? o.turno === sl.turno && o.k === sl.k : o.ini < sl.fim && sl.ini < o.fim)))) continue;
          const noDia = Object.entries(r.grade).filter(([k, c]) => k.endsWith('|' + sl.dia) && c.d === it.d).length;
          if (noDia >= 2) continue;
          const vizinha = r.grade[(sl.i - 1) + '|' + sl.dia] || r.grade[(sl.i + 1) + '|' + sl.dia];
          const sc = noDia * 6 - (noDia && vizinha && vizinha.d === it.d ? 3 : 0) + Math.random() * 2;
          cand.push([sc, sl]);
        }
        if (!cand.length) { r.falta.push(it); pena += 100; continue; }
        cand.sort((a, b) => a[0] - b[0]); const [sc, sl] = cand[0]; pena += sc;
        r.grade[sl.k] = { d: it.d, p: it.p };
        if (it.p) ocup.push({ prof: normal(it.p), dia: sl.dia, ini: sl.ini, fim: sl.fim, turno: sl.turno, k: sl.k });
      }
      if (!melhor || pena < melhor.pena) melhor = { pena, res };
      if (melhor.res.every(r => !r.falta.length) && tent > 20) break;
    }
    return melhor.res;
  }
  function telaPrevia(trilha) {
    const pv = ideal.previa; const faltas = pv.flatMap(r => r.falta.map(f => ({ r, f })));
    const grid = r => { const dias = DIAS(r.x.dias); return `<div class="tab"><table class="doc-hor pv-tab"><thead><tr><th>Horário</th>${dias.map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${(r.x.aulas || []).map((a, i) => /^interv/i.test(a[0]) ? `<tr class="iv"><td colspan="${dias.length + 1}">INTERVALO</td></tr>` : `<tr><td class="hr">${esc(a[0])}<br>${esc(a[1])}</td>${dias.map(dd => { const c = r.grade[i + '|' + dd]; return `<td class="${c ? '' : 'vago'}">${c ? `<b>${esc(c.d)}</b><small>${esc(c.p || 'sem professor')}</small>` : '—'}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>`; };
    $('#docs').innerHTML = trilha + `<div class="alertas ${faltas.length ? 'tem-a' : 'ok'}">${faltas.length ? `<b>⚠️ ${faltas.length} aula${faltas.length > 1 ? 's' : ''} não coube${faltas.length > 1 ? 'ram' : ''}</b> — o professor não tem horário livre ou a disponibilidade não bate:<ul>${faltas.slice(0, 15).map(({ r, f }) => `<li class="n2"><span>${esc(nomeT(r.x))}:</span> ${esc(f.d)}${f.p ? ' (' + esc(f.p) + ')' : ''}</li>`).join('')}</ul>Os espaços vazios ficam marcados com “—” para você completar à mão.` : '✅ Horário ideal montado: todas as aulas couberam, respeitando a disponibilidade e a ordem dos professores (quem informou primeiro foi encaixado primeiro), sem ninguém em duas turmas ao mesmo tempo.'}</div>
      <div class="acoes"><button class="b main" id="usar">💾 Usar estes horários</button><button class="b" id="outra">🔄 Gerar outra opção</button><button class="b ghost" id="voltaPl">‹ Ajustar aulas por semana</button></div>
      ${pv.map(r => `<div class="q-prof"><h4>${esc(nomeT(r.x))} <small>${esc(r.x.turno || '')}</small></h4>${grid(r)}</div>`).join('')}`;
    $('#outra').onclick = async () => { ideal.previa = gerarIdeal(ideal.turmas); telaIdeal(); };
    $('#voltaPl').onclick = () => { ideal.previa = null; telaIdeal(); };
    $('#usar').onclick = async () => {
      const subst = pv.filter(r => todosHor.some(h => h.turma === r.x.turma && (h.classe || '') === r.x.classe && (h.turno || '') === r.x.turno));
      if (subst.length && !confirm(`Já existe horário para ${subst.map(r => nomeT(r.x)).join(', ')}. Substituir pela prévia?`)) return;
      for (const r of pv) { const h = todosHor.find(z => z.turma === r.x.turma && (z.classe || '') === r.x.classe && (z.turno || '') === r.x.turno) || { tipo: 'horario', setor: 'horarios', id: novoId(), criado: Date.now(), data: hoje() };
        Object.assign(h, { turma: r.x.turma, classe: r.x.classe, turno: r.x.turno, dias: r.x.dias, aulas: JSON.parse(JSON.stringify(r.x.aulas)), grade: JSON.parse(JSON.stringify(r.grade)) }); await gravar(h); }
      aviso('Horários salvos. Agora dá para ajustar cada um à mão.'); const et = ideal.etapa; ideal = null; modo = null; etapa = et; tipo = 'horario'; await carregar();
    };
  }

  /* ---------- telas ---------- */
  let lista = [], tipo = null, edit = null;
  const meus = () => Object.entries(TIPOS).filter(([, t]) => t.setores.includes(SETOR));
  let todosHor = [], profs = [], modo = null, planosTodos = [];
  async function carregar() { const t = await todos(); lista = t.filter(d => d.setor === SETOR); todosHor = t.filter(d => d.tipo === 'horario'); profs = t.filter(d => d.tipo === 'professor').sort((a, b) => (a.ordem ?? a.criado ?? 0) - (b.ordem ?? b.criado ?? 0)); planosTodos = t.filter(d => d.tipo === 'plano'); tela(); }
  function tela() {
    const p = $('#docs');
    if (edit) return formulario();
    const unico = meus().length === 1;
    if (unico) tipo = meus()[0][0];
    if (SETOR === 'horarios' && modo === 'profs') return telaProfs();
    if (SETOR === 'horarios' && modo === 'prof') return formProf();
    if (SETOR === 'horarios' && modo === 'quadro') return telaQuadro();
    if (SETOR === 'horarios' && modo === 'ideal') return telaIdeal();
    if (tipo === 'horario' && SETOR === 'horarios' && !etapa) {
      const nc = conflitosGerais().length;
      p.innerHTML = `<div class="tiles-doc ferr"><button class="tile-doc" data-modo="profs"><span class="ti">👩‍🏫</span><b>Professores e disponibilidade</b><small>Quem dá aula em cada etapa, as disciplinas e os dias e turnos em que pode</small><em>${profs.length ? profs.length + ' cadastrado' + (profs.length > 1 ? 's' : '') : 'cadastrar'}</em></button><button class="tile-doc${nc ? ' tem-conf' : ''}" data-modo="quadro"><span class="ti">🧭</span><b>Quadro dos professores</b><small>A semana de cada professor em todas as turmas, com os conflitos</small><em>${nc ? '⚠️ ' + nc + ' conflito' + (nc > 1 ? 's' : '') : 'sem conflitos'}</em></button><button class="tile-doc ideal" data-modo="ideal"><span class="ti">✨</span><b>Horário ideal</b><small>Defina as aulas por semana de cada disciplina e o site monta uma prévia sem conflitos, para ajustar depois</small><em>gerar prévia</em></button></div>`;
      const n = k => lista.filter(d => d.tipo === 'horario' && etapaDe(d.turma) === k).length;
      p.innerHTML += `<p class="dica">Escolha a etapa para montar os horários de cada turma.</p><div class="etapas">${Object.entries(ETAPAS).map(([k, e]) => e.simples ? `<button class="etapa simples" data-et="${k}" aria-label="${e.nome}"><span class="es-i">${e.simples}</span><b>${e.nome}</b><small>${e.desc}</small>${n(k) ? `<span class="et-n">${n(k)} horário${n(k) === 1 ? '' : 's'}</span>` : ''}</button>` : `<button class="etapa${e.largo ? ' larga' : ''}" data-et="${k}" style="background-position:${e.pos}" aria-label="${e.nome}">${n(k) ? `<span class="et-n">${n(k)} horário${n(k) === 1 ? '' : 's'}</span>` : ''}</button>`).join('')}</div>`;
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
        <div class="acoes"><button class="b main" data-imp="${d.id}">🖨 Imprimir</button><button class="b" data-ed="${d.id}">✏️ Editar</button><button class="b" data-word="${d.id}">⬇ Word</button><button class="b" data-pdf="${d.id}">⬇ PDF</button><button class="b" data-dup="${d.id}">Duplicar</button><button class="b ghost" data-del="${d.id}">Excluir</button></div></article>`).join('')}</div>`
        : `<p class="dica">Nenhum documento ainda. Toque em “Novo” para começar.</p>`}`;
    $('#novoDoc').onclick = () => { edit = Object.assign({ tipo, setor: SETOR }, seg ? { seg } : {}, t.novo(lista.filter(doSeg))); if (seg && edit.turma !== undefined) edit.turma = SEGS[seg].turmas[0]; if (etapa && edit.turma !== undefined) edit.turma = ETAPAS[etapa].turmas[0]; tela(); };
  }
  async function formulario() {
    const t = TIPOS[edit.tipo];
    $('#docs').innerHTML = `<nav class="trilha"><button class="b ghost" data-volta="2">‹ ${t.nome}</button></nav><form class="ficha" id="fDoc"><h3>${t.icone} ${edit.id ? 'Editar' : 'Novo'}: ${t.nome}</h3>${t.form(edit)}
      <div class="acoes"><button class="b main" type="submit">💾 Salvar</button><button class="b" type="button" id="salvaImp">💾 Salvar e imprimir</button><button class="b" type="button" id="salvaWord">💾 Salvar e baixar Word</button><button class="b" type="button" id="salvaPdf">💾 Salvar e baixar PDF</button><button class="b ghost" type="button" data-volta="2">Cancelar</button></div></form>`;
    if (t.depois) await t.depois(edit);
    if (window.seiEditor) seiEditor.ligarTodos($('#fDoc'));
    const salvar = async () => {
      if (edit.tipo === 'horario') { const n = document.querySelectorAll('#grade td.conflito').length; if (n && !confirm(`Este horário tem ${n} conflito(s) marcado(s) em vermelho. Salvar mesmo assim?`)) throw new Error('cancelado'); }
      Object.assign(edit, ler(t.campos)); if (t.extra) t.extra(edit); if (!edit.id) { edit.id = novoId(); edit.criado = Date.now(); } await gravar(edit); const d = edit; aviso('Documento salvo.'); edit = null; await carregar(); return d; };
    $('#fDoc').onsubmit = async e => { e.preventDefault(); try { await salvar(); } catch (x) { if (x.message !== 'cancelado') throw x; } };
    const tenta = f => async () => { try { f(await salvar()); } catch (x) { if (x.message !== 'cancelado') throw x; } };
    $('#salvaImp').onclick = tenta(imprimir);
    $('#salvaWord').onclick = tenta(d => baixar2('word', d));
    $('#salvaPdf').onclick = tenta(d => baixar2('pdf', d));
  }
  // Word / PDF: o mesmo documento da impressão
  const via1 = h => FOLHA && FOLHA.duas ? h.replace(/<img class="folha-banda"[^>]*>/, '') : h;
  const htmlDe = d => { segDoc = d.seg || null; nCab = 0; return via1(TIPOS[d.tipo].doc(d)) + (d.copias === '2' ? '' : rodape()); };
  const nomeDe = d => TIPOS[d.tipo].titulo(d).replace(/—\s*$/, '').trim() + (d.seg && SEGS[d.seg] ? ' - ' + SEGS[d.seg].nome : '');
  async function baixar2(fmt, d) { if (!window.seiBaixar) return alert('Atualize a página e tente de novo.'); if (window.seiFolha) await prepFolha(d); return fmt === 'pdf' ? seiBaixar.pdf(htmlDe(d), nomeDe(d), FOLHA) : seiBaixar.word(htmlDe(d), nomeDe(d), TIPOS[d.tipo].nome); }
  async function imprimir(d) {
    const t = TIPOS[d.tipo]; if (window.seiFolha) await prepFolha(d); segDoc = d.seg || null; nCab = 0; document.body.dataset.doc = d.tipo;
    $('#imprimir').innerHTML = via1(t.doc(d)) + (d.copias === '2' ? '' : rodape());
    await Promise.all([...document.querySelectorAll('#imprimir img')].map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; })));
    window.print();
  }
  let avT = null;
  function aviso(x) { let a = $('#aeeAviso'); if (!a) { a = document.createElement('div'); a.id = 'aeeAviso'; a.className = 'no-print'; document.body.append(a); } a.textContent = '✅ ' + x; a.hidden = false; clearTimeout(avT); avT = setTimeout(() => { a.hidden = true; }, 2500); }
  document.addEventListener('click', async e => {
    const b = e.target.closest('button,a'); if (!b) return;
    if (b.dataset.t) { tipo = b.dataset.t; edit = null; tela(); scrollTo(0, 0); }
    if (b.dataset.et) { etapa = b.dataset.et; tela(); scrollTo(0, 0); }
    if (b.dataset.modo !== undefined) { modo = b.dataset.modo || null; editProf = null; tela(); scrollTo(0, 0); }
    if (b.dataset.sobe || b.dataset.desce) { const id = b.dataset.sobe || b.dataset.desce; const i = profs.findIndex(x => x.id === id); const j = i + (b.dataset.sobe ? -1 : 1);
      if (j >= 0 && j < profs.length) { [profs[i], profs[j]] = [profs[j], profs[i]]; for (const [n, x] of profs.entries()) { x.ordem = n; await gravar(x); } await carregar(); } }
    if (b.dataset.edprof) { editProf = JSON.parse(JSON.stringify(profs.find(x => x.id === b.dataset.edprof))); modo = 'prof'; tela(); scrollTo(0, 0); }
    if (b.dataset.delprof && confirm('Excluir este professor? Os horários já montados não mudam.')) { await apagar(b.dataset.delprof); await carregar(); }
    if (b.dataset.impquadro) imprimirQuadro();
    if (b.dataset.idet) { ideal = { etapa: b.dataset.idet, turmas: null, previa: null }; tela(); scrollTo(0, 0); }
    if (b.dataset.seg) { seg = b.dataset.seg; tipo = null; tela(); scrollTo(0, 0); }
    if (b.dataset.volta) { if (b.dataset.volta === 'seg') { seg = null; tipo = null; } else if (b.dataset.volta === '1') { if (etapa) etapa = null; else tipo = null; } edit = null; tela(); }
    if (b.dataset.imp) imprimir(lista.find(d => d.id === b.dataset.imp));
    if (b.dataset.word) baixar2('word', lista.find(d => d.id === b.dataset.word));
    if (b.dataset.pdf) baixar2('pdf', lista.find(d => d.id === b.dataset.pdf));
    if (b.dataset.ed) { edit = JSON.parse(JSON.stringify(lista.find(d => d.id === b.dataset.ed))); tela(); }
    if (b.dataset.dup) { const o = JSON.parse(JSON.stringify(lista.find(d => d.id === b.dataset.dup))); delete o.id; o.data = hoje(); if (o.numero) o.numero = proxNum(lista.filter(doSeg), o.tipo, hoje().slice(0, 4)); edit = o; tela(); }
    if (b.dataset.del && confirm('Excluir este documento?')) { await apagar(b.dataset.del); carregar(); }
  });
  const baixar = (x, nome) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([x], { type: 'application/json' })); a.download = nome; document.body.append(a); a.click(); a.remove(); };
  $('#exp').onclick = async () => baixar(JSON.stringify({ tipo: 'sei-docs', setor: SETOR, exportado: new Date().toISOString(), docs: lista }), `${SETOR}-sei-${hoje()}.json`);
  $('#imp').onchange = async e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; try { const j = JSON.parse(await f.text()); if (j.tipo !== 'sei-docs') throw 0; for (const o of j.docs) await gravar(o); alert(j.docs.length + ' documento(s) importado(s).'); carregar(); } catch (err) { alert('Este arquivo não é uma cópia de documentos da Biblioteca SEI.'); } };
  carregar();
})();
