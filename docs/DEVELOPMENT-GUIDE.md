---
# DEVFORGE 개발 가이드

이 문서는 DEVFORGE 홈페이지 저장소를 처음 보는 개발자가 프로젝트의 목적, 실행 방법, 구조, 기능, 데이터 흐름, 보안 기준과 배포 전 확인 사항을 한 번에 이해할 수 있도록 정리한 문서입니다.

현재 저장소는 **DEVFORGE 홈페이지**만 관리합니다. Text-Play와 ChatBot 본체는 별도 저장소에서 관리하며, 이 저장소에는 ChatBot을 소개하고 `http://localhost:3001/`로 이동시키는 연결 요소만 포함합니다.

---
## 1. 프로젝트 한눈에 보기

DEVFORGE는 게임 개발 스튜디오 홈페이지입니다. 방문자는 게임 프로젝트, 개발 소식, 상품, 커뮤니티 정보를 확인할 수 있고, 관리자는 Supabase를 연결한 뒤 뉴스와 상품을 관리할 수 있습니다.

프로젝트는 두 가지 화면 체계를 함께 사용합니다.

| 구분 | 위치 | 역할 |
| --- | --- | --- |
| 정적 방문자 화면 | `public/` | 메인, 게임 목록, 상품, 개발 소식, 커뮤니티, 약관과 개별 프로젝트 페이지 |
| Next.js 화면 | `app/` | 로그인, 관리자 화면, 뉴스 상세, 연령 확인, 서버 API |
| 공통 업무 로직 | `lib/` | 인증, 연령 제한, 댓글, 뉴스, 상품, Supabase 연결 규칙 |
| 데이터베이스 정의 | `supabase/migrations/` | 뉴스, 상품, 회원, 댓글과 신고 테이블 및 접근 정책 |

브라우저가 `/`에 접속하면 Next.js의 `app/page.tsx`가 `/main.html`로 이동시킵니다. 정적 화면은 필요한 데이터를 `/api/news`, `/api/products`, `/api/community/youtube`에서 요청하며, 외부 서비스가 연결되지 않은 로컬 환경에서는 저장소의 데모 데이터를 사용합니다.

---
## 2. 현재 구현 범위

---
### 무료 로컬 환경에서 동작하는 기능

- 메인 히어로 캐러셀의 이전·다음 이동, 자동 전환과 진행 게이지
- ChatBot 홍보 슬라이드와 `http://localhost:3001/` 이동
- 35개 게임 프로젝트의 검색, 장르 필터와 개발 상태 필터
- 관심 프로젝트와 최근 본 프로젝트의 브라우저 로컬 저장
- 관심 별 버튼과 하단 완료 메시지
- 뉴스와 상품의 데모 데이터 표시
- 커뮤니티 게임 선택, 플랫폼별 콘텐츠 영역과 해시태그 복사
- 이용약관과 개인정보처리방침 화면
- PC·태블릿·모바일 반응형 레이아웃
- 모바일 서랍 메뉴와 라이트·다크 모드 전환
- 연령 제한 대상 프로젝트의 접근 확인 화면
- 개발용 기기 미리보기
- 자동 테스트, TypeScript 검사와 운영 빌드 검사

---
### 외부 설정 뒤 동작하는 기능

| 기능 | 필요한 설정 | 설정 전 동작 |
| --- | --- | --- |
| 관리자 로그인 | Supabase 프로젝트, 관리자 계정과 환경 변수 | 로그인과 저장 기능 비활성 |
| 뉴스·상품 저장 | Supabase 마이그레이션과 Storage | 데모 콘텐츠 표시 |
| 회원 로그인 | Supabase 인증과 환경 변수 | 데모 회원 흐름 확인 |
| 댓글 서버 저장 | Supabase CRUD 후속 구현과 회원·댓글 마이그레이션 | 데모 댓글 화면만 확인 |
| YouTube 최신 콘텐츠 | `YOUTUBE_API_KEY` | 로컬 데모 콘텐츠 표시 |
| GA4 분석 | `public/analytics-config.mjs`의 측정 ID와 방문자 동의 | 외부 분석 요청 없음 |
| 외부 상담 | 유효한 상담 서비스 플러그인 키 | 위젯 로드 안 함 |
| 상품 판매 | 판매처 주소와 공식 재고 API | 판매 준비 중 표시 |
| 배포 도메인 | 배포 서비스와 도메인 설정 | localhost에서만 실행 |

