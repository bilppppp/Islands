"""Readable derivatives for common binary/web documents; originals remain untouched."""
import re
import sys
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse
from zipfile import ZipFile

GITHUB_NAME = re.compile(r"^[A-Za-z0-9._-]+$")

class ArticleText(HTMLParser):
    def __init__(self, collect_hrefs=False):
        super().__init__()
        self.skip = 0
        self.text = []
        self.hrefs = []
        self.collect_hrefs = collect_hrefs
    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "noscript", "svg"):
            self.skip += 1
        if tag in ("p", "h1", "h2", "h3", "li", "pre", "br", "section", "article") and not self.skip:
            self.text.append("\n")
        if self.collect_hrefs and tag == "a" and not self.skip:
            for name, value in attrs:
                if name == "href" and value:
                    self.hrefs.append(value)
                    break
    def handle_endtag(self, tag):
        if tag in ("script", "style", "noscript", "svg"):
            self.skip = max(0, self.skip - 1)
        if tag in ("p", "li", "pre") and not self.skip:
            self.text.append("\n")
    def handle_data(self, data):
        if not self.skip:
            self.text.append(data)

def github_repo_url(href, base=None):
    if not href or any(ord(c) < 32 or c == "\x7f" for c in href):
        return None
    try:
        parsed = urlparse(urljoin(base, href) if base else href)
    except ValueError:
        return None
    scheme = parsed.scheme.lower()
    if scheme not in ("http", "https"):
        return None
    if parsed.username is not None or parsed.password is not None:
        return None
    if (parsed.hostname or "").lower() != "github.com":
        return None
    if parsed.port not in (None, 80 if scheme == "http" else 443):
        return None
    parts = parsed.path.split("/")
    if not parsed.path.startswith("/") or any(p == "" or p in (".", "..") for p in parts[1:]):
        return None
    segs = parts[1:]
    if len(segs) < 5 or segs[2] not in ("edit", "blob"):
        return None
    owner, repo = segs[0], segs[1][:-4] if segs[1].lower().endswith(".git") else segs[1]
    if owner in ("", ".", "..") or repo in ("", ".", "..") or "%" in owner or "%" in repo:
        return None
    if any(ord(c) < 32 or c == "\x7f" for c in owner + repo):
        return None
    if not GITHUB_NAME.fullmatch(owner) or not GITHUB_NAME.fullmatch(repo):
        return None
    return f"https://github.com/{owner.lower()}/{repo.lower()}"

def check_llms_txt(hrefs, text, raw_html, base):
    for h in hrefs:
        try:
            joined = urljoin(base, h)
            p = urlparse(joined)
            path = p.path.lower()
            if path.endswith("/llms.txt") or path == "llms.txt" or path.endswith("/llms-full.txt") or path == "llms-full.txt":
                return True, joined
        except Exception:
            continue
    m = re.search(r"https?://[^\s<>'\"`)]+?/(?:llms|llms-full)\.txt\b", raw_html, re.I)
    if m:
        return True, m.group(0)
    m = re.search(r"https?://[^\s<>'\"`)]+?/(?:llms|llms-full)\.txt\b", text, re.I)
    if m:
        return True, m.group(0)
    if re.search(r"\bllms(?:-full)?\.txt\b", text, re.I) or re.search(r"\bllms(?:-full)?\.txt\b", raw_html, re.I):
        return True, urljoin(base, "/llms.txt")
    return False, None

