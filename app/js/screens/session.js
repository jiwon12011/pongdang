// ═══════════════════════════════════════════════════════════════
// screens/session.js — 잠수 중 화면 (설계서 ③)
//   초저휘도 · 시간 상시 미표시(탭 시 3초) · 2단 "들었다" 감지 ·
//   삐짐 연출 · 중단 확인 1회 · 젖은 화면 복귀
// ═══════════════════════════════════════════════════════════════

import { COPY, src } from '../assets-data.js';
import { activeSession, elapsedMin, isGoalReached, isFreeDive, msUntilGoal, finishSession } from '../session.js';
import { setProfile } from '../state.js';
import {
  $, el, showScreen, currentScreen, toast, confirmModal, playWetScreen, fmtClock,
} from '../ui.js';
import { setPendingReceipt } from './receipt.js';

let endTimer = null;
let hideTimer = null;
let sulkTimer = null;
let breathTimer = null;
let ending = false;

// ── "어둠 속에서 모이는 중" 실루엣 3마리 — 값은 designer 확정 스펙 고정 ──
const SHOAL = [
  { id: 'fish_final_020_silver_anchovy',      scale: 0.75, ty: 58, sx: 8,  ex: 62, dur: 44, delay: 0 },
  { id: 'fish_final_014_blue_tiny_whale',     scale: 0.9,  ty: 34, sx: 55, ex: 10, dur: 56, delay: -20, q: true },
  { id: 'fish_final_019_pale_blue_jellyfish', scale: 0.8,  ty: 18, sx: 30, ex: 74, dur: 60, delay: -35, blur: true },
];

// 어항의 swim-fish 3중 구조(swim-x / flip-x / bob) 그대로 재사용 — 신규 키프레임 없음
function buildShoal() {
  const layer = el('div', { class: 'session__shoal', 'aria-hidden': 'true' });
  for (const f of SHOAL) {
    const flip = el('div', { class: 'swim-fish__flip' },
      el('img', { src: src.fish(f.id), alt: '', decoding: 'async', draggable: 'false' }),
    );
    if (f.q) flip.append(el('span', { class: 'session__q' }, '?')); // 아기고래의 궁금한 "?"
    layer.append(el('div', {
      class: `swim-fish${f.blur ? ' swim-fish--blur' : ''}`,
      style: `--ty:${f.ty}%;--sx:${f.sx}%;--ex:${f.ex}%;--dur:${f.dur}s;--delay:${f.delay}s;--bob:4.5s;--scale:${f.scale}`,
    }, flip));
  }
  return layer;
}

