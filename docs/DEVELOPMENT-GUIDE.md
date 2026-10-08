---
# Palettra Games 개발 가이드

이 문서는 Palettra Games 홈페이지 저장소를 처음 보는 개발자가 프로젝트의 목적, 실행 방법, 구조, 기능, 데이터 흐름, 보안 기준과 배포 전 확인 사항을 한 번에 이해할 수 있도록 정리한 문서입니다.

현재 저장소는 **Palettra Games 홈페이지**만 관리합니다. Text-Play, Mate | Verse 본체(ChatBot 저장소)와 Atelier | Verse 본체는 별도 프로젝트에서 관리하며, 이 저장소에는 두 서비스를 소개하는 홍보 화면과 이동 연결 요소만 포함합니다. Mate | Verse는 `http://localhost:3001/`로 이동하고, 기획 단계인 Atelier | Verse는 접속 주소가 정해질 때까지 "준비 중"으로 표시합니다.

---
## 1. 프로젝트 한눈에 보기

Palettra Games는 게임 개발 스튜디오 홈페이지입니다. 방문자는 게임 프로젝트, 개발 소식, 상품, 커뮤니티 정보를 확인할 수 있고, 관리자는 Supabase를 연결한 뒤 뉴스와 상품을 관리할 수 있습니다.

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
- Mate | Verse 홍보 슬라이드와 `http://localhost:3001/` 이동
- Atelier | Verse 홍보 슬라이드(기획 단계, 준비 중 표시)
- 35개 게임 프로젝트의 검색, 장르 필터와 개발 상태 필터
- 관심 프로젝트와 최근 본 프로젝트의 브라우저 로컬 저장
- 관심 별 버튼과 하단 완료 메시지
- 뉴스와 상품의 데모 데이터 표시
- 뉴스·상품·커뮤니티의 공통 로딩·시연·빈 결과·오류 안내와 다시 시도
- 커뮤니티 게임 선택, 플랫폼별 콘텐츠 영역과 해시태그 복사
- 이용약관과 개인정보처리방침 화면
- PC·태블릿·모바일 반응형 레이아웃
- 모바일 서랍 메뉴와 라이트·다크 모드 전환
- 연령 제한 대상 프로젝트의 접근 확인 화면
- 댓글 조회·작성·한 단계 답글·반응·신고 로컬 데모
- 회원가입·비밀번호 찾기·재설정 화면의 입력 검증과 시연 안내, 간편 로그인 버튼 미리보기
- 관리자 댓글·신고 관리 데모(`/admin/demo?form=comments`, 저장하지 않음)
- 개발용 기기 미리보기
- 자동 테스트, TypeScript 검사와 운영 빌드 검사

---
### 외부 설정 뒤 동작하는 기능

| 기능 | 필요한 설정 | 설정 전 동작 |
| --- | --- | --- |
| 관리자 로그인 | Supabase 프로젝트, 관리자 계정과 환경 변수 | 로그인과 저장 기능 비활성 |
| 뉴스·상품 저장 | Supabase 마이그레이션과 Storage | 데모 콘텐츠 표시 |
| 회원가입·로그인 | Supabase 인증과 환경 변수, 간편 로그인은 서비스별 OAuth 등록 | 데모 회원 흐름과 입력 검증 확인, 간편 로그인 버튼 비활성 |
| 댓글 서버 저장 | Supabase 프로젝트 연결과 회원·댓글 마이그레이션 적용(어댑터는 준비 완료) | 로컬 서비스로 전체 상호작용 확인, 새로고침 시 초기화 |
| 댓글·신고 관리 | Supabase 연결, 관리자 계정과 네 번째 마이그레이션 | 관리자 데모 화면으로 처리 흐름 확인 |
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

- Node.js: `>=22.13`
- pnpm: `11.19.0`
- Git: 변경 이력 관리
- 선택 사항: Supabase 프로젝트와 Supabase 계정

---
### 설치와 실행

```powershell
# 잠금 파일 기준 의존성 설치
pnpm install --frozen-lockfile
# 개발 서버 실행
pnpm dev
# 테스트·타입·린트·빌드 통합 검사
pnpm check
```

외부 계정이나 API 키 없이도 설치, 로컬 실행과 통합 검사를 완료할 수 있습니다. `ChatBot/`과 `Text-Play/`은 별도 프로젝트이므로 홈페이지 검사와 커밋에서 제외됩니다.

개발 서버를 실행한 뒤 다음 주소를 확인합니다.

| 주소 | 용도 |
| --- | --- |
| `http://localhost:3000/main.html` | 메인 홈페이지 |
| `http://localhost:3000/goods.html` | 상품 화면 |
| `http://localhost:3000/devlog.html` | 개발 소식 목록 |
| `http://localhost:3000/community.html` | 커뮤니티 화면 |
| `http://localhost:3000/device-preview.html` | 개발용 반응형 미리보기 |
| `http://localhost:3000/login` | 회원 로그인 |
| `http://localhost:3000/signup` | 회원가입 |
| `http://localhost:3000/admin/login` | 관리자 로그인 |
| `http://localhost:3001/` | 별도 실행 중인 Mate | Verse(ChatBot) 프로젝트 |

Mate | Verse 주소는 현재 로컬 임시 주소입니다. 배포 주소가 확정되면 `scripts/verse-services.mjs`의 `url`을 바꾸고 `pnpm pages:apply`를 실행합니다. Atelier | Verse는 기획 단계라 아직 접속 주소가 없습니다.

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
| `/main.html` | `public/main.html` | 캐러셀, 프로젝트 목록, 관심·최근 목록, 소개, FAQ, Verse 계열 서비스 연결 |
| `/goods.html` | `public/goods.html` | 공개 상품과 재고 상태 |
| `/devlog.html` | `public/devlog.html` | 공개 개발 뉴스와 검색·종류 필터 |
| `/community.html` | `public/community.html` | 게임별 플랫폼 콘텐츠와 해시태그 |
| `/contact.html` | `public/contact.html` | 자주 묻는 질문과 문의 양식 |
| `/roadmap.html` | `public/roadmap.html` | 단계별 개발 로드맵과 장르 필터 |
| `/atelier-verse.html` | `public/atelier-verse.html` | Atelier \| Verse 소개(기획 단계 안내, 계획 중인 기능, 개발 단계, 질문) |
| `/terms.html` | `public/terms.html` | 이용약관 초안 |
| `/privacy.html` | `public/privacy.html` | 개인정보처리방침 초안 |
| `/device-preview.html` | `public/device-preview.html` | 개발 전용 화면 크기 미리보기 |
| `/project_*/...` | `public/project_*/` | 35개 게임 프로젝트 상세 페이지 |

