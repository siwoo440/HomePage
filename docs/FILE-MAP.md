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

---
### 관리자 영역

| 파일 | 역할 |
| --- | --- |
| `app/admin/admin.css` | 관리자 화면 공통 디자인과 테마 토큰 연결 |
| `app/admin/layout.tsx` | 관리자 화면 레이아웃 |
| `app/admin/login/page.tsx` | 관리자 로그인 페이지 |
| `app/admin/login/login-form.tsx` | 로그인 입력과 오류 처리 |
| `app/admin/news/page.tsx` | 관리자 뉴스 목록 |
| `app/admin/news/new/page.tsx` | 새 뉴스 작성 페이지 |
| `app/admin/news/[id]/edit/page.tsx` | 뉴스 수정 페이지 |
| `app/admin/news/news-editor.tsx` | 뉴스 편집 폼 |
| `app/admin/news/actions.ts` | 뉴스 생성·수정·삭제 서버 작업 |
| `app/admin/news/admin-header.tsx` | 관리자 뉴스 화면 헤더 |
| `app/admin/products/page.tsx` | 관리자 상품 목록 |
| `app/admin/products/new/page.tsx` | 새 상품 작성 페이지 |
| `app/admin/products/[id]/edit/page.tsx` | 상품 수정 페이지 |
| `app/admin/products/product-editor.tsx` | 상품 편집 폼 |
| `app/admin/products/delete-product-button.tsx` | 상품 삭제 확인과 실행 |
| `app/admin/products/actions.ts` | 상품 생성·수정·삭제 서버 작업 |

---
### 회원·뉴스·연령 확인

| 파일 | 역할 |
| --- | --- |
| `app/login/page.tsx` | 회원 로그인 페이지 |
| `app/login/member-login-form.tsx` | 회원 로그인 폼과 데모·Supabase 분기 |
| `app/login/member-login.module.css` | 회원 로그인 화면 스타일 |
| `app/news/[id]/page.tsx` | 뉴스 상세 조회 |
| `app/news/[id]/comments-panel.tsx` | 댓글·답글·반응·신고 UI |
| `app/news/[id]/news-detail.module.css` | 뉴스 상세와 댓글 스타일 |
| `app/age-verification/page.tsx` | 연령 확인 페이지 |
| `app/age-verification/age-verification-form.tsx` | 생년 확인 입력과 API 요청 |
| `app/age-verification/age-verification.module.css` | 연령 확인 스타일 |
| `app/auth/callback/route.ts` | Supabase 인증 결과와 안전한 복귀 처리 |

---
### API

| 파일 | 역할 |
| --- | --- |
| `app/api/news/route.ts` | 설정 상태와 공개 뉴스 목록 반환, 미설정 시 빈 목록 반환 |
| `app/api/products/route.ts` | 설정 상태와 공개 상품 목록 반환, 미설정 시 빈 목록 반환 |
| `app/api/community/youtube/route.ts` | YouTube 조회, 캐시, 연령 확인과 대체 데이터 |
| `app/api/age/status/route.ts` | 연령 확인 쿠키 상태 반환 |
| `app/api/age/verify/route.ts` | 연령 검증과 서명 쿠키 발급 |

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
### 관리자 인증

| 파일 | 역할 |
| --- | --- |
| `lib/auth/admin-policy.ts` | 이메일과 `app_metadata.role` 관리자 판정 |
| `lib/auth/admin.ts` | 관리자 세션 요구와 이동 처리 |
| `lib/auth/login-message.ts` | 로그인 결과 메시지 정리 |

---
### 회원과 댓글

| 파일 | 역할 |
| --- | --- |
| `lib/member/config.ts` | 데모·Supabase 회원 모드 판정 |
| `lib/member/demo-session.ts` | 로컬 데모 프로필 저장·읽기와 안전한 복귀 주소 |
| `lib/comments/domain.ts` | 댓글, 이미지, 반응과 신고 규칙 |

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
| `public/game-projects.mjs` | 35개 게임 프로젝트 통합 데이터 |
| `public/game-catalog.mjs` | 프로젝트 검색, 필터와 더 보기 |
| `public/hero-carousel.mjs` | 방향 이동, 자동 전환과 진행 게이지 |
| `public/site-experience.mjs` | 관심·최근 목록, 통계와 FAQ 상호작용 |
| `public/responsive-nav.mjs` | 반응형 메뉴, 서랍과 라이트·다크 모드 |
| `public/privacy-consent.mjs` | 개인정보 선택 저장과 변경 이벤트 |
| `public/site-analytics.mjs` | 동의 기반 GA4 로드와 이벤트 제한 |
| `public/analytics-config.mjs` | 공개 GA4 측정 ID 설정 |
| `public/member-session.mjs` | 공개 화면 회원 상태 표시 |
| `public/support-widget.mjs` | 유효한 키가 있을 때만 상담 위젯 로드 |
| `public/age-gate.mjs` | 정적 프로젝트 링크의 연령 확인 연결 |
| `public/project-page.mjs` | 공통 게임 프로젝트 상세 상호작용 |
| `public/script.js` | 기존 공통 페이지 동작 |

---
### 화면 전용 모듈

