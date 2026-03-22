#!/usr/bin/env python3
"""Remove backgrounds from Ovi_stages images. Outputs transparent PNGs."""

import io
import os
from pathlib import Path

# Use project-local cache for rembg model (avoids writing to ~/.u2net)
_script_dir = Path(__file__).resolve().parent
_cache = _script_dir.parent / ".cache" / "u2net"
_cache.mkdir(parents=True, exist_ok=True)
os.environ["U2NET_HOME"] = str(_cache)

# rembg for AI background removal
from rembg import remove as rembg_remove
from PIL import Image

ASSETS_DIR = Path(__file__).resolve().parent.parent / "assets" / "Ovi_stages"


def main():
    os.makedirs(ASSETS_DIR, exist_ok=True)
    files = sorted(
        [f for f in ASSETS_DIR.glob("*.png")],
        key=lambda p: int(p.stem) if p.stem.isdigit() else 0,
    )
    if not files:
        print("No PNG files found in", ASSETS_DIR)
        return

    print(f"Processing {len(files)} images...")
    for i, path in enumerate(files, 1):
        if not path.stem.isdigit():
            continue
        try:
            with open(path, "rb") as f:
                input_data = f.read()
            output_data = rembg_remove(input_data)
            img = Image.open(io.BytesIO(output_data))
            img.save(path, "PNG")
            print(f"  [{i}/{len(files)}] {path.name}")
        except Exception as e:
            print(f"  ERROR {path.name}: {e}")

    print("Done.")


if __name__ == "__main__":
    main()
