---
# DEVFORGE 파일 지도

이 문서는 파일을 찾는 시간을 줄이기 위한 저장소 지도입니다. 파일 목록은 기능별로 묶었으며, 생성 파일·이미지처럼 같은 규칙을 반복하는 항목은 폴더 단위로 설명합니다.

---
## 1. 최상위 구조

```text
css-styling/
├─ app/                     Next.js 화면과 API
├─ docs/                    개발 설계, 계획과 저장소 문서
├─ internal/                배포하지 않는 프로젝트 원본 보관
├─ lib/                     인증, 데이터와 업무 규칙
├─ public/                  정적 공개 페이지, 스크립트, 스타일과 이미지
├─ scripts/                 페이지 생성·보관과 이미지 최적화 도구
├─ supabase/migrations/     데이터베이스와 접근 정책
├─ tests/                   Node 기반 자동 검사
├─ .env.example             환경 변수 이름 예시
├─ next.config.mjs          Next.js 설정
├─ package.json             실행 명령과 패키지 정의
├─ pnpm-lock.yaml           고정 의존성 버전
├─ proxy.ts                 세션 갱신과 연령 제한 프록시
├─ README.md                빠른 시작과 운영 설정
├─ TRANSFER-GUIDE.md        인수인계 문서
└─ tsconfig.json            TypeScript 검사 설정
```

---
## 2. 루트 설정 파일

| 파일 | 역할 | 변경 시 확인 |
| --- | --- | --- |
| `.env.example` | 필요한 환경 변수 이름 안내 | 실제 값이나 비밀 키를 넣지 않기 |
| `.gitignore` | Git 제외 규칙 | 소스 파일이 실수로 제외되지 않는지 확인 |
| `next.config.mjs` | Next.js 이미지와 개발 출처 설정 | 빌드와 이미지 동작 확인 |
| `next-env.d.ts` | Next.js TypeScript 선언 | 직접 편집하지 않기 |
| `package.json` | 스크립트와 의존성 | 잠금 파일 함께 갱신 |
| `pnpm-lock.yaml` | 설치 버전 고정 | 수동 편집하지 않기 |
| `pnpm-workspace.yaml` | pnpm 작업 공간과 빌드 허용 설정 | 패키지 설치 뒤 검토 |
| `postcss.config.mjs` | PostCSS와 Tailwind 처리 | 전역 CSS 빌드 확인 |
| `proxy.ts` | Supabase 세션 갱신, 관리자와 연령 제한 접근 | 인증·연령 테스트 실행 |
| `tsconfig.json` | strict TypeScript와 `@/*` 별칭 | 타입 검사 실행 |

---
## 3. `app/` Next.js 화면과 API

---
### 공통 파일

| 파일 | 역할 |
| --- | --- |
| `app/layout.tsx` | 전체 HTML 레이아웃, 공통 테마·개인정보 동의·분석 모듈 연결 |
| `app/page.tsx` | 루트 경로를 `/main.html`로 이동 |
| `app/globals.css` | Next.js 화면의 전역 기본 스타일 |
| `app/site-header.tsx` | Next 화면용 공통 헤더(정적 페이지와 같은 메뉴, 반응형 메뉴 스크립트 연결) |
| `app/not-found.tsx` | 없는 페이지(404) 안내 |
| `app/error.tsx` | 화면 오류 안내와 다시 시도 |
| `app/global-error.tsx` | 공통 틀까지 실패했을 때의 단독 오류 안내 |
| `app/page-translator.tsx` | 하이드레이션 뒤 영어 화면 번역 시작 |
| `app/robots.ts` | 검색엔진 수집 규칙(관리자·회원·성인 경로 제외) |
| `app/sitemap.ts` | 공개 페이지와 성인 제외 게임 소개 사이트맵 |

---
### 관리자 영역

