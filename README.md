---
# DEVFORGE 홈페이지

DEVFORGE 게임 개발 스튜디오 홈페이지 저장소입니다. 정적 공개 페이지와 Next.js 관리자·회원·API 화면을 함께 사용하며, Supabase 설정 없이도 데모 뉴스와 상품으로 로컬 화면을 확인할 수 있습니다.

이 저장소에는 홈페이지 소스와 ChatBot 홍보·바로가기만 포함합니다. Text-Play와 ChatBot 본체는 별도 저장소에서 관리합니다. 현재 ChatBot 이동 주소는 `http://localhost:3001/`이며, 배포 주소가 확정되면 `public/main.html`의 링크를 변경합니다.

---
## 처음 시작하는 순서

요구 버전은 Node.js `>=22.13`, pnpm `11.19.0`입니다.

```powershell
# 잠금 파일 기준 의존성 설치
pnpm install --frozen-lockfile
# 개발 서버 실행
pnpm dev
# 전체 품질 검사
pnpm check
```

브라우저에서 `http://localhost:3000/main.html`을 엽니다. 외부 계정이나 API 키 없이 메인, 프로젝트, 데모 뉴스·상품, 커뮤니티, 라이트·다크 모드와 로컬 관심 목록을 실행하고 전체 품질 검사를 완료할 수 있습니다. `ChatBot/`과 `Text-Play/`은 별도 프로젝트이므로 홈페이지 검사와 커밋에서 제외됩니다.

---
## 개발 문서

- [`docs/DEVELOPMENT-GUIDE.md`](docs/DEVELOPMENT-GUIDE.md): 구조, 기능, 데이터 흐름, 보안, 테스트와 배포 안내
- [`docs/DEVELOPMENT-NOTES.md`](docs/DEVELOPMENT-NOTES.md): 로컬·외부 API·유료 작업 분류와 우선순위
- [`docs/ROADMAP.md`](docs/ROADMAP.md): 단계별 개발 방향과 현재 진행 단계
- [`docs/FILE-MAP.md`](docs/FILE-MAP.md): 폴더와 주요 파일의 역할
- [`docs/EXTERNAL-SERVICES.md`](docs/EXTERNAL-SERVICES.md): 외부 계정·유료 서비스의 비용과 제약(2026년 10월 1일 조사)
- [`CLAUDE-HANDOFF.md`](CLAUDE-HANDOFF.md): 다른 컴퓨터에서 Claude로 이어서 작업할 때 전달할 시작 문구와 확인 기준
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

관리자 로그인, 뉴스·상품 저장, 회원 로그인·닉네임, 댓글 저장과 이미지 업로드를 실제로 사용하려면 Supabase 설정이 필요합니다. 설정이 없으면 댓글은 로컬 서비스에서 조회·작성·답글·반응·신고 흐름을 재현하며 새로고침하면 초기화됩니다. 같은 서비스 계약을 구현한 Supabase 어댑터(`lib/comments/supabase-service.ts`)가 준비되어 있어 환경 변수만 넣으면 실제 저장으로 바뀝니다.

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
# 잠금 파일 기준 의존성 설치
pnpm install --frozen-lockfile
# 개발 서버 실행
pnpm dev
# 전체 품질 검사
pnpm check
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
- 단계별 개발 로드맵(`/roadmap.html`): 대표·개발 중·기획·보류 묶음과 장르 필터
- 개발 뉴스 검색과 종류 필터(`/devlog.html`): 제목·요약 검색, 조건 칩과 초기화, 조건 주소 저장
- 댓글 작성 제한: 30초에 1개·10분에 5개, 같은 내용 반복·링크 3개 이상·금칙어 차단과 이유 안내
- 출시 알림 신청: 게임 소개 30개 페이지의 이메일 신청 양식(성인·보류 게임 제외), 수신 거부 화면. 메일 발송은 메일 서비스 연결 뒤
- 커뮤니티 화면의 현재 게임 해시태그 복사
- 판매 준비 중 상품과 결제 비활성 상태 확인
- 운영 전 검토용 이용약관과 개인정보처리방침 열람

관심 프로젝트와 최근 본 프로젝트에는 프로젝트 식별자만 저장됩니다. 이 값은 서버로 전송되지 않으며 메인 페이지의 `로컬 보관 기록 삭제` 버튼으로 지울 수 있습니다.

외부 상담은 유효한 설정 키가 있을 때만 스크립트를 불러옵니다. 현재 기본 로컬 환경에서는 상담, Supabase, YouTube, 판매처, SNS와 배포 서비스를 실제 연결하지 않습니다.

---

## 영어 화면(AI 번역)

