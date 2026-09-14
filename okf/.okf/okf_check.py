"""OKF v0.2 conformance check: frontmatter/type, index/log rules, links, sources, footnotes."""
import sys, re, pathlib, yaml
root = pathlib.Path(sys.argv[1]).resolve()
errs = []
def fm(p):
    t = p.read_text(encoding="utf-8")
    if not t.startswith("---\n"): return None, t
    end = t.find("\n---\n", 4)
    return yaml.safe_load(t[4:end]), t[end+5:]
for p in sorted(root.rglob("*.md")):
    rel = p.relative_to(root)
    meta, body = fm(p)
    body = re.sub(r"`[^`\n]*`", "", re.sub(r"(?ms)^```.*?^```", "", body))
    if p.name == "index.md":
        if meta is not None and (rel != pathlib.Path("index.md") or set(meta) != {"okf_version"}):
            errs.append(f"{rel}: index.md frontmatter only allowed at root with okf_version")
    elif p.name == "log.md":
        if meta is not None: errs.append(f"{rel}: log.md must not have frontmatter")
    else:
        if not isinstance(meta, dict) or not meta.get("type"):
            errs.append(f"{rel}: missing frontmatter/type"); continue
        for s in meta.get("sources", []) or []:
            r = s.get("resource", "")
            if not r: errs.append(f"{rel}: source without resource")
            elif not r.startswith("http") and not (p.parent / r).exists():
                errs.append(f"{rel}: source path missing {r}")
        ids = {s.get("id") for s in meta.get("sources", []) or []}
        for fn in set(re.findall(r"\[\^([\w-]+)\]", body)):
            if fn not in ids: errs.append(f"{rel}: footnote [^{fn}] not in sources")
        r = meta.get("resource")
        if r and not r.startswith("http") and not (p.parent / r).exists():
            errs.append(f"{rel}: resource missing {r}")
    for link in re.findall(r"\]\(([^)\s]+)\)", body):
        link = link.split("#")[0]
        if not link or link.startswith("http"): continue
        target = root / link.lstrip("/") if link.startswith("/") else p.parent / link
        if not target.exists(): errs.append(f"{rel}: broken link {link}")
    print("ok " if not [e for e in errs if e.startswith(str(rel))] else "ERR", rel)
print("\n".join(errs) or "CONFORMANT")