| 파일 | 역할 |
| --- | --- |
| `app/admin/admin.css` | 관리자 화면 공통 디자인과 테마 토큰 연결 |
| `app/admin/layout.tsx` | 관리자 화면 레이아웃 |
| `app/admin/admin-pagination.tsx` | 관리자 목록 페이지 이동(목록 종류 같은 조회 조건 유지) |
| `app/admin/login/page.tsx` | 관리자 로그인 페이지 |
| `app/admin/login/login-form.tsx` | 로그인 입력과 오류 처리 |
| `app/admin/news/page.tsx` | 관리자 뉴스 목록 |
| `app/admin/news/new/page.tsx` | 새 뉴스 작성 페이지 |
| `app/admin/news/[id]/edit/page.tsx` | 뉴스 수정 페이지 |
| `app/admin/news/news-editor.tsx` | 뉴스 편집 폼 |
| `app/admin/news/actions.ts` | 뉴스 생성·수정·삭제 서버 작업 |
| `app/admin/news/delete-news-button.tsx` | 뉴스 삭제 확인과 실행 |
| `app/admin/news/admin-header.tsx` | 관리자 공통 헤더(글·상품·댓글 관리와 공개 화면 이동) |
| `app/admin/products/page.tsx` | 관리자 상품 목록 |
| `app/admin/products/new/page.tsx` | 새 상품 작성 페이지 |
| `app/admin/products/[id]/edit/page.tsx` | 상품 수정 페이지 |
| `app/admin/products/product-editor.tsx` | 상품 편집 폼 |
| `app/admin/products/delete-product-button.tsx` | 상품 삭제 확인과 실행 |
| `app/admin/products/actions.ts` | 상품 생성·수정·삭제 서버 작업 |
| `app/admin/comments/page.tsx` | 댓글·신고 관리 목록(신고 대기·숨긴 댓글·최근 댓글) |
| `app/admin/comments/moderation-board.tsx` | 댓글 카드, 신고 기록, 처리 메모와 숨김·공개·기각·삭제 버튼 |
| `app/admin/comments/actions.ts` | 관리자 확인 뒤 댓글 처리와 처리 기록 저장 서버 작업 |
| `app/admin/demo/page.tsx` | Supabase 없는 개발 환경 전용 관리자 데모 화면 |
| `app/admin/demo/admin-demo.tsx` | 저장하지 않는 뉴스·상품 편집 데모 |
| `app/admin/demo/demo-moderation.tsx` | 저장하지 않는 댓글 관리 데모 |
| `app/admin/demo/demo-contact.tsx` | 저장하지 않는 문의함 데모 |
| `app/admin/contact/page.tsx` | 관리자 문의함 목록(답변 대기·완료·전체) |
| `app/admin/contact/inbox-board.tsx` | 문의 카드, 처리 메모와 답변 완료·되돌리기 버튼 |
| `app/admin/contact/actions.ts` | 관리자 확인 뒤 문의 처리 상태 저장 서버 작업 |
| `app/admin/notify/page.tsx` | 관리자 출시 알림 화면(게임별 신청 수) |
| `app/admin/notify/summary-table.tsx` | 게임별 수신 중·수신 거부 수 표(이메일 주소 미표시) |
| `app/notify/unsubscribe/page.tsx` | 출시 알림 수신 거부 화면(주소 값 형식 확인) |
| `app/notify/unsubscribe/unsubscribe-panel.tsx` | 수신 거부 버튼과 결과 안내 |

---
### 회원·뉴스·연령 확인

| 파일 | 역할 |
| --- | --- |
| `app/login/page.tsx` | 회원 로그인 페이지와 켜진 로그인 방식 조회 |
| `app/login/member-login-form.tsx` | 이메일 로그인 폼, 간편 로그인, 비밀번호 찾기·회원가입 연결 |
| `app/login/social-login-buttons.tsx` | Supabase에서 켠 간편 로그인 버튼(시연 모드는 비활성 미리보기) |
| `app/login/consent-fields.tsx` | 필수 동의(만 14세 이상·이용약관·개인정보) 입력 |
| `app/login/member-access.tsx` | 현재 로그인 계정 표시, 로그아웃과 실제 모드 닉네임 확인 |
| `app/login/member-nickname-form.tsx` | 실제 모드 댓글 닉네임 저장·변경과 간편 가입 첫 동의 폼 |
| `app/login/forgot/page.tsx` | 비밀번호 찾기 페이지 |
| `app/login/forgot/forgot-password-form.tsx` | 비밀번호 재설정 메일 요청(계정 존재 여부 비공개) |
| `app/login/reset/page.tsx` | 새 비밀번호 설정 페이지 |
| `app/login/reset/reset-password-form.tsx` | 메일 링크 세션 확인과 새 비밀번호 저장 |
| `app/signup/page.tsx` | 회원가입 페이지와 가입 중지 안내 |
| `app/signup/signup-form.tsx` | 이메일 가입 입력·검증, 인증 메일 안내와 간편 가입 |
| `app/login/member-login.module.css` | 회원 로그인 화면 스타일 |
| `app/news/[id]/page.tsx` | 뉴스 상세 조회 |
| `app/news/[id]/comments-panel.tsx` | 댓글·답글·반응·신고 UI |
| `app/news/[id]/news-detail.module.css` | 뉴스 상세와 댓글 스타일 |
| `app/age-verification/page.tsx` | 연령 확인 페이지 |
| `app/age-verification/age-verification-form.tsx` | 생년 확인 입력과 API 요청 |
| `app/age-verification/age-verification.module.css` | 연령 확인 스타일 |
| `app/auth/callback/route.ts` | Supabase 인증 결과와 안전한 복귀 처리, 실패 시 로그인 안내 |
| `app/auth/confirm/route.ts` | 이메일 인증·비밀번호 재설정 메일 링크 확인 |
| `app/account/page.tsx` | 내 정보 페이지(검색 제외) |
| `app/account/account-panel.tsx` | 닉네임 변경, 내 댓글 확인·삭제, 회원 탈퇴(시연·Supabase 모드) |
| `app/account/account.module.css` | 내 정보 전용 스타일 |

---
### API

| 파일 | 역할 |
| --- | --- |
| `app/api/news/route.ts` | 설정 상태와 공개 뉴스 목록 반환, 미설정 시 빈 목록 반환 |
| `app/api/products/route.ts` | 설정 상태와 공개 상품 목록 반환, 미설정 시 빈 목록 반환 |
| `app/api/community/youtube/route.ts` | YouTube 조회, 캐시, 연령 확인과 대체 데이터 |
| `app/api/age/status/route.ts` | 연령 확인 쿠키 상태 반환 |
| `app/api/age/verify/route.ts` | 연령 검증과 서명 쿠키 발급 |
| `app/api/member/status/route.ts` | 정적 페이지 상단 회원 버튼용 로그인 여부·공개 닉네임 반환(이메일 미포함) |
| `app/api/contact/route.ts` | 문의 접수(요청 횟수 제한, 검증, 시연 모드·저장 분기) |
| `app/api/notify/route.ts` | 출시 알림 신청 접수(요청 횟수 제한, 검증, 시연 모드·저장 분기) |
| `app/api/notify/unsubscribe/route.ts` | 출시 알림 수신 거부 처리 |

