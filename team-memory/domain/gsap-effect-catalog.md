---
name: gsap-effect-catalog
description: "사용자가 보내준 외부 GSAP 코드(본인 다른 프로젝트 + GSAP.com 홈페이지)에서 추려낸 모션 효과 카탈로그 — \"그 메모 읽고 쓸만한거 가져와\" 요청 시 참조"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 190c5ffb-48cf-4edf-951f-eae32429af99
---

사용자가 2026-06-18 대화에서 붙여넣은 GSAP 소스 묶음에서 뽑은 효과 목록. 사용자가 "메모 읽고 쓸만한 거 가져와"라고 하면 이 목록에서 골라 제안/구현한다. (정리는 상상의 문용만이 아니라 전체를 기록 — 다른 프로젝트에도 재사용)

## 출처 1 — 사용자 본인 다른 프로젝트(학교/포트폴리오, SplitText + Lenis + ScrollTrigger.matchMedia)
1. SplitText char 비행 등장 — `x:500, y:-50, rotateY:190, rotate:10, letterSpacing:"-0.2em", stagger:0.05, duration:1` (드라마틱 텍스트 리빌)
2. 여행 이미지(mainImgWrap) — 섹션 가로지르며 scale/rotate, scrub 타임라인 (섹션별 top/scale 갱신)
3. pin+scrub skill 리스트 리빌 — `.skill-box li` from `{autoAlpha:0, y:100, backgroundColor:"purple", stagger:0.2}`
4. bg_circle 페이드 — `fromTo(circle,{opacity:0},{opacity:0.3, toggleActions:"play none none reverse"})`
5. toggleClass "on" — `ScrollTrigger.create({toggleClass:{targets, className:"on"}})` 진입 시 CSS 상태 토글
6. 가로 스크롤 배너(Section5) — pin+scrub, `ul`을 x로 `-(offsetWidth-innerWidth)` 이동
7. 이미지 위로 솟기 + 텍스트 좌우 슬라이드 (Section6 app) — `from y:100/x:±100, autoAlpha:0`
8. 텍스트박스 좌/우 진입 (Section7) — `from {left:'50%'}` (※ left는 레이아웃속성 → x로 변환해야 60fps)
9. 사진 흩뿌리기 어셈블 (Section9 photo1~15) — 각자 다른 left/top offset에서 같은 타임라인 라벨로 동시 비행

## 출처 2 — GSAP.com 홈페이지
A. ⭐ 마그네틱 버튼 플레어 (`Button` 클래스) — 버튼 안 반투명 광원(flair span)이 `quickSetter`로 마우스 따라다니고 hover 시 scale/opacity. 포인터 이벤트(스크롤 무관) → 모달서 100% 안정. 골드/글래스 무드에 최적
B. clipPath 마스크 리빌 — `.clip{overflow:hidden}` + 텍스트 슬라이드업 (히어로에 이미 적용한 방식)
C. 로고 hover 키프레임 모프 — 글자↔아이콘(열쇠구멍·번개·타이머·꽃) 랜덤 전환. "상상의문=열쇠" 모티프와 닿지만 통째 복제는 과함
D. watchPreferredMotion — `gsap.matchMedia('(prefers-reduced-motion: no-preference)')` 모션 게이트
E. gsap.utils.random — 타임라인/값 랜덤 선택(변주)
F. ScrollTrigger 헤더 숨김/표시 — onLeave/onEnterBack 토글
G. 여행 텍스트 트랙 / goo 필터 블롭 / 가로 showcase 드래그 — pin/scrub/대형에셋 → 모달 부적합

