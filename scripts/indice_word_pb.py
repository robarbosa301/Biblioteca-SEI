"""Índice para o Word preto e branco (word-pb.js): imagem de fundo do modelo → versão clara.

Para cada modelo Word, a imagem do cabeçalho da 1ª página aponta para …-p1-pb.jpg e a das
páginas seguintes para …-p2-pb.jpg (as mesmas versões claras do Montar folha).
Uso: python scripts/indice_word_pb.py   (grava assets/word-pb.json)
"""
import glob
import hashlib
import json
import os
import re
import zipfile

R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
mapa = {}
for dx in sorted(glob.glob(os.path.join(R, 'assets', 'word*', '**', '*.docx'), recursive=True)):
    rel = os.path.relpath(dx, os.path.join(R, 'assets')).replace(os.sep, '/')
    base = re.sub(r'^word(-conteudo)?/', '', rel)[:-5]
    with zipfile.ZipFile(dx) as z:
        for h, pag in (('word/_rels/header1.xml.rels', 'p1'), ('word/_rels/header2.xml.rels', 'p2')):
            if h not in z.namelist():
                continue
            for t in re.findall(r'Target="(media/[^"]+\.(?:jpe?g|png))"', z.read(h).decode('utf8')):
                alvo = f'assets/montar/{base}-{pag}-pb.jpg'
                if os.path.exists(os.path.join(R, alvo)):
                    mapa[hashlib.sha1(z.read('word/' + t)).hexdigest()] = alvo
json.dump(mapa, open(os.path.join(R, 'assets', 'word-pb.json'), 'w'), separators=(',', ':'), sort_keys=True)
print(len(mapa), 'imagens no índice')
