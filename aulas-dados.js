/* Aulas salvas do professor: guardadas neste aparelho (IndexedDB), com BNCC. */
(function () {
  'use strict';
  const DB = 'sei-aulas', ST = 'aulas';
  let dbp = null;
  const abrir = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => { const s = r.result.createObjectStore(ST, { keyPath: 'id' }); s.createIndex('professor', 'professor'); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
  const tx = (modo, fn) => abrir().then(d => new Promise((res, rej) => {
    const t = d.transaction(ST, modo); const s = t.objectStore(ST); const out = fn(s);
    t.oncomplete = () => res(out && out.result !== undefined ? out.result : out); t.onerror = () => rej(t.error);
  }));
  const todas = () => tx('readonly', s => s.getAll()).then(l => (l || []).sort((a, b) => (b.data || '').localeCompare(a.data || '') || (b.criada || 0) - (a.criada || 0)));
  const pegar = id => tx('readonly', s => s.get(id));
  const gravar = a => { a.atualizada = Date.now(); return tx('readwrite', s => s.put(a)).then(() => a); };
  const apagar = id => tx('readwrite', s => s.delete(id));
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}

  /* professor atual (por aparelho) */
  const LS = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const LSset = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const professorAtual = () => LS('sei-professor') || '';
  const definirProfessor = n => { LSset('sei-professor', n); const l = professores(); if (n && !l.includes(n)) { l.push(n); LSset('sei-professores', JSON.stringify(l)); } };
  const professores = () => { try { return JSON.parse(LS('sei-professores') || '[]'); } catch (e) { return []; } };

  /* dados da folha a partir do caminho da arte */
  const NOMES = { 'lingua-portuguesa': 'Língua Portuguesa', literatura: 'Literatura', redacao: 'Redação', matematica: 'Matemática', fisica: 'Física', quimica: 'Química', biologia: 'Biologia', historia: 'História', geografia: 'Geografia', filosofia: 'Filosofia', sociologia: 'Sociologia', ingles: 'Inglês', espanhol: 'Espanhol', arte: 'Arte', artes: 'Arte', 'educacao-fisica': 'Educação Física', ciencias: 'Ciências', 'ensino-religioso': 'Ensino Religioso' };
  function info(src) {
    const p = (src || '').split('?')[0].split('/'); const seg = p[1] || ''; const arq = (p[p.length - 1] || '').replace(/\.(png|jpe?g)$/, '');
    const n = parseInt((p[2] || '').split('-')[0], 10);
    const etapa = { 'fundamental-1': 'Fundamental I', 'fundamental-2': 'Fundamental II', 'ensino-medio': 'Ensino Médio', convenio: 'Convênio', 'pre-vestibular': 'Pré-vestibular' }[seg] || '';
    const turma = seg.startsWith('fundamental') ? n + 'º ano' : seg === 'ensino-medio' ? n + 'ª série' : seg === 'convenio' ? '3ª série' : 'Pré-vestibular';
    return { etapa, turma, ano: seg.startsWith('fundamental') ? n : null, em: !seg.startsWith('fundamental'), chave: arq, disciplina: NOMES[arq] || arq };
  }

  /* BNCC */
  let bncc = null;
  const carregarBNCC = () => bncc ? Promise.resolve(bncc) : fetch('assets/bncc/bncc.json?v=1').then(r => r.json()).then(j => (bncc = j));
  const EF = { 'lingua-portuguesa': 'lp', matematica: 'ma', ciencias: 'ci', historia: 'hi', geografia: 'ge', arte: 'ar', artes: 'ar', 'educacao-fisica': 'ef', 'ensino-religioso': 'er', ingles: 'li' };
  const EM = { 'lingua-portuguesa': 'lgg', literatura: 'lgg', redacao: 'lgg', ingles: 'lgg', espanhol: 'lgg', arte: 'lgg', artes: 'lgg', 'educacao-fisica': 'lgg', matematica: 'mat', fisica: 'cnt', quimica: 'cnt', biologia: 'cnt', historia: 'chs', geografia: 'chs', filosofia: 'chs', sociologia: 'chs' };
  /* habilidades que se aplicam à turma/disciplina: [{codigo, texto, tema}] */
  async function habilidades(src) {
    const b = await carregarBNCC(); const i = info(src);
    if (!i.em) {
      const c = EF[i.chave]; if (!c) return [];
      return b.ef.filter(h => h[1] === c && h[2].includes(i.ano)).map(h => ({ codigo: h[0], tema: (h[3] || []).filter(Boolean).join(' · '), texto: h[4] }));
    }
    const a = EM[i.chave]; if (!a) return [];
    const lp = ['lingua-portuguesa', 'literatura', 'redacao'].includes(i.chave);
    return b.em.filter(h => h[1] === a).sort((x, y) => lp ? (y[2] === 'lp') - (x[2] === 'lp') : 0).map(h => ({ codigo: h[0], tema: h[2] === 'lp' ? 'Língua Portuguesa' : { lgg: 'Linguagens', mat: 'Matemática', cnt: 'Ciências da Natureza', chs: 'Ciências Humanas' }[h[1]], texto: h[3] }));
  }
  const hoje = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  const novoId = () => 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const pasta = a => (a.turma || '') + (a.classe ? ' ' + a.classe : '');  // ex.: 6º ano A
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  window.seiAulas = { todas, pegar, gravar, apagar, professorAtual, definirProfessor, professores, info, habilidades, carregarBNCC, hoje, novoId, esc, pasta, EF, EM };
})();
