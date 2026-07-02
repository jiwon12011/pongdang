// ═══════════════════════════════════════════════════════════════
// ui.js — 라우터·토스트·모달·꾹 누르기·전환 연출·포맷 유틸
// ═══════════════════════════════════════════════════════════════

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// 간단 엘리먼트 생성기: el('div', {class:'a', onclick}, child...)
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined) node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined) continue;
    node.append(c.nodeType ? c : document.createTextNode(c));
  }
  return node;
}

// ── 라우터: 화면 이름 → 렌더 함수 등록, 전환은 페이드(기본)/다이브(홈↔어항) ──
const screens = {};
let current = null;
let navigating = false;

export function registerScreen(name, render) {
  screens[name] = { el: $(`[data-screen="${name}"]`), render };
}
export function currentScreen() {
  return current;
}

export function showScreen(name, { transition = 'fade' } = {}) {
  if (navigating || !screens[name]) return;
  const next = screens[name];
  const useDive = transition === 'dive' && !reducedMotion();

  const swap = () => {
    if (current && screens[current]) {
      screens[current].el.hidden = true;
      screens[current].el.classList.remove('screen--in');
    }
    current = name;
    next.el.hidden = false;
    next.render?.();
    // rAF는 탭이 가려져 있으면 안 돌아서(백그라운드 전환) setTimeout으로 페이드 인
    setTimeout(() => { if (current === name) next.el.classList.add('screen--in'); }, 20);
    updateTabbar(name);
  };

  if (useDive) {
    // 홈↔어항 "물에 잠기는" 전환: 물이 차오르는 동안 화면 교체
    navigating = true;
    const overlay = $('#dive-overlay');
    overlay.classList.add('dive-overlay--rise');
    setTimeout(swap, 450);
    setTimeout(() => {
      overlay.classList.remove('dive-overlay--rise');
      overlay.classList.add('dive-overlay--fall');
      setTimeout(() => {
        overlay.classList.remove('dive-overlay--fall');
        navigating = false;
      }, 500);
    }, 550);
  } else {
    swap();
  }
}

// 탭바 활성 표시 + 풀스크린 화면(세션·영수증)에선 숨김
function updateTabbar(name) {
  const bar = $('#tabbar');
  const isFull = screens[name]?.el.classList.contains('screen--full');
  const isOnboarding = name === 'onboarding';
  bar.hidden = isFull || isOnboarding;
  $$('.tabbar__btn', bar).forEach((btn) =>
    btn.classList.toggle('tabbar__btn--active', btn.dataset.tab === name)
  );
}

// ── 토스트 ──
export function toast(message, ms = 2800) {
  const zone = $('#toast-zone');
  const node = el('div', { class: 'toast' }, message);
  zone.append(node);
  setTimeout(() => node.classList.add('toast--in'), 20);
  setTimeout(() => {
    node.classList.remove('toast--in');
    setTimeout(() => node.remove(), 400);
  }, ms);
}

// ── 확인 모달 (버튼 2개, Promise<boolean>) ──
export function confirmModal(message, { okLabel = '응', cancelLabel = '아니' } = {}) {
  return new Promise((resolve) => {
    const zone = $('#modal-zone');
    const close = (val) => {
      wrap.classList.remove('modal--in');
      setTimeout(() => wrap.remove(), 250);
      resolve(val);
    };
    const wrap = el('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' },
      el('div', { class: 'modal__card paper-card' },
        el('p', { class: 'modal__msg' }, message),
        el('div', { class: 'modal__btns' },
          el('button', { type: 'button', class: 'btn btn--ghost', onclick: () => close(false) }, cancelLabel),
          el('button', { type: 'button', class: 'btn btn--primary', onclick: () => close(true) }, okLabel),
        ),
      ),
    );
    zone.append(wrap);
    setTimeout(() => wrap.classList.add('modal--in'), 20);
    $('.btn--primary', wrap).focus();
  });
}

// ── "젖은 화면" 연출: 물방울이 흘러내리며 1.5초에 걸쳐 밝아짐 ──
export function playWetScreen(onDone) {
  const overlay = $('#wet-overlay');
  if (reducedMotion()) { onDone?.(); return; }
  overlay.classList.add('wet-overlay--play');
  setTimeout(() => {
    overlay.classList.remove('wet-overlay--play');
    onDone?.();
  }, 1500);
}

// ── 포맷 ──
// 숫자 구간만 IBM Plex Mono로 감싼다 — 한글 단위·조사는 body 폰트 (타이포 3층 분리)
export function withMono(text) {
  return String(text).split(/(\d[\d:.]*)/).map((part) =>
    /^\d/.test(part) ? el('span', { class: 'mono' }, part) : part
  );
}

// 끝글자 받침 유무로 '이랑'/'랑' 선택 — 한글 음절이 아니면 '랑' (designer 확정 규칙)
export function rangJosa(name) {
  const code = name.charCodeAt(name.length - 1) - 0xAC00;
  return code >= 0 && code < 11172 && code % 28 > 0 ? '이랑' : '랑';
}

export function fmtMin(min) {
  const m = Math.floor(min);
  if (m < 60) return `${m}분`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h}시간 ${rest}분` : `${h}시간`;
}
export function fmtClock(min) {
  // 세션 화면용 mm:ss (분 단위 소수 → 시계)
  const total = Math.max(0, Math.floor(min * 60));
  const mm = String(Math.floor(total / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}
export function fmtDate(ts) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}
export function fmtDateFull(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}