---
## 4. `lib/` 업무 규칙

---
### 연령 제한

| 파일 | 역할 |
| --- | --- |
| `lib/age-gate/config.ts` | 성인 프로젝트, 쿠키 이름과 유효 시간 |
| `lib/age-gate/proxy-policy.ts` | 보호 경로 판단과 복귀 경로 생성 |
| `lib/age-gate/request.ts` | 요청 쿠키에서 확인 상태 판독 |
| `lib/age-gate/verification.ts` | HMAC 토큰 생성과 검증 |

---
### 관리자 인증과 도구

| 파일 | 역할 |
| --- | --- |
| `lib/auth/admin-policy.ts` | 이메일과 `app_metadata.role` 관리자 판정 |
| `lib/auth/admin.ts` | 관리자 세션 요구와 이동 처리 |
| `lib/auth/login-message.ts` | 로그인 결과 메시지 정리 |
| `lib/admin/pagination.ts` | 관리자 목록 한 페이지 항목 수와 페이지 계산 |
| `lib/admin/demo-mode.ts` | 관리자 데모 사용 가능 판정과 저장 없는 뉴스·상품 검증 |
| `lib/forms/validation.ts` | 입력 오류 순서, 첫 오류 초점 이동과 잘못된 제출 차단 |
| `lib/http/rate-limit.ts` | 서버 요청 횟수 제한(요청자별 기준 시간, 기억 한도)과 요청자 주소 읽기 |
| `lib/http/json.ts` | JSON 요청 본문 크기·형식 확인, 캐시하지 않는 응답과 요청 제한 응답 |
| `lib/mail/config.ts` | 메일 설정 읽기(세 값이 모두 올바를 때만 켜짐), 이메일·보내는 주소 형식 확인 |
| `lib/mail/sender.ts` | Resend로 글자 본문 메일 발송, 제목 정리, 실패 종류 구분(내용 오류·거부·시간 초과·연결 실패) |
| `lib/mail/templates.ts` | 문의 접수 알림 메일 양식(답장 주소는 문의한 사람) |

---
### 회원과 댓글

| 파일 | 역할 |
| --- | --- |
| `lib/member/config.ts` | 데모·Supabase 회원 모드 판정 |
| `lib/member/demo-session.ts` | 로컬 데모 프로필 저장·읽기와 안전한 복귀 주소 |
| `lib/member/profile.ts` | 닉네임 규칙(1~20자), Supabase 회원 프로필 조회·저장과 이메일 가입 프로필 자동 생성 |
| `lib/member/auth-providers.ts` | 간편 로그인 지원 목록(카카오·Google·Apple·Discord·X·Facebook)과 Supabase 인증 설정 조회 |
| `lib/member/signup.ts` | 이메일·비밀번호·필수 동의 검증과 인증 오류 안내 문구 |
| `lib/member/account.ts` | 내 댓글 조회·삭제, 댓글 이미지 정리와 회원 탈퇴 요청 |
| `lib/site-url.ts` | 공개 사이트 주소(`SITE_URL`·Vercel 주소)와 검색 노출·제외 경로 |
| `lib/comments/domain.ts` | 댓글, 이미지, 반응과 신고 규칙 |
| `lib/comments/service.ts` | 댓글 저장소 공통 계약과 오류 형식 |
| `lib/comments/rules.ts` | 로컬·Supabase 댓글 서비스 공통 입력 검증과 작성 제한 오류 변환 |
| `lib/comments/guard.ts` | 댓글 작성 제한 수치와 판정(연속 작성·작성 수·같은 내용·링크 수·금칙어), 안내 문구, 관리자 자동 감지 사유 |
| `lib/comments/banned-words.ts` | 댓글 금칙어 목록(데이터베이스 표와 같은 목록) |
| `lib/comments/local-service.ts` | 새로고침 시 초기화되는 메모리 댓글 저장소 |
| `lib/comments/supabase-service.ts` | 같은 계약의 Supabase 댓글 저장소(조회·작성·이미지·반응·신고) |
| `lib/comments/moderation.ts` | 관리자 댓글 처리 규칙과 데모·Supabase 관리 서비스 |
| `lib/contact/domain.ts` | 문의 분류와 입력 검증(이메일·제목·내용·동의, 자동 입력 방지 칸) |
| `lib/contact/inbox.ts` | 문의 저장, 관리자 문의함 목록·처리와 데모·Supabase 서비스 |
| `lib/notify/domain.ts` | 출시 알림 대상 게임 판정, 신청 입력 검증, 수신 거부 값 형식 |
| `lib/notify/store.ts` | 출시 알림 신청·수신 거부 함수 호출, 게임별 집계 정리와 시연 집계 |

---
### 뉴스

