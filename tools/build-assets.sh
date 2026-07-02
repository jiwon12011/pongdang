#!/usr/bin/env bash
# 퐁당 웹 프로토타입용 에셋 빌드 스크립트
# 원본(assets/illustrations/individual_final, ~1MB/장)을 WebP로 축소해 app/assets/ 에 넣는다.
# 이미지가 바뀌거나 추가되면 이 스크립트만 다시 실행하면 된다:  bash tools/build-assets.sh
# 필요: cwebp (brew install webp)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/assets/illustrations/individual_final"
OUT="$ROOT/app/assets"

command -v cwebp >/dev/null || { echo "cwebp 필요: brew install webp"; exit 1; }

resize_dir() { # $1=원본 폴더  $2=출력 폴더  $3=최대 변(px)  $4=품질
  local src="$1" out="$2" size="$3" q="$4"
  mkdir -p "$out"
  local n=0
  for f in "$src"/*.png; do
    [ -e "$f" ] || continue
    local name; name="$(basename "$f" .png).webp"
    # 원본이 더 새것일 때만 다시 생성 (재실행 빠르게)
    if [ ! -e "$out/$name" ] || [ "$f" -nt "$out/$name" ]; then
      # 가로가 긴지 세로가 긴지에 따라 최대 변 기준 리사이즈
      local w h
      w=$(sips -g pixelWidth  "$f" | awk 'END{print $2}')
      h=$(sips -g pixelHeight "$f" | awk 'END{print $2}')
      if [ "$w" -ge "$h" ]; then
        cwebp -quiet -q "$q" -resize "$size" 0 "$f" -o "$out/$name"
      else
        cwebp -quiet -q "$q" -resize 0 "$size" "$f" -o "$out/$name"
      fi
      n=$((n+1))
    fi
  done
  echo "  $(basename "$out"): $(ls -1 "$out"/*.webp 2>/dev/null | wc -l | tr -d ' ')개 (갱신 $n)"
}

echo "→ 에셋 변환 중... ($SRC)"
resize_dir "$SRC/fish"           "$OUT/fish"           256  82
# 배경·어항은 q72 (perf 실측: q80 대비 -20%, 화질 차이 없음)
resize_dir "$SRC/backgrounds"    "$OUT/backgrounds"    1280 72
resize_dir "$SRC/aquarium/back"  "$OUT/aquarium/back"  1280 72
resize_dir "$SRC/aquarium/front" "$OUT/aquarium/front" 1280 72
resize_dir "$SRC/ui/icons"       "$OUT/icons"          128  85
resize_dir "$SRC/decorations"    "$OUT/decor"          256  82
resize_dir "$SRC/receipt"        "$OUT/receipt"        640  80

# individual_final 에 없는 아이콘 보충 (batch01 톤, 필요분만 지정해서 가져옴)
EXTRA_ICON_SRC="$ROOT/assets/illustrations/ui/icons"
for name in icon_catalogue; do
  f="$EXTRA_ICON_SRC/$name.png"
  o="$OUT/icons/$name.webp"
  if [ -e "$f" ] && { [ ! -e "$o" ] || [ "$f" -nt "$o" ]; }; then
    cwebp -quiet -q 85 -resize 128 0 "$f" -o "$o"
    echo "  icons(보충): $name"
  fi
done

# 파일 목록 매니페스트 자동 생성 (게임 데이터는 app/js/assets-data.js 에서 이 목록 위에 정의)
LIST="$OUT/file-list.json"
{
  echo '{'
  first_cat=1
  for cat in fish backgrounds aquarium/back aquarium/front icons decor receipt; do
    [ $first_cat -eq 1 ] || echo ','
    first_cat=0
    key="${cat/\//_}"
    printf '  "%s": [' "$key"
    first=1
    for f in "$OUT/$cat"/*.webp; do
      [ -e "$f" ] || continue
      [ $first -eq 1 ] || printf ', '
      first=0
      printf '"%s"' "$(basename "$f" .webp)"
    done
    printf ']'
  done
  echo
  echo '}'
} > "$LIST"

echo "→ 완료. 총 용량: $(du -sh "$OUT" | cut -f1)  /  파일 목록: app/assets/file-list.json"
