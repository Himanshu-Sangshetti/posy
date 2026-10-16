"""Builds the README images in .github/assets/ from the landing art and look screenshots.

Usage: python3 .github/assets/make-art.py
Needs Pillow, the Cloud repo next to this one (or POSY_CLOUD=/path/to/posy-cloud), and
Instrument Serif + Geist + Geist Mono TTFs in POSY_FONTS (default .scratch/readme/fonts).
"""

import os
import random
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / ".github" / "assets"
CLOUD = Path(os.environ.get("POSY_CLOUD", ROOT.parent / "posy-cloud-agents"))
ART = CLOUD / "public" / "landing" / "art"
SHOTS = CLOUD / "public" / "landing" / "shots"
FONTS = Path(os.environ.get("POSY_FONTS", ROOT / ".scratch" / "readme" / "fonts"))
BRAND = ROOT / "public" / "brand"

PAPER = (246, 241, 233)
CREAM = (252, 242, 228)
INK = (22, 20, 15)
TEXT = (43, 38, 33)
MUTED = (140, 130, 119)
LINE = (233, 225, 213)
ORANGE = (228, 87, 46)

LOOKS = [
    ("desk", "Desk", "cozy", "free", "A wooden desk with polaroids, a record and letters."),
    ("washi", "Washi", "washi", "pro", "A Japanese print: rice paper, ink and a red seal."),
    ("lofi", "Lofi", "lofi", "pro", "A desktop left open. Every tile is a window."),
    ("painted", "Painted", "painted", "pro", "Watercolour paper, letters and wax seals."),
    ("cobalt", "Cobalt", "cobalt", "free", "A vintage print in two inks, under a crescent moon."),
    ("night", "Night", "night", "pro", "A netrunner's screen with one signal colour."),
]


def font(name, size):
    return ImageFont.truetype(str(FONTS / f"{name}.ttf"), size)


def rounded_mask(size, radius, scale=4):
    w, h = size
    m = Image.new("L", (w * scale, h * scale), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, w * scale - 1, h * scale - 1), radius * scale, fill=255)
    return m.resize(size, Image.LANCZOS)


def round_corners(im, radius):
    im = im.convert("RGBA")
    im.putalpha(ImageChops.multiply(im.getchannel("A"), rounded_mask(im.size, radius)))
    return im


def shadow(canvas, box, radius, blur, offset=(0, 10), opacity=70, color=(60, 40, 20)):
    x0, y0, x1, y1 = box
    pad = blur * 3
    layer = Image.new("RGBA", (x1 - x0 + pad * 2, y1 - y0 + pad * 2), (0, 0, 0, 0))
    ImageDraw.Draw(layer).rounded_rectangle((pad, pad, pad + x1 - x0, pad + y1 - y0), radius, fill=color + (opacity,))
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    canvas.alpha_composite(layer, (x0 - pad + offset[0], y0 - pad + offset[1]))


def soft_text(canvas, xy, text, fnt, fill=(255, 255, 255), blur=10, opacity=110, anchor="la"):
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).text((xy[0], xy[1] + 3), text, font=fnt, fill=(20, 40, 80, opacity), anchor=anchor)
    canvas.alpha_composite(layer.filter(ImageFilter.GaussianBlur(blur)))
    ImageDraw.Draw(canvas).text(xy, text, font=fnt, fill=fill, anchor=anchor)


