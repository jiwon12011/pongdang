// ═══════════════════════════════════════════════════════════════
// gacha.js — 물고기 추첨 (콘셉트 ③ 지속시간 사다리)
//   천장 = 하드컷(enum 비교), 보장 등급 1마리 강제, base_weight 가중치
// ═══════════════════════════════════════════════════════════════

import {
  FISH, RARITY, RARITY_ORDER, rarityIdx, DURATION_TIERS, WELCOME_FISH_ID,
} from './assets-data.js';

// 지속 분수 → 해당 티어 (15분 미만이면 null = 시도 기록만)
export function tierFor(durationMin) {
  let tier = null;
  for (const t of DURATION_TIERS) if (durationMin >= t.min) tier = t;
  return tier;
}

// 다음 티어 (영수증 NEXT FISH HINT용)
export function nextTierAfter(durationMin) {
  return DURATION_TIERS.find((t) => durationMin < t.min) || null;
}

// 천장 이하 종 풀에서 가중 추첨 1마리
//   가중치 = 희귀도 base_weight / 그 희귀도 종 수 → 희귀도 분포가 60/25/10/4/1로 유지됨
//   시간대 태그가 현재 시간대와 맞으면 ×2 (같은 등급 안에서만 유리해짐, 천장 못 넘음)
function drawOne(ceiling, timeband, exactRarity = null) {
  const cap = rarityIdx(ceiling);
  const pool = FISH.filter((f) =>
    exactRarity ? f.rarity === exactRarity : rarityIdx(f.rarity) <= cap
  );
  const countByRarity = {};
  for (const f of pool) countByRarity[f.rarity] = (countByRarity[f.rarity] || 0) + 1;

  const weights = pool.map((f) => {
    let w = RARITY[f.rarity].weight / countByRarity[f.rarity];
    if (f.tags?.includes(timeband)) w *= 2;
    return w;
  });
  let roll = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return pool[i];
  }
  return pool[pool.length - 1]; // 부동소수 안전망
}

// 세션 결과 추첨. 반환: { tier, fish: FISH[] } — 15분 미만이면 fish []
export function drawForSession(durationMin, timeband, { onboarding = false } = {}) {
  // 온보딩 5분 미니 세션: 티어 예외 — 웰컴 물고기 1마리 고정
  if (onboarding) {
    return { tier: { name: '첫 퐁당', min: 5, count: 1 }, fish: [FISH.find((f) => f.id === WELCOME_FISH_ID)] };
  }
  const tier = tierFor(durationMin);
  if (!tier) return { tier: null, fish: [] };

  const result = [];
  if (tier.guarantee) result.push(drawOne(tier.ceiling, timeband, tier.guarantee)); // 보장 강제
  while (result.length < tier.count) result.push(drawOne(tier.ceiling, timeband));

  // 가장 레어한 게 CATCH OF THE DAY로 앞에 오도록 정렬
  result.sort((a, b) => rarityIdx(b.rarity) - rarityIdx(a.rarity));
  return { tier, fish: result };
}

// 미획득 종 중 낮은 등급 위주 힌트 1종 (NEXT FISH HINT 보조)
export function hintSpecies(ownedIds, timeband) {
  const unowned = FISH.filter((f) => !ownedIds.has(f.id));
  if (!unowned.length) return null;
  // 시간대 태그가 맞는 미획득 종 우선 → 없으면 가장 흔한 미획득 종
  const tagged = unowned.filter((f) => f.tags?.includes(timeband));
  const pick = tagged.length ? tagged : unowned;
  pick.sort((a, b) => rarityIdx(a.rarity) - rarityIdx(b.rarity));
  return pick[0];
}

export { RARITY_ORDER };
