"""Gera a paleta neutra provisória (OKLCH com deslocamento de matiz) e valida.
Uso: python gerar_paleta.py <saida.json> [preview.png]
"""
import json, math, sys

def oklab_to_lrgb(L, a, b):
    l_ = L + 0.3963377774*a + 0.2158037573*b
    m_ = L - 0.1055613458*a - 0.0638541728*b
    s_ = L - 0.0894841775*a - 1.2914855480*b
    l, m, s = l_**3, m_**3, s_**3
    return (4.0767416621*l - 3.3077115913*m + 0.2309699292*s,
            -1.2684380046*l + 2.6097574011*m - 0.3413193965*s,
            -0.0041960863*l - 0.7034186147*m + 1.7076147010*s)

def lrgb_to_oklab(r, g, b):
    l = 0.4122214708*r + 0.5363325363*g + 0.0514459929*b
    m = 0.2119034982*r + 0.6806995451*g + 0.1073969566*b
    s = 0.0883024619*r + 0.2817188376*g + 0.6299787005*b
    l_, m_, s_ = (math.copysign(abs(x)**(1/3), x) for x in (l, m, s))
    return (0.2104542553*l_ + 0.7936177850*m_ - 0.0040720468*s_,
            1.9779984951*l_ - 2.4285922050*m_ + 0.4505937099*s_,
            0.0259040371*l_ + 0.7827717662*m_ - 0.8086757660*s_)

def enc(x):
    x = min(max(x, 0.0), 1.0)
    return 12.92*x if x <= 0.0031308 else 1.055*x**(1/2.4) - 0.055

def dec(c):
    return c/12.92 if c <= 0.04045 else ((c+0.055)/1.055)**2.4

def in_gamut(rgb):
    return all(-1e-4 <= c <= 1+1e-4 for c in rgb)

def oklch_hex(L, C, h):
    # reduz croma até caber no sRGB (mantém L e h)
    while True:
        a, b = C*math.cos(math.radians(h)), C*math.sin(math.radians(h))
        rgb = oklab_to_lrgb(L, a, b)
        if in_gamut(rgb) or C <= 0:
            break
        C -= 0.002
    return '#' + ''.join(f'{round(enc(c)*255):02x}' for c in rgb)

def hex_lrgb(h):
    return tuple(dec(int(h[i:i+2], 16)/255) for i in (1, 3, 5))

def lerp(a, b, t): return a + (b-a)*t

def hue_lerp(a, b, t):
    d = ((b - a + 180) % 360) - 180
    return (a + d*t) % 360

# nome, uso, n, L escuro, L claro, croma pico, matiz escuro, matiz meio, matiz claro
RAMPAS = [
    ("neutro_frio",  "contorno, sombra-chave, cinzas de base, branco", 6, 0.14, 0.96, 0.030, 275, 260, 230),
    ("neutro_quente","papel, linho, cinzas de luz quente",            4, 0.25, 0.93, 0.025, 40, 65, 85),
    ("pele_clara",   "pele (tom claro)",                              4, 0.42, 0.91, 0.070, 25, 50, 75),
    ("pele_media",   "pele (tom médio)",                              4, 0.34, 0.80, 0.090, 25, 48, 70),
    ("pele_escura",  "pele (tom escuro)",                             4, 0.24, 0.66, 0.075, 20, 42, 62),
    ("metal_aco",    "armas, armaduras, ferragens",                   5, 0.22, 0.94, 0.030, 265, 240, 95),
    ("metal_latao",  "latão, bronze, ouro velho, fivelas",            5, 0.30, 0.92, 0.110, 40, 75, 95),
    ("madeira",      "madeira, couro, cordas",                        5, 0.22, 0.80, 0.075, 30, 55, 75),
    ("pedra",        "pedra, alvenaria, rocha",                       5, 0.26, 0.86, 0.030, 280, 255, 80),
    ("vegetacao",    "grama, folhas, musgo",                          5, 0.22, 0.90, 0.130, 195, 140, 110),
    ("terra",        "chão de terra, trilhas, barro",                 4, 0.30, 0.76, 0.060, 40, 60, 80),
    ("perigo",       "RESERVADA: golpe vindo no mundo (avisos, zonas de dano); nunca na UI", 4, 0.40, 0.92, 0.250, 325, 332, 345),
    ("brilho",       "RESERVADA: interativos, coletáveis, luz de destaque", 3, 0.80, 0.97, 0.120, 85, 92, 100),
    ("ui",           "painéis, bordas, texto e foco da interface",    4, 0.18, 0.96, 0.050, 50, 60, 80),
    ("alerta_ui",    "RESERVADA: só UI/HUD (erro, vida baixa), sempre com forma + ícone + texto", 2, 0.36, 0.65, 0.210, 28, 32, 35),
]

# luminosidades explícitas onde a rampa não é contínua (papéis de UI)
LS_FIXOS = {"ui": [0.20, 0.55, 0.80, 0.96], "perigo": [0.40, 0.66, 0.74, 0.92], "alerta_ui": [0.36, 0.65], "brilho": [0.88, 0.93, 0.98]}