def check_markdown_version(hrefs, text, raw_html, base):
    try:
        base_parsed = urlparse(base)
        base_host = (base_parsed.hostname or "").lower()
    except Exception:
        base_host = ""
    if base_host in ("github.com", "raw.githubusercontent.com"):
        return False
    for h in hrefs:
        try:
            joined = urljoin(base, h)
            p = urlparse(joined)
            p_host = (p.hostname or "").lower()
            if p_host in ("github.com", "raw.githubusercontent.com"):
                continue
            path_lower = p.path.lower()
            if any(seg in path_lower for seg in ("/blob/", "/tree/", "/edit/")):
                continue
            if path_lower.endswith("/readme.md") or path_lower == "readme.md" or path_lower == "/readme.md":
                continue
            if base_host and p_host == base_host and path_lower.endswith(".md"):
                if not path_lower.endswith("llms.txt"):
                    return True
        except Exception:
            continue
    if re.search(r"(?:append(?:ing)?|add(?:ing)?|把|将|在)\s*`?\.md`?\s*(?:加到|追加到|放在|拼在|后|末尾|to\s+(?:the\s+)?(?:page\s+)?url|to\s+url)", text, re.I):
        return True
    if re.search(r"`?\.md`?\s*(?:added\s+to|append(?:ed)?\s+to|at\s+the\s+end\s+of|to\s+(?:the\s+)?(?:page\s+)?url)", text, re.I):
        return True
    if re.search(r"markdown\s*(?:versions?|版本)", text, re.I) and re.search(r"\.md\b", text, re.I):
        return True
    if re.search(r"`?\.md`?.*?(?:url|链接|地址)|(?:url|链接|地址).*?`?\.md`?", text, re.I) and re.search(r"(?:加|追加|后缀|append|add|version|版本)", text, re.I):
        return True
    return False

def hint_page_clues(hrefs, text, base, raw_html=""):
    if not base:
        return
    has_llms, llms_url = check_llms_txt(hrefs, text, raw_html, base)
    has_md = check_markdown_version(hrefs, text, raw_html, base)
    if not has_llms and not has_md:
        return
    parts = []
    if has_llms:
        parts.append(f"llms.txt（{llms_url}）")
    if has_md:
        parts.append("Markdown 版本")
    clues = " / ".join(parts)
    print(f"提示：入口页提到 {clues}；如需更多页面，可用自己的网页工具查看后选取。", file=sys.stderr, flush=True)

def hint_github_repos(hrefs, base, single_page=True):
    seen = set()
    for href in hrefs:
        try:
            repo = github_repo_url(href, base)
        except Exception:
            continue
        if not repo or repo in seen:
            continue
        seen.add(repo)
        if single_page:
            print(f"提示：页面的编辑/源文件链接指向文档源码仓库 {repo}；如需多页文档，建议改用 --source {repo}。本次仍仅保存入口页。", file=sys.stderr, flush=True)
        else:
            print(f"提示：入口页的编辑/源文件链接指向文档源码仓库 {repo}。", file=sys.stderr, flush=True)

hints_only = "--github-hints-only" in sys.argv[1:]
argv = [a for a in sys.argv[1:] if a != "--github-hints-only"]
path = Path(argv[0])
kind = argv[1] if len(argv) > 1 else path.suffix.lower()
page_url = argv[2] if len(argv) > 2 else ""
hrefs = []
raw_html = ""
if kind == ".pdf":
    try:
        from pypdf import PdfReader
    except ImportError:
        raise SystemExit("PDF text extraction needs pypdf. Run: python3 -m pip install pypdf")
    text = "\n\n".join(f"## PDF page {i+1}\n{page.extract_text() or ''}" for i, page in enumerate(PdfReader(path).pages))
    if len(text.strip()) < 100:
        raise SystemExit("PDF has too little readable text (possibly scanned). Supply OCR/text; do not invent its contents.")
elif kind == ".docx":
    with ZipFile(path) as doc:
        xml = ET.fromstring(doc.read("word/document.xml"))
    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    text = "\n".join("".join(p.itertext()) for p in xml.findall(".//w:p", ns))
elif kind in (".html", ".htm"):
    raw_html = path.read_text(errors="replace")
    parser = ArticleText(collect_hrefs=bool(page_url))
    parser.feed(raw_html)
    text = "\n".join(line.strip() for line in "".join(parser.text).splitlines() if line.strip())
    hrefs = parser.hrefs
else:
    raise SystemExit(f"Unsupported extraction format: {kind}")
if hints_only:
    if page_url:
        try:
            hint_github_repos(hrefs, page_url, single_page=False)
        except Exception:
            pass
        try:
            hint_page_clues(hrefs, text, page_url, raw_html=raw_html)
        except Exception:
            pass
    sys.exit(0)
out = path.with_name(path.name + ".txt")
out.write_text(text, encoding="utf-8")
if page_url:
    try:
        hint_github_repos(hrefs, page_url)
    except Exception:
        pass
    try:
        hint_page_clues(hrefs, text, page_url, raw_html=raw_html)
    except Exception:
        pass
print(out)
