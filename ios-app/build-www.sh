#!/bin/sh
# Ana sürümden (Jotun Rehber) iPhone uygulaması için www klasörünü üretir.
set -e
cd "$(dirname "$0")"
rm -rf www && mkdir -p www
cp node_modules/html2canvas/dist/html2canvas.min.js www/
cp node_modules/jspdf/dist/jspdf.umd.min.js www/
{
  printf '<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="format-detection" content="telephone=no"></head><body style="margin:0">\n'
  sed -e 's#https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js#html2canvas.min.js#' \
      -e 's#https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js#jspdf.umd.min.js#' app.html
  printf '\n</body></html>\n'
} > www/index.html
