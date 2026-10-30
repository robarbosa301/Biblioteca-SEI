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
 if(s!==null){const list=groups[g].subjects,idx=list.indexOf(s);const switcher=document.createElement('div');switcher.className='sheet-switcher';const prev=control('← Anterior',()=>go(g,y,list[idx-1]));prev.disabled=idx===0;const next=control('Próxima →',()=>go(g,y,list[idx+1]));next.disabled=idx===list.length-1;const select=document.createElement('select');select.setAttribute('aria-label','Trocar disciplina');list.forEach(subject=>{const o=document.createElement('option');o.textContent=subject;o.value=subject;select.append(o)});select.value=s;select.onchange=()=>go(g,y,select.value);switcher.append(prev,select,next);journey.append(switcher)}
 crumb.replaceChildren();crumb.hidden=true;
}

function applySeriesCorrection(img){
 img.alt=s+' • '+seriesLabel(y)+' • '+groups[g].name;
 const special=['matematica','quimica','fisica','biologia','lingua-portuguesa'].some(slug=>img.src.endsWith('/'+slug+'.png'));
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 1024 1536');svg.setAttribute('preserveAspectRatio','none');svg.classList.add('series-correction');svg.setAttribute('aria-hidden','true');
 const add=(tag,attrs,value)=>{const n=document.createElementNS(svg.namespaceURI,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(value)n.textContent=value;svg.append(n)};
 const label=g===3?'3ª SÉRIE':parseInt(y)+'ª SÉRIE';
 if(special){add('rect',{x:260,y:42,width:237,height:180,rx:12,fill:'#041533',stroke:'#0eb9e9','stroke-width':4});add('text',{x:379,y:113,'text-anchor':'middle',fill:'#fff','font-family':'Arial,sans-serif','font-weight':900,'font-size':38},label);add('text',{x:379,y:164,'text-anchor':'middle',fill:'#fff','font-family':'Arial,sans-serif','font-weight':800,'font-size':23},g===3?'CONVÊNIO':'ENSINO MÉDIO')}
 else{
  const twoLine=g===3||['História','Filosofia','Sociologia','Arte','Educação Física'].includes(s);
  // The old grade is part of the printed artwork. Reuse its own parchment/scene
  // immediately above the lettering, feathering the edge so there is no white box.
  const top=twoLine?88:107,height=twoLine?78:48,offset=twoLine?86:57;
  const defs=document.createElementNS(svg.namespaceURI,'defs');svg.append(defs);
  const blur=document.createElementNS(svg.namespaceURI,'filter');blur.id='series-feather';blur.setAttribute('x','-10%');blur.setAttribute('y','-20%');blur.setAttribute('width','120%');blur.setAttribute('height','140%');
  const gaussian=document.createElementNS(svg.namespaceURI,'feGaussianBlur');gaussian.setAttribute('stdDeviation','3');blur.append(gaussian);defs.append(blur);
  const mask=document.createElementNS(svg.namespaceURI,'mask');mask.id='series-mask';mask.setAttribute('maskUnits','userSpaceOnUse');mask.setAttribute('x','497');mask.setAttribute('y',String(top-8));mask.setAttribute('width','323');mask.setAttribute('height',String(height+16));
  const windowRect=document.createElementNS(svg.namespaceURI,'rect');for(const [k,v] of Object.entries({x:503,y:top,width:310,height,fill:'#fff',filter:'url(#series-feather)'}))windowRect.setAttribute(k,v);mask.append(windowRect);defs.append(mask);
  const scene=document.createElementNS(svg.namespaceURI,'image');scene.setAttribute('href',img.currentSrc||img.src);scene.setAttribute('x','0');scene.setAttribute('y',String(offset));scene.setAttribute('width','1024');scene.setAttribute('height','1536');scene.setAttribute('mask','url(#series-mask)');svg.append(scene);
  const ink={fill:'#111820','font-family':'Arial,sans-serif','font-weight':800};
  if(twoLine){add('text',{x:511,y:121,...ink,'font-size':27},g===3?'3ª série':parseInt(y)+'ª série');add('text',{x:511,y:150,...ink,'font-size':26,textLength:g===3?290:208,lengthAdjust:'spacingAndGlyphs'},g===3?'Convênio • Ensino Médio':'Ensino Médio')}
  else add('text',{x:511,y:139,...ink,'font-size':26,textLength:297,lengthAdjust:'spacingAndGlyphs'},parseInt(y)+'ª série — Ensino Médio');
 }
 add('rect',{x:27,y:1472,width:84,height:33,fill:'#090915'});add('text',{x:30,y:1497,fill:'#fff','font-family':'Arial,sans-serif','font-weight':700,'font-size':21},g===3?'3ª série':parseInt(y)+'ª série');
 img.closest('article').classList.add('series-sheet');img.after(svg);
}
const coverRoot='assets/portal/covers/';
const subjectCovers={'Língua Portuguesa':'portugues','Português':'portugues','Matemática':'matematica','Ciências':'ciencias','História':'historia','Geografia':'geografia','Arte':'arte','Artes':'arte','Educação Física':'educacao-fisica','Ensino Religioso':'religiao','Inglês':'ingles','Literatura':'literatura','Redação':'redacao','Física':'fisica','Química':'quimica','Biologia':'biologia','Filosofia':'filosofia','Sociologia':'sociologia'};
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

render=function(){const atHome=g===null;document.body.classList.toggle('at-home',atHome);home.hidden=!atHome;header.hidden=atHome;wrap.hidden=atHome;search.hidden=true;search.value='';if(atHome)return;
if(s!==null){oldRender();navigation();const img=content.querySelector('.original-page');if(img){if(g===2||g===3)applySeriesCorrection(img);const actions=content.querySelector('.actions');const b=document.createElement('button');b.textContent='Ampliar folha';b.onclick=()=>{const enlarged=img.closest('article').cloneNode(true);dialog.replaceChildren(dialog.querySelector('form'),enlarged);dialog.showModal()};actions.prepend(b);img.onclick=b.onclick;img.style.cursor='zoom-in';const word=document.createElement('button');word.className='blank-word';word.textContent='↓ Modelo em branco (Word)';word.title='Folha editável com cabeçalho SEI e oito faixas numeradas';word.onclick=async()=>{word.disabled=true;word.textContent='Preparando Word…';try{await downloadBlankSeiDocx({group:g,year:y,subject:s,source:img.getAttribute('src')})}catch(error){alert('Não foi possível preparar o Word: '+error.message)}finally{word.disabled=false;word.textContent='↓ Modelo em branco (Word)'}};actions.append(word);const hint=document.createElement('p');hint.className='word-hint';hint.textContent='Modelo editável: escreva suas questões abaixo das faixas numeradas e imprima pelo Word.';actions.after(hint)}return;}
navigation();content.replaceChildren();content.className='portal-grid';
if(y===null){title.textContent=groups[g].name;groups[g].years.forEach((year,index)=>card(seriesLabel(year),groups[g].subjects.length+' disciplinas',yearArt(year,index),()=>go(g,year,null)))}else{title.textContent=groups[g].name+' · '+(g===3?'3ª série':seriesLabel(y));search.hidden=false;groups[g].subjects.forEach(subject=>card(subject==='Artes'?'Arte':subject,'Abrir atividade',path(subject,y),()=>go(g,y,subject)))}
};
document.querySelector('body>footer').textContent='Sistema de Ensino Incentivo • São Miguel do Guamá — PA';fromHash();
})();

