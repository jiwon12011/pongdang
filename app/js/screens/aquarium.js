// ═══════════════════════════════════════════════════════════════
// screens/aquarium.js — 어항 (설계서 ⑥)
//   back → 물고기 → front 3레이어 · 시간대 4변형 · 최대 12마리 유영
//   좌우 스와이프 = 과거 세션 어항 순회 · 물멍 모드(15초 무입력)
// ═══════════════════════════════════════════════════════════════

import {
  COPY, AQUARIUM_VARIANTS, TIMEBANDS, timebandOf, fishById, src,
} from '../assets-data.js';
import { AQUARIUM_CAPACITY } from '../session.js';
import { getFish, getSessions } from '../state.js';
import { $, el, currentScreen, fmtDate, withMono } from '../ui.js';

let tankIndex = 0;      // 0 = 지금 어항, 1+ = 과거 세션 어항(최신순)
let idleTimer = null;
let idleWatcher = null;
let leaveTimer = null;  // 어항 이탈 감시 — 모듈 변수라 stopMulmeong이 확실히 지운다
const prefetched = new Set(); // 인접 어항 에셋 중복 프리페치 방지

// ── 어항 목록: [지금 어항, ...물고기가 있는 과거 세션 어항] ──
function buildTanks() {
  const allFish = getFish();
  const recent = allFish.slice(-AQUARIUM_CAPACITY); // 최근 12마리만 지금 어항에
  const tanks = [{
    name: '지금 어항',
    meta: `${TIMEBANDS[timebandOf()].label} · ${recent.length}마리`,
    timeband: timebandOf(),
    fishIds: recent.map((f) => f.speciesId),
  }];
  // 과거 세션 어항 — 물고기가 있던 세션만, 최신순
  const past = getSessions().filter((s) => s.fishIds?.length).reverse();
  for (const s of past) {
    tanks.push({
      name: s.name,
      meta: `${fmtDate(s.startedAt)} · ${TIMEBANDS[s.timeband].label} · ${s.fishIds.length}마리`,
      timeband: s.timeband,
      fishIds: s.fishIds,
    });
  }
  return tanks;
}

// 화면 진입 시엔 항상 "지금 어항"부터 (과거 순회는 진입 후 스와이프로)
export function renderAquarium() {
  tankIndex = 0;
  rerender();
}

function rerender() {
  const root = $('[data-screen="aquarium"]');
  root.innerHTML = '';

  const tanks = buildTanks();
  if (tankIndex >= tanks.length) tankIndex = 0;
  const tank = tanks[tankIndex];
  const variant = AQUARIUM_VARIANTS[tank.timeband];

  const wrap = el('div', {
    class: `aquarium${tank.timeband === 'night' ? ' aquarium--night' : ''}`,
    style: 'position:absolute;inset:0;',
  });

  // ── 무대: bg → tank back → 물고기 → tank front (3층 레이어) ──
  // 12칸(4×3) 그리드에 시드 셔플로 한 마리씩 배정 — 물고기가 뭉치지 않게
  const cells = shuffledCells(tank.fishIds);
  const fishLayer = el('div', { class: 'aquarium__fish-layer', 'aria-hidden': 'true' });
  tank.fishIds.forEach((id, i) => fishLayer.append(swimFish(id, i, cells[i % cells.length])));

  wrap.append(
    el('div', { class: 'aquarium__stage' },
      el('img', { class: 'aquarium__bg', src: src.bg(variant.bg), alt: '' }),
      el('img', { class: 'aquarium__tank-back', src: src.tankBack(variant.tank), alt: '' }),
      fishLayer,
      el('img', { class: 'aquarium__tank-front', src: src.tankFront(variant.tank), alt: '' }),
    ),
  );

  // 빈 어항 — 결핍 금지: 기포 + 손낙서 별 + 다정한 카피
  if (!tank.fishIds.length) {
    wrap.append(
      el('div', { class: 'aquarium__empty' },
        el('img', { class: 'bubble-anim', src: src.decor('decor_final_004_bubble_cluster'), alt: '' }),
        el('img', { src: src.decor('decor_final_005_gold_sparkle_star'), alt: '', style: 'width:30px;margin:0 auto 8px;' }),
        el('p', {}, COPY.emptyAquarium),
      ),
    );
  }

  // ── 글래스 헤더: 어항 이름 + 이전/다음 ──
  const prevBtn = el('button', { type: 'button', 'aria-label': '이전 어항', disabled: tankIndex >= tanks.length - 1 ? '' : null, onclick: () => go(1) }, '‹');
  const nextBtn = el('button', { type: 'button', 'aria-label': '다음 어항', disabled: tankIndex === 0 ? '' : null, onclick: () => go(-1) }, '›');
  wrap.append(
    el('div', { class: 'glass-card aquarium__ui' },
      el('div', { class: 'aquarium__title' },
        el('div', { class: 'aquarium__name' }, tank.name),
        el('div', { class: 'aquarium__meta' }, withMono(tank.meta)), /* 숫자만 mono */
      ),
      el('div', { class: 'aquarium__nav' }, prevBtn, nextBtn),
    ),
  );

  // 페이지 점 (최대 7개까지만 — 과거가 많아도 어지럽지 않게)
  const dots = el('div', { class: 'aquarium__dots', 'aria-hidden': 'true' });
  const shown = Math.min(tanks.length, 7);
  for (let i = 0; i < shown; i++) {
    dots.append(el('span', { class: `aquarium__dot${i === Math.min(tankIndex, shown - 1) ? ' aquarium__dot--on' : ''}` }));
  }
  wrap.append(dots);

  function go(delta) {
    const next = tankIndex + delta;
    if (next < 0 || next >= tanks.length) return;
    tankIndex = next;
    rerender();
  }

  // ── 좌우 스와이프 = 과거 어항 순회 ──
  let touchX = null;
  wrap.addEventListener('pointerdown', (e) => { touchX = e.clientX; });
  wrap.addEventListener('pointerup', (e) => {
    if (touchX === null) return;
    const dx = e.clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 48) go(dx < 0 ? 1 : -1); // 왼쪽으로 밀면 과거로
  });

  root.append(wrap);
  startMulmeong();
  prefetchNeighbors(tanks);
}

