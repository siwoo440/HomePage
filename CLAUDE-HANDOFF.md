---
# Claude 작업 인수인계

이 문서는 다른 컴퓨터에서 Claude가 DEVFORGE 홈페이지 개발을 바로 이어가기 위한 전달 문서입니다. 작업 기준은 이 파일이 포함된 `origin/main` 최신 커밋입니다.

---
## Claude에게 전달할 시작 문구

> GitHub의 `siwoo440/HomePage` 저장소에서 `main` 최신 커밋을 복제하고 DEVFORGE 홈페이지 개발을 이어서 진행해주세요. 먼저 `CLAUDE-HANDOFF.md`, `README.md`, `TRANSFER-GUIDE.md`, `docs/DEVELOPMENT-GUIDE.md`, `docs/DEVELOPMENT-NOTES.md`, `.env.example`을 읽어주세요. Node.js `22.13` 이상과 pnpm `11.19.0` 환경에서 `pnpm install --frozen-lockfile`과 `pnpm check`를 실행해 현재 상태를 확인한 뒤 `pnpm dev`로 `http://localhost:3000/main.html`을 열어주세요. 홈페이지 저장소만 작업 대상으로 사용하고 ChatBot과 Text-Play 소스는 별도 저장소로 유지해주세요. 기존 디자인과 동작을 보존하고, 외부 계정·API·비용·운영 상태는 추측하지 말고 확인이 필요한 항목으로 분리해주세요. 사용자에게 전체 설계를 먼저 설명하고 한 번 승인받은 범위에서는 반복 승인을 요구하지 마세요. 코드는 Allman 스타일을 지키고 각 코드 줄에 짧은 한글 명사형 주석을 작성해주세요. 한 작업 단위의 변경은 전체 검증 후 하나의 커밋으로 모아 `main`에 반영해주세요.

---
## 새 컴퓨터에서 첫 확인

1. `git clone https://github.com/siwoo440/HomePage.git`으로 저장소 복제
2. `cd HomePage`로 프로젝트 폴더 이동
3. `pnpm install --frozen-lockfile`로 잠금 파일 기준 설치
4. `pnpm check`로 테스트·타입·린트·빌드 검사
5. `pnpm dev`로 개발 서버 실행
6. `http://localhost:3000/main.html`에서 공개 홈페이지 확인
7. 작업 전 `git status --short --branch`로 기존 변경 확인

2026년 9월 30일 새 Windows 폴더에서 원격 저장소를 다시 복제하고 빈 pnpm 저장소로 603개 패키지를 설치했습니다. 테스트 303개, TypeScript, ESLint, Next.js 운영 빌드와 `/main.html`, `/login`, `/api/news` 응답을 확인했습니다. macOS와 Linux 실행은 별도 확인이 필요합니다.

---
## 저장소 범위

- 포함: DEVFORGE 홈페이지, 35개 프로젝트 소개, 뉴스, 상품, 커뮤니티, 로그인·관리자 화면, API와 Supabase 연결 구조
- 포함: 홈페이지 안의 ChatBot 홍보 화면과 외부 이동 링크
- 제외: ChatBot 본체 소스와 전용 테스트
- 제외: Text-Play 소스·기획·디자인 자료
- 현재 ChatBot 임시 주소: `http://localhost:3001/`

ChatBot과 Text-Play 폴더를 홈페이지 저장소에 복사하지 않습니다. 운영 주소가 확정되면 공개 링크만 교체합니다.

---
## 현재 로컬 완료 범위

- 대표 프로젝트 6개 강조와 전체 35개 검색·필터
- 프로젝트 상세 화면과 프로젝트 η 전용 콘텐츠
- 개발 뉴스와 상품 데모 화면
- 커뮤니티 플랫폼 영역과 YouTube 데모 대체
- 회원·관리자 로그인 화면과 Supabase 준비 구조
- 회원 로그아웃과 모든 공개 페이지 상단·서랍 메뉴의 로그인 상태 표시
- 개인정보처리방침의 브라우저 저장 데이터 확인·삭제
- 댓글·답글·반응·신고의 로컬 서비스
- 성인 확인과 보호 경로
- 개인정보 동의와 GA4 준비 구조
- 반응형 모바일·태블릿·PC 화면
- 키보드 조작, 초점 이동과 입력 오류 안내
- 라이트·다크 모드와 공통 디자인 토큰
- 히어로 배경과 작은 원형 캐러셀 이동 버튼
- 테스트·타입·ESLint·운영 빌드 통합 검사

`로컬 완료`는 외부 서비스까지 운영 완료되었다는 의미가 아닙니다.

---
## 외부 확인 대기 항목

- Supabase 프로젝트·관리자 계정·환경 변수
- 뉴스·상품·댓글의 실제 데이터 저장과 이미지 업로드
- YouTube Data API 키와 실제 할당량
- 실제 판매처·재고·결제 연동
- 공식 SNS·문의·ChatBot 배포 주소
- GA4 측정 ID
- 이용약관·개인정보처리방침 법률 검토
- 공식 도메인과 운영 배포

비밀 값은 Git에 기록하지 않습니다. `.env.example`을 기준으로 새 컴퓨터의 `.env.local`에 직접 설정합니다. Supabase `service_role` 키를 브라우저 공개 환경 변수에 넣지 않습니다.

---
## 작업 원칙

- 불확실한 외부 상태를 추측하지 않기
- 데모 기능을 실제 운영 기능으로 표시하지 않기
- 기존 사용자 변경과 공개 디자인 보존
- 새 기능 전 관련 문서와 테스트 확인
- 작업 완료 전 `pnpm check` 전체 실행
- 한 작업 단위는 하나의 커밋으로 통합
- 사용자가 정책을 바꾸지 않는 한 `main`에서 계속 작업
- 푸시 전 원격 `main` 변경 여부 확인

---
## 우선 확인 문서

1. `README.md`: 실행과 외부 서비스 설정
2. `TRANSFER-GUIDE.md`: 다른 컴퓨터 이관 절차
3. `docs/DEVELOPMENT-GUIDE.md`: 구조·기능·데이터·보안·배포
4. `docs/DEVELOPMENT-NOTES.md`: 로컬·외부·유료 작업 구분
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
