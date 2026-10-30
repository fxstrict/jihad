# يولّد أيقونات PWA (S1). الاستخدام: python3 scripts/make-icons.py apps/web/public/icons  (يتطلب Pillow). الناتج مُلتزَم به؛ هذا السكربت للتوليد مجددًا فقط.
import sys
from PIL import Image, ImageDraw, ImageFont
out = sys.argv[1]
TEAL = (15, 118, 110, 255)   # #0f766e = theme_color الحالي في manifest
WHITE = (255, 255, 255, 255)
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
GLYPH = "ج"  # أول حرف من «الجهاد»

def render(size, *, rounded, glyph_ratio):
    S = size * 4  # supersample
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if rounded:
        d.rounded_rectangle((0, 0, S - 1, S - 1), radius=int(S * 0.22), fill=TEAL)
    else:
        d.rectangle((0, 0, S, S), fill=TEAL)
    font = ImageFont.truetype(FONT, int(S * glyph_ratio))
    bbox = d.textbbox((0, 0), GLYPH, font=font)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.text(((S - w) / 2 - bbox[0], (S - h) / 2 - bbox[1]), GLYPH, font=font, fill=WHITE)
    return img.resize((size, size), Image.LANCZOS)

render(192, rounded=True, glyph_ratio=0.62).save(f"{out}/icon-192.png", optimize=True)
render(512, rounded=True, glyph_ratio=0.62).save(f"{out}/icon-512.png", optimize=True)
# maskable: خلفية كاملة، والرمز داخل المنطقة الآمنة (دائرة 80% من الوسط)
render(512, rounded=False, glyph_ratio=0.46).save(f"{out}/icon-maskable-512.png", optimize=True)
# iOS: بلا شفافية
render(180, rounded=False, glyph_ratio=0.56).convert("RGB").save(f"{out}/apple-touch-icon.png", optimize=True)
