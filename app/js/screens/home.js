// ═══════════════════════════════════════════════════════════════
// screens/home.js — 홈(수면 위): 어항 입구 히어로 · 모드 · 목표시간 · 꾹 시작
//   시간대 배경 1장 + 히어로 탱크(back→물고기→front) + 오늘 요약 필
// ═══════════════════════════════════════════════════════════════

import {
  AQUARIUM_VARIANTS, COPY, GOAL_CHOICES, TIMEBANDS, WELCOME_FISH_ID,
  fishById, timebandOf, src,
} from '../assets-data.js';
import { tierFor } from '../gacha.js';
import { todaySummary, todayFishIds, getProfile } from '../state.js';
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

  const wrap = el('div', { class: `home home--${band}` });

  // ── 시간대 배경 (현재 시간대 1장만 로드 — 프리로드 금지) + 상단 스크림 ──
  wrap.append(
    // 풀블리드 배경 = 홈 LCP 요소 — JS 렌더라 발견이 늦으니 발견 즉시 대역폭을 우선 배정
    el('img', { class: 'home__bg', src: src.bg(TIMEBANDS[band].homeBg), alt: '', 'aria-hidden': 'true', fetchpriority: 'high', decoding: 'async' }),
    el('div', { class: 'home__scrim', 'aria-hidden': 'true' }),
  );

  // ── 헤더: 로고+인사(좌) / 오늘 요약 필(우) ──
  wrap.append(
    el('header', { class: 'home__head' },
      el('div', { class: 'home__head-left' },
        el('div', { class: 'home__head-title' },
          el('h1', { class: 'hand-title home__logo' }, '퐁당'),
          // width/height = 원본 256×256(1:1) 비율 예약 — 로드 전 헤더 높이 확정으로 CLS 방지 (표시 크기는 CSS가 결정)
          el('img', { class: 'home__decor home__decor--main', src: src.decor(TIMEBANDS[band].emojiDecor), alt: '', width: 44, height: 44 }),
          el('img', { class: 'home__decor home__decor--star', src: src.decor('decor_final_005_gold_sparkle_star'), alt: '', width: 26, height: 26 }),
        ),
        el('p', { class: 'home__sub' },
          `${profile.nickname ? profile.nickname + ', ' : ''}${GREETINGS[band]}`),
      ),
      el('div', { class: 'home__summary-pill' },
        sum.minutes
          ? withMono(`오늘 ${fmtMin(sum.minutes)} · ${sum.fishCount}마리`)
          : '오늘 아직 잠수 전'),
    ),
  );

  // ── 어항 입구 히어로: tank back → 오늘의 물고기 → tank front + 카피 ──
  wrap.append(buildHero(band));

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
    }, withMono(fmtMin(min)), el('span', { class: 'goal-chip__tier' }, tier.name));
    goals.append(chip);
  }
  wrap.append(goals);

  // ── 2초 꾹 시작 버튼 (수면) — 기포 3개가 올라온다 ──
  const startBtn = el('button', { type: 'button', class: 'home__start', 'aria-label': `${COPY.start} — 2초 꾹 누르면 시작` },
    el('span', { class: 'home__bubble home__bubble--1', 'aria-hidden': 'true' }),
    el('span', { class: 'home__bubble home__bubble--2', 'aria-hidden': 'true' }),
    el('span', { class: 'home__bubble home__bubble--3', 'aria-hidden': 'true' }),
    el('span', { class: 'home__start-main' }, COPY.start),
    el('span', { class: 'home__start-sub' }, '2초 꾹 누르면 물속으로'),
  );
  holdToStart(startBtn, () => {
    startSession({ goalMin, mode });
    showScreen('session');
  });
  wrap.append(startBtn);

  // ── 자유 잠수: 일반 탭 즉시 시작 (목표 시간 없음) ──
  wrap.append(
    el('button', {
      type: 'button',
      class: 'home__free',
      'aria-label': '자유 잠수 시작 — 목표 시간 없이',
      onclick: () => {
        startSession({ goalMin: null, mode });
        showScreen('session');
      },
    }, '재지 말고, 그냥 퐁당 →'),
  );

  root.append(wrap);
  setMode(mode); // 유지된 모드 반영
}

// ── 어항 입구 히어로 — 탱크·물고기 층은 장식(aria-hidden), 카피만 텍스트로 노출 ──
function buildHero(band) {
  const variant = AQUARIUM_VARIANTS[band];
  const ids = todayFishIds();

  const fishLayer = el('div', { class: 'home__hero-fish', 'aria-hidden': 'true' });
  if (ids.length) ids.forEach((id, i) => fishLayer.append(heroFish(id, i)));
  else fishLayer.append(heroFish(WELCOME_FISH_ID, 0, { welcome: true })); // 빈 상태: 웰컴 물고기 1마리

  return el('div', { class: 'home__hero' },
    el('div', { class: 'home__hero-tank', 'aria-hidden': 'true' },
      // fetchpriority 없음(auto) — LCP인 풀블리드 배경(home__bg)이 먼저 오게 대역폭 양보
      el('img', { src: src.tankBack(variant.tank), alt: '', decoding: 'async' }),
      fishLayer,
      el('img', { src: src.tankFront(variant.tank), alt: '', decoding: 'async' }),
    ),
    el('p', { class: 'home__hero-caption' },
      ids.length ? '오늘 만난 애들이야. 더 데려올래?' : '오늘의 첫 퐁당, 기다리고 있어.'),
  );
}

// ── 히어로 유영 물고기 — aquarium.js swim-fish 구조 재사용 (좁은 탱크용 파라미터) ──
const HERO_TIERS = [8, 38, 66]; // 세로 3층 분산 (%)
function heroFish(speciesId, index, { welcome = false } = {}) {
  if (!fishById(speciesId)) return el('span');
  let seed = index * 97;
  for (const c of speciesId) seed = (seed * 31 + c.charCodeAt(0)) % 100000;
  const rand = (min, max) => {
    seed = (seed * 9301 + 49297) % 233280;
    return min + (seed / 233280) * (max - min);
  };

  const vars = welcome
    ? ['--ty:38%', '--sx:8%', '--ex:64%', '--dur:24s', '--delay:-6s', '--bob:3.4s', '--scale:1']
    : [
      `--ty:${(HERO_TIERS[index % 3] + rand(0, 6)).toFixed(1)}%`, // 4마리째는 같은 층 + 지터로 겹침 회피
      `--sx:${(index * 14 + rand(0, 10)).toFixed(1)}%`,
      `--ex:${rand(52, 76).toFixed(1)}%`,
      `--dur:${rand(16, 22).toFixed(1)}s`,
      `--delay:-${rand(0, 16).toFixed(1)}s`, // 음수 딜레이 = 이미 헤엄치던 중
      `--bob:${rand(2.8, 4.2).toFixed(1)}s`,
      `--scale:${rand(0.8, 1.15).toFixed(2)}`,
    ];
  return el('div', { class: 'swim-fish', style: vars.join(';') },
    el('div', { class: 'swim-fish__flip' },
      el('img', { src: src.fish(speciesId), alt: '' }),
    ),
  );
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