def paper(size, base, grain=6):
    im = Image.new("RGB", size, base)
    noise = Image.effect_noise((size[0] // 2, size[1] // 2), 24).resize(size, Image.BICUBIC)
    noise = ImageEnhance.Contrast(noise).enhance(0.35)
    im = Image.blend(im, Image.merge("RGB", [noise] * 3), grain / 100)
    return Image.blend(im, Image.new("RGB", size, base), 0.55).convert("RGBA")


def load(path):
    return Image.open(path).convert("RGBA")


def petals(canvas, n, seed, area, scale=(0.35, 0.6)):
    rnd = random.Random(seed)
    files = sorted(ART.glob("petal-*.webp"))
    x0, y0, x1, y1 = area
    for _ in range(n):
        p = load(rnd.choice(files))
        s = rnd.uniform(*scale)
        p = p.resize((max(1, int(p.width * s)), max(1, int(p.height * s))), Image.LANCZOS)
        p = p.rotate(rnd.uniform(0, 360), expand=True, resample=Image.BICUBIC)
        canvas.alpha_composite(p, (rnd.randint(x0, x1), rnd.randint(y0, y1)))


def save(im, name, **kw):
    path = OUT / name
    if name.endswith(".webp"):
        im.save(path, "WEBP", quality=kw.get("quality", 84), method=6)
    elif name.endswith(".jpg"):
        im.convert("RGB").save(path, "JPEG", quality=kw.get("quality", 86), optimize=True, progressive=True)
    else:
        im.save(path, "PNG", optimize=True)
    print(f"{name:28s} {im.size[0]}x{im.size[1]}  {path.stat().st_size / 1024:.0f} KB")


# ── Hero ────────────────────────────────────────────────────────────────────


def hero():
    W, H = 1600, 640
    sky = load(ART / "sky.webp")
    s = W / sky.width * 1.06
    sky = sky.resize((int(sky.width * s), int(sky.height * s)), Image.LANCZOS)
    canvas = sky.crop((40, 150, 40 + W, 150 + H))

    shade = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(shade)
    for x in range(W):
        d.line((x, 0, x, H), fill=int(max(0, 70 * (1 - x / 900))))
    canvas = Image.composite(Image.new("RGBA", (W, H), (18, 44, 96, 255)), canvas, shade)

    petals(canvas, 5, 7, (600, 40, 800, 470))
    petals(canvas, 4, 9, (420, 20, 760, 100))

    kite = load(ART / "kite.webp").rotate(-12, expand=True, resample=Image.BICUBIC)
    kite = kite.resize((int(kite.width * 0.78), int(kite.height * 0.78)), Image.LANCZOS)
    canvas.alpha_composite(kite, (842, 44))

    island = load(ART / "island.webp")
    ih = 520
    island = island.resize((int(island.width * ih / island.height), ih), Image.LANCZOS)
    canvas.alpha_composite(island, (W - island.width + 30, 70))

    cat = load(BRAND / "posy-cat-512.png").resize((150, 150), Image.LANCZOS)
    canvas.alpha_composite(cat, (96, 172))

    soft_text(canvas, (268, 132), "posy", font("InstrumentSerif-Regular", 200), blur=14)
    soft_text(canvas, (100, 368), "A link in bio that looks like", font("InstrumentSerif-Italic", 58), blur=10)
    soft_text(canvas, (100, 430), "you made it by hand.", font("InstrumentSerif-Italic", 58), blur=10)
    soft_text(
        canvas,
        (102, 528),
        "Six hand-made looks  ·  Open source  ·  Ready for your AI",
        font("Geist-Medium", 25),
        fill=(252, 242, 228),
        blur=8,
        opacity=140,
    )
    save(round_corners(canvas, 28), "hero.webp", quality=86)


# ── Devices ─────────────────────────────────────────────────────────────────


def browser(shot, width, dark=False, url="posy.page/mira"):
    bar = 34
    s = shot.resize((width, int(shot.height * width / shot.width)), Image.LANCZOS)
    frame = Image.new("RGBA", (width, s.height + bar), (40, 37, 33, 255) if dark else (255, 252, 247, 255))
    d = ImageDraw.Draw(frame)
    for i, c in enumerate([(255, 95, 87), (254, 188, 46), (40, 200, 64)]):
        d.ellipse((16 + i * 20, bar // 2 - 6, 28 + i * 20, bar // 2 + 6), fill=c)
    pw = 220
    px = (width - pw) // 2
    d.rounded_rectangle((px, 7, px + pw, bar - 7), 10, fill=(58, 54, 49) if dark else (240, 233, 222))
    d.text((width // 2, bar // 2), url, font=font("GeistMono-Regular", 14), fill=(190, 180, 168) if dark else MUTED, anchor="mm")
    frame.alpha_composite(s, (0, bar))
    return round_corners(frame, 14)


def phone(shot, width):
    bezel = 9
    s = shot.resize((width - bezel * 2, int(shot.height * (width - bezel * 2) / shot.width)), Image.LANCZOS)
    s = round_corners(s, 26)
    frame = Image.new("RGBA", (width, s.height + bezel * 2), (0, 0, 0, 0))
    ImageDraw.Draw(frame).rounded_rectangle((0, 0, width - 1, frame.height - 1), 34, fill=INK + (255,))
    frame.alpha_composite(s, (bezel, bezel))
    ImageDraw.Draw(frame).rounded_rectangle((width // 2 - 30, bezel + 8, width // 2 + 30, bezel + 22), 7, fill=INK + (255,))
    return frame


# ── Look cards ──────────────────────────────────────────────────────────────


def look_card(key, label, style_id, tier, line, dark):
    W, H = 960, 760
    bg = (30, 28, 24) if dark else CREAM
    canvas = paper((W, H), bg, grain=4 if dark else 7)
    desk = load(SHOTS / f"{key}-desktop.webp")
    ph = load(SHOTS / f"{key}-phone.webp")

    b = browser(desk, 730, dark)
    bx, by = 44, 44
    shadow(canvas, (bx, by, bx + b.width, by + b.height), 14, 18, (0, 14), 120 if dark else 60, (0, 0, 0) if dark else (90, 60, 30))
    canvas.alpha_composite(b, (bx, by))

    p = phone(ph, 218)
    p = p.crop((0, 0, p.width, 430))
    p = round_corners(p, 34)
    px, py = W - p.width - 40, by + b.height + 24 - p.height
    shadow(canvas, (px, py, px + p.width, py + p.height), 34, 20, (0, 16), 150 if dark else 80, (0, 0, 0) if dark else (90, 60, 30))
    canvas.alpha_composite(p, (px, py))

    d = ImageDraw.Draw(canvas)
    title_c = CREAM if dark else INK
    sub_c = (176, 166, 154) if dark else MUTED
    ty = 640
    d.text((48, ty), label, font=font("InstrumentSerif-Regular", 76), fill=title_c, anchor="ls")
    tw = d.textlength(label, font=font("InstrumentSerif-Regular", 76))
    pill = "free" if tier == "free" else "pro"
    pf = font("Geist-Medium", 19)
    pw = d.textlength(pill, font=pf) + 30
    pxl = 48 + tw + 22
    if tier == "free":
        d.rounded_rectangle((pxl, ty - 40, pxl + pw, ty - 8), 16, fill=(220, 239, 226) if not dark else (44, 70, 52))
        d.text((pxl + pw / 2, ty - 24), pill, font=pf, fill=(46, 110, 66) if not dark else (180, 230, 196), anchor="mm")
    else:
        d.rounded_rectangle((pxl, ty - 40, pxl + pw, ty - 8), 16, fill=(251, 226, 210) if not dark else (90, 48, 32))
        d.text((pxl + pw / 2, ty - 24), pill, font=pf, fill=(180, 70, 36) if not dark else (255, 200, 170), anchor="mm")
    mf = font("GeistMono-Regular", 22)
    d.text((W - 48, ty - 12), f'style: "{style_id}"', font=mf, fill=sub_c, anchor="rs")
    d.text((50, ty + 66), line, font=font("Geist-Regular", 31), fill=TEXT if not dark else (226, 216, 202), anchor="ls")
    canvas = round_corners(canvas, 30)
    save(canvas, f"look-{key}{'-dark' if dark else ''}.webp", quality=82)


# ── Tour (animated) ─────────────────────────────────────────────────────────


def tour(dark=False):
    W, H = 1000, 660
    suffix = "-dark" if dark else ""
    frames, durations = [], []
    stills = []
    for key, label, style_id, tier, line in LOOKS:
        c = paper((W, H), (30, 28, 24) if dark else PAPER, grain=4 if dark else 6)
        b = browser(load(SHOTS / f"{key}-desktop.webp"), 800, dark)
        bx, by = (W - b.width) // 2, 30
        shadow(c, (bx, by, bx + b.width, by + b.height), 14, 18, (0, 14), 130 if dark else 60, (0, 0, 0) if dark else (60, 40, 20))
        c.alpha_composite(b, (bx, by))
        d = ImageDraw.Draw(c)
        d.text((bx + 4, H - 40), label, font=font("InstrumentSerif-Regular", 50), fill=CREAM if dark else INK, anchor="ls")
        lw = d.textlength(label, font=font("InstrumentSerif-Regular", 50))
        d.text((bx + lw + 20, H - 44), line, font=font("Geist-Regular", 22), fill=(176, 166, 154) if dark else MUTED, anchor="ls")
        dots_x = bx + b.width - 6 * 22
        for i in range(6):
            col = ORANGE if LOOKS[i][0] == key else ((74, 68, 60) if dark else (214, 203, 187))
            d.ellipse((dots_x + i * 22, H - 60, dots_x + i * 22 + 11, H - 49), fill=col)
        stills.append(round_corners(c, 24))
    for i, s in enumerate(stills):
        frames.append(s)
        durations.append(2400)
        nxt = stills[(i + 1) % len(stills)]
        for t in (0.25, 0.5, 0.75):
            frames.append(Image.blend(s, nxt, t))
            durations.append(70)
    path = OUT / f"looks-tour{suffix}.webp"
    frames[0].save(path, "WEBP", save_all=True, append_images=frames[1:], duration=durations, loop=0, quality=70, method=6)
    print(f"{path.name:28s} {W}x{H}  {path.stat().st_size / 1024:.0f} KB ({len(frames)} frames)")


# ── Feature icons ───────────────────────────────────────────────────────────


def icon(name, art, tint, scale, offset=(0, 0)):
    S = 240
    c = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(c).ellipse((8, 8, S - 8, S - 8), fill=tint + (255,))
    a = load(art)
    k = scale * (S - 40) / max(a.size)
    a = a.resize((int(a.width * k), int(a.height * k)), Image.LANCZOS)
    c.alpha_composite(a, ((S - a.width) // 2 + offset[0], (S - a.height) // 2 + offset[1]))
    mask = Image.new("L", (S * 4, S * 4), 0)
    ImageDraw.Draw(mask).ellipse((32, 32, S * 4 - 32, S * 4 - 32), fill=255)
    c.putalpha(ImageChops.multiply(c.getchannel("A"), mask.resize((S, S), Image.LANCZOS)))
    save(c, f"icon-{name}.png")


def icons():
    icon("looks", ART / "isl-bouquet.webp", (248, 219, 227), 1.0, (0, 6))
    icon("agents", ART / "kite.webp", (217, 233, 246), 0.92, (6, 0))
    icon("yours", ART / "island-sm.webp", (249, 238, 197), 1.08, (0, 14))


# ── Footer ──────────────────────────────────────────────────────────────────


def footer():
    W, H = 1600, 300
    m = load(ART / "footer.webp")
    m = m.resize((W, int(m.height * W / m.width)), Image.LANCZOS)
    canvas = m.crop((0, m.height - H - 140, W, m.height - 140))
    fade = Image.new("L", (W, H), 255)
    d = ImageDraw.Draw(fade)
    for y in range(140):
        d.line((0, y, W, y), fill=int(255 * (y / 140) ** 1.6))
    canvas.putalpha(fade)
    petals(canvas, 8, 21, (100, 10, W - 120, 120), (0.3, 0.5))
    canvas = round_corners(canvas, 28)
    save(canvas, "footer.webp", quality=80)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    hero()
    for look in LOOKS:
        look_card(*look, dark=False)
        look_card(*look, dark=True)
    icons()
    tour()
    tour(dark=True)
    footer()
