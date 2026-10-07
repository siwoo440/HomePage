---
# Palettra Games 사이트 작업 인수인계

이 저장소는 2026-09-30 기준 `main` 최신 소스입니다. 설치 패키지·빌드 캐시·비밀 환경 변수는 포함하지 않았습니다. Claude에서 이어서 작업할 때는 `CLAUDE-HANDOFF.md`를 먼저 확인합니다.

---
## 새 컴퓨터에서 실행

1. Node.js `>=22.13`과 Git 설치
2. 저장소 복제

```powershell
git clone https://github.com/siwoo440/HomePage.git
cd HomePage
```

3. pnpm `11.19.0` 설치
4. 프로젝트 폴더에서 아래 명령 실행

```powershell
# 잠금 파일 기준 의존성 설치
pnpm install --frozen-lockfile
# 개발 서버 실행
pnpm dev
# 테스트·타입·린트·빌드 통합 검사
pnpm check
```

5. 브라우저에서 `http://localhost:3000/main.html` 접속

외부 계정이나 API 키 없이도 자동 검사를 실행할 수 있습니다. `ChatBot/`과 `Text-Play/`은 별도 프로젝트이므로 홈페이지 검사와 커밋에서 제외됩니다. 문제를 분리할 때만 아래 하위 명령을 실행합니다.

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

---
## 현재 구현 상태

- 메인 페이지와 35개 게임 프로젝트 카드
- 각 게임의 상세 페이지 연결
- 프로젝트 η 소개 페이지, 첫 진입 편지 연출, 81종 기물 합성 도감
- 개발 뉴스 전용 페이지와 태그 필터
- 굿즈 전용 페이지와 상품 상태 표시
- 6개 SNS·커뮤니티 영역과 게임별 커뮤니티 선택
- YouTube 영상 카드용 API 구조와 시연 데이터
- 관리자 뉴스·상품 등록 화면과 Supabase 연동 코드
- 회원 로그인·댓글·답글·반응·신고 기능의 데이터 구조
- 청소년 이용불가 게임의 모자이크와 성인 확인 구조
- 반응형 데스크톱·모바일 스타일
- 공개 프로젝트 상태 자동 집계와 스튜디오 소개·FAQ
- 브라우저 로컬 저장소 기반 관심 프로젝트·최근 본 프로젝트 보관함
- 커뮤니티 게임 해시태그 복사와 굿즈 결제 비활성 안내
- 운영 전 검토용 독립 이용약관·개인정보처리방침 페이지
- 본문 바로가기, 키보드 초점, 44px 핵심 터치 영역

프로젝트 η 초대장 연출은 같은 브라우저 세션에서 한 번만 표시됩니다. 강제 재생 주소는 `http://localhost:3000/project_eta/ProjectEta_Main.html?intro=1`입니다.

방문자 기능은 `http://localhost:3000/main.html`에서 확인합니다. 관심 프로젝트와 최근 본 프로젝트는 현재 브라우저에만 저장되며 `로컬 보관 기록 삭제` 버튼으로 함께 삭제됩니다. 법률 초안은 `/terms.html`과 `/privacy.html`에서 확인합니다.

---
## 외부 서비스 연결 전 상태

다음 기능은 코드 틀만 있으며 실제 서비스 설정이 없어 완전하게 동작하지 않습니다.

- Supabase 관리자·회원 로그인
- 뉴스·상품·댓글의 실제 데이터 저장
- 이미지 저장소 업로드
- YouTube 최신 영상 불러오기
- 외부 판매처 실제 재고 동기화
- 공식 SNS·스토어·문의 주소
- 공식 도메인과 운영 배포
- 외부 상담 서비스 설정 키

유효한 상담 설정 키가 없으면 외부 상담 스크립트는 로드되지 않습니다. 공개 메인 헤더의 개발용 기기 선택기도 제거되어 있으며 기기 미리보기는 `http://localhost:3000/device-preview.html`에서만 사용합니다.

`.env.example`을 `.env.local`로 복사한 뒤 실제 값을 입력해야 합니다. 비밀번호, Supabase `service_role` 키, API 비밀 키는 코드나 전달 문서에 기록하지 않습니다.

---
## 주요 환경 변수

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 주소
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase 공개 키
- `ADMIN_EMAIL`: 관리자 이메일
- `YOUTUBE_API_KEY`: YouTube Data API 서버 키
- `AGE_GATE_SECRET`: 성인 확인 쿠키 서명 키

상세한 Supabase 설정과 보안 수칙은 `README.md`를 따릅니다.

---
## 다음 작업 우선순위

1. Supabase 프로젝트 생성과 관리자 계정 연결
2. 관리자 뉴스·상품 저장 기능 실제 검증
3. 일반 회원 로그인과 댓글 관리 기능 연결
4. YouTube API 키 연결과 요청 제한·캐시 적용
5. 실제 상품 판매처·SNS·문의 주소 교체
6. 개인정보처리방침·이용약관·운영 보안 점검
7. 공식 도메인과 운영 서버 배포

---
## 다른 작업자에게 전달할 메시지

아래 내용을 새 컴퓨터의 개발 도구나 담당자에게 그대로 전달합니다.

> GitHub의 `siwoo440/HomePage` 저장소에서 `main` 최신 커밋을 복제하고 Palettra Games 웹사이트 개발을 이어서 진행해주세요. 먼저 `CLAUDE-HANDOFF.md`, `TRANSFER-GUIDE.md`, `README.md`, `.env.example`을 읽고 Node.js `>=22.13`, pnpm `11.19.0` 환경에서 `pnpm install --frozen-lockfile`, `pnpm check`로 현재 상태를 확인해주세요. 실제 메인 화면은 `public/main.html`이며 실행 주소는 `http://localhost:3000/main.html`입니다. 기존 디자인과 기능을 유지하고, 불확실한 설정이나 외부 서비스 상태는 추측하지 말고 확인이 필요하다고 밝혀주세요. Supabase와 YouTube API 등 비밀 값은 GitHub에 없으며 로컬 검사에는 필요하지 않습니다. 실제 연동 때 새 환경에서 별도로 설정해야 합니다. `ChatBot/`과 `Text-Play/`은 홈페이지 검사와 커밋에서 제외해주세요. 코드는 Allman 스타일과 각 줄의 짧은 한글 명사형 주석 규칙을 유지해주세요. 작업 전 기존 변경 사항을 확인하고, 완료 후 통합 검사·브라우저 데스크톱 및 모바일 검증 결과를 함께 보고해주세요.

---
## 전달 패키지에서 제외한 항목

- `.git`: 기존 컴퓨터의 Git 내부 기록
- `node_modules`: 새 컴퓨터에서 다시 설치할 패키지
- `.next`: 로컬 빌드 캐시
- `.pnpm-store`: 로컬 패키지 캐시
- `.worktrees`: 분리 작업 폴더
- `tsconfig.tsbuildinfo`: TypeScript 검사 캐시
- `.env.local` 등 실제 비밀 환경 변수
- 이전 상태를 설명하는 `WORK-HANDOFF.md`