---
### Next.js 화면

| 경로 | 구현 위치 | 기능 |
| --- | --- | --- |
| `/` | `app/page.tsx` | `/main.html`로 이동 |
| `/login` | `app/login/` | 회원 로그인과 간편 로그인 |
| `/account` | `app/account/` | 닉네임 변경, 계정 기본 정보, 로그인 연동, 연결된 서비스, 내 댓글 확인·삭제, 회원 탈퇴 |
| `/oauth/consent` | `app/oauth/consent/` | 다른 서비스가 이 계정으로 로그인할 때의 허용 확인(통합 계정) |
| `/login/forgot` | `app/login/forgot/` | 비밀번호 재설정 메일 요청 |
| `/login/reset` | `app/login/reset/` | 메일 링크로 새 비밀번호 저장 |
| `/signup` | `app/signup/` | 이메일 회원가입과 간편 가입 |
| `/age-verification` | `app/age-verification/` | 성인 프로젝트 접근 확인 |
| `/news/[id]` | `app/news/[id]/` | 뉴스 상세와 댓글 영역 |
| `/admin/login` | `app/admin/login/` | 관리자 로그인 |
| `/admin/news` | `app/admin/news/` | 뉴스 목록, 작성과 수정 |
| `/admin/products` | `app/admin/products/` | 상품 목록, 작성과 수정 |
| `/admin/comments` | `app/admin/comments/` | 댓글 숨김·다시 공개·삭제와 신고 처리 |
| `/admin/contact` | `app/admin/contact/` | 문의함(답변 대기·완료 목록, 처리 메모, 상태 변경) |
| `/admin/demo` | `app/admin/demo/` | Supabase 없는 개발 환경 전용 관리자 데모 |
| `/auth/callback` | `app/auth/callback/route.ts` | Supabase 인증 결과 처리 |
| `/auth/confirm` | `app/auth/confirm/route.ts` | 이메일 인증·비밀번호 재설정 링크 확인 |
| `/robots.txt` | `app/robots.ts` | 검색엔진 수집 규칙(`SITE_URL` 또는 Vercel 운영 주소 기준) |
| `/sitemap.xml` | `app/sitemap.ts` | 공개 페이지·게임 소개 사이트맵(성인 게임 제외) |

---
### 서버 API

| 메서드와 경로 | 역할 |
| --- | --- |
| `GET /api/news` | 공개 상태의 뉴스 조회 |
| `GET /api/products` | 공개 상태의 상품 조회 |
| `GET /api/community/youtube` | 게임별 YouTube 콘텐츠 조회 |
| `GET /api/age/status` | 연령 확인 상태 조회 |
| `POST /api/contact` | 문의 접수(요청 횟수 제한 → 본문 확인 → 검증 → 저장, 시연 모드는 저장 안 함) |
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

캐러셀 2·3번째의 서비스 홍보 화면은 별도 프로젝트 소스가 아닙니다. 홈페이지에서는 소개와 이동 링크만 제공합니다.

- 화면 내용은 `scripts/verse-services.mjs`의 `VERSE_SERVICES` 목록에서 만들고, `pnpm pages:apply`가 `public/main.html`의 `<!-- verse-services:start -->`~`<!-- verse-services:end -->` 구간에 넣습니다. 이 구간은 직접 고치지 않습니다.
- Mate | Verse(캐릭터 대화 서비스): 임시 로컬 주소 `http://localhost:3001/`로 이동하는 "Mate | Verse 시작하기" 버튼을 둡니다.
- Atelier | Verse(VR 샌드박스 서비스, 가칭): 이용자가 3D 공간에서 맵을 만들고 꾸민 뒤 다른 사람을 초대해 함께 이용하는 서비스로, 기획 단계라 구현·저장소·접속 주소가 없습니다. `url`을 비워 두어 "준비 중" 비활성 버튼과 "계획 중인 기능" 머리말로 표시하며, 실제 제공 중인 기능처럼 안내하지 않습니다. 주소가 정해지면 `url`에 넣고 `pnpm pages:apply`를 실행하면 이동 버튼으로 바뀝니다.
- 서비스 이름은 상표·도메인 확인 전 가칭일 수 있어 목록의 `name` 한 곳에서만 관리합니다. 이름은 번역하지 않는 요소에 따로 넣으므로 이름을 바꿔도 영어 사전을 고칠 필요가 없습니다.

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

장르 표시 이름은 `GENRE_LABELS`(`getGenreLabel`) 한 곳에서 관리하며 생성 스크립트와 로드맵이 함께 씁니다. 목록의 장르 버튼(RPG·전략·액션·퍼즐·로그라이크·기타)은 `getFilterGenre`가 정한 필터용 대표 장르로 걸러 냅니다. 프로젝트 장르 가운데 처음 나오는 대표 장르를 쓰고, 대표 장르가 없으면 '기타'입니다. 그래서 모든 프로젝트가 정확히 한 버튼에 걸립니다.

개발 로드맵(`public/roadmap.html`, `public/roadmap.mjs`)은 같은 데이터로 단계를 나눕니다. 개발 상태가 보류·기획이면 그 단계로, 그 밖에는 `FEATURED_PROJECT_IDS`에 있으면 대표, 아니면 개발 중입니다. 단계 제목과 설명은 문서에 정적으로 두고 스크립트는 카드만 채우므로 단계 앵커가 스크립트 없이도 유효합니다. 확정되지 않은 출시 일정과 게임 이미지는 넣지 않습니다.

Atelier | Verse 소개(`public/atelier-verse.html`, `public/atelier-verse.css`)는 기획 단계 서비스를 알리는 정적 페이지입니다. 전용 스크립트가 없고, 서비스에 들어가는 링크 대신 "입장하기 · 준비 중" 비활성 버튼만 둡니다. 서비스 화면이 아직 없으므로 그림은 `public/images/atelier-verse/`의 콘셉트 이미지(생성형 AI로 만든 WebP 5장)만 쓰고, 화면과 대체 문구에 콘셉트 이미지라고 밝히며, 확정되지 않은 일정·가격은 적지 않습니다. 공통 상단 메뉴는 홈페이지 테마를 그대로 쓰고, 본문에만 `--av-*` 토큰의 "햇살 작업실" 테마를 적용합니다(밝은·어두운 화면 모두 글자 대비 4.5:1 이상, 기준은 사업 계획서 12.8). 서비스 이름은 제목과 `translate="no"` 요소에만 적어 영어 사전 키에 이름이 들어가지 않게 하며, `scripts/verse-services.mjs`의 이름을 바꾸면 이 문서의 표기도 함께 바꿉니다(`tests/atelier-verse.test.mjs`가 알려 줍니다). 접속 주소가 정해지면 입장 버튼과 테스트를 함께 고칩니다.

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

