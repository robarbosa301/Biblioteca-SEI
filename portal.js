(()=>{
const art='assets/portal/entrada-sei.png';
const oldRender=render;
const header=document.querySelector('body>header');
header.innerHTML='<a class="portal-brand" href="#" aria-label="Biblioteca Digital SEI — início"><img src="'+art+'" alt="SEI Incentivo. Aqui se faz educação com qualidade. Biblioteca Digital SEI."></a>';
const labels=['Fundamental I — 1º ao 5º ano','Fundamental II — 6º ao 9º ano','Ensino Médio — 1º e 2º ano','Convênio — 3º ano do Ensino Médio','Pré-vestibular'];
const home=document.createElement('section');home.className='portal-home';home.setAttribute('aria-label','Biblioteca Digital SEI — materiais da escola');
home.innerHTML='<img class="portal-art" src="'+art+'" alt="Mascote e logomarca SEI. Aqui se faz educação com qualidade. Biblioteca Digital SEI. Materiais da escola."><div class="brand-shimmer" aria-hidden="true"></div><div class="mascot-motion" aria-hidden="true"></div><button class="motion-toggle" aria-pressed="false">Pausar animações</button>';
labels.forEach((label,i)=>{const b=document.createElement('button');b.className='portal-entry entry-'+i;b.setAttribute('aria-label',label);b.innerHTML='<span class="sr-only">'+label+'</span>';b.onclick=()=>go(i,null,null);home.append(b)});
header.after(home);
const wrap=document.querySelector('main');
const back=document.createElement('button');back.className='back-button';back.textContent='← Voltar';back.onclick=()=>s!==null?go(g,y,null):y!==null?go(g,null,null):go(null,null,null);crumb.before(back);
const search=document.createElement('input');search.className='subject-search';search.type='search';search.placeholder='Buscar disciplina';search.setAttribute('aria-label','Buscar disciplina');title.after(search);
search.oninput=()=>{const q=search.value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();for(const card of content.children)card.hidden=!card.textContent.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(q)};
const dialog=document.createElement('dialog');dialog.className='image-dialog';dialog.innerHTML='<form method="dialog"><button aria-label="Fechar ampliação">Fechar ×</button></form><img alt="Folha ampliada">';document.body.append(dialog);dialog.onclick=e=>{if(e.target===dialog)dialog.close()};
function path(subject,year){return g===4?'assets/pre-vestibular/'+seiPages[subject]+'.jpeg':seiPublishedPages[g+'|'+year+'|'+subject]}
function go(group,year,subject){g=group;y=year;s=subject;const params=new URLSearchParams();if(g!==null)params.set('etapa',g);if(y!==null)params.set('turma',y);if(s!==null)params.set('disciplina',s);history.pushState(null,'','#'+params);render();window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
function fromHash(){const p=new URLSearchParams(location.hash.slice(1));const n=Number(p.get('etapa'));g=p.has('etapa')&&groups[n]?n:null;y=g!==null&&groups[g].years.includes(p.get('turma'))?p.get('turma'):null;s=y!==null&&groups[g].subjects.includes(p.get('disciplina'))?p.get('disciplina'):null;render()}
window.addEventListener('popstate',fromHash);
header.querySelector('a').onclick=e=>{e.preventDefault();go(null,null,null)};
let paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
const toggle=home.querySelector('.motion-toggle');function motion(){document.body.classList.toggle('motion-paused',paused);toggle.textContent=paused?'Ativar animações':'Pausar animações';toggle.setAttribute('aria-pressed',String(paused))}toggle.onclick=()=>{paused=!paused;motion()};motion();
function card(label,description,src,fn){const b=document.createElement('button');b.className='portal-card';const im=document.createElement('img');im.src=src;im.alt='';im.loading='lazy';const info=document.createElement('span');const strong=document.createElement('strong');strong.textContent=label;const small=document.createElement('small');small.textContent=description+' ↗';info.append(strong,small);b.append(im,info);b.onclick=fn;content.append(b)}
render=function(){const atHome=g===null;document.body.classList.toggle('at-home',atHome);home.hidden=!atHome;header.hidden=atHome;wrap.hidden=atHome;search.hidden=true;search.value='';if(atHome)return;
if(s!==null){oldRender();const img=content.querySelector('.original-page');if(img){const b=document.createElement('button');b.textContent='Ampliar folha';b.onclick=()=>{dialog.querySelector('img').src=img.src;dialog.querySelector('img').alt=img.alt;dialog.showModal()};content.querySelector('.actions').prepend(b);img.onclick=b.onclick;img.style.cursor='zoom-in'}return;}
nav();content.replaceChildren();content.className='portal-grid';
if(y===null){title.textContent=groups[g].name+' · Selecione a turma';groups[g].years.forEach(year=>card(g===3?'Convênio · '+year:year,groups[g].subjects.length+' disciplinas',path(groups[g].subjects[0],year),()=>go(g,year,null)))}else{title.textContent=groups[g].name+' · '+y;search.hidden=false;groups[g].subjects.forEach(subject=>card(subject==='Artes'?'Arte':subject,'Abrir atividade',path(subject,y),()=>go(g,y,subject)))}
};
document.querySelector('body>footer').textContent='Sistema de Ensino Incentivo • São Miguel do Guamá — PA';fromHash();
})();