# rampas reservadas curtas: croma cheio em todos os passos (leitura > suavidade)
CROMA_FIXO = {"brilho", "alerta_ui"}

def gerar():
    rampas = []
    for nome, uso, n, l0, l1, cmax, h0, hm, h1 in RAMPAS:
        cores = []
        for i in range(n):
            t = i/(n-1)
            L = LS_FIXOS[nome][i] if nome in LS_FIXOS else lerp(l0, l1, t)
            C = cmax if nome in CROMA_FIXO else cmax*(1 - (2*t-1)**2*0.4)  # menos croma nas pontas
            h = hue_lerp(h0, hm, t*2) if t <= 0.5 else hue_lerp(hm, h1, (t-0.5)*2)
            cores.append({"id": f"{nome}_{i+1}", "hex": oklch_hex(L, C, h)})
        rampas.append({"nome": nome, "uso": uso, "reservada": uso.startswith("RESERVADA"), "cores": cores})
    # a UI usa passos específicos, não uma rampa contínua
    ui = next(r for r in rampas if r["nome"] == "ui")
    papeis = ["painel", "borda", "texto_secundario", "texto"]
    for c, p in zip(ui["cores"], papeis):
        c["papel"] = p
    return rampas

def lum(hexc):
    r, g, b = hex_lrgb(hexc)
    return 0.2126*r + 0.7152*g + 0.0722*b

def contraste(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la+0.05)/(lb+0.05)