뉴스 목록은 `public/data-state.mjs`의 공통 요청을 사용합니다. 응답이 비었거나 서버 연결이 실패하면 기존 데모 뉴스를 유지하고 상태 카드에서 원인과 다시 시도 동작을 제공합니다.

뉴스 목록의 검색과 종류 필터는 `public/devlog.mjs`가 처리합니다.

- 조건 계산: `buildNewsView`가 종류(`NEWS_TYPES`)와 검색어를 함께 적용합니다. 검색 대상은 제목·요약·종류 이름이며, 영어 화면에서는 `getNewsSearchText`가 원문과 영어 번역을 함께 넣습니다.
- 주소 저장: `parseNewsParams`·`serializeNewsParams`가 `?q=&type=`을 읽고 씁니다. 검색어는 60자로 자르고 허용되지 않은 종류는 전체로 읽습니다. 주소는 기록을 쌓지 않는 `replaceState`로 바꿉니다.
- 화면: 조건 칩(`describeNewsFilters`)과 결과 수(`formatNewsCount`), 초기화 버튼. 검색 정보는 번역되기 전의 제목·요약을 행마다 한 번 읽어 두고, 서버 뉴스로 목록을 바꿀 때 다시 읽습니다.
- 게임별 필터는 뉴스 데이터에 게임 항목이 생긴 뒤에 추가합니다.

---
### 6.5 상품과 재고 상태

상품 화면은 Supabase 설정 전 데모 상품을 사용합니다. 설정 뒤에는 `products` 테이블의 공개 상품을 표시합니다.

데모 상품(메인과 굿즈 페이지의 정적 카드)은 판매 전 목업이므로 "시연" 배지, "가격 미정", "준비 중"만 표시합니다. 확정되지 않은 가격, 할인(취소선 정가·할인율), NEW·HOT·LIMITED 배지, 외부 판매 주소는 넣지 않습니다. 실제 가격·할인·배지는 관리자 화면에서 등록한 상품에만 나옵니다. 시연 뉴스도 같은 원칙으로 "시연" 표시를 달고 성과 수치를 지어내지 않으며, `tests/demo-content.test.mjs`가 이를 검사합니다.

- 재고 0개: 품절
- 재고 1~5개: 재고 부족
- 판매 주소 없음: 판매 준비 중
- 외부 재고: 판매처의 공식 API를 사용할 때만 연결

외부 판매 페이지 HTML을 직접 수집하는 방식은 사용하지 않습니다. 상품 검증은 `lib/products/validation.ts`, 공개 데이터 변환은 `lib/products/public-product.ts`, 상태 계산은 `lib/products/status.ts`가 담당합니다.

메인 상품 미리보기와 전체 상품 페이지는 같은 상태 제어기를 사용합니다. 실제 상품 응답이 준비될 때만 목록을 교체하고, 설정 누락·빈 결과·오류에서는 데모 상품을 유지합니다.

---
### 6.6 회원과 댓글

회원 모드는 `lib/member/config.ts`에서 Supabase 설정 여부에 따라 구분합니다. 댓글 도메인은 `lib/comments/domain.ts`가 규칙을 관리하고, `lib/comments/service.ts`가 저장소 공통 계약을 정의하며, `lib/comments/local-service.ts`가 메모리 기반 데모 저장소를 구현합니다.

- 댓글 내용 필수, 이미지 선택 사항
- 이미지 최대 5MB
- 허용 이미지: JPEG, PNG, WebP, GIF
- 반응: 좋아요, 응원, 궁금해요
- 신고 사유와 같은 사용자의 중복 신고 검증
- 같은 뉴스의 최상위 댓글에만 한 단계 답글 허용
- 작성 제한: 30초에 1개, 10분에 5개, 24시간 안 같은 내용 금지, 링크 2개까지, 금칙어 차단
- 데모 댓글 조회·작성과 반응 추가·취소·전환

댓글 화면은 `CommentService` 계약의 비동기 메서드로 조회·작성·반응·신고를 처리합니다. Supabase 설정이 없으면 로컬 서비스(`lib/comments/local-service.ts`)를 사용해 작성한 댓글, 반응과 신고가 현재 화면의 메모리에만 남고 새로고침하면 초기 데모 상태로 돌아갑니다.

Supabase 설정이 있으면 같은 계약의 `lib/comments/supabase-service.ts`로 자동 전환합니다. 공개 댓글(`status = 'visible'`)을 작성 순서대로 읽고 작성자 닉네임(`member_profiles`)과 반응(`comment_reactions`)을 합치며, 이미지는 `comment-images/회원-ID/` 폴더에 올린 뒤 저장 실패 시 지웁니다. 반응은 회원별 하나로 추가·전환·취소하고, 중복 신고·답글 단계·권한 오류는 서비스 오류 코드(`DUPLICATE_REPORT`·`INVALID_PARENT`·`SIGN_IN_REQUIRED`)로 바꿔 안내합니다. 두 서비스가 같은 입력 규칙을 쓰도록 검증은 `lib/comments/rules.ts`에 모았습니다.

작성 제한은 `lib/comments/guard.ts`가 수치와 판정을, `lib/comments/banned-words.ts`가 금칙어 목록을 관리합니다.