공개 정적 페이지 45개(메인, 굿즈, 개발 뉴스, 커뮤니티, 문의하기, 약관, 개인정보, 게임 소개 35개)와 로그인·회원가입·비밀번호 재설정·내 정보·뉴스 상세·성인 확인·오류 화면은 상단의 `EN` 버튼(휴대폰은 서랍 메뉴의 `English`)으로 영어 화면을 볼 수 있습니다. 다시 `KO`(`한국어`)를 누르면 한국어로 돌아갑니다. 주소에 `?lang=en`을 붙여 영어 화면을 바로 공유할 수도 있습니다.

- 번역문은 AI 번역이며 사람 검수를 거치지 않았습니다. 약관과 개인정보처리방침은 한국어 원문을 기준으로 합니다.
- 같은 주소에서 글자만 바꾸므로 성인 확인·관심 목록·화면 모드는 그대로 동작합니다. 선택한 언어는 이 브라우저(`devforge-language`)에만 저장됩니다.
- 관리자 화면(`/admin`)과, 관리자·회원이 직접 쓴 뉴스·상품·댓글은 원문(한국어)으로 표시합니다. 시연 데이터와 날짜 표기는 영어로 바뀝니다.
- 실제 SNS 해시태그(`#DEVFORGE…`)는 번역하지 않습니다.

한국어 문구를 바꾸거나 새 페이지를 추가하면 영어 사전(`public/i18n/en/`)도 함께 고쳐야 합니다. 다음 명령이 빠진 번역을 알려 줍니다. 자동 검사(`pnpm test`)도 같은 내용을 확인합니다.

```powershell
# 영어 번역 누락 점검
pnpm i18n:check
```

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

## 무료 서비스부터 연결하는 순서

가입만으로는 비용이 들지 않는 서비스부터 연결합니다. 값을 넣을 때마다 아래 명령으로 서비스별 상태(연결됨·아직 연결 전·고칠 곳 있음)와 다음에 할 일을 확인합니다. 값 자체는 화면에 표시하지 않습니다.

```powershell
# 외부 서비스 연결 점검
pnpm services:check
```

| 순서 | 서비스 | 넣는 곳 | 안내 |
| --- | --- | --- | --- |
| 1 | Supabase(무료) | `.env.local`의 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `ADMIN_EMAIL` | 아래 1~4단계 |
| 2 | Resend(무료, 메일 발송) | `.env.local`의 `RESEND_API_KEY`, `MAIL_FROM`, `CONTACT_NOTIFY_EMAIL` | 아래 "메일 발송 연결" |
| 3 | 간편 로그인(Google·카카오·Discord) | Supabase의 Authentication → Providers | 아래 "간편 로그인 켜기" |
| 4 | YouTube Data API | `.env.local`의 `YOUTUBE_API_KEY` | Google Cloud에서 YouTube Data API v3를 켜고 API 키 발급 |
| 5 | Google Analytics 4 | `public/analytics-config.mjs`의 `GA_MEASUREMENT_ID` | 위 "개인정보 동의와 GA4 설정" |

- 값은 `.env.local`에만 넣습니다. 이 파일은 저장소에 올라가지 않습니다. 채팅·문서·커밋에 키를 적지 않습니다.
- `.env.local`을 바꾼 뒤에는 개발 서버를 다시 시작합니다.
- 가입 자체에 비용이 드는 것(도메인, Apple 로그인, 본인인증, 자체 결제)과 유료 요금제(Supabase Pro, Vercel Pro)는 이 순서에 넣지 않았습니다. 비용과 제약은 `docs/EXTERNAL-SERVICES.md`를 봅니다.

---

## 1. Supabase 프로젝트 생성

1. Supabase 대시보드에서 새 프로젝트 생성
2. 프로젝트의 **SQL Editor** 이동
3. `supabase/migrations/202609100001_admin_news.sql` 전체 실행
4. `supabase/migrations/202609110001_admin_products.sql` 전체 실행
5. `supabase/migrations/202609120001_member_comments.sql` 전체 실행(회원 닉네임·댓글·반응·신고와 댓글 이미지 버킷)
6. `supabase/migrations/202610010001_member_signup_moderation.sql` 전체 실행(가입 동의 기록, 관리자 전용 댓글 숨김·신고 처리 권한)
7. `supabase/migrations/202610010002_member_account_deletion.sql` 전체 실행(회원 본인 탈퇴 함수)
8. `supabase/migrations/202610040001_contact_messages.sql` 전체 실행(문의 양식 접수와 관리자 문의함)
9. `supabase/migrations/202610040002_comment_limits.sql` 전체 실행(댓글 작성 제한과 금칙어 표)
10. `supabase/migrations/202610040003_release_notifications.sql` 전체 실행(출시 알림 신청과 수신 거부)
11. **Authentication → Users**에서 관리자 계정 생성

