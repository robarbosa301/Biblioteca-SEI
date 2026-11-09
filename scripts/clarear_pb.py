"""Versão para impressão em preto e branco: a MESMA arte colorida, só em cinza claro.

Nada é redesenhado: cada ponto vira cinza (pela claridade que o olho percebe) e os tons
escuros são clareados por igual, para gastar menos tinta. O branco continua branco.
Uso: python scripts/clarear_pb.py entrada.jpg saida.jpg
"""
import sys
import cv2
import numpy as np
from PIL import Image

# 1.0 = cinza normal; quanto menor, mais claro (o preto vira 1 - FORCA de cinza)
FORCA = .40


def clarear(src, dst, pagina=None):
    a = np.array(Image.open(src).convert('RGB')).astype(np.float32) / 255
    l = cv2.cvtColor(a, cv2.COLOR_RGB2Lab)[..., 0] / 100
    g = 1 - (1 - l) * FORCA
    Image.fromarray((g * 255).round().clip(0, 255).astype(np.uint8)).convert('RGB').save(dst, quality=92, subsampling=0)


if __name__ == '__main__':
    clarear(sys.argv[1], sys.argv[2])