| 파일 | 역할 |
| --- | --- |
| `lib/news/demo-posts.ts` | Supabase 미설정 시 표시할 뉴스 |
| `lib/news/types.ts` | 뉴스 데이터 타입 |
| `lib/news/validation.ts` | 뉴스 입력과 대표 이미지 검증 |

---
### 상품

| 파일 | 역할 |
| --- | --- |
| `lib/products/types.ts` | 상품과 재고 타입 |
| `lib/products/validation.ts` | 관리자 상품 입력 검증 |
| `lib/products/public-product.ts` | 공개 API용 안전한 상품 변환 |
| `lib/products/status.ts` | 판매 준비·품절·재고 부족 상태 계산 |
| `lib/products/stock-provider.ts` | 수동·외부 재고 제공자 인터페이스 |

---
### 커뮤니티

| 파일 | 역할 |
| --- | --- |
| `lib/community/games.ts` | 커뮤니티에 노출할 게임 정보 |
| `lib/community/types.ts` | 플랫폼과 콘텐츠 응답 타입 |
| `lib/community/youtube.ts` | YouTube 요청, 영상 길이와 콘텐츠 분류 |

---
### Supabase

| 파일 | 역할 |
| --- | --- |
| `lib/supabase/config.ts` | 환경 변수 존재와 설정 상태 판정 |
| `lib/supabase/client.ts` | 브라우저용 Supabase 클라이언트 |
| `lib/supabase/server.ts` | 서버 컴포넌트와 작업용 클라이언트 |
| `lib/supabase/proxy.ts` | 요청 중 인증 세션 갱신 |

---
## 5. `public/` 공개 화면

---
### HTML 문서

| 파일 | 역할 |
| --- | --- |
| `public/main.html` | 홈페이지, 캐러셀, 게임 목록, 로컬 보관함, 소개와 FAQ |
| `public/goods.html` | 상품 목록 |
| `public/devlog.html` | 개발 뉴스 목록 |
| `public/community.html` | 커뮤니티 통합 화면 |
| `public/terms.html` | 이용약관 초안 |
| `public/privacy.html` | 개인정보처리방침 초안 |
| `public/device-preview.html` | 개발용 기기 프레임 |

---
### 공통 브라우저 모듈

| 파일 | 역할 |
| --- | --- |
| `public/game-projects.mjs` | 35개 게임 프로젝트 통합 데이터, 장르 이름표와 필터용 대표 장르 규칙 |
| `public/roadmap.mjs` | 개발 로드맵 단계 분류, 장르 필터, 주소 저장과 카드 표시 |
| `public/game-catalog.mjs` | 프로젝트 검색, 필터와 더 보기 |
| `public/hero-carousel.mjs` | 방향 이동, 자동 전환과 진행 게이지 |
| `public/site-experience.mjs` | 관심·최근 목록, 통계와 FAQ 상호작용 |
| `public/responsive-nav.mjs` | 반응형 메뉴, 서랍, 라이트·다크 모드와 영어·한국어 전환 버튼 |
| `public/i18n.mjs` | 영어 화면 번역(사전 불러오기, 문구·형식 번역, 화면 변경 감시, 날짜 표기 언어) |
| `public/i18n-bootstrap.js` | 정적 페이지 표시와 영어 선택 시 번역 전 본문 가림 |
| `public/i18n/en/` | 영어 사전(`site.json` 공통, `next.json` Next 화면, `project_*.json` 게임별) |
| `public/form-submit.mjs` | 정적 페이지 공통 양식 전송(전송 중 표시, 입력 오류·요청 제한·연결 실패 안내) |
| `public/browser-data.mjs` | 개인정보 페이지의 브라우저 저장 항목 확인·삭제 |
| `public/contact-faq.mjs` | 문의하기 질문 전체 펼치기와 주소 해시 열기 |
| `public/contact-form.mjs` | 문의 양식 값 모으기, 화면 검증, 글자 수 표시와 전송 연결 |
| `public/release-notify.mjs` | 게임 소개 페이지의 출시 알림 영역 생성(대상 게임만), 화면 검증과 전송 연결 |
| `public/color-mode-bootstrap.js` | Next 화면에서 저장된 라이트·다크 모드를 먼저 복원 |
| `public/dialog-accessibility.mjs` | 대화상자 접근성 도구(현재 불러오는 페이지 없음, 재사용 보관) |
| `public/privacy-consent.mjs` | 개인정보 선택 저장과 변경 이벤트 |
| `public/site-analytics.mjs` | 동의 기반 GA4 로드와 이벤트 제한 |
| `public/analytics-config.mjs` | 공개 GA4 측정 ID 설정 |
| `public/member-session.mjs` | 공개 화면 회원 상태 표시 |
| `public/support-widget.mjs` | 유효한 키가 있을 때만 상담 위젯 로드 |
| `public/age-gate.mjs` | 정적 프로젝트 링크의 연령 확인 연결 |
| `public/project-page.mjs` | 공통 게임 프로젝트 상세 상호작용 |
| `public/data-state.mjs` | 로딩·시연·빈 결과·오류·완료 상태, 시간 제한 요청과 재시도 제어 |

---
### 화면 전용 모듈

