"""2ª página com moldura clara (boa para impressora preto e branco).

O fundo azul-escuro da moldura (faixa de cima, laterais e rodapé) vira azul bem claro,
mantendo o desenho de fundo; textos brancos viram azul-escuro. Mascote, logo, o painel
branco e a caixa do número da página ficam como estão.
Precisa do modelo isnet.onnx (recorte do mascote e da logo): variável ISNET.
Uso: ISNET=caminho/isnet.onnx python scripts/clarear_p2.py entrada.jpg saida.jpg
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


def clarear(src, dst):
    im = Image.open(src).convert('RGB')
    a = np.array(im).astype(np.float32) / 255
    H, W = a.shape[:2]; u = W / 1024
    prot = np.zeros((H, W), np.float32)
    for (x0, y0, x1, y1), perto, xm in [((0, 0, int(190 * u), int(122 * u)), int(25 * u), .62), ((int(840 * u), 0, W, int(122 * u)), int(30 * u), 1.0)]:
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
    hls = cv2.cvtColor(a, cv2.COLOR_RGB2HLS)
    L, S = hls[..., 1], hls[..., 2]
    novo = hls.copy()
    # fundo escuro → claro; tons médios (títulos coloridos) → escuros; branco → azul-escuro
    novo[..., 1] = np.interp(L, [0, .25, .5, 1], [.95, .83, .34, .15])
    neutro = S < .25
    novo[..., 0] = np.where(neutro & (L > .5), 216, hls[..., 0])
    novo[..., 2] = np.where(neutro & (L > .5), .75, np.where(L < .3, S * .55, S))
    # título da disciplina (letra colorida na faixa de cima): sempre na cor dela, em tom escuro
    y0, y1, x0, x1 = int(8 * u), int(60 * u), int(120 * u), int(845 * u)
    reg = a[y0:y1, x0:x1]
    fundo = np.median(reg.reshape(-1, 3), 0)
    dist = np.linalg.norm(reg - fundo, axis=2)
    sat = S[y0:y1, x0:x1]
    tit = np.clip((dist - .12) / .15, 0, 1) * np.clip((sat - .2) / .15, 0, 1)
    sub = novo[y0:y1, x0:x1]
    sub[..., 1] = sub[..., 1] * (1 - tit) + .32 * tit
    sub[..., 2] = sub[..., 2] * (1 - tit) + np.clip(sat * 1.1, 0, 1) * tit
    inv = cv2.cvtColor(novo, cv2.COLOR_HLS2RGB)
    out = a * prot + inv * (1 - prot)
    Image.fromarray((out * 255).clip(0, 255).astype(np.uint8)).save(dst, quality=95, subsampling=0)


if __name__ == '__main__':
    clarear(sys.argv[1], sys.argv[2])
