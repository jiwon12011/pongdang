// ═══════════════════════════════════════════════════════════════
// assets-data.js — 종 데이터·에셋 매핑의 단일 소스
// 이미지가 바뀌면 이 파일만 고치면 된다 (id = 파일명, 확장자 .webp)
// ═══════════════════════════════════════════════════════════════

const BASE = './assets';

// ── 에셋 경로 헬퍼 ──
export const src = {
  fish: (id) => `${BASE}/fish/${id}.webp`,
  bg: (id) => `${BASE}/backgrounds/${id}.webp`,
  tankBack: (id) => `${BASE}/aquarium/back/${id}_back.webp`,
  tankFront: (id) => `${BASE}/aquarium/front/${id}_front.webp`,
  icon: (id) => `${BASE}/icons/${id}.webp`,
  decor: (id) => `${BASE}/decor/${id}.webp`,
  receipt: (id) => `${BASE}/receipt/${id}.webp`,
};

// ── 희귀도 (enum 순서 = 사다리 비교 기준) ──
export const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
export const RARITY = {
  common:    { label: '흔함',  weight: 60, color: '#8AC6D1' },
  uncommon:  { label: '비범',  weight: 25, color: '#A8D8EA' },
  rare:      { label: '레어',  weight: 10, color: '#FFB6C1' },
  epic:      { label: '에픽',  weight: 4,  color: '#FF8A65' },
  legendary: { label: '전설',  weight: 1,  color: '#FFD700' },
};
export const rarityIdx = (r) => RARITY_ORDER.indexOf(r);

// ── 시간대 4구간 (설계서 ⑥: 새벽 04–07 / 낮 07–16:30 / 노을 16:30–19:30 / 밤 19:30–04) ──
export const TIMEBANDS = {
  dawn:   { label: '새벽', emojiDecor: 'decor_final_007_spiral_shell',   homeBg: 'bg_final_008_morning_mint' },
  day:    { label: '낮',   emojiDecor: 'decor_final_009_sun_sticker',    homeBg: 'bg_final_002_pastel_blue_bubbles' },
  sunset: { label: '노을', emojiDecor: 'decor_final_006_pink_ribbon_bow', homeBg: 'bg_final_003_sunset_coral_diary' },
  night:  { label: '밤',   emojiDecor: 'decor_final_008_moon_charm',     homeBg: 'bg_final_004_night_navy_moon' },
};

// 분 단위(자정 기준)로 시간대 판정
export function timebandOf(date = new Date()) {
  const m = date.getHours() * 60 + date.getMinutes();
  if (m >= 240 && m < 420) return 'dawn';    // 04:00–07:00
  if (m >= 420 && m < 990) return 'day';     // 07:00–16:30
  if (m >= 990 && m < 1170) return 'sunset'; // 16:30–19:30
  return 'night';                            // 19:30–04:00
}

// ── 어항 시간대 4변형 (설계서 ⑥ 표 그대로) ──
export const AQUARIUM_VARIANTS = {
  dawn:   { tank: 'aquarium_final_005_pearl_dome',       bg: 'bg_final_008_morning_mint' },
  day:    { tank: 'aquarium_individual_day_rounded',     bg: 'bg_final_001_cream_underwater_diary' },
  sunset: { tank: 'aquarium_final_002_sunset_rounded',   bg: 'bg_final_003_sunset_coral_diary' },
  night:  { tank: 'aquarium_final_003_night_rounded',    bg: 'bg_final_004_night_navy_moon' },
};

// ── 어항 공용 추가 변형 8종 (2차 배치) — 세션 시작 시 시간대 변형 1 + 이 8개에서 균등 랜덤 ──
export const AQUARIUM_EXTRA_TANKS = [
  'aquarium_final_006_square_sticker',
  'aquarium_final_007_hanging_bag',
  'aquarium_final_008_round_candy',
  'aquarium_final_009_tall_capsule',
  'aquarium_final_010_wide_lagoon',
  'aquarium_final_011_vase_bowl',
  'aquarium_final_012_shell_window',
  'aquarium_final_013_round_pot',
];

