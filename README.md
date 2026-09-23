---
# DEVFORGE 홈페이지

DEVFORGE 게임 개발 스튜디오 홈페이지 저장소입니다. 정적 공개 페이지와 Next.js 관리자·회원·API 화면을 함께 사용하며, Supabase 설정 없이도 데모 뉴스와 상품으로 로컬 화면을 확인할 수 있습니다.

이 저장소에는 홈페이지 소스와 ChatBot 홍보·바로가기만 포함합니다. Text-Play와 ChatBot 본체는 별도 저장소에서 관리합니다. 현재 ChatBot 이동 주소는 `http://localhost:3001/`이며, 배포 주소가 확정되면 `public/main.html`의 링크를 변경합니다.

---
## 처음 시작하는 순서

```powershell
# 의존성 설치
pnpm install
# 개발 서버 실행
pnpm dev
```

브라우저에서 `http://localhost:3000/main.html`을 엽니다. 외부 계정 없이 메인, 프로젝트, 데모 뉴스·상품, 커뮤니티, 라이트·다크 모드와 로컬 관심 목록을 확인할 수 있습니다.

---
## 개발 문서

- [`docs/DEVELOPMENT-GUIDE.md`](docs/DEVELOPMENT-GUIDE.md): 구조, 기능, 데이터 흐름, 보안, 테스트와 배포 안내
- [`docs/FILE-MAP.md`](docs/FILE-MAP.md): 폴더와 주요 파일의 역할
- [`TRANSFER-GUIDE.md`](TRANSFER-GUIDE.md): 기존 인수인계 정보
- [`docs/superpowers/specs/`](docs/superpowers/specs/): 승인된 기능 설계 기록
- [`docs/superpowers/plans/`](docs/superpowers/plans/): 기능별 구현 계획 기록

---
## 현재 구성

- `public/`: 메인, 게임, 상품, 개발 소식, 커뮤니티, 약관과 35개 프로젝트 페이지
- `app/`: 로그인, 관리자, 뉴스 상세, 연령 확인과 서버 API
- `lib/`: 인증, 댓글, 뉴스, 상품, 커뮤니티와 Supabase 업무 규칙
- `supabase/migrations/`: 뉴스, 상품, 회원과 댓글 데이터베이스 정의
- `tests/`: 현재 기능의 자동 회귀 검사

관리자 로그인, 뉴스·상품 저장, 회원 로그인과 대표 이미지 업로드를 실제로 사용하려면 Supabase 설정이 필요합니다. 댓글은 현재 데모 화면과 데이터베이스 정의만 있으며, 실제 저장에는 별도 Supabase CRUD 구현이 추가로 필요합니다.

---

## 개인정보 동의와 GA4 설정

사이트는 이용자가 `분석 허용`을 선택하기 전까지 Google Analytics 스크립트를 불러오지 않습니다. 선택 결과는 브라우저의 `devforge_privacy_consent_v1` 항목에 동의 여부·정책 버전·갱신 시각만 저장합니다.

운영 배포 전에 `public/analytics-config.mjs`의 공개 측정 ID 자리를 실제 GA4 웹 데이터 스트림의 `G-` 측정 ID로 변경합니다. 측정 ID가 비어 있거나 형식이 올바르지 않으면 분석 모듈은 외부 요청 없이 정지합니다.

```javascript
export const GA_MEASUREMENT_ID = "G-XXXXXXXX"; // 운영 GA4 측정 ID
```

검증 기준은 다음과 같습니다.

- 새 브라우저에서 동의 전 `googletagmanager.com` 요청 없음
- `분석 허용` 뒤 GA4 스크립트 한 번만 로드
- `선택 거부` 또는 설정 변경 뒤 새 이벤트 전송 없음
- 이메일·생년월일·닉네임·댓글 내용 분석 전송 금지
- 광고와 결제 기능은 후속 단계에서 별도 연결

---

## 로컬 실행 상세

```powershell
pnpm install
pnpm dev
```

브라우저에서 `http://localhost:3000/main.html`을 열면 메인 사이트가 표시됩니다. 관리자 로그인 화면은 `http://localhost:3000/admin/login`입니다.

---

## 계정 없이 사용할 수 있는 로컬 방문자 기능

현재 메인 페이지에서 외부 서비스 가입 없이 다음 기능을 사용할 수 있습니다.

- 공개 프로젝트 35개의 개발 상태와 대표 프로젝트 현황 확인
- 장르·개발 상태별 게임 검색과 필터
- 브라우저 로컬 저장소 기반 관심 프로젝트와 최근 본 프로젝트 목록
- 로컬 보관 기록 전체 삭제
- 스튜디오 소개, 개발 상태판, 자주 묻는 질문 확인
- 커뮤니티 화면의 현재 게임 해시태그 복사
- 판매 준비 중 상품과 결제 비활성 상태 확인
- 운영 전 검토용 이용약관과 개인정보처리방침 열람

