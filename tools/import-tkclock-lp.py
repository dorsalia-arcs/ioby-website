"""Import the designer's TKclock LP into the site.

Reads _design/tkclock-lp/index-vi.html (not in git), writes every embedded base64 asset to
public/tkclock/ and writes the HTML with only those data: URLs replaced by file URLs to
src/tkclock-lp/index.html, which src/pages/tkclock/index.astro outputs as is.
The only other changes are the owner's edits below (TITLE, REMOVE, REPLACE, INSERT; the inserted
blocks live in src/tkclock-lp/additions.css and sections.html). Every edit must find its anchor in
the designer's HTML, otherwise the script stops. Asset names follow the order of appearance in the HTML.
%%NAME%% markers and <!--soon--> blocks are resolved from src/data/site.ts by src/pages/tkclock/index.astro.

    python tools/import-tkclock-lp.py
"""
import base64
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "_design" / "tkclock-lp" / "index-vi.html"
OUT_HTML = ROOT / "src" / "tkclock-lp" / "index.html"
ADD_CSS = ROOT / "src" / "tkclock-lp" / "additions.css"
ADD_SECTIONS = ROOT / "src" / "tkclock-lp" / "sections.html"
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

STORE = 'href="%%STORE_URL%%"'
SOON = '<!--soon--><span class="soon">Microsoft Store で近日公開</span><!--/soon-->'


# Owner's edits (2026-10-08): (regex, replacement, expected number of matches)
REPLACE = [
    # Description: drop "インストール不要、" only
    (r'(<meta name="description" content="[^"]*?)インストール不要、', r'\1', 1),
    # Store buttons: labels and look stay; the link target comes from site.ts
    (r'href="#" data-todo="free-dl"', STORE, 3),
    (r'href="#" data-todo="buy"', STORE, 1),
    # "coming soon" notes near the buttons, in the LP's own caption styles
    (r'<p class="cover__os">', '<p class="cover__os">' + SOON, 1),
    (r'(<div class="cmp__ctas">.*?</div>)',
     r'\1' + '\n        <!--soon--><p class="cmp__fine">Microsoft Store で近日公開</p><!--/soon-->', 1),
    # Footer: link the font license, add legal links in the same .foot__base style
    (r'SIL Open Font License 1\.1', '<a href="%%FONT_LICENSE%%">SIL Open Font License 1.1</a>', 1),
    (r'(<footer class="foot">\s*<div class="wrap">\n)',
     r'\1' + '    <p class="foot__base foot__links"><a href="%%PRIVACY%%">プライバシーポリシー</a>'
     '<a href="%%TOKUSHOHO%%">特定商取引法に基づく表記</a>'
     '<a href="mailto:%%SUPPORT_EMAIL%%">お問い合わせ</a></p>\n', 1),
]

# Added blocks: (anchor regex, file, expected matches). The file goes right before the anchor.
INSERT = [
    (r'\n</main>', ADD_SECTIONS, 1),
    (r'\n</style>', ADD_CSS, 1),
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
    for pattern, replacement, expected in REPLACE:
        out, n = re.subn(pattern, replacement, out, flags=re.S)
        if n != expected:
            raise SystemExit(f"{pattern}: matched {n}, expected {expected}")
    for pattern, path, expected in INSERT:
        block = path.read_bytes().decode("utf-8").replace("\r\n", "\n").strip("\n")
        # "</style" anywhere in the CSS, even in a comment, ends the <style> element early
        if path.suffix == ".css" and re.search(r"</style", block, re.I):
            raise SystemExit(f"{path.name} must not contain '</style', even in comments")
        out, n = re.subn(pattern, lambda m: "\n" + block + "\n" + m.group(0), out)
        if n != expected:
            raise SystemExit(f"{pattern}: matched {n}, expected {expected}")
    if count != {"image/webp": len(WEBP), "font/woff2": len(WOFF2), "video/mp4": len(MP4)}:
        raise SystemExit(f"unexpected asset count {count}; update the name lists")
    OUT_HTML.parent.mkdir(parents=True, exist_ok=True)
    OUT_HTML.write_bytes(out.encode("utf-8"))
    print(f"{OUT_HTML.relative_to(ROOT)}: {len(out)} bytes, assets {count}")


if __name__ == "__main__":
    main()
