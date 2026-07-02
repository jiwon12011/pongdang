// ═══════════════════════════════════════════════════════════════
// screens/home.js — 홈(수면 위): 오늘 요약 · 모드 · 목표시간 · 꾹 시작
// ═══════════════════════════════════════════════════════════════

import { COPY, GOAL_CHOICES, TIMEBANDS, timebandOf, src } from '../assets-data.js';
import { tierFor } from '../gacha.js';
import { todaySummary, getProfile } from '../state.js';
import { $, el, holdToStart, showScreen, toast, fmtMin, withMono } from '../ui.js';
import { startSession } from '../session.js';

// 화면 로컬 상태 (렌더 사이 유지)
let goalMin = 30;
let mode = 'solo'; // 'solo' | 'together'
let roomTimer = null;

const GREETINGS = {
  dawn: '새벽 물은 유난히 잔잔해.',
  day: '낮 물결이 반짝이고 있어.',
  sunset: '노을이 물에 번지는 중이야.',
  night: '밤 어항에 달이 떴어.',
};

export function renderHome() {
  const root = $('[data-screen="home"]');
  root.innerHTML = '';
  clearTimeout(roomTimer);

  const profile = getProfile();
  const sum = todaySummary();
  const band = timebandOf();

  const wrap = el('div', { class: 'home' });

  // ── 헤더: 손그림 데코 + 인사 ──
  wrap.append(
    el('header', { class: 'home__head' },
      el('h1', { class: 'hand-title home__logo' }, '퐁당'),
      el('p', { class: 'home__sub' },
        `${profile.nickname ? profile.nickname + ', ' : ''}${GREETINGS[band]}`),
      el('img', { class: 'home__decor home__decor--star', src: src.decor('decor_final_005_gold_sparkle_star'), alt: '' }),
      el('img', { class: 'home__decor home__decor--shell', src: src.decor('decor_final_007_spiral_shell'), alt: '' }),
    ),
  );

  // ── 오늘 요약 카드 ──
  wrap.append(
    el('div', { class: 'glass-card home__summary' },
      el('div', { class: 'home__summary-item' },
        el('div', { class: 'home__summary-label' }, '오늘 잠수'),
        el('div', { class: 'home__summary-value' }, withMono(sum.minutes ? fmtMin(sum.minutes) : '0분')),
      ),
      el('div', { class: 'home__summary-divider' }),
      el('div', { class: 'home__summary-item' },
        el('div', { class: 'home__summary-label' }, '만난 물고기'),
        el('div', { class: 'home__summary-value' }, withMono(`${sum.fishCount}마리`)),
      ),
    ),
  );

  // ── 모드: 혼자 / 같이 ──
  const soloBtn = el('button', { type: 'button', class: 'home__mode', onclick: () => setMode('solo') }, COPY.soloStart);
  const togetherBtn = el('button', { type: 'button', class: 'home__mode', onclick: () => setMode('together') }, '같이 퐁당');
  wrap.append(el('div', { class: 'home__modes' }, soloBtn, togetherBtn));

  // 같이 퐁당 — 방 코드 UI (로컬 시뮬)
  const roomSlot = el('div');
  wrap.append(roomSlot);

  function setMode(next) {
    mode = next;
    soloBtn.classList.toggle('home__mode--on', mode === 'solo');
    togetherBtn.classList.toggle('home__mode--on', mode === 'together');
    roomSlot.innerHTML = '';
    clearTimeout(roomTimer);
    if (mode === 'together') roomSlot.append(buildRoomCard(profile));
  }

  // ── 목표시간 ──
  wrap.append(el('p', { class: 'home__goal-label' }, '얼마나 잠수할래?'));
  const goals = el('div', { class: 'home__goals', role: 'group', 'aria-label': '목표 시간' });
  for (const min of GOAL_CHOICES) {
    const tier = tierFor(min);
    const chip = el('button', {
      type: 'button',
      class: `goal-chip${min === goalMin ? ' goal-chip--on' : ''}`,
      onclick: () => {
        goalMin = min;
        goals.querySelectorAll('.goal-chip').forEach((c) => c.classList.remove('goal-chip--on'));
        chip.classList.add('goal-chip--on');
      },
    }, fmtMin(min), el('span', { class: 'goal-chip__tier' }, tier.name));
    goals.append(chip);
  }
  wrap.append(goals);

  // ── 2초 꾹 시작 버튼 (수면) ──
  const startBtn = el('button', { type: 'button', class: 'home__start', 'aria-label': `${COPY.start} — 2초 꾹 누르면 시작` },
    el('span', { class: 'home__start-main' }, COPY.start),
    el('span', { class: 'home__start-sub' }, '2초 꾹 누르면 물속으로'),
  );
  holdToStart(startBtn, () => {
    startSession({ goalMin, mode });
    showScreen('session');
  });
  wrap.append(startBtn);

  root.append(wrap);
  setMode(mode); // 유지된 모드 반영
}

// 방 코드 카드 — 실제 동기화 없음, 친구가 들어오는 척만 (프로토)
function buildRoomCard(profile) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const members = el('div', { class: 'room-card__members' },
    memberRow(profile.nickname || '나', true),
  );
  // 2.5초 뒤 가짜 친구 입장 (로컬 시뮬)
  roomTimer = setTimeout(() => {
    members.append(memberRow('동동이', false));
    toast('동동이가 풍덩 들어왔어');
  }, 2500);

  return el('div', { class: 'glass-card room-card' },
    el('div', { class: 'room-card__code', 'aria-label': `방 코드 ${code}` }, code),
    el('p', { class: 'room-card__note' }, '이 코드를 친구에게 보여줘. 다 모이면 같이 꾹!'),
    members,
  );
}

function memberRow(name, isMe) {
  return el('div', { class: 'room-card__member' },
    el('img', { src: src.icon('icon_final_004_friends'), alt: '' }),
    el('span', {}, `${name}${isMe ? ' (나)' : ''}`),
  );
}