관심 프로젝트와 최근 본 프로젝트에는 프로젝트 식별자만 저장됩니다. 이 값은 서버로 전송되지 않으며 메인 페이지의 `로컬 보관 기록 삭제` 버튼으로 지울 수 있습니다.

외부 상담은 유효한 설정 키가 있을 때만 스크립트를 불러옵니다. 현재 기본 로컬 환경에서는 상담, Supabase, YouTube, 판매처, SNS와 배포 서비스를 실제 연결하지 않습니다.

---

## 반응형 화면과 기기 미리보기

공개 페이지는 브라우저 너비에 따라 자동으로 구성을 바꿉니다. `960px` 미만에서는 공통 서랍 메뉴를 사용하고, `960px`부터 `1279px`까지는 간격을 줄인 가로 메뉴를 사용하며, `1280px` 이상에서는 기존 PC 메뉴를 유지합니다.

개발용 미리보기 주소는 `http://localhost:3000/device-preview.html`입니다.

- PC: `1440 × 900`
- 태블릿 가로: `1024 × 768`
- 모바일: `390 × 844`
- 화면 맞춤: 선택한 기기의 실제 iframe 크기를 유지한 채 외곽만 축소

`device-preview.html`은 개발 확인 도구이며 공개 사이트 헤더에는 연결하지 않습니다. 실제 반응형 결과는 미리보기의 새 창 열기 기능과 브라우저 크기 조절로 함께 확인합니다.

---

## 1. Supabase 프로젝트 생성

1. Supabase 대시보드에서 새 프로젝트 생성
2. 프로젝트의 **SQL Editor** 이동
3. `supabase/migrations/202609100001_admin_news.sql` 전체 실행
4. `supabase/migrations/202609110001_admin_products.sql` 전체 실행
5. **Authentication → Users**에서 관리자 계정 생성

관리자 이메일과 비밀번호는 저장소 파일에 기록하지 않습니다.

---

## 2. 관리자 권한 지정

Supabase SQL Editor에서 아래 명령의 이메일 예시를 실제 관리자 이메일로 교체한 뒤 한 번 실행합니다.

```sql
update auth.users -- 인증 사용자 수정
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb -- 관리자 역할 추가
where lower(email) = lower('your-email@example.com'); -- 관리자 이메일 선택
```

관리자 역할 확인 명령입니다.

```sql
select id, email, raw_app_meta_data -- 관리자 권한 확인 항목
from auth.users -- 인증 사용자 목록
where lower(email) = lower('your-email@example.com'); -- 관리자 이메일 선택
```

`raw_app_meta_data`에 `"role": "admin"`이 보여야 합니다. `raw_user_meta_data`는 사용자가 수정할 수 있으므로 관리자 권한 저장에 사용하지 않습니다.

---

## 3. 로컬 환경 변수 설정

프로젝트 최상위에 `.env.local` 파일을 만들고 다음 값을 입력합니다.

```dotenv
# Supabase 프로젝트 주소
NEXT_PUBLIC_SUPABASE_URL=https://프로젝트-식별자.supabase.co
# Supabase 공개 키
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=Supabase-공개-키
# 관리자 이메일
ADMIN_EMAIL=관리자-이메일
```

프로젝트 주소와 공개 키는 Supabase의 **Project Settings → API**에서 확인합니다. `service_role` 키는 브라우저 환경 변수나 저장소에 넣지 않습니다.

환경 변수를 저장한 뒤 개발 서버를 다시 시작합니다.

---

## 4. Supabase 인증 주소 설정

Supabase의 **Authentication → URL Configuration**에서 개발 단계 주소를 등록합니다.

- Site URL: `http://localhost:3000`
- Redirect URL: `http://localhost:3000/**`
- Vercel 배포 후 추가: `https://프로젝트주소.vercel.app/**`

실제 Vercel 주소는 배포가 완료된 뒤 확인하여 입력합니다.

---

## 5. Vercel 환경 변수 설정

Vercel 프로젝트의 **Settings → Environment Variables**에 다음 세 항목을 등록합니다.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `ADMIN_EMAIL`

Production, Preview, Development 환경 가운데 실제로 사용할 환경을 선택합니다. 관리자 비밀번호는 Vercel 환경 변수에 저장하지 않고 Supabase Auth에서만 관리합니다.

---

## 6. 관리자 사용 순서

1. `/admin/login`에서 관리자 이메일과 비밀번호 입력
2. `/admin/news`에서 작성된 글 확인
3. **새 글 작성**에서 제목, 요약, 본문, 태그, 대표 이미지, 공개 상태 입력
4. 초안은 관리자 화면에만 표시
5. 공개 상태로 저장한 글은 `/devlog.html`에 표시
6. 공개 뉴스 선택 시 `/news/게시물-ID` 상세 화면 이동