// ── 홈 배경 풀 (designer 확정) — [0] = 기존 기본, 017·027은 두 풀 겸용 ──
export const HOME_BG_POOLS = {
  dawn: [
    'bg_final_008_morning_mint', 'bg_final_017_pink_shell_diary', 'bg_final_024_misty_lavender_depth',
    'bg_final_027_pearl_white_quiet', 'bg_final_029_mint_morning_bubbles', 'bg_final_035_lavender_shell_corners',
  ],
  day: [
    'bg_final_002_pastel_blue_bubbles', 'bg_final_016_pale_green_window_water', 'bg_final_018_cloudy_blue_underwater',
    'bg_final_019_yellow_morning_tide', 'bg_final_025_warm_sticker_ocean', 'bg_final_027_pearl_white_quiet',
    'bg_final_032_green_aquatic_notebook', 'bg_final_033_cream_pebble_bottom',
  ],
  sunset: [
    'bg_final_003_sunset_coral_diary', 'bg_final_017_pink_shell_diary',
    'bg_final_021_soft_coral_arch', 'bg_final_031_cotton_candy_water',
  ],
  night: [
    'bg_final_004_night_navy_moon', 'bg_final_022_midnight_starry_water',
    'bg_final_028_soft_purple_sleep_sea', 'bg_final_030_deep_blue_receipt_night',
  ],
};

// ── 과거 어항 배경 풀 = 신규 20장 전부 (020·023·026·034는 홈 금지 — 가독 보호, 여기 전용) ──
export const PAST_TANK_BG_POOL = [
  'bg_final_016_pale_green_window_water', 'bg_final_017_pink_shell_diary', 'bg_final_018_cloudy_blue_underwater',
  'bg_final_019_yellow_morning_tide', 'bg_final_020_gray_rain_glass_water', 'bg_final_021_soft_coral_arch',
  'bg_final_022_midnight_starry_water', 'bg_final_023_blue_grid_sea_tiles', 'bg_final_024_misty_lavender_depth',
  'bg_final_025_warm_sticker_ocean', 'bg_final_026_sakura_tide_pool', 'bg_final_027_pearl_white_quiet',
  'bg_final_028_soft_purple_sleep_sea', 'bg_final_029_mint_morning_bubbles', 'bg_final_030_deep_blue_receipt_night',
  'bg_final_031_cotton_candy_water', 'bg_final_032_green_aquatic_notebook', 'bg_final_033_cream_pebble_bottom',
  'bg_final_034_blue_rainbow_bubbles', 'bg_final_035_lavender_shell_corners',
];

// ── 결정적 선택: 같은 시드 → 항상 같은 장 (렌더마다 바뀌면 안 되는 곳엔 Math.random 금지) ──
// 시드 예: 홈 배경 = 오늘 날짜(YYYYMMDD), 과거 어항 배경 = session.id
export function pickBySeed(pool, seed) {
  let h = 7;
  for (const c of String(seed)) h = (h * 31 + c.charCodeAt(0)) % 100000;
  return pool[h % pool.length];
}

// ── 지속시간 = 희귀도 사다리 (콘셉트 ③ 표 그대로, 룰=데이터) ──
// min: 임계분 / count: 마리수 / ceiling: 천장 rarity / guarantee: 보장 rarity
export const DURATION_TIERS = [
  { min: 15,  count: 1, ceiling: 'common',    guarantee: null,        name: '발담그기' },
  { min: 30,  count: 2, ceiling: 'uncommon',  guarantee: null,        name: '물장구' },
  { min: 60,  count: 3, ceiling: 'rare',      guarantee: 'uncommon',  name: '자맥질' },
  { min: 90,  count: 4, ceiling: 'epic',      guarantee: 'rare',      name: '깊은숨' },
  { min: 120, count: 5, ceiling: 'legendary', guarantee: 'epic',      name: '잠영' },
  { min: 180, count: 5, ceiling: 'legendary', guarantee: 'legendary', name: '심해 잠수꾼', stamp: true },
];

export const GOAL_CHOICES = [15, 30, 60, 90, 120, 180]; // 홈 목표시간 선택지

