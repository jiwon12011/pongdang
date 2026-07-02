// ═══════════════════════════════════════════════════════════════
// state.js — localStorage 스키마(설계서 ⑩)와 상태 접근자
//   pongdang.profile       { nickname, onboarded, demoSpeed }
//   pongdang.fish[]        { speciesId, caughtAt, sessionId }
//   pongdang.sessions[]    { id, name, startedAt, endedAt, durationMin,
//                            goalMin, timeband, tierName, mode, fishIds[],
//                            attempt, stamp }
//   pongdang.activeSession { startedAt, goalMin, mode, timeband, speed, onboarding }
// ═══════════════════════════════════════════════════════════════

const KEYS = {
  profile: 'pongdang.profile',
  fish: 'pongdang.fish',
  sessions: 'pongdang.sessions',
  active: 'pongdang.activeSession',
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback; // 깨진 데이터는 조용히 초기값으로
  }
}
function write(key, value) {
  if (value === null || value === undefined) localStorage.removeItem(key);
  else localStorage.setItem(key, JSON.stringify(value));
}

// ── 프로필 ──
export function getProfile() {
  return read(KEYS.profile, { nickname: '', onboarded: false, demoSpeed: false });
}
export function setProfile(patch) {
  write(KEYS.profile, { ...getProfile(), ...patch });
}

// ── 획득 물고기 ──
export function getFish() {
  return read(KEYS.fish, []);
}
export function addFish(entries) {
  write(KEYS.fish, [...getFish(), ...entries]);
}
export function ownedSpeciesIds() {
  return new Set(getFish().map((f) => f.speciesId));
}

// ── 세션 기록 ──
export function getSessions() {
  return read(KEYS.sessions, []);
}
export function addSession(session) {
  write(KEYS.sessions, [...getSessions(), session]);
}
export function updateSession(id, patch) {
  write(KEYS.sessions, getSessions().map((s) => (s.id === id ? { ...s, ...patch } : s)));
}
export function getSession(id) {
  return getSessions().find((s) => s.id === id);
}

// ── 진행 중 세션 (새로고침 복원용) ──
export function getActiveSession() {
  return read(KEYS.active, null);
}
export function setActiveSession(data) {
  write(KEYS.active, data);
}

// ── 오늘 요약 (홈 카드용) ──
export function todaySummary() {
  const today = new Date().toDateString();
  const sessions = getSessions().filter(
    (s) => !s.attempt && new Date(s.startedAt).toDateString() === today
  );
  return {
    minutes: sessions.reduce((sum, s) => sum + s.durationMin, 0),
    fishCount: sessions.reduce((sum, s) => sum + (s.fishIds?.length || 0), 0),
    sessionCount: sessions.length,
  };
}

// ── 데모 배속: 실제 경과 ms → 게임상 분 (프로토 전용 ×60) ──
export function speedFactor() {
  return getProfile().demoSpeed ? 60 : 1;
}

// ── 데이터 초기화 ──
export function resetAll() {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}

// 고유 id (세션용)
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
