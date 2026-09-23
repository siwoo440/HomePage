# 동의 기반 GA4 분석 설계

## 목적

DEVFORGE 홈페이지의 게임·굿즈·개발 뉴스·커뮤니티 이용 흐름을 측정하되, 이용자가 분석에 동의하기 전에는 Google Analytics 스크립트와 네트워크 요청을 시작하지 않는다.

## 범위

- 1단계는 개인정보 동의 상태, GA4 공통 로더, 허용 이벤트, 핵심 페이지 연결, 자동화 테스트까지 포함한다.
- 광고 코드, AdSense 게시자 ID, 결제, 멤버십은 이번 단계에 포함하지 않는다.
- GA4 측정 ID가 비어 있는 개발 환경에서는 오류나 외부 요청 없이 정지한다.
- 현재 운영 중인 Vercel Analytics는 동의 없이 실행되지 않도록 제거한다.

## 동의 모델

- 필수 기능은 항상 활성화한다.
- 분석 저장은 `analytics` 동의를 별도로 받는다.
- 광고 저장은 이후 AdSense 단계에서 사용할 수 있도록 `ads` 항목만 미리 정의한다.
- 동의 값은 브라우저 `localStorage`의 `devforge_privacy_consent_v1`에 저장한다.
- 저장 값에는 동의 여부, 정책 버전, 갱신 시각만 포함한다.
- 동의 전에는 GA4 라이브러리를 다운로드하지 않는다.
- 동의 철회 시 이후 이벤트 전송을 즉시 중단한다.

## 파일 구조

- `public/privacy-consent.mjs`: 동의 값 검증·저장·변경 이벤트·배너 제어
- `public/privacy-consent.css`: 배너와 설정 패널의 공통 디자인
- `public/analytics-config.mjs`: 공개 가능한 GA4 측정 ID 한 곳 관리
- `public/site-analytics.mjs`: GA4 지연 로드·허용 이벤트·민감 매개변수 차단
- `tests/privacy-consent.test.mjs`: 저장 값 손상·버전 불일치·동의 변경 검증
- `tests/site-analytics.test.mjs`: 측정 ID·동의·허용 이벤트·민감 정보 차단 검증

## 분석 이벤트

허용 이벤트는 `select_game`, `view_development_news`, `view_goods`, `view_community`, `outbound_store`, `select_video`, `login_start`, `login_complete`로 제한한다. 페이지 조회는 GA4 설정 시 자동 전송하며, 중복 초기화를 막는다.

이벤트 매개변수는 `item_id`, `item_name`, `destination`, `content_type`, `source_page`만 허용한다. `email`, `password`, `token`, `birth_date`, `nickname`, `comment`, `image_name`을 포함한 민감 항목은 호출 단계에서 제거한다.

## 화면 연결

- 모든 HTML 문서는 절대 경로 `/privacy-consent.mjs`, `/site-analytics.mjs`를 사용한다.
- 공통 모듈은 현재 경로와 무관하게 동작한다.
- 핵심 링크는 `data-analytics-event`와 허용된 `data-analytics-*` 속성만 사용한다.
- Next.js 화면도 같은 공개 모듈을 불러와 정적 HTML과 동일한 동의 저장소를 사용한다.

## 접근성과 이용 경험

- 동의 배너는 설명, 분석 허용, 선택 거부, 설정 닫기 기능을 제공한다.
- 키보드로 모든 버튼을 조작할 수 있고 상태 메시지는 화면 읽기 프로그램에 전달한다.
- 선택 거부 후에도 사이트의 게임·뉴스·굿즈·커뮤니티 기능은 유지한다.
- 설정 버튼을 통해 기존 선택을 다시 열고 변경할 수 있다.

## 보안·정책 경계

- GA4 측정 ID는 공개 식별자이며 비밀 키로 취급하지 않는다.
- Supabase 키, 관리자 토큰, 회원 이메일은 분석 모듈에 전달하지 않는다.
- 19세 이용가 페이지에서도 분석은 콘텐츠 제목 대신 비식별 프로젝트 ID만 사용한다.
- 광고는 관리자·로그인·성인 인증·결제·댓글 작성 화면에서 제외한다.
- EEA·영국·스위스 대상 광고 운영 전 Google 인증 CMP 적용 여부를 다시 검토한다.

## 완료 기준

- 동의 전 GA4 스크립트가 생성되지 않는다.
- 동의 후 유효한 측정 ID가 있을 때 한 번만 로드된다.
- 거부 또는 철회 후 이벤트가 전송되지 않는다.
- 손상된 저장 값은 미동의 상태로 처리한다.
- 허용 목록 밖 이벤트와 민감 매개변수는 버린다.
- 핵심 HTML과 Next.js 화면에서 같은 모듈을 불러온다.
- 전체 테스트, TypeScript 검사, 프로덕션 빌드가 통과한다.

## 후속 단계

2단계에서 개인정보처리방침의 운영자·시행일·책임자 정보를 확정하고 지역별 동의 요건을 보완한다. 3단계에서 광고 허용·제외 페이지를 코드로 분류하고 AdSense 심사 준비를 진행한다.
