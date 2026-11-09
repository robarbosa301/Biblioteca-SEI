/* Word para impressora preto e branco: troca a moldura escura (cabeçalho, laterais e rodapé)
   pela versão clara. Funciona no modelo baixado e no Word já preenchido. A versão colorida não muda. */
(() => {
  const CHAVE = 'sei-word-pb';
  let indice = null;
  const carregar = () => indice || (indice = fetch('assets/word-pb.json?v=1').then(r => r.json()).catch(() => ({})));
  const hex = b => Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('');

  // Recebe um JSZip já aberto; devolve quantas imagens trocou.
  async function clarear(zip) {
    const mapa = await carregar(); let n = 0;
    const rels = zip.file(/^word\/_rels\/header\d+\.xml\.rels$/);
    for (const r of rels) {
      const xml = await r.async('string');
      for (const m of xml.matchAll(/Target="(media\/[^"]+\.(?:jpe?g|png))"/g)) {
        const nome = 'word/' + m[1]; const f = zip.file(nome); if (!f) continue;
        const k = hex(await crypto.subtle.digest('SHA-1', await f.async('arraybuffer')));
        const alvo = mapa[k]; if (!alvo) continue;
        const res = await fetch(alvo + '?v=8'); if (!res.ok) continue;
        zip.file(nome, await res.arrayBuffer()); n++;
      }
    }
    return n;
  }
  function ativo() { try { return localStorage.getItem(CHAVE) === '1'; } catch (e) { return false; } }
  // Caixinha "Vou imprimir em preto e branco" (vale para baixar o modelo e para o Ajustar Word)
  function caixa() {
    const l = document.createElement('label'); l.className = 'pb-word';
    const c = document.createElement('input'); c.type = 'checkbox'; c.checked = ativo();
    c.onchange = () => { try { localStorage.setItem(CHAVE, c.checked ? '1' : '0'); } catch (e) {} };
    l.append(c, document.createTextNode(' Vou imprimir o Word em preto e branco (moldura clara)'));
    l.title = 'O Word baixado (ou ajustado) vem com a moldura clara, que não fica escura na impressora preto e branco. A tela colorida não muda.';
    return l;
  }
  window.seiWordPB = { clarear, ativo, caixa };
})();
