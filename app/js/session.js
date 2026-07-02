// ═══════════════════════════════════════════════════════════════
// session.js — 세션 상태 머신 (시작·경과·복원·정산)
//   화면 연출은 screens/session.js가, 여기는 시간과 기록만 다룬다
// ═══════════════════════════════════════════════════════════════

import { timebandOf, TIMEBANDS } from './assets-data.js';
import { drawForSession } from './gacha.js';
import {
  getActiveSession, setActiveSession, addSession, addFish,
  getFish, speedFactor, uid,
} from './state.js';
import { fmtDate } from './ui.js';

export const AQUARIUM_CAPACITY = 12; // 어항 수용량 (설계서 ⑥)

// 세션 시작 — activeSession 저장(새로고침 복원용)
// goalMin: null(또는 생략) = 자유 잠수 — 시간 제한 없이, 나가기가 정상 종료
export function startSession({ goalMin = null, mode = 'solo', onboarding = false }) {
  const now = Date.now();
  const active = {
    id: uid(),
    startedAt: now,
    goalMin: goalMin ?? null,
    mode,
    timeband: timebandOf(new Date(now)), // 어항 변형은 시작 순간 기준
    speed: speedFactor(),                // 시작 시점 배속 고정 (복원 일관성)
    onboarding,
  };
  setActiveSession(active);
  return active;
}

export function activeSession() {
  return getActiveSession();
}

// 게임상 경과 분 (데모 배속 반영)
export function elapsedMin(active) {
  return ((Date.now() - active.startedAt) / 60000) * (active.speed || 1);
}

// 자유 잠수 여부 — goalMin 없이 시작한 세션
export function isFreeDive(active) {
  return active.goalMin == null;
}

export function isGoalReached(active) {
  if (isFreeDive(active)) return false; // 자유 잠수엔 "목표 도달"이 없다
  return elapsedMin(active) >= active.goalMin;
}

// 목표까지 남은 실제 ms (배속 반영) — 세션 화면의 1회성 종료 타이머용
// 자유 잠수는 Infinity — 호출부는 이 값으로 setTimeout을 걸면 안 된다(스킵할 것)
export function msUntilGoal(active) {
  if (isFreeDive(active)) return Infinity;
  return Math.max(0, ((active.goalMin - elapsedMin(active)) * 60000) / (active.speed || 1));
}

// 자동 세션 이름: "7월 2일 노을 퐁당"
export function autoName(active) {
  return `${fmtDate(active.startedAt)} ${TIMEBANDS[active.timeband].label} 퐁당`;
}

// ── 세션 정산: 추첨 → 기록 저장 → activeSession 제거 ──
// 반환 { session, fish, overflowed } — fish는 종 데이터 배열
export function finishSession(active, { gaveUp = false } = {}) {
  const rawMin = elapsedMin(active);
  // 목표 세션은 목표를 넘게 잡히지 않게 캡, 자유 잠수는 실제 경과 그대로
  const durationMin = Math.floor(isFreeDive(active) ? rawMin : Math.min(rawMin, active.goalMin));
  // 온보딩 보상(웰컴 물고기)은 완주했을 때만 — 중도 포기는 시도 기록
  const onboardingDone = active.onboarding && !gaveUp;
  const { tier, fish } = drawForSession(durationMin, active.timeband, {
    onboarding: onboardingDone,
  });
  const attempt = !onboardingDone && !tier; // 15분 미만 = 시도 기록만

  const session = {
    id: active.id,
    name: autoName(active), // 영수증에서 이름 지으면 update
    startedAt: active.startedAt,
    endedAt: Date.now(),
    durationMin,
    goalMin: active.goalMin,
    timeband: active.timeband,
    tierName: tier?.name || null,
    mode: active.mode,
    fishIds: fish.map((f) => f.id),
    attempt,
    stamp: !!tier?.stamp,
    gaveUp,
  };
  addSession(session);

  // 어항 수용량 초과 여부 — 새 물고기가 들어오면 오래된 애들이 옛 어항으로 "이사"
  const before = getFish().length;
  if (fish.length) {
    addFish(fish.map((f) => ({ speciesId: f.id, caughtAt: session.endedAt, sessionId: session.id })));
  }
  const overflowed = before <= AQUARIUM_CAPACITY && before + fish.length > AQUARIUM_CAPACITY;

  setActiveSession(null);
  return { session, fish, overflowed };
}

// 진행 중 세션 폐기 (기록 없이 — 시작 직후 취소 같은 경우엔 안 씀, 항상 finishSession 권장)
export function discardActive() {
  setActiveSession(null);
}
