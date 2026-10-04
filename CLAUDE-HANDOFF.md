---
# Claude 작업 인수인계

이 문서는 다른 컴퓨터에서 Claude가 DEVFORGE 홈페이지 개발을 바로 이어가기 위한 전달 문서입니다. 작업 기준은 이 파일이 포함된 `origin/main` 최신 커밋입니다.

- 마지막 갱신: 2026년 10월 4일
- 마지막 검증: 테스트 450개 통과, TypeScript·ESLint·Next.js 운영 빌드 통과
- 검증 환경: Windows 11, Node.js `24.19.0`, pnpm `11.19.0`

---
## Claude에게 전달할 시작 문구

> GitHub의 `siwoo440/HomePage` 저장소에서 `main` 최신 커밋을 복제하고 DEVFORGE 홈페이지 개발을 이어서 진행해주세요. 먼저 `CLAUDE-HANDOFF.md`, `README.md`, `TRANSFER-GUIDE.md`, `docs/DEVELOPMENT-GUIDE.md`, `docs/DEVELOPMENT-NOTES.md`, `.env.example`을 읽어주세요. Node.js `22.13` 이상과 pnpm `11.19.0` 환경에서 `pnpm install --frozen-lockfile`과 `pnpm check`를 실행해 현재 상태를 확인한 뒤 `pnpm dev`로 `http://localhost:3000/main.html`을 열어주세요. 모든 답변은 한국어로 작성해주세요. 홈페이지 저장소만 작업 대상으로 사용하고 ChatBot과 Text-Play 소스는 별도 저장소로 유지해주세요. 기존 디자인과 동작을 보존하고, 외부 계정·API·비용·운영 상태는 추측하지 말고 확인이 필요한 항목으로 분리해주세요. 코드는 Allman 스타일을 지키고 각 코드 줄에 짧은 한글 명사형 주석을 작성해주세요. 한 작업 단위의 변경은 `pnpm check` 통과 후 하나의 커밋으로 모아 `main`에 푸시해주세요. 커밋 제목은 접두어 없는 한국어 한 줄, 본문은 `~추가`, `~변경`, `~수정` 형식의 목록으로 작성하고 Claude 공동 작성자(Co-Authored-By) 줄은 넣지 마세요.

---
## 새 컴퓨터에서 첫 확인

1. `git clone https://github.com/siwoo440/HomePage.git`으로 저장소 복제
2. `cd HomePage`로 프로젝트 폴더 이동
3. `pnpm install --frozen-lockfile`로 잠금 파일 기준 설치
4. `pnpm check`로 테스트·타입·린트·빌드 검사
5. `pnpm dev`로 개발 서버 실행
6. `http://localhost:3000/main.html`에서 공개 홈페이지 확인
7. 작업 전 `git status --short --branch`로 기존 변경 확인

`pnpm check`는 `pnpm test`(`node --test tests/*.test.mjs`) → `pnpm typecheck` → `pnpm lint`(경고 0개 기준) → `pnpm build` 순서로 실행합니다.

### Windows 환경 참고

- pnpm을 `npm i -g pnpm@11.19.0`으로 설치하면 `%APPDATA%\npm`에 등록됩니다. 새로 연 셸에서 `pnpm`·`node`를 찾지 못하면 셸을 다시 열거나 PowerShell에서 `$env:Path = [Environment]::GetEnvironmentVariable('Path','User') + ';' + [Environment]::GetEnvironmentVariable('Path','Machine')`로 경로를 다시 읽습니다.
- 저장소는 `core.autocrlf=true` 기준입니다. 파일을 스크립트로 수정할 때 `\r\n`을 `\n`으로 정규화한 뒤 바꾸고 원래 줄바꿈으로 되돌려야 문자열 치환이 실패하지 않습니다.
- Windows PowerShell 5.1에서는 여러 줄 커밋 메시지를 임시 파일에 쓰고 `git commit -F <파일>`로 커밋하는 방식이 안정적입니다.
- `.claude/`(로컬 개발 서버 실행 설정)는 개인 환경 파일이므로 커밋하지 않습니다.

---
## 저장소 범위

- 포함: DEVFORGE 홈페이지, 35개 프로젝트 소개, 뉴스, 상품, 커뮤니티, 문의하기, 로그인·관리자 화면, API와 Supabase 연결 구조
- 포함: 홈페이지 안의 ChatBot 홍보 화면과 외부 이동 링크
- 제외: ChatBot 본체 소스와 전용 테스트
- 제외: Text-Play 소스·기획·디자인 자료
- 현재 ChatBot 임시 주소: `http://localhost:3001/`