MACHADO = {
    "protanopia":   [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
    "deuteranopia": [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
    "tritanopia":   [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]],
}

def simula(hexc, m):
    rgb = hex_lrgb(hexc)
    out = [min(max(sum(m[i][j]*rgb[j] for j in range(3)), 0), 1) for i in range(3)]
    return lrgb_to_oklab(*out)

def de(p, q):
    return math.dist(p, q)

def validar(rampas):
    erros, avisos, relatorio = [], [], []
    todas = [c for r in rampas for c in r["cores"]]
    ids = [c["id"] for c in todas]
    hexes = [c["hex"] for c in todas]
    if len(todas) > 64: erros.append(f"{len(todas)} cores (> 64)")
    if len(set(ids)) != len(ids): erros.append("IDs repetidos")
    if len(set(hexes)) != len(hexes): erros.append("cores repetidas")
    for r in rampas:
        Ls = [lrgb_to_oklab(*hex_lrgb(c["hex"]))[0] for c in r["cores"]]
        if any(b <= a for a, b in zip(Ls, Ls[1:])): erros.append(f"rampa {r['nome']} não é crescente em luminosidade")
    relatorio.append(f"Total de cores: {len(todas)}")
    # contraste da UI
    ui = {c["papel"]: c["hex"] for c in next(r for r in rampas if r["nome"] == "ui")["cores"]}
    for papel, minimo in (("texto", 7.0), ("texto_secundario", 4.5), ("borda", 3.0)):
        k = contraste(ui[papel], ui["painel"])
        relatorio.append(f"Contraste ui {papel} x painel: {k:.2f}:1 (mín {minimo})")
        if k < minimo: erros.append(f"contraste ui {papel} {k:.2f} < {minimo}")
    # perigo x chão (normal e 3 tipos de daltonismo)
    by = {c["id"]: c["hex"] for c in todas}
    perigo = ["perigo_2", "perigo_3"]
    chaos = ["vegetacao_2", "vegetacao_3", "vegetacao_4", "terra_2", "terra_3", "pedra_2", "pedra_3", "madeira_3"]
    pior = (9, None)
    for p in perigo:
        for ch in chaos:
            d0 = de(lrgb_to_oklab(*hex_lrgb(by[p])), lrgb_to_oklab(*hex_lrgb(by[ch])))
            pior = min(pior, (d0, f"{p} x {ch} (normal)"))
            for nome, m in MACHADO.items():
                d = de(simula(by[p], m), simula(by[ch], m))
                pior = min(pior, (d, f"{p} x {ch} ({nome})"))
    relatorio.append(f"Pior distância perigo x chão (ΔE OKLab): {pior[0]:.3f} em {pior[1]} (mín 0,10)")
    if pior[0] < 0.10: avisos.append(f"perigo pouco distinto: {pior[1]} ({pior[0]:.3f}); compensar com forma + contorno + animação")
    # brilho x chão
    pior = (9, None)
    for p in ["brilho_1", "brilho_2"]:
        for ch in chaos:
            for nome, m in [("normal", None)] + list(MACHADO.items()):
                a = lrgb_to_oklab(*hex_lrgb(by[p])) if m is None else simula(by[p], m)
                b = lrgb_to_oklab(*hex_lrgb(by[ch])) if m is None else simula(by[ch], m)
                pior = min(pior, (de(a, b), f"{p} x {ch} ({nome})"))
    relatorio.append(f"Pior distância brilho x chão (ΔE OKLab): {pior[0]:.3f} em {pior[1]} (mín 0,10)")
    if pior[0] < 0.10: avisos.append(f"brilho pouco distinto: {pior[1]}")
    # perigo x brilho (não podem se confundir)
    pior = (9, None)
    for p in perigo:
        for q in ["brilho_1", "brilho_2", "brilho_3"]:
            for nome, m in [("normal", None)] + list(MACHADO.items()):
                a = lrgb_to_oklab(*hex_lrgb(by[p])) if m is None else simula(by[p], m)
                b = lrgb_to_oklab(*hex_lrgb(by[q])) if m is None else simula(by[q], m)
                pior = min(pior, (de(a, b), f"{p} x {q} ({nome})"))
    relatorio.append(f"Pior distância perigo x brilho (ΔE OKLab): {pior[0]:.3f} em {pior[1]} (mín 0,10)")
    if pior[0] < 0.10: avisos.append(f"perigo e brilho se confundem: {pior[1]}")
    # alerta de UI: legível no painel e distinto de perigo e brilho
    k = contraste(by["alerta_ui_2"], ui["painel"])
    relatorio.append(f"Contraste alerta_ui_2 x painel: {k:.2f}:1 (mín 4.5)")
    if k < 4.5: erros.append(f"contraste alerta_ui_2 {k:.2f} < 4.5")
    pior = (9, None)
    for p in ["alerta_ui_1", "alerta_ui_2"]:
        for q in ["perigo_2", "perigo_3", "perigo_4", "brilho_1", "brilho_2", "brilho_3"]:
            for nome, m in [("normal", None)] + list(MACHADO.items()):
                a = lrgb_to_oklab(*hex_lrgb(by[p])) if m is None else simula(by[p], m)
                b = lrgb_to_oklab(*hex_lrgb(by[q])) if m is None else simula(by[q], m)
                pior = min(pior, (de(a, b), f"{p} x {q} ({nome})"))
    relatorio.append(f"Pior distância alerta_ui x perigo/brilho (ΔE OKLab): {pior[0]:.3f} em {pior[1]} (mín 0,10)")
    if pior[0] < 0.10: avisos.append(f"alerta_ui pouco distinto: {pior[1]}")
    return erros, avisos, relatorio

def preview(rampas, caminho):
    # PNG mínimo sem dependências: linhas = rampas, colunas = passos (normal | protanopia | deuteranopia)
    import zlib, struct
    cel, w = 24, max(len(r["cores"]) for r in rampas)
    modos = [None, MACHADO["protanopia"], MACHADO["deuteranopia"]]
    W, H = (w*cel + cel)*len(modos), len(rampas)*cel
    def cor(hexc, m):
        if m is None: return tuple(int(hexc[i:i+2], 16) for i in (1, 3, 5))
        rgb = hex_lrgb(hexc)
        return tuple(round(enc(min(max(sum(m[i][j]*rgb[j] for j in range(3)), 0), 1))*255) for i in range(3))
    linhas = []
    for y in range(H):
        r = rampas[y//cel]
        px = []
        for mi, m in enumerate(modos):
            for x in range(w + 1):
                px += (cor(r["cores"][x]["hex"], m) if x < len(r["cores"]) else (128, 128, 128)) * cel
        linhas.append(b"\x00" + bytes(px))
    def chunk(t, d): return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", W, H, 8, 2, 0, 0, 0)) \
        + chunk(b"IDAT", zlib.compress(b"".join(linhas))) + chunk(b"IEND", b"")
    open(caminho, "wb").write(png)

if __name__ == "__main__":
    rampas = gerar()
    erros, avisos, rel = validar(rampas)
    doc = {
        "id": "paleta_neutra",
        "versao": "0.2.0",
        "status": "provisoria",
        "aviso": "Paleta neutra para placeholders e spikes (BRF-002). Não usar em arte final. Será substituída na etapa 2 do guia visual (roteiro de cor por região).",
        "regras": {
            "max_cores_por_sprite": 32,
            "alpha_permitido": [0, 255],
            "deslocamento_de_matiz": "sombras puxam para azul/violeta (frio), luzes para amarelo (quente)",
            "rampas_reservadas": "perigo: só golpe vindo no mundo (nunca na UI); brilho: interativos, coletáveis e foco da UI; alerta_ui: só erro e vida baixa na UI/HUD, com forma + ícone + texto; nenhuma delas em decoração, roupas ou cenário",
            "vagas_etapa_2": "cor-assinatura do herói, acentos de facção/inimigo, acentos por região e escolas de magia entram na etapa 2 (sobram vagas até 64 + rampas de VFX separadas)"
        },
        "rampas": rampas,
        "validacao": {"erros": erros, "avisos": avisos, "relatorio": rel},
    }
    with open(sys.argv[1], "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print("\n".join(rel))
    print("ERROS:", erros or "nenhum")
    print("AVISOS:", avisos or "nenhum")
    if len(sys.argv) > 2:
        preview(rampas, sys.argv[2])
    sys.exit(1 if erros else 0)