// ── 인접 어항(±1) 에셋을 유휴 시간에 미리 받아 스와이프 팝인 방지 ──
function prefetchNeighbors(tanks) {
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 200));
  idle(() => {
    for (const i of [tankIndex - 1, tankIndex + 1]) {
      const t = tanks[i];
      if (!t) continue;
      const v = AQUARIUM_VARIANTS[t.timeband];
      for (const url of [src.bg(v.bg), src.tankBack(v.tank), src.tankFront(v.tank)]) {
        if (prefetched.has(url)) continue;
        prefetched.add(url);
        new Image().src = url;
      }
    }
  });
}

// ── 유영 배치: 12칸(4열×3행) 그리드를 시드 셔플 — 같은 어항은 항상 같은 배치 ──
function shuffledCells(fishIds) {
  const cells = [...Array(12).keys()];
  let seed = 7;
  for (const id of fishIds) for (const c of id) seed = (seed * 31 + c.charCodeAt(0)) % 100000;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = cells.length - 1; i > 0; i--) { // 피셔-예이츠
    const j = Math.floor(rnd() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  return cells;
}

// ── 유영 물고기 한 마리: 그리드 셀 = 초기 분산, 종 id 시드 = 속도·둥실 개성 ──
function swimFish(speciesId, index, cell) {
  const species = fishById(speciesId);
  if (!species) return el('span');
  let seed = index * 97;
  for (const c of speciesId) seed = (seed * 31 + c.charCodeAt(0)) % 100000;
  const rand = (min, max) => {
    seed = (seed * 9301 + 49297) % 233280;
    return min + (seed / 233280) * (max - min);
  };

  const col = cell % 4;                // 0..3 → 가로 출발 지점 분산
  const row = Math.floor(cell / 4);    // 0..2 → 세로 층 분산
  const scale = rand(0.75, 1.35);
  const wrapEl = el('div', {
    class: 'swim-fish',
    style: [
      `--ty:${(6 + row * 24 + rand(0, 14)).toFixed(1)}%`,
      `--sx:${(col * 16 + rand(0, 10)).toFixed(1)}%`,
      `--ex:${rand(52, 78).toFixed(1)}%`,
      `--dur:${rand(11, 26).toFixed(1)}s`,
      `--delay:-${rand(0, 20).toFixed(1)}s`, // 음수 딜레이 = 이미 헤엄치던 중
      `--bob:${rand(2.4, 4.4).toFixed(1)}s`,
      `--scale:${scale.toFixed(2)}`,
    ].join(';'),
  },
    el('div', { class: 'swim-fish__flip' },
      el('img', { src: src.fish(speciesId), alt: '', loading: 'lazy' }),
    ),
  );
  return wrapEl;
}

// ── 물멍 모드: 15초 무입력 → UI 가라앉음, 입력 시 복귀 ──
function startMulmeong() {
  const app = $('#app');
  stopMulmeong();

  const arm = () => {
    app.classList.remove('app--mulmeong');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => app.classList.add('app--mulmeong'), 15000);
  };
  idleWatcher = arm;
  document.addEventListener('pointerdown', arm);
  document.addEventListener('keydown', arm);
  arm();

  // 어항을 떠나면 감시 해제 — 모듈 변수 leaveTimer라 재렌더 때마다 확실히 정리됨
  leaveTimer = setInterval(() => {
    if (currentScreen() !== 'aquarium') stopMulmeong();
  }, 500);
}

function stopMulmeong() {
  clearInterval(leaveTimer);
  leaveTimer = null;
  clearTimeout(idleTimer);
  if (idleWatcher) {
    document.removeEventListener('pointerdown', idleWatcher);
    document.removeEventListener('keydown', idleWatcher);
    idleWatcher = null;
  }
  $('#app').classList.remove('app--mulmeong');
}