ChatBot과 Text-Play 폴더를 홈페이지 저장소에 복사하지 않습니다. 운영 주소가 확정되면 공개 링크만 교체합니다.

---
## 현재 로컬 완료 범위

- 대표 프로젝트 6개 강조와 전체 35개 검색·필터
  - 검색어·장르·상태 조건 칩, 결과 개수, 초기화 버튼
  - 조건을 주소(`main.html?q=…&genre=…&status=…`)에 저장해 새로고침·공유 시 복원
  - 관심 목록은 최근 추가 순서로 표시
- 프로젝트 상세 화면과 프로젝트 η 전용 콘텐츠, 프로젝트 H 동료 캐러셀
- 개발 뉴스와 상품 데모 화면
- 커뮤니티 플랫폼 영역과 YouTube 데모 대체
  - 소개 가운데 정렬, 현재 해시태그 오른쪽 같은 줄의 복사 버튼
  - 플랫폼별 최신 소식은 모든 화면에서 한 줄에 한 플랫폼씩 세로 배치
- 회원 로그인 전체 화면과 로그아웃, 모든 공개 페이지 상단·서랍 메뉴의 로그인 상태 표시
- 개인정보처리방침의 브라우저 저장 데이터 확인·삭제
- 모든 공개 페이지 공통 상단 헤더와 데스크톱 헤더 테마 전환 버튼
- 문의하기 FAQ 페이지(`/contact.html`, 질문 14개·분류 5개, 이메일·Discord 아이콘)
- 404 페이지
- Supabase 없는 개발 환경 전용 관리자 데모 모드(`/admin/demo`)
- 관리자 화면 공통 상단 헤더(`app/admin/layout.tsx`), 관리자 메뉴는 그 아래 유지
- 관리자 뉴스·상품 목록 20개 단위 페이지 이동, 뉴스 수정 화면의 현재 대표 이미지 표시
- 댓글·답글·반응·신고: 설정이 없으면 로컬 서비스, Supabase 설정이 있으면 같은 계약의 Supabase 어댑터(`lib/comments/supabase-service.ts`)로 자동 전환
- Supabase 연결 준비(코드 준비 완료·외부 확인 대기)
  - 회원 닉네임 저장·변경(`lib/member/profile.ts`, 로그인 화면), 닉네임이 있어야 댓글 작성
  - 정적 페이지 상단 회원 버튼의 실제 로그인 닉네임 표시(`/api/member/status`, 로그인 쿠키가 있을 때만 확인, 이메일 미반환)
  - 연결 설정 점검 명령 `pnpm supabase:check`(비밀 키 노출·주소 경로·빈 값 검사, 값 미표시)
  - 브라우저 코드가 `NEXT_PUBLIC_` 값을 읽지 못해 실제 모드 회원·관리자 로그인이 실패하던 문제 수정(`lib/supabase/config.ts` 직접 참조)
  - 이메일 회원가입(`/signup`)·비밀번호 찾기(`/login/forgot`)·재설정(`/login/reset`), 가입 필수 동의(만 14세 이상·이용약관·개인정보) 시각 기록
  - 간편 로그인: 카카오·Google·Apple·Discord·X·Facebook 가운데 Supabase에서 켠 서비스만 자동 표시, 첫 로그인 때 닉네임·필수 동의 저장(서비스가 넘긴 실명은 공개하지 않음)
  - 관리자 댓글·신고 관리(`/admin/comments`): 신고 대기·숨긴 댓글·최근 댓글 목록, 숨김·다시 공개·신고 기각·삭제와 처리 기록, 데모는 `/admin/demo?form=comments`
  - 네 번째 마이그레이션(`202610010001_member_signup_moderation.sql`): 동의 시각 열, 공개 프로필 열 제한, 댓글 공개 상태·신고 처리 상태는 관리자만 변경
  - 가짜 Supabase 서버로 로그인부터 로그아웃, 회원가입·간편 로그인·비밀번호 재설정·관리자 댓글 처리까지 브라우저 흐름 확인. 실제 Supabase 동작은 연결 후 README 순서로 재확인 필요
