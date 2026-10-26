"""แพ็ก source ของ frontend (ไฟล์ที่ git track เท่านั้น, ตัด package*.json ออก) เป็น zip

usage: python pack_frontend_source.py <list_file> <out_zip> [prefix]
"""
import sys, zipfile, os

lst, out = sys.argv[1], sys.argv[2]
prefix = sys.argv[3] if len(sys.argv) > 3 else "frontend/"

files = [l.strip().replace("\\", "/") for l in open(lst, encoding="utf-8") if l.strip()]
files = [f for f in files if os.path.isfile(f)]

if os.path.exists(out):
    os.remove(out)
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for f in sorted(files):
        z.write(f, prefix + f)

groups = {}
for f in files:
    top = f.split("/")[0] if "/" in f else "(root)"
    groups[top] = groups.get(top, 0) + 1
print("files:", len(files))
for k, v in sorted(groups.items(), key=lambda x: -x[1]):
    print(f"  {v:>4}  {k}")
print("zip size: %.2f MB" % (os.path.getsize(out) / 1048576.0))
