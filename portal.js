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

const journey=document.createElement('nav');journey.className='journey';journey.setAttribute('aria-label','Navegação da biblioteca');back.replaceWith(journey);
function control(text,fn,cls=''){const b=document.createElement('button');b.textContent=text;b.className=cls;b.onclick=fn;return b}
function navigation(){
 journey.replaceChildren(control('⌂ Início',()=>go(null,null,null),'journey-home'),back);
 back.textContent=s!==null?'← Disciplinas':y!==null?'← Turmas':'← Etapas';
 const trail=[['Etapas',()=>go(null,null,null)],['Turmas',()=>go(g,null,null)],['Disciplinas',()=>go(g,y,null)],['Folha',null]];
 const steps=document.createElement('div');steps.className='journey-steps';const active=s!==null?3:y!==null?2:1;
 trail.forEach(([label,fn],i)=>{const b=control((i+1)+' · '+label,fn||(()=>{}));b.disabled=i>active||i===active;if(i===active)b.setAttribute('aria-current','step');steps.append(b)});journey.append(steps);
 if(s!==null){const list=groups[g].subjects,idx=list.indexOf(s);const switcher=document.createElement('div');switcher.className='sheet-switcher';const prev=control('← Anterior',()=>go(g,y,list[idx-1]));prev.disabled=idx===0;const next=control('Próxima →',()=>go(g,y,list[idx+1]));next.disabled=idx===list.length-1;const select=document.createElement('select');select.setAttribute('aria-label','Trocar disciplina');list.forEach(subject=>{const o=document.createElement('option');o.textContent=subject;o.value=subject;select.append(o)});select.value=s;select.onchange=()=>go(g,y,select.value);switcher.append(prev,select,next);journey.append(switcher)}
 crumb.replaceChildren();const parts=[['Início',()=>go(null,null,null)],[groups[g].name,()=>go(g,null,null)]];if(y!==null)parts.push([y,()=>go(g,y,null)]);if(s!==null)parts.push([s,null]);parts.forEach(([label,fn],i)=>{if(i)crumb.append(' › ');if(fn)crumb.append(control(label,fn));else{const t=document.createElement('span');t.textContent=label;crumb.append(t)}});
}
const yearSymbols=['✏','📖','🔎','🌎','🚀','🧭','🔬','⚙','🎓'];
function yearArt(year,index){
 const number=parseInt(year)||'';const symbol=g===0?yearSymbols[index]:g===1?yearSymbols[index+5]:g===2?'⚛':g===3?'🎓':'🚀';
 const color=['#087fc1','#6751b6','#00877f','#b96c16','#2859af'][g];
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"><defs><linearGradient id="b" x2="1" y2="1"><stop stop-color="'+color+'"/><stop offset="1" stop-color="#082653"/></linearGradient></defs><rect width="600" height="400" fill="url(#b)"/><circle cx="520" cy="65" r="145" fill="#ffffff12"/><circle cx="65" cy="365" r="155" fill="#ffffff0e"/><path d="M70 110h80m-40-40v80M460 300h70m-35-35v70" stroke="#ffffff35" stroke-width="6" stroke-linecap="round"/><rect x="175" y="80" width="250" height="240" rx="30" fill="#ffffff18" stroke="#ffffff65" stroke-width="2" transform="rotate(-7 300 200)"/><text x="300" y="190" text-anchor="middle" font-size="88">'+symbol+'</text><text x="300" y="275" fill="white" text-anchor="middle" font-family="Arial" font-size="64" font-weight="bold">'+(number?number+'º ANO': 'PRÉ')+'</text><circle cx="470" cy="110" r="12" fill="#ffe18a"/><circle cx="130" cy="265" r="8" fill="#7ae8ff"/></svg>';
 return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
}
const paletteCache=new Map();
function sheetColor(img,card){
 const apply=color=>{card.style.setProperty('--sheet-color',color);card.classList.add('subject-card')};
 apply('#116bb2');
 const sample=()=>{try{if(paletteCache.has(img.src)){apply(paletteCache.get(img.src));return}const c=document.createElement('canvas');c.width=120;c.height=40;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,img.naturalHeight*.19,img.naturalWidth,img.naturalHeight*.15,0,0,120,40);const pixels=ctx.getImageData(0,0,120,40).data,bins=new Map();for(let i=0;i<pixels.length;i+=4){const [r,g,b]=pixels.slice(i,i+3),hi=Math.max(r,g,b),lo=Math.min(r,g,b);if(hi-lo<55||hi<75||hi>245&&lo>170)continue;const key=[r,g,b].map(v=>Math.round(v/32)*32).join(',');bins.set(key,(bins.get(key)||0)+1)}const best=[...bins].sort((a,b)=>b[1]-a[1])[0];if(best){const color='rgb('+best[0]+')';paletteCache.set(img.src,color);apply(color)}}catch(e){/* retain readable blue when sampling is unavailable */}};
 if(img.complete&&img.naturalWidth)sample();else img.addEventListener('load',sample,{once:true});
}

function card(label,description,src,fn){const b=document.createElement('button');b.className='portal-card';const im=document.createElement('img');im.src=src;im.alt='';im.loading='lazy';const info=document.createElement('span');const strong=document.createElement('strong');strong.textContent=label;const small=document.createElement('small');small.textContent=description+' ↗';info.append(strong,small);b.append(im,info);b.onclick=fn;content.append(b);b.style.animationDelay=(content.children.length-1)*35+'ms';if(y!==null)sheetColor(im,b);else b.classList.add('year-card')}
render=function(){const atHome=g===null;document.body.classList.toggle('at-home',atHome);home.hidden=!atHome;header.hidden=atHome;wrap.hidden=atHome;search.hidden=true;search.value='';if(atHome)return;
if(s!==null){oldRender();navigation();const img=content.querySelector('.original-page');if(img){const b=document.createElement('button');b.textContent='Ampliar folha';b.onclick=()=>{dialog.querySelector('img').src=img.src;dialog.querySelector('img').alt=img.alt;dialog.showModal()};content.querySelector('.actions').prepend(b);img.onclick=b.onclick;img.style.cursor='zoom-in'}return;}
navigation();content.replaceChildren();content.className='portal-grid';
if(y===null){title.textContent=groups[g].name+' · Selecione a turma';groups[g].years.forEach((year,index)=>card(g===3?'Convênio · '+year:year,groups[g].subjects.length+' disciplinas',yearArt(year,index),()=>go(g,year,null)))}else{title.textContent=groups[g].name+' · '+y;search.hidden=false;groups[g].subjects.forEach(subject=>card(subject==='Artes'?'Arte':subject,'Abrir atividade',path(subject,y),()=>go(g,y,subject)))}
};
document.querySelector('body>footer').textContent='Sistema de Ensino Incentivo • São Miguel do Guamá — PA';fromHash();
})();