- 성인 확인과 보호 경로, 비밀 키 누락 시 입력 비활성 안내
- 개인정보 동의와 GA4 준비 구조
- 모든 공개 페이지 검색 설명과 공유 미리보기(Open Graph) 태그
- 반응형 모바일·태블릿·PC 화면
- 키보드 조작, 초점 이동과 입력 오류 안내
- 라이트·다크 모드와 공통 디자인 토큰
  - 라이트 모드 경계선 대비 강화(`--pl-border: #A8B8CA`, `--pl-border-strong: #7A8EA6`)
  - 메인 뉴스·소개·현황판·보관함·개인정보 패널, 커뮤니티 카드의 라이트 모드 적용
  - 게임 소개 페이지(공통 28개와 B·C·D·H·L·η) 경계선을 카드 배경 대비 약 2.1:1로 밝힘
- 휴대폰 커뮤니티 해시태그 복사 버튼: 보이는 높이(26px)는 유지하고 누르는 영역만 44px로 확대
- 메인 커뮤니티 카드: 휴대폰 2열·540px 이상 3열·1024px 이상 6열로 줄 폭을 나눠 쓰고, 설명은 항목별 한 줄로 표시(한글 단어 중간 줄바꿈 방지)
- 영어 화면(AI 번역): 공개 정적 페이지 45개와 Next 화면(로그인·회원가입·비밀번호 재설정·내 정보·뉴스 상세·성인 확인·오류)을 헤더 `EN`/`KO`·서랍 `English`/`한국어` 버튼으로 전환, `?lang=en` 공유 주소 지원
  - Next 화면은 하이드레이션 뒤 번역(`app/page-translator.tsx`), 관리자 화면은 한국어 유지
  - 영어 화면에서 게임 검색은 영어 이름으로도 찾음, 서버가 그린 한국어 날짜도 영어로 변환
  - 같은 주소에서 사전(`public/i18n/en/`)으로 글자만 바꾸므로 성인 확인·관심 목록 등 기존 동작 유지
  - 관리자·회원이 쓴 뉴스·상품·댓글은 한국어 원문 유지, 실제 SNS 해시태그는 번역 제외
- 내 정보 페이지(`/account`): 닉네임 변경, 내 댓글 확인·삭제, 회원 탈퇴(확인어 `탈퇴` 또는 `DELETE`, 다섯 번째 마이그레이션의 `delete_own_account`)
- 검색엔진 `robots.txt`·사이트맵(`SITE_URL` 또는 Vercel 운영 주소, 관리자·회원·성인 경로 제외), 서버 오류 화면(`app/error.tsx`·`app/global-error.tsx`)
- 공통 기반(로드맵 0단계): `pnpm pages:apply`·`pages:check` 페이지 적용 도구, 서버 요청 제한·JSON 도구(`lib/http/`), 정적 페이지 양식 전송 도구(`public/form-submit.mjs`), 약관·개인정보 화면의 한국어 원문 우선 안내
- 문의 양식(로드맵 1단계): 문의하기 페이지의 양식(분류·이메일·제목·내용·수집 동의), `POST /api/contact`(10분 5회 제한·검증·자동 입력 방지), 시연 모드는 저장 안 함, 관리자 문의함(`/admin/contact`, 데모는 `/admin/demo?form=contact`), 여섯 번째 마이그레이션(`202610040001_contact_messages.sql`)
- 개발 로드맵(로드맵 2단계): `/roadmap.html` — 대표·개발 중·기획·보류 묶음, 장르 필터와 주소 저장, 메인 현황판·서랍 메뉴 연결. 메인 게임 목록에서 장르 버튼에 걸리지 않던 11개 프로젝트가 '기타'에 나오도록 수정
- 개발 뉴스 검색·분류(로드맵 3단계): `/devlog.html` — 검색 칸(제목·요약·종류 이름), 조건 칩·초기화, 주소 저장(`?q=&type=`), 시연·서버 뉴스 공통 적용. 영어 화면의 한글 검색어 칩 번역 수정(사전 형식의 `keep`). 게임별 필터는 뉴스 데이터에 게임 항목이 없어 미룸
- 댓글 작성 제한(로드맵 4단계): 30초 1개·10분 5개·24시간 같은 내용 금지·링크 2개·금칙어(`lib/comments/guard.ts`, `banned-words.ts`). 시연·Supabase 댓글 공통 적용, 이유와 남은 시간 안내, 관리자 화면 "자동 감지" 표시, 일곱 번째 마이그레이션(`202610040002_comment_limits.sql`, 실행은 연결 때). 주소(IP)별 제한은 구조상 없음
- 테스트·타입·ESLint·운영 빌드 통합 검사

