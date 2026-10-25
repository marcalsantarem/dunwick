"""Paleta v1 (rascunho) — a partir do protótipo "Vale de Dunwick" (D-024) + direção A.
Rampas explícitas (hex), tabela de luz/grade por hora e validação (contraste, daltonismo, herói x chão).
Uso: python -I -X utf8 gerar_paleta_v1.py <saida.json>
Reaproveita a matemática de cor de gerar_paleta.py (v0.2, mesma pasta).
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gerar_paleta as g

# (nome, uso, reservada, [hex escuro -> claro])
RAMPAS = [
    ("grama", "chão de grama; sombra azul-esverdeada no 1º passo", False, ["#2E5434", "#3F6B2A", "#4F7A30", "#5E8C3A", "#6FA046", "#8DBA5A"]),
    ("copa_pinheiro", "pinheiros e folhagem escura", False, ["#1C3622", "#24452A", "#2E5434", "#386440", "#4E8458"]),
    ("terra", "estradas, trilhas, barro", False, ["#5A4030", "#6E5235", "#8A6B45", "#A3845A", "#BFA079"]),
    ("pedra", "pedra, calçamento da praça, muros", False, ["#5A5750", "#7D786E", "#9A958A", "#B3AEA2", "#CFCBC0"]),
    ("madeira", "vigas do enxaimel, cercas, portas, caixotes", False, ["#3A2418", "#4A2E1A", "#6B4428", "#855632", "#A8703F"]),
    ("reboco", "parede de reboco entre as vigas", False, ["#B8A886", "#D6C7A6", "#E8DCC0", "#F4EEDC"]),
    ("ardosia", "telhado de ardósia azul", False, ["#2E3A52", "#3A4762", "#4A5A78", "#5C6E8F", "#7A8CAD"]),
    ("telha", "telhado de telha laranja, chaminés de tijolo", False, ["#7A3A20", "#9E4B2A", "#C2643A", "#D97A48", "#EC9A66"]),
    ("rubi", "bandeiras, botões primários da UI, barra de vida", False, ["#3A0E10", "#541717", "#7A2424", "#A8262B", "#C93A3A", "#E8574A"]),
    ("ouro", "molduras da UI, fivelas, detalhes metálicos quentes", False, ["#5A3A10", "#8A6A2A", "#C9A24A", "#E8C877", "#FFE9A0"]),
    ("aco", "lâminas, armaduras, ferragens", False, ["#3A3E46", "#69717B", "#A9B1BA", "#C9CFD7", "#E6EAEE"]),
    ("couro", "couro, correias, botas", False, ["#3E2615", "#5A3A22", "#7A5232", "#9A6A3E"]),
    ("linho", "linho, pergaminho, texto da UI, faixa do Edric", False, ["#A89878", "#D8CCAE", "#F2E6C8", "#FFF8E8"]),
    ("pele_clara", "pele (tom claro)", False, ["#8E5A3E", "#C48A64", "#E9B98F", "#F6D2AE"]),
    ("pele_media", "pele (tom médio)", False, ["#6A3E28", "#9A6244", "#C78C62", "#E2B088"]),
    ("pele_escura", "pele (tom escuro)", False, ["#3E2218", "#6A4030", "#8E5E44", "#B07C5C"]),
    ("cabelo", "cabelos castanhos a escuros", False, ["#2A1A10", "#4A2E1A", "#7A5232", "#A8703F"]),
    ("musgo_edric", "gibão do Edric (verde-musgo azulado; escuro de propósito para separar da grama)", False, ["#14302C", "#1E3E3A", "#2C524C", "#467466"]),
    ("sombra_a", "tinta de sombra da direção A (azul-esverdeada); nunca preto", False, ["#12242A", "#1E3A3E", "#2E4A44", "#3E5E58"]),
    ("luz_fogo", "tochas, lanternas, forja, janelas acesas, brasas", False, ["#B83A14", "#E8641E", "#FF9A3A", "#FFD27A", "#FFF2C8"]),
    ("sino_aqua", "RESERVADA: Sino de Cobre, marca do Edric, rito da Bênção (azul-esverdeado)", True, ["#1E5A5A", "#3A9A92", "#7AD8C8", "#C8F5EA"]),
    ("ui_madeira", "fundo e bordas internas dos painéis de UI", False, ["#1E140C", "#2A1E14", "#3A2818", "#5A4028", "#7A5A3A"]),
    ("perigo", "RESERVADA: golpe vindo no mundo (telegraph, zona de dano); nunca na UI", True, ["#6D2073", "#DD48D6", "#FF65E0", "#FED8EC"]),
    ("brilho", "RESERVADA: interativos, coletáveis, foco da UI", True, ["#FCD176", "#FFE79D", "#FFFAD8"]),
    ("alerta_ui", "RESERVADA: só UI/HUD (erro, vida baixa), sempre com ícone + texto", True, ["#780105", "#F44D21"]),
]

# luz e grade por hora (multiplicação sobre a cena; sombra de projeção; névoa; luzes artificiais)
HORAS = [
    # id, nome, grade, sombra, nevoa_cor, nevoa_dens, sombra_comprimento, luzes_artificiais, particulas
    ("manha", "manhã (orvalho)", "#FFE8CC", "rgba(24,40,44,0.36)", "#DDE8E0", 0.10, 1.4, 0.0, "orvalho, pólen"),
    ("dia", "dia (C)", "#FFFFFF", "rgba(20,30,10,0.35)", "#E6EEF0", 0.05, 0.8, 0.0, "pétalas, borboletas"),
    ("tarde", "fim de tarde (A, hora-base)", "#FFC892", "rgba(18,46,48,0.42)", "#F2D3A0", 0.14, 1.6, 0.35, "poeira dourada, folhas"),
    ("crepusculo", "crepúsculo", "#E0A890", "rgba(24,36,60,0.46)", "#B8A8C8", 0.16, 1.8, 0.80, "vaga-lumes, brasas"),
    ("noite", "noite (B)", "#5F6B98", "rgba(10,14,34,0.50)", "#6A78A8", 0.12, 0.5, 1.00, "vaga-lumes, brasas, fumaça"),
]
# protótipo (referência): multiply = mistura(branco, #FFB880, dusk*0.6) -> mistura(.., #46507E, night*0.85); no auge da noite:
PROTO_NOITE = "#" + "".join(f"{round(255 + (v - 255) * 0.85):02x}" for v in (0x46, 0x50, 0x7E))


def L(h):
    return g.lrgb_to_oklab(*g.hex_lrgb(h))[0]


def lab(h, m=None):
    return g.lrgb_to_oklab(*g.hex_lrgb(h)) if m is None else g.simula(h, m)


def de_min(a, b):
    """menor distância OKLab entre dois hex nos 4 modos de visão"""
    return min(g.de(lab(a, m), lab(b, m)) for m in [None] + list(g.MACHADO.values()))


def main(saida):
    erros, avisos, rel = [], [], []
    ids, hexes = [], []
    rampas = []
    for nome, uso, res, cores in RAMPAS:
        Ls = [L(c) for c in cores]
        if any(b <= a for a, b in zip(Ls, Ls[1:])):
            erros.append(f"rampa {nome} não é crescente em luminosidade")
        item = []
        for i, c in enumerate(cores):
            item.append({"id": f"{nome}_{i+1}", "hex": c})
            ids.append(f"{nome}_{i+1}")
            hexes.append(c)
        rampas.append({"nome": nome, "uso": uso, "reservada": res, "cores": item})
    if len(set(ids)) != len(ids):
        erros.append("IDs repetidos")
    by = {c["id"]: c["hex"] for r in rampas for c in r["cores"]}
    rel.append(f"Total: {len(ids)} cores em {len(rampas)} rampas")

    # contraste da UI sobre o painel (média do degradê do protótipo: rgba(58,40,24) -> rgba(32,22,14))
    painel = "#2A1E14"
    for nome, hexc, minimo in (("texto (linho_3)", by["linho_3"], 7.0), ("texto secundário (linho_2)", by["linho_2"], 4.5),
                               ("borda (ouro_3)", by["ouro_3"], 3.0), ("destaque (ouro_5)", by["ouro_5"], 7.0)):
        k = g.contraste(hexc, painel)
        rel.append(f"Contraste {nome} x painel {painel}: {k:.2f}:1 (mín {minimo})")
        if k < minimo:
            erros.append(f"contraste {nome} {k:.2f} < {minimo}")
    k = g.contraste(by["alerta_ui_2"], painel)
    rel.append(f"Contraste alerta_ui_2 x painel: {k:.2f}:1 (mín 4.5)")
    if k < 4.5:
        erros.append("contraste alerta_ui_2 baixo")

    # chão do mundo (onde o telegraph e o brilho precisam saltar)
    chao = [f"grama_{i}" for i in (2, 3, 4, 5, 6)] + [f"terra_{i}" for i in (2, 3, 4)] + [f"pedra_{i}" for i in (2, 3, 4)]
    for rampa, ids_r, minimo in (("perigo (enchimento perigo_2)", ["perigo_2"], 0.10), ("perigo (realce perigo_3, informativo)", ["perigo_3"], 0.0), ("brilho", ["brilho_1", "brilho_2"], 0.10)):
        pior = min(((de_min(by[p], by[c]), p, c) for p in ids_r for c in chao))
        rel.append(f"Pior ΔE {rampa} x chão (4 modos de visão): {pior[0]:.3f} em {pior[1]} x {pior[2]} (mín {minimo})")
        if pior[0] < minimo:
            avisos.append(f"{rampa} pouco distinto do chão: {pior[1]} x {pior[2]} ({pior[0]:.3f}); compensar com forma + contorno + animação")
    # perigo x outros vermelhos/rosas do cenário
    outros = ["rubi_4", "rubi_5"]
    pior = min(((de_min(by[p], by[c]), p, c) for p in ("perigo_2", "perigo_3") for c in outros))
    rel.append(f"Pior ΔE perigo x vermelhos/laranjas do cenário: {pior[0]:.3f} em {pior[1]} x {pior[2]} (mín 0.10)")
    if pior[0] < 0.10:
        avisos.append(f"perigo parecido com {pior[2]}: {pior[0]:.3f}")
    # perigo x brilho x alerta
    pares = [("perigo_3", "brilho_1"), ("alerta_ui_2", "perigo_2"), ("alerta_ui_2", "brilho_1"), ("alerta_ui_2", "rubi_4")]
    for a, b in pares:
        d = de_min(by[a], by[b])
        rel.append(f"ΔE {a} x {b}: {d:.3f}")
        if d < 0.10:
            avisos.append(f"{a} x {b} = {d:.3f} (<0.10); compensar com forma/ícone/texto")

    # herói (gibão) x chão: diferença de valor (L) e de cor
    tipico = ["grama_3", "grama_4", "grama_5", "terra_3", "terra_4", "pedra_3", "pedra_4"]
    for gib in ("musgo_edric_2", "musgo_edric_3"):
        piorL = min(abs(L(by[gib]) - L(by[c])) for c in tipico)
        piorE = min(de_min(by[gib], by[c]) for c in tipico)
        rel.append(f"{gib} x chão: ΔL mín {piorL:.3f} · ΔE mín (4 modos) {piorE:.3f}")
        if piorL < 0.12 and gib.endswith("_2"):
            avisos.append(f"{gib} tem pouco contraste de valor contra o chão (ΔL {piorL:.3f}); precisa de rim light e contorno")

    # grade por hora
    horas = []
    lum_proto = g.lum(PROTO_NOITE)
    for hid, nome, grade, sombra, nev, dens, comp, luzes, part in HORAS:
        horas.append({"id": hid, "nome": nome, "grade_multiply": grade, "sombra_projetada": sombra, "nevoa_cor": nev,
                      "nevoa_densidade": dens, "sombra_comprimento": comp, "luzes_artificiais": luzes, "particulas": part})
    noite = g.lum(HORAS[-1][2])
    rel.append(f"Luminância do grade de noite: {noite:.3f} (protótipo no auge da noite: {lum_proto:.3f}; mín = protótipo)")
    if noite < lum_proto - 1e-4:
        erros.append("noite mais escura que a do protótipo")
    for hid, nome, grade, *_ in HORAS:
        rel.append(f"Grade {hid}: {grade} (luminância {g.lum(grade):.3f})")

    doc = {
        "id": "paleta_v1",
        "versao": "1.0.0-rascunho",
        "status": "provisoria",
        "aviso": "Rascunho da direção D-024 (visual do protótipo + direção A). Dados para 04/07/08; vale até a etapa 2 (roteiro de cor por região). Substitui a paleta neutra v0.2 de 64 cores (pixel art).",
        "base": "cores de partida lidas do protótipo (referencia/prototipo/index.html, objeto PAL e funções de desenho) + sombra azul-esverdeada, luz de lanterna e sino da direção A",
        "regras": {
            "sombreamento": "3–4 passos por material nos personagens (bordas suaves por supersampling); cenário pode ter gradiente sutil",
            "contorno": "tom escuro da própria rampa do material, translúcido (rgba(42,30,20,0.7) como base); nunca preto puro",
            "sombra": "azul-esverdeada (sombra_a) na direção A; nunca preto puro nem cinza neutro",
            "reservadas": "perigo: só golpe vindo no mundo (nunca na UI); brilho: interativos, coletáveis e foco da UI; alerta_ui: só erro e vida baixa na UI/HUD com ícone + texto; sino_aqua: só sino, marca do Edric e a Bênção",
            "telegraph": "emissivo: não escurece com o grade nem recebe névoa; desenhado acima do chão e abaixo dos personagens",
        },
        "rampas": rampas,
        "luz_por_hora": horas,
        "validacao": {"erros": erros, "avisos": avisos, "relatorio": rel},
    }
    with open(saida, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print("\n".join(rel))
    print("ERROS:", erros or "nenhum")
    print("AVISOS:", avisos or "nenhum")
    return 1 if erros else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
