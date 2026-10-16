"""Builds the README images in .github/assets/ from the landing art and look screenshots.

Usage: python3 .github/assets/make-art.py
Needs Pillow, the Cloud repo next to this one (or POSY_CLOUD=/path/to/posy-cloud), and
Instrument Serif + Geist + Geist Mono TTFs in POSY_FONTS (default .scratch/readme/fonts).
"""

import math
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
        "Pick a look, add your links, publish.",
        font("Geist-Medium", 34),
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
    tier_pill(d, 48 + tw + 22, ty - 24, tier, dark)
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


# ── Shared bits ─────────────────────────────────────────────────────────────


def tier_pill(d, x, cy, tier, dark, size=19):
    pf = font("Geist-Medium", size)
    pw = d.textlength(tier, font=pf) + size * 1.6
    h = size * 1.7
    if tier == "free":
        bg, fg = ((44, 70, 52), (180, 230, 196)) if dark else ((220, 239, 226), (46, 110, 66))
    else:
        bg, fg = ((90, 48, 32), (255, 200, 170)) if dark else ((251, 226, 210), (180, 70, 36))
    d.rounded_rectangle((x, cy - h / 2, x + pw, cy + h / 2), h / 2, fill=bg)
    d.text((x + pw / 2, cy), tier, font=pf, fill=fg, anchor="mm")


def wrap(d, text, fnt, width):
    lines, line = [], ""
    for word in text.split():
        trial = f"{line} {word}".strip()
        if d.textlength(trial, font=fnt) <= width:
            line = trial
        else:
            lines.append(line)
            line = word
    return lines + [line]