Supabase, YouTube, 분석, 상담, 판매와 배포는 별도 계정이나 비용이 발생할 수 있으므로 현재 로컬 구현과 분리되어 있습니다.

---
## 3. 개발 환경 준비

---
### 요구 도구

- Node.js: Next.js 16을 실행할 수 있는 현재 LTS 버전
- pnpm: `pnpm-lock.yaml`을 사용하는 패키지 관리자
- Git: 변경 이력 관리
- 선택 사항: Supabase 프로젝트와 Supabase 계정

---
### 설치와 실행

```powershell
# 의존성 설치
pnpm install
# 개발 서버 실행
pnpm dev
```

개발 서버를 실행한 뒤 다음 주소를 확인합니다.

| 주소 | 용도 |
| --- | --- |
| `http://localhost:3000/main.html` | 메인 홈페이지 |
| `http://localhost:3000/goods.html` | 상품 화면 |
| `http://localhost:3000/devlog.html` | 개발 소식 목록 |
| `http://localhost:3000/community.html` | 커뮤니티 화면 |
| `http://localhost:3000/device-preview.html` | 개발용 반응형 미리보기 |
| `http://localhost:3000/login` | 회원 로그인 |
| `http://localhost:3000/admin/login` | 관리자 로그인 |
| `http://localhost:3001/` | 별도 실행 중인 ChatBot 프로젝트 |

ChatBot 주소는 현재 로컬 임시 주소입니다. 배포 주소가 확정되면 `public/main.html`의 링크를 변경합니다.

---
## 4. 전체 동작 구조

```text
방문자 브라우저
  ├─ public/*.html              정적 공개 화면
  ├─ public/*.mjs               검색, 캐러셀, 메뉴, 동의와 로컬 저장
  └─ /api/* 요청
       ├─ Supabase 미설정       데모 데이터 또는 안전한 비활성 응답
       └─ Supabase 설정         공개 데이터 조회와 관리자 저장

Next.js 서버
  ├─ app/                       동적 페이지와 API
  ├─ lib/                       검증, 권한과 데이터 변환
  ├─ proxy.ts                   세션 갱신과 연령 제한 접근 제어
  └─ Supabase                  인증, 데이터베이스와 이미지 저장소
```

정적 공개 페이지와 Next.js 서버 화면은 `public/playful-lab-theme.css`의 디자인 토큰을 공유합니다. 개별 게임 프로젝트 페이지는 각 게임의 고유 디자인을 유지하기 위해 공통 테마 적용 대상에서 제외됩니다.

---
## 5. 주요 화면과 라우트

---
### 공개 정적 화면

| 경로 | 파일 | 기능 |
| --- | --- | --- |
| `/main.html` | `public/main.html` | 캐러셀, 프로젝트 목록, 관심·최근 목록, 소개, FAQ, ChatBot 연결 |
| `/goods.html` | `public/goods.html` | 공개 상품과 재고 상태 |
| `/devlog.html` | `public/devlog.html` | 공개 개발 뉴스와 태그 필터 |
| `/community.html` | `public/community.html` | 게임별 플랫폼 콘텐츠와 해시태그 |
| `/terms.html` | `public/terms.html` | 이용약관 초안 |
| `/privacy.html` | `public/privacy.html` | 개인정보처리방침 초안 |
| `/device-preview.html` | `public/device-preview.html` | 개발 전용 화면 크기 미리보기 |
| `/project_*/...` | `public/project_*/` | 35개 게임 프로젝트 상세 페이지 |

---
### Next.js 화면

| 경로 | 구현 위치 | 기능 |
| --- | --- | --- |
| `/` | `app/page.tsx` | `/main.html`로 이동 |
| `/login` | `app/login/` | 회원 로그인 |
| `/age-verification` | `app/age-verification/` | 성인 프로젝트 접근 확인 |
| `/news/[id]` | `app/news/[id]/` | 뉴스 상세와 댓글 영역 |
| `/admin/login` | `app/admin/login/` | 관리자 로그인 |
| `/admin/news` | `app/admin/news/` | 뉴스 목록, 작성과 수정 |
| `/admin/products` | `app/admin/products/` | 상품 목록, 작성과 수정 |
| `/auth/callback` | `app/auth/callback/route.ts` | Supabase 인증 결과 처리 |

---
### 서버 API

