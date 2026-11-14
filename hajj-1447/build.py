#!/usr/bin/env python3
"""يدمج src/shared.css + src/core.js + src/ui.js داخل ثلاث صفحات HTML مستقلة (Single-File لكل صفحة)."""
import pathlib

root = pathlib.Path(__file__).parent
src, dist = root / "src", root / "dist"
dist.mkdir(exist_ok=True)
css = (src / "shared.css").read_text(encoding="utf-8")
js = (src / "core.js").read_text(encoding="utf-8") + "\n" + (src / "ui.js").read_text(encoding="utf-8")

CHART = '<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js" defer></script>\n'
PAGES = {
    "index": ("لوحة المؤشرات التنفيذية", CHART),
    "arrival": ("متابعة الوصول", ""),
    "departure": ("متابعة المغادرة", ""),
}
TPL = """<!doctype html>
<html lang="ar" dir="rtl" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#07182D">
<title>{title} — حجاج 1447هـ</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
{libs}<style>
{css}
</style>
</head>
<body data-page="{page}">
<header id="nav"></header>
<main id="app"></main>
<script>
{js}
</script>
</body>
</html>
"""
for page, (title, libs) in PAGES.items():
    (dist / f"{page}.html").write_text(TPL.format(title=title, libs=libs, css=css, js=js, page=page), encoding="utf-8")
    print("built", page, (dist / f"{page}.html").stat().st_size, "bytes")
