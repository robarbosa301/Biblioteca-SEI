/* Registra o modo offline e o botão "Usar sem internet". */
(function () {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('sw.js').catch(() => {});
  window.seiBaixarTudo = async function (onProgress) {
    const lista = await (await fetch('assets/offline-lista.json', { cache: 'no-store' })).json();
    const c = await caches.open('sei-arquivos-v6'); let ok = 0, falha = 0;
    const base = new URL('./', location.href);
    let i = 0;
    const worker = async () => {
      while (i < lista.length) {
        const f = lista[i++]; const path = new URL(f, base).pathname;
        try {
          if (!(await c.match(path))) { const r = await fetch(f, { cache: 'no-store' }); if (!r.ok) throw 0; await c.put(path, r); }
          ok++;
        } catch (e) { falha++; }
        onProgress && onProgress(ok + falha, lista.length, falha);
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
    try { localStorage.setItem('sei-offline', String(Date.now())); } catch (e) {}
    return { ok, falha, total: lista.length };
  };
})();