| 메서드와 경로 | 역할 |
| --- | --- |
| `GET /api/news` | 공개 상태의 뉴스 조회 |
| `GET /api/products` | 공개 상태의 상품 조회 |
| `GET /api/community/youtube` | 게임별 YouTube 콘텐츠 조회 |
| `GET /api/age/status` | 연령 확인 상태 조회 |
| `POST /api/age/verify` | 연령 확인 토큰 발급 |

---
## 6. 핵심 기능 설명

---
### 6.1 메인 캐러셀

`public/hero-carousel.mjs`가 캐러셀을 관리합니다.

- 이전 버튼은 왼쪽 방향으로 이동
- 다음 버튼은 오른쪽 방향으로 이동
- 7초 간격 자동 전환
- 550ms 슬라이드 전환 효과
- 버튼 위쪽 진행 게이지
- 수동 이동 뒤 자동 전환 시간 재시작
- 자동 전환 안내 문구와 일시정지 버튼 없음

캐러셀 안의 ChatBot 홍보 화면은 별도 프로젝트 소스가 아닙니다. 홈페이지에서 ChatBot 메인 페이지로 이동시키는 링크만 제공합니다.

---
### 6.2 게임 목록과 프로젝트 데이터

`public/game-projects.mjs`가 35개 프로젝트의 제목, 장르, 개발 상태, 주소, 연령 제한과 해시태그를 통합 관리합니다. `public/game-catalog.mjs`는 이 데이터를 사용해 검색, 필터와 더 보기 기능을 제공합니다.

프로젝트 데이터를 변경할 때는 다음 항목을 함께 점검합니다.

- 고유 프로젝트 식별자
- 표시 제목
- 장르
- 개발 상태
- 상세 페이지 주소
- 대표 이미지
- 성인 콘텐츠 여부
- 커뮤니티 해시태그

공통 형식의 프로젝트 페이지는 `node scripts/generate-project-pages.mjs`로 다시 생성할 수 있습니다. 개별 디자인을 가진 특화 프로젝트는 생성 대상과 구분합니다.

---
### 6.3 관심 프로젝트와 최근 본 프로젝트

`public/site-experience.mjs`가 브라우저 `localStorage`에 프로젝트 식별자만 저장합니다.

| 저장 키 | 내용 |
| --- | --- |
| `devforge_favorite_projects_v1` | 관심 프로젝트 식별자 목록 |
| `devforge_recent_projects_v1` | 최근 본 프로젝트 식별자 목록 |

최근 본 프로젝트는 최대 6개를 유지합니다. 관심 버튼은 별 하나만 표시하며, 선택 결과는 하단 메시지로 약 2.5초 동안 안내합니다. 로컬 기록 삭제 기능으로 두 목록을 지울 수 있습니다. 이 정보는 현재 서버로 전송하지 않습니다.

---
### 6.4 뉴스

Supabase가 없을 때 공개 개발 소식 목록은 `public/devlog.html`의 데모 항목을 사용하고, Next.js 뉴스 상세는 `lib/news/demo-posts.ts`의 데모 글을 사용합니다. Supabase가 설정되면 공개 API는 공개 상태의 글만 반환하고, 관리자 화면은 글 작성·수정과 대표 이미지 업로드를 처리합니다.

대표 이미지는 JPEG, PNG, WebP 형식과 5MB 이하만 허용합니다. 검증 규칙은 `lib/news/validation.ts`에서 관리합니다.

---
### 6.5 상품과 재고 상태

상품 화면은 Supabase 설정 전 데모 상품을 사용합니다. 설정 뒤에는 `products` 테이블의 공개 상품을 표시합니다.

- 재고 0개: 품절
- 재고 1~5개: 재고 부족
- 판매 주소 없음: 판매 준비 중
- 외부 재고: 판매처의 공식 API를 사용할 때만 연결

외부 판매 페이지 HTML을 직접 수집하는 방식은 사용하지 않습니다. 상품 검증은 `lib/products/validation.ts`, 공개 데이터 변환은 `lib/products/public-product.ts`, 상태 계산은 `lib/products/status.ts`가 담당합니다.

---
### 6.6 회원과 댓글

회원 모드는 `lib/member/config.ts`에서 Supabase 설정 여부에 따라 구분합니다. 댓글 도메인은 `lib/comments/domain.ts`가 다음 규칙을 관리합니다.

