#!/usr/bin/env sh
# Wraps trip-plan.html (artifact body) in a full HTML document for GitHub Pages.
set -e
cd "$(dirname "$0")"
mkdir -p docs
{
  printf '%s\n' '<!doctype html>' '<html lang="he" dir="rtl">' '<head>' \
    '<meta charset="utf-8">' \
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">' \
    '<meta name="theme-color" content="#F3F6F2">' \
    '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>' \
    '</head>' '<body>'
  cat trip-plan.html
  printf '%s\n' '</body>' '</html>'
} > docs/index.html
touch docs/.nojekyll
echo "built docs/index.html"