| 파일 | 역할 |
| --- | --- |
| `public/goods.mjs` | 상품 API 요청과 데모 대체 |
| `public/goods-card.mjs` | 안전한 상품 카드 DOM 생성 |
| `public/devlog.mjs` | 뉴스 API 요청, 데모 대체, 검색·종류 필터와 주소 저장 |
| `public/community-data.mjs` | 커뮤니티 데모 콘텐츠 |
| `public/community.mjs` | 게임 선택, 플랫폼 콘텐츠와 해시태그 복사 |
| `public/device-preview.mjs` | 기기 크기 선택, 확대·축소와 새 창 열기 |

---
### 공통 스타일

| 파일 | 역할 |
| --- | --- |
| `public/playful-lab-theme.css` | 공통 디자인 토큰, 라이트·다크 모드와 영역 구분 |
| `public/data-state.css` | 데이터 상태 카드, 아이콘, 다시 시도 버튼과 반응형 배치 |
| `public/responsive-shell.css` | 공통 반응형 헤더와 서랍 메뉴 |
| `public/site-experience.css` | 관심·최근 목록, 상태판, FAQ와 알림 |
| `public/privacy-consent.css` | 개인정보 동의 배너와 설정 창 |
| `public/legal.css` | 약관과 개인정보 문서 화면 |
| `public/project-page.css` | 공통 생성 프로젝트 페이지 |
| `public/project-detail.css` | 프로젝트 η 페이지의 기본 규칙(크기 계산·본문 여백·링크·제목) |

---
### 화면 전용 스타일

| 파일 | 역할 |
| --- | --- |
| `public/game-catalog.css` | 검색창, 장르와 상태 필터 |
| `public/goods.css` | 상품 목록과 상태 버튼 |
| `public/roadmap.css` | 개발 로드맵 요약·필터·단계 카드 |
| `public/release-notify.css` | 출시 알림 카드·입력·동의·결과 안내(모든 게임 소개 디자인에서 같은 모양) |
| `public/devlog.css` | 개발 뉴스 카드, 검색 칸·필터·조건 칩(굿즈·커뮤니티·로드맵 공통 바탕 포함) |
| `public/community.css` | 커뮤니티 카드와 플랫폼 화면 |
| `public/device-preview.css` | 기기 프레임과 미리보기 배치 |
| `public/device-preview-control.css` | 미리보기 제어 버튼 |

---
### 이미지와 프로젝트 페이지

| 위치 | 내용 | 관리 규칙 |
| --- | --- | --- |
| `public/images/games/` | 프로젝트 대표 이미지와 이미지 프롬프트 JSON | 프로젝트 식별자와 경로 일치 확인 |
| `public/images/goods/` | 개발용 상품 WebP 목업 | 판매 전 실제 사진으로 교체 |
| `public/images/states/` | 로딩·시연·빈 결과·오류 상태 SVG | 스크립트와 외부 자원 없는 저장소 내부 벡터 유지 |
| `public/project_*/` | 35개 공개 프로젝트 페이지와 전용 자산 | 공통 생성 페이지와 특화 페이지 구분 |
| `public/icon*`, `public/apple-icon.png` | 브라우저와 앱 아이콘 | 라이트·다크 배경 확인 |
| `public/placeholder*` | 이미지 누락 시 대체 자산 | 운영 이미지와 혼동 금지 |

---
## 6. `supabase/migrations/` 데이터베이스

| 파일 | 생성 내용 |
| --- | --- |
| `202609100001_admin_news.sql` | `news_posts`, 공개·관리자 RLS, 뉴스 이미지 Storage 정책 |
| `202609110001_admin_products.sql` | `products`, 공개·관리자 RLS, 상품 이미지 Storage 정책 |
| `202609120001_member_comments.sql` | 회원 프로필, 댓글, 반응, 신고, 관리 기록, 댓글 이미지 정책 |
| `202610010001_member_signup_moderation.sql` | 가입 동의 시각 열, 공개 프로필 열 제한, 관리자 전용 댓글 상태·신고 처리 권한 |
| `202610010002_member_account_deletion.sql` | 회원 본인 탈퇴 함수(`delete_own_account`, 관리자 계정·남은 이미지 거부) |
| `202610040001_contact_messages.sql` | 문의 양식 접수 테이블(누구나 추가, 관리자만 조회·처리) |
| `202610040002_comment_limits.sql` | 댓글 작성 제한 트리거, 관리자 전용 금칙어 표, 회원별 최근 댓글 색인 |
| `202610040003_release_notifications.sql` | 출시 알림 신청 표(관리자만 조회), 신청·수신 거부·게임별 집계 함수 |

파일명 앞 숫자는 적용 순서입니다. 운영에 적용한 SQL 파일을 고치는 대신 새로운 번호의 마이그레이션을 추가합니다.

---
## 7. `scripts/` 유지보수 도구

