// ═══════════════════════════════════════════════════════════════
// screens/receipt.js — 영수증 (설계서 ⑤)
//   개봉 연출 → 인쇄되듯 등장 → 이름 짓기(점선 빈칸, 스킵 가능)
//   모노스페이스 POS 톤 + 손그림 프레임, CATCH OF THE DAY,
//   오늘의 한 줄(시간대·티어 조합), NEXT FISH HINT
// ═══════════════════════════════════════════════════════════════

import {
  COPY, DAILY_LINES, DEEP_LINES, RARITY, TIMEBANDS, src,
} from '../assets-data.js';
import { nextTierAfter, hintSpecies } from '../gacha.js';
import { updateSession, ownedSpeciesIds } from '../state.js';
import { $, el, showScreen, toast, reducedMotion, fmtMin, fmtDateFull } from '../ui.js';

let pending = null; // { session, fish, overflowed } — 세션 화면이 넘겨준다

export function setPendingReceipt(result) {
  pending = result;
}

export function renderReceipt() {
  const root = $('[data-screen="receipt"]');
  root.innerHTML = '';
  if (!pending) { showScreen('home'); return; }

  const wrap = el('div', { class: 'receipt', style: 'position:absolute;inset:0;' });
  root.append(wrap);

  // ── 1단계: 개봉 전 커버 — "젖은 손 닦고 열어봐" ──
  const cover = el('button', { type: 'button', class: 'receipt__cover' },
    el('img', { class: 'receipt__cover-icon', src: src.icon('icon_final_012_receipt'), alt: '' }),
    el('span', { class: 'receipt__cover-copy' }, COPY.openReceipt),
    el('span', { class: 'receipt__cover-tap' }, '톡, 하고 눌러줘'),
  );
  cover.addEventListener('click', () => {
    cover.remove();
    wrap.append(buildPaper(pending));
  }, { once: true });
  wrap.append(cover);
}

