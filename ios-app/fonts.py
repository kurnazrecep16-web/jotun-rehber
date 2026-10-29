# fontsource CSS'inden latin ve latin-ext yüzlerini alıp www/fonts.css üretir
import re,shutil,os,sys
out=[]
for pkg,ws in [("barlow-condensed",[600,700]),("ibm-plex-sans",[400,500,600]),("ibm-plex-mono",[400,500])]:
    for w in ws:
        css=open(f"node_modules/@fontsource/{pkg}/{w}.css").read()
        for blk in re.findall(r"/\* ([^*]+) \*/\s*(@font-face \{.*?\})",css,re.S):
            name,body=blk
            if not re.search(r"-latin(-ext)?-\d+-normal$",name.strip()): continue
            f=name.strip()+".woff2"
            shutil.copy(f"node_modules/@fontsource/{pkg}/files/{f}","www/fonts/"+f)
            body=re.sub(r"src:[^;]+;",f"src: url(fonts/{f}) format('woff2');",body)
            out.append(body)
open("www/fonts.css","w").write("\n".join(out))
print(len(out))