| 파일 | 실행 예 | 역할 |
| --- | --- | --- |
| `scripts/generate-project-pages.mjs` | `node scripts/generate-project-pages.mjs` | 공통 프로젝트 페이지 재생성 |
| `scripts/site-header.mjs` | 다른 도구가 불러 씀 | 공통 헤더 원본(메뉴 목록과 마크업) |
| `scripts/apply-site-header.mjs` | `node scripts/apply-site-header.mjs` | 등록된 정적 페이지에 공통 헤더 적용 |
| `scripts/apply-page-meta.mjs` | `node scripts/apply-page-meta.mjs` | 검색 설명과 공유 미리보기 태그 적용 |
| `scripts/apply-static-pages.mjs` | `pnpm pages:apply`, `pnpm pages:check` | 공통 헤더·검색 설명·번역 준비·게임 소개의 출시 알림 스크립트를 한 번에 적용하거나 빠진 페이지 확인 |
| `scripts/archive-project-pages.mjs` | `node scripts/archive-project-pages.mjs` | 변경 전 프로젝트 HTML을 내부 보관소로 복사 |
| `scripts/optimize_goods_images.py` | Python 환경에서 직접 실행 | 상품 원본 이미지 최적화 |
| `scripts/check-supabase-env.mjs` | `pnpm supabase:check` | `.env.local`의 Supabase 주소·공개 키·관리자 이메일 형식과 비밀 키 노출 점검 |
| `scripts/check-services.mjs` | `pnpm services:check` | Supabase·메일·YouTube·GA4의 연결 상태, 형식 오류, 서버 전용 키 노출과 다음에 할 일 안내 |
| `scripts/i18n-extract.mjs` | `pnpm i18n:check` | 정적 페이지 한국어 문구 추출과 영어 사전 누락·잔여 점검 |

페이지 생성과 보관 스크립트를 실행한 뒤 변경 파일을 반드시 검토합니다. 개별 디자인 프로젝트를 공통 템플릿으로 덮어쓰지 않도록 대상 목록을 확인합니다.

---
## 8. `internal/` 비배포 자료

`internal/project-archives/`에는 35개 프로젝트의 변경 전 원본 HTML이 보관됩니다. Next.js의 `public/` 폴더가 아니므로 웹 경로로 직접 서비스되지 않습니다.

다만 저장소가 공개 상태라면 Git 웹 화면에서 내용을 볼 수 있습니다. 비밀 기획, 개인 정보, 라이선스 제한 자료는 `internal/`에도 넣지 않고 별도 비공개 저장소를 사용합니다.

---
## 9. `tests/` 자동 검사 지도

---
### 관리자와 콘텐츠

- `admin-auth.test.mjs`: 관리자 이메일과 역할 정책
- `admin-news-config.test.mjs`: 뉴스 Supabase 설정 분기
- `admin-news-validation.test.mjs`: 뉴스 입력과 이미지 규칙
- `admin-product-validation.test.mjs`: 상품 입력 검증
- `admin-products-actions.test.mjs`: 상품 서버 작업 계약
- `admin-products-config.test.mjs`: 상품 Supabase 설정 분기
- `admin-products-ui.test.mjs`: 상품 관리자 화면
- `admin-demo-mode.test.mjs`: 개발 환경 전용 관리자 데모(인증 우회·저장 없음)

---
### 연령 제한

- `age-gate.test.mjs`: 토큰과 공통 규칙
- `age-gate-api.test.mjs`: 확인 상태와 검증 API
- `age-gate-proxy.test.mjs`: 보호 경로와 프록시 이동
- `age-gate-ui.test.mjs`: 연령 확인 화면

---
### 회원과 댓글

- `member-auth.test.mjs`: 회원 로그인 모드와 세션
- `member-header.test.mjs`: 공개 헤더의 회원 표시
- `member-comments-migration.test.mjs`: 회원·댓글 SQL 구조
- `comment-domain.test.mjs`: 댓글, 이미지, 반응과 신고 규칙
- `comment-local-service.test.mjs`: 로컬 댓글 조회·작성·답글·반응·신고와 초기화 정책
- `comment-panel-service.test.mjs`: 댓글 화면과 로컬 서비스의 연결 계약
- `comment-supabase-service.test.mjs`: Supabase 댓글 저장소의 같은 계약
- `comment-guard.test.mjs`: 댓글 작성 제한 규칙, 두 서비스의 적용, 데이터베이스 제한과 수치·금칙어 일치, 화면 안내와 관리자 자동 감지
- `comment-moderation.test.mjs`: 관리자 댓글 처리 규칙과 데모·Supabase 관리 서비스
- `member-profile.test.mjs`: 닉네임 규칙과 프로필 조회·저장
- `member-session-server.test.mjs`: 서버 회원 상태 확인과 공개 정보만 담은 응답
- `member-logout.test.mjs`: 로그아웃과 회원 버튼 전환
- `member-signup.test.mjs`: 가입 입력·필수 동의 검증, 인증 오류 안내, 첫 로그인 프로필 생성
- `auth-providers.test.mjs`: 간편 로그인 목록과 Supabase 인증 설정 해석
- `member-auth-pages.test.mjs`: 가입·간편 로그인·비밀번호 재설정·댓글 관리 화면 연결
- `member-signup-moderation-migration.test.mjs`: 동의 기록과 관리자 전용 처리 SQL
- `account.test.mjs`: 내 댓글·탈퇴 처리, 탈퇴 SQL, 검색엔진 파일과 오류 화면
- `contact.test.mjs`: 문의 검증, 화면·서버 문구 일치, 접수 순서, 문의함 처리와 문의 테이블 권한
- `demo-content.test.mjs`: 시연 굿즈·시연 뉴스에 임의 가격, 가짜 할인, 판매 유도 배지, 지어낸 수치가 없는지와 시연 표시
- `release-notify.test.mjs`: 출시 알림 대상 판정, 화면·서버 문구 일치, 접수 순서, 저장 함수와 집계, 표 권한, 35개 페이지 적용
- `roadmap.test.mjs`: 로드맵 단계 분류, 장르 필터·주소 저장, 문서 구조와 메뉴·사이트맵 연결