## 출처 3 — websseu GSAP ScrollTrigger 튜토리얼 시리즈 (gsap03·05·06·07·12·13·15)
GSAP 3.11.5 + ScrollTrigger(+ ScrollToPlugin) 기반. 거의 다 scrub/pin/snap 위주 → **모달엔 부적합 많음**, 풀페이지(about·index)에 적합.
- ㄱ. **섹션 핀+스냅 (gsap03)** — `gsap.utils.toArray(".item").forEach` 로 각 섹션 `ScrollTrigger.create({start:"top top",pin:true,pinSpacing:false})`. 전역 `ScrollTrigger.create({snap:{snapTo:(p,self)=>{ panelStarts=tops.map(st=>st.start); snap=gsap.utils.snap(panelStarts,self.scroll()); return gsap.utils.normalize(0,ScrollTrigger.maxScroll(window),snap)}, duration:0.5}})` → 섹션 단위 착 붙는 스냅.
- ㄴ. ⭐ **방향별 리빌 (gsap05)** — `hide(el)=gsap.set(el,{autoAlpha:0})` 먼저, 진입 시 `fromTo(el,{autoAlpha:0,x,y},{autoAlpha:1,x:0,y:0,delay:el.dataset.delay,duration:1.25,ease:"expo",overwrite:"auto"})`. 방향은 클래스로: `reveal_LTR`(x:-100)·`reveal_BTT`(y:100)·`reveal_TTB`(y:-100)·기본(x:100). `ScrollTrigger.create({trigger,start:"top bottom",end:"bottom top",onEnter})`. **data-delay로 요소별 시차** → 모달에도 once 진입으로 응용 가능(스크럽 아님).
- ㄷ. **SplitType 글자 리빌 (gsap06)** — `new SplitType(target,{type:"lines,words,chars"})` 후 `gsap.from(chars,{yPercent:100,autoAlpha:0,duration:1,ease:"circ.out",stagger:{amount:1,from:"random"},scrollTrigger:{trigger,start:"top bottom"}})`. (SplitText 유료 대체로 무료 `split-type` 라이브러리 사용 — CDN `unpkg.com/split-type`). 수동 char-split 예시도 주석에 있음(여백은 `&nbsp;`, `aria-label` 보존).
- ㄹ. ⭐ **섹션별 배경색 전환 (gsap07)** — 각 섹션 `data-bgcolor` → `onEnter/onEnterBack: gsap.to("body",{backgroundColor:color,duration:1.4})`. (CSS 변수 `--bg-color`를 전역 타임라인 scrub로 굴리는 대안도 주석.) **모달에도 적용 쉬움**(onEnter는 once/scrub 무관).
- ㅁ. **가로 스크롤 (gsap12)** — `gsap.to(sections,{xPercent:-100*(len-1),ease:"none",scrollTrigger:{trigger:cont,pin:true,scrub:1,snap:1/(len-1),end:"+=7000"}})`.
- ㅂ. **세로 속 가로 구간 (gsap13)** — 세로 페이지 중 `#horizontal`만 핀+가로: `end:()=>"+="+(cont.offsetWidth-innerWidth), pin:true, scrub:1, snap:{snapTo:1/(len-1),inertia:false}, invalidateOnRefresh:true, anticipatePin:1`.
- ㅅ. **Lenis 스무스 스크롤 (gsap15)** — `const lenis=new Lenis(); function raf(t){lenis.raf(t);requestAnimationFrame(raf)} requestAnimationFrame(raf)`. (이 레포는 모달용 `smooth-process.js`로 자체 lerp 구현 중 → 중복 주의.)
- 공통: 이미지 `filter:saturate(0%)→hover saturate(100%)+scale(1.025)` 흑백→컬러 hover, `parallax__item__num` 대형 반투명 인덱스 숫자 데코.

## 출처 4 — GSAP 제품 페이지 (gsap.com /scroll /svg /text /ui /core)
출처 2(홈)와 같은 디자인 시스템. 새로 눈에 띈 컴포넌트:
- 테스티모니얼 슬라이더(grid 겹침 + 컨트롤 dot/arrow), showcase 드래그 캐러셀(Draggable), hover-video(마우스오버 시 video opacity 페이드), 플러그인 카드 그리드, `get-gsap-btn` 멀티 도형 플레어(원·풍차·사각·별이 버튼 주위 떠다님 — 출처 2-A 마그네틱 플레어의 확장형).
- ScrollSmoother/ScrollTrigger/Flip/Draggable/MotionPath 데모 패턴 다수 — 대부분 대형 SVG/scrub → 모달 부적합, 풀페이지 후보.

