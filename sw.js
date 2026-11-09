/* Biblioteca SEI offline: guarda o site e os arquivos para usar sem internet. */
const CORE = 'sei-core-v8', FILES = 'sei-arquivos-v5';
const CORE_LIST = ['./', 'index.html', 'montar.html', 'montar.js', 'montar.css', 'portal.js', 'portal.css', 'impressao.js', 'impressao.css', 'formatacao.js', 'formulas.js', 'word-pb.js', 'biblioteca.js', 'catalogo.js', 'sei-header-art.js', 'sei-standard.js', 'modelo-word.js', 'ajustar-word.js','aulas.html','aulas.js','aulas.css','aulas-dados.js','montar-aula.js','assets/bncc/bncc.json', 'manifest.webmanifest', 'assets/vendor/jszip.min.js', 'assets/vendor/mammoth.browser.min.js', 'assets/montar/molduras.json', 'assets/portal/icone-192.png', 'assets/portal/icone-512.png','assets/portal/entrada-sei-v2.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CORE).then(c => Promise.all(CORE_LIST.map(u => c.add(u).catch(() => null)))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CORE && k !== FILES).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const isFile = u => /\/assets\//.test(u.pathname);
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const u = new URL(req.url); if (u.origin !== location.origin) return;
  // Modelos editáveis devem receber a versão nova mesmo com a cópia offline.
  if (/\/assets\/word(?:-conteudo)?\/(?:pre-vestibular|ensino-medio|convenio|fundamental-[12])\/.*\.docx$/.test(u.pathname)) {
    e.respondWith(fetch(req).then(res => {
      if (!res.ok) throw new Error('Modelo indisponível');
      const cp = res.clone(); caches.open(FILES).then(c => c.put(u.pathname, cp));
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true })));
    return;
  }
  if (u.pathname.endsWith('/assets/montar/molduras.json') || u.pathname.endsWith('/assets/word-pb.json') || u.pathname.endsWith('/assets/offline-lista.json') || /\/assets\/(?:montar\/)?(?:ensino-medio|convenio)\/.*\/espanhol(?:-p[12]\.jpg|\.png)$/.test(u.pathname)) {
    e.respondWith(fetch(req).then(res => {
      if (!res.ok) throw new Error('Catálogo indisponível');
      const cp = res.clone(); caches.open(FILES).then(c => c.put(u.pathname, cp)); return res;
    }).catch(() => caches.match(req, { ignoreSearch: true })));
    return;
  }
  if (isFile(u)) {
    // arquivos (folhas, modelos Word, molduras): do aparelho primeiro; guarda o que for aberto
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
      if (res.ok && res.type === 'basic') { const cp = res.clone(); caches.open(FILES).then(c => c.put(u.pathname, cp)); }
      return res;
    })));
    return;
  }
  // páginas e scripts: internet primeiro (pega atualizações); sem internet, usa a cópia guardada
  e.respondWith(fetch(req).then(res => {
    if (res.ok && res.type === 'basic') { const cp = res.clone(); caches.open(CORE).then(c => c.put(u.pathname === '/' ? req : u.pathname, cp)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match(u.pathname, { ignoreSearch: true })).then(hit => hit || caches.match('index.html'))));
});