// ── 2단계: 영수증 종이 (인쇄 연출) ──
function buildPaper({ session, fish, overflowed }) {
  const top = fish[0]; // 추첨 결과는 레어 우선 정렬 — 맨 앞이 CATCH OF THE DAY
  const band = TIMEBANDS[session.timeband];

  // 세션 이름 짓기 — 점선 빈칸, 비우면 자동 이름 유지
  const nameInput = el('input', {
    class: 'receipt__name-input',
    type: 'text',
    maxlength: '20',
    placeholder: session.name,
    'aria-label': '이 시간의 이름',
  });

  const inner = el('div', { class: 'receipt__inner' },
    // 손그림 프레임 — 스크롤되는 내용 전체를 감싸도록 inner 기준으로 배치
    el('img', { class: 'receipt__frame', src: src.receipt('receipt_final_001_wobbly_receipt_frame'), alt: '' }),
    el('div', { class: 'receipt__shop' }, 'PONGDANG'),
    el('div', { class: 'receipt__addr' }, '어딘가의 조용한 물속 · 1번 어항'),
    el('div', { class: 'receipt__name-row' },
      nameInput,
      el('div', { class: 'receipt__name-ask' }, '이 시간에 이름을 붙여줄래? (그냥 둬도 돼)'),
    ),
    el('hr', { class: 'receipt__rule' }),
    row('DATE', fmtDateFull(session.startedAt)),
    row('DIVE TIME', fmtMin(session.durationMin)),
    row('WATER', `${band.label} 물`),
    row('TIER', session.tierName || '-'),
    session.mode === 'together' ? row('WITH', '같이 퐁당') : null,
    el('hr', { class: 'receipt__rule' }),

    // CATCH OF THE DAY — 가장 레어한 1마리 크게
    el('div', { class: 'receipt__section-label' }, '· CATCH OF THE DAY ·'),
    el('div', { class: 'receipt__catch' },
      el('img', { class: 'receipt__catch-frame', src: src.receipt('receipt_final_004_blank_fish_card_frame'), alt: '' }),
      el('img', { class: `receipt__catch-fish${reducedMotion() ? '' : ' plop-in'}`, src: src.fish(top.id), alt: top.name }),
    ),
    el('div', { class: 'receipt__catch-name hand-title' }, top.name),
    el('div', { class: 'receipt__catch-rarity' },
      el('span', {
        class: `rarity-badge rarity-badge--${top.rarity}`,
        style: `--rb:${RARITY[top.rarity].color}`,
      }, RARITY[top.rarity].label),
    ),

    // 나머지 물고기 스탬프 (매번 조금씩 다른 기울기)
    fish.length > 1 ? el('div', { class: 'receipt__stamps' },
      fish.slice(1).map((f) =>
        el('img', {
          class: 'receipt__stamp',
          src: src.fish(f.id),
          alt: f.name,
          style: `transform: rotate(${(Math.random() * 22 - 11).toFixed(1)}deg)`,
        })),
    ) : null,

    el('hr', { class: 'receipt__rule' }),
    el('p', { class: 'receipt__line' }, `“${dailyLine(session)}”`),
    el('hr', { class: 'receipt__rule' }),

    // NEXT FISH HINT
    el('div', { class: 'receipt__hint-box' },
      el('strong', {}, 'NEXT FISH HINT'),
      nextHint(session),
    ),

    session.stamp ? el('div', { class: 'receipt__stamp-mark' }, '심해 잠수꾼 인증 ✓') : null,
    el('div', { class: 'receipt__barcode', 'aria-hidden': 'true' }, '▮▯▮▮▯▮▯▮▮▮▯▮▯▮▮▯▮▮▯▮▯▮▮▯▮'),

    el('div', { class: 'receipt__btns' },
      el('button', { type: 'button', class: 'btn btn--ghost', onclick: () => leave('home') }, '홈으로'),
      el('button', { type: 'button', class: 'btn btn--primary', onclick: () => leave('aquarium') }, '어항 보러 가기'),
    ),
  );

  function leave(to) {
    const name = nameInput.value.trim();
    if (name) updateSession(session.id, { name }); // 스킵하면 자동 이름 그대로
    pending = null;
    showScreen(to, { transition: to === 'aquarium' ? 'dive' : 'fade' });
    if (overflowed) setTimeout(() => toast(COPY.moveOut), 900); // 12마리 초과 → 이사 안내
  }

  const paper = el('div', { class: `receipt__paper${reducedMotion() ? '' : ' receipt__paper--print'}` }, inner);
  return el('div', { class: 'receipt__paper-clip' }, paper);
}

function row(dt, dd) {
  return el('dl', { class: 'receipt__row' }, el('dt', {}, dt), el('dd', {}, dd));
}

// 오늘의 한 줄 — 시간대 템플릿에서 세션 id 기반으로 안정적으로 선택, 긴 세션은 한 줄 가산
function dailyLine(session) {
  const lines = DAILY_LINES[session.timeband];
  const seed = [...session.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  let line = lines[seed % lines.length];
  if (session.durationMin >= 90) line += ' ' + DEEP_LINES[seed % DEEP_LINES.length];
  return line;
}

// NEXT FISH HINT — 다음 티어 안내 + 미획득 종 힌트
function nextHint(session) {
  const parts = [];
  const next = nextTierAfter(session.durationMin);
  if (next) {
    parts.push(`${next.min}분을 채우면 ${RARITY[next.ceiling].label} 등급까지 올라온대.`);
  } else {
    parts.push('여기보다 깊은 곳은 없어. 넌 이미 심해 잠수꾼.');
  }
  const hint = hintSpecies(ownedSpeciesIds(), session.timeband);
  if (hint) {
    const when = hint.tags?.length ? `${TIMEBANDS[hint.tags[0]].label}에 잘 나타난대` : '어딘가에서 기다리고 있대';
    parts.push(`『${hint.name}』는 ${when}.`);
  }
  return parts.join(' ');
}
