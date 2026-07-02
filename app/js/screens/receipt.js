// ═══════════════════════════════════════════════════════════════
// screens/receipt.js — 영수증 (설계서 ⑤) · 이중 모드
//   라이브: 개봉 커버 → 인쇄되듯 등장 → 이름 짓기(점선 빈칸, 스킵 가능)
//   다시 보기(archive): 어항에서 지난 세션을 재구성 — 커버·HINT 없음,
//   인쇄 연출은 유지("다시 뽑는 감각"), "지난 영수증" 스탬프 뱃지
//   모노스페이스 POS 톤 + 손그림 프레임, CATCH OF THE DAY,
//   오늘의 한 줄(세션 id 시드 — 언제 다시 봐도 같은 문구)
// ═══════════════════════════════════════════════════════════════

import {
  COPY, DAILY_LINES, DEEP_LINES, RECEIPT_UI, RARITY, TIMEBANDS, fishById, src,
} from '../assets-data.js';
import { nextTierAfter, hintSpecies } from '../gacha.js';
import { getSession, updateSession, ownedSpeciesIds } from '../state.js';
import { $, el, showScreen, toast, reducedMotion, fmtMin, fmtDateFull, rangJosa } from '../ui.js';

let pending = null;  // 라이브: { session, fish, overflowed } — 세션 화면이 넘겨준다
let archived = null; // 다시 보기: { session, fish } — 어항에서 재구성해 들어온다

export function setPendingReceipt(result) {
  pending = result;
  archived = null; // 새 라이브 영수증이 오면 지난 다시 보기 상태는 버린다
}

// 지난 영수증 다시 보기 — state.sessions[] 기록에서 재구성.
// fishIds는 정산 때 레어 우선으로 정렬돼 저장됨 → [0]이 그대로 CATCH OF THE DAY.
// 라이브 pending은 절대 건드리지 않는다 (다시 보기가 라이브 흐름을 오염시키지 않게).
// origin: 어디서 열었나('aquarium' | 'settings') — 복귀 화면 분기. 어항 호출부는 무변경(기본값).
export function openArchivedReceipt(sessionId, { origin = 'aquarium' } = {}) {
  const session = getSession(sessionId);
  const fish = (session?.fishIds || []).map(fishById).filter(Boolean);
  if (!fish.length) return false; // attempt(물고기 없음) 등 — 보여줄 영수증이 없다
  archived = { session, fish, origin };
  return true;
}