---
### 개인정보와 분석

- `privacy-consent.test.mjs`: 동의 저장과 선택 변경
- `site-analytics.test.mjs`: 이벤트 허용 목록과 값 정리
- `analytics-integration.test.mjs`: 동의 전후 스크립트 연결

---
### 공개 홈페이지

- `site-integrity.test.mjs`: 주요 파일, 링크와 페이지 무결성
- `website-content.test.mjs`: 공개 문구와 화면 구성
- `root-layout.test.mjs`: Next.js 공통 레이아웃 연결
- `local-site-experience.test.mjs`: 관심·최근 목록과 알림
- `responsive-integration.test.mjs`: 전체 페이지 반응형 연결
- `responsive-navigation.test.mjs`: 서랍 메뉴와 테마 전환
- `playful-lab-theme.test.mjs`: 공통 토큰과 적용 제외 범위
- `i18n.test.mjs`: 영어 사전 범위·품질, 번역기 동작, 언어 버튼과 준비 스크립트 연결
- `device-preview.test.mjs`: 개발용 기기 크기와 제어
- `foundation.test.mjs`: 요청 제한·JSON 처리·양식 전송·페이지 적용 도구와 사이트맵 누락
- `site-header.test.mjs`: 모든 페이지 공통 헤더 일치와 문의하기 질문 구조
- `site-polish.test.mjs`: 검색 설명·공유 정보, 라이트·다크 토큰과 화면 배치 세부
- `page-integrity-fixes.test.mjs`: 내부 앵커·시연 뉴스 링크, 이미지 실패 대체, 404 화면과 움직임 줄이기
- `unused-assets.test.mjs`: 연결되지 않은 스크립트·스타일과 예전 규칙 재발 방지
- `accessibility-forms.test.mjs`: 로그인·성인 확인 폼의 오류 연결과 제출 상태
- `form-validation.test.mjs`: 첫 오류 필드 탐색과 초점 이동
- `dialog-accessibility.test.mjs`: 대화상자 초점 순환과 닫기(`helpers/dialog-environment.mjs` 사용)
- `color-mode-bootstrap.test.mjs`: 저장된 화면 모드 우선 복원
- `browser-data.test.mjs`: 브라우저 저장 항목 요약과 삭제
- `game-catalog-url.test.mjs`: 게임 검색 조건의 주소 저장·복원
- `project-h-page.test.mjs`: 프로젝트 H 화면과 스크립트 연결
- `development-tooling.test.mjs`: 린트·설치 설정과 제외 범위
- `supabase-env-check.test.mjs`: Supabase 연결 설정 점검 도구
- `services-check.test.mjs`: 외부 서비스 연결 점검(서비스별 상태, 값 미출력, 서버 전용 키 노출 감지, 명령 종료 코드)
- `mail.test.mjs`: 메일 설정 판정, 발송 요청과 실패 종류, 문의 알림 양식, 저장 뒤 알림 순서

---
### 게임과 프로젝트

- `game-projects.test.mjs`: 35개 프로젝트 데이터
- `game-catalog.test.mjs`: 검색과 필터
- `public-project-pages.test.mjs`: 공개 프로젝트 페이지 구조
- `project-archive.test.mjs`: 내부 원본 보관
- `project-eta-page.test.mjs`: ETA 전용 콘텐츠와 상호작용

---
### 상품, 뉴스와 커뮤니티

- `goods-assets.test.mjs`: 상품 이미지 자산
- `goods-page.test.mjs`: 공개 상품 화면
- `product-status.test.mjs`: 판매·재고 상태 계산
- `products-api.test.mjs`: 상품 공개 API
- `demo-news.test.mjs`: 뉴스 데모 데이터
- `development-news.test.mjs`: 개발 뉴스 화면, 검색·종류 조건 계산, 주소 저장과 조건 칩 구조
- `community-games.test.mjs`: 커뮤니티 게임 목록
- `community-page.test.mjs`: 커뮤니티 화면 구조
- `community-youtube.test.mjs`: YouTube 응답과 대체 처리
- `data-state.test.mjs`: 공통 상태 모델, 요청 오류와 시간 초과
- `data-state-assets.test.mjs`: 상태 SVG 크기와 안전성
- `data-state-integration.test.mjs`: 네 공개 페이지의 상태 UI 연결

`tests/helpers/navigation-environment.mjs`는 브라우저 메뉴 동작을 검사하기 위한 테스트 환경을 제공합니다.

---
## 10. `docs/` 문서

| 위치 | 역할 |
| --- | --- |
| `docs/DEVELOPMENT-GUIDE.md` | 프로젝트 전체 개발·운영 안내 |
| `docs/DEVELOPMENT-NOTES.md` | 로컬·외부 API·유료 작업 분류와 우선순위 |
| `docs/ROADMAP.md` | 단계별 개발 방향과 현재 진행 단계 |
| `docs/EXTERNAL-SERVICES.md` | 외부 계정·유료 서비스의 비용과 제약 |
| `docs/FILE-MAP.md` | 현재 파일과 폴더의 역할 지도 |
| `docs/superpowers/specs/` | 승인된 기능 설계와 동작 기준 |
| `docs/superpowers/plans/` | 구현 단계와 검증 계획 |

