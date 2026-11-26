/* Nuvem da Biblioteca SEI (Firebase): login, perfis e sincronização entre aparelhos.
   Só entra em ação quando nuvem-config.js tiver o firebaseConfig. Sem ele, o site continua só no aparelho.
   A página diz quem pode entrar em <body data-nuvem="equipe"> ou <body data-nuvem="familia">. */
(function () {
  'use strict';
  const CFG = window.SEI_FIREBASE, D = window.seiDados; if (!CFG || !D) return;
  const V = 'assets/vendor/firebase/firebase-', VER = '-compat-10.14.1.js';
  const AREA = document.body.dataset.nuvem || 'equipe';
  const EQUIPE = ['direcao', 'secretaria', 'coordenacao', 'professor', 'aee', 'financeiro'], GESTAO = ['direcao', 'secretaria', 'coordenacao'];
  const COLS = ['cronograma', 'pessoas', 'alunos', 'notas', 'frequencia', 'boletins'];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const carregar = src => new Promise((ok, erro) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => erro(new Error('não carregou ' + src)); document.head.appendChild(s); });

  /* ---------- tela de entrada ---------- */
  const css = `.nv-fundo[hidden]{display:none}.nv-fundo{position:fixed;inset:0;z-index:50;background:rgba(3,20,70,.92);display:flex;align-items:center;justify-content:center;padding:16px}
    .nv-caixa{background:#fff;border-radius:18px;max-width:420px;width:100%;padding:22px;box-shadow:0 12px 40px rgba(0,0,0,.4);text-align:center;font:15px/1.45 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#10213f}
    .nv-caixa h2{margin:6px 0 4px;color:#0b2a5b;font-size:21px}.nv-caixa p{margin:6px 0;color:#425476}
    .nv-caixa img{width:84px}.nv-caixa input{font:inherit;width:100%;padding:10px 12px;border:1px solid #cdd8ea;border-radius:10px;margin:8px 0}
    .nv-b{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;font:700 15px system-ui,Arial;border-radius:12px;padding:11px 14px;margin:8px 0;cursor:pointer;border:1px solid #cdd8ea;background:#fff;color:#0b2a5b}
    .nv-b.g{background:#1a73e8;color:#fff;border-color:#1a73e8}.nv-ou{color:#8a97b1;font-size:13px;margin:10px 0 2px}.nv-erro{color:#b3261e;font-weight:600}
    .nv-sair{font:600 13px system-ui;background:none;border:0;color:#1a73e8;cursor:pointer;margin-top:8px;text-decoration:underline}`;
  let fundo = null;
  function tela(html) { if (!fundo) { const st = document.createElement('style'); st.textContent = css; document.head.append(st); fundo = document.createElement('div'); fundo.className = 'nv-fundo'; document.body.append(fundo); } fundo.hidden = false; fundo.innerHTML = `<div class="nv-caixa"><img src="assets/docs/mascote-sei.png?v=14" alt="">${html}</div>`; return fundo; }
  const fechar = () => { if (fundo) fundo.hidden = true; };
  function telaEntrar(msg) {
    const f = tela(`<h2>${AREA === 'familia' ? 'Área das Famílias' : 'Biblioteca SEI'}</h2><p>${AREA === 'familia' ? 'Entre com o e-mail que a escola cadastrou para você.' : 'Entre com a sua conta para ver e sincronizar os dados da escola.'}</p>
      ${msg ? `<p class="nv-erro">${esc(msg)}</p>` : ''}<button class="nv-b g" id="nv-google">🔵 Entrar com o Google</button>
      <p class="nv-ou">ou receba um link de acesso no seu e-mail</p><input id="nv-email" type="email" placeholder="seu e-mail" autocomplete="email"><button class="nv-b" id="nv-link">✉️ Enviar link de acesso</button>`);
    f.querySelector('#nv-google').onclick = entrarGoogle;
    f.querySelector('#nv-link').onclick = async () => { const em = f.querySelector('#nv-email').value.trim().toLowerCase(); if (!/^\S+@\S+\.\S+$/.test(em)) return alert('Digite um e-mail válido.');
      try { await auth.sendSignInLinkToEmail(em, { url: location.href.split('#')[0], handleCodeInApp: true }); localStorage.setItem('sei-email-link', em); tela(`<h2>📬 Confira seu e-mail</h2><p>Enviamos um link de acesso para <b>${esc(em)}</b>. Abra o e-mail <b>neste aparelho</b> e toque no link.</p><p style="font-size:13px">Não chegou? Veja a caixa de spam ou promoções.</p><button class="nv-sair" id="nv-volta">Voltar</button>`).querySelector('#nv-volta').onclick = () => telaEntrar(); }
      catch (e) { telaEntrar('Não consegui enviar o link: ' + (e.code || e.message)); } };
  }
  async function entrarGoogle() {
    const p = new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' });
    const app = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    try { if (app) await auth.signInWithRedirect(p); else await auth.signInWithPopup(p); }
    catch (e) { if (/popup/.test(e.code || '')) { try { await auth.signInWithRedirect(p); } catch (e2) { telaEntrar('Não foi possível entrar: ' + (e2.code || e2.message)); } } else if (e.code !== 'auth/cancelled-popup-request') telaEntrar('Não foi possível entrar: ' + (e.code || e.message)); }
  }
  function telaEspera(email) {
    tela(`<h2>⏳ Aguardando liberação</h2><p>A conta <b>${esc(email)}</b> ainda não foi liberada${AREA === 'familia' ? ' pela secretaria' : ' pela direção'}.</p><p>Peça para a escola liberar este e-mail e depois toque em <b>Tentar de novo</b>.</p><button class="nv-b g" id="nv-de-novo">↻ Tentar de novo</button><button class="nv-sair" id="nv-sair">Entrar com outra conta</button>`);
    fundo.querySelector('#nv-de-novo').onclick = () => location.reload(); fundo.querySelector('#nv-sair').onclick = () => auth.signOut();
  }

  /* ---------- sincronização ---------- */
  let auth, db, parar = [];
  const ref = (col, id) => db.collection(col).doc(id);
  const limpo = o => JSON.parse(JSON.stringify(o)); // sem undefined / funções
  async function aplicar(col, snap) {
    for (const ch of snap.docChanges()) {
      if (ch.doc.metadata.hasPendingWrites) continue; const id = ch.doc.id;
      if (ch.type === 'removed') { await D.apagar(col, id, { daNuvem: true }); continue; }
      const r = ch.doc.data(); const l = await D.obter(col, id);
      if (!l || (r.atualizado || 0) >= (l.atualizado || 0)) await D.salvar(col, Object.assign(r, { id }), { daNuvem: true });
    }
  }
  async function enviarLocais(u) { // primeira vez neste aparelho: manda o que só existe aqui
    const chave = 'sei-enviado-' + u.email; if (localStorage.getItem(chave)) return;
    const podeEscrever = col => u.perfil === 'direcao' || (GESTAO.includes(u.perfil) && col !== 'usuarios') || (u.perfil === 'professor' && ['notas', 'frequencia', 'boletins'].includes(col));
    for (const col of COLS) { if (!podeEscrever(col)) continue; for (const o of await D.listar(col)) { try { const s = await ref(col, o.id).get(); if (!s.exists || (s.data().atualizado || 0) < (o.atualizado || 0)) await ref(col, o.id).set(limpo(o)); } catch (e) { console.warn('envio', col, e.code); } } }
    localStorage.setItem(chave, '1');
  }
  function ouvir(u) {
    parar.forEach(f => f()); parar = [];
    const erro = col => e => console.warn('nuvem: sem acesso a', col, e.code);
    if (u.perfil === 'familia') {
      const ids = (u.alunos || []).slice(0, 30); if (ids.length) parar.push(db.collection('alunos').where(firebase.firestore.FieldPath.documentId(), 'in', ids).onSnapshot(s => aplicar('alunos', s), erro('alunos')));
      if (ids.length) parar.push(db.collection('boletins').where(firebase.firestore.FieldPath.documentId(), 'in', ids).onSnapshot(s => aplicar('boletins', s), erro('boletins')));
      parar.push(db.collection('cronograma').where('quem', 'array-contains', 'familias').onSnapshot(s => aplicar('cronograma', s), erro('cronograma')));
      return;
    }
    for (const col of COLS) parar.push(db.collection(col).onSnapshot(s => aplicar(col, s), erro(col)));
  }

  // a nuvem recusou (sem permissão): volta este aparelho ao que está na nuvem
  async function negado(e, col, id) {
    if (e.code !== 'permission-denied') throw e;
    try { const s = await ref(col, id).get({ source: 'server' }); if (s.exists) await D.salvar(col, Object.assign(s.data(), { id }), { daNuvem: true }); else await D.apagar(col, id, { daNuvem: true }); } catch (e2) { /* sem acesso nem para ler */ await D.apagar(col, id, { daNuvem: true }); }
    alert('Você não tem permissão para fazer essa mudança. Ela foi desfeita.');
  }
  /* ---------- quem é o usuário ---------- */
  async function perfilDe(user) {
    const email = (user.email || '').toLowerCase(), r = ref('usuarios', email);
    let s = null; try { s = await r.get(); } catch (e) { s = null; }
    if (s && s.exists) return Object.assign({ email }, s.data());
    // a conta dona do projeto (definida só nas regras de segurança) se registra sozinha como Direção
    try { await r.set({ email, nome: user.displayName || 'Direção', perfil: 'direcao', ativo: true, criado: Date.now() }); return { email, nome: user.displayName || 'Direção', perfil: 'direcao', ativo: true }; } catch (e) { return null; }
  }
  async function aoEntrar(user) {
    if (!user) { D.nuvem.usuario = null; parar.forEach(f => f()); parar = []; return telaEntrar(); }
    if (!user.emailVerified) { await auth.signOut(); return telaEntrar('Este e-mail ainda não foi confirmado. Use o Google ou o link de acesso.'); }
    tela('<h2>⏳ Entrando…</h2><p>Buscando seus dados.</p>');
    const u = await perfilDe(user);
    if (!u || u.ativo === false) return telaEspera(user.email);
    const certo = AREA === 'familia' ? u.perfil === 'familia' || u.perfil === 'direcao' : EQUIPE.includes(u.perfil);
    if (!certo) { tela(`<h2>🚪 Área errada</h2><p>Esta conta é de ${u.perfil === 'familia' ? '<b>família</b>' : '<b>equipe</b>'}.</p><a class="nv-b g" href="${u.perfil === 'familia' ? 'pais.html' : 'escola.html'}">Ir para a minha área</a><button class="nv-sair" id="nv-sair">Sair</button>`); fundo.querySelector('#nv-sair').onclick = () => auth.signOut(); return; }
    D.nuvem.usuario = { email: u.email, nome: u.nome || user.displayName || u.email, perfil: u.perfil, pessoaId: u.pessoaId || '', alunos: u.alunos || [] };
    fechar(); await enviarLocais(D.nuvem.usuario).catch(() => {}); ouvir(D.nuvem.usuario);
    document.dispatchEvent(new CustomEvent('sei-nuvem', { detail: D.nuvem.usuario }));
  }

  /* ---------- partida ---------- */
  D.nuvem = {
    usuario: null, ligada: true,
    enviar: (col, o) => db ? ref(col, o.id).set(limpo(o)).catch(e => negado(e, col, o.id)) : Promise.resolve(),
    mesclar: (col, id, patch) => db ? ref(col, id).set(limpo(patch), { merge: true }).catch(e => negado(e, col, id)) : Promise.resolve(),
    apagar: (col, id) => db ? ref(col, id).delete().catch(e => negado(e, col, id)) : Promise.resolve(),
    sair: () => auth && auth.signOut(),
    // administração de acessos (Direção)
    usuarios: fn => db.collection('usuarios').onSnapshot(s => fn(s.docs.map(d => Object.assign({ email: d.id }, d.data()))), e => console.warn(e.code)),
    salvarUsuario: o => ref('usuarios', o.email.toLowerCase()).set(limpo(Object.assign({}, o, { email: o.email.toLowerCase(), atualizado: Date.now() })), { merge: true }),
    apagarUsuario: email => ref('usuarios', email).delete()
  };
  (async () => {
    tela('<h2>⏳ Conectando…</h2>');
    try { await carregar(V + 'app' + VER); await carregar(V + 'auth' + VER); await carregar(V + 'firestore' + VER); }
    catch (e) { tela(`<h2>📴 Sem conexão</h2><p>Não consegui carregar a nuvem. Verifique a internet e tente de novo.</p><button class="nv-b g" onclick="location.reload()">↻ Tentar de novo</button>`); return; }
    firebase.initializeApp(CFG); auth = firebase.auth(); db = firebase.firestore();
    if (window.SEI_EMULADOR) { auth.useEmulator('http://127.0.0.1:9099'); db.useEmulator('127.0.0.1', 8080); }
    try { await db.enablePersistence({ synchronizeTabs: true }); } catch (e) { /* outro aparelho/navegador sem suporte: segue online */ }
    if (auth.isSignInWithEmailLink(location.href)) {
      let em = localStorage.getItem('sei-email-link'); if (!em) em = prompt('Confirme o seu e-mail para entrar:');
      try { await auth.signInWithEmailLink((em || '').trim().toLowerCase(), location.href); localStorage.removeItem('sei-email-link'); history.replaceState(null, '', location.pathname); } catch (e) { telaEntrar('O link expirou ou já foi usado. Peça um novo.'); }
    }
    auth.getRedirectResult().catch(e => telaEntrar('Não foi possível entrar: ' + (e.code || e.message)));
    auth.onAuthStateChanged(u => aoEntrar(u).catch(e => tela(`<h2>⚠️ Erro</h2><p>${esc(e.message)}</p>`)));
  })();
})();
