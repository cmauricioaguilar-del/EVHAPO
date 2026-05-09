"""
Generador de logotipos MindEV — v3 (fondo opaco corregido)
"""
import os, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

DESKTOP = r'C:\Users\pc\OneDrive\Escritorio\MindEV_Logos'
os.makedirs(DESKTOP, exist_ok=True)

BG    = (10,  14,  26)
CARD  = (15,  23,  42)
DARK2 = (18,  30,  60)
DARK3 = (26,  42,  80)
RING  = (30,  46,  80)
GOLD  = (212, 175,  55)
GOLD2 = (245, 215,  90)
CYAN  = ( 77, 182, 172)
WHITE = (226, 232, 240)
GRAY  = (100, 116, 139)

def lerp(c1, c2, t):
    return tuple(int(c1[i]+(c2[i]-c1[i])*t) for i in range(3))

def font(path, size, fallback=None):
    try:
        return ImageFont.truetype(path, size)
    except:
        return ImageFont.truetype(fallback, size) if fallback else ImageFont.load_default()

# ─────────────────────────────────────────────────────────────────────────────
# ÍCONO
# ─────────────────────────────────────────────────────────────────────────────
def build_icon(S=640):
    # RGB puro, sin canal alpha → sin problemas de transparencia
    img  = Image.new('RGB', (S, S), BG)
    draw = ImageDraw.Draw(img)

    cx = cy = S // 2
    r_out = int(S * 0.465)
    r_mid = int(S * 0.442)
    r_in  = int(S * 0.418)

    # Fondo interior con gradiente radial simulado (RGB → completamente opaco)
    for r in range(r_in, 0, -2):
        t = 1 - r/r_in
        c = lerp(DARK3, CARD, t*t)
        draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=c)

    # Anillo oscuro
    draw.ellipse([cx-r_mid, cy-r_mid, cx+r_mid, cy+r_mid], outline=RING, width=4)

    # Anillo dorado exterior
    for w in range(6, 0, -1):
        alpha_c = lerp(GOLD, GOLD2, w/6)
        draw.ellipse([cx-r_out+w, cy-r_out+w, cx+r_out-w, cy+r_out-w],
                     outline=alpha_c, width=1)

    # Anillo dorado principal
    draw.ellipse([cx-r_out, cy-r_out, cx+r_out, cy+r_out], outline=GOLD, width=5)
    draw.ellipse([cx-r_out+5, cy-r_out+5, cx+r_out-5, cy+r_out-5], outline=RING, width=3)

    # ── Red neuronal ──
    # Nodos (fracción de S)
    raw = [(0.285,0.300,0.038),(0.230,0.500,0.038),(0.295,0.710,0.034),
           (0.460,0.220,0.046),(0.500,0.460,0.052),(0.455,0.690,0.042),(0.540,0.800,0.030),
           (0.690,0.310,0.038),(0.730,0.530,0.038),(0.650,0.720,0.034)]
    NP = [(int(x*S), int(y*S), int(r*S)) for x,y,r in raw]

    edges = [(0,3),(0,4),(1,3),(1,4),(1,5),(2,4),(2,5),(2,6),
             (3,7),(3,8),(4,7),(4,8),(4,9),(5,8),(5,9),(6,9)]

    # Clip: solo dibujar dentro del círculo interior
    clip = Image.new('RGB', (S, S), BG)
    cd = ImageDraw.Draw(clip)

    # Relleno interior (mismo gradiente)
    for r in range(r_in, 0, -2):
        t = 1 - r/r_in
        c = lerp(DARK3, CARD, t*t)
        cd.ellipse([cx-r, cy-r, cx+r, cy+r], fill=c)

    # Aristas (CYAN atenuado)
    CYAN_DIM = lerp(CYAN, CARD, 0.55)
    for i,j in edges:
        x1,y1,_ = NP[i]; x2,y2,_ = NP[j]
        cd.line([(x1,y1),(x2,y2)], fill=CYAN_DIM, width=max(2, S//160))

    # Halos de nodos
    CYAN_HALO = lerp(CYAN, DARK3, 0.75)
    for nx,ny,nr in NP:
        cd.ellipse([nx-nr*2,ny-nr*2,nx+nr*2,ny+nr*2], fill=CYAN_HALO)

    # Cuerpos de nodos
    for idx,(nx,ny,nr) in enumerate(NP):
        is_main = idx == 4
        body_c  = DARK3 if not is_main else (20, 38, 68)
        cd.ellipse([nx-nr,ny-nr,nx+nr,ny+nr], fill=body_c)
        cd.ellipse([nx-nr,ny-nr,nx+nr,ny+nr], outline=CYAN, width=max(2,S//200))
        dr = max(3, nr//3) if not is_main else max(5, nr//2)
        cd.ellipse([nx-dr,ny-dr,nx+dr,ny+dr], fill=CYAN)

    # Curva EV dorada (glow = líneas gruesas atenuadas primero)
    ev = [(int(x*S),int(y*S)) for x,y in
          [(0.195,0.810),(0.310,0.660),(0.440,0.560),(0.580,0.385),(0.725,0.205)]]

    GOLD_DIM1 = lerp(GOLD, DARK3, 0.60)
    GOLD_DIM2 = lerp(GOLD, DARK3, 0.30)
    for i in range(len(ev)-1):
        cd.line([ev[i],ev[i+1]], fill=GOLD_DIM1, width=max(14,S//30))
        cd.line([ev[i],ev[i+1]], fill=GOLD_DIM2, width=max(8, S//50))
        cd.line([ev[i],ev[i+1]], fill=GOLD,       width=max(4, S//100))

    # Punta de flecha
    tx,ty = ev[-1]; px,py = ev[-2]
    dx,dy = tx-px,ty-py; L=math.hypot(dx,dy) or 1
    ux,uy = dx/L,dy/L
    aw = max(8, S//50); al = max(12, S//35)
    ax1=(tx-al*ux-aw*uy, ty-al*uy+aw*ux)
    ax2=(tx-al*ux+aw*uy, ty-al*uy-aw*ux)
    cd.polygon([(tx,ty),ax1,ax2], fill=GOLD)

    # Brillo en el pico
    tip_r = max(5, S//70)
    cd.ellipse([tx-tip_r,ty-tip_r,tx+tip_r,ty+tip_r], fill=GOLD2)

    # Aplicar clip circular
    mask = Image.new('L', (S,S), 0)
    ImageDraw.Draw(mask).ellipse([cx-r_in,cy-r_in,cx+r_in,cy+r_in], fill=255)
    img.paste(clip, mask=mask)

    # Anillo cian interior (encima del clip)
    draw.ellipse([cx-r_in,cy-r_in,cx+r_in,cy+r_in], outline=lerp(CYAN,DARK3,0.5), width=2)

    # Reflejo especular sutil — pequeño arco brillante en la parte superior del anillo
    # (simula luz reflejada en metal pulido, sin dominar el diseño)
    ref_cx = cx - int(r_out * 0.28)
    ref_cy = cy - int(r_out * 0.72)
    ref_r  = max(4, int(r_out * 0.06))   # mucho más pequeño
    GOLD_HI = lerp(GOLD2, (255, 248, 200), 0.55)
    for rr in range(ref_r, 0, -1):
        t = rr / ref_r
        c = lerp(GOLD_HI, GOLD, t * t)
        draw.ellipse([ref_cx-rr, ref_cy-rr, ref_cx+rr, ref_cy+rr], fill=c)

    # Convertir a RGBA con máscara circular (esquinas transparentes)
    rgba = img.convert('RGBA')
    circle_mask = Image.new('L', (S, S), 0)
    ImageDraw.Draw(circle_mask).ellipse([cx-r_out, cy-r_out, cx+r_out, cy+r_out], fill=255)
    rgba.putalpha(circle_mask)
    return rgba


# ─────────────────────────────────────────────────────────────────────────────
# LOGO HORIZONTAL
# ─────────────────────────────────────────────────────────────────────────────
def build_logo_horizontal(scale=2):
    # Canvas más alto para dar espacio al slogan grande
    W, H   = 960*scale, 340*scale
    S_icon = 300*scale
    pad    = 20*scale
    tx     = pad + S_icon + 30*scale

    img  = Image.new('RGB', (W, H), BG)
    draw = ImageDraw.Draw(img)

    # Gradiente sutil de fondo
    for x in range(W):
        t = x/W
        c = lerp(lerp(BG, DARK2, 0.3), BG, t)
        draw.line([(x,0),(x,H)], fill=c)

    # Barras decorativas
    draw.rectangle([0, 0, W, 5*scale], fill=GOLD)
    draw.rectangle([0, H-5*scale, W, H], fill=GOLD)
    draw.rectangle([0, 5*scale, 4*scale, H-5*scale], fill=lerp(CYAN,BG,0.3))

    # (sin ♠ decorativo — interfiere con el texto)

    # Icono centrado verticalmente
    icon = build_icon(S_icon)
    iy   = (H - S_icon) // 2
    img.paste(icon.convert('RGBA'), (pad, iy), icon.split()[3])

    # ── Fuentes: wordmark normal, slogans GRANDES ──
    fb  = font('C:/Windows/Fonts/segoeuib.ttf', 96*scale)   # wordmark
    fi  = font('C:/Windows/Fonts/segoeuib.ttf', 44*scale)   # tagline grande
    fs  = font('C:/Windows/Fonts/segoeui.ttf',  27*scale)   # subtítulo (reducido para que quepa)

    # Sombra del wordmark
    for off in [(3,3),(3,-3),(-3,3),(-3,-3)]:
        draw.text((tx+off[0], 30*scale+off[1]), 'Mind', font=fb, fill=lerp(BG,DARK2,0.5))
        mw = draw.textlength('Mind', font=fb)
        draw.text((tx+int(mw)+off[0], 30*scale+off[1]), 'EV', font=fb, fill=lerp(BG,DARK2,0.5))

    # Wordmark "MindEV"
    draw.text((tx, 30*scale), 'Mind', font=fb, fill=WHITE)
    mw      = int(draw.textlength('Mind', font=fb))
    draw.text((tx+mw, 30*scale), 'EV', font=fb, fill=GOLD)
    total_w = mw + int(draw.textlength('EV', font=fb))

    # Línea divisora
    ly = 148*scale
    draw.rectangle([tx, ly, tx+total_w, ly+4*scale], fill=CYAN)

    # Tagline grande
    draw.text((tx, ly+14*scale), 'Tu EV+ empieza en tu mente.', font=fi, fill=CYAN)

    # Subtítulo grande
    draw.text((tx, ly+14*scale+60*scale), 'DIAGNÓSTICO MENTAL + TÉCNICO + IA', font=fs, fill=GOLD)

    return img

# ─────────────────────────────────────────────────────────────────────────────
# LOGO VERTICAL
# ─────────────────────────────────────────────────────────────────────────────
def build_logo_vertical(scale=2):
    W, H   = 460*scale, 580*scale
    S_icon = 260*scale

    img  = Image.new('RGB', (W, H), BG)
    draw = ImageDraw.Draw(img)

    # Gradiente vertical
    for y in range(H):
        t = y/H
        c = lerp(DARK2, BG, t)
        draw.line([(0,y),(W,y)], fill=c)

    draw.rectangle([0,0,W,4*scale], fill=GOLD)
    draw.rectangle([0,H-4*scale,W,H], fill=GOLD)
    draw.rectangle([0,4*scale,3*scale,H-4*scale], fill=lerp(CYAN,BG,0.3))
    draw.rectangle([W-3*scale,4*scale,W,H-4*scale], fill=lerp(CYAN,BG,0.3))

    # ♠ de fondo
    try:
        fd = ImageFont.truetype('C:/Windows/Fonts/seguisym.ttf', 200*scale)
        draw.text((W//2-100*scale, 150*scale), '♠', font=fd, fill=lerp(GOLD,BG,0.90))
    except: pass

    # Icono (con máscara circular para evitar cuadrado de fondo)
    icon = build_icon(S_icon)
    ix = (W - S_icon)//2
    img.paste(icon.convert('RGBA'), (ix, 28*scale), icon.split()[3])

    fb  = font('C:/Windows/Fonts/segoeuib.ttf', 96*scale)
    fi  = font('C:/Windows/Fonts/segoeuii.ttf', 22*scale)
    fs  = font('C:/Windows/Fonts/segoeui.ttf',  15*scale)
    fbd = font('C:/Windows/Fonts/segoeuib.ttf', 15*scale)

    ty_w = 28*scale + S_icon + 16*scale
    mw   = int(draw.textlength('Mind', font=fb))
    ew   = int(draw.textlength('EV',   font=fb))
    sx   = (W - mw - ew)//2

    draw.text((sx, ty_w), 'Mind', font=fb, fill=WHITE)
    draw.text((sx+mw, ty_w), 'EV', font=fb, fill=GOLD)

    ly = ty_w + 108*scale
    lx = int(W*0.15)
    draw.rectangle([lx, ly, W-lx, ly+2*scale], fill=lerp(CYAN,BG,0.3))

    tag = 'Tu EV+ empieza en tu mente.'
    tw  = int(draw.textlength(tag, font=fi))
    draw.text(((W-tw)//2, ly+12*scale), tag, font=fi, fill=CYAN)

    sub = 'DIAGNÓSTICO MENTAL + TÉCNICO + IA'
    sw  = int(draw.textlength(sub, font=fs))
    draw.text(((W-sw)//2, ly+44*scale), sub, font=fs, fill=GRAY)

    # Badge
    bt  = 'POKER COACHING AI'
    btw = int(draw.textlength(bt, font=fbd)) + 32*scale
    bx  = (W-btw)//2; by = ly+78*scale
    draw.rectangle([bx, by, bx+btw, by+30*scale], fill=GOLD)
    bx2 = (W - int(draw.textlength(bt, font=fbd)))//2
    draw.text((bx2, by+6*scale), bt, font=fbd, fill=BG)

    return img

# ─────────────────────────────────────────────────────────────────────────────
# LOGO FONDO BLANCO
# ─────────────────────────────────────────────────────────────────────────────
def build_logo_light(scale=2):
    W, H   = 960*scale, 280*scale
    S_icon = 240*scale
    pad    = 24*scale
    tx     = pad + S_icon + 28*scale

    BGLT   = (248, 250, 252)
    TEXTD  = ( 10,  14,  26)
    GOLDD  = (140, 100,   8)
    CYAND  = ( 30, 120, 115)
    GRAYD  = ( 80,  96, 112)

    img  = Image.new('RGB', (W, H), BGLT)
    draw = ImageDraw.Draw(img)

    draw.rectangle([0,0,W,4*scale], fill=GOLDD)
    draw.rectangle([0,H-4*scale,W,H], fill=GOLDD)

    icon = build_icon(S_icon)
    iy   = (H - S_icon)//2
    img.paste(icon.convert('RGBA'), (pad, iy), icon.split()[3])

    fb = font('C:/Windows/Fonts/segoeuib.ttf', 110*scale)
    fi = font('C:/Windows/Fonts/segoeuii.ttf',  24*scale)
    fs = font('C:/Windows/Fonts/segoeui.ttf',   17*scale)

    draw.text((tx, 50*scale), 'Mind', font=fb, fill=TEXTD)
    mw = int(draw.textlength('Mind', font=fb))
    draw.text((tx+mw, 50*scale), 'EV', font=fb, fill=GOLDD)
    total_w = mw + int(draw.textlength('EV', font=fb))
    ly = 177*scale
    draw.rectangle([tx, ly, tx+total_w, ly+3*scale], fill=CYAND)
    draw.text((tx, ly+10*scale), 'Tu EV empieza en tu mente.', font=fi, fill=CYAND)
    draw.text((tx, ly+10*scale+34*scale), 'DIAGNÓSTICO MENTAL + TÉCNICO + IA', font=fs, fill=GRAYD)

    return img

# ─────────────────────────────────────────────────────────────────────────────
# GUARDAR
# ─────────────────────────────────────────────────────────────────────────────
tasks = [
    ('MindEV_Icono_640.png',         build_icon(640).convert('RGBA')),
    ('MindEV_Icono_256.png',         build_icon(256).convert('RGBA')),
    ('MindEV_Logo_Horizontal.png',   build_logo_horizontal(2)),
    ('MindEV_Logo_Vertical.png',     build_logo_vertical(2)),
    ('MindEV_Logo_Fondo_Claro.png',  build_logo_light(2)),
]

for fname, img in tasks:
    path = os.path.join(DESKTOP, fname)
    img.save(path, 'PNG', optimize=True)
    kb = os.path.getsize(path)//1024
    print(f'  {fname}  {img.size[0]}x{img.size[1]}  {kb}KB')

# SVG vectorial
svg_path = os.path.join(DESKTOP, 'MindEV_Icono.svg')
with open(svg_path,'w',encoding='utf-8') as f:
    f.write('''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
<defs>
  <radialGradient id="bg" cx="40%" cy="35%" r="65%">
    <stop offset="0%" stop-color="#1A2A50"/><stop offset="100%" stop-color="#0F172A"/>
  </radialGradient>
  <radialGradient id="gd" cx="25%" cy="25%" r="75%">
    <stop offset="0%" stop-color="#F5D550"/><stop offset="100%" stop-color="#A87010"/>
  </radialGradient>
  <filter id="glow"><feGaussianBlur stdDeviation="2.2" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <clipPath id="cc"><circle cx="80" cy="80" r="67"/></clipPath>
</defs>
<!-- Sombra -->
<circle cx="82" cy="82" r="77" fill="#000" opacity=".35"/>
<!-- Anillo dorado -->
<circle cx="80" cy="80" r="75" fill="url(#gd)"/>
<!-- Anillo oscuro intermedio -->
<circle cx="80" cy="80" r="71" fill="#1E2D45"/>
<!-- Fondo interior -->
<circle cx="80" cy="80" r="67" fill="url(#bg)"/>
<!-- Red neuronal -->
<g clip-path="url(#cc)">
  <!-- Aristas -->
  <line x1="46" y1="48" x2="74" y2="35" stroke="#4DB6AC" stroke-width="1.2" opacity=".45"/>
  <line x1="46" y1="48" x2="80" y2="74" stroke="#4DB6AC" stroke-width="1.2" opacity=".45"/>
  <line x1="37" y1="80" x2="74" y2="35" stroke="#4DB6AC" stroke-width="1.2" opacity=".45"/>
  <line x1="37" y1="80" x2="80" y2="74" stroke="#4DB6AC" stroke-width="1.2" opacity=".45"/>
  <line x1="37" y1="80" x2="73" y2="110" stroke="#4DB6AC" stroke-width="1.2" opacity=".45"/>
  <line x1="47" y1="113" x2="80" y2="74" stroke="#4DB6AC" stroke-width="1.2" opacity=".45"/>
  <line x1="47" y1="113" x2="73" y2="110" stroke="#4DB6AC" stroke-width="1.2" opacity=".45"/>
  <line x1="74" y1="35" x2="110" y2="50" stroke="#4DB6AC" stroke-width="1.2" opacity=".45"/>
  <line x1="74" y1="35" x2="117" y2="85" stroke="#4DB6AC" stroke-width="1.2" opacity=".45"/>
  <line x1="80" y1="74" x2="110" y2="50" stroke="#4DB6AC" stroke-width="1.2" opacity=".45"/>
  <line x1="80" y1="74" x2="117" y2="85" stroke="#4DB6AC" stroke-width="1.2" opacity=".45"/>
  <line x1="80" y1="74" x2="104" y2="115" stroke="#4DB6AC" stroke-width="1.2" opacity=".45"/>
  <line x1="73" y1="110" x2="117" y2="85" stroke="#4DB6AC" stroke-width="1.2" opacity=".45"/>
  <line x1="73" y1="110" x2="104" y2="115" stroke="#4DB6AC" stroke-width="1.2" opacity=".45"/>
  <!-- Halos nodos -->
  <circle cx="46"  cy="48"  r="10" fill="#4DB6AC" opacity=".12"/>
  <circle cx="37"  cy="80"  r="10" fill="#4DB6AC" opacity=".12"/>
  <circle cx="47"  cy="113" r="9"  fill="#4DB6AC" opacity=".12"/>
  <circle cx="74"  cy="35"  r="12" fill="#4DB6AC" opacity=".14"/>
  <circle cx="80"  cy="74"  r="15" fill="#4DB6AC" opacity=".18"/>
  <circle cx="73"  cy="110" r="12" fill="#4DB6AC" opacity=".14"/>
  <circle cx="110" cy="50"  r="10" fill="#4DB6AC" opacity=".12"/>
  <circle cx="117" cy="85"  r="10" fill="#4DB6AC" opacity=".12"/>
  <circle cx="104" cy="115" r="9"  fill="#4DB6AC" opacity=".12"/>
  <!-- Cuerpos nodos -->
  <circle cx="46"  cy="48"  r="5.5" fill="#0F172A" stroke="#4DB6AC" stroke-width="1.8"/>
  <circle cx="46"  cy="48"  r="1.8" fill="#4DB6AC"/>
  <circle cx="37"  cy="80"  r="5.5" fill="#0F172A" stroke="#4DB6AC" stroke-width="1.8"/>
  <circle cx="37"  cy="80"  r="1.8" fill="#4DB6AC"/>
  <circle cx="47"  cy="113" r="5"   fill="#0F172A" stroke="#4DB6AC" stroke-width="1.8"/>
  <circle cx="47"  cy="113" r="1.6" fill="#4DB6AC"/>
  <circle cx="74"  cy="35"  r="6.5" fill="#0F172A" stroke="#4DB6AC" stroke-width="2"/>
  <circle cx="74"  cy="35"  r="2.2" fill="#4DB6AC"/>
  <circle cx="80"  cy="74"  r="8.5" fill="#122644" stroke="#4DB6AC" stroke-width="2.5"/>
  <circle cx="80"  cy="74"  r="3.2" fill="#4DB6AC"/>
  <circle cx="73"  cy="110" r="6.5" fill="#0F172A" stroke="#4DB6AC" stroke-width="2"/>
  <circle cx="73"  cy="110" r="2.2" fill="#4DB6AC"/>
  <circle cx="110" cy="50"  r="5.5" fill="#0F172A" stroke="#4DB6AC" stroke-width="1.8"/>
  <circle cx="110" cy="50"  r="1.8" fill="#4DB6AC"/>
  <circle cx="117" cy="85"  r="5.5" fill="#0F172A" stroke="#4DB6AC" stroke-width="1.8"/>
  <circle cx="117" cy="85"  r="1.8" fill="#4DB6AC"/>
  <circle cx="104" cy="115" r="5"   fill="#0F172A" stroke="#4DB6AC" stroke-width="1.8"/>
  <circle cx="104" cy="115" r="1.6" fill="#4DB6AC"/>
  <!-- Curva EV — glow -->
  <polyline points="31,130 50,105 71,90 93,62 116,33"
    fill="none" stroke="#D4AF37" stroke-width="10" stroke-linecap="round"
    stroke-linejoin="round" opacity=".18"/>
  <polyline points="31,130 50,105 71,90 93,62 116,33"
    fill="none" stroke="#D4AF37" stroke-width="6" stroke-linecap="round"
    stroke-linejoin="round" opacity=".35"/>
  <!-- Curva EV — línea principal -->
  <polyline points="31,130 50,105 71,90 93,62 116,33"
    fill="none" stroke="#D4AF37" stroke-width="3.5" stroke-linecap="round"
    stroke-linejoin="round" filter="url(#glow)"/>
  <!-- Punta flecha -->
  <polygon points="116,33 108,46 122,44" fill="#D4AF37" filter="url(#glow)"/>
  <!-- Destello pico -->
  <circle cx="116" cy="33" r="4" fill="#FFF8A0"/>
</g>
<!-- Anillo cian interior -->
<circle cx="80" cy="80" r="67" fill="none" stroke="#4DB6AC" stroke-width="1.2" opacity=".55"/>
<!-- Reflejo especular anillo dorado -->
<ellipse cx="57" cy="34" rx="14" ry="8" fill="#FFF8C0" opacity=".25" transform="rotate(-30,57,34)"/>
</svg>''')
print('  MindEV_Icono.svg')
print(f'\nTodo guardado en: {DESKTOP}')
