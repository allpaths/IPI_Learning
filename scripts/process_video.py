"""One-command pipeline for turning a YouTube lecture into course material.

Wraps the four steps that used to be run by hand -- download, probe, transcribe,
screenshot -- behind a single stable command line so the permission allowlist in
``.claude/settings.json`` can match it once instead of prompting per step.

The downloaded video is cached at ``.cache/video/part<N>.mp4`` under the repo
root (gitignored). That path is stable across sessions, which is the whole
point: the old workflow wrote into Claude's per-session scratchpad, so every
invocation looked like a brand-new command.

Typical use is two calls per video. First, download and transcribe::

    python scripts/process_video.py --part 6 --url https://youtu.be/XXXXXXXXXXX

Then read ``Video_06/notes.txt``, pick the moments worth capturing, and grab
them from the cached video (no re-download)::

    python scripts/process_video.py --part 6 --shots 5:35 8:25 14:35 22:25

Both calls are the same script, so one allowlist rule covers the whole flow.

Steps are skipped when their output already exists; pass ``--force`` to redo
them. Nothing here re-downloads a video you already have.
"""

from __future__ import annotations

import argparse
import importlib.util
import re
import subprocess
import sys
from pathlib import Path
from types import ModuleType

REPO = Path(__file__).resolve().parent.parent
CACHE = REPO / ".cache" / "video"
TRANSCRIBE_PY = REPO / "Video_02" / "transcribe.py"
GRAB_PY = REPO / "scripts" / "grab_screenshots.py"


def _load(path: Path) -> ModuleType:
    """Import a sibling script by path (the Video_NN dirs aren't packages)."""
    spec = importlib.util.spec_from_file_location(path.stem, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot import {path}")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def banner(step: str) -> None:
    print(f"\n=== {step} ===", flush=True)


def video_dir(part: int) -> Path:
    return REPO / f"Video_{part:02d}"


def download(url: str, part: int, force: bool) -> Path:
    """Fetch the best mp4 for `url` into the repo cache. Returns the file path."""
    banner(f"Download part {part}")
    CACHE.mkdir(parents=True, exist_ok=True)
    dest = CACHE / f"part{part}.mp4"

    if dest.is_file() and not force:
        mb = dest.stat().st_size / 1024 / 1024
        print(f"Cached: {dest} ({mb:.1f} MB) -- use --force to re-download")
        return dest

    import yt_dlp

    opts = {
        "outtmpl": str(CACHE / f"part{part}.%(ext)s"),
        "format": "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b",
        "merge_output_format": "mp4",
        "quiet": False,
        "noprogress": True,
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        ydl.download([url])

    if not dest.is_file():
        raise RuntimeError(f"yt-dlp finished but {dest} was not produced")
    mb = dest.stat().st_size / 1024 / 1024
    print(f"Downloaded {dest} ({mb:.1f} MB)")
    return dest


FPS_RE = re.compile(r"([\d.]+) fps")


def probe(video: Path) -> float | None:
    """Print duration and stream lines; return the detected video frame rate."""
    banner("Probe")
    import imageio_ffmpeg

    ff = imageio_ffmpeg.get_ffmpeg_exe()
    out = subprocess.run([ff, "-i", str(video)], capture_output=True, text=True)
    detected: float | None = None
    for line in out.stderr.splitlines():
        if "Duration" in line or "Stream #" in line:
            print(line.strip())
        if detected is None and "Video:" in line:
            m = FPS_RE.search(line)
            if m:
                detected = float(m.group(1))
    return detected


def transcribe(video: Path, part: int, fps: int, language: str, model: str, force: bool) -> Path:
    """Run faster-whisper over `video`, writing Video_NN/notes.txt."""
    banner(f"Transcribe part {part}")
    out = video_dir(part) / "notes.txt"

    if out.is_file() and out.stat().st_size > 0 and not force:
        print(f"Exists: {out} -- use --force to re-transcribe")
        return out

    # Imported lazily: this pulls in CUDA DLLs and the whisper model loader,
    # which is wasted work on a screenshots-only run.
    mod = _load(TRANSCRIBE_PY)
    mod.transcribe(
        video=video,
        out=out,
        model_size=model,
        fps=fps,
        language=language,
        device="cuda",
        compute_type="float16",
    )
    return out


def screenshots(video: Path, part: int, stamps: list[str]) -> Path:
    """Extract a JPG per timestamp into Video_NN/Screenshots."""
    banner(f"Screenshots part {part}")
    mod = _load(GRAB_PY)
    parsed = [mod.parse_timestamp(t) for t in stamps]

    out_dir = video_dir(part) / "Screenshots"
    out_dir.mkdir(parents=True, exist_ok=True)

    import imageio_ffmpeg

    ff = imageio_ffmpeg.get_ffmpeg_exe()
    for h, m, s in parsed:
        name = f"Part_{part}_{h:02d}_{m:02d}_{s:02d}.jpg"
        print(f"  -> {name}", flush=True)
        mod.extract_frame(ff, video, h, m, s, out_dir / name)

    print(f"{len(parsed)} frame(s) written to {out_dir}")
    return out_dir


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    ap.add_argument("--part", type=int, required=True, help="Video part number, e.g. 6")
    ap.add_argument("--url", help="YouTube URL; required the first time, cached after")
    ap.add_argument(
        "--shots",
        nargs="+",
        metavar="TS",
        default=None,
        help="Timestamps (MM:SS or HH:MM:SS) to capture as JPGs",
    )
    ap.add_argument(
        "--fps",
        type=int,
        default=24,
        help="Frame rate for the :FF timecode field (default 24, matching the 23.98 fps sources)",
    )
    ap.add_argument("--language", default="en", help="Language code for whisper (default en)")
    ap.add_argument("--model", default="large-v3", help="Whisper model size (default large-v3)")
    ap.add_argument("--no-transcribe", action="store_true", help="Skip the transcription step")
    ap.add_argument("--force", action="store_true", help="Redo steps whose output already exists")
    args = ap.parse_args(argv)

    vdir = video_dir(args.part)
    if not vdir.is_dir():
        ap.error(f"No such part directory: {vdir}")

    cached = CACHE / f"part{args.part}.mp4"
    if args.url:
        video = download(args.url, args.part, args.force)
    elif cached.is_file():
        video = cached
        print(f"Using cached video {video}")
    else:
        ap.error(f"No cached video at {cached}; pass --url to download it first")

    detected = probe(video)
    if detected is not None and abs(detected - args.fps) > 0.5:
        print(
            f"\nWARNING: source is {detected} fps but --fps is {args.fps}. "
            f"The :FF field in notes.txt will not match real frame numbers.\n"
            f"         Re-run with --fps {round(detected)} for accurate frames.",
            flush=True,
        )

    if not args.no_transcribe:
        transcribe(video, args.part, args.fps, args.language, args.model, args.force)

    if args.shots:
        screenshots(video, args.part, args.shots)
    else:
        print(
            f"\nNo --shots given. Read {vdir / 'notes.txt'}, pick timestamps, then run:\n"
            f"  python scripts/process_video.py --part {args.part} --shots 5:35 8:25 ..."
        )

    print(f"\nDone with part {args.part}.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