export function renderSession() {
  const root = $('[data-screen="session"]');
  root.innerHTML = '';
  ending = false;

  const active = activeSession();
  if (!active) { showScreen('home'); return; }
  const free = isFreeDive(active); // 자유 잠수: 종료 타이머 없음, 나가기 = 정상 종료

  // ── DOM ──
  const timeEl = el('div', { class: 'session__time mono', 'aria-live': 'polite' });
  const sulkEl = el('div', { class: 'session__sulk' });
  const hintEl = el('p', { class: 'session__hint' },
    `${COPY.sleepHint}\n물고기는 조용히 모이고 있어.`);
  const quitBtn = el('button', { type: 'button', class: 'session__quit' },
    free ? '이제 올라갈래' : '그만 나갈래');
  const goalNote = el('div', { class: 'session__goal-note' },
    `${free ? COPY.freeDiveNote : `목표 ${active.goalMin}분`}${active.speed > 1 ? ' · 데모 ×' + active.speed : ''}${active.mode === 'together' ? ' · 같이 퐁당' : ''}`);

  const breathEl = el('div', { class: 'session__breath', 'aria-hidden': 'true' });
  // 무대 3레이어: tank back(0.07) → 실루엣 물고기 → tank front(0.10) — night 고정
  const shoalEl = buildShoal();
  const wrap = el('div', { class: 'session', style: 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;' },
    el('div', { class: 'session__waves', 'aria-hidden': 'true' }),
    el('img', { class: 'session__tank-back', src: src.tankBack('aquarium_final_003_night_rounded'), alt: '', decoding: 'async', draggable: 'false' }),
    shoalEl,
    el('img', { class: 'session__tank-front', src: src.tankFront('aquarium_final_003_night_rounded'), alt: '', decoding: 'async', draggable: 'false' }),
    el('div', { class: 'bubble-anim session__bubble session__bubble--1', 'aria-hidden': 'true' }),
    el('div', { class: 'bubble-anim session__bubble session__bubble--2', 'aria-hidden': 'true' }),
    goalNote,
    breathEl,
    hintEl, timeEl, sulkEl, quitBtn,
  );
  root.append(wrap);

  // 시작 안내는 6초 뒤 가라앉는다
  setTimeout(() => hintEl.classList.add('session__hint--faded'), 6000);
  // 2분 뒤엔 화면 전체(숨쉬기·유영·기포)를 재운다 — 무한 애니 GPU 비용 절감
  clearTimeout(breathTimer);
  breathTimer = setTimeout(() => wrap.classList.add('session--rest'), 120000);

  // ── 탭 = 시간 3초 표시 + 나가기 버튼 + 삐짐 1단(보조 신호) ──
  let lastSulk1 = 0;
  wrap.addEventListener('pointerdown', (e) => {
    if (ending || e.target === quitBtn) return;
    showTimeBriefly();
    // 시작 5초(실시간) 이후의 터치만 "만졌다"로 — 삐짐 1단 (20초 쿨다운)
    const now = Date.now();
    if (now - active.startedAt > 5000 && now - lastSulk1 > 20000) {
      lastSulk1 = now;
      showSulk(COPY.sulk1, 1);
    }
  });

  function showTimeBriefly() {
    // 자유 잠수는 목표가 없으니 경과만
    timeEl.textContent = free
      ? fmtClock(elapsedMin(active))
      : `${fmtClock(elapsedMin(active))} / ${fmtClock(active.goalMin)}`;
    timeEl.classList.add('session__time--show');
    quitBtn.classList.add('session__quit--show');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      timeEl.classList.remove('session__time--show');
      quitBtn.classList.remove('session__quit--show');
    }, 3000);
  }

  // ── 삐짐 연출 (텍스트 + 물고기 떼 전체 숨기) ──
  function showSulk(msg, level) {
    sulkEl.textContent = msg;
    sulkEl.classList.add('session__sulk--show');
    if (level >= 2) shoalEl.classList.add('session__shoal--hide');
    clearTimeout(sulkTimer);
    sulkTimer = setTimeout(() => sulkEl.classList.remove('session__sulk--show'), 3500);
  }

  // ── visibilitychange = 확실한 들기 → 삐짐 2단 + 복귀 인사 ──
  // (백그라운드에선 타이머가 스로틀되므로 돌아온 순간 목표 도달을 보정한다)
  const onVisibility = () => {
    if (document.hidden || ending || currentScreen() !== 'session') return;
    if (isGoalReached(active)) { end({ gaveUp: false }); return; }
    scheduleEnd();
    showSulk(COPY.sulk2, 2);
    setTimeout(() => {
      if (ending) return;
      showSulk(COPY.comeback, 1);
      shoalEl.classList.remove('session__shoal--hide'); // 물고기 떼 복귀
    }, 3800);
  };
  document.addEventListener('visibilitychange', onVisibility);

  // ── 중단: 확인 1회, 실패 화면 금지 ──
  quitBtn.addEventListener('click', async () => {
    if (ending) return;
    // 자유 잠수에선 나가기가 유일한 정상 종료 — 죄책감 없는 카피 + gaveUp:false로 정산
    const sure = free
      ? await confirmModal(COPY.quitConfirmFree, { okLabel: '올라갈래', cancelLabel: '더 있을래' })
      : await confirmModal(COPY.quitConfirm, { okLabel: '그만둘래', cancelLabel: '더 있을래' });
    if (sure) end({ gaveUp: !free });
  });

  // ── 목표 도달 = 1회성 타이머 (1초 폴링 대신, 남은 시간만큼 재운다) ──
  function scheduleEnd() {
    if (free) return; // 자유 잠수는 종료 타이머 없음 (msUntilGoal=Infinity — 즉시 발화 방지)
    clearTimeout(endTimer);
    if (ending) return;
    endTimer = setTimeout(() => {
      if (ending) return;
      if (isGoalReached(active)) end({ gaveUp: false });
      else scheduleEnd(); // 스로틀 등으로 일찍 깼으면 남은 시간으로 재예약
    }, msUntilGoal(active) + 60);
  }
  scheduleEnd();

  // ── 정산 + 젖은 화면 복귀 ──
  function end({ gaveUp }) {
    ending = true;
    clearTimeout(endTimer);
    clearTimeout(breathTimer);
    clearTimeout(hideTimer);
    clearTimeout(sulkTimer);
    document.removeEventListener('visibilitychange', onVisibility);

    const wasOnboarding = active.onboarding;
    if (!gaveUp) {
      hintEl.textContent = COPY.complete;
      hintEl.classList.remove('session__hint--faded');
    }
    const result = finishSession(active, { gaveUp });
    // 어떤 세션이든 완주(포기 아님·시도 기록 아님)면 온보딩 졸업 — attempt로는 스킵 안 됨
    if (!gaveUp && !result.session.attempt) setProfile({ onboarded: true });

    // 완료 문구를 잠깐 보여준 뒤 물방울과 함께 밝아진다
    setTimeout(() => {
      playWetScreen(() => {
        if (result.session.attempt) {
          // 15분 미만 = 시도 기록만. 영수증 없이 홈으로, 다정하게 한 마디.
          showScreen(wasOnboarding ? 'onboarding' : 'home');
          toast(COPY.tooShort);
        } else {
          setPendingReceipt(result);
          showScreen('receipt');
        }
      });
    }, gaveUp ? 100 : 1300);
  }
}