여덟 파일은 반드시 위 순서대로 실행합니다. 뒤 파일이 앞 파일의 뉴스·댓글 테이블과 관리자 판정 함수를 사용합니다.

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

값을 넣은 뒤 다음 명령으로 형식을 점검합니다. 주소 끝 경로, 비어 있는 값, 공개 키 자리에 잘못 넣은 비밀 키(`sb_secret_…`·`service_role`)를 찾아 알려 주며, 값 자체는 화면에 표시하지 않습니다.

```powershell
# Supabase 연결 설정 점검
pnpm supabase:check
```

점검을 통과하면 개발 서버를 다시 시작합니다. `NEXT_PUBLIC_` 값은 개발 서버 시작 시 읽으므로 바꾼 뒤에는 항상 다시 시작해야 합니다.

---

## 4. Supabase 인증 주소 설정

Supabase의 **Authentication → URL Configuration**에서 개발 단계 주소를 등록합니다.

- Site URL: `http://localhost:3000`
- Redirect URL: `http://localhost:3000/**`
- Vercel 배포 후 추가: `https://프로젝트주소.vercel.app/**`

실제 Vercel 주소는 배포가 완료된 뒤 확인하여 입력합니다.

### 간편 로그인 켜기

**Authentication → Providers**에서 쓰려는 간편 로그인을 켜고 각 서비스 개발자 화면에서 받은 OAuth 정보를 등록합니다. 로그인·회원가입 화면은 Supabase 설정을 읽어 **켜 둔 계정만 자동으로 표시**하므로 홈페이지 코드나 환경 변수는 바꾸지 않습니다.

- 지원 순서: 카카오, Google, Apple, Discord, X, Facebook(그 밖의 서비스는 Supabase에서 켜도 표시하지 않습니다)
- 각 서비스의 콜백 주소에는 Supabase가 안내하는 `https://프로젝트-식별자.supabase.co/auth/v1/callback`을 등록합니다.
- 카카오는 이메일 동의 항목 설정이 필요할 수 있으므로 Supabase 카카오 안내를 함께 확인합니다.
- 공개 전 각 서비스의 로그인 버튼 디자인 지침(색·문구·로고)을 확인합니다. 현재 버튼은 서비스 색과 글자만 사용합니다.
- 간편 로그인으로 처음 들어온 회원은 닉네임과 필수 동의(만 14세 이상·이용약관·개인정보)를 받은 뒤 댓글을 쓸 수 있습니다. 서비스가 넘겨준 실명은 자동으로 공개하지 않습니다.

### 이메일 인증·비밀번호 재설정 메일(권장)

기본 메일 링크는 요청한 브라우저에서 열어야 로그인까지 이어집니다. 다른 기기에서 열어도 동작하게 하려면 **Authentication → Email Templates**의 링크를 다음처럼 바꿉니다.

- Confirm signup: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/main.html`
- Reset password: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/login/reset`

이메일 인증을 끄면(`Confirm email` 해제) 가입 즉시 로그인되고 입력한 닉네임으로 바로 댓글을 쓸 수 있습니다.

### 메일 발송 연결

문의가 저장되면 운영자 메일로 접수 알림을 보냅니다. 세 값이 모두 올바를 때만 보내며, 하나라도 비어 있으면 메일 없이 문의함에만 저장합니다.

```dotenv
# Resend 메일 발송 키(서버 전용)
RESEND_API_KEY=Resend-API-키
# 보내는 주소
MAIL_FROM=DEVFORGE <noreply@내-도메인>
# 문의 접수 알림을 받을 운영자 이메일
CONTACT_NOTIFY_EMAIL=운영자-이메일
```

1. Resend에 가입하고 **API Keys**에서 키를 만들어 `RESEND_API_KEY`에 넣습니다. 이 키는 서버 전용이므로 `NEXT_PUBLIC_`으로 시작하는 항목에 넣지 않습니다.
2. 도메인이 아직 없으면 `MAIL_FROM=onboarding@resend.dev`로 시험합니다. 이때는 Resend에 가입한 본인 이메일로만 보낼 수 있으므로 `CONTACT_NOTIFY_EMAIL`도 그 이메일로 넣습니다(가입 화면의 안내를 다시 확인).
3. 도메인을 마련한 뒤에는 Resend의 **Domains**에서 도메인을 인증하고 `MAIL_FROM`을 그 도메인 주소로 바꿉니다.
4. `pnpm services:check`로 형식을 확인하고 개발 서버를 다시 시작합니다.

