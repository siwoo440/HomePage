---
# Local Comment Service Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 외부 계정 없이 댓글 조회·작성·답글·반응·신고를 재현하는 로컬 서비스 계층을 완성합니다.

**Architecture:** 공통 비동기 서비스 계약과 메모리 구현을 분리하고 기존 도메인 검증 함수를 재사용합니다. 댓글 화면은 서비스만 호출하며 로컬 인스턴스는 새로고침 때 데모 초기 상태로 복원됩니다.

**Tech Stack:** TypeScript 5.7, React 19, Next.js 16, Node test runner

**Spec:** `docs/superpowers/specs/2026-09-26-local-comment-service-design.md`

---
## Global Constraints

- 외부 계정, 비밀 키, 네트워크와 유료 서비스 없이 동작
- ChatBot 본체와 Text-Play 파일 제외
- 새 브랜치와 중간 커밋 없이 현재 `main` 작업 상태 유지
- Allman 스타일과 각 코드 줄의 짧은 한글 명사형 주석 유지
- 댓글은 1~2,000자, 이미지는 허용 MIME과 5MB 이하, 답글은 한 단계만 허용
- 로컬 변경은 새로고침 시 데모 초기값으로 복원

---
## Review Focus

- 다른 뉴스의 댓글을 부모로 지정한 답글을 거부하는지 확인
- 반환된 댓글 객체를 호출자가 변경해도 저장소 내부 상태가 변하지 않는지 확인
- 같은 사용자의 반응 전환에서 기존 반응 수가 정확히 감소하는지 확인
- 동일 사용자의 동일 댓글 중복 신고를 거부하는지 확인
- 서비스 실패 시 화면 입력과 선택 상태가 보존되는지 확인

---
### Task 1: 서비스 계약과 로컬 저장소

**Files:**
- Create: `lib/comments/service.ts`
- Create: `lib/comments/local-service.ts`
- Create: `tests/comment-local-service.test.mjs`

**Interfaces:**
- Consumes: `NewsComment`, `ReactionType`, `ReportReason`, `validateCommentContent`, `validateCommentImage`, `toggleCommentReaction`
- Produces: `CommentService`, `CommentServiceError`, `CreateCommentInput`, `ReportCommentInput`, `CommentReport`, `createLocalCommentService`

- [ ] **Step 1: Write the failing service behavior tests**

조회 복제, 정상 작성, 입력 경계값, 한 단계 답글, 반응 전환, 신고 중복, 새 인스턴스 초기화 테스트를 작성합니다.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/comment-local-service.test.mjs`

Expected: `lib/comments/local-service.ts` 모듈 부재로 실패

- [ ] **Step 3: Implement the service contract and local adapter**

정확한 비동기 메서드와 오류 코드를 구현하고 모든 입출력을 복제합니다.

- [ ] **Step 4: Run focused tests**

Run: `node --test tests/comment-domain.test.mjs tests/comment-local-service.test.mjs`

Expected: 모든 댓글 도메인·서비스 테스트 통과

- [ ] **Step 5: Record task completion without committing**

사용자 요청에 따라 10단계 전체 완료 전까지 커밋하지 않고 장부에 검증 결과만 기록합니다.

---
### Task 2: 댓글 화면 서비스 연결

**Files:**
- Modify: `app/news/[id]/comments-panel.tsx`
- Create: `tests/comment-panel-service.test.mjs`

**Interfaces:**
- Consumes: Task 1의 `CommentService`, `CommentServiceError`, `createLocalCommentService`
- Produces: 서비스 기반 댓글 화면, 댓글별 신고 사유 상태, 성공·실패 안내

- [ ] **Step 1: Write the failing UI contract test**

실제 서비스 호출을 관찰할 수 있도록 댓글 패널의 화면 동작 계약을 검사합니다.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/comment-panel-service.test.mjs`

Expected: 화면이 아직 로컬 서비스를 사용하지 않아 실패

- [ ] **Step 3: Replace direct state rules with service calls**

초기 조회, 작성, 반응, 신고를 서비스로 연결하고 선택한 신고 사유를 전달합니다.

- [ ] **Step 4: Run UI and service tests**

Run: `node --test tests/comment-domain.test.mjs tests/comment-local-service.test.mjs tests/comment-panel-service.test.mjs`

Expected: 모든 댓글 관련 테스트 통과

- [ ] **Step 5: Record task completion without committing**

커밋 대신 장부에 검증 결과를 기록합니다.

---
### Task 3: 문서와 전체 검증

**Files:**
- Modify: `docs/DEVELOPMENT-NOTES.md`
- Modify: `docs/DEVELOPMENT-GUIDE.md`
- Modify: `docs/FILE-MAP.md`

**Interfaces:**
- Consumes: Task 1과 Task 2의 실제 파일·동작
- Produces: 로컬 완료 상태, 서비스 구조와 새로고침 정책 문서

- [ ] **Step 1: Update documentation**

L2 상태, 파일 역할, 데모 저장 정책과 외부 연결 제한을 현재 구현과 일치시킵니다.

- [ ] **Step 2: Run the complete test suite**

Run: `pnpm test`

Expected: 실패 0개

- [ ] **Step 3: Run TypeScript verification**

Run: `.\node_modules\.bin\tsc.CMD --noEmit`

Expected: 종료 코드 0

- [ ] **Step 4: Run production build**

Run: `pnpm build`

Expected: 종료 코드 0

- [ ] **Step 5: Check diff hygiene and repository scope**

Run: `git diff --check` and `git status --short`

Expected: 공백 오류 없음, ChatBot 본체와 Text-Play 파일 없음

- [ ] **Step 6: Request one fresh final review**

명세, 계획, 변경 내용과 검증 결과를 읽기 전용 검토자에게 전달하고 중요 문제를 한 번의 수정 단계로 처리합니다.
