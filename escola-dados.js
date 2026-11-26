/* Dados da escola (cronograma, cadastro, diário…) guardados no aparelho.
   Quando a nuvem (nuvem.js) estiver ligada, ela espelha estas mesmas coleções para todos os aparelhos. */
(function () {
  'use strict';
  const NOME = 'sei-escola', ST = 'itens';
  let dbp = null;
  const abrir = () => dbp || (dbp = new Promise((ok, erro) => {
    const r = indexedDB.open(NOME, 1);
    r.onupgradeneeded = () => { const s = r.result.createObjectStore(ST, { keyPath: 'k' }); s.createIndex('col', 'col'); };
    r.onsuccess = () => ok(r.result); r.onerror = () => erro(r.error);
  }));
  const tx = (modo, fn) => abrir().then(d => new Promise((ok, erro) => { const t = d.transaction(ST, modo); const o = fn(t.objectStore(ST)); t.oncomplete = () => ok(o && o.result !== undefined ? o.result : o); t.onerror = () => erro(t.error); }));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const ouvintes = new Set();
  let canal = null; try { canal = new BroadcastChannel('sei-escola'); canal.onmessage = e => avisar(e.data, true); } catch (e) {}
  function avisar(m, deFora) { ouvintes.forEach(f => { try { f(m); } catch (e) { console.error(e); } }); if (!deFora && canal) canal.postMessage(m); }

  const D = {
    uid,
    async listar(col) { const l = await tx('readonly', s => s.index('col').getAll(col)); return (l || []).filter(r => !r.apagado).map(r => r.d); },
    async obter(col, id) { const r = await tx('readonly', s => s.get(col + '/' + id)); return r && !r.apagado ? r.d : null; },
    // salvar: grava aqui e, com a nuvem ligada, manda para os outros aparelhos
    async salvar(col, obj, { daNuvem = false } = {}) {
      if (!obj.id) obj.id = uid();
      if (!daNuvem) { obj.atualizado = Date.now(); const u = D.usuario(); if (u) obj.por = u.nome || u.email || ''; }
      await tx('readwrite', s => s.put({ k: col + '/' + obj.id, col, d: obj, t: obj.atualizado || Date.now() }));
      if (!daNuvem && D.nuvem) D.nuvem.enviar(col, obj).catch(e => console.warn('nuvem', e));
      avisar({ col, id: obj.id, tipo: 'salvo' }); return obj;
    },
    async apagar(col, id, { daNuvem = false } = {}) {
      await tx('readwrite', s => s.delete(col + '/' + id));
      if (!daNuvem && D.nuvem) D.nuvem.apagar(col, id).catch(e => console.warn('nuvem', e));
      avisar({ col, id, tipo: 'apagado' });
    },
    // mesclar: muda só alguns campos (vários professores podem mexer no mesmo boletim ao mesmo tempo)
    async mesclar(col, id, patch) {
      const fundir = (a, b) => { for (const [k, v] of Object.entries(b)) { if (v && typeof v === 'object' && !Array.isArray(v)) a[k] = fundir(a[k] && typeof a[k] === 'object' ? a[k] : {}, v); else a[k] = v; } return a; };
      const atual = (await D.obter(col, id)) || { id }; fundir(atual, patch); atual.atualizado = Date.now();
      await tx('readwrite', s => s.put({ k: col + '/' + id, col, d: atual, t: atual.atualizado }));
      if (D.nuvem) D.nuvem.mesclar(col, id, Object.assign({}, patch, { atualizado: atual.atualizado })).catch(e => console.warn('nuvem', e));
      avisar({ col, id, tipo: 'salvo' }); return atual;
    },
    async tudo() { return (await tx('readonly', s => s.getAll())) || []; },
    async importar(l) { for (const r of l) if (r && r.col && r.d && r.d.id) await D.salvar(r.col, r.d); },
    ouvir(f) { ouvintes.add(f); return () => ouvintes.delete(f); },
    // quem está usando: vem do login (nuvem) ou, antes dela, da escolha "Ver como" neste aparelho
    usuario() {
      if (D.nuvem && D.nuvem.usuario) return D.nuvem.usuario;
      try { const u = JSON.parse(localStorage.getItem('sei-vercomo') || 'null'); if (u) return u; } catch (e) {}
      return { perfil: 'direcao', nome: 'Direção' };
    },
    verComo(u) { try { localStorage.setItem('sei-vercomo', JSON.stringify(u)); } catch (e) {} avisar({ tipo: 'usuario' }); },
    nuvem: null
  };
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}
  window.seiDados = D;
})();