def disc(art, tint, size, scale, offset=(0, 0)):
    c = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(c).ellipse((0, 0, size - 1, size - 1), fill=tint + (255,))
    a = load(art)
    k = scale * size * 0.82 / max(a.size)
    a = a.resize((int(a.width * k), int(a.height * k)), Image.LANCZOS)
    c.alpha_composite(a, ((size - a.width) // 2 + offset[0], (size - a.height) // 2 + offset[1]))
    mask = Image.new("L", (size * 4, size * 4), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size * 4 - 1, size * 4 - 1), fill=255)
    c.putalpha(ImageChops.multiply(c.getchannel("A"), mask.resize((size, size), Image.LANCZOS)))
    return c


def palette(dark):
    return {
        "bg": (30, 28, 24) if dark else CREAM,
        "card": (40, 37, 32) if dark else (255, 252, 247),
        "title": CREAM if dark else INK,
        "body": (226, 216, 202) if dark else TEXT,
        "muted": (176, 166, 154) if dark else MUTED,
        "line": (64, 59, 52) if dark else LINE,
        "shadow": ((0, 0, 0), 130) if dark else ((90, 60, 30), 60),
    }


def suffix(dark):
    return "-dark" if dark else ""


# ── Phone gallery ───────────────────────────────────────────────────────────


def phone_card(key, label, style_id, tier, line, dark):
    P = palette(dark)
    W, H = 600, 1060
    canvas = paper((W, H), P["bg"], grain=4 if dark else 7)
    p = phone(load(SHOTS / f"{key}-phone.webp"), 380)
    p = round_corners(p.crop((0, 0, p.width, 770)), 34)
    px, py = (W - p.width) // 2, 46
    shadow(canvas, (px, py, px + p.width, py + p.height), 34, 22, (0, 18), P["shadow"][1] + 30, P["shadow"][0])
    canvas.alpha_composite(p, (px, py))
    d = ImageDraw.Draw(canvas)
    tf = font("InstrumentSerif-Regular", 74)
    ty = 900
    d.text((44, ty), label, font=tf, fill=P["title"], anchor="ls")
    tier_pill(d, 44 + d.textlength(label, font=tf) + 18, ty - 24, tier, dark, 21)
    d.text((W - 44, ty - 12), style_id, font=font("GeistMono-Regular", 22), fill=P["muted"], anchor="rs")
    bf = font("Geist-Regular", 28)
    for i, ln in enumerate(wrap(d, line, bf, W - 88)[:2]):
        d.text((44, ty + 56 + i * 40), ln, font=bf, fill=P["body"], anchor="ls")
    save(round_corners(canvas, 30), f"phone-{key}{suffix(dark)}.webp", quality=80)


# ── How it works ────────────────────────────────────────────────────────────

STEPS = [
    ("Pick a look", "A desk, a Japanese print, a watercolour, a night screen and more.", "isl-bouquet.webp", (248, 219, 227), 1.0, (0, 8)),
    ("Add your links", "Paste any link. Posy turns it into the right tile.", "kite.webp", (217, 233, 246), 0.9, (8, 0)),
    ("Publish", "Your page is live at posy.page/you. Or ask your AI to do all three.", "island-sm.webp", (249, 238, 197), 1.1, (0, 16)),
]


def how(dark):
    P = palette(dark)
    W, H = 1800, 600
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    cw, gap = 548, 48
    for i, (title, text, art, tint, scale, off) in enumerate(STEPS):
        x = i * (cw + gap) + 3
        box = (x, 20, x + cw, H - 40)
        shadow(canvas, box, 30, 16, (0, 10), P["shadow"][1] - 10, P["shadow"][0])
        card = paper((cw, H - 60), P["bg"], grain=4 if dark else 7)
        d = ImageDraw.Draw(card)
        card.alpha_composite(disc(ART / art, tint, 200, scale, off), (44, 44))
        d.text((cw - 48, 120), str(i + 1), font=font("InstrumentSerif-Italic", 120), fill=ORANGE, anchor="rs")
        d.text((44, 350), title, font=font("InstrumentSerif-Regular", 68), fill=P["title"], anchor="ls")
        bf = font("Geist-Regular", 29)
        for j, ln in enumerate(wrap(d, text, bf, cw - 88)):
            d.text((44, 412 + j * 42), ln, font=bf, fill=P["body"], anchor="ls")
        canvas.alpha_composite(round_corners(card, 30), (x, 20))
    save(canvas, f"how{suffix(dark)}.webp", quality=84)


# ── Page file to page ───────────────────────────────────────────────────────

BRIEF = [
    ("{", None),
    ('  "posy": 1,', None),
    ('  "name": "Mira Sol",', None),
    ('  "bio": "Writer and editor.",', None),
    ('  "location": "Lisbon",', None),
    ('  "look": "washi",', None),
    ('  "links": [', None),
    ('    "https://substack.com/@mira",', None),
    ('    "https://x.com/mira",', None),
    ('    "hi@mira.so",', None),
    ('    { "heading": "Writing" },', None),
    ('    "https://mira.so/letters"', None),
    ("  ]", None),
    ("}", None),
]


def code_line(d, x, y, text, fnt):
    key_c, str_c, num_c, pun_c = (227, 155, 111), (176, 214, 168), (249, 238, 197), (150, 140, 128)
    i = 0
    while i < len(text):
        ch = text[i]
        if ch == '"':
            j = text.index('"', i + 1) + 1
            tok = text[i:j]
            is_key = text[j:j + 1] == ":"
            col = key_c if is_key else str_c
        elif ch.isdigit():
            j = i
            while j < len(text) and text[j].isdigit():
                j += 1
            tok, col = text[i:j], num_c
        else:
            j = i + 1
            tok, col = ch, pun_c
        d.text((x, y), tok, font=fnt, fill=col, anchor="ls")
        x += d.textlength(tok, font=fnt)
        i = j


def page_file(dark):
    P = palette(dark)
    W, H = 1800, 980
    canvas = paper((W, H), P["bg"], grain=4 if dark else 7)
    cx, cy, cw, ch = 64, 70, 900, 840
    shadow(canvas, (cx, cy, cx + cw, cy + ch), 24, 20, (0, 16), P["shadow"][1] + 20, P["shadow"][0])
    code = Image.new("RGBA", (cw, ch), (29, 27, 23, 255))
    d = ImageDraw.Draw(code)
    d.rectangle((0, 0, cw, 64), fill=(38, 35, 30))
    for i, c in enumerate([(255, 95, 87), (254, 188, 46), (40, 200, 64)]):
        d.ellipse((26 + i * 26, 25, 40 + i * 26, 39), fill=c)
    d.text((cw // 2, 33), "mira.json", font=font("GeistMono-Regular", 24), fill=(170, 160, 148), anchor="mm")
    mf = font("GeistMono-Regular", 31)
    for n, (ln, _) in enumerate(BRIEF):
        y = 128 + n * 49
        d.text((40, y), f"{n + 1:>2}", font=mf, fill=(84, 78, 70), anchor="ls")
        code_line(d, 110, y, ln, mf)
    canvas.alpha_composite(round_corners(code, 24), (cx, cy))

    ph = phone(load(SHOTS / "washi-phone.webp"), 400)
    ph = round_corners(ph.crop((0, 0, ph.width, 820)), 34)
    px, py = W - ph.width - 110, 80
    shadow(canvas, (px, py, px + ph.width, py + ph.height), 34, 24, (0, 18), P["shadow"][1] + 40, P["shadow"][0])
    canvas.alpha_composite(ph, (px, py))

    arrow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ad = ImageDraw.Draw(arrow)
    pts = [(1000 + t * 2.3, 440 - 90 * math.sin(math.pi * t / 120)) for t in range(0, 121)]
    for a, b in zip(pts, pts[1:]):
        ad.line((a, b), fill=ORANGE + (255,), width=7)
    ex, ey = pts[-1]
    ad.polygon([(ex + 26, ey + 4), (ex - 8, ey - 22), (ex - 4, ey + 26)], fill=ORANGE + (255,))
    canvas.alpha_composite(arrow)
    d = ImageDraw.Draw(canvas)
    d.text((1140, 300), "becomes", font=font("InstrumentSerif-Italic", 50), fill=P["title"], anchor="ms")
    d.text((px + ph.width // 2, py + ph.height + 52), "posy.page/mira", font=font("GeistMono-Regular", 26), fill=P["muted"], anchor="ms")
    save(round_corners(canvas, 30), f"page-file{suffix(dark)}.webp", quality=84)


# ── Dividers ────────────────────────────────────────────────────────────────


def divider(name, parts):
    W, H = 900, 120
    c = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    total = sum(p.width for p in parts) + 18 * (len(parts) - 1)
    x = (W - total) // 2
    d = ImageDraw.Draw(c)
    for side in (-1, 1):
        x0, x1 = (60, x - 36) if side < 0 else (x + total + 36, W - 60)
        for k in range(int(x0), int(x1), 14):
            d.ellipse((k, H // 2 - 2, k + 4, H // 2 + 2), fill=(196, 182, 162, 200))
    for p in parts:
        c.alpha_composite(p, (x, (H - p.height) // 2))
        x += p.width + 18
    save(c, f"divider-{name}.png")


def sized(path, h, rot=0):
    a = load(path)
    if rot:
        a = a.rotate(rot, expand=True, resample=Image.BICUBIC)
    return a.resize((int(a.width * h / a.height), h), Image.LANCZOS)


def dividers():
    divider("kite", [sized(ART / "kite.webp", 100, -14)])
    divider("petals", [sized(ART / f"petal-{n}.webp", h, r) for n, h, r in ((2, 34, 20), (9, 44, -10), (4, 30, 40))])
    divider("bouquet", [sized(ART / "isl-bouquet.webp", 100)])


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
    save(round_corners(canvas, 28), "footer.webp", quality=80)


PARTS = {
    "hero": hero,
    "looks": lambda: [look_card(*l, dark=dk) for l in LOOKS for dk in (False, True)],
    "phones": lambda: [phone_card(*l, dark=dk) for l in LOOKS for dk in (False, True)],
    "how": lambda: [how(dk) for dk in (False, True)],
    "pagefile": lambda: [page_file(dk) for dk in (False, True)],
    "dividers": dividers,
    "tour": lambda: [tour(dk) for dk in (False, True)],
    "footer": footer,
}

if __name__ == "__main__":
    import sys

    OUT.mkdir(parents=True, exist_ok=True)
    for part in sys.argv[1:] or PARTS:
        PARTS[part]()