// ── 물고기 90종 (id=파일명 / 희귀도 배분: 흔함43·비범23·레어15·에픽7·전설2) ──
// tags: 시간대 태그 — 해당 시간대 세션에서 등장 가중치 ×2
export const FISH = [
  // ─ 흔함 24 ─
  { id: 'fish_final_005_pink_jelly_blob',        name: '분홍몽글이',   rarity: 'common' },
  { id: 'fish_final_007_orange_shrimp_like',     name: '새우동동',     rarity: 'common' },
  { id: 'fish_final_009_blue_striped',           name: '줄무늬파랑이', rarity: 'common' },
  { id: 'fish_final_010_yellow_sun_puffer',      name: '햇살복어',     rarity: 'common', tags: ['day'] },
  { id: 'fish_final_011_lavender_shy',           name: '부끄럼보라',   rarity: 'common' },
  { id: 'fish_final_012_cream_eel_like',         name: '미끌크림',     rarity: 'common' },
  { id: 'fish_final_015_green_leaf_fin',         name: '이파리지느러미', rarity: 'common' },
  { id: 'fish_final_020_silver_anchovy',         name: '은빛멸치',     rarity: 'common' },
  { id: 'fish_final_021_cream_dumpling',         name: '물만두',       rarity: 'common' },
  { id: 'fish_final_023_blue_round_sunfish',     name: '동글개복치',   rarity: 'common' },
  { id: 'fish_final_028_sleepy_cloud',           name: '졸린구름',     rarity: 'common', tags: ['dawn'] },
  { id: 'fish_final_029_mint_polka_dot',         name: '민트땡땡이',   rarity: 'common' },
  { id: 'fish_final_031_bubble_cheek',           name: '뽀글볼따구',   rarity: 'common' },
  { id: 'fish_final_032_sleepy_striped',         name: '꾸벅줄무늬',   rarity: 'common', tags: ['night'] },
  { id: 'fish_final_033_tiny_rain',              name: '이슬비',       rarity: 'common', tags: ['dawn'] },
  { id: 'fish_final_036_peach_fan_tail',         name: '복숭아부채꼬리', rarity: 'common', tags: ['sunset'] },
  { id: 'fish_final_041_tiny_blue_betta',        name: '꼬마베타',     rarity: 'common' },
  { id: 'fish_final_042_orange_clown_round',     name: '동글광대',     rarity: 'common' },
  { id: 'fish_final_044_gray_sleepy_catfish',    name: '잠꾸러기메기', rarity: 'common', tags: ['night'] },
  { id: 'fish_final_047_soda_blue_guppy',        name: '소다구피',     rarity: 'common' },
  { id: 'fish_final_048_pumpkin_orange_blobfish', name: '호박몽치',    rarity: 'common' },
  { id: 'fish_individual_long_coral_right',      name: '산호길쭉이',   rarity: 'common' },
  { id: 'fish_individual_puffer_teal_left',      name: '청록복어',     rarity: 'common' },
  { id: 'fish_individual_round_blue_left',       name: '파랑동글이',   rarity: 'common' },
  // ─ 비범 13 ─
  { id: 'fish_final_006_mint_moon_tail',         name: '민트달꼬리',   rarity: 'uncommon', tags: ['night'] },
  { id: 'fish_final_008_cream_sleepy_manta',     name: '꾸벅가오리',   rarity: 'uncommon', tags: ['dawn'] },
  { id: 'fish_final_013_peach_heart_tail',       name: '복숭아하트',   rarity: 'uncommon', tags: ['sunset'] },
  { id: 'fish_final_014_blue_tiny_whale',        name: '아기고래',     rarity: 'uncommon' },
  { id: 'fish_final_018_red_tiny_octopus',       name: '꼬마문어',     rarity: 'uncommon' },
  { id: 'fish_final_019_pale_blue_jellyfish',    name: '말간해파리',   rarity: 'uncommon' },
  { id: 'fish_final_022_pink_shellfish_friend',  name: '조개단짝',     rarity: 'uncommon' },
  { id: 'fish_final_025_pastel_ribbon',          name: '파스텔리본',   rarity: 'uncommon' },
  { id: 'fish_final_034_tiny_love',              name: '콩닥콩닥',     rarity: 'uncommon' },
  { id: 'fish_final_038_cream_blob_squid',       name: '몽글오징어',   rarity: 'uncommon' },
  { id: 'fish_final_039_lavender_shell_fish',    name: '보라소라지기', rarity: 'uncommon' },
  { id: 'fish_final_043_pale_starfish_buddy',    name: '별손님',       rarity: 'uncommon' },
  { id: 'fish_final_046_cookie_spotted_ray',     name: '쿠키가오리',   rarity: 'uncommon' },
  // ─ 레어 8 ─
  { id: 'fish_final_026_turtle_friend',          name: '느긋거북',     rarity: 'rare' },
  { id: 'fish_final_027_blue_star_ray',          name: '별빛가오리',   rarity: 'rare', tags: ['night'] },
  { id: 'fish_final_030_coral_comet',            name: '산호혜성',     rarity: 'rare', tags: ['sunset'] },
  { id: 'fish_final_035_green_spotted_moonfish', name: '달점박이',     rarity: 'rare' },
  { id: 'fish_final_037_blue_pencil_shark',      name: '연필상어',     rarity: 'rare' },
  { id: 'fish_final_040_mint_leafy_seadragon',   name: '이파리해룡',   rarity: 'rare' },
  { id: 'fish_final_045_pink_pearl_fish',        name: '진주분홍이',   rarity: 'rare', tags: ['dawn'] },
  { id: 'fish_final_049_milk_blue_seahorse',     name: '우유해마',     rarity: 'rare' },
  // ─ 에픽 4 ─
  { id: 'fish_final_016_white_ghost',            name: '흰물결유령',   rarity: 'epic', tags: ['dawn'] },
  { id: 'fish_final_017_dark_teal_starry',       name: '별박이심해',   rarity: 'epic', tags: ['night'] },
  { id: 'fish_final_050_navy_moon_jelly',        name: '달밤해파리',   rarity: 'epic', tags: ['night'] },
  { id: 'fish_individual_rare_night_moon_right', name: '달그림자',     rarity: 'epic', tags: ['night'] },
  // ─ 전설 1 ─
  { id: 'fish_final_024_golden_legendary',       name: '황금비늘',     rarity: 'legendary' },

  // ── 2차 배치 40종 (051~090): 흔함19·비범10·레어7·에픽3·전설1 ──
  // ─ 흔함 19 ─
  { id: 'fish_final_051_yellow_raincoat_fish',   name: '노랑우비',     rarity: 'common', tags: ['day'] },
  { id: 'fish_final_052_pale_lime_boxfish',      name: '네모라임',     rarity: 'common' },
  { id: 'fish_final_053_peach_sleepy_koi',       name: '선잠잉어',     rarity: 'common', tags: ['dawn'] },
  { id: 'fish_final_054_blue_button_fish',       name: '파랑단추',     rarity: 'common' },
  { id: 'fish_final_056_mint_sleepy_tadpole',    name: '꾸벅올챙이',   rarity: 'common', tags: ['dawn'] },
  { id: 'fish_final_059_gray_sock_fish',         name: '양말치',       rarity: 'common' },
  { id: 'fish_final_061_blueberry_puffer',       name: '베리복어',     rarity: 'common' },
  { id: 'fish_final_065_coral_round_crab',       name: '동글게',       rarity: 'common' },
  { id: 'fish_final_066_yellow_banana_fish',     name: '바나나치',     rarity: 'common', tags: ['day'] },
  { id: 'fish_final_068_pink_candy_shrimp',      name: '사탕새우',     rarity: 'common' },
  { id: 'fish_final_069_cream_pillow_fish',      name: '폭신베개',     rarity: 'common', tags: ['night'] },
  { id: 'fish_final_072_blue_paperboat_fish',    name: '종이배',       rarity: 'common' },
  { id: 'fish_final_073_cream_sleepy_shell_snail', name: '쿨쿨달팽이', rarity: 'common', tags: ['night'] },
  { id: 'fish_final_078_blue_sleepy_sardine',    name: '새근정어리',   rarity: 'common', tags: ['night'] },
  { id: 'fish_final_082_blue_scarf_fish',        name: '파랑목도리',   rarity: 'common' },
  { id: 'fish_final_085_peach_bean_fish',        name: '복숭아콩',     rarity: 'common' },
  { id: 'fish_final_088_yellow_pudding_fish',    name: '노랑푸딩',     rarity: 'common' },
  { id: 'fish_final_089_lilac_sleepy_clam',      name: '잠꼬대조개',   rarity: 'common', tags: ['night'] },
  { id: 'fish_final_090_mint_star_puffer',       name: '별사탕복어',   rarity: 'common' },
  // ─ 비범 10 ─
  { id: 'fish_final_055_purple_sleep_shell',     name: '자장소라',     rarity: 'uncommon', tags: ['night'] },
  { id: 'fish_final_057_coral_flower_jelly',     name: '꽃해파리',     rarity: 'uncommon' },
  { id: 'fish_final_062_peach_ribbon_eel',       name: '리본장어',     rarity: 'uncommon', tags: ['sunset'] },
  { id: 'fish_final_075_mint_bubble_octopus',    name: '방울문어',     rarity: 'uncommon' },
  { id: 'fish_final_076_yellow_lantern_fish',    name: '등불고기',     rarity: 'uncommon', tags: ['night'] },
  { id: 'fish_final_077_coral_heart_crab',       name: '하트게',       rarity: 'uncommon', tags: ['sunset'] },
  { id: 'fish_final_079_peach_fluffy_jelly',     name: '보들해파리',   rarity: 'uncommon' },
  { id: 'fish_final_081_caramel_shell_turtle',   name: '달고나거북',   rarity: 'uncommon' },
  { id: 'fish_final_084_mint_leaf_ray',          name: '잎새가오리',   rarity: 'uncommon' },
  { id: 'fish_final_086_cream_ribbon_jelly',     name: '나풀해파리',   rarity: 'uncommon' },
  // ─ 레어 7 ─
  { id: 'fish_final_060_gold_star_tail_fish',    name: '금별꼬리',     rarity: 'rare', tags: ['night'] },
  { id: 'fish_final_063_mint_crown_fish',        name: '민트왕관',     rarity: 'rare' },
  { id: 'fish_final_064_lavender_orca_baby',     name: '아기범고래',   rarity: 'rare' },
  { id: 'fish_final_067_pale_blue_angelfish',    name: '하늘나래',     rarity: 'rare' },
  { id: 'fish_final_070_green_tea_turtle',       name: '말차거북',     rarity: 'rare' },
  { id: 'fish_final_080_mint_sleepy_manta_baby', name: '졸음날개',     rarity: 'rare', tags: ['dawn'] },
  { id: 'fish_final_087_blue_droplet_seahorse',  name: '물방울해마',   rarity: 'rare', tags: ['dawn'] },
  // ─ 에픽 3 ─
  { id: 'fish_final_058_white_mochi_whale',      name: '찹쌀고래',     rarity: 'epic', tags: ['dawn'] },
  { id: 'fish_final_071_pink_mochi_axolotl',     name: '몽실도롱뇽',   rarity: 'epic' },
  { id: 'fish_final_074_lilac_cloud_ray',        name: '구름가오리',   rarity: 'epic', tags: ['dawn'] },
  // ─ 전설 1 ─
  { id: 'fish_final_083_lavender_star_octopus',  name: '별지기문어',   rarity: 'legendary', tags: ['night'] },
];

