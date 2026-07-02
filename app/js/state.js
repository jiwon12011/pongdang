// ═══════════════════════════════════════════════════════════════
// state.js — localStorage 스키마(설계서 ⑩)와 상태 접근자
//   pongdang.profile       { nickname, onboarded, demoSpeed }
//   pongdang.fish[]        { uid, speciesId, caughtAt, sessionId }
//   pongdang.tank[]        개체 uid 배열 — 지금 어항 로스터 (순서 유지, cap 12)
//   pongdang.sessions[]    { id, name, startedAt, endedAt, durationMin,
//                            goalMin(null=자유 잠수), timeband, tank?, tierName, mode,
//                            members[]?, fishIds[], attempt, stamp }
//   pongdang.activeSession { startedAt, goalMin(null=자유 잠수), mode, members[]?,
//                            timeband, tank?, speed, onboarding }
//   members[]?: 같이 퐁당 시작 순간 입장자 이름([0]=나) — solo·구세션엔 필드 없음
//   tank?: 시작 시 뽑힌 어항 변형 id — 구세션엔 필드 없음(렌더는 timeband 매핑 폴백)
// ═══════════════════════════════════════════════════════════════

export const AQUARIUM_CAPACITY = 12; // 어항 수용량 (설계서 ⑥) — 로스터 cap

const KEYS = {
  profile: 'pongdang.profile',
  fish: 'pongdang.fish',
  tank: 'pongdang.tank',
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
// 새 물고기 기록 + 지금 어항 로스터 자동 입장.
// 로스터가 꽉 차면 최고참(배열 앞)부터 밀려남 — 밀려난 마릿수 반환(overflow 토스트용).
// 사용자가 미리 빼서 자리를 만들어 뒀으면 0 (= overflow 아님).
export function addFish(entries) {
  const withUid = entries.map((e) => (e.uid ? e : { ...e, uid: uid() }));
  write(KEYS.fish, [...getFish(), ...withUid]);
  const roster = [...getTank(), ...withUid.map((f) => f.uid)];
  const evicted = Math.max(0, roster.length - AQUARIUM_CAPACITY);
  setTank(roster.slice(evicted));
  return evicted;
}
export function ownedSpeciesIds() {
  return new Set(getFish().map((f) => f.speciesId));
}

// ── 지금 어항 로스터 (큐레이션 계층) ──
export function getTank() {
  return read(KEYS.tank, []);
}
function setTank(uids) {
  write(KEYS.tank, uids);
}
// 로스터 순서대로 fish 레코드 — 죽은 uid(삭제·유실)는 방어적으로 필터
export function getTankFish() {
  const byUid = new Map(getFish().map((f) => [f.uid, f]));
  return getTank().map((u) => byUid.get(u)).filter(Boolean);
}
// 로스터 밖 개체들 (보관 트레이용) — 최신순
export function getBenchFish() {
  const inTank = new Set(getTank());
  return getFish().filter((f) => !inTank.has(f.uid)).reverse();
}
// 어항에 넣기 — cap·중복 검사, 성공 여부 반환
export function addToTank(fishUid) {
  const roster = getTank();
  if (roster.length >= AQUARIUM_CAPACITY || roster.includes(fishUid)) return false;
  setTank([...roster, fishUid]);
  return true;
}
// 어항에서 빼기 — 있었으면 true
export function removeFromTank(fishUid) {
  const roster = getTank();
  const next = roster.filter((u) => u !== fishUid);
  if (next.length === roster.length) return false;
  setTank(next);
  return true;
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

// ── 오늘 만난 물고기 (홈 히어로용): 최신 세션부터 flat, 종 중복 제거, 최대 4마리 ──
export function todayFishIds(max = 4) {
  const today = new Date().toDateString();
  const ids = getSessions()
    .filter((s) => s.fishIds?.length && new Date(s.startedAt).toDateString() === today)
    .reverse() // 최신 세션 먼저
    .flatMap((s) => s.fishIds);
  return [...new Set(ids)].slice(0, max);
}

// ── 데모 배속: 실제 경과 ms → 게임상 분 (프로토 전용 ×60) ──
export function speedFactor() {
  return getProfile().demoSpeed ? 60 : 1;
}

// ── 데이터 초기화 ──
export function resetAll() {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}

// 고유 id (세션·개체용)
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ── 마이그레이션 (1회·멱등) ──
// 로드마다 재계산해 덮어쓰면 사용자 큐레이션이 소실된다 — 절대 금지.
// 로스터 초기화는 pongdang.tank "키 자체가 없을 때"만: 빈 배열도 유효한 큐레이션이다.
export function migrate() {
  const fish = getFish();
  if (fish.some((f) => !f.uid)) {
    write(KEYS.fish, fish.map((f) => (f.uid ? f : { ...f, uid: uid() })));
  }
  if (localStorage.getItem(KEYS.tank) === null) {
    setTank(getFish().slice(-AQUARIUM_CAPACITY).map((f) => f.uid));
  }
}
if (typeof localStorage !== 'undefined') migrate(); // 앱 로드 시 1회 (테스트는 명시 호출)
