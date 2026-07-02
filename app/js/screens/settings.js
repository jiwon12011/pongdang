// ═══════════════════════════════════════════════════════════════
// screens/settings.js — 설정: 닉네임 · 데모 배속(×60) · 데이터 초기화
// ═══════════════════════════════════════════════════════════════

import { getProfile, setProfile, resetAll } from '../state.js';
import { $, el, confirmModal, toast, showScreen } from '../ui.js';

export function renderSettings() {
  const root = $('[data-screen="settings"]');
  root.innerHTML = '';

  const profile = getProfile();

  // 닉네임 — 입력 즉시 저장 (버튼 없이 가볍게)
  const nickInput = el('input', {
    class: 'settings__input',
    type: 'text',
    maxlength: '12',
    value: profile.nickname,
    placeholder: '물속에서 부를 이름',
    'aria-label': '닉네임',
    onchange: (e) => {
      setProfile({ nickname: e.target.value.trim() });
      toast('이름, 기억해 둘게');
    },
  });

  // 데모 배속 토글 — 프로토타입 전용
  const demoToggle = el('input', {
    type: 'checkbox',
    role: 'switch',
    'aria-label': '데모 배속 켜기',
    onchange: (e) => {
      setProfile({ demoSpeed: e.target.checked });
      toast(e.target.checked ? '데모 배속 켬 — 1분이 1초로 흐를 거야' : '데모 배속 끔');
    },
  });
  if (profile.demoSpeed) demoToggle.checked = true;

  root.append(
    el('div', { class: 'settings' },
      el('h1', { class: 'hand-title settings__title' }, '설정'),

      el('div', { class: 'glass-card settings__card' },
        el('label', { class: 'settings__label', for: 'nick' }, '닉네임'),
        nickInput,
      ),

      el('div', { class: 'glass-card settings__card' },
        el('div', { class: 'settings__row' },
          el('div', {},
            el('div', { class: 'settings__label' }, '데모 배속 ×60'),
            el('div', { class: 'settings__desc' }, '시연용. 게임 속 1분이 실제 1초로 흘러. 다음 세션부터 적용.'),
          ),
          el('label', { class: 'toggle' },
            demoToggle,
            el('span', { class: 'toggle__track' }),
            el('span', { class: 'toggle__thumb' }),
          ),
        ),
      ),

      el('div', { class: 'glass-card settings__card' },
        el('div', { class: 'settings__label' }, '데이터'),
        el('div', { class: 'settings__desc' }, '물고기·세션·이름 전부 지워져. 되돌릴 수 없어.'),
        el('button', {
          type: 'button',
          class: 'btn btn--ghost settings__danger',
          onclick: async () => {
            const sure = await confirmModal('정말 다 지울까?\n어항이 처음처럼 비어버려.', { okLabel: '지울래', cancelLabel: '안 지울래' });
            if (sure) {
              resetAll();
              toast('물을 새로 갈았어');
              showScreen('onboarding');
            }
          },
        }, '데이터 초기화'),
      ),

      el('p', { class: 'settings__foot' }, '퐁당 프로토타입 v0.1 — 물결이 잠깐 흐려지면, 곧 맑아질 거야'),
    ),
  );
}