export function renderReceipt() {
  const root = $('[data-screen="receipt"]');
  root.innerHTML = '';

  const wrap = el('div', { class: 'receipt', style: 'position:absolute;inset:0;' });

  // 다시 보기 — 개봉 커버는 라이브 전용, 바로 인쇄 연출로 들어간다
  if (archived) {
    wrap.append(buildPaper({ ...archived, archive: true }));
    root.append(wrap);
    return;
  }

  if (!pending) { showScreen('home'); return; }
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

// ── 2단계: 영수증 종이 (라이브 = 인쇄 연출 / archive = 즉시) ──
function buildPaper({ session, fish, overflowed = false, archive = false, origin = 'aquarium' }) {
  const top = fish[0]; // 추첨 결과는 레어 우선 정렬 — 맨 앞이 CATCH OF THE DAY
  const band = TIMEBANDS[session.timeband];

  // 세션 이름 짓기 — 점선 빈칸, 비우면 기존 이름 유지 (다시 보기에서도 동작)
  const nameInput = el('input', {
    class: 'receipt__name-input',
    type: 'text',
    maxlength: '20',
    placeholder: session.name,
    'aria-label': '이 시간의 이름',
  });

  // "간직하기" — 라이브·다시 보기 공용 이미지 저장
  const saveBtn = el('button', { type: 'button', class: 'btn btn--soft' }, RECEIPT_UI.saveReceipt);
  saveBtn.addEventListener('click', () => saveReceiptImage(clip, session, saveBtn, nameInput));

  const inner = el('div', { class: 'receipt__inner' },
    el('div', { class: 'receipt__shop' }, 'PONGDANG'),
    el('div', { class: 'receipt__addr' }, '어딘가의 조용한 물속 · 1번 어항'),
    el('div', { class: 'receipt__name-row' },
      nameInput,
      el('div', { class: 'receipt__name-ask' },
        archive ? RECEIPT_UI.nameAskArchive : '이 시간에 이름을 붙여줄래? (그냥 둬도 돼)'),
    ),
    el('hr', { class: 'receipt__rule' }),
    row('DATE', fmtDateFull(session.startedAt)),
    row('DIVE TIME', fmtMin(session.durationMin)),
    row('WATER', `${band.label} 물`),
    row('TIER', session.tierName || '-'),
    withRow(session),
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

    // NEXT FISH HINT — 라이브 전용 ("다음"은 지난 기록엔 안 어울린다)
    archive ? null : el('div', { class: 'receipt__hint-box' },
      el('strong', {}, 'NEXT FISH HINT'),
      nextHint(session),
    ),

    session.stamp ? el('div', { class: 'receipt__stamp-mark' }, '심해 잠수꾼 인증 ✓') : null,
    el('div', { class: 'receipt__barcode', 'aria-hidden': 'true' }, '▮▯▮▮▯▮▯▮▮▮▯▮▯▮▮▯▮▮▯▮▯▮▮▯▮'),

    // 버튼 영역 — 행간 8px은 actions의 gap이 관리, 캡처 시엔 통째로 제외된다
    el('div', { class: 'receipt__actions' },
      el('div', { class: 'receipt__save-row' }, saveBtn),
      el('div', { class: 'receipt__btns' },
        archive
          // primary는 라이브 획득 순간 전용 — 다시 보기 복귀는 soft. 복귀처는 연 곳(origin)으로
          ? el('button', { type: 'button', class: 'btn btn--soft', onclick: () => leave(origin) },
            origin === 'settings' ? RECEIPT_UI.backToSettings : RECEIPT_UI.backToAquarium)
          : [
            el('button', { type: 'button', class: 'btn btn--ghost', onclick: () => leave('home') }, '홈으로'),
            el('button', { type: 'button', class: 'btn btn--primary', onclick: () => leave('aquarium') }, '어항 보러 가기'),
          ],
      ),
    ),
  );

  function leave(to) {
    const name = nameInput.value.trim();
    if (name) updateSession(session.id, { name }); // 스킵하면 기존 이름 그대로
    if (archive) archived = null; // 라이브 pending은 여기서 건드리지 않는다
    else pending = null;
    showScreen(to, { transition: to === 'aquarium' ? 'dive' : 'fade' });
    if (!archive && overflowed) setTimeout(() => toast(COPY.moveOut), 900); // 12마리 초과 이사 안내 — 라이브 전용
  }

  // 인쇄 연출은 archive에서도 유지 — "다시 뽑는 감각" (designer 스펙)
  const paper = el('div', { class: `receipt__paper${reducedMotion() ? '' : ' receipt__paper--print'}` },
    archive ? el('div', { class: 'receipt__archive-badge' }, RECEIPT_UI.archiveBadge) : null,
    inner,
  );
  // 밑단 지그재그 — 캡처(html2canvas)가 pseudo-element를 놓치지 않게 실제 요소로 둔다
  const clip = el('div', { class: 'receipt__paper-clip' },
    paper,
    el('div', { class: 'receipt__zigzag', 'aria-hidden': 'true' }),
  );
  return clip;
}

function row(dt, dd) {
  return el('dl', { class: 'receipt__row' }, el('dt', {}, dt), el('dd', {}, dd));
}

// WITH 행 — 같이 퐁당 동행자. members[0]=나(스키마 보장) → 위치로 잘라낸다
// (닉네임은 세션 뒤에도 바뀔 수 있어 이름 비교 대신 위치 제외 — 결과 동일, 개명에도 안전)
// 구세션(members 없음)이 together였으면 폴백 라벨, solo·동행자 0이면 행 없음.
function withRow(session) {
  const companions = (session.members || []).slice(1);
  if (companions.length) return row(RECEIPT_UI.withLabel, withValue(companions));
  if (!session.members && session.mode === 'together') return row(RECEIPT_UI.withLabel, RECEIPT_UI.withFallback);
  return null;
}

// 동행자 표기 (designer 확정): 1명 "동동이랑" · 2~3명 "동동이, 미미랑" · 4명+ "동동이, 미미랑 2명 더"
function withValue(companions) {
  if (companions.length > 3) {
    const [a, b] = companions;
    return `${a}, ${b}${rangJosa(b)}${RECEIPT_UI.withMore(companions.length - 2)}`;
  }
  const last = companions[companions.length - 1];
  return [...companions.slice(0, -1), last + rangJosa(last)].join(', ');
}

// 오늘의 한 줄 — 시간대 템플릿에서 세션 id 기반으로 안정적으로 선택, 긴 세션은 한 줄 가산
// (id·durationMin 모두 저장값 → 다시 보기에서도 같은 세션이면 반드시 같은 문구)
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

// ── 간직하기: 영수증 종이 → PNG (1순위 OS 공유 시트 → 2순위 다운로드) ──
// html2canvas는 버튼을 누른 순간에만 CDN에서 동적 import — 부팅 번들에 안 섞인다.
// 결과물은 #2A3153 액자(좌우 32/상하 40px 여백)에 종이가 든 구도 (designer 스펙).
const FRAME_BG = '#2A3153'; // 영수증 화면 그라디언트 상단색
const FRAME_PAD = { x: 32, y: 40 };

async function saveReceiptImage(clip, session, btn, nameInput) {
  if (btn.disabled) return;
  btn.disabled = true;
  btn.textContent = RECEIPT_UI.saving;
  try {
    const { default: html2canvas } =
      await import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm');

    const paper = $('.receipt__paper', clip);
    // 스크롤로 잘린 아랫부분까지 — 종이 전체 높이로 캡처 (offset-client 차 = 보더).
    // 버튼 영역은 onclone에서 제거되므로 높이 측정에서도 빼야 한다 — 안 빼면 캡처
    // 하단에 버튼 높이만큼 빈 띠가 생기고 지그재그가 종이에서 떨어진다.
    // (display 토글→측정→복원이 같은 태스크 안이라 중간 페인트 없음 = 깜빡임 없음)
    const actions = $('.receipt__actions', clip);
    actions.style.display = 'none';
    const fullH = paper.scrollHeight + (paper.offsetHeight - paper.clientHeight);
    actions.style.display = '';
    // 이름은 입력값 우선, 비어 있으면 현재(자동) 이름 — 캡처에선 잉크색 정적 텍스트로
    const displayName = nameInput.value.trim() || session.name;
    const scale = 2; // 선명도

    const shot = await html2canvas(clip, {
      backgroundColor: null, // 둥근 모서리 밖은 투명하게 두고 아래에서 액자색으로 합성
      scale,
      useCORS: true,
      height: fullH,
      windowHeight: fullH + 80,
      onclone: (doc) => {
        // 진행 중 애니메이션(plop-in·인쇄)의 중간값이 찍히지 않게 클론에서 제거 — 최종 상태로 캡처
        for (const n of doc.querySelectorAll('.plop-in')) n.classList.remove('plop-in');
        for (const n of doc.querySelectorAll('.receipt__paper--print')) n.classList.remove('receipt__paper--print');
        // 버튼 영역은 그림에서 제외
        for (const n of doc.querySelectorAll('.receipt__actions')) n.remove();
        // 이름 입력 → 정적 텍스트 (캐럿·회색 placeholder가 찍히지 않게)
        const inp = doc.querySelector('.receipt__name-input');
        if (inp) {
          const txt = doc.createElement('div');
          txt.className = 'receipt__name-print';
          txt.textContent = displayName;
          inp.replaceWith(txt);
        }
        // 스크롤 잘림 해제 — 전체 길이 노출 (지그재그는 실제 요소라 bottom:0에 따라온다)
        const p = doc.querySelector('.receipt__paper');
        const c = doc.querySelector('.receipt__paper-clip');
        if (p) { p.style.maxHeight = 'none'; p.style.overflow = 'visible'; }
        if (c) { c.style.maxHeight = 'none'; c.style.height = `${fullH}px`; }
      },
    });

    // 액자 합성: 밤색 단색 배경 위에 종이를 얹는다
    const canvas = document.createElement('canvas');
    canvas.width = shot.width + FRAME_PAD.x * 2 * scale;
    canvas.height = shot.height + FRAME_PAD.y * 2 * scale;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = FRAME_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(shot, FRAME_PAD.x * scale, FRAME_PAD.y * scale);

    const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
    if (!blob) throw new Error('캡처 실패');
    const name = RECEIPT_UI.receiptFileName(session);

    // 1순위: OS 공유 시트 (파일 공유 가능한 모바일 브라우저)
    const file = new File([blob], name, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        toast(RECEIPT_UI.saveDone);
        return;
      } catch (err) {
        if (err.name === 'AbortError') return; // 사용자가 시트를 닫음 — 실패 아님, 조용히
        // 그 외 오류는 다운로드로 폴백
      }
    }

    // 2순위: PNG 다운로드
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: name });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast(RECEIPT_UI.saveDone);
  } catch {
    toast(RECEIPT_UI.saveFail); // CDN 실패·오프라인 — 열람 기능엔 영향 없음, 버튼 원상복구
  } finally {
    btn.disabled = false;
    btn.textContent = RECEIPT_UI.saveReceipt;
  }
}