- 알림 메일의 답장 주소는 문의한 사람의 이메일이므로, 받은 메일에 답장하면 바로 답변이 됩니다.
- 알림 발송이 실패해도 문의는 이미 저장되어 있으며 접수 안내는 그대로 나갑니다. 서버 기록에는 실패 종류만 남기고 문의 내용은 남기지 않습니다.
- 가입 인증·비밀번호 재설정 메일은 Supabase가 보냅니다. Supabase 기본 메일은 시간당 2통이라 운영에는 Supabase의 **Authentication → SMTP Settings**에 Resend를 연결해야 하고, 이때는 인증한 도메인이 필요합니다.
- 출시 알림 확인 메일은 아래 "출시 알림 확인 메일 연결"을 마쳐야 나갑니다. 출시 소식 자체를 보내는 기능은 아직 없습니다.

### 출시 알림 확인 메일 연결

출시 알림을 신청한 사람에게 "본인이 신청한 것이 맞는지" 확인하는 메일을 보냅니다. 남의 이메일로 신청하는 장난을 막기 위한 것으로, 확인을 마친 주소(관리자 화면의 "확인 완료")에만 출시 소식을 보냅니다. 아래 두 가지가 모두 있어야 켜지며, 없으면 지금처럼 신청만 받아 둡니다.

1. **인증한 도메인의 보내는 주소**: `MAIL_FROM`이 `onboarding@resend.dev`이면 본인에게만 보낼 수 있어 방문자에게는 보내지 않습니다. 도메인을 마련해 Resend에서 인증한 뒤 `MAIL_FROM`을 바꿉니다.
2. **Supabase 서버 전용 비밀 키**: **Project Settings → API Keys**의 Secret key(`sb_secret_…`)를 `.env.local`의 `SUPABASE_SECRET_KEY`에 넣습니다.

```dotenv
# Supabase 서버 전용 비밀 키(확인 메일에만 사용)
SUPABASE_SECRET_KEY=Supabase-비밀-키
```

- 이 키는 데이터베이스의 모든 권한을 가집니다. `NEXT_PUBLIC_`으로 시작하는 항목, 채팅, 문서, 커밋에 절대 넣지 않습니다. 노출되면 Supabase에서 즉시 새로 발급합니다.
- 홈페이지는 이 키를 확인 메일 처리(`lib/notify/confirmation.ts`) 한 곳에서만 쓰며, 브라우저로 보내는 코드에서는 불러오지 않습니다(자동 검사로 확인).
- 같은 신청에는 24시간에 한 번, 같은 이메일로는 하루 3통까지만 확인 메일을 보냅니다. 발송이 실패하면 다시 신청할 때 재발송합니다.
- 확인 주소는 `/notify/confirm?token=…`, 수신 거부 주소는 `/notify/unsubscribe?token=…`이며 둘 다 화면의 버튼을 눌러야 처리됩니다.
- 신청 완료 안내는 이미 신청한 주소인지와 상관없이 같은 문구로 나갑니다(다른 사람의 신청 여부를 알 수 없게 함).
- `pnpm services:check`의 "출시 알림 확인 메일" 줄에서 무엇이 아직 필요한지 볼 수 있습니다.

---

## 5. Vercel 환경 변수 설정

Vercel 프로젝트의 **Settings → Environment Variables**에 다음 항목을 등록합니다.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `ADMIN_EMAIL`
- `RESEND_API_KEY`, `MAIL_FROM`, `CONTACT_NOTIFY_EMAIL`(선택): 문의 접수 알림 메일
- `SUPABASE_SECRET_KEY`(선택, 서버 전용): 출시 알림 확인 메일. `NEXT_PUBLIC_` 접두어를 붙이지 않습니다.
- `SITE_URL`(선택): 공식 도메인을 쓰면 `https://도메인`을 넣습니다. 비우면 Vercel 운영 주소로 `robots.txt`와 사이트맵을 만듭니다.

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
### 회원과 댓글 확인

