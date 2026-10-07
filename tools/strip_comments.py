"""Remove comments from a single HTML page with inline <style> and <script>.

Only comments (and the indentation / line they leave empty) are removed; every other character
stays. strip_html() returns the new text and the removed pieces, so callers can check that each
removed piece is a comment. KEEP lists HTML comments that must survive (markers used later).
"""
import re

KEEP = ("<!--soon-->", "<!--/soon-->")

_BLOCK = re.compile(r"(<style\b[^>]*>)(.*?)(</style>)|(<script\b[^>]*>)(.*?)(</script>)", re.S | re.I)

# After these characters a "/" starts a regular expression, otherwise it is a division
_REGEX_AFTER = set("(,=:[!&|?{};+-*%<>~^")
_REGEX_AFTER_WORDS = {"return", "typeof", "instanceof", "in", "of", "new", "delete", "void",
                      "throw", "case", "do", "else", "yield", "await"}


def _remove(text: str, spans: list[tuple[int, int]], removed: list[str]) -> str:
    """Cut spans out of text. A comment alone on its line takes the whole line with it;
    a trailing comment takes the spaces before it."""
    out, pos = [], 0
    for start, end in spans:
        line_start = text.rfind("\n", 0, start) + 1
        line_end = text.find("\n", end)
        line_end = len(text) if line_end == -1 else line_end
        before, after = text[line_start:start], text[end:line_end]
        if before.strip() == "" and after.strip() == "" and line_start >= pos:
            start, end = line_start, min(line_end + 1, len(text))
        else:
            while start > pos and text[start - 1] in " \t":
                start -= 1
        out.append(text[pos:start])
        removed.append(text[start:end])
        pos = end
    out.append(text[pos:])
    return "".join(out)


def _css_spans(css: str) -> list[tuple[int, int]]:
    spans, i, n = [], 0, len(css)
    while i < n:
        c = css[i]
        if c in "\"'":
            i += 1
            while i < n and css[i] != c:
                i += 2 if css[i] == "\\" else 1
            i += 1
        elif css.startswith("/*", i):
            end = css.find("*/", i + 2)
            if end == -1:
                raise ValueError("unterminated CSS comment")
            spans.append((i, end + 2))
            i = end + 2
        else:
            i += 1
    return spans


def _js_spans(js: str) -> list[tuple[int, int]]:
    spans, n = [], len(js)
    i = 0
    prev = ""          # last significant character outside comments
    word = ""          # last identifier, for "return /re/" etc.
    stack = []         # open template literals: brace depth inside each ${ }

    def skip_string(i: int, q: str) -> int:
        i += 1
        while i < n and js[i] != q:
            if js[i] == "\n":
                raise ValueError("newline in string literal")
            i += 2 if js[i] == "\\" else 1
        return i + 1

    def skip_template(i: int) -> int:
        """i is just after a backtick or a closing } of ${ }. Returns the index after the
        closing backtick, or after "${" (then the caller continues in code)."""
        while i < n:
            ch = js[i]
            if ch == "\\":
                i += 2
            elif ch == "`":
                return i + 1
            elif js.startswith("${", i):
                stack.append(0)
                return i + 2
            else:
                i += 1
        raise ValueError("unterminated template literal")

    while i < n:
        c = js[i]
        if c in " \t\r\n":
            i += 1
            continue
        if js.startswith("//", i):
            end = js.find("\n", i)
            end = n if end == -1 else end
            spans.append((i, end))
            i = end
            continue
        if js.startswith("/*", i):
            end = js.find("*/", i + 2)
            if end == -1:
                raise ValueError("unterminated JS comment")
            spans.append((i, end + 2))
            i = end + 2
            continue
        if c in "\"'":
            i = skip_string(i, c)
            prev, word = c, ""
            continue
        if c == "`":
            i = skip_template(i + 1)
            prev, word = "`", ""
            continue
        if c == "{" and stack:
            stack[-1] += 1
        elif c == "}" and stack:
            if stack[-1] == 0:
                stack.pop()
                i = skip_template(i + 1)
                prev, word = "`", ""
                continue
            stack[-1] -= 1
        if c == "/":
            if prev == "" or prev in _REGEX_AFTER or word in _REGEX_AFTER_WORDS:
                i += 1
                in_class = False
                while i < n:
                    ch = js[i]
                    if ch == "\\":
                        i += 2
                        continue
                    if ch == "\n":
                        raise ValueError("newline in regex literal")
                    if ch == "[":
                        in_class = True
                    elif ch == "]":
                        in_class = False
                    elif ch == "/" and not in_class:
                        break
                    i += 1
                i += 1
                while i < n and (js[i].isalnum() or js[i] == "_"):
                    i += 1
                prev, word = "/", ""
                continue
        if c.isalnum() or c in "_$":
            j = i
            while j < n and (js[j].isalnum() or js[j] in "_$"):
                j += 1
            word = js[i:j]
            prev = "a"
            i = j
            continue
        prev, word = c, ""
        i += 1
    if stack:
        raise ValueError("unterminated template literal")
    return spans


def _html_spans(html: str) -> list[tuple[int, int]]:
    spans = []
    for m in re.finditer(r"<!--.*?-->", html, re.S):
        if m.group(0) not in KEEP:
            spans.append(m.span())
    return spans


def strip_html(page: str) -> tuple[str, list[str]]:
    removed: list[str] = []
    out, pos = [], 0
    for m in _BLOCK.finditer(page):
        outside = page[pos:m.start()]
        out.append(_remove(outside, _html_spans(outside), removed))
        if m.group(1):
            open_tag, body, close_tag = m.group(1), m.group(2), m.group(3)
            body = _remove(body, _css_spans(body), removed)
        else:
            open_tag, body, close_tag = m.group(4), m.group(5), m.group(6)
            body = _remove(body, _js_spans(body), removed)
        out.append(open_tag + body + close_tag)
        pos = m.end()
    rest = page[pos:]
    out.append(_remove(rest, _html_spans(rest), removed))
    return "".join(out), removed


_COMMENT_PIECE = re.compile(r"\s*(//[^\n]*|/\*.*?\*/|<!--.*?-->)\s*", re.S)


def check_removed(removed: list[str]) -> None:
    """Every removed piece must be one comment plus surrounding whitespace."""
    for piece in removed:
        if not _COMMENT_PIECE.fullmatch(piece):
            raise SystemExit(f"removed something that is not a comment: {piece[:80]!r}")
