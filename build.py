#!/usr/bin/env python3
"""Genera una carpeta por lotería (index.html + theme.css) y lotteries.js para la portada.

Para ajustar colores, reglas o agregar una lotería: edita GAMES y corre  python3 build.py
Los logos van en assets/logos/<slug>.png (ver README.txt de esa carpeta).
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).parent
SIGNOS = ["Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo", "Libra",
          "Escorpión", "Sagitario", "Capricornio", "Acuario", "Piscis"]


def nums(label, n, lo, hi, **k):
    """Grupo de números: n valores entre lo y hi. uniq=False permite repetir (dígitos)."""
    return dict(label=label, n=n, min=lo, max=hi, **{"uniq": True, "pad": 2, "sort": True, **k})


# a = color principal del boleto · b = color de acento (bolitas) · ink = texto sobre las bolitas
# Los colores son una aproximación: cámbialos por los hex reales de cada logo.
GAMES = [
    dict(slug="melate", name="Melate", org="Pronósticos", rule="6 de 56",
         sub="Seis números del 1 al 56, sin repetir. Si quieres jugar más, genera de 7 a 10.",
         groups=[nums("Tus números", 6, 1, 56, counts=[6, 7, 8, 9, 10])],
         bg="#1f0612", bg2="#430a25", a="#d6336c", b="#ffd43b", ink="#3a0a1c", font="Bebas Neue",
         deco="repeating-conic-gradient(from 0deg at 50% 0%,rgba(255,212,59,.12) 0 6deg,transparent 6deg 12deg)"),
    dict(slug="revancha", name="Revancha", org="Pronósticos", rule="6 de 56",
         sub="Seis números del 1 al 56, sin repetir.",
         groups=[nums("Tus números", 6, 1, 56)],
         bg="#13081f", bg2="#2c0f48", a="#7a2fd0", b="#ff6fb1", ink="#2a0a3d", font="Anton",
         deco="repeating-linear-gradient(135deg,rgba(255,255,255,.07) 0 14px,transparent 14px 28px)"),
    dict(slug="revanchita", name="Revanchita", org="Pronósticos", rule="6 de 56",
         sub="Seis números del 1 al 56, sin repetir.",
         groups=[nums("Tus números", 6, 1, 56)],
         bg="#04160f", bg2="#0a3224", a="#0e9f6e", b="#c6f432", ink="#06261b", font="Fredoka", w="600",
         deco="radial-gradient(rgba(255,255,255,.18) 2px,transparent 3px) 0 0/26px 26px"),
    dict(slug="melateretro", name="Melate Retro", org="Pronósticos", rule="6 de 39",
         sub="Seis números del 1 al 39, sin repetir. El número adicional lo define el sorteo.",
         groups=[nums("Tus números", 6, 1, 39, counts=[6, 7, 8, 9, 10])],
         bg="#1f0f05", bg2="#40200c", a="#c0611a", b="#ffd166", ink="#3a1a06", font="Righteous",
         deco="repeating-radial-gradient(circle at 50% 115%,rgba(255,209,102,.12) 0 18px,transparent 18px 36px)"),
    dict(slug="chispazo", name="Chispazo", org="Pronósticos", rule="5 de 28",
         sub="Cinco números del 1 al 28, sin repetir.",
         groups=[nums("Tus números", 5, 1, 28)],
         bg="#050d24", bg2="#0c2457", a="#1f6fe0", b="#ffe14d", ink="#0a1f4a", font="Russo One",
         deco="linear-gradient(135deg,rgba(255,255,255,.08) 25%,transparent 25%) -20px 0/40px 40px,"
              "linear-gradient(225deg,rgba(255,255,255,.08) 25%,transparent 25%) -20px 0/40px 40px"),
    dict(slug="tris", name="Tris", org="Pronósticos", rule="Dígitos del 0 al 9",
         sub="De 3 a 5 dígitos del 0 al 9. El orden importa y los dígitos pueden repetirse.",
         groups=[nums("Tu Tris", 5, 0, 9, uniq=False, pad=1, sort=False, counts=[5, 4, 3])],
         bg="#041a1f", bg2="#0a3b46", a="#0e97ab", b="#ffb703", ink="#05303a", font="Lilita One",
         deco="conic-gradient(rgba(255,255,255,.07) 25%,transparent 0 50%,rgba(255,255,255,.07) 0 75%,transparent 0) 0 0/60px 60px"),
    dict(slug="loterianacional", name="Lotería Nacional", org="Lotería Nacional", rule="Signo + 4 dígitos",
         sub="Sorteo Zodiaco: un signo y un número del 0000 al 9999.",
         groups=[dict(label="Signo", values=SIGNOS),
                 nums("Número", 4, 0, 9, uniq=False, pad=1, sort=False, join=True)],
         bg="#1a0407", bg2="#3d0a13", a="#b3162a", b="#f2c14e", ink="#3a0a10", font="Playfair Display", w="800",
         deco="repeating-radial-gradient(circle at 20% 30%,rgba(242,193,78,.12) 0 2px,transparent 2px 14px),"
              "repeating-radial-gradient(circle at 80% 70%,rgba(242,193,78,.12) 0 2px,transparent 2px 14px)"),
    # ---------- Más loterías y sorteos populares ----------
    dict(slug="sorteomayor", name="Sorteo Mayor", org="Lotería Nacional", rule="Número de 5 dígitos",
         sub="Un número del 00000 al 99999, como el de un billete de Lotería Nacional.",
         groups=[nums("Número", 5, 0, 9, uniq=False, pad=1, sort=False, join=True)],
         bg="#031a1a", bg2="#07403f", a="#0b6d6a", b="#f4d35e", ink="#06302f", font="Cinzel", w="800",
         deco="repeating-linear-gradient(45deg,rgba(244,211,94,.10) 0 2px,transparent 2px 22px)"),
    dict(slug="powerball", name="Powerball", org="Estados Unidos", rule="5 de 69 + 1 de 26",
         sub="Cinco números del 1 al 69 y un Powerball del 1 al 26.",
         groups=[nums("Números blancos", 5, 1, 69), nums("Powerball", 1, 1, 26)],
         bg="#1a0206", bg2="#45060f", a="#d7141a", b="#ff8a8a", ink="#3a0508", font="Archivo Black",
         deco="repeating-linear-gradient(90deg,rgba(255,255,255,.06) 0 3px,transparent 3px 26px)"),
    dict(slug="megamillions", name="Mega Millions", org="Estados Unidos", rule="5 de 70 + 1 de 24",
         sub="Cinco números del 1 al 70 y una Mega Ball del 1 al 24.",
         groups=[nums("Números", 5, 1, 70), nums("Mega Ball", 1, 1, 24)],
         bg="#07102e", bg2="#13236b", a="#2740c4", b="#ffd447", ink="#0b1a5c", font="Bungee",
         deco="radial-gradient(rgba(255,212,71,.16) 2px,transparent 3px) 0 0/30px 30px"),
    dict(slug="euromillions", name="EuroMillions", org="Europa", rule="5 de 50 + 2 de 12",
         sub="Cinco números del 1 al 50 y dos estrellas del 1 al 12.",
         groups=[nums("Números", 5, 1, 50), nums("Estrellas", 2, 1, 12)],
         bg="#040f2e", bg2="#0a2468", a="#2457d6", b="#ffd23f", ink="#0a1d4f", font="Poppins", w="800",
         deco="radial-gradient(rgba(255,210,63,.20) 1.5px,transparent 2.5px) 0 0/40px 40px,radial-gradient(rgba(255,255,255,.10) 1px,transparent 2px) 20px 20px/40px 40px"),
    dict(slug="eurojackpot", name="EuroJackpot", org="Europa", rule="5 de 50 + 2 de 12",
         sub="Cinco números del 1 al 50 y dos euronúmeros del 1 al 12.",
         groups=[nums("Números", 5, 1, 50), nums("Euronúmeros", 2, 1, 12)],
         bg="#0b1218", bg2="#1c2b36", a="#3a7ca5", b="#f6d55c", ink="#14232e", font="Orbitron", w="800",
         deco="repeating-linear-gradient(0deg,rgba(255,255,255,.05) 0 1px,transparent 1px 12px)"),
    dict(slug="laprimitiva", name="La Primitiva", org="España", rule="6 de 49 + reintegro",
         sub="Seis números del 1 al 49 y un reintegro del 0 al 9. Si quieres jugar más, genera de 7 a 11.",
         groups=[nums("Números", 6, 1, 49, counts=[6, 7, 8, 9, 10, 11]), nums("Reintegro", 1, 0, 9, pad=1)],
         bg="#08160a", bg2="#173a14", a="#4c9a2a", b="#f7e463", ink="#17340c", font="Alfa Slab One",
         deco="repeating-radial-gradient(circle at 50% 100%,rgba(247,228,99,.12) 0 10px,transparent 10px 24px)"),
    dict(slug="elgordo", name="El Gordo de la Primitiva", org="España", rule="5 de 54 + número clave",
         sub="Cinco números del 1 al 54 y un número clave del 0 al 9.",
         groups=[nums("Números", 5, 1, 54), nums("Número clave", 1, 0, 9, pad=1)],
         bg="#200505", bg2="#4d0c0c", a="#d62828", b="#fcbf49", ink="#3d0a0a", font="Paytone One",
         deco="repeating-conic-gradient(rgba(252,191,73,.10) 0 10deg,transparent 10deg 20deg)"),
    dict(slug="megasena", name="Mega-Sena", org="Brasil", rule="6 de 60",
         sub="Seis números del 1 al 60, sin repetir. Si quieres jugar más, genera de 7 a 10.",
         groups=[nums("Números", 6, 1, 60, counts=[6, 7, 8, 9, 10])],
         bg="#06180f", bg2="#0d3d27", a="#14915e", b="#ffd60a", ink="#073321", font="Fugaz One",
         deco="repeating-linear-gradient(60deg,rgba(255,214,10,.09) 0 12px,transparent 12px 24px)"),
    dict(slug="lotto649", name="Lotto 6/49", org="Canadá", rule="6 de 49",
         sub="Seis números del 1 al 49, sin repetir.",
         groups=[nums("Números", 6, 1, 49)],
         bg="#1c0309", bg2="#470a17", a="#c8102e", b="#ffb3c1", ink="#42050f", font="Oswald", w="700",
         deco="repeating-linear-gradient(135deg,rgba(255,255,255,.06) 0 6px,transparent 6px 20px)"),
    dict(slug="lottomax", name="Lotto Max", org="Canadá", rule="7 de 50",
         sub="Siete números del 1 al 50, sin repetir.",
         groups=[nums("Números", 7, 1, 50)],
         bg="#0e0a2b", bg2="#241a68", a="#4338ca", b="#fde047", ink="#1b1450", font="Teko", w="600",
         deco="repeating-linear-gradient(0deg,rgba(253,224,71,.08) 0 2px,transparent 2px 18px),repeating-linear-gradient(90deg,rgba(253,224,71,.08) 0 2px,transparent 2px 18px)"),
    dict(slug="uklotto", name="UK Lotto", org="Reino Unido", rule="6 de 59",
         sub="Seis números del 1 al 59, sin repetir.",
         groups=[nums("Números", 6, 1, 59)],
         bg="#03112a", bg2="#0a2d63", a="#0050a0", b="#ff7a90", ink="#0a2147", font="Fjalla One",
         deco="repeating-linear-gradient(45deg,rgba(255,122,144,.10) 0 8px,transparent 8px 22px)"),
    dict(slug="superenalotto", name="SuperEnalotto", org="Italia", rule="6 de 90",
         sub="Seis números del 1 al 90, sin repetir.",
         groups=[nums("Números", 6, 1, 90)],
         bg="#04180f", bg2="#0b3d29", a="#0a7a5a", b="#ff6b6b", ink="#052e22", font="Bowlby One",
         deco="repeating-radial-gradient(circle at 0 0,rgba(255,255,255,.07) 0 8px,transparent 8px 24px)"),
    dict(slug="baloto", name="Baloto", org="Colombia", rule="5 de 43 + 1 de 16",
         sub="Cinco números del 1 al 43 y una Súper Balota del 1 al 16.",
         groups=[nums("Números", 5, 1, 43), nums("Súper Balota", 1, 1, 16)],
         bg="#050f26", bg2="#0e2a5c", a="#12356b", b="#fcd116", ink="#0b1b4d", font="Baloo 2", w="800",
         deco="radial-gradient(rgba(252,209,22,.16) 2px,transparent 3px) 0 0/22px 22px"),
]


def page(g):
    cfg = json.dumps(dict(name=g["name"], groups=g["groups"]), ensure_ascii=False)
    return f'''<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="{g["bg"]}">
  <meta name="description" content="Genera combinaciones aleatorias para {g["name"]} ({g["rule"]}). Solo azar, sin predicciones.">
  <title>{g["name"]} · Generador de números aleatorios | Lalos Predictor</title>
  <link rel="icon" type="image/png" href="../assets/logo.png">
  <link rel="apple-touch-icon" href="../assets/logo.png">
  <link rel="stylesheet" href="../assets/lottery.css">
  <link rel="stylesheet" href="theme.css">
  <script>window.LOTTERY={cfg};</script>
  <script src="../assets/lottery.js" defer></script>
</head>
<body>
  <div class="deco" aria-hidden="true"></div>
  <header class="top"><a class="back" href="../#catalogo">← Todas las loterías</a><a class="mark" href="../" aria-label="Lalos Predictor, inicio">LP<b>.</b></a></header>
  <main>
    <img class="logo" data-logo src="../assets/logos/{g["slug"]}.png" alt="{g["name"]}">
    <p class="sub">{g["sub"]}</p>
    <div class="wrap">
      <section class="ticket" aria-label="Generador de {g["name"]}">
        <div class="face">
          <div class="meta"><span>{g["org"]}</span><span>{g["rule"]}</span></div>
          <div id="out" aria-live="polite"></div>
          <p class="cap" id="cap">Presiona «Generar» para sacar tu combinación.</p>
        </div>
        <div class="stub">
          <label class="count" id="countWrap" hidden>Cantidad<select id="count"></select></label>
          <button class="btn" id="gen" type="button">Generar</button>
          <button class="btn ghost" id="copy" type="button">Copiar</button>
        </div>
      </section>
    </div>
    <p class="note">Los números son aleatorios, se generan en tu navegador y no predicen ni mejoran tus probabilidades de ganar. Juega con responsabilidad.</p>
  </main>
</body>
</html>
'''


def theme(g):
    fam = g["font"].replace(" ", "+") + (":wght@" + g["w"] if g.get("w") else "")
    return (f"@import url('https://fonts.googleapis.com/css2?family={fam}&display=swap');\n"
            f":root{{--bg:{g['bg']};--bg2:{g['bg2']};--a:{g['a']};--b:{g['b']};--ink:{g['ink']};"
            f"--font:'{g['font']}',Impact,sans-serif;--deco:{g['deco']}}}\n")


for g in GAMES:
    d = ROOT / g["slug"]
    d.mkdir(exist_ok=True)
    (d / "index.html").write_text(page(g), encoding="utf-8")
    (d / "theme.css").write_text(theme(g), encoding="utf-8")

catalogo = [{k: g[k] for k in ("slug", "name", "org", "rule", "a", "b")} for g in GAMES]
(ROOT / "lotteries.js").write_text("window.LOTTERIES = " + json.dumps(catalogo, ensure_ascii=False, indent=1) + ";\n",
                                   encoding="utf-8")
print(f"{len(GAMES)} loterías generadas")
