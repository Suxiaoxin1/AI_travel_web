"""Silent album slideshow renderer (Ken Burns + crossfade)."""
from __future__ import annotations

import base64
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

DATA_URL_RE = re.compile(
    r"^data:(image/(?:jpeg|jpg|png|webp));base64,(.+)$",
    re.IGNORECASE | re.DOTALL,
)


class AlbumVideoError(RuntimeError):
    pass


def ensure_ffmpeg() -> str:
    path = shutil.which("ffmpeg")
    if not path:
        raise AlbumVideoError("服务器未安装 ffmpeg，无法合成相册视频")
    return path


def decode_data_url(data_url: str) -> tuple[bytes, str]:
    text = (data_url or "").strip()
    match = DATA_URL_RE.match(text)
    if not match:
        raise AlbumVideoError("图片格式无效，请使用 JPG / PNG / WebP")
    mime = match.group(1).lower().replace("image/", "")
    if mime == "jpg":
        mime = "jpeg"
    try:
        raw = base64.b64decode(match.group(2), validate=False)
    except Exception as exc:  # noqa: BLE001
        raise AlbumVideoError("图片解码失败") from exc
    if not raw:
        raise AlbumVideoError("图片内容为空")
    if len(raw) > 8 * 1024 * 1024:
        raise AlbumVideoError("单张图片过大，请先压缩")
    return raw, mime


def write_temp_images(images: list[str], directory: Path) -> list[Path]:
    paths: list[Path] = []
    for index, item in enumerate(images):
        raw, mime = decode_data_url(item)
        ext = "jpg" if mime == "jpeg" else mime
        path = directory / f"frame_{index:02d}.{ext}"
        path.write_bytes(raw)
        paths.append(path)
    return paths


def render_silent_slideshow(
    image_paths: list[Path],
    output_path: Path,
    *,
    seconds_per_image: float = 3.0,
    transition: float = 0.8,
    width: int = 1280,
    height: int = 720,
    fps: int = 25,
) -> Path:
    """Render a silent Ken Burns slideshow with soft crossfades."""
    ffmpeg = ensure_ffmpeg()
    if len(image_paths) < 1:
        raise AlbumVideoError("至少需要 1 张照片")

    display = max(float(seconds_per_image), transition + 0.5)
    frames = max(int(round(display * fps)), int(round((transition + 0.5) * fps)))
    zoom_expr = "min(zoom+0.0005,1.15)"

    cmd: list[str] = [ffmpeg, "-y"]
    for path in image_paths:
        # Still image → zoompan expands to N frames (same approach as Odyssee).
        cmd.extend(["-i", str(path)])

    filters: list[str] = []
    stream_names: list[str] = []
    for index in range(len(image_paths)):
        # Split → blurred cover BG + fit FG → overlay → slow zoom.
        filters.append(
            f"[{index}:v]split[bg_in{index}][fg_in{index}];"
            f"[bg_in{index}]scale={width}:{height}:force_original_aspect_ratio=increase,"
            f"crop={width}:{height},setsar=1,boxblur=20:10,eq=brightness=-0.08[bg{index}];"
            f"[fg_in{index}]scale={width}:{height}:force_original_aspect_ratio=decrease,"
            f"setsar=1[fg{index}];"
            f"[bg{index}][fg{index}]overlay=(W-w)/2:(H-h)/2[merged{index}];"
            f"[merged{index}]zoompan=z='{zoom_expr}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
            f":d={frames}:s={width}x{height}:fps={fps},format=yuv420p[v{index}]"
        )
        stream_names.append(f"[v{index}]")

    if len(stream_names) == 1:
        filters.append(f"{stream_names[0]}null[vout]")
    else:
        current = stream_names[0]
        for i in range(1, len(stream_names)):
            out = f"[x{i}]" if i < len(stream_names) - 1 else "[vout]"
            offset = (display - transition) * i
            filters.append(
                f"{current}{stream_names[i]}xfade=transition=fade:"
                f"duration={transition:.3f}:offset={offset:.3f}{out}"
            )
            current = out

    filter_complex = ";".join(filters)
    cmd.extend(
        [
            "-filter_complex",
            filter_complex,
            "-map",
            "[vout]",
            "-an",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            "-preset",
            "veryfast",
            str(output_path),
        ]
    )

    try:
        completed = subprocess.run(
            cmd,
            check=False,
            capture_output=True,
            text=True,
            timeout=300,
        )
    except subprocess.TimeoutExpired as exc:
        raise AlbumVideoError("视频合成超时，请减少照片数量后重试") from exc

    if completed.returncode != 0 or not output_path.exists() or output_path.stat().st_size < 1000:
        detail = (completed.stderr or completed.stdout or "").strip()[-400:]
        raise AlbumVideoError(f"视频合成失败{(': ' + detail) if detail else ''}")

    return output_path


def render_from_data_urls(
    images: list[str],
    output_path: Path,
    *,
    seconds_per_image: float = 3.0,
) -> Path:
    with tempfile.TemporaryDirectory(prefix="album_video_") as tmp:
        tmp_dir = Path(tmp)
        paths = write_temp_images(images, tmp_dir)
        return render_silent_slideshow(
            paths,
            output_path,
            seconds_per_image=seconds_per_image,
        )