## 상상의 문 모달 제약 (중요)
- 이 모달(`#process-sangsang .process__content`)은 native overflow + scale 컨텍스트 → **scrub·pin 불안정**. once 진입 트리거(`ST(el,"top 85%")`)만 안정.
- SplitText 미로드(GSAP 3.12.5 공유 CDN) → 버전업 말고 **수동 char-split** 사용.
- reduced-motion 전역 early-return 이미 있음(making-sangsang.js line 31).
- ss3는 이미 data-anim 흩뿌리기 구현됨 → 9번 중복 금지.
- 신규 소스 중 **모달 적합**: ㄴ(방향 리빌, once로)·ㄹ(섹션 배경색 onEnter)·ㄷ(split-type char, CDN 추가 시)·2-A(마그네틱 플레어, 이미 ss5/CTA에 적용됨). **부적합**: ㄱ·ㅁ·ㅂ(pin/scrub), ㅅ(Lenis — smooth-process.js와 중복).

## 출처 5 — Framer 사이트 "Majd" 포트폴리오 (majd-portfolio.framer.website, 사용자 첨부 HTML)
사용자가 레퍼런스로 붙여넣은 Framer 빌드. 붙여넣은 부분은 **폰트·CSS reset·디자인 토큰 레이어**가 대부분이고, 실제 모션 JS는 Framer 런타임(별도 모듈 로드)이라 페이스트엔 미포함. 그래도 *구조/세팅* 차원에서 뽑을 학습:
- **디자인 토큰 패턴** — `:root`가 아니라 `body`에 CSS 변수로 컬러 팔레트 전체를 토큰화(`--token-...`): bg `#faf7f3`(크림), text `#111`, accent `#eb4d6d`(레드), 그리고 같은 색의 알파 변형(`80`,`1a`,`4d`,`e6`)을 미리 변수로. → **블랙/화이트 포트폴리오에도 그대로 차용**: `--bg:#000; --fg:#fff; --fg-60:#fff9; --fg-40:#fff6; --line:#ffffff1a; --accent:...` 식으로 알파 변형까지 토큰화해두면 글래스/보더/흐린 텍스트 일관성↑.
- **폰트 스택** — Inter(가변) + Archivo(300~900 + ital) + Clash Grotesk. `*-Placeholder` 폰트(`src:local("Arial")` + `ascent/descent-override`)로 **웹폰트 로드 전 레이아웃 시프트(CLS) 방지** — Archivo 쓸 거면 이 placeholder override 기법 복제 가치 있음(perf-engineer 체크).
- **커스텀 커서** — `framer-lib-cursors-host` 컴포넌트로 커스텀 커서 구동. 사용자가 원한 "커서 위치별 ASK/KEEP/DROP/FIX 텍스트 변경" 아이디어와 직결 → 별도 커서 레이어 + pointer 추적(quickSetter)으로 자체 구현(출처 2-A 마그네틱 플레어와 같은 quickSetter 패턴).
- **반응형 분기** — 3-tier 브레이크포인트: `≥1280`(desktop)·`810~1279.98`(tablet)·`≤809.98`(mobile), tier마다 `hidden-*` 유틸 클래스로 show/hide.
- **will-change 게이트** — `--framer-will-change-override:transform`, `--framer-will-change-filter-override:filter`를 `@supports`로 조건부 적용 → 모션/필터 많은 페이지에서 will-change 남발 대신 토큰으로 통제.
- **antialiasing** — `-webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale` 전역(블랙 배경 흰 글씨에서 또렷함 차이 큼 → 꼭 넣기).
> 결론: 모션 *효과* 자체는 못 긁었지만(런타임 미포함), **토큰화·폰트 placeholder·커스텀 커서·will-change 통제** 4개는 "블랙 배경 + 화려한 모션" 포트폴리오에 바로 적용할 세팅 학습.

관련: [[portfolio-asset-verify-workflow]]
