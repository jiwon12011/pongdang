// ═══════════════════════════════════════════════════════════════
// app.js — 부팅: 화면 등록 · 탭바 · 세션 복원 · 에셋 프리로드
// ═══════════════════════════════════════════════════════════════

import { AQUARIUM_VARIANTS, timebandOf, src } from './assets-data.js';
import { getProfile } from './state.js';
import { activeSession } from './session.js';
import { $, $$, registerScreen, showScreen, currentScreen } from './ui.js';

import { renderOnboarding } from './screens/onboarding.js';
import { renderHome } from './screens/home.js';
import { renderSession } from './screens/session.js';
import { renderReceipt } from './screens/receipt.js';
import { renderAquarium } from './screens/aquarium.js';
import { renderCollection } from './screens/collection.js';
import { renderSettings } from './screens/settings.js';

// ── 화면 등록 ──
registerScreen('onboarding', renderOnboarding);
registerScreen('home', renderHome);
registerScreen('session', renderSession);
registerScreen('receipt', renderReceipt);
registerScreen('aquarium', renderAquarium);
registerScreen('collection', renderCollection);
registerScreen('settings', renderSettings);

// ── 탭바: 홈↔어항은 "물에 잠기는" 전환, 나머진 페이드 ──
$$('.tabbar__btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    const cur = currentScreen();
    if (target === cur) return;
    const dive =
      (cur === 'home' && target === 'aquarium') ||
      (cur === 'aquarium' && target === 'home');
    showScreen(target, { transition: dive ? 'dive' : 'fade' });
  });
});

// ── 성능: 현재 시간대 어항 레이어 프리로드 ──
// 홈 LCP와 대역폭 경쟁하지 않게 window load 후 유휴 시간으로 미룬다.
// 온보딩 화면은 어항 레이어(back/front)를 직접 쓰므로 그때는 bg만 제외.
function preloadCurrentAquarium(includeBg) {
  const variant = AQUARIUM_VARIANTS[timebandOf()];
  const urls = [src.tankBack(variant.tank), src.tankFront(variant.tank)];
  if (includeBg) urls.push(src.bg(variant.bg));
  urls.forEach((url) => { new Image().src = url; });
}
const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1));
window.addEventListener('load', () =>
  idle(() => preloadCurrentAquarium(getProfile().onboarded))
);

// ── 부팅 ──
// 1) 진행 중 세션이 있으면 이어서 잠수 (localStorage 복원)
// 2) 온보딩 전이면 빈 어항 + "5분만 엎어볼래?"
// 3) 아니면 홈
if (activeSession()) {
  showScreen('session');
} else if (!getProfile().onboarded) {
  showScreen('onboarding');
} else {
  showScreen('home');
}