- 내용 규칙(링크 수·금칙어)은 `validateCommentContent`에 연결되어 화면이 제출 전에 바로 알려 줍니다. 금칙어는 공백과 보이지 않는 글자를 뺀 소문자로 비교하며, 어떤 낱말이 걸렸는지는 알려 주지 않습니다.
- 빈도 규칙(연속 작성·작성 수·같은 내용)은 `requireCommentAllowed`가 회원의 최근 댓글로 판정합니다. 로컬 서비스는 메모리의 댓글을, Supabase 서비스는 본인의 최근 24시간 댓글(최대 50개)을 조회해 이미지를 올리기 전에 확인합니다.
- 오류 코드: `TOO_FAST`·`RATE_LIMITED`는 안내 영역에, `INVALID_CONTENT`·`DUPLICATE_CONTENT`는 내용 입력 칸에 표시합니다. 막힌 댓글의 입력 내용은 지우지 않습니다.
- 데이터베이스(`202610040002_comment_limits.sql`)의 `enforce_comment_limits` 트리거가 같은 수치와 금칙어 표(`comment_banned_words`)로 다시 확인합니다. 화면을 거치지 않은 요청과 내용 수정도 막으며, 오류 표시(`COMMENT_TOO_FAST` 등)는 `toCommentServiceError`가 같은 안내로 바꿉니다. 수치와 금칙어가 화면과 다르면 `tests/comment-guard.test.mjs`가 실패합니다.
- 기기 시계가 서버보다 늦으면 화면의 연속 작성 판정을 건너뛰고 데이터베이스 판단에 맡깁니다.
- 주소(IP)별 제한은 없습니다. 댓글이 브라우저에서 Supabase로 바로 저장되어 서버가 주소를 알 수 없습니다.
- 관리자 댓글 관리 화면은 `describeCommentFlags`로 지금 규칙에 걸리는 기존 댓글에 "자동 감지" 사유를 보여 줍니다.

금칙어를 바꿀 때는 `banned-words.ts`를 고치고, 이미 운영에 적용한 뒤라면 `comment_banned_words` 표를 고치는 새 마이그레이션을 함께 추가합니다.

실제 모드 댓글 작성에는 회원 닉네임이 필요합니다. 닉네임이 없으면 댓글 영역이 로그인 화면의 닉네임 설정으로 안내합니다. `202609120001_member_comments.sql`은 이 흐름의 데이터 구조와 접근 정책을 제공하며, 연결 후 실제 동작은 README의 회원과 댓글 확인 순서로 점검합니다.

회원가입은 `/signup`에서 이메일·비밀번호(영문·숫자 8자 이상, 72바이트 이하)·닉네임과 필수 동의(만 14세 이상·이용약관·개인정보)를 받습니다. 입력 규칙과 인증 오류 안내는 `lib/member/signup.ts`에 있습니다. 가입 때 닉네임과 동의 시각은 인증 메타데이터로 보내고, 첫 로그인 때 `ensureMemberProfile`이 프로필을 만듭니다. 간편 로그인은 `lib/member/auth-providers.ts`의 지원 목록(카카오·Google·Apple·Discord·X·Facebook) 가운데 Supabase에서 켠 서비스만 `/auth/v1/settings`로 읽어 표시합니다. 간편 로그인 회원은 서비스가 넘겨준 이름을 공개하지 않고, 첫 로그인 때 닉네임과 필수 동의를 직접 저장합니다. 비밀번호 찾기는 계정 존재 여부와 관계없이 같은 안내를 보여 주며, `/login/reset`은 메일 링크로 만든 세션에서만 새 비밀번호를 저장합니다.

통합 계정은 홈페이지 계정 하나로 Mate | Verse 같은 다른 서비스에 로그인하는 기능입니다. 서비스마다 Supabase 프로젝트는 따로 두고, 홈페이지 프로젝트가 로그인 제공자(Supabase OAuth 2.1 서버)가 됩니다. 다른 서비스가 로그인을 요청하면 Supabase가 `/oauth/consent`로 보내고, `lib/member/oauth-consent.ts`가 요청 번호 형식을 확인한 뒤 서비스 이름·돌아갈 주소·받는 정보를 읽어 허용 또는 거부를 전달합니다. 로그인하지 않았거나 닉네임·약관 동의 전이면 `/login`을 거쳐 같은 화면으로 돌아옵니다. 내 정보(`/account`)의 `app/account/account-connections.tsx`는 계정 기본 정보(이메일, 이메일 인증, 가입일, 마지막 로그인), 로그인 연동(`lib/member/connections.ts`: 연결된 로그인 방법 목록, 간편 로그인 연결·해제. 이메일 로그인과 마지막 로그인 방법은 해제하지 않음), 연결된 서비스(`lib/member/services.ts`: `scripts/verse-services.mjs`의 서비스 목록에 로그인 허용 기록과 `member_service_links` 이용 기록을 합쳐 지금 이용 중·연결됨·연결 가능·준비 중으로 표시)를 보여 줍니다. 서비스가 알려 준 요약은 닉네임·이용 상품·성인 확인 세 항목만 표시합니다. 설정 전이거나 조회에 실패하면 서비스 목록을 "준비 중"으로만 보여 줍니다. 구조와 설정 순서는 `docs/UNIFIED-ACCOUNT.md`에 있으며, 실제 프로젝트에서는 아직 확인하지 않았습니다.

관리자 댓글 관리는 `/admin/comments`에서 신고 대기·숨긴 댓글·최근 댓글을 나눠 보고 숨김·다시 공개·신고 기각·삭제를 처리합니다. 처리 규칙과 데모·Supabase 서비스는 `lib/comments/moderation.ts`에 있으며, 서버 작업(`app/admin/comments/actions.ts`)이 관리자를 다시 확인한 뒤 댓글 상태·대기 신고·첨부 이미지를 바꾸고 `moderation_actions`에 관리자 ID와 메모를 남깁니다.

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

`public/data-state.mjs`는 뉴스·상품·YouTube 응답을 `loading`, `demo`, `empty`, `error`, `ready`로 통일합니다. 요청 제한 시간은 8초이며, 새 요청이 시작되면 늦게 도착한 이전 응답을 폐기합니다. 상태 카드는 `role="status"`, `aria-live="polite"`와 `aria-busy`를 사용합니다.

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

테마 선택은 정적 공개 페이지를 다시 열어도 유지됩니다. 로그인과 다크 모드 항목은 사이드 메뉴의 강조 카드 형태를 유지하고, 일반 메뉴는 통일된 행 형태를 사용합니다. Next.js 로그인·뉴스·관리자 화면도 공통 초기화 모듈로 저장된 다크 모드를 복원합니다.

---
### 6.11 대화상자와 입력 폼 접근성