- 댓글 내용 필수, 이미지 선택 사항
- 이미지 최대 5MB
- 허용 이미지: JPEG, PNG, WebP, GIF
- 반응: 좋아요, 응원, 궁금해요
- 신고 사유와 신고 데이터 검증
- 데모 댓글과 반응 토글

`202609120001_member_comments.sql`은 회원·댓글 데이터 구조와 접근 정책만 준비합니다. 현재 댓글 화면은 데모 데이터를 사용하고 실제 제출을 저장하지 않습니다. 실제 댓글 저장에는 Supabase 인증 설정과 함께 댓글 작성·조회·반응·신고 CRUD를 서버에 추가로 구현해야 합니다.

---
### 6.7 연령 제한

성인 대상 프로젝트는 H, U, V입니다. `proxy.ts`와 `lib/age-gate/`가 해당 프로젝트 페이지와 이미지 접근을 확인합니다.

- 쿠키 이름: `devforge_age_verified`
- 유효 시간: 12시간
- 토큰 방식: 서버 비밀 키 기반 HMAC
- 쿠키 설정: HttpOnly, SameSite=Lax
- 복귀 주소: 사이트 내부의 안전한 경로만 허용

운영 환경에서는 반드시 충분히 긴 `AGE_GATE_SECRET`을 설정해야 합니다. 이 기능은 법적 성인 인증 서비스를 대신하는 본인 인증 수단이 아니라 사이트 내부 접근 확인 장치입니다.

---
### 6.8 커뮤니티와 YouTube

커뮤니티 화면은 게임을 선택하면 플랫폼별 콘텐츠를 표시합니다. YouTube API 키가 없거나 요청에 실패하면 데모 콘텐츠로 안전하게 대체합니다. 성인 프로젝트의 YouTube 요청도 연령 확인을 거칩니다.

성공한 YouTube 응답은 서버에서 일정 시간 캐시합니다. API 키는 브라우저에 노출하지 않고 서버 환경 변수로만 관리합니다.

---
### 6.9 개인정보 동의와 분석

`public/privacy-consent.mjs`는 다음 키에 동의 상태와 정책 버전을 저장합니다.

```text
devforge_privacy_consent_v1
```

방문자가 분석을 허용하기 전에는 Google Analytics 스크립트를 불러오지 않습니다. `public/site-analytics.mjs`는 허용된 이벤트와 매개변수만 전송하고, 개인정보 성격의 값은 분석 데이터에 포함하지 않도록 제한합니다.

`public/analytics-config.mjs`의 측정 ID가 비어 있거나 올바른 `G-` 형식이 아니면 외부 분석 요청을 보내지 않습니다.

---
### 6.10 라이트·다크 모드와 반응형 메뉴

`public/responsive-nav.mjs`가 화면 너비에 따라 메뉴를 전환합니다.

- 960px 미만: 서랍 메뉴
- 960px 이상: 가로 메뉴
- 다크 모드 켬: 달 아이콘
- 다크 모드 끔: 해 아이콘
- 저장 키: `devforge-color-mode`

테마 선택은 정적 공개 페이지를 다시 열어도 유지됩니다. 로그인과 다크 모드 항목은 사이드 메뉴의 강조 카드 형태를 유지하고, 일반 메뉴는 통일된 행 형태를 사용합니다. Next.js 로그인·뉴스·관리자 화면은 공통 색상 토큰을 사용하지만 현재 저장된 다크 모드를 복원하는 스크립트는 연결하지 않았습니다.

---
## 7. 디자인 시스템

---
### 공통 디자인 토큰

`public/playful-lab-theme.css`가 공통 색상, 선, 그림자, 여백과 다크 모드 값을 관리합니다.

- 기본 배경: 흰색 계열
- 미술 상징: 민트 계열
- 게임 상징: 바이올렛 계열
- 기계·운영 상징: 오렌지 계열
- 영역 구분: 선명한 외곽선과 약한 그림자
- 다크 모드: 동일한 계층을 유지하는 어두운 표면 토큰

---
### 적용 범위

- 적용: 메인, 상품, 개발 소식, 커뮤니티, 약관, 개인정보, 회원, 인증, 뉴스와 관리자 화면
- 제외: `public/project_*` 개별 프로젝트 페이지와 `public/device-preview.html`

개별 프로젝트는 각각의 세계관과 전용 디자인을 유지해야 하므로 공통 토큰을 강제로 적용하지 않습니다.