export const fishById = (id) => FISH.find((f) => f.id === id);

// 온보딩 완주 시 만나는 웰컴 물고기
export const WELCOME_FISH_ID = 'fish_individual_round_blue_left';

// ── 마이크로카피 (설계서 ⑧ — 어항 속 물고기들이 쓰는 반말) ──
export const COPY = {
  start: '퐁당, 들어간다',
  soloStart: '오늘은 나 혼자 잠수',
  emptyAquarium: '아직 아무도 안 살아. 첫 손님을 기다리는 중…',
  emptyCollection: '바다는 넓고, 우린 아직 발끝만 담갔어',
  loading: '물 데우는 중…',
  sulk1: '…들었어?',
  sulk2: '물고기가 바위 뒤로 숨었어',
  comeback: '휴, 다시 왔구나. 못 본 척해줄게',
  complete: '오늘의 물살, 여기 담아뒀어',
  tooShort: '오늘은 여기까지. 발끝만 담갔다 갔네',
  openReceipt: '젖은 손 닦고 열어봐',
  quitConfirm: '정말 그만둘까? 물고기들은 안 삐져.',
  freeDiveNote: '자유 잠수 · 원할 때 올라오면 돼',
  quitConfirmFree: '이제 올라갈래? 오늘 물살은 잘 챙겨둘게.',
  moveOut: '몇 마리는 옛 어항에 놀러 갔어',
  sleepHint: '이제 폰을 재워줘.',
  onboardingHint: '화면은 켜둔 채, 그냥 뒤집어 두면 돼.',
};

