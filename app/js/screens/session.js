// ═══════════════════════════════════════════════════════════════
// screens/session.js — 잠수 중 화면 (설계서 ③)
//   초저휘도 · 시간 상시 미표시(탭 시 3초) · 2단 "들었다" 감지 ·
//   삐짐 연출 · 중단 확인 1회 · 젖은 화면 복귀
// ═══════════════════════════════════════════════════════════════

import { COPY, src } from '../assets-data.js';
import { activeSession, elapsedMin, isGoalReached, msUntilGoal, finishSession } from '../session.js';
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

export function renderSession() {
  const root = $('[data-screen="session"]');
  root.innerHTML = '';
  ending = false;

  const active = activeSession();
  if (!active) { showScreen('home'); return; }

  // ── DOM ──
  const timeEl = el('div', { class: 'session__time mono', 'aria-live': 'polite' });
  const sulkEl = el('div', { class: 'session__sulk' });
  const hintEl = el('p', { class: 'session__hint' },
    `${COPY.sleepHint}\n물고기는 조용히 모이고 있어.`);
  const fishEl = el('img', {
    class: 'session__fish',
    src: src.fish('fish_final_020_silver_anchovy'),
    alt: '',
  });
  const quitBtn = el('button', { type: 'button', class: 'session__quit' }, '그만 나갈래');
  const goalNote = el('div', { class: 'session__goal-note' },
    `목표 ${active.goalMin}분${active.speed > 1 ? ' · 데모 ×' + active.speed : ''}${active.mode === 'together' ? ' · 같이 퐁당' : ''}`);

  const breathEl = el('div', { class: 'session__breath', 'aria-hidden': 'true' });
  const wrap = el('div', { class: 'session', style: 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;' },
    el('div', { class: 'session__waves', 'aria-hidden': 'true' }),
    goalNote,
    breathEl,
    hintEl, timeEl, sulkEl, fishEl, quitBtn,
  );
  root.append(wrap);

  // 시작 안내는 6초 뒤 가라앉는다
  setTimeout(() => hintEl.classList.add('session__hint--faded'), 6000);
  // 2분 뒤엔 숨쉬기 원도 재운다 — 무한 애니 GPU 비용 절감
  clearTimeout(breathTimer);
  breathTimer = setTimeout(() => breathEl.classList.add('session__breath--rest'), 120000);

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
    timeEl.textContent = `${fmtClock(elapsedMin(active))} / ${fmtClock(active.goalMin)}`;
    timeEl.classList.add('session__time--show');
    quitBtn.classList.add('session__quit--show');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      timeEl.classList.remove('session__time--show');
      quitBtn.classList.remove('session__quit--show');
    }, 3000);
  }

  // ── 삐짐 연출 (텍스트 + 꼬마 물고기 숨기) ──
  function showSulk(msg, level) {
    sulkEl.textContent = msg;
    sulkEl.classList.add('session__sulk--show');
    if (level >= 2) fishEl.classList.add('session__fish--hide');
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
      fishEl.classList.remove('session__fish--hide'); // 물고기 복귀
    }, 3800);
  };
  document.addEventListener('visibilitychange', onVisibility);

  // ── 중단: 확인 1회, 실패 화면 금지 ──
  quitBtn.addEventListener('click', async () => {
    if (ending) return;
    const sure = await confirmModal(COPY.quitConfirm, { okLabel: '그만둘래', cancelLabel: '더 있을래' });
    if (sure) end({ gaveUp: true });
  });

  // ── 목표 도달 = 1회성 타이머 (1초 폴링 대신, 남은 시간만큼 재운다) ──
  function scheduleEnd() {
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
    if (wasOnboarding && !result.session.attempt) setProfile({ onboarded: true });

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