`로컬 완료`는 외부 서비스까지 운영 완료되었다는 의미가 아닙니다.

---
## 최근 커밋 기록

| 커밋 | 내용 |
| --- | --- |
| `536805e` | 로드맵 3단계: 개발 뉴스 검색과 조건 표시 추가 |
| `11235a7` | 로드맵 2단계: 개발 로드맵 페이지 추가 |
| `998ab7f` | 로드맵 1단계: 문의 양식과 관리자 문의함 추가 |
| `f5b66cc` | 로드맵 0단계: 공통 기반 도구 추가와 남은 정리 |
| `d043f4e` | 내 정보 페이지·검색엔진 파일·오류 화면 추가와 Next 화면 영어 번역 |
| `2f38bfa` | 공개 페이지 영어 화면(AI 번역) 추가 |
| `0bdfb86` | 메인 커뮤니티 카드 글자 찌그러짐 수정 |
| `bdbc405` | 회원가입·간편 로그인·비밀번호 재설정과 관리자 댓글·신고 관리 추가 |
| `bed8807` | Supabase 연결 전 회원 닉네임·댓글 실제 저장 코드 준비 |
| `f747998` | 관리자 공통 헤더 적용과 게임 소개 경계선·해시태그 터치 영역 개선 |
| `ec3217e` | 남은 대화상자·예전 메뉴 코드 2차 정리 |
| `a170c13` | 사용되지 않는 파일·대화상자·예전 헤더 코드 정리 |
| `502b5c3` | 개발 뉴스·굿즈 상단 글자 배치 수정 |
| `b97923c` | 해시태그 복사 버튼 크기를 해시태그 글자에 맞춤 |
| `02edb23` | 커뮤니티 페이지 소개·해시태그·플랫폼 배치 변경 |
| `36a9753` | 라이트 모드 외곽선 대비 강화 |
| `0387d6a` | 라이트 모드 메인 카드 디자인 수정과 관리자·인증·공유 정보 보완 |
| `3575617` | 게임 목록 검색·필터에 조건 요약·초기화·주소 저장 추가 |
| `b95fa41` | 전체 페이지 헤더를 메인과 통일하고 문의하기 FAQ 페이지와 전체 화면 로그인 추가 |
| `acd6b1a` | 관리자 뉴스·상품 폼을 저장 없이 점검하는 데모 모드 추가 |
| `7aad481` | 회원 로그아웃 기능 추가와 전체 페이지 로그인 상태 표시 |
| `baa2aca` | 개인정보 페이지에 브라우저 저장 데이터 관리 기능 추가 |
| `42d3c3c` | 깨진 링크·이미지와 관리자 삭제 오류 수정, 404 페이지 추가 |
| `094a846` | 프로젝트 H 동료 캐러셀과 시스템 탭 오류 수정 |

`b95fa41` 커밋 본문의 "FAQ 15개"는 실제로 14개입니다. 수정하려면 강제 푸시가 필요해 그대로 두었습니다.

---
## 구조상 꼭 알아야 할 부분

- 공개 화면은 대부분 `public/`의 정적 HTML이며, Next.js 앱 라우터(`app/`)는 로그인·회원가입·비밀번호 재설정·뉴스 상세·성인 확인·관리자·404를 담당합니다.
- 간편 로그인 지원 목록은 `lib/member/auth-providers.ts`입니다. 화면은 Supabase `/auth/v1/settings`에서 켜진 서비스만 표시하므로 서비스를 켜고 끌 때 코드를 고치지 않습니다. 목록에 없는 서비스(GitHub·Twitch·네이버 등)는 Supabase에서 켜도 표시하지 않습니다.
- 공통 헤더 원본은 `scripts/site-header.mjs`입니다. 메뉴나 헤더 마크업을 바꾸면 `node scripts/apply-site-header.mjs`로 정적 페이지 전체(`<!-- site-header:start -->`~`end` 구간)에 다시 적용합니다. Next 화면은 `app/site-header.tsx`가 같은 구조를 그립니다. 테스트가 두 결과의 일치를 확인합니다.
- 헤더 스타일은 `public/site-header.css`입니다. 배치 규칙은 `[data-site-header]`, 색상 규칙은 `nav.navbar[data-site-header]` 선택자를 사용하며 `responsive-shell.css`보다 먼저 불러와야 합니다.
- 검색 설명·공유 태그는 `node scripts/apply-page-meta.mjs`로 일괄 적용합니다. 공통 프로젝트 페이지 28개는 `public/game-projects.mjs` 데이터로 `scripts/generate-project-pages.mjs`가 생성하므로 직접 수정하지 않고 데이터·생성기를 수정합니다.
- 반응형 메뉴·서랍·테마 버튼은 `public/responsive-nav.mjs`가 만들며 기준 폭은 767·959·1279px입니다.
- 테마 토큰은 `public/playful-lab-theme.css`의 `--pl-*` 값이며, 라이트·다크 전환은 `body`와 `html`의 `data-color-mode` 속성으로 합니다. 저장 키는 `devforge-color-mode`입니다.
- 프로젝트 상세 페이지(공통 28개와 B·C·D·H·L·η 전용)는 라이트·다크 설정과 관계없이 게임별 어두운 디자인을 유지합니다.
- 테스트는 대부분 소스 파일 계약 검사입니다. 화면 배치나 색을 바꾸면 관련 테스트(`tests/site-polish.test.mjs`, `tests/playful-lab-theme.test.mjs`, `tests/responsive-integration.test.mjs` 등)도 함께 갱신합니다.