---
### 반응형 기준

| 구간 | 너비 | 기본 동작 |
| --- | --- | --- |
| 모바일 | 767px 이하 | 한 열 배치, 서랍 메뉴, 작은 여백 |
| 태블릿 | 768px~1279px | 유동형 카드와 축소된 간격 |
| 데스크톱 | 1280px 이상 | 넓은 콘텐츠 폭과 가로 메뉴 |

고정 높이를 사용할 때는 내용이 짧은 화면에서 빈 공간이 과도해지지 않는지 확인합니다. 카드와 콘텐츠 영역은 `clamp()`, `min()`, `max()`와 콘텐츠 기반 높이를 우선 사용합니다.

---
## 8. Supabase 설정과 데이터 구조

---
### 환경 변수

`.env.example`을 참고해 프로젝트 루트에 `.env.local`을 만듭니다.

| 변수 | 역할 | 공개 가능 여부 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 주소 | 공개 클라이언트 값 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase 공개 키 | 공개 클라이언트 값 |
| `ADMIN_EMAIL` | 관리자 허용 이메일 | 서버 설정 권장 |
| `YOUTUBE_API_KEY` | YouTube Data API 키 | 비공개 서버 값 |
| `AGE_GATE_SECRET` | 연령 확인 토큰 서명 키 | 비공개 서버 값 |

`service_role` 키, 관리자 비밀번호와 실제 비밀 키는 저장소에 커밋하지 않습니다.

---
### 마이그레이션 순서

1. `supabase/migrations/202609100001_admin_news.sql`
2. `supabase/migrations/202609110001_admin_products.sql`
3. `supabase/migrations/202609120001_member_comments.sql`

첫 번째 파일은 뉴스와 뉴스 이미지 정책, 두 번째 파일은 상품과 상품 이미지 정책, 세 번째 파일은 회원 프로필·댓글·반응·신고·관리 기록과 댓글 이미지 정책을 만듭니다.

---
### 관리자 권한

관리자 권한은 두 조건을 모두 만족해야 합니다.

1. 로그인 이메일이 `ADMIN_EMAIL`과 일치
2. Supabase 사용자의 `app_metadata.role` 값이 `admin`

사용자가 직접 수정할 수 있는 `user_metadata`를 관리자 권한 근거로 사용하지 않습니다.

---
### RLS 원칙

- 공개 사용자는 공개 상태 데이터만 조회
- 로그인 사용자는 자신의 회원 데이터만 관리
- 관리자는 관리자 역할 확인 뒤 콘텐츠 관리
- 신고와 관리 기록은 허용된 역할만 조회
- Storage 업로드도 버킷별 정책 적용

마이그레이션 파일의 RLS를 운영 편의를 이유로 끄지 않습니다.

---
## 9. 테스트와 품질 확인

---
### 전체 검사

```powershell
# 자동 테스트 실행
pnpm test
# TypeScript 타입 검사
node node_modules/typescript/bin/tsc --noEmit --incremental false
# 운영 빌드 검사
pnpm build
```

자동 테스트는 정적 파일과 TypeScript 소스의 계약, 공개 페이지 구조, 인증 정책, API 안전 동작, 데이터 검증, 접근성 관련 표시와 반응형 구성을 검사합니다.

---
### 테스트 범위

| 테스트 그룹 | 대표 파일 | 확인 내용 |
| --- | --- | --- |
| 관리자 | `tests/admin-*.test.mjs` | 권한, 뉴스·상품 설정, 검증과 화면 |
| 연령 제한 | `tests/age-gate*.test.mjs` | API, 쿠키, 프록시와 UI |
| 회원·댓글 | `tests/member-*.test.mjs`, `tests/comment-domain.test.mjs` | 세션, 마이그레이션, 댓글 규칙 |
| 개인정보·분석 | `tests/privacy-consent.test.mjs`, `tests/site-analytics.test.mjs` | 동의 전 차단과 이벤트 제한 |
| 공개 페이지 | `tests/site-integrity.test.mjs`, `tests/website-content.test.mjs` | 링크, 문서 구조와 콘텐츠 |
| 게임 프로젝트 | `tests/game-*.test.mjs`, `tests/project-*.test.mjs` | 프로젝트 데이터와 공개 페이지 |
| 반응형·테마 | `tests/responsive-*.test.mjs`, `tests/playful-lab-theme.test.mjs` | 메뉴, 테마, 레이아웃 |
| 상품·커뮤니티 | `tests/goods-*.test.mjs`, `tests/products-api.test.mjs`, `tests/community-*.test.mjs` | 상품 상태와 커뮤니티 데이터 |

