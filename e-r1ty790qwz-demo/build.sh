#!/bin/sh
cd "$(dirname "$0")"
{ cat head.html; cat /home/claude/demo.html; cat tail.html; } > index.html
sed -i "s/__BUILD__/$(date +%s)/" index.html
sed -i 's#fetch("home.json?t="#fetch("../e-6ica4f0gq5/home.json?t="#' index.html