---
## 사용자 결정이 필요한 항목

아래 항목은 내용·정책 결정이 필요해 진행하지 않았습니다. 사용자 확인 후 진행합니다.

- 프로젝트 δ·θ 연령 등급
- 오해 소지가 있는 표현: 커뮤니티 참여 문구, 굿즈 배지·할인 표시, 임의 수치, 스마트스토어 링크, 데모 게임 이름과 2025년 날짜
- 공통 프로젝트 페이지 28개의 실제 소개 내용
- 프로젝트 D 이미지와 개발 문구
- 프로젝트 C "Steam 2026 Q3", 프로젝트 L "CV: 미정" 표기
- 이용약관·개인정보처리방침 본문 확정
- 문의 양식으로 받은 이메일·문의 내용의 보관 기간(개인정보처리방침에 "운영 전에 확정"으로 표기)
- 관리자 메뉴의 `DEVFORGE` 글자가 공통 헤더 로고와 겹쳐 보이므로 관리자 메뉴 쪽 표기를 바꿀지 여부

---
## 정리 후보

2026년 10월 1일 1차 정리를 완료했습니다. 재발 방지 검사는 `tests/unused-assets.test.mjs`입니다.

- 공통 프로젝트 폴더 23곳의 연결되지 않은 `ProjectX_Script.js`·`ProjectX_Style.css` 46개(약 2.0MB)와 `public/style.css`·`public/script.js` 삭제
- `main.html`의 열 수 없던 게임 상세·이용약관·개인정보 대화상자와 관련 스타일·`openGameModal` 함수 삭제
- `main.html`·`devlog.css`·`project-page.css`의 예전 헤더 규칙 삭제. 브라우저 계산 스타일 비교로 화면 영향이 없음을 확인했고, 실제로 적용되던 메인 헤더 스크롤 배경 전환(`transition: all 0.3s ease`)만 유지
- 프로젝트 B·L의 예전 메뉴 스크립트(`connectMenu`)와 스타일(`.top-header`·`.top-nav`·`.menu-toggle`) 삭제

같은 날 2차 정리를 완료했습니다. 8개 페이지를 PC·태블릿·모바일·가로 휴대폰 4가지 크기로 정리 전후 계산 스타일을 비교해 32개 화면 모두 차이가 없음을 확인했습니다.

- `public/dialog-accessibility.mjs`는 재사용을 위해 보관하고, 대화상자가 없는 메인·뉴스·굿즈·커뮤니티 페이지의 연결만 제거. 배경 스크롤 잠금 규칙(`body.dialog-open`)은 유지
- `responsive-shell.css`·`playful-lab-theme.css`·`devlog.css`의 미사용 대화상자 스타일(`.modal-box`·`.modal-overlay`·`.contact-dialog`·`.dialog-close`·`.dialog-link`) 삭제
- `responsive-nav.mjs`·`responsive-shell.css`의 예전 프로젝트 메뉴 지원(`.project-nav-actions`·`.project-nav-links`·`.nav-cta`·`.eta-brand`) 삭제
- `ProjectEta_Style.css`의 예전 에타 전용 헤더 스타일(`.eta-nav`·`.eta-brand`·`.eta-nav-links`·`.nav-cta`) 삭제