`public/dialog-accessibility.mjs`는 `[data-dialog]`, `[data-dialog-open]`, `[data-dialog-close]` 계약으로 사용자 정의 모달과 네이티브 `<dialog>`를 함께 관리합니다. 열린 창 안에서 Tab·Shift+Tab 초점을 순환하고 Escape·닫기 버튼·배경 클릭으로 닫으며, 닫은 뒤에는 창을 연 요소로 초점을 돌려줍니다. 창이 열린 동안 배경 스크롤과 조작을 차단하고, 실행 요소가 제거된 경우에는 초점 복원을 안전하게 생략합니다.

새 정적 대화상자는 고유 제목 ID와 `aria-labelledby`를 제공해야 합니다. 사용자 정의 모달은 `role="dialog"`, `aria-modal="true"`, `hidden`을 함께 사용하고, 공통 모듈을 페이지마다 한 번만 연결합니다. 개별 페이지에서 `showModal()`이나 `open` 클래스를 직접 제어하지 않습니다.

2026년 10월 1일 기준으로 대화상자를 쓰는 공개 페이지가 없어 이 모듈은 어느 페이지에서도 불러오지 않고 재사용을 위해 보관합니다. 대화상자를 다시 추가하는 페이지에만 `<script type="module" src="/dialog-accessibility.mjs"></script>`를 연결하며, 배경 스크롤 잠금 규칙(`body.dialog-open`)은 `public/responsive-shell.css`에 유지합니다.

로그인과 성인 확인 폼은 제출 중 `aria-busy`를 표시합니다. 입력값 때문에 실패한 경우에만 해당 입력에 `aria-invalid`와 고유 오류 문구 ID를 `aria-describedby`로 연결하며, 통신·설정·OAuth 오류는 입력 오류로 표시하지 않습니다. 관리자 뉴스·상품 편집기도 서버 액션 진행 상태를 `aria-busy`로 전달합니다.

---
### 6.12 문의 양식과 문의함

문의하기 페이지(`public/contact.html`)의 양식은 `public/contact-form.mjs`가 화면에서 먼저 검증한 뒤 0단계의 `connectJsonForm`으로 `POST /api/contact`에 보냅니다. 화면 검증과 서버 검증(`lib/contact/domain.ts`)은 같은 분류·순서·오류 문구를 쓰며 `tests/contact.test.mjs`가 두 결과가 같은지 비교합니다.

- 접수 순서: 요청자별 10분 5회 제한 → 본문 크기·형식 확인 → 입력 검증 → 저장
- 자동 입력 방지: 사람에게 보이지 않는 `website` 칸이 채워져 있으면 저장하지 않고 정상 접수와 같은 안내를 돌려줍니다.
- 시연 모드(Supabase 미설정): 검증만 하고 저장하지 않으며 응답에 `demo: true`를 넣습니다.
- 저장: `contact_messages` 테이블. 방문자는 분류·이메일·제목·내용 네 열만 추가할 수 있고 조회·처리는 관리자만 합니다.
- 관리자 문의함(`/admin/contact`): 처리 규칙과 데모·Supabase 서비스는 `lib/contact/inbox.ts`, 서버 작업은 `app/admin/contact/actions.ts`. 답변 완료로 바꾸면 처리 시각과 처리한 관리자를 기록합니다.

접수 알림은 메일 설정(`lib/mail/config.ts`의 `getMailConfig`)이 있을 때만 보냅니다. 문의를 저장한 뒤 `buildContactNotice`로 만든 글자 본문 메일을 `sendMail`(Resend, 4초 제한)로 운영자에게 보내며, 답장 주소는 문의한 사람입니다. 발송이 실패해도 접수 응답은 바뀌지 않고 서버 기록에는 실패 종류만 남깁니다. 메일 본문은 HTML을 쓰지 않고 제목의 줄바꿈을 지워 머리말 끼워 넣기를 막습니다. 답변 메일을 홈페이지에서 직접 보내는 기능은 없습니다(받은 알림 메일에 답장).

외부 서비스 연결 상태는 `pnpm services:check`(`scripts/check-services.mjs`)로 확인합니다. Supabase·메일·YouTube·GA4를 연결 권장 순서대로 보여 주고, 서버 전용 키가 `NEXT_PUBLIC_` 항목에 들어 있으면 오류로 알립니다.

출시 알림 신청도 같은 구조를 씁니다.

- 대상 판정: `public/game-projects.mjs`의 `getReleaseNotifyState`가 성인 게임은 `adult`, 보류 게임은 `paused`, 나머지는 `open`으로 정합니다. 화면(`public/release-notify.mjs`)과 서버(`lib/notify/domain.ts`)가 같은 판정을 씁니다.
- 화면: 게임 소개 35개 첫 화면은 `/release-notify.mjs`만 불러옵니다. 스크립트가 `[data-public-project-page]`의 게임 식별자를 읽어 `open`이면 양식을, `paused`이면 안내만 `main` 바로 뒤에 넣고 스타일(`/release-notify.css`)을 연결합니다. 공통 형식 29개는 생성 도구가, 개별 디자인 6개는 `pnpm pages:apply`가 스크립트 줄을 넣습니다.
- 접수(`POST /api/notify`): 요청자별 10분 5회 제한 → 본문 → 검증(게임·이메일·수신 동의) → 자동 입력 방지 → 시연 모드 → 저장. 이메일은 소문자로 통일합니다.
- 저장: `release_notifications` 표는 방문자에게 열려 있지 않습니다. `subscribe_release_notification` 함수로만 추가하며, 같은 게임·같은 이메일은 한 번만 저장하고 이미 신청했는지는 알려 주지 않습니다. 수신 거부 뒤 다시 신청하면 수신 거부 값과 본인 확인을 새로 시작합니다.
- 수신 거부: 메일에 넣을 주소는 `/notify/unsubscribe?token=수신거부값`입니다. 메일 프로그램이 주소를 미리 여는 것만으로 처리되지 않도록 화면의 버튼을 눌러야 `POST /api/notify/unsubscribe`가 처리합니다.
- 관리자(`/admin/notify`): `release_notification_counts` 함수로 게임별 수신 중·수신 거부 수만 봅니다. 이메일 주소는 화면에 내지 않습니다.
- 본인 확인(이중 확인): 표를 우회해 남의 이메일을 넣는 장난을 막을 수 없으므로, 확인 메일로 본인 신청임을 확인한 주소(`confirmed_at`)에만 출시 소식을 보냅니다. `lib/notify/confirmation.ts`의 `sendNotifyConfirmation`이 신청 저장 뒤에 실행됩니다.
  - 켜지는 조건(`isConfirmationEnabled`): 보내는 쪽 설정(`getMailSender`)이 있고 방문자에게 보낼 수 있는 주소(`canMailVisitors`, `resend.dev` 시험 주소가 아님)이며 서버 전용 연결(`lib/supabase/secret.ts`, `SUPABASE_SECRET_KEY`)이 있을 때
  - 흐름: 서버 전용 연결로 `issue_release_confirmation` 호출 → 확인 값을 받으면 `buildNotifyConfirmation` 메일 발송 → 실패하면 `clearNotifyConfirmationMark`로 발송 표시를 지워 다음 신청 때 재발송
  - 확인 값은 메일로만 전달합니다. 발급 함수는 `service_role`만 실행할 수 있어 공개 키로는 확인 값을 얻을 수 없습니다. 본인 확인(`confirm_release_notification`)과 수신 거부는 확인 값을 가진 누구나 할 수 있습니다.
  - 한도는 데이터베이스 함수가 지킵니다: 같은 신청 24시간에 한 번(`NOTIFY_CONFIRM_RESEND_HOURS`), 같은 이메일 하루 3통(`NOTIFY_CONFIRM_DAILY_LIMIT`). 화면 상수와 다르면 `tests/release-notify.test.mjs`가 실패합니다.
  - 신청 응답은 발송 결과(보냄·생략·실패)와 상관없이 같은 문구입니다. 이미 신청·확인한 주소인지 알 수 없게 하기 위해서입니다.
  - 서버 전용 비밀 키는 이 처리 한 곳에서만 불러옵니다. `"use client"` 파일이 불러오면 검사가 실패합니다.
