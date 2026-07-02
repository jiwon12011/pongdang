// ═══════════════════════════════════════════════════════════════
// screens/aquarium.js — 어항 (설계서 ⑥)
//   back → 물고기 → front 3레이어 · 시간대 4변형 · 최대 12마리 유영
//   좌우 스와이프 = 과거 세션 어항 순회 · 물멍 모드(15초 무입력)
//   지금 어항(0번)은 꾸미기(편집) 모드 — 로스터 넣기/빼기 큐레이션
// ═══════════════════════════════════════════════════════════════

import {
  COPY, AQUARIUM_VARIANTS, EDIT_UI, PAST_TANK_BG_POOL, RECEIPT_UI, TIMEBANDS,
  timebandOf, fishById, pickBySeed, src,
} from '../assets-data.js';
import { AQUARIUM_CAPACITY } from '../session.js';
import {
  addToTank, getBenchFish, getSessions, getTank, getTankFish, removeFromTank,
} from '../state.js';
import { $, el, currentScreen, fmtDate, showScreen, toast, withMono } from '../ui.js';
import { openArchivedReceipt } from './receipt.js';

let tankIndex = 0;      // 0 = 지금 어항, 1+ = 과거 세션 어항(최신순)
let restoreTank = null; // 지난 영수증에서 돌아올 때 보던 어항으로 복귀
let editMode = false;   // 꾸미기 모드 — 화면 재진입 시 항상 꺼진 상태로 시작
let justAdded = null;   // 방금 넣은 개체 uid → 재렌더 때 어항 쪽 plop 1회
let justBenched = null; // 방금 뺀 개체 uid → 재렌더 때 트레이 쪽 plop 1회
let idleTimer = null;
let idleWatcher = null;
let leaveTimer = null;  // 어항 이탈 감시 — 모듈 변수라 stopMulmeong이 확실히 지운다
const prefetched = new Set(); // 인접 어항 에셋 중복 프리페치 방지

// ── 어항 목록: [지금 어항, ...물고기가 있는 과거 세션 어항] ──
function buildTanks() {
  const roster = getTankFish(); // 로스터 순서 = 사용자가 꾸민 순서 (cap 12)
  const nowBand = timebandOf();
  const tanks = [{
    name: '지금 어항',
    meta: `${TIMEBANDS[nowBand].label} · ${roster.length}마리`,
    timeband: nowBand,
    // 지금 어항 = 실시간 시간대 매핑 유지 (시간대 정체성 보존 — 랜덤 없음)
    tankId: AQUARIUM_VARIANTS[nowBand].tank,
    bgId: AQUARIUM_VARIANTS[nowBand].bg,
    fishIds: roster.map((f) => f.speciesId),
    fish: roster, // 편집 모드 빼기용 개체 레코드(uid) — 과거 어항엔 없음
  }];
  // 과거 세션 어항 — 물고기가 있던 세션만, 최신순
  // (attempt 세션은 fishIds가 비어 여기서 걸러짐 → 영수증 버튼 대상도 자연히 없다)
  const past = getSessions().filter((s) => s.fishIds?.length).reverse();
  for (const s of past) {
    tanks.push({
      name: s.name,
      meta: `${fmtDate(s.startedAt)} · ${TIMEBANDS[s.timeband].label} · ${s.fishIds.length}마리`,
      timeband: s.timeband,
      // 세션에 저장된 변형 우선, 구세션(tank 없음)은 기존 timeband 매핑 폴백
      tankId: s.tank || AQUARIUM_VARIANTS[s.timeband].tank,
      // 배경은 session.id 시드 결정적 선택 — 구세션도 스키마 추가 없이 자동 다양화
      bgId: pickBySeed(PAST_TANK_BG_POOL, s.id),
      fishIds: s.fishIds,
      sessionId: s.id, // 지난 영수증 다시 보기용 — 지금 어항(집계)엔 없음
    });
  }
  return tanks;
}

