#!/bin/sh
# Ana sürümden (JTN Endüstri Rehber) iPhone uygulaması için www klasörünü üretir.
# Kütüphaneler ve yazı tipleri uygulamanın içine konur; uygulama internetsiz çalışır.
set -e
cd "$(dirname "$0")"
rm -rf www && mkdir -p www/fonts
cp node_modules/html2canvas/dist/html2canvas.min.js www/
cp node_modules/jspdf/dist/jspdf.umd.min.js www/
python3 fonts.py
{
  printf '<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="format-detection" content="telephone=no"></head><body style="margin:0">\n'
  sed -e 's#https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js#html2canvas.min.js#' \
      -e 's#https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js#jspdf.umd.min.js#' \
      -e 's#https://fonts.googleapis.com/css2?[^"]*#fonts.css#' app.html
  printf '\n</body></html>\n'
} > www/index.html