- 출시 소식을 실제로 보낼 때는 `confirmed_at`이 채워져 있고 `status`가 `active`이며 `getReleaseNotifyState`가 `open`인 게임의 신청만 대상으로 합니다(발송 기능은 아직 없음).

---
### 6.13 영어 화면(AI 번역)

공개 정적 페이지는 같은 주소에서 한국어 원문을 영어 사전으로 바꿔 보여 줍니다. 페이지 머리의 `public/i18n-bootstrap.js`가 정적 페이지 표시(`data-i18n-page="static"`)를 남기고, 영어를 고른 경우 번역이 끝날 때까지 본문을 최대 3초 가립니다. `public/responsive-nav.mjs`가 헤더 `EN`/`KO` 버튼과 서랍 메뉴 `English`/`한국어` 버튼을 만들고 `public/i18n.mjs`의 번역을 시작합니다. Next.js 화면은 표시가 없으므로 버튼도 번역도 생기지 않습니다.

- Next 화면: 루트 레이아웃이 `data-i18n-page="next"` 준비 스크립트를 넣고, `app/page-translator.tsx`가 하이드레이션이 끝난 뒤(`useEffect`) 같은 번역기를 시작해 React와 충돌하지 않습니다. 관리자 화면(`/admin`)은 `none`으로 표시해 번역과 언어 버튼을 끕니다. 서버가 그린 한국어 날짜(`2025년 4월 28일`, `2025. 4. 28. 오후 1:05`)는 번역기가 영어 날짜로 바꿉니다.
- 사전: `public/i18n/en/site.json`(공통 페이지·공통 모듈), `next.json`(Next 화면과 회원·댓글 문구)과 게임 폴더별 `project_*.json`. 형식은 `{ "entries": { 한국어: 영어 }, "patterns": [{ "ko": "{0}개의 뉴스", "en": "{0} posts" }] }`입니다.
- 번역 순서: 문맥별 문구(`title::게임`, `data-i18n-context`가 붙은 요소 안) → 문구 → 형식 문구(고정 글자가 긴 것부터) → 따옴표·`#` 태그·`·`·`+`·`→`·`/` 조합의 조각별 번역 순서입니다.
- 방문자가 입력한 글자가 들어가는 형식(`검색: "{0}"`, 닉네임이 들어가는 `{0} 이름으로 댓글 작성` 등)은 사전에 `"keep": true`를 붙입니다. 자리 값을 번역하지 않고 그대로 두며, 한글이 남아도 둘러싼 문구는 번역합니다.
- 화면 글자와 `alt`·`title`·`aria-label`·`placeholder` 속성만 바꾸고 `data-*` 값은 그대로 두어 필터·저장 로직이 깨지지 않습니다. 이후 스크립트가 바꾸는 글자도 `MutationObserver`로 번역합니다.
- `data-i18n-skip`·`translate="no"` 요소(언어 버튼, 실제 SNS 해시태그)는 번역하지 않습니다. 날짜는 `getPageLocale()`로 영어 화면에서 `en-US` 형식을 씁니다.
- `scripts/i18n-extract.mjs`가 HTML 글자·속성과 JS 문자열·형식 문구(템플릿과 `+` 연결)를 추출합니다. `pnpm i18n:check`와 `tests/i18n.test.mjs`가 빠진 번역, 원문에서 사라진 번역, 자리 표시 불일치를 검사합니다.

문구를 바꾸면 사전의 같은 키를 고치고, 새 문구는 영어 번역을 추가한 뒤 `pnpm i18n:check`로 확인합니다. 화면에서 영어로 바뀌지 않은 글자는 영어 화면 콘솔의 `window.__devforgeI18n.missing`에 모입니다.

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

긴 한국어 문구와 외부 데이터는 카드, 제목, 입력과 버튼 안에서 줄바꿈되어야 하며, 자식 요소에는 필요한 경우 `min-width: 0`을 적용합니다. 화면에 고정된 개인정보·알림 패널은 `100vw` 대신 포함 블록과 좌우 안전 여백을 기준으로 너비를 계산합니다. 모바일 전체 높이는 브라우저 도구 모음을 반영하는 `100dvh`를 사용합니다.

작은 카드 안의 짧은 한국어 설명은 단어 중간에서 끊기지 않도록 `word-break: keep-all`을 쓰고, 여러 항목은 가운뎃점 대신 항목별 한 줄로 나눕니다. 메인 커뮤니티 카드는 휴대폰 2열, 540px 이상 3열, 1024px 이상 6열로 줄 폭을 나눠 쓰며 정사각형 비율을 강제하지 않습니다.

반응형 변경은 다음 화면 크기로 확인합니다.

