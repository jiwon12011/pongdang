// ═══════════════════════════════════════════════════════════════
// screens/onboarding.js — 설명 없이 첫 퐁당 (설계서 ②)
//   빈 어항 + "5분만 엎어볼래?" 버튼 하나. 튜토리얼 화면 없음.
// ═══════════════════════════════════════════════════════════════

import { COPY, AQUARIUM_VARIANTS, timebandOf, src } from '../assets-data.js';
import { $, el, holdToStart, showScreen } from '../ui.js';
import { startSession } from '../session.js';

export function renderOnboarding() {
  const root = $('[data-screen="onboarding"]');
  root.innerHTML = '';

  const variant = AQUARIUM_VARIANTS[timebandOf()];

  const btn = el('button', { type: 'button', class: 'onboarding__btn', 'aria-label': '5분만 엎어볼래? — 2초 꾹 누르면 시작' },
    '5분만 엎어볼래?',
    el('span', { class: 'onboarding__btn-sub' }, '2초 꾹'),
  );
  holdToStart(btn, () => {
    // 온보딩 전용 5분 미니 세션 (티어 예외 → 웰컴 물고기)
    startSession({ goalMin: 5, mode: 'solo', onboarding: true });
    showScreen('session');
  });

  root.append(
    el('div', { class: 'onboarding' },
      el('div', { class: 'onboarding__tank', 'aria-hidden': 'true' },
        el('img', { src: src.tankBack(variant.tank), alt: '' }),
        el('img', { src: src.tankFront(variant.tank), alt: '' }),
      ),
      el('p', { class: 'onboarding__copy' }, COPY.emptyAquarium),
      btn,
      el('p', { class: 'onboarding__hint' }, COPY.onboardingHint),
    ),
  );
}