과거 계획 문서는 현재 코드보다 오래될 수 있습니다. 실제 동작은 최신 코드, 테스트와 이 문서의 현재 상태를 함께 확인합니다.

---
## 11. 저장소에 넣지 않는 로컬 항목

다음 항목은 DEVFORGE 홈페이지 소스가 아니므로 이 저장소의 커밋 대상에서 제외합니다.

- `Text-Play/`
- `ChatBot-text-play-download/`
- `imported-chatbot/`
- `imports/chatbot-session-snapshot/`
- `google-docs-trusted-read-*`
- `docs/assets/text-play-ui/`를 포함한 Text-Play 전용 이미지
- 세션 전달용 임시 문서와 외부 프로젝트 사본

ChatBot 본체는 별도 저장소를 유지합니다. 홈페이지에는 `public/main.html`의 홍보 영역과 이동 주소만 남깁니다.

---
## 12. 기능별 첫 확인 파일

| 작업 | 먼저 볼 파일 | 함께 확인할 파일 |
| --- | --- | --- |
| 메인 슬라이드 | `public/hero-carousel.mjs` | `public/main.html`, `public/site-experience.css`, `public/playful-lab-theme.css` |
| ChatBot 링크 | `public/main.html` | ChatBot 별도 저장소의 실행 주소 |
| 게임 추가 | `public/game-projects.mjs` | `public/images/games/`, 생성 스크립트 |
| 관심·최근 목록 | `public/site-experience.mjs` | `public/site-experience.css` |
| 공통 색상·외곽선 | `public/playful-lab-theme.css` | 각 페이지 전용 CSS |
| 모바일 메뉴 | `public/responsive-nav.mjs` | `public/responsive-shell.css` |
| 다크 모드 | `public/responsive-nav.mjs` | `public/playful-lab-theme.css` |
| 영어 화면 | `public/i18n.mjs` | `public/i18n/en/`, `scripts/i18n-extract.mjs`, `public/i18n-bootstrap.js` |
| 뉴스 관리 | `app/admin/news/` | `lib/news/`, 뉴스 마이그레이션 |
| 상품 관리 | `app/admin/products/` | `lib/products/`, 상품 마이그레이션 |
| 로그인 권한 | `lib/auth/admin-policy.ts` | `proxy.ts`, Supabase 클라이언트 |
| 댓글 | `app/news/[id]/comments-panel.tsx` | `lib/comments/domain.ts`, `lib/comments/service.ts`, `lib/comments/local-service.ts`, `lib/comments/supabase-service.ts`, 댓글 마이그레이션 |
| 댓글 작성 제한 | `lib/comments/guard.ts` | `lib/comments/banned-words.ts`, `lib/comments/rules.ts`, `202610040002_comment_limits.sql`, `app/admin/comments/moderation-board.tsx` |
| 회원가입·간편 로그인 | `lib/member/auth-providers.ts` | `app/signup/`, `app/login/social-login-buttons.tsx`, `lib/member/signup.ts`, `app/auth/` |
| 개발 뉴스 검색·필터 | `public/devlog.mjs` | `public/devlog.html`, `public/devlog.css`, `public/playful-lab-theme.css` |
| 개발 로드맵 | `public/roadmap.mjs` | `public/roadmap.html`, `public/roadmap.css`, `public/game-projects.mjs` |
| 문의 양식·문의함 | `lib/contact/domain.ts` | `public/contact-form.mjs`, `app/api/contact/route.ts`, `lib/contact/inbox.ts`, `app/admin/contact/`, `202610040001_contact_messages.sql` |
| 출시 알림 신청 | `lib/notify/domain.ts` | `public/release-notify.mjs`, `public/release-notify.css`, `app/api/notify/`, `lib/notify/store.ts`, `app/notify/unsubscribe/`, `app/admin/notify/`, `202610040003_release_notifications.sql` |
| 댓글·신고 관리 | `app/admin/comments/` | `lib/comments/moderation.ts`, `202610010001_member_signup_moderation.sql` |
| 회원 닉네임 | `lib/member/profile.ts` | `app/login/member-access.tsx`, `app/login/member-nickname-form.tsx`, `app/api/member/status/route.ts`, `public/member-session.mjs` |
| Supabase 연결 준비 | `scripts/check-supabase-env.mjs` | `.env.example`, `README.md`의 Supabase 단계, `supabase/migrations/` |
| 외부 서비스 연결 점검 | `scripts/check-services.mjs` | `.env.example`, `README.md`의 "무료 서비스부터 연결하는 순서" |
| 메일 발송·문의 알림 | `lib/mail/sender.ts` | `lib/mail/config.ts`, `lib/mail/templates.ts`, `app/api/contact/route.ts` |
| 연령 제한 | `lib/age-gate/` | `proxy.ts`, 연령 API와 화면 |
| 분석 동의 | `public/privacy-consent.mjs` | `public/site-analytics.mjs` |
| 전체 품질 확인 | `package.json` | `tests/`, `tsconfig.json` |
