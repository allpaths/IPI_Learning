"""Transcribe a local video file with segment timestamps using faster-whisper.

Produces a text file in the same format as ``Video_01/notes.txt``:

    [HH:MM:SS:FF - HH:MM:SS:FF]
     segment text ...

    [HH:MM:SS:FF - HH:MM:SS:FF]
     ...

The ``:FF`` field is a frame index derived from the sub-second portion of the
Whisper timestamp and the ``--fps`` flag (default 30). Set ``--fps`` to match
your source video so frames line up with DaVinci-style timecodes.

GPU prerequisites (CUDA build of faster-whisper / CTranslate2):
    - NVIDIA driver + CUDA 12 runtime
    - cuDNN 9 on PATH (or in the same dir as the python.exe)
    On Windows the simplest setup is::
        pip install faster-whisper nvidia-cublas-cu12 nvidia-cudnn-cu12

Example:
    python Video_02/transcribe.py "C:/videos/Part 2.mp4" --out Video_02/notes.txt
"""

from __future__ import annotations

import argparse
import os
import sys
import sysconfig
from pathlib import Path


def _register_nvidia_dlls() -> None:
    """On Windows, expose pip-installed NVIDIA DLL dirs to the runtime loader.

    CTranslate2 dlopen()s cublas / cudnn / nvrtc by short name, but the wheels
    drop them into ``site-packages/nvidia/<lib>/bin``, which is not on PATH.
    ``os.add_dll_directory`` covers loaders that use the AddDllDirectory list;
    prepending to ``PATH`` covers the rest (CTranslate2 falls into the latter).
    Must run before ``import faster_whisper``.
    """
    if sys.platform != "win32":
        return
    site = Path(sysconfig.get_paths()["purelib"]) / "nvidia"
    if not site.is_dir():
        return
    extra: list[str] = []
    for sub in ("cublas", "cudnn", "cuda_nvrtc"):
        bin_dir = site / sub / "bin"
        if bin_dir.is_dir():
            os.add_dll_directory(str(bin_dir))
            extra.append(str(bin_dir))
    if extra:
        os.environ["PATH"] = os.pathsep.join(extra + [os.environ.get("PATH", "")])


_register_nvidia_dlls()

from faster_whisper import WhisperModel  # noqa: E402


def format_timecode(seconds: float, fps: int) -> str:
    """Format `seconds` as HH:MM:SS:FF using `fps` for the frame field."""
    total = max(0.0, seconds)
    h = int(total // 3600)
    m = int((total % 3600) // 60)
    s = int(total % 60)
    frac = total - int(total)
    f = int(round(frac * fps))
    if f >= fps:  # rounding overflow
        f = 0
        s += 1
        if s >= 60:
            s = 0
            m += 1
            if m >= 60:
                m = 0
                h += 1
    return f"{h:02d}:{m:02d}:{s:02d}:{f:02d}"


def transcribe(
    video: Path,
    out: Path,
    model_size: str,
    fps: int,
    language: str | None,
    device: str,
    compute_type: str,
) -> None:
    print(f"Loading model {model_size!r} on {device} ({compute_type}) ...", flush=True)
    model = WhisperModel(model_size, device=device, compute_type=compute_type)

    print(f"Transcribing {video} ...", flush=True)
    segments, info = model.transcribe(
        str(video),
        language=language,
        vad_filter=True,
        beam_size=5,
    )
    print(f"Detected language: {info.language} (p={info.language_probability:.2f})", flush=True)
    print(f"Audio duration: {info.duration:.1f}s", flush=True)

    out.parent.mkdir(parents=True, exist_ok=True)
    n = 0
    with out.open("w", encoding="utf-8") as fh:
        for seg in segments:
            start = format_timecode(seg.start, fps)
            end = format_timecode(seg.end, fps)
            text = seg.text.strip()
            fh.write(f"[{start} - {end}]\n {text}\n\n")
            n += 1
            # progress: one dot per 10 segments
            if n % 10 == 0:
                print(f"  {n} segments ({seg.end:.1f}s)", flush=True)

    print(f"Done. {n} segments written to {out}", flush=True)


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    ap.add_argument("video", help="Path to the local video file")
    ap.add_argument("--out", required=True, help="Output transcript path (.txt)")
    ap.add_argument(
        "--model",
        default="large-v3",
        help="Whisper model size: tiny, base, small, medium, large-v2, large-v3 (default)",
    )
    ap.add_argument("--fps", type=int, default=30, help="Frames per second for :FF field (default 30)")
    ap.add_argument("--language", default=None, help="Force language code (e.g. 'en'); default = autodetect")
    ap.add_argument("--device", default="cuda", choices=["cuda", "cpu"], help="Inference device (default cuda)")
    ap.add_argument(
        "--compute-type",
        default="float16",
        help="Precision: float16 (GPU default), int8_float16, int8 (CPU), float32",
    )
    args = ap.parse_args(argv)

    video = Path(args.video).resolve()
    if not video.is_file():
        ap.error(f"Video not found: {video}")

    transcribe(
        video=video,
        out=Path(args.out).resolve(),
        model_size=args.model,
        fps=args.fps,
        language=args.language,
        device=args.device,
        compute_type=args.compute_type,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