현재 `package.json`에는 `lint` 스크립트가 있지만 ESLint 패키지가 직접 선언되어 있지 않습니다. 따라서 품질 기준은 현재 `pnpm test`, TypeScript 검사와 빌드를 우선으로 사용합니다. ESLint를 정식 검사 단계에 넣을 때는 버전과 설정을 함께 고정해야 합니다.

---
## 10. 일반적인 개발 작업

---
### 게임 정보 수정

1. `public/game-projects.mjs`의 프로젝트 데이터 수정
2. 대표 이미지와 상세 페이지 경로 확인
3. 공통 페이지라면 `node scripts/generate-project-pages.mjs` 실행
4. 게임·프로젝트 관련 테스트 실행
5. 전체 테스트와 빌드 실행

---
### 공개 페이지 디자인 수정

1. 페이지 전용 CSS에서 구조 확인
2. 공통 값은 `public/playful-lab-theme.css` 토큰으로 조정
3. `public/responsive-shell.css`의 화면 구간 확인
4. 라이트·다크 모드 모두 확인
5. 모바일·태블릿·데스크톱 확인
6. 개별 프로젝트 페이지에 공통 테마가 번지지 않는지 확인

---
### 뉴스나 상품 필드 추가

1. `lib/news/types.ts` 또는 `lib/products/types.ts` 수정
2. 검증 모듈 수정
3. 관리자 입력 화면과 서버 작업 수정
4. 공개 API 변환 수정
5. Supabase 마이그레이션 추가
6. 관련 테스트를 먼저 추가하고 전체 검사 실행

기존 마이그레이션을 운영 적용 뒤 수정하지 말고, 새로운 번호의 마이그레이션을 추가합니다.

---
### 새 공개 HTML 페이지 추가

1. `public/`에 HTML 추가
2. 공통 헤더, 반응형 셸, 개인정보 동의와 테마 파일 연결
3. 필요한 전용 CSS와 MJS 추가
4. 사이트 링크와 키보드 접근 확인
5. 무결성·반응형·테마 테스트 추가

---
## 11. 배포 준비

---
### 배포 전 확인표

- `pnpm test` 통과
- TypeScript 검사 통과
- `pnpm build` 통과
- `.env.local`과 비밀 키가 Git에 없는지 확인
- Supabase 마이그레이션 적용 순서 확인
- 관리자 이메일과 역할 확인
- Supabase Site URL과 Redirect URL 확인
- 초안 뉴스와 비공개 상품이 공개 API에서 보이지 않는지 확인
- 일반 계정이 관리자 작업을 수행할 수 없는지 확인
- 이미지 업로드 형식과 용량 제한 확인
- 동의 전 GA4 요청이 없는지 확인
- 이용약관과 개인정보처리방침 법률 검토
- 상품 이미지와 가격의 실제 정보 확인
- ChatBot 배포 주소 확정 뒤 링크 교체
- 공식 도메인과 HTTPS 확인

---
### 배포 뒤 확인표

- 메인과 각 공개 메뉴 이동
- 모바일 서랍 메뉴와 테마 저장
- 관리자 로그인과 로그아웃
- 뉴스·상품 작성, 수정과 공개
- 연령 제한 프로젝트 접근
- 회원 로그인 확인
- 댓글 CRUD 구현 뒤 작성·반응·신고 권한 확인
- 존재하지 않는 페이지의 오류 처리
- 브라우저 콘솔 오류와 네트워크 실패 확인

---
## 12. 보안과 개인정보 기준

- 비밀번호, 서비스 역할 키, API 비밀 키를 Git에 저장하지 않기
- 관리자 권한을 서버에서 다시 확인하기
- 입력값을 저장 전에 검증하기
- 공개 API에서 초안과 내부 필드를 제외하기
- 외부 URL은 허용 형식과 HTTPS 여부 확인하기
- 사용자 텍스트를 HTML 문자열로 직접 삽입하지 않기
- 업로드 파일의 MIME 형식과 크기 확인하기
- 내부 복귀 주소만 허용해 외부 리디렉션 차단하기
- 분석 동의 전 추적 스크립트 로드하지 않기
- 브라우저 저장 데이터의 목적과 삭제 방법 알리기
- 운영 전 약관과 개인정보 문구를 전문가에게 최종 확인받기

