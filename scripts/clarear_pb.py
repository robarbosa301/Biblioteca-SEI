"""Versão clara das folhas, só para a impressão em preto e branco (a colorida não muda).

O fundo azul-escuro da moldura (cabeçalho, laterais e rodapé) vira azul bem claro,
mantendo o desenho de fundo; textos brancos viram azul-escuro. Mascote, logo, o painel
branco e a caixa do número da página ficam como estão.
Precisa do modelo isnet.onnx (recorte do mascote e da logo): variável ISNET.
Uso: ISNET=caminho/isnet.onnx python scripts/clarear_pb.py entrada.jpg saida.jpg [1|2]
"""
import os
import sys
import cv2
import numpy as np
from PIL import Image

_s = None


def _isnet(crop):
    global _s
    import onnxruntime as ort
    if _s is None:
        _s = ort.InferenceSession(os.environ['ISNET'], providers=['CPUExecutionProvider'])
    x = np.array(crop.convert('RGB').resize((1024, 1024), Image.LANCZOS)).astype(np.float32) / 255 - .5
    p = _s.run(None, {_s.get_inputs()[0].name: x.transpose(2, 0, 1)[None].astype(np.float32)})[0][0, 0]
    p = (p - p.min()) / (p.max() - p.min() + 1e-8)
    return np.array(Image.fromarray((p * 255).astype(np.uint8)).resize(crop.size, Image.LANCZOS)).astype(np.float32) / 255


