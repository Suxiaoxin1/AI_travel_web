"""Compress fox animated webps for homepage: downsample + webm alpha via frame export."""
from __future__ import annotations

import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageSequence

SRC = Path(r"D:\桌面\新建文件夹 (3)\assets\fox")
OUT = Path(r"D:\ai-travel-homepage\public\images\ip\fox")
FFMPEG = Path(
    r"C:\Users\suxianbiao\AppData\Local\Microsoft\WinGet\Packages"
    r"\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1-full_build\bin\ffmpeg.exe"
)
TARGET_W = 440
FRAME_STEP = 2  # keep every 2nd frame
FPS = 12.5
WEBP_QUALITY = 48


def compress_one(src: Path) -> None:
    print(f"== {src.name}")
    im = Image.open(src)
    w, h = im.size
    tw = TARGET_W
    th = int(round(h * tw / w / 2) * 2)

    frames: list[Image.Image] = []
    for i, fr in enumerate(ImageSequence.Iterator(im)):
        if i % FRAME_STEP:
            continue
        frames.append(fr.convert("RGBA").resize((tw, th), Image.Resampling.LANCZOS))

    # Animated webp fallback/display in <img>
    webp_path = OUT / src.name
    duration = int(round(1000 / FPS))
    frames[0].save(
        webp_path,
        format="WEBP",
        save_all=True,
        append_images=frames[1:],
        duration=duration,
        loop=0,
        quality=WEBP_QUALITY,
        method=4,
        lossless=False,
    )
    print(f"  webp {webp_path.stat().st_size / 1e6:.2f} MB frames={len(frames)} size={frames[0].size}")

    # Also encode webm with alpha for smoother playback
    if not FFMPEG.exists():
        print("  skip webm: ffmpeg missing")
        return

    with tempfile.TemporaryDirectory(prefix="foxframes_") as tmp:
        tmp_path = Path(tmp)
        for i, fr in enumerate(frames):
            fr.save(tmp_path / f"f_{i:04d}.png")
        webm_path = OUT / (src.stem + ".webm")
        cmd = [
            str(FFMPEG),
            "-y",
            "-framerate",
            str(FPS),
            "-i",
            str(tmp_path / "f_%04d.png"),
            "-c:v",
            "libvpx-vp9",
            "-pix_fmt",
            "yuva420p",
            "-b:v",
            "650k",
            "-an",
            "-auto-alt-ref",
            "0",
            "-row-mt",
            "1",
            str(webm_path),
        ]
        proc = subprocess.run(cmd, capture_output=True, text=True)
        if proc.returncode != 0:
            print("  webm failed:", proc.stderr[-500:])
        else:
            print(f"  webm {webm_path.stat().st_size / 1e6:.2f} MB")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    files = sorted(SRC.glob("fox*.webp"))
    if not files:
        raise SystemExit(f"no fox webp in {SRC}")
    for f in files:
        compress_one(f)
    print("DONE")
    for p in sorted(OUT.glob("fox*")):
        print(f"  {p.name:30} {p.stat().st_size / 1e6:.2f} MB")


if __name__ == "__main__":
    main()
