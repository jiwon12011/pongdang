# 퐁당 에셋 빌드 스크립트 — Windows용 (tools/build-assets.sh 와 동일 규격)
# 원본(assets/illustrations/individual_final)을 WebP로 축소해 app/assets/ 에 넣는다.
# 실행:  python tools/build-assets-win.py   (필요: Pillow — cwebp와 같은 libwebp 인코더 사용)
#
# build-assets.sh 와의 차이 한 가지: 원본 mtime 비교 대신 "출력 webp가 없을 때만" 생성한다.
# (Windows 체크아웃은 mtime이 전부 최신이라 mtime 규칙을 쓰면 기존 파일까지 전부
#  재생성되어 diff가 오염됨. 특정 파일을 다시 만들려면 해당 webp를 지우고 재실행.)
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "illustrations", "individual_final")
OUT = os.path.join(ROOT, "app", "assets")


def convert(src_png, out_webp, size, q):
    """긴 변을 size(px)로 리사이즈해 품질 q 로 저장 (cwebp -q Q -resize 규칙과 동일)"""
    im = Image.open(src_png)
    w, h = im.size
    if w >= h:
        nw, nh = size, max(1, round(h * size / w))
    else:
        nw, nh = max(1, round(w * size / h)), size
    if (nw, nh) != (w, h):
        im = im.resize((nw, nh), Image.LANCZOS)
    # method=4 = cwebp 기본값
    im.save(out_webp, "WEBP", quality=q, method=4)


def resize_dir(src, out, size, q):
    os.makedirs(out, exist_ok=True)
    n = 0
    for f in sorted(os.listdir(src)):
        if not f.endswith(".png"):
            continue
        dst = os.path.join(out, f[:-4] + ".webp")
        if not os.path.exists(dst):  # 신규분만 (기존 webp 재생성 금지)
            convert(os.path.join(src, f), dst, size, q)
            n += 1
    total = len([x for x in os.listdir(out) if x.endswith(".webp")])
    print(f"  {os.path.basename(out)}: {total}개 (갱신 {n})")


def main():
    print(f"→ 에셋 변환 중... ({SRC})")
    # 규격은 build-assets.sh 와 동일하게 유지할 것
    resize_dir(os.path.join(SRC, "fish"), os.path.join(OUT, "fish"), 256, 82)
    # 배경·어항은 q72 (perf 실측: q80 대비 -20%, 화질 차이 없음)
    resize_dir(os.path.join(SRC, "backgrounds"), os.path.join(OUT, "backgrounds"), 1280, 72)
    resize_dir(os.path.join(SRC, "aquarium", "back"), os.path.join(OUT, "aquarium", "back"), 1280, 72)
    resize_dir(os.path.join(SRC, "aquarium", "front"), os.path.join(OUT, "aquarium", "front"), 1280, 72)
    resize_dir(os.path.join(SRC, "ui", "icons"), os.path.join(OUT, "icons"), 128, 85)
    resize_dir(os.path.join(SRC, "decorations"), os.path.join(OUT, "decor"), 256, 82)
    resize_dir(os.path.join(SRC, "receipt"), os.path.join(OUT, "receipt"), 640, 80)

    # individual_final 에 없는 아이콘 보충 (batch01 톤, 필요분만 지정해서 가져옴)
    extra_icon_src = os.path.join(ROOT, "assets", "illustrations", "ui", "icons")
    for name in ["icon_catalogue"]:
        f = os.path.join(extra_icon_src, name + ".png")
        o = os.path.join(OUT, "icons", name + ".webp")
        if os.path.exists(f) and not os.path.exists(o):
            convert(f, o, 128, 85)
            print(f"  icons(보충): {name}")

    # 파일 목록 매니페스트 자동 생성 (build-assets.sh 와 동일 포맷/순서)
    lines = []
    for cat in ["fish", "backgrounds", "aquarium/back", "aquarium/front", "icons", "decor", "receipt"]:
        key = cat.replace("/", "_")
        d = os.path.join(OUT, *cat.split("/"))
        names = sorted(x[:-5] for x in os.listdir(d) if x.endswith(".webp")) if os.path.isdir(d) else []
        lines.append('  "%s": [%s]' % (key, ", ".join('"%s"' % n for n in names)))
    with open(os.path.join(OUT, "file-list.json"), "w", newline="\n") as fp:
        fp.write("{\n" + ",\n".join(lines) + "\n}\n")

    total = 0
    for dirpath, _, files in os.walk(OUT):
        total += sum(os.path.getsize(os.path.join(dirpath, x)) for x in files)
    print(f"→ 완료. 총 용량: {total / 1024 / 1024:.1f}MB  /  파일 목록: app/assets/file-list.json")


if __name__ == "__main__":
    sys.exit(main())