// 같이 퐁당 로컬 시뮬 가짜 친구 이름 (프로토 임시 — 실제 동기화 붙으면 제거)
export const DEMO_FRIEND = '동동이';

// ── 지난 영수증·간직하기 카피 (designer 확정 스펙) — 문자열 수정은 여기 한 곳 ──
export const RECEIPT_UI = {
  saveReceipt: '간직하기',                        // 영수증 이미지 저장 버튼
  saving: '간직하는 중…',                         // 저장 진행 중 버튼 라벨
  saveDone: '앨범에 퐁당, 잘 넣어뒀어.',           // 저장 성공 토스트
  saveFail: '앗, 잘 안 됐어. 다시 한번 눌러줄래?', // 캡처/CDN 실패 토스트
  backToAquarium: '어항으로 돌아가기',             // 지난 영수증 → 어항 복귀 버튼
  viewReceipt: '이 시간의 영수증 다시 보기',       // 어항 헤더 영수증 버튼 aria-label
  archiveBadge: '지난 영수증',                    // 종이 우상단 스탬프 뱃지
  nameAskArchive: '이름은 언제든 고쳐도 돼',       // archive 이름 입력 보조 카피
  // ── 동행자·지난 영수증 목록 (designer 확정 스펙) ──
  withLabel: 'WITH',                              // 동행자 행 라벨
  withFallback: '같이 퐁당',                       // 구세션(members 없음) together 폴백
  withMore: (n) => ` ${n}명 더`,                   // 동행자 4명+ 꼬리: "동동이, 미미랑 2명 더"
  backToSettings: '설정으로 돌아가기',             // 설정에서 연 지난 영수증 복귀 버튼 (임시 — designer 확정 대기)
  archiveListTitle: '지난 영수증',                 // 설정 목록 카드 제목
  archiveListDesc: '탭하면 그 시간의 영수증을 다시 뽑아줄게', // 목록 보조 카피
  archiveListEmpty: '아직 간직한 시간이 없어. 첫 퐁당이 끝나면 여기부터 쌓일 거야.', // 빈 상태
  // 파일명: 퐁당_7월2일_노을.png
  receiptFileName: (session) => {
    const d = new Date(session.startedAt);
    return `퐁당_${d.getMonth() + 1}월${d.getDate()}일_${TIMEBANDS[session.timeband].label}.png`;
  },
};

