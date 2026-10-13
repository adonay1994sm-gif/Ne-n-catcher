"""Generate missing native iOS art from existing, approved NEON CATCHER assets.

Do not alter runtime artwork. This is a one-time repository recovery step.
Requires Pillow 11.3.0; see visual-artpass-ci.yml.
"""
from pathlib import Path
from PIL import Image, ImageOps, ImageEnhance, ImageFilter
import shutil

ROOT = Path(__file__).resolve().parents[1]
ASSET = ROOT / "assets"
ICON_SOURCE = ASSET / "icon-512.png"
BG_SOURCE = ASSET / "cronos_level1_background.webp"
ICON = ROOT / "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"
SPLASH = ROOT / "ios/App/App/Assets.xcassets/Splash.imageset"

def generate():
    if not ICON_SOURCE.is_file() or not BG_SOURCE.is_file():
        raise FileNotFoundError("Missing canonical PWA icon or Chronos art")
    ICON.parent.mkdir(parents=True, exist_ok=True)
    SPLASH.mkdir(parents=True, exist_ok=True)

    if not ICON.is_file():
        with Image.open(ICON_SOURCE) as source:
            source.convert("RGB").resize((1024, 1024), Image.Resampling.LANCZOS).save(
                ICON, "PNG", optimize=True
            )

    main = SPLASH / "splash-2732x2732.png"
    if not main.is_file():
        with Image.open(BG_SOURCE) as img:
            scene = img.convert("RGB")
        background = ImageOps.fit(scene, (2732, 2732), method=Image.Resampling.LANCZOS)
        background = ImageEnhance.Brightness(
            background.filter(ImageFilter.GaussianBlur(62))
        ).enhance(0.52)
        portrait = ImageOps.contain(scene, (1536, 2732), method=Image.Resampling.LANCZOS)
        x = (2732 - portrait.width) // 2
        y = (2732 - portrait.height) // 2
        # Alpha falloff at portrait edges; no visible hard rectangular seam.
        width, height = portrait.size
        fade = max(1, int(width * 0.09))
        ramp = [max(0, min(255, int(255 * min(i / fade, (width - 1 - i) / fade, 1))))
                for i in range(width)]
        mask = Image.new("L", portrait.size)
        for column, alpha in enumerate(ramp):
            mask.paste(alpha, (column, 0, column + 1, height))
        background.paste(portrait, (x, y), mask)
        # Indexed 256-color PNG reduces app-package size without altering runtime textures.
        background.quantize(colors=256, method=Image.Quantize.MEDIANCUT,
                            dither=Image.Dither.NONE).save(main, "PNG", optimize=True)

    for suffix in ("-1", "-2"):
        destination = SPLASH / f"splash-2732x2732{suffix}.png"
        if not destination.is_file():
            shutil.copyfile(main, destination)

    output = [ICON, *(SPLASH / n for n in
               ("splash-2732x2732.png", "splash-2732x2732-1.png",
                "splash-2732x2732-2.png"))]
    for image_file in output:
        with Image.open(image_file) as image:
            expected = (1024, 1024) if image_file == ICON else (2732, 2732)
            if image.size != expected:
                raise ValueError(f"{image_file}: bad size {image.size}")
        print(f"[iOS artwork] {image_file.relative_to(ROOT)}")

if __name__ == "__main__":
    generate()