---
## 13. 저장소 분리 원칙

---
### 이 저장소에 포함하는 항목

- DEVFORGE 홈페이지 소스
- 홈페이지에서 사용하는 이미지와 정적 자산
- 홈페이지의 ChatBot 홍보 슬라이드와 외부 이동 링크
- 홈페이지 데이터베이스 마이그레이션
- 홈페이지 테스트와 개발 문서

---
### 이 저장소에 포함하지 않는 항목

- Text-Play 소스, 기획서, 디자인 이미지와 구현 기록
- ChatBot 본체 소스와 ChatBot 전용 테스트
- 다른 세션의 전체 작업 사본
- Google Docs 읽기 캐시와 임시 파일
- 다운로드 압축 해제본과 중복 백업
- 세션 전달용 임시 메모

ChatBot 기능 개발은 별도 저장소에서 진행합니다. 두 프로젝트를 연결할 때는 홈페이지에 배포 URL과 필요한 공개 인터페이스만 기록하고, 소스 폴더를 복사하지 않습니다.

---
## 14. 알려진 제한과 후속 확인

- Supabase가 없는 상태에서는 실제 저장, 인증과 RLS를 확인할 수 없음
- 댓글은 데모 화면과 마이그레이션만 구현되어 실제 CRUD 서버 연결이 필요함
- YouTube API 키가 없는 상태에서는 실제 최신 영상 동기화를 확인할 수 없음
- GA4 측정 ID가 비어 있어 실제 분석 전송을 사용하지 않음
- 상품 판매처와 공식 재고 API가 확정되지 않음
- 약관과 개인정보처리방침은 개발 초안이며 법률 전문가 검토가 필요함
- ChatBot 링크가 현재 `http://localhost:3001/`인 로컬 임시 주소임
- ESLint 실행 환경은 패키지 의존성 정리가 필요함
- 연령 확인은 전문 본인 인증 서비스가 아닌 사이트 내부 접근 확인 방식임
- 정적 페이지의 다크 모드 선택이 Next.js 로그인·뉴스·관리자 화면에는 이어지지 않음

확인되지 않은 외부 서비스 상태를 구현 완료로 판단하지 않습니다. 계정과 키가 필요한 항목은 연결 후 별도 통합 검사를 수행해야 합니다.

---
## 15. 문제 해결

---
### 메인 페이지가 열리지 않음

1. `pnpm dev`가 실행 중인지 확인
2. 터미널의 포트 번호 확인
3. `/` 대신 `/main.html` 직접 접속
4. 빌드 오류가 있으면 `node node_modules/typescript/bin/tsc --noEmit --incremental false` 실행

---
### Supabase 기능이 데모 모드로 표시됨

1. `.env.local` 파일 위치 확인
2. URL과 공개 키 이름 확인
3. 개발 서버 재시작
4. 마이그레이션 적용 여부 확인

---
### 관리자 로그인이 거부됨

1. `ADMIN_EMAIL`과 로그인 이메일 비교
2. Supabase `app_metadata.role`이 `admin`인지 확인
3. 인증 Redirect URL 확인
4. 브라우저 쿠키와 서버 로그 확인

---
### 다크 모드에서 글자가 보이지 않음

1. 요소가 공통 색상 토큰을 사용하는지 확인
2. 라이트 모드 전용 흰색 글자 하드코딩 검색
3. 다크 모드 선택자 우선순위 확인
4. 테마 테스트와 실제 브라우저 확인

---
### 카드 영역이 특정 화면에서 과도하게 커짐

1. 고정 `height` 또는 큰 `min-height` 확인
2. 부모의 `display`, `align-items`, `grid-auto-rows` 확인
3. 콘텐츠 기반 높이와 `clamp()` 적용 검토
4. `device-preview.html`과 실제 브라우저 크기에서 함께 확인

---
## 16. 관련 문서

- `README.md`: 가장 빠른 실행과 운영 설정
- `docs/FILE-MAP.md`: 폴더와 파일 역할 지도
- `TRANSFER-GUIDE.md`: 기존 인수인계 정보
- `docs/superpowers/specs/`: 기능별 승인 설계 기록
- `docs/superpowers/plans/`: 기능별 구현 계획 기록