| 확인 조건 | 화면 크기 | 중점 확인 |
| --- | --- | --- |
| 소형 모바일 | 320×568 | 고정 패널, 긴 문구, 조작 요소 잘림 |
| 일반 모바일 | 390×844 | 한 열 카드, 입력과 버튼 너비 |
| 200% 확대 대응 | 640×720 | 1280px 화면의 CSS 유효 너비 대응 |
| 태블릿 | 768×900, 1024×768 | 카드 열 전환과 중간 여백 |
| 데스크톱 | 1280×800, 1440×900 | 콘텐츠 최대 폭과 가로 메뉴 |
| 가로 화면 | 844×390 | 짧은 높이의 대화상자 내부 스크롤 |

검사 범위는 메인, 상품, 개발 소식, 커뮤니티, 약관, 개인정보, 로그인, 성인 확인, 뉴스 상세와 관리자 공통 화면입니다. `public/project_*` 개별 프로젝트 페이지와 `public/device-preview.html`은 전용 디자인을 유지하므로 공통 보강 범위에서 제외합니다.

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
4. `supabase/migrations/202610010001_member_signup_moderation.sql`
5. `supabase/migrations/202610010002_member_account_deletion.sql`
6. `supabase/migrations/202610040001_contact_messages.sql`
7. `supabase/migrations/202610040002_comment_limits.sql`
8. `supabase/migrations/202610040003_release_notifications.sql`
9. `supabase/migrations/202610040004_hide_demo_products.sql`
10. `supabase/migrations/202610080001_account_services.sql`

첫 번째 파일은 뉴스와 뉴스 이미지 정책, 두 번째 파일은 상품과 상품 이미지 정책, 세 번째 파일은 회원 프로필·댓글·반응·신고·관리 기록과 댓글 이미지 정책을 만듭니다. 네 번째 파일은 가입 동의 시각 열을 더하고 공개 프로필 조회에서 동의 열을 숨기며, 댓글 공개 상태와 신고 처리 상태를 관리자만 바꾸도록 제한합니다. 다섯 번째 파일은 로그인 회원이 본인 계정만 지우는 `delete_own_account` 함수를 만듭니다(관리자 계정과 남은 댓글 이미지가 있으면 거부). 여섯 번째 파일은 문의 양식 접수 테이블 `contact_messages`를 만듭니다. 누구나 대기 상태 문의만 추가할 수 있고, 조회와 처리는 관리자만 할 수 있습니다. 일곱 번째 파일은 댓글 작성 제한 트리거(`enforce_comment_limits`)와 관리자만 고칠 수 있는 금칙어 표(`comment_banned_words`)를 만듭니다. 여덟 번째 파일은 출시 알림 신청 표(`release_notifications`)와 신청·수신 거부·집계 함수를 만듭니다. 아홉 번째 파일은 두 번째 파일이 넣은 임시 상품 여덟 개를 숨김 상태로 바꿉니다. 임의 가격·할인·배지가 공개 화면에 나오지 않게 하기 위한 것으로, 상품은 관리자 화면에 남아 실제 내용으로 고친 뒤 다시 공개할 수 있습니다. 공개 상품이 없으면 공개 화면은 "시연" 표시가 붙은 목업 카드를 보여 줍니다. 열 번째 파일은 통합 계정의 서비스 목록(`account_services`)과 서비스 연결 기록(`member_service_links`), 서비스가 이용 기록을 남기는 함수(`record_service_use`)를 만들고, 다른 서비스의 로그인으로는 회원 탈퇴를 할 수 없게 탈퇴 함수를 고칩니다.

마이그레이션을 고치거나 추가하면 `tests/supabase-migrations.test.mjs`가 시험용 PostgreSQL(개발 전용 의존성 `@electric-sql/pglite`)에 여덟 개를 순서대로 실행하고, 역할(`anon`·`authenticated`·`service_role`)을 바꿔 가며 권한과 제한 동작을 확인합니다. Supabase가 기본으로 주는 역할, `auth.users`·`auth.uid()`·`auth.jwt()`, `storage.buckets`·`storage.objects`·`storage.foldername()`, 기본 권한은 검사 파일 안에서 흉내 냅니다. 새 마이그레이션이 Supabase의 다른 기능을 쓰면 그 부분도 함께 흉내 내야 합니다.

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
- 댓글 공개 상태와 신고 처리 상태는 관리자만 변경
- 회원 동의 시각은 공개 프로필 조회에서 제외
- Storage 업로드도 버킷별 정책 적용

마이그레이션 파일의 RLS를 운영 편의를 이유로 끄지 않습니다.

---
## 9. 테스트와 품질 확인

---
### 전체 검사

```powershell
# 테스트·타입·린트·빌드 통합 검사
pnpm check
```

자동 테스트는 정적 파일과 TypeScript 소스의 계약, 공개 페이지 구조, 인증 정책, API 안전 동작, 데이터 검증, 접근성 관련 표시와 반응형 구성을 검사합니다.

문제 원인을 나누어 확인할 때만 `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`를 개별 실행합니다. Next.js 16은 내장 `next lint` 명령 대신 고정된 ESLint 9 Flat Config를 직접 실행합니다.

---
### 테스트 범위

| 테스트 그룹 | 대표 파일 | 확인 내용 |
| --- | --- | --- |
| 관리자 | `tests/admin-*.test.mjs` | 권한, 뉴스·상품 설정, 검증과 화면 |
| 연령 제한 | `tests/age-gate*.test.mjs` | API, 쿠키, 프록시와 UI |
| 회원·댓글 | `tests/member-*.test.mjs`, `tests/comment-*.test.mjs`, `tests/auth-providers.test.mjs` | 세션, 가입·간편 로그인·비밀번호 재설정, 로그인 연동·연결된 서비스·로그인 허용(통합 계정), 마이그레이션, 댓글 규칙·로컬·Supabase 서비스·관리자 처리·화면 연결 |
| 개인정보·분석 | `tests/privacy-consent.test.mjs`, `tests/site-analytics.test.mjs` | 동의 전 차단과 이벤트 제한 |
| 공개 페이지 | `tests/site-integrity.test.mjs`, `tests/website-content.test.mjs` | 링크, 문서 구조와 콘텐츠 |
| 게임 프로젝트 | `tests/game-*.test.mjs`, `tests/project-*.test.mjs` | 프로젝트 데이터와 공개 페이지 |
| 반응형·테마 | `tests/responsive-*.test.mjs`, `tests/playful-lab-theme.test.mjs` | 메뉴, 테마, 레이아웃 |
| 상품·커뮤니티 | `tests/goods-*.test.mjs`, `tests/products-api.test.mjs`, `tests/community-*.test.mjs` | 상품 상태와 커뮤니티 데이터 |
| 데이터 상태 | `tests/data-state*.test.mjs` | 공통 상태 모델, 시간 초과, SVG 자산과 페이지 연결 |