1. `/signup`에서 이메일·비밀번호(영문·숫자 8자 이상)·닉네임과 필수 동의로 가입하고, 인증 메일 링크를 눌러 완료
2. 또는 `/login`에서 켜 둔 간편 로그인으로 가입·로그인한 뒤 닉네임과 필수 동의를 저장
3. 공개 뉴스 상세 화면에서 댓글·답글·이미지 첨부·반응·신고 확인
4. 공개 페이지 상단 회원 버튼에 닉네임이 표시되는지 확인
5. `/login/forgot`에서 비밀번호 재설정 메일을 받고 링크로 들어온 `/login/reset`에서 새 비밀번호 저장
6. `/account`(로그인 화면의 "내 정보 관리")에서 닉네임 변경, 내 댓글 확인·삭제, 회원 탈퇴 확인. 탈퇴는 확인 칸에 `탈퇴` 또는 `DELETE`를 입력해야 실행되며 프로필·댓글·반응·신고 기록과 첨부 이미지를 바로 지웁니다. 관리자 계정은 이 화면에서 탈퇴할 수 없습니다.

이메일 가입 회원은 가입 때 입력한 닉네임과 동의 시각으로 첫 로그인 때 프로필이 자동으로 만들어집니다. 동의 시각은 공개 프로필 조회에서 보이지 않습니다. 댓글 이미지는 회원별 폴더(`comment-images/회원-ID/`)에 저장되며 JPG·PNG·WebP·GIF 5MB 이하만 허용됩니다. 같은 회원은 같은 댓글을 한 번만 신고할 수 있습니다. 시연 뉴스(`/news/demo-…`)는 연결 후에도 시연 댓글을 사용합니다.

---
### 문의 양식과 문의함

1. `/contact.html`의 **문의 남기기** 양식으로 분류·이메일·제목·내용을 보내고 수집 동의를 선택
2. Supabase 설정이 없으면 "시연 모드"로 검증만 하고 저장하지 않습니다. 설정이 있으면 `contact_messages`에 저장합니다.
3. `/admin/contact`에서 **답변 대기·답변 완료·전체** 목록을 보고, 이메일로 답변한 뒤 처리 메모를 남기고 **답변 완료로 표시**
4. 잘못 처리했으면 **답변 대기로 되돌리기**

같은 요청자는 10분에 5번까지만 보낼 수 있습니다(서버 인스턴스별 대략적인 제한). 메일 발송을 연결하면(위 "메일 발송 연결") 문의가 저장될 때 운영자 메일로 접수 알림이 가고, 그 메일에 답장하면 문의한 사람에게 답변됩니다. Supabase 없이 문의함 화면을 보려면 `/admin/demo?form=contact`를 엽니다.

---
### 댓글·신고 관리

1. `/admin/comments`에서 **신고 대기·숨긴 댓글·최근 댓글** 목록 확인
2. 신고 사유 요약과 신고 기록, 원래 뉴스 링크를 보고 처리 메모(선택) 입력
3. 처리 선택: **댓글 숨기기**(대기 신고 처리 완료) · **다시 공개** · **신고 기각** · **삭제**(첨부 이미지도 삭제, 되돌릴 수 없음)
4. 모든 처리는 관리자 ID·처리 종류·메모와 함께 처리 기록(`moderation_actions`)에 남습니다.

숨김·삭제는 관리자만 할 수 있으며 작성자가 숨겨진 자기 댓글을 다시 공개할 수도 없습니다. Supabase 없이 화면을 확인하려면 개발 서버에서 `/admin/demo?form=comments`를 엽니다. 데모 처리 결과는 저장되지 않습니다.

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
- `service_role`·Secret 키를 `NEXT_PUBLIC_` 환경 변수로 등록하지 않기. 서버 전용 항목 `SUPABASE_SECRET_KEY`에만 넣고 `pnpm services:check`로 확인
- 관리자 계정에 길고 고유한 비밀번호 사용
- 관리자 권한을 `raw_user_meta_data`에 저장하지 않기
- Supabase RLS 정책을 끄지 않기
- 운영 전 일반 계정으로 작성·수정·삭제가 차단되는지 확인
- 운영 전 초안이 공개 API에서 보이지 않는지 확인
- Supabase에서 다중 인증을 사용할 수 있는 시점에 관리자 계정에 적용

---

## 자동 검사

공식 완료 검사는 다음 통합 명령입니다.

```powershell
# 테스트·타입·린트·빌드 통합 검사
pnpm check
```

Supabase 프로젝트와 외부 API 키가 없는 상태에서도 로컬 코드와 운영 빌드를 검사할 수 있습니다. 로그인, 데이터 저장, 이미지 업로드, RLS의 실제 동작은 Supabase 설정 후 별도로 확인해야 합니다.

문제 원인을 나누어 확인할 때만 다음 하위 명령을 사용합니다.

```powershell
# 자동 테스트만 실행
pnpm test
# TypeScript 검사만 실행
pnpm typecheck
# ESLint 검사만 실행
pnpm lint
# 운영 빌드만 실행
pnpm build
```

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
# 테스트·타입·린트·빌드 통합 검사
pnpm check
```
