"""Import the designer's TKclock LP into the site.

Reads _design/tkclock-lp/index-vi.html (not in git), writes every embedded base64 asset to
public/tkclock/ and writes the HTML with only those data: URLs replaced by file URLs to
src/tkclock-lp/index.html, which src/pages/tkclock/index.astro outputs as is.
The only other changes are the owner's edits below (TITLE, REMOVE). Asset names follow the order of appearance in the HTML.

    python tools/import-tkclock-lp.py
"""
import base64
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "_design" / "tkclock-lp" / "index-vi.html"
OUT_HTML = ROOT / "src" / "tkclock-lp" / "index.html"
MEDIA = ROOT / "public" / "tkclock" / "media"
FONTS = ROOT / "public" / "tkclock" / "fonts"

WEBP = ["ph-sea", "ph-night", "ph-mount", "ph-fire",
        "wall-video-1-poster", "wall-video-2-poster", "wall-video-3-poster", "wall-video-4-poster",
        "desk"]
WOFF2 = ["dot", "bizg", "maru", "klee", "yusei", "hachi", "impact", "retro", "brush"]
MP4 = ["wall-video-1", "wall-video-2", "wall-video-3", "wall-video-4"]

# Browser tab title: product name only (owner's request, 2026-10-08)
TITLE = "TKclock"

# Parts of the designer's HTML the owner asked to drop (regex, each must match exactly once)
REMOVE = [
    # Note under the comparison table (2026-10-08)
    r'\n[ \t]*<p class="cmp__fine">.*?</p>',
]


def main() -> None:
    html = SRC.read_bytes().decode("utf-8")
    count = {"image/webp": 0, "font/woff2": 0, "video/mp4": 0}

    def repl(m: re.Match) -> str:
        kind, data = m.group(1), m.group(2)
        i = count[kind]
        count[kind] += 1
        if kind == "image/webp":
            path, url = MEDIA / f"{WEBP[i]}.webp", f"/tkclock/media/{WEBP[i]}.webp"
        elif kind == "font/woff2":
            path, url = FONTS / f"tk-{WOFF2[i]}.woff2", f"/tkclock/fonts/tk-{WOFF2[i]}.woff2"
        else:
            path, url = MEDIA / f"{MP4[i]}.mp4", f"/tkclock/media/{MP4[i]}.mp4"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(base64.b64decode(data))
        return url

    out = re.sub(r"data:(image/webp|font/woff2|video/mp4);base64,([A-Za-z0-9+/=]+)", repl, html)
    out, n = re.subn(r"<title>.*?</title>", f"<title>{TITLE}</title>", out, count=1)
    if n != 1:
        raise SystemExit("<title> not found")
    for pattern in REMOVE:
        out, n = re.subn(pattern, "", out, count=1, flags=re.S)
        if n != 1:
            raise SystemExit(f"not found: {pattern}")
    if count != {"image/webp": len(WEBP), "font/woff2": len(WOFF2), "video/mp4": len(MP4)}:
        raise SystemExit(f"unexpected asset count {count}; update the name lists")
    OUT_HTML.parent.mkdir(parents=True, exist_ok=True)
    OUT_HTML.write_bytes(out.encode("utf-8"))
    print(f"{OUT_HTML.relative_to(ROOT)}: {len(out)} bytes, assets {count}")


if __name__ == "__main__":
    main()