ESLint와 `eslint-config-next` 버전은 `package.json`에 고정되어 있으며, 홈페이지 소스와 테스트만 검사하고 별도 프로젝트·생성물·내부 보관 자료는 제외합니다.

---
## 10. 일반적인 개발 작업

---
### 게임 정보 수정

1. `public/game-projects.mjs`의 프로젝트 데이터 수정
2. 대표 이미지와 상세 페이지 경로 확인(이미지를 바꾸면 원본 PNG를 `internal/game-image-originals/`에 넣고 `pnpm images:games` 실행)
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

1. `public/`에 HTML 추가(공통 메뉴 기준 요소 `data-responsive-nav-root`와 `/responsive-nav.mjs`, 반응형 셸, 개인정보 동의, 테마 파일 연결)
2. `scripts/apply-site-header.mjs`의 `STATIC_HEADER_PAGES`에 페이지 등록, 필요하면 `scripts/apply-page-meta.mjs`의 `PAGE_DESCRIPTIONS`에 검색 설명 추가
3. `pnpm pages:apply` 실행 — 공통 헤더, 검색 설명·공유 정보, 번역 준비 스크립트, 메인 캐러셀의 서비스 홍보 화면을 한 번에 적용합니다. `pnpm pages:check`는 빠진 페이지만 알려 줍니다.
4. `lib/site-url.ts`의 `PUBLIC_STATIC_PATHS`(사이트맵) 또는 `CRAWL_BLOCKED_PATHS`(검색 제외)에 주소 추가
5. 한국어 문구의 영어 번역을 `public/i18n/en/site.json`에 추가하고 `pnpm i18n:check` 확인
6. 필요한 전용 CSS와 MJS 추가, 사이트 링크와 키보드 접근 확인
7. 무결성·반응형·테마 테스트 추가

2~5번을 빠뜨리면 `tests/foundation.test.mjs`, `tests/site-header.test.mjs`, `tests/i18n.test.mjs`가 알려 줍니다.

양식이 있는 페이지는 `public/form-submit.mjs`의 `connectJsonForm`으로 전송하고, 받는 API는 `lib/http/json.ts`(`readJsonBody`·`jsonNoStore`)와 `lib/http/rate-limit.ts`(`createRateLimiter`)를 사용합니다. 요청 제한은 서버 인스턴스의 메모리에 기록하므로 여러 인스턴스로 운영할 때는 대략적인 제한으로만 동작합니다.

---
## 11. 배포 준비

---
### 배포 전 확인표

- `pnpm check` 통과
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
- Mate | Verse 배포 주소 확정 뒤 링크 교체
- Atelier | Verse 서비스명·접속 주소 확정 뒤 `scripts/verse-services.mjs` 갱신
- 공식 도메인과 HTTPS 확인

---
### 배포 뒤 확인표

- 메인과 각 공개 메뉴 이동
- 모바일 서랍 메뉴와 테마 저장
- 관리자 로그인과 로그아웃
- 뉴스·상품 작성, 수정과 공개
- 연령 제한 프로젝트 접근
- 회원가입·간편 로그인·비밀번호 재설정 확인
- 댓글 작성·반응·신고 권한과 관리자 숨김·삭제 확인
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

- Palettra Games 홈페이지 소스
- 홈페이지에서 사용하는 이미지와 정적 자산
- 홈페이지의 Mate | Verse·Atelier | Verse 홍보 슬라이드와 외부 이동 링크
- 홈페이지 데이터베이스 마이그레이션
- 홈페이지 테스트와 개발 문서

---
### 이 저장소에 포함하지 않는 항목

- Text-Play 소스, 기획서, 디자인 이미지와 구현 기록
- Mate | Verse(ChatBot) 본체 소스와 전용 테스트
- Atelier | Verse 본체 소스(구현 시 별도 프로젝트)
- 다른 세션의 전체 작업 사본
- Google Docs 읽기 캐시와 임시 파일
- 다운로드 압축 해제본과 중복 백업
- 세션 전달용 임시 메모

Mate | Verse(ChatBot)와 Atelier | Verse 기능 개발은 별도 저장소에서 진행합니다. 프로젝트를 연결할 때는 홈페이지에 배포 URL과 필요한 공개 인터페이스만 기록하고, 소스 폴더를 복사하지 않습니다.

---
## 14. 알려진 제한과 후속 확인

- Supabase가 없는 상태에서는 실제 저장, 인증과 RLS를 확인할 수 없음
- 회원가입·간편 로그인·댓글 저장·관리자 댓글 관리는 코드가 준비되었지만 실제 Supabase 연결 뒤 다시 확인해야 함
- 간편 로그인 버튼은 공개 전 각 서비스의 로그인 버튼 디자인 지침(로고·문구) 확인이 필요함
- YouTube API 키가 없는 상태에서는 실제 최신 영상 동기화를 확인할 수 없음
- GA4 측정 ID가 비어 있어 실제 분석 전송을 사용하지 않음
- 상품 판매처와 공식 재고 API가 확정되지 않음
- 약관과 개인정보처리방침은 개발 초안이며 법률 전문가 검토가 필요함
- Mate | Verse 링크가 현재 `http://localhost:3001/`인 로컬 임시 주소임
- Atelier | Verse는 기획 단계로 접속 주소가 없어 준비 중으로 표시함
- 연령 확인은 전문 본인 인증 서비스가 아닌 사이트 내부 접근 확인 방식임. 청소년보호법상 생년월일 자기 입력만으로는 부족하므로 성인 콘텐츠 공개 전 휴대폰·카드 본인인증 연결 필요(`docs/EXTERNAL-SERVICES.md` 9절)

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
- `docs/DEVELOPMENT-NOTES.md`: 로컬·외부 API·유료 작업 분류와 실행 순서
- `docs/FILE-MAP.md`: 폴더와 파일 역할 지도
- `TRANSFER-GUIDE.md`: 기존 인수인계 정보
- `docs/superpowers/specs/`: 기능별 승인 설계 기록
- `docs/superpowers/plans/`: 기능별 구현 계획 기록