// 화면 진입 시엔 항상 "지금 어항"부터 (과거 순회는 진입 후 스와이프로)
// 예외: 지난 영수증에서 돌아오는 길엔 보던 어항으로 — 이름 수정도 재렌더로 즉시 반영된다
export function renderAquarium() {
  tankIndex = restoreTank ?? 0;
  restoreTank = null;
  editMode = false; // 탭 이동 후 재진입 시 편집 상태는 항상 리셋
  rerender();
}

function rerender() {
  const root = $('[data-screen="aquarium"]');
  root.innerHTML = '';

  const tanks = buildTanks();
  if (tankIndex >= tanks.length) tankIndex = 0;
  const tank = tanks[tankIndex];
  const isHome = tankIndex === 0; // 지금 어항 = 편집 가능

  const wrap = el('div', {
    class: `aquarium${tank.timeband === 'night' ? ' aquarium--night' : ''}${editMode ? ' aquarium--edit' : ''}`,
    style: 'position:absolute;inset:0;',
  });

  // ── 무대: bg → tank back → 물고기 → tank front (3층 레이어) ──
  // 12칸(4×3) 그리드에 시드 셔플로 한 마리씩 배정 — 물고기가 뭉치지 않게
  // 편집 중엔 물고기가 "빼기" 버튼이 되므로 레이어 aria-hidden을 해제한다
  const cells = shuffledCells(tank.fishIds);
  const fishLayer = el('div', { class: 'aquarium__fish-layer', 'aria-hidden': editMode ? null : 'true' });
  tank.fishIds.forEach((id, i) => fishLayer.append(swimFish(id, i, cells[i % cells.length], isHome ? tank.fish[i] : null)));
  justAdded = null; // plop 연출은 1회만

  wrap.append(
    el('div', { class: 'aquarium__stage' },
      el('img', { class: 'aquarium__bg', src: src.bg(tank.bgId), alt: '' }),
      el('img', { class: 'aquarium__tank-back', src: src.tankBack(tank.tankId), alt: '' }),
      fishLayer,
      el('img', { class: 'aquarium__tank-front', src: src.tankFront(tank.tankId), alt: '' }),
    ),
  );

  // 빈 어항 — 결핍 금지: 기포 + 손낙서 별 + 다정한 카피
  // 지금 어항에서 "다 빼서" 빈 것(벤치에 있음)과 물고기가 아예 없는 것은 다른 상태
  if (!tank.fishIds.length) {
    const emptyMsg = isHome && getBenchFish().length ? EDIT_UI.emptyByEdit : COPY.emptyAquarium;
    wrap.append(
      el('div', { class: 'aquarium__empty' },
        el('img', { class: 'bubble-anim', src: src.decor('decor_final_004_bubble_cluster'), alt: '' }),
        el('img', { src: src.icon('icon_final_055_empty_state_shell'), alt: '', width: '30', height: '30', style: 'width:30px;margin:0 auto 8px;' }),
        el('p', {}, emptyMsg),
      ),
    );
  }

  // ── 글래스 헤더: 어항 이름 + 도구 버튼(지금=꾸미기 / 과거=영수증, 같은 슬롯) + 이전/다음 ──
  const prevBtn = el('button', { type: 'button', 'aria-label': '이전 어항', onclick: () => go(1) }, '‹');
  const nextBtn = el('button', { type: 'button', 'aria-label': '다음 어항', onclick: () => go(-1) }, '›');
  const syncNav = () => {
    prevBtn.disabled = editMode || tankIndex >= tanks.length - 1;
    nextBtn.disabled = editMode || tankIndex === 0;
  };
  syncNav();

  // 도구 버튼: tankIndex 0 = 꾸미기, 1+ = 지난 영수증 — 같은 자리라 ‹ › 위치가 안 튄다
  let toolBtn;
  let syncEditBtn = () => {}; // 과거 어항에선 no-op (setEdit은 지금 어항에서만 불린다)
  if (isHome) {
    const editIcon = el('img', { alt: '', width: '22', height: '22' }); // width/height 예약 — src 교체 시 CLS 방지
    toolBtn = el('button', {
      type: 'button',
      class: 'aquarium__edit-btn',
      onclick: () => setEdit(!editMode),
    }, editIcon);
    syncEditBtn = () => { // 초기 렌더·토글 공용 — 아이콘/aria를 editMode에 맞춘다
      toolBtn.setAttribute('aria-pressed', String(editMode));
      toolBtn.setAttribute('aria-label', editMode ? EDIT_UI.editDone : EDIT_UI.editBtn);
      editIcon.src = editMode ? src.icon('icon_final_017_check_ok') : src.icon('icon_final_047_palette_shell');
    };
    syncEditBtn();
  } else {
    toolBtn = el('button', {
      type: 'button',
      class: 'aquarium__receipt-btn',
      'aria-label': RECEIPT_UI.viewReceipt,
      onclick: () => {
        if (!openArchivedReceipt(tank.sessionId)) return; // 재구성 실패면 조용히 무시
        restoreTank = tankIndex; // 돌아오면 이 어항으로
        showScreen('receipt');
      },
    }, el('img', { src: src.icon('icon_final_012_receipt'), alt: '' }));
  }
  wrap.append(
    el('div', { class: 'glass-card aquarium__ui' },
      el('div', { class: 'aquarium__title' },
        el('div', { class: 'aquarium__name' }, tank.name),
        el('div', { class: 'aquarium__meta' }, withMono(tank.meta)), /* 숫자만 mono */
      ),
      el('div', { class: 'aquarium__nav' }, toolBtn, prevBtn, nextBtn),
    ),
  );

  // ── 편집 모드 안내 필 + 보관 트레이 (지금 어항 전용 — 표시는 CSS .aquarium--edit가) ──
  if (isHome) {
    wrap.append(
      el('div', { class: 'aquarium__edit-hint' }, EDIT_UI.editHint),
      buildTray(),
    );
  }
  justBenched = null; // plop 연출은 1회만

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

  // 꾸미기 토글 — 재렌더 없이 클래스·속성만 바꿔 트레이/점/테두리 전환이 부드럽게
  function setEdit(on) {
    editMode = on;
    wrap.classList.toggle('aquarium--edit', on);
    syncEditBtn();
    syncNav();
    if (on) fishLayer.removeAttribute('aria-hidden');
    else fishLayer.setAttribute('aria-hidden', 'true');
    // 비편집 땐 물고기 버튼을 탭 순서에서 제외 (레이어 pointer-events는 CSS가)
    for (const b of fishLayer.querySelectorAll('.swim-fish__btn')) b.tabIndex = on ? 0 : -1;
    if (on) stopMulmeong(); // 꾸미는 동안 UI가 가라앉으면 안 된다
    else startMulmeong();
  }

  // ── 좌우 스와이프 = 과거 어항 순회 (편집 중엔 잠금) ──
  let touchX = null;
  wrap.addEventListener('pointerdown', (e) => { touchX = e.clientX; });
  wrap.addEventListener('pointerup', (e) => {
    if (touchX === null) return;
    const dx = e.clientX - touchX;
    touchX = null;
    if (editMode) return;
    if (Math.abs(dx) > 48) go(dx < 0 ? 1 : -1); // 왼쪽으로 밀면 과거로
  });

  root.append(wrap);
  if (editMode) stopMulmeong(); // 편집 중 재렌더(넣기/빼기 뒤)에도 물멍 금지 유지
  else startMulmeong();
  prefetchNeighbors(tanks);
}