| 파일 | 역할 |
| --- | --- |
| `public/goods.mjs` | 상품 API 요청과 데모 대체 |
| `public/goods-card.mjs` | 안전한 상품 카드 DOM 생성 |
| `public/devlog.mjs` | 뉴스 API 요청, 데모 대체와 태그 필터 |
| `public/community-data.mjs` | 커뮤니티 데모 콘텐츠 |
| `public/community.mjs` | 게임 선택, 플랫폼 콘텐츠와 해시태그 복사 |
| `public/device-preview.mjs` | 기기 크기 선택, 확대·축소와 새 창 열기 |

---
### 공통 스타일

| 파일 | 역할 |
| --- | --- |
| `public/playful-lab-theme.css` | 공통 디자인 토큰, 라이트·다크 모드와 영역 구분 |
| `public/responsive-shell.css` | 공통 반응형 헤더와 서랍 메뉴 |
| `public/style.css` | 메인 기본 레이아웃과 기존 공통 스타일 |
| `public/site-experience.css` | 관심·최근 목록, 상태판, FAQ와 알림 |
| `public/privacy-consent.css` | 개인정보 동의 배너와 설정 창 |
| `public/legal.css` | 약관과 개인정보 문서 화면 |
| `public/project-page.css` | 공통 생성 프로젝트 페이지 |
| `public/project-detail.css` | 프로젝트 상세 공통 요소 |

---
### 화면 전용 스타일

| 파일 | 역할 |
| --- | --- |
| `public/game-catalog.css` | 검색창, 장르와 상태 필터 |
| `public/goods.css` | 상품 목록과 상태 버튼 |
| `public/devlog.css` | 개발 뉴스 카드와 필터 |
| `public/community.css` | 커뮤니티 카드와 플랫폼 화면 |
| `public/device-preview.css` | 기기 프레임과 미리보기 배치 |
| `public/device-preview-control.css` | 미리보기 제어 버튼 |

---
### 이미지와 프로젝트 페이지

| 위치 | 내용 | 관리 규칙 |
| --- | --- | --- |
| `public/images/games/` | 프로젝트 대표 이미지와 이미지 프롬프트 JSON | 프로젝트 식별자와 경로 일치 확인 |
| `public/images/goods/` | 개발용 상품 WebP 목업 | 판매 전 실제 사진으로 교체 |
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

파일명 앞 숫자는 적용 순서입니다. 운영에 적용한 SQL 파일을 고치는 대신 새로운 번호의 마이그레이션을 추가합니다.

---
## 7. `scripts/` 유지보수 도구

| 파일 | 실행 예 | 역할 |
| --- | --- | --- |
| `scripts/generate-project-pages.mjs` | `node scripts/generate-project-pages.mjs` | 공통 프로젝트 페이지 재생성 |
| `scripts/archive-project-pages.mjs` | `node scripts/archive-project-pages.mjs` | 변경 전 프로젝트 HTML을 내부 보관소로 복사 |
| `scripts/optimize_goods_images.py` | Python 환경에서 직접 실행 | 상품 원본 이미지 최적화 |

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
- `device-preview.test.mjs`: 개발용 기기 크기와 제어

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
- `development-news.test.mjs`: 개발 뉴스 화면
- `community-games.test.mjs`: 커뮤니티 게임 목록
- `community-page.test.mjs`: 커뮤니티 화면 구조
- `community-youtube.test.mjs`: YouTube 응답과 대체 처리

`tests/helpers/navigation-environment.mjs`는 브라우저 메뉴 동작을 검사하기 위한 테스트 환경을 제공합니다.

---
## 10. `docs/` 문서

| 위치 | 역할 |
| --- | --- |
| `docs/DEVELOPMENT-GUIDE.md` | 프로젝트 전체 개발·운영 안내 |
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
| 메인 슬라이드 | `public/hero-carousel.mjs` | `public/main.html`, `public/style.css` |
| ChatBot 링크 | `public/main.html` | ChatBot 별도 저장소의 실행 주소 |
| 게임 추가 | `public/game-projects.mjs` | `public/images/games/`, 생성 스크립트 |
| 관심·최근 목록 | `public/site-experience.mjs` | `public/site-experience.css` |
| 공통 색상·외곽선 | `public/playful-lab-theme.css` | 각 페이지 전용 CSS |
| 모바일 메뉴 | `public/responsive-nav.mjs` | `public/responsive-shell.css` |
| 다크 모드 | `public/responsive-nav.mjs` | `public/playful-lab-theme.css` |
| 뉴스 관리 | `app/admin/news/` | `lib/news/`, 뉴스 마이그레이션 |
| 상품 관리 | `app/admin/products/` | `lib/products/`, 상품 마이그레이션 |
| 로그인 권한 | `lib/auth/admin-policy.ts` | `proxy.ts`, Supabase 클라이언트 |
| 댓글 | `app/news/[id]/comments-panel.tsx` | `lib/comments/domain.ts`, 댓글 마이그레이션 |
| 연령 제한 | `lib/age-gate/` | `proxy.ts`, 연령 API와 화면 |
| 분석 동의 | `public/privacy-consent.mjs` | `public/site-analytics.mjs` |
| 전체 품질 확인 | `package.json` | `tests/`, `tsconfig.json` |
