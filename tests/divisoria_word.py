"""Confere no PDF renderizado que as letras ficam dentro do selo do Word."""
from pathlib import Path
from tempfile import TemporaryDirectory
from subprocess import run, check_output, DEVNULL
from zipfile import ZipFile
from lxml import etree as E
import re

ROOT = Path(__file__).resolve().parents[1]
samples = ['ensino-medio/1-ano/ingles.docx', 'fundamental-1/3-ano/matematica.docx']
with TemporaryDirectory(prefix='sei-divisoria-') as tmp:
    for relative in samples:
        source = ROOT / 'assets/word' / relative
        run(['soffice','--headless','-env:UserInstallation=file://'+tmp+'/perfil','--convert-to','pdf',
             '--outdir',tmp,str(source)],check=True,stdout=DEVNULL)
        pdf = Path(tmp) / (source.stem+'.pdf')
        xml = check_output(['pdftotext','-bbox',str(pdf),'-'],stderr=DEVNULL)
        result = E.fromstring(xml)
        words = result.xpath('//*[local-name()="word" and (text()="Nº" or text()="EM" or text()="APROVAÇÃO")]')
        assert len(words)>=3,relative
        with ZipFile(source) as z:
            header = E.fromstring(z.read('word/header1.xml'))
            mark = header.xpath('.//*[@id="SEICenterTag"]')[0]
            style = mark.get('style')
            left=float(re.search(r'margin-left:([\d.]+)pt',style).group(1))
            width=float(re.search(r';width:([\d.]+)pt',style).group(1))
        for word in words:
            assert float(word.get('xMin'))>=left, (relative,word.attrib)
            assert float(word.get('xMax'))<=left+width, (relative,word.attrib)
        print(relative+': texto vertical inteiro dentro do selo no PDF.',flush=True)