// ── 보관 트레이: 로스터 밖(벤치) 개체들 — 탭하면 어항에 넣기 ──
function buildTray() {
  const bench = getBenchFish();
  const row = bench.length
    ? el('div', { class: 'aquarium__tray-row' }, bench.map(trayItem))
    : el('div', { class: 'aquarium__tray-empty' }, EDIT_UI.trayEmpty);
  return el('div', { class: 'glass-card aquarium__tray', role: 'group', 'aria-label': EDIT_UI.trayAria },
    el('div', { class: 'aquarium__tray-label' }, EDIT_UI.trayLabel),
    row,
  );
}

function trayItem(f) {
  const species = fishById(f.speciesId);
  if (!species) return null; // 유실 종 방어 — el children이 null을 걸러준다
  const item = el('button', {
    type: 'button',
    class: `aquarium__tray-item${f.uid === justBenched ? ' plop-in' : ''}`, // 방금 뺀 애 등장 연출
    'aria-label': EDIT_UI.addFish(species.name),
    onclick: () => {
      // 꽉 찼으면 아무것도 움직이지 않고 토스트만 (addToTank와 같은 기준 = 로스터 길이)
      if (getTank().length >= AQUARIUM_CAPACITY) { toast(EDIT_UI.fullToast); return; }
      item.disabled = true; // 페이드 중 이중 탭 방지
      item.classList.add('aquarium__tray-item--out');
      setTimeout(() => {
        if (addToTank(f.uid)) {
          justAdded = f.uid;
          toast(EDIT_UI.addToast(species.name));
        }
        rerender();
      }, 200);
    },
  },
    el('img', { src: src.fish(f.speciesId), alt: '', width: '48', height: '48', loading: 'lazy' }),
    el('span', {}, species.name),
  );
  return item;
}