대표 이미지는 JPG, PNG, WebP 형식과 5MB 이하만 허용됩니다.

---
### 상품 관리

1. `/admin/products`에서 등록된 상품과 재고 상태 확인
2. `/admin/products/new`에서 상품 정보와 수동 재고 입력
3. 판매 주소가 없으면 공개 화면에 `판매 준비 중` 표시
4. 재고가 0개이면 `품절`, 1~5개이면 `재고 부족` 표시
5. 공개 상품은 `/goods.html`과 메인 굿즈 미리보기에 표시

`public/images/goods/`의 이미지는 개발 단계용 목업입니다. 실제 판매 전 상품 실물과 일치하는 사진으로 교체해야 합니다.

---
### 외부 판매처 재고 연결 조건

외부 자동 재고는 판매처가 결정된 뒤 공식 API로 연결합니다. 판매처 이름, 공식 API 문서, 서버용 인증 정보, 외부 상품 식별자와 호출 제한을 먼저 확인해야 합니다. 외부 판매 페이지 HTML을 직접 수집하는 방식은 사용하지 않습니다.

---

## 7. 공식 도메인 전환

공식 출시 때 다음 항목만 변경합니다.

1. Vercel 프로젝트에 커스텀 도메인 연결
2. Supabase Site URL을 `https://공식도메인`으로 변경
3. Supabase Redirect URLs에 `https://공식도메인/**` 추가
4. Vercel 기본 주소를 공식 도메인으로 이동 처리

게시물 데이터와 관리자 계정은 그대로 유지됩니다.

---

## 보안 수칙

- 관리자 비밀번호를 코드, 문서, Git에 기록하지 않기
- `service_role` 키를 `NEXT_PUBLIC_` 환경 변수로 등록하지 않기
- 관리자 계정에 길고 고유한 비밀번호 사용
- 관리자 권한을 `raw_user_meta_data`에 저장하지 않기
- Supabase RLS 정책을 끄지 않기
- 운영 전 일반 계정으로 작성·수정·삭제가 차단되는지 확인
- 운영 전 초안이 공개 API에서 보이지 않는지 확인
- Supabase에서 다중 인증을 사용할 수 있는 시점에 관리자 계정에 적용

---

## 자동 검사

```powershell
pnpm test
node node_modules/typescript/bin/tsc --noEmit --incremental false
pnpm build
```

Supabase 프로젝트가 없는 상태에서는 로컬 코드와 빌드만 검사됩니다. 로그인, 데이터 저장, 이미지 업로드, RLS의 실제 동작은 Supabase 설정 후 별도로 확인해야 합니다.

공개 방문자 기능의 집중 검사는 다음 명령으로 실행합니다.

```powershell
node --test tests/local-site-experience.test.mjs tests/responsive-integration.test.mjs
```

---

## 공개 게임 페이지와 원본 보관

`public` 폴더의 프로젝트 페이지는 방문자에게 공개할 게임 소개 정보만 제공합니다. 29개 공통 소개 페이지와 전용 디자인을 유지하는 6개 특화 페이지를 합쳐 총 35개 프로젝트 페이지를 운영합니다.

변경 전 기획 HTML은 `internal/project-archives`에 원본 형태로 보존합니다. `internal` 폴더는 웹 배포 대상이 아니지만, 공개 GitHub 저장소에서는 파일을 직접 열람할 수 있습니다. 실제 기밀 자료와 외부 공개가 금지된 문서는 비공개 저장소로 옮겨야 합니다.

공통 소개 페이지를 공개 데이터에서 다시 생성하는 명령은 다음과 같습니다.

```powershell
node scripts/generate-project-pages.mjs
```

프로젝트 제목, 장르, 개발 상태, 상세 주소, 성인 여부와 커뮤니티 해시태그는 `public/game-projects.mjs`에서 통합 관리합니다.

---

## 플레이풀 랩 공통 테마

공통 시각 토큰과 적용 규칙은 `public/playful-lab-theme.css`에서 관리합니다.

- 적용: 메인, 상품, 개발 소식, 커뮤니티, 약관, 개인정보, Next.js 회원·인증·뉴스·관리자 화면
- 제외: `public/project_*` 개별 프로젝트, `public/device-preview.html`
- 주요 색상: 흰색 바탕, 민트 미술 강조, 바이올렛 게임 강조, 오렌지 기계·운영 강조
- 반응형 기준: 모바일 `767px` 이하, 태블릿 `768px`~`1279px`, 데스크톱 `1280px` 이상

검증 명령은 다음과 같습니다.

```powershell
pnpm test # 전체 기능 검사
node node_modules/typescript/bin/tsc --noEmit --incremental false # 타입 검사
pnpm build # 운영 빌드 검사
```
