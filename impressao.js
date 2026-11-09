/* Impressão econômica: cabeçalho tipográfico claro, sem fundos decorativos. */
(() => {
  const mode = value => document.body.classList.toggle('sei-print-bw', value === 'bw');
  const text = (tag, value, cls) => {
    const el = document.createElement(tag); el.textContent = value;
    if (cls) el.className = cls;
    return el;
  };
  function context(path) {
    const clean = decodeURIComponent(path).split('?')[0];
    const slug = clean.split('/').pop().replace(/\.[^.]+$/, '');
    const names = {'lingua-portuguesa':'Língua Portuguesa','educacao-fisica':'Educação Física',
      'ensino-religioso':'Ensino Religioso','fisica':'Física','quimica':'Química',
      'matematica':'Matemática','historia':'História','ingles':'Inglês','redacao':'Redação',
      'ciencias':'Ciências'};
    const subject = names[slug] || slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
    const year = (clean.match(/\/(\d+)-ano\//) || [])[1];
    const grade = clean.includes('/pre-vestibular/') ? 'Pré-vestibular' :
      clean.includes('/convenio/') ? 'Convênio — 3ª série' :
      clean.includes('/ensino-medio/') ? year + 'ª série · Ensino Médio' :
      year ? year + 'º ano · Ensino Fundamental' : 'SEI Incentivo';
    return {subject, grade};
  }
  function header({subject, grade, identificacao = 'Revisão 01', conteudo = '', compact = false}) {
    const h = document.createElement('header'); h.className = 'bw-header' + (compact ? ' compact' : '');
    const top = document.createElement('div'); top.className = 'bw-heading';
    const brand = document.createElement('div'); brand.className = 'bw-brand';
    brand.append(text('strong', 'SEI'), text('span', 'INCENTIVO'));
    const title = document.createElement('div'); title.className = 'bw-titles';
    title.append(text('div', 'SISTEMA DE ENSINO INCENTIVO', 'bw-school'), text('h2', subject), text('div', grade));
    top.append(brand, title, text('span', identificacao, 'bw-identificacao')); h.append(top);
    if (!compact) {
      const fields = document.createElement('div'); fields.className = 'bw-fields';
      fields.append(text('span', 'Aluno(a): _______________________________________'),
        text('span', 'Professor(a): _____________________________'),
        text('span', 'Conteúdo: ' + (conteudo || '_______________________________________')),
        text('span', 'Data: ____ / ____ / ______'));
      h.append(fields);
    }
    return h;
  }
  async function printArticle(article, path) {
    const original = article.querySelector('.original-page');
    await original.decode();
    const copy = article.cloneNode(true); copy.classList.add('bw-sheet');
    // As folhas novas renderizadas do Word incluem a margem física do A4.
    const native = /\/(ensino-medio|convenio)\/.*\/espanhol\.png/.test(path);
    const height = native ? 22 : 318 / original.naturalHeight * 100;
    copy.style.setProperty('--bw-header-height', height + '%');
    copy.style.setProperty('--bw-side', '3.4%');
    copy.style.setProperty('--bw-bottom', native ? '5.8%' : '5.5%');
    copy.style.setProperty('--bw-width', Math.min(190, 277 * original.naturalWidth / original.naturalHeight) + 'mm');
    copy.append(header(context(path)));
    for (const cls of ['bw-left', 'bw-right', 'bw-footer']) {
      const mask = document.createElement('div'); mask.className = cls;
      if (cls === 'bw-footer') mask.append(text('span', 'SEI Incentivo · São Miguel do Guamá — PA'), text('span', 'Página 1'));
      copy.append(mask);
    }
    document.querySelector('#print-area').replaceChildren(copy);
    mode('bw'); window.print();
  }
  addEventListener('afterprint', () => mode('color'));
  window.seiPrint = {mode, context, header, printArticle};
})();