// ── 인접 어항(±1) 에셋을 유휴 시간에 미리 받아 스와이프 팝인 방지 ──
function prefetchNeighbors(tanks) {
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 200));
  idle(() => {
    for (const i of [tankIndex - 1, tankIndex + 1]) {
      const t = tanks[i];
      if (!t) continue;
      for (const url of [src.bg(t.bgId), src.tankBack(t.tankId), src.tankFront(t.tankId)]) {
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
// record(uid 있는 개체 레코드)가 오면 지금 어항 = "빼기" 버튼으로 감싼다
function swimFish(speciesId, index, cell, record = null) {
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
  const img = el('img', { src: src.fish(speciesId), alt: '', loading: 'lazy' });
  const flip = el('div', { class: 'swim-fish__flip' }, img);
  const justCame = record && record.uid === justAdded; // 방금 넣은 애 = 퐁당 등장

  let inner = flip;
  if (record) {
    const btn = el('button', {
      type: 'button',
      class: 'swim-fish__btn',
      'aria-label': EDIT_UI.removeFish(species.name),
      tabindex: editMode ? null : '-1', // 비편집 땐 탭 순서 제외 (클릭은 레이어 pointer-events가 막는다)
      onclick: () => {
        if (!editMode) return;
        btn.disabled = true; // 퇴장 중 이중 탭 방지
        wrapEl.classList.add('swim-fish--out');
        setTimeout(() => {
          if (removeFromTank(record.uid)) {
            justBenched = record.uid;
            toast(EDIT_UI.removeToast(species.name));
          }
          rerender();
        }, 250);
      },
    }, flip);
    inner = btn;
  }

  const wrapEl = el('div', {
    class: `swim-fish${justCame ? ' swim-fish--in' : ''}`,
    style: [
      `--ty:${(6 + row * 24 + rand(0, 14)).toFixed(1)}%`,
      `--sx:${(col * 16 + rand(0, 10)).toFixed(1)}%`,
      `--ex:${rand(52, 78).toFixed(1)}%`,
      `--dur:${rand(11, 26).toFixed(1)}s`,
      `--delay:-${rand(0, 20).toFixed(1)}s`, // 음수 딜레이 = 이미 헤엄치던 중
      `--bob:${rand(2.4, 4.4).toFixed(1)}s`,
      `--scale:${scale.toFixed(2)}`,
    ].join(';'),
  }, inner);
  // plop 등장이 끝나면 클래스를 떼서 둥실(bob) 애니로 복귀
  if (justCame) img.addEventListener('animationend', () => wrapEl.classList.remove('swim-fish--in'), { once: true });
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