def _objeto(crop, perto, xmax=1.0):
    """Máscara do mascote/logo: isnet + partes claras/coloridas encostadas nele, sem buracos."""
    p = _isnet(crop)
    base = (p > .3).astype(np.uint8)
    a = np.array(crop.convert('RGB')).astype(np.float32) / 255
    hls = cv2.cvtColor(a, cv2.COLOR_RGB2HLS)
    claro = ((hls[..., 1] > .45) | ((hls[..., 2] > .5) & (hls[..., 1] > .3))).astype(np.uint8)
    viz = cv2.dilate(base, np.ones((perto, perto), np.uint8))
    n, l, st, cen = cv2.connectedComponentsWithStats(claro)
    k = base.copy()
    for i in range(1, n):
        # xmax: não pega a primeira letra do título, que fica logo ao lado do mascote
        if st[i, 4] > 40 and cen[i][0] < xmax * crop.width and viz[l == i].any():
            k[l == i] = 1
    k = cv2.morphologyEx(k, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    # tapa buracos (gravata, sombras): o que o fundo não alcança é objeto
    h, w = k.shape
    kk = k.copy(); kk[-1, :] = 1
    ff = kk.copy(); mm = np.zeros((h + 2, w + 2), np.uint8)
    for seed in [(0, 0), (w - 1, 0)] + [(x, 0) for x in range(0, w, 8)] + [(0, y) for y in range(0, h, 8)] + [(w - 1, y) for y in range(0, h, 8)]:
        if ff[seed[1], seed[0]] == 0:
            cv2.floodFill(ff, mm, seed, 1)
    k = np.maximum(k, 1 - ff)
    k[-1, :] = np.maximum(k[-1, :], k[-2, :])
    return cv2.GaussianBlur(k.astype(np.float32), (0, 0), 1.0)


def clarear(src, dst, pagina=2):
    im = Image.open(src).convert('RGB')
    a = np.array(im).astype(np.float32) / 255
    H, W = a.shape[:2]; u = W / 1024
    prot = np.zeros((H, W), np.float32)
    if pagina == 2:
        zonas = [((0, 0, int(190 * u), int(122 * u)), int(25 * u), .62), ((int(840 * u), 0, W, int(122 * u)), int(30 * u), 1.0)]
    else:
        zonas = [((0, 0, int(255 * u), int(248 * u)), int(25 * u), 1.0), ((int(770 * u), int(20 * u), W, int(238 * u)), int(30 * u), 1.0)]
    for (x0, y0, x1, y1), perto, xm in zonas:
        prot[y0:y1, x0:x1] = np.maximum(prot[y0:y1, x0:x1], _objeto(im.crop((x0, y0, x1, y1)), perto, xm))
    # áreas brancas grandes (painel, caixa do número) e o que fica dentro delas
    wh = (a.min(2) > .88).astype(np.uint8)
    n, l, st, _ = cv2.connectedComponentsWithStats(wh)
    for i in range(1, n):
        if st[i, 4] > 800 * u * u:
            x, y, w, h = st[i, :4]
            comp = (l[y:y + h, x:x + w] == i).astype(np.uint8)
            ff = comp.copy(); mm = np.zeros((h + 2, w + 2), np.uint8)
            borda = np.zeros_like(comp); borda[0, :] = borda[-1, :] = 1; borda[:, 0] = borda[:, -1] = 1
            for yy, xx in zip(*np.nonzero(borda & (comp == 0))):
                if ff[yy, xx] == 0:
                    cv2.floodFill(ff, mm, (int(xx), int(yy)), 1)
            cheio = np.maximum(comp, 1 - ff)
            prot[y:y + h, x:x + w] = np.maximum(prot[y:y + h, x:x + w], cheio)
    prot = np.clip(prot, 0, 1)[..., None]
    # Trabalha na claridade percebida (Lab), que é o tom de cinza que sai na impressora.
    lab = cv2.cvtColor(a, cv2.COLOR_RGB2Lab)
    l = lab[..., 0] / 100
    lb = cv2.GaussianBlur(l, (0, 0), 14 * u)  # claridade do entorno
    d = l - lb
    claro_sobre_escuro = np.clip((d - .08) / .12, 0, 1) * np.clip((l - .3) / .12, 0, 1)
    escuro_sobre_claro = np.clip((-d - .06) / .12, 0, 1) * np.clip((lb - .5) / .15, 0, 1)
    # só no cabeçalho (títulos sobre brilho claro); nas laterais e no rodapé, sombras e fotos desbotam
    cab = np.zeros(l.shape, np.float32); cab[:int((345 if pagina == 1 else 128) / 1448 * H)] = 1
    escuro_sobre_claro *= cv2.GaussianBlur(cab, (0, 0), 6 * u)
    fundo = 1 - np.maximum(claro_sobre_escuro, escuro_sobre_claro)
    novo = lab.copy()
    # fundo: desbotado (bem claro, pouca cor)
    lf = .80 + .18 * l
    # letras/desenhos claros sobre escuro: ficam escuros, na mesma cor (branco vira azul-escuro)
    ld = .20 + .30 * (1 - l)
    # nas laterais (entre o cabeçalho e o rodapé) os desenhos do fundo ficam cinza-claro, não escuros
    lado = np.zeros(l.shape, np.float32)
    lado[int((345 if pagina == 1 else 128) / 1448 * H):int(.935 * H)] = 1
    lado = cv2.GaussianBlur(lado, (0, 0), 6 * u)
    ld = ld * (1 - lado) + (.68 + .1 * (1 - l)) * lado
    croma = np.hypot(lab[..., 1], lab[..., 2])
    neutro = np.clip((14 - croma) / 8, 0, 1)
    ae = lab[..., 1] * (1 - neutro) + 8 * neutro
    be = lab[..., 2] * (1 - neutro) - 32 * neutro
    novo[..., 0] = 100 * (fundo * lf + claro_sobre_escuro * ld) + escuro_sobre_claro * lab[..., 0]
    novo[..., 1] = fundo * lab[..., 1] * .3 + claro_sobre_escuro * ae + escuro_sobre_claro * lab[..., 1]
    novo[..., 2] = fundo * lab[..., 2] * .3 + claro_sobre_escuro * be + escuro_sobre_claro * lab[..., 2]
    soma = fundo + claro_sobre_escuro + escuro_sobre_claro
    for c in range(3):
        if c == 0:
            novo[..., 0] = novo[..., 0] / np.maximum(soma, 1e-6)
        else:
            novo[..., c] = novo[..., c] / np.maximum(soma, 1e-6)
    inv = np.clip(cv2.cvtColor(novo.astype(np.float32), cv2.COLOR_Lab2RGB), 0, 1)
    out = a * prot + inv * (1 - prot)
    # Nenhuma área escura grande (mascote, logo, fotos, caixas): vira cinza médio, com o desenho.
    # Só traços finos (letras, linhas) continuam escuros.
    lo = cv2.cvtColor(out.astype(np.float32), cv2.COLOR_RGB2Lab)
    lv = lo[..., 0] / 100
    k = max(3, int(15 * u)) | 1
    grande = cv2.morphologyEx((lv < .42).astype(np.uint8), cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k)))
    grande = cv2.dilate(grande, np.ones((max(3, int(3 * u)),) * 2, np.uint8)).astype(np.float32)
    grande = cv2.GaussianBlur(grande, (0, 0), 1.5 * u)
    lo2 = lo.copy()
    lo2[..., 0] = 100 * (.58 + .42 * lv)
    lo2[..., 1] *= .6; lo2[..., 2] *= .6
    # fora do cabeçalho: também sombras e frestas finas (bordas do painel), poupando letras e o número
    k2 = max(3, int(7 * u)) | 1
    fino = cv2.morphologyEx((lv < .42).astype(np.uint8), cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k2, k2))).astype(np.float32)
    fino[:int((345 if pagina == 1 else 128) / 1448 * H)] = 0
    fino *= (prot[..., 0] < .5)
    fino = cv2.GaussianBlur(cv2.dilate(fino, np.ones((max(3, int(3 * u)),) * 2, np.uint8)), (0, 0), 1.5 * u)
    grande = np.maximum(grande, fino)
    w = grande[..., None]
    lo = lo * (1 - w) + lo2 * w
    out = np.clip(cv2.cvtColor(lo.astype(np.float32), cv2.COLOR_Lab2RGB), 0, 1)
    Image.fromarray((out * 255).clip(0, 255).astype(np.uint8)).save(dst, quality=95, subsampling=0)


if __name__ == '__main__':
    clarear(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 2)