// ── 어항 꾸미기(편집 모드) 카피 (designer 확정 스펙) — 문자열 수정은 여기 한 곳 ──
export const EDIT_UI = {
  editBtn: '어항 꾸미기',                          // 꾸미기 버튼 aria-label (기본)
  editDone: '꾸미기 끝내기',                       // 꾸미기 버튼 aria-label (편집 중)
  editHint: '물고기를 톡 하면 잠깐 쉬러 가',        // 편집 중 안내 필
  removeFish: (name) => `${name} 빼기`,            // 어항 물고기 버튼 aria-label
  addFish: (name) => `${name} 넣기`,               // 트레이 아이템 aria-label
  removeToast: (name) => `${name}, 잠깐 쉬러 갔어`,
  addToast: (name) => `${name}, 퐁당! 다시 왔어`,
  fullToast: '어항이 꽉 찼어. 한 마리 쉬게 해줄래?',
  emptyByEdit: '다들 쉬는 중이야. 아래에서 한 마리 불러올래?', // 로스터 0 + 벤치 있음 (물고기 자체가 없으면 COPY.emptyAquarium)
  trayLabel: '쉬는 중',                            // 트레이 캡션
  trayEmpty: '지금은 다들 어항에 있어',             // 트레이 빈 상태
  trayAria: '쉬는 중인 물고기',                     // 트레이 role=group aria-label
};

// ── "오늘의 한 줄" 서정 카피 템플릿 (시간대·티어 조합, 12개) ──
// {n}=닉네임 자리는 안 씀 — 물고기 시점 반말 유지
export const DAILY_LINES = {
  dawn: [
    '아무도 깨지 않은 물 위에, 너 혼자 조용히 떠 있었어.',
    '새벽 물은 차갑지만, 네 덕에 조금 데워졌어.',
    '해 뜨기 전의 바다를 아는 사람은 별로 없는데.',
  ],
  day: [
    '한낮의 물결은 반짝였고, 너는 그 아래 가만히 있었어.',
    '오늘 낮, 세상은 시끄러웠는데 여긴 조용했어.',
    '햇살이 물속까지 내려온 건 네가 있어서일지도.',
  ],
  sunset: [
    '노을이 물에 번질 때, 너도 같이 번지고 있었어.',
    '하루가 저무는 동안 너는 아무 데도 가지 않았어.',
    '주황빛 물속에서 우리 다 같이 조금 느려졌어.',
  ],
  night: [
    '달빛만 남은 물속, 네 숨소리가 제일 컸어.',
    '밤의 어항은 깊고, 너는 그 깊이만큼 머물렀어.',
    '별이 물에 빠진 밤이었어. 너도 같이 퐁당.',
  ],
};

// 긴 세션(90분+) 전용 가산 한 줄 — 시간대 문장 뒤에 붙는다
export const DEEP_LINES = [
  '이 정도면 물고기들이 네 이름을 외웠을걸.',
  '깊은 데까지 내려와 줘서 고마워.',
];
