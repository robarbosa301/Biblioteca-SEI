"""Enter amigável nos modelos Word.

As linhas de espaçamento entre as questões (altura exata de poucos pontos, com ou sem traço)
passam a usar estilos próprios cujo "próximo estilo" é o Normal. Assim, um Enter numa delas
cria uma linha normal, e não uma linha minúscula ou com traço. O texto das questões deixa de
"grudar" na linha seguinte (keepNext), para o Word poder passar texto longo para a próxima coluna.
"""
from lxml import etree as E
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main'
q=lambda t: f'{{{W}}}{t}'
def _el(tag,**a):
    e=E.Element(q(tag))
    for k,v in a.items(): e.set(q(k),str(v))
    return e
def aplicar(entries):
    ns={'w':W}
    doc=E.fromstring(entries['word/document.xml']); body=doc.find(q('body'))
    st=E.fromstring(entries['word/styles.xml'])
    for old in st.xpath('//w:style[starts-with(@w:styleId,"SEIEsp")]',namespaces=ns): st.remove(old)
    feitos={}
    for p in body.iter(q('p')):
        pPr=p.find(q('pPr'))
        if pPr is None: continue
        sp=pPr.find(q('spacing'))
        if sp is None or sp.get(q('lineRule'))!='exact': continue
        try: line=int(sp.get(q('line')) or 0)
        except ValueError: continue
        if line>100: continue
        if p.xpath('.//w:t[normalize-space()]|.//w:drawing|.//w:pict|.//w:sdt|.//w:fldSimple',namespaces=ns): continue
        if pPr.find(q('sectPr')) is not None or pPr.find(q('numPr')) is not None: continue
        before=sp.get(q('before')) or '0'; after=sp.get(q('after')) or '0'
        bd=pPr.find(q('pBdr')); keep=pPr.find(q('keepNext')) is not None
        cor=bd.find(q('bottom')).get(q('color')) if bd is not None and bd.find(q('bottom')) is not None else ''
        sid=f'SEIEsp{line}b{before}a{after}{"k" if keep else ""}{cor}'
        if sid not in feitos:
            s_=_el('style',type='paragraph',customStyle='1',styleId=sid); s_.append(_el('name',val='SEI espaço '+str(len(feitos)+1)))
            s_.append(_el('basedOn',val='Normal')); s_.append(_el('next',val='Normal')); s_.append(_el('uiPriority',val='99'))
            pp=E.SubElement(s_,q('pPr'))
            if keep: pp.append(_el('keepNext'))
            if cor:
                b2=E.SubElement(pp,q('pBdr')); b2.append(_el('bottom',val='single',sz='6',space='1',color=cor))
            pp.append(_el('spacing',before=before,after=after,line=str(line),lineRule='exact'))
            st.append(s_); feitos[sid]=1
        rpr=pPr.find(q('rPr'))
        for c in list(pPr): pPr.remove(c)
        pPr.append(_el('pStyle',val=sid))
        if rpr is not None: pPr.append(rpr)
    for sdt in body.iter(q('sdt')):
        pr=sdt.find(q('sdtPr'))
        if pr is None: continue
        for p in sdt.iter(q('p')):
            pPr=p.find(q('pPr'))
            if pPr is None: continue
            for k in pPr.findall(q('keepNext')): pPr.remove(k)
    entries['word/document.xml']=E.tostring(doc,xml_declaration=True,encoding='UTF-8',standalone=True)
    entries['word/styles.xml']=E.tostring(st,xml_declaration=True,encoding='UTF-8',standalone=True)
    return len(feitos)