2026년 10월 3일 3차 정리를 완료했습니다.

- `public/project-detail.css`: "적용되지 않음"이라는 이전 기록은 틀렸습니다. 클래스 규칙은 쓰이지 않지만 `*`·`body`·`a`·`h1` 기본 규칙이 프로젝트 η 페이지에 실제로 적용됩니다. 파일은 유지하고 쓰이지 않는 클래스 규칙만 지웠으며, 1280px·375px에서 772개 요소의 계산 스타일이 원본과 같음을 확인했습니다.

현재 남은 후보는 없습니다. 새 후보는 삭제 전 참조 여부와 계산 스타일, 관련 테스트를 확인합니다.

---
## 외부 확인 대기 항목

- Supabase 프로젝트·관리자 계정·환경 변수(서비스별 비용·제약은 `docs/EXTERNAL-SERVICES.md`)
- 성인 콘텐츠 공개 전 휴대폰·카드 본인인증 연결(현재 생년월일 자기 입력은 청소년보호법 요건 미충족)
- 간편 로그인 서비스별 OAuth 앱 등록과 공개 전 로그인 버튼 디자인 지침 확인
- Supabase 이메일 템플릿의 `/auth/confirm` 링크 설정(README 4단계)
- 뉴스·상품·댓글의 실제 데이터 저장과 이미지 업로드
- YouTube Data API 키와 실제 할당량
- 실제 판매처·재고·결제 연동
- 공식 SNS·문의·ChatBot 배포 주소
- GA4 측정 ID
- 이용약관·개인정보처리방침·회원가입 필수 동의 문구 법률 검토
- 영어 번역문 원어민·전문가 검수(현재 AI 번역)
- 공식 도메인과 운영 배포

비밀 값은 Git에 기록하지 않습니다. `.env.example`을 기준으로 새 컴퓨터의 `.env.local`에 직접 설정합니다. Supabase `service_role` 키를 브라우저 공개 환경 변수에 넣지 않습니다. 성인 확인은 운영 환경에서 `AGE_GATE_SECRET`이 없으면 입력이 닫히고, 개발 환경에서는 개발용 비밀 값으로 동작합니다.

---
## 작업 원칙

- 모든 답변은 한국어로 작성
- 불확실한 외부 상태를 추측하지 않기
- 데모 기능을 실제 운영 기능으로 표시하지 않기
- 기존 사용자 변경과 공개 디자인 보존
- 새 기능 전 관련 문서와 테스트 확인
- 화면 변경은 라이트·다크 모드와 모바일·태블릿·데스크톱에서 브라우저 확인
- 작업 완료 전 `pnpm check` 전체 실행
- 한 작업 단위는 하나의 커밋으로 통합
- 커밋 제목은 접두어 없는 한국어 한 줄, 본문은 `~추가`/`~변경`/`~수정` 목록
- 커밋·PR에 Claude 공동 작성자(Co-Authored-By) 줄을 넣지 않기
- 공개 페이지 한국어 문구를 바꾸면 `public/i18n/en/` 영어 사전도 고치고 `pnpm i18n:check`로 누락 확인
- 사용자가 정책을 바꾸지 않는 한 `main`에서 계속 작업
- 푸시 전 원격 `main` 변경 여부 확인, 강제 푸시는 사용자 명시 승인 후에만 사용

---
## 우선 확인 문서

1. `README.md`: 실행과 외부 서비스 설정
2. `docs/ROADMAP.md`: 단계별 개발 방향과 현재 단계(각 단계는 개발 계획 → 개발 → 다음 단계 계획 순서)
2. `TRANSFER-GUIDE.md`: 다른 컴퓨터 이관 절차
3. `docs/DEVELOPMENT-GUIDE.md`: 구조·기능·데이터·보안·배포
4. `docs/DEVELOPMENT-NOTES.md`: 로컬·외부·유료 작업 구분과 진행 상태
5. `docs/FILE-MAP.md`: 주요 파일 위치
6. `docs/superpowers/specs/`: 승인된 설계 기록
7. `docs/superpowers/plans/`: 구현 계획 기록

---
## 완료 보고 기준

- 변경한 파일과 사용자 화면 영향
- 실행한 테스트와 결과
- 타입 검사·ESLint·빌드 결과
- 브라우저 데스크톱·모바일 확인 결과
- 남은 외부 설정과 확인되지 않은 항목
- 커밋 해시와 원격 반영 여부
