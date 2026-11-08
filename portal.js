(()=>{
const art='assets/portal/entrada-sei.png';
const oldRender=render;
const header=document.querySelector('body>header');
header.innerHTML='<a class="portal-brand" href="#" aria-label="Biblioteca Digital SEI — início"><img src="'+art+'" alt="SEI Incentivo. Aqui se faz educação com qualidade. Biblioteca Digital SEI."></a>';
function seriesLabel(year,group=g){return group===2?parseInt(year)+'ª série':group===3?'3ª série (Convênio)':year}
const labels=['Fundamental I — 1º ao 5º ano','Fundamental II — 6º ao 9º ano','Ensino Médio — 1ª e 2ª série','3ª série (Convênio)','Pré-vestibular'];
const home=document.createElement('section');home.className='portal-home';home.setAttribute('aria-label','Biblioteca Digital SEI — materiais da escola');
home.innerHTML='<img class="portal-art" src="'+art+'" alt="Mascote e logomarca SEI. Aqui se faz educação com qualidade. Biblioteca Digital SEI. Materiais da escola."><div class="brand-shimmer" aria-hidden="true"></div><div class="mascot-motion" aria-hidden="true"></div><button class="motion-toggle" aria-pressed="false">Pausar animações</button>';
labels.forEach((label,i)=>{const b=document.createElement('button');b.className='portal-entry entry-'+i;b.setAttribute('aria-label',label);b.innerHTML='<span class="sr-only">'+label+'</span>';if(i===2||i===3){const label=document.createElement('span');label.className='series-home-label';label.textContent=i===2?'1ª e 2ª série':'3ª série (Convênio)';b.append(label)}b.onclick=()=>go(i,null,null);home.append(b)});
header.after(home);
const wrap=document.querySelector('main');
const back=document.createElement('button');back.className='back-button';back.textContent='← Voltar';back.onclick=()=>s!==null?go(g,y,null):y!==null?go(g,null,null):go(null,null,null);crumb.before(back);
const search=document.createElement('input');search.className='subject-search';search.type='search';search.placeholder='Buscar disciplina';search.setAttribute('aria-label','Buscar disciplina');title.after(search);
search.oninput=()=>{const q=search.value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();for(const card of content.children)card.hidden=!card.textContent.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(q)};
const dialog=document.createElement('dialog');dialog.className='image-dialog';dialog.innerHTML='<form method="dialog"><button aria-label="Fechar ampliação">Fechar ×</button></form><img alt="Folha ampliada">';document.body.append(dialog);dialog.onclick=e=>{if(e.target===dialog)dialog.close()};
function path(subject,year){return g===4?'assets/pre-vestibular/'+seiPages[subject]+'.jpeg':seiPublishedPages[g+'|'+year+'|'+subject]}
function go(group,year,subject){g=group;y=year;s=subject;const params=new URLSearchParams();if(g!==null)params.set('etapa',g);if(y!==null)params.set('turma',seriesLabel(y));if(s!==null)params.set('disciplina',s);history.pushState(null,'','#'+params);render();window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
function fromHash(){const p=new URLSearchParams(location.hash.slice(1));const n=Number(p.get('etapa'));g=p.has('etapa')&&groups[n]?n:null;y=g!==null?groups[g].years.find(year=>year===p.get('turma')||seriesLabel(year,g)===p.get('turma'))??null:null;s=y!==null&&groups[g].subjects.includes(p.get('disciplina'))?p.get('disciplina'):null;render()}
window.addEventListener('popstate',fromHash);
header.querySelector('a').onclick=e=>{e.preventDefault();go(null,null,null)};
let paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
const toggle=home.querySelector('.motion-toggle');function motion(){document.body.classList.toggle('motion-paused',paused);toggle.textContent=paused?'Ativar animações':'Pausar animações';toggle.setAttribute('aria-pressed',String(paused))}toggle.onclick=()=>{paused=!paused;motion()};motion();

const journey=document.createElement('nav');journey.className='journey';journey.setAttribute('aria-label','Navegação da biblioteca');back.replaceWith(journey);
function control(text,fn,cls=''){const b=document.createElement('button');b.textContent=text;b.className=cls;b.onclick=fn;return b}
function navigation(){
 journey.replaceChildren();
 if(y===null&&s===null){journey.append(control('← Início',()=>go(null,null,null),'journey-home'))}else{back.textContent=s!==null?'← Disciplinas':'← Turmas';journey.append(back,control('⌂ Início',()=>go(null,null,null),'journey-home'))}
 if(s!==null){const list=groups[g].subjects,idx=list.indexOf(s);journey.classList.add('nav-b1');back.textContent='‹ Disciplinas';const home=journey.querySelector('.journey-home');if(home)home.textContent='⌂ Início';const top=document.createElement('div');top.className='nav-top';top.append(back);if(home)top.append(home);journey.prepend(top);const switcher=document.createElement('div');switcher.className='sheet-switcher';const prev=control('‹',()=>go(g,y,list[idx-1]),'nav-arrow');prev.setAttribute('aria-label','Disciplina anterior');prev.disabled=idx===0;const next=control('›',()=>go(g,y,list[idx+1]),'nav-arrow');next.setAttribute('aria-label','Próxima disciplina');next.disabled=idx===list.length-1;const mid=document.createElement('label');mid.className='nav-mid';const nm=document.createElement('b');nm.textContent=s+' ▾';const info=document.createElement('span');const turma=g===3?'Convênio · 3ª série':g===2?parseInt(y)+'ª série · Médio':g===4?'Pré-vestibular':y;info.textContent=(idx+1)+' de '+list.length+' · '+turma;const select=document.createElement('select');select.setAttribute('aria-label','Trocar disciplina');list.forEach(subject=>{const o=document.createElement('option');o.textContent=subject;o.value=subject;select.append(o)});select.value=s;select.onchange=()=>go(g,y,select.value);mid.append(nm,info,select);switcher.append(prev,mid,next);journey.append(switcher);
 /* Computador: faixa com a capa da disciplina */
 const fx=document.createElement('div');fx.className='nav-faixa';const cv=subjectCovers[s];if(cv)fx.style.setProperty('--capa','url('+coverRoot+'subject-'+cv+'.webp)');
 const cr=document.createElement('div');cr.className='fx-crumbs';const chip=(t,fn)=>{const b=document.createElement('button');b.textContent=t;b.onclick=fn;return b};const sep=()=>{const i=document.createElement('span');i.textContent='›';return i};
 cr.append(chip('⌂ Início',()=>go(null,null,null)),sep(),chip(groups[g].name,()=>go(g,null,null)));if(g!==4){cr.append(sep(),chip(seriesLabel(y),()=>go(g,y,null)))}const here=document.createElement('b');here.textContent=s;cr.append(sep(),here);
 const arr=(dir,name,fn,dis)=>{const b=document.createElement('button');b.className='fx-arr '+dir;b.disabled=dis;b.onclick=fn;b.setAttribute('aria-label',(dir==='l'?'Disciplina anterior: ':'Próxima disciplina: ')+(name||''));const c=document.createElement('span');c.textContent=dir==='l'?'‹':'›';const n=document.createElement('small');n.textContent=name||'';b.append(c,n);return b};
 const t=document.createElement('div');t.className='fx-t';const sm=document.createElement('small');sm.textContent=g===4?'PRÉ-VESTIBULAR':g===3?'CONVÊNIO · 3ª SÉRIE':(seriesLabel(y)+' · '+groups[g].name).toUpperCase();const h=document.createElement('h2');h.textContent=s;
 const tr=document.createElement('label');tr.className='fx-troca';tr.append('Folha '+(idx+1)+' de '+list.length+' · ');const u=document.createElement('u');u.textContent='Trocar disciplina ▾';const sel2=select.cloneNode(true);sel2.value=s;sel2.onchange=()=>go(g,y,sel2.value);tr.append(u,sel2);t.append(sm,h,tr);
 const row=document.createElement('div');row.className='fx-row';row.append(arr('l',list[idx-1],()=>go(g,y,list[idx-1]),idx===0),t,arr('r',list[idx+1],()=>go(g,y,list[idx+1]),idx===list.length-1));
 fx.append(cr,row);journey.append(fx)}else{journey.classList.remove('nav-b1')}
 crumb.replaceChildren();crumb.hidden=true;
}

function applySeriesCorrection(img){
 const c=seiHeaderConfig(g,y,s);
 img.alt=s+' • '+c.label+' • '+groups[g].name;
 // As folhas já trazem o cabeçalho no padrão de cada segmento; não sobrepor arte.
}
const coverRoot='assets/portal/covers/';
let seiMolduras=null;fetch('assets/montar/molduras.json?v=7').then(r=>r.json()).then(j=>{seiMolduras=j;if(s!==null)seiTemaFolha()}).catch(()=>{});
function seiTemaFolha(){const w=document.querySelector('main.wrap');if(!w||s===null)return;const cv=subjectCovers[s];w.style.setProperty('--capa',cv?'url('+coverRoot+'subject-'+cv+'.webp)':'none');
 const src=(path(s,y)||'').split('?')[0];const m=seiMolduras&&seiMolduras[src];w.style.setProperty('--cor',(m&&m.dividerColor)||'#0a3a9c')}
const subjectCovers={'Língua Portuguesa':'portugues','Português':'portugues','Matemática':'matematica','Ciências':'ciencias','História':'historia','Geografia':'geografia','Arte':'arte','Artes':'arte','Educação Física':'educacao-fisica','Ensino Religioso':'religiao','Inglês':'ingles','Espanhol':'espanhol','Literatura':'literatura','Redação':'redacao','Física':'fisica','Química':'quimica','Biologia':'biologia','Filosofia':'filosofia','Sociologia':'sociologia'};
function yearArt(year,index){
 const key=g===0||g===1?'year-'+parseInt(year):g===2?'year-em'+parseInt(year):g===3?'year-convenio':'year-pre';
 return coverRoot+key+'.webp';
}
function card(label,description,src,fn){
 const b=document.createElement('button');b.className='portal-card illustrated-cover '+(y===null?'year-cover':'subject-cover');
 const im=document.createElement('img');im.src=y===null?src:coverRoot+'subject-'+subjectCovers[label]+'.webp'+(label==='Física'?'?v=2':'');im.alt='';im.loading='lazy';im.decoding='async';
 const info=document.createElement('span');info.className='cover-copy';
 const strong=document.createElement('strong');strong.textContent=label;
 const context=document.createElement('small');context.textContent=y===null?groups[g].name:groups[g].name+' · '+(g===3?'3ª série':seriesLabel(y));
 const arrow=document.createElement('span');arrow.className='cover-arrow';arrow.textContent='→';arrow.setAttribute('aria-hidden','true');
 const action=document.createElement('span');action.className='cover-action';action.textContent=y===null?description:'Abrir folha';
 info.append(strong);b.append(im,info,arrow,action);b.onclick=fn;b.setAttribute('aria-label',label+' — '+context.textContent+' — '+description);content.append(b);
 b.style.animationDelay=Math.min(content.children.length-1,8)*35+'ms';
}

render=function(){const atHome=g===null;document.body.classList.toggle('at-home',atHome);document.body.classList.toggle('on-sheet',!atHome&&s!==null);if(!atHome&&s!==null)seiTemaFolha();home.hidden=!atHome;header.hidden=atHome;wrap.hidden=atHome;search.hidden=true;search.value='';if(atHome)return;
if(s!==null){oldRender();navigation();const img=content.querySelector('.original-page');if(img){applySeriesCorrection(img);const actions=content.querySelector('.actions');const colorPrint=actions.querySelector('button');if(colorPrint&&window.seiPrint){const printColor=colorPrint.onclick;colorPrint.textContent='Imprimir em cores / PDF';colorPrint.onclick=()=>{seiPrint.mode('color');printColor()};const bw=document.createElement('button');bw.className='print-bw';bw.textContent='Imprimir em preto e branco';bw.onclick=()=>seiPrint.printArticle(img.closest('article'),img.getAttribute('src'));actions.append(bw)}const b=document.createElement('button');b.textContent='Ampliar folha';b.onclick=()=>{const enlarged=img.closest('article').cloneNode(true);dialog.replaceChildren(dialog.querySelector('form'),enlarged);dialog.showModal()};actions.prepend(b);img.onclick=b.onclick;img.style.cursor='zoom-in';const dl=(dir,label)=>{const w=document.createElement('button');w.className='blank-word';w.textContent='↓ Word — '+label;w.onclick=()=>{const src=(img.getAttribute('src')||'').split('?')[0];const url=src.replace(/^assets\//,'assets/'+dir+'/').replace(/\.(png|jpe?g)$/i,'.docx');const a=document.createElement('a');a.href=url+'?v=13-estilo';a.download=(s+' - '+(g===4?'Pré-vestibular':seriesLabel(y))+' - '+label+'.docx').replace(/[\/:*?"<>|]/g,'-');document.body.append(a);a.click();a.remove()};return w};const wq=dl('word','Questões');wq.title='Folha editável com o cabeçalho SEI e dez questões';const wc=dl('word-conteudo','Conteúdo');wc.title='Folha editável para assunto/explicação, sem questões';const mt=document.createElement('button');mt.className='blank-word montar-site';mt.textContent='✎ Montar folha no site';mt.title='Cole seu material direto na folha e imprima';mt.onclick=()=>{const src=(img.getAttribute('src')||'').split('?')[0];try{sessionStorage.setItem('sei-voltar',location.href)}catch(e){}location.href='montar.html#f='+encodeURIComponent(src)};actions.append(mt,wq,wc);const amsg=window.seiBotaoAjustar?window.seiBotaoAjustar(actions):null;const hint=document.createElement('p');hint.className='word-hint';hint.textContent='Mais fácil: “Montar folha no site” — cole (Ctrl+V) ou importe seu Word e imprima. Prefere o Word? Baixe Questões ou Conteúdo, cole seu material, salve e use “Ajustar Word preenchido” para deixar tudo dentro das colunas.';actions.after(hint);if(amsg)hint.after(amsg)}return;}
navigation();content.replaceChildren();content.className='portal-grid';
if(y===null){title.textContent=groups[g].name;groups[g].years.forEach((year,index)=>card(seriesLabel(year),groups[g].subjects.length+' disciplinas',yearArt(year,index),()=>go(g,year,null)))}else{title.textContent=groups[g].name+' · '+(g===3?'3ª série':seriesLabel(y));search.hidden=false;groups[g].subjects.forEach(subject=>card(subject==='Artes'?'Arte':subject,'Abrir atividade',path(subject,y),()=>go(g,y,subject)))}
};
document.querySelector('body>footer').textContent='Sistema de Ensino Incentivo • São Miguel do Guamá — PA';fromHash();
})();

