/* Shared SEI worksheet identity for the library and editable Word model. */
(()=>{
const colors={'Língua Portuguesa':'0059D9','Português':'0059D9','Literatura':'8E2F0B','Redação':'B32038','Matemática':'086CC6','Física':'1553B7','Química':'7339AF','Biologia':'237B36','Ciências':'258343','História':'A04B18','Geografia':'19794D','Filosofia':'9A5C2D','Sociologia':'317A54','Inglês':'C32439','Espanhol':'D05021','Arte':'A12B9A','Artes':'A12B9A','Educação Física':'D06416','Ensino Religioso':'7754A5'};
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
window.seiHeaderConfig=(group,year,subject)=>{
 const n=parseInt(year,10);let grade,lines,size=48;
 if(group===0||group===1){grade=n+'º ANO';lines=['ENSINO','FUNDAMENTAL']}
 else if(group===2){grade=n+'ª SÉRIE';lines=['ENSINO','MÉDIO'];size=43}
 else if(group===3){grade='3ª SÉRIE';lines=['ENSINO MÉDIO','CONVÊNIO'];size=43}
 else{grade='PRÉ';lines=['VESTIBULAR','PREPARAÇÃO'];size=48}
 return {grade,lines,size,subject:subject==='Artes'?'Arte':subject,color:colors[subject]||'0059D9',label:group===3?'3ª série (Convênio)':group===2?n+'ª série':year,stage:group<2?'Ensino Fundamental':group===4?'Pré-vestibular':'Ensino Médio'};
};
window.seiHeaderMarkup=(group,year,subject)=>{
 const c=seiHeaderConfig(group,year,subject),lineSize=group===3?25:group===4?25:29;
 return `<image href="${SEI_HEADER_ART}" x="0" y="0" width="1024" height="245"/><g font-family="Arial,sans-serif" font-weight="900" text-anchor="middle"><text x="380" y="104" fill="#13D6F7" font-size="${c.size}" textLength="204" lengthAdjust="spacingAndGlyphs">${esc(c.grade)}</text><text x="380" y="151" fill="white" font-size="${lineSize}">${esc(c.lines[0])}</text><text x="380" y="185" fill="white" font-size="${lineSize}" textLength="205" lengthAdjust="spacingAndGlyphs">${esc(c.lines[1])}</text><text x="651" y="177" fill="#${c.color}" font-size="35" textLength="265" lengthAdjust="spacingAndGlyphs">${esc(c.subject)}</text></g><path d="M519 205 Q651 184 782 204" fill="none" stroke="#${c.color}" stroke-width="3"/>`;
};
})();
