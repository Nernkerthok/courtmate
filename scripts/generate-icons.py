"""Regenerate the CourtMate launcher artwork using Pillow (development only)."""
from pathlib import Path
from PIL import Image, ImageDraw

out = Path(__file__).resolve().parents[1] / "public" / "icons"
out.mkdir(parents=True, exist_ok=True)
scale = 4
canvas = Image.new("RGBA", (512 * scale, 512 * scale), "#103e33")
shuttle = Image.new("RGBA", canvas.size)
draw = ImageDraw.Draw(shuttle)
def point(x, y):
    return (round((126 + x * 2.6) * scale), round((112 + y * 2.6) * scale))
draw.polygon([point(x, y) for x, y in [(26,68),(17,20),(34,11),(50,6),(67,11),(84,20),(73,68)]], fill="white")
draw.polygon([point(x, y) for x, y in [(27,67),(73,67),(64,91),(59,100),(50,104),(41,100),(33,91)]], fill="#d4f578")
for line in [[(34,12),(41,66)],[(50,7),(50,66)],[(68,12),(59,66)],[(23,40),(78,40)],[(27,61),(74,61)]]:
    draw.line([point(x,y) for x,y in line], fill="#36714f", width=round(1.7*2.6*scale))
shuttle = shuttle.rotate(-28, resample=Image.Resampling.BICUBIC, center=(256*scale,255*scale))
canvas.alpha_composite(shuttle)
for filename, size in [("icon-192.png",192),("icon-512.png",512),("icon-maskable-512.png",512),("apple-touch-icon.png",180)]:
    canvas.convert("RGB").resize((size,size), Image.Resampling.LANCZOS).save(out / filename, optimize=True)
