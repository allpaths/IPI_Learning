"""Grab JPG frames from a YouTube video at given timestamps.

Downloads the source video once via yt-dlp, then extracts each requested
frame with the ffmpeg binary bundled by imageio-ffmpeg. Output filenames
match the project convention: ``Part_N_HH_MM_SS.jpg``.

Example:
    python scripts/grab_screenshots.py \\
        --part 2 \\
        --url https://youtu.be/DCQpbssp_Sw \\
        --out Video_02/Screenshots \\
        0:42 1:15 3:08 12:34:56
"""

from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import imageio_ffmpeg
import yt_dlp


TIMESTAMP_RE = re.compile(r"^(?:(\d+):)?(\d{1,2}):(\d{1,2})$")


def parse_timestamp(s: str) -> tuple[int, int, int]:
    """Parse 'MM:SS' or 'HH:MM:SS' into (h, m, s). Raises ValueError on bad input."""
    m = TIMESTAMP_RE.match(s.strip())
    if not m:
        raise ValueError(f"Bad timestamp {s!r}; expected MM:SS or HH:MM:SS")
    h = int(m.group(1)) if m.group(1) else 0
    mins = int(m.group(2))
    secs = int(m.group(3))
    if mins >= 60 or secs >= 60:
        raise ValueError(f"Bad timestamp {s!r}; minutes and seconds must be < 60")
    return h, mins, secs


def download_video(url: str, dest_dir: Path) -> Path:
    """Download the best mp4 stream for `url` into `dest_dir` and return its path."""
    out_template = str(dest_dir / "source.%(ext)s")
    opts = {
        "outtmpl": out_template,
        "format": "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b",
        "merge_output_format": "mp4",
        "quiet": False,
        "noprogress": False,
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        ydl.download([url])
    candidates = list(dest_dir.glob("source.*"))
    if not candidates:
        raise RuntimeError("yt-dlp finished but no source file was produced")
    return candidates[0]


def extract_frame(ffmpeg: str, video: Path, h: int, m: int, s: int, out: Path) -> None:
    """Seek to HH:MM:SS in `video` and write a single JPG frame to `out`."""
    ts = f"{h:02d}:{m:02d}:{s:02d}"
    cmd = [
        ffmpeg,
        "-y",
        "-ss", ts,
        "-i", str(video),
        "-frames:v", "1",
        "-q:v", "2",
        str(out),
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--part", type=int, required=True, help="Video part number (1-9)")
    src = ap.add_mutually_exclusive_group(required=True)
    src.add_argument("--url", help="YouTube URL (downloaded to a temp dir)")
    src.add_argument("--video-file", help="Path to a local video file (skips download)")
    ap.add_argument("--out", required=True, help="Output folder for JPGs")
    ap.add_argument("timestamps", nargs="+", help="Timestamps as MM:SS or HH:MM:SS")
    args = ap.parse_args(argv)

    parsed = [parse_timestamp(t) for t in args.timestamps]

    out_dir = Path(args.out).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()

    def grab_all(video: Path) -> None:
        for h, m, s in parsed:
            name = f"Part_{args.part}_{h:02d}_{m:02d}_{s:02d}.jpg"
            out_path = out_dir / name
            print(f"  -> {name}", flush=True)
            extract_frame(ffmpeg, video, h, m, s, out_path)

    if args.video_file:
        video = Path(args.video_file).resolve()
        if not video.is_file():
            ap.error(f"Video not found: {video}")
        print(f"Using local video {video}", flush=True)
        grab_all(video)
    else:
        with tempfile.TemporaryDirectory(prefix="grab_screenshots_") as tmp:
            print(f"Downloading {args.url} ...", flush=True)
            video = download_video(args.url, Path(tmp))
            print(f"Downloaded to {video}", flush=True)
            grab_all(video)

    print(f"Done. {len(parsed)} frame(s) written to {out_dir}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
