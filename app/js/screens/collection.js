// ═══════════════════════════════════════════════════════════════
// screens/collection.js — 도감 (설계서 ⑦)
//   50종 그리드 · 최근 만난 순 · 필터(희귀도/시간대/미획득)
//   미획득 = 연필 스케치 근사(CSS 필터) · 카드 상세
// ═══════════════════════════════════════════════════════════════

import { COPY, FISH, RARITY, RARITY_ORDER, TIMEBANDS, src } from '../assets-data.js';
import { getFish, getSessions } from '../state.js';
import { $, el, fmtDateFull, fmtMin } from '../ui.js';

let filter = { kind: 'all', value: null }; // all | rarity | timeband | unowned

export function renderCollection() {
  const root = $('[data-screen="collection"]');
  root.innerHTML = '';

  // 획득 정보 집계: 종 → { firstAt, lastAt, count, totalMin, firstSessionName }
  const owned = new Map();
  const sessions = new Map(getSessions().map((s) => [s.id, s]));
  for (const f of getFish()) {
    const s = sessions.get(f.sessionId);
    const info = owned.get(f.speciesId) || { firstAt: f.caughtAt, lastAt: f.caughtAt, count: 0, totalMin: 0, firstSessionName: s?.name || '' };
    info.count += 1;
    info.totalMin += s?.durationMin || 0;
    info.lastAt = Math.max(info.lastAt, f.caughtAt);
    owned.set(f.speciesId, info);
  }

  const wrap = el('div', { class: 'dex' });
  wrap.append(
    el('header', { class: 'dex__head' },
      el('h1', { class: 'hand-title dex__title' }, '도감'),
      el('span', { class: 'dex__count' }, `${owned.size} / ${FISH.length}`),
    ),
  );
  if (!owned.size) wrap.append(el('p', { class: 'dex__empty-note' }, COPY.emptyCollection));

  // ── 필터 칩: 전체 / 희귀도 5 / 시간대 4 / 미획득 ──
  const chips = el('div', { class: 'chip-row', role: 'group', 'aria-label': '도감 필터' });
  const addChip = (label, kind, value) => {
    const on = filter.kind === kind && filter.value === value;
    chips.append(el('button', {
      type: 'button',
      class: `chip${on ? ' chip--on' : ''}`,
      'aria-pressed': String(on),
      onclick: () => { filter = on ? { kind: 'all', value: null } : { kind, value }; renderCollection(); },
    }, label));
  };
  addChip('전체', 'all', null);
  for (const r of RARITY_ORDER) addChip(RARITY[r].label, 'rarity', r);
  for (const [k, v] of Object.entries(TIMEBANDS)) addChip(v.label, 'timeband', k);
  addChip('미획득', 'unowned', true);
  wrap.append(chips);

  // ── 정렬: 획득종(최근 만난 순) 먼저 → 미획득종 ──
  let list = [...FISH].sort((a, b) => {
    const ia = owned.get(a.id), ib = owned.get(b.id);
    if (ia && ib) return ib.lastAt - ia.lastAt;
    if (ia) return -1;
    if (ib) return 1;
    return 0;
  });
  if (filter.kind === 'rarity') list = list.filter((f) => f.rarity === filter.value);
  if (filter.kind === 'timeband') list = list.filter((f) => f.tags?.includes(filter.value));
  if (filter.kind === 'unowned') list = list.filter((f) => !owned.has(f.id));

  // ── 그리드 ──
  const grid = el('div', { class: 'dex-grid' });
  for (const f of list) {
    const has = owned.has(f.id);
    grid.append(el('button', {
      type: 'button',
      class: `dex-cell${has ? '' : ' dex-cell--unknown'}`,
      onclick: () => openDetail(f, owned.get(f.id)),
    },
      el('img', { src: src.fish(f.id), alt: '', loading: 'lazy', width: '62', height: '62' }),
      el('span', { class: 'dex-cell__name' }, has ? f.name : '???'),
    ));
  }
  if (!list.length) grid.append(el('p', { class: 'dex__empty-note', style: 'grid-column:1/-1' }, '이 물엔 아직 아무도 없네.'));
  wrap.append(grid);
  root.append(wrap);
}

// ── 카드 상세 (모달) ──
function openDetail(species, info) {
  const zone = $('#modal-zone');
  const close = () => {
    modal.classList.remove('modal--in');
    setTimeout(() => modal.remove(), 250);
  };
  const has = !!info;

  const rows = has
    ? [
        detailRow('희귀도', RARITY[species.rarity].label),
        detailRow('처음 만난 날', fmtDateFull(info.firstAt)),
        detailRow('만난 횟수', `${info.count}번`),
        detailRow('함께한 시간', fmtMin(info.totalMin)),
      ]
    : [detailRow('희귀도', RARITY[species.rarity].label), detailRow('상태', '아직 못 만났어')];

  const modal = el('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', onclick: (e) => { if (e.target === modal) close(); } },
    el('div', { class: 'modal__card paper-card' },
      el('div', { class: 'dex-detail' },
        el('img', { src: src.fish(species.id), alt: '', class: has ? '' : 'dex-cell--unknown-img', style: has ? '' : 'filter:grayscale(1) contrast(.65) brightness(1.08);opacity:.4;' }),
        el('div', { class: 'dex-detail__name' }, has ? species.name : '???'),
        el('span', { class: `rarity-badge rarity-badge--${species.rarity}`, style: `--rb:${RARITY[species.rarity].color}` }, RARITY[species.rarity].label),
        el('div', { class: 'dex-detail__rows' }, rows),
        has && info.firstSessionName
          ? el('p', { class: 'dex-detail__diary' }, `“${info.firstSessionName}”에서 처음 만났어`)
          : null,
      ),
      el('div', { class: 'modal__btns' },
        el('button', { type: 'button', class: 'btn btn--primary', onclick: close }, '닫기'),
      ),
    ),
  );
  zone.append(modal);
  setTimeout(() => modal.classList.add('modal--in'), 20);
}

function detailRow(dt, dd) {
  return el('dl', { class: 'receipt__row' }, el('dt', {}, dt), el('dd', {}, dd));
}
