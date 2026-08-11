"""Rescale the :FF frame field in notes.txt timecodes to a different frame rate.

Parts 1-4 were transcribed with ``--fps 30`` against 23.98 fps sources, so the
frame field in their ``[HH:MM:SS:FF - HH:MM:SS:FF]`` headers counts in 30ths of
a second while the video runs in 24ths. The underlying time is intact -- only
the frame field needs rescaling, so this does not require re-running whisper::

    FF_new = round(FF_old / from_fps * to_fps)

Dry run (default) prints every line that would change and touches nothing::

    python scripts/retime_notes.py Video_01/notes.txt

Apply it::

    python scripts/retime_notes.py Video_01/notes.txt --apply

Accuracy note: the original float timestamps were already quantised to 1/30 s
when they were written, so re-quantising to 1/24 s leaves up to about one frame
of residual error. Only a re-transcribe recovers exact frames; this recovers a
frame field that is at least in the right numbering system.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

# A full header line: [HH:MM:SS:FF - HH:MM:SS:FF]
HEADER_RE = re.compile(
    r"^\[(\d{2}):(\d{2}):(\d{2}):(\d{2}) - (\d{2}):(\d{2}):(\d{2}):(\d{2})\]\s*$"
)


def convert_frame(ff: int, from_fps: int, to_fps: int) -> int:
    """Rescale a frame index between frame rates, clamped to the new range."""
    return min(to_fps - 1, round(ff / from_fps * to_fps))


def convert_header(line: str, from_fps: int, to_fps: int) -> str | None:
    """Return the rescaled header, or None if `line` isn't a timecode header."""
    m = HEADER_RE.match(line)
    if not m:
        return None
    h1, m1, s1, f1, h2, m2, s2, f2 = (int(g) for g in m.groups())
    n1 = convert_frame(f1, from_fps, to_fps)
    n2 = convert_frame(f2, from_fps, to_fps)
    return f"[{h1:02d}:{m1:02d}:{s1:02d}:{n1:02d} - {h2:02d}:{m2:02d}:{s2:02d}:{n2:02d}]\n"


def process(path: Path, from_fps: int, to_fps: int, apply: bool, limit: int) -> int:
    """Rescale one notes file. Returns the number of headers that changed."""
    original = path.read_text(encoding="utf-8").splitlines(keepends=True)
    out: list[str] = []
    changes: list[tuple[int, str, str]] = []
    headers = 0

    for i, line in enumerate(original, start=1):
        new = convert_header(line, from_fps, to_fps)
        if new is None:
            out.append(line)
            continue
        headers += 1
        out.append(new)
        if new != line:
            changes.append((i, line.rstrip("\n"), new.rstrip("\n")))

    print(f"\n{path}")
    print(f"  headers: {headers}   changed: {len(changes)}   unchanged: {headers - len(changes)}")

    shown = changes if limit <= 0 else changes[:limit]
    for ln, before, after in shown:
        print(f"  line {ln:>4}  - {before}")
        print(f"            + {after}")
    if len(changes) > len(shown):
        print(f"  ... {len(changes) - len(shown)} more (use --diff-limit 0 to see all)")

    if apply and changes:
        path.write_text("".join(out), encoding="utf-8")
        print(f"  WROTE {path}")
    elif not apply:
        print("  (dry run -- nothing written; pass --apply to write)")

    return len(changes)


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    ap.add_argument("files", nargs="+", help="notes.txt paths to rescale")
    ap.add_argument("--from-fps", type=int, default=30, help="Frame rate the file was written at (default 30)")
    ap.add_argument("--to-fps", type=int, default=24, help="Frame rate to convert to (default 24)")
    ap.add_argument("--apply", action="store_true", help="Write changes (default is a dry run)")
    ap.add_argument("--diff-limit", type=int, default=12, help="Max changed lines to print per file; 0 = all")
    args = ap.parse_args(argv)

    if args.from_fps == args.to_fps:
        ap.error("--from-fps and --to-fps are the same; nothing to do")

    paths = [Path(f).resolve() for f in args.files]
    for p in paths:
        if not p.is_file():
            ap.error(f"No such file: {p}")

    total = sum(process(p, args.from_fps, args.to_fps, args.apply, args.diff_limit) for p in paths)

    verb = "changed" if args.apply else "would change"
    print(f"\nTotal: {total} timecode header(s) {verb} across {len(paths)} file(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
