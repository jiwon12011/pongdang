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
  dawn:   { label: '새벽', emojiDecor: 'decor_final_007_spiral_shell' },
  day:    { label: '낮',   emojiDecor: 'decor_final_009_sun_sticker' },
  sunset: { label: '노을', emojiDecor: 'decor_final_006_pink_ribbon_bow' },
  night:  { label: '밤',   emojiDecor: 'decor_final_008_moon_charm' },
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

// ── 물고기 50종 (id=파일명 / 희귀도 배분: 흔함24·비범13·레어8·에픽4·전설1) ──
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
  moveOut: '몇 마리는 옛 어항에 놀러 갔어',
  sleepHint: '이제 폰을 재워줘.',
  onboardingHint: '화면은 켜둔 채, 그냥 뒤집어 두면 돼.',
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
