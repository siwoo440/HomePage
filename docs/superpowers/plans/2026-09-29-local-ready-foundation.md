---
# DEVFORGE 로컬 완성형 기반 1단계 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 외부 계정과 비밀 키 없이 홈페이지 저장소만 설치·검사·빌드할 수 있는 재현 가능한 개발 기반을 만든다.

**Architecture:** 홈페이지 저장소의 Git·TypeScript·ESLint 범위를 별도 `ChatBot/`·`Text-Play/` 프로젝트에서 분리한다. pnpm 11 설정과 Next.js 16 생성 파일 정책을 공식 위치에 고정하고, 테스트·타입·린트·빌드를 하나의 `pnpm check` 계약으로 묶는다.

**Tech Stack:** Node.js `>=20.9.0`, pnpm `11.19.0`, Next.js `16.2.6`, React `19.2.4`, TypeScript `5.7.3`, ESLint `9.39.5`, eslint-config-next `16.2.6`, Node test runner

**Spec:** `docs/superpowers/specs/2026-09-29-local-ready-foundation-design.md`

---
## Global Constraints

- 홈페이지 방문자 화면, API 응답, 데모 데이터와 CSS 시각 결과를 변경하지 않는다.
- `ChatBot/`과 `Text-Play/`의 파일을 이동, 삭제, 수정, 설치 또는 커밋하지 않는다.
- 외부 API 키, 계정, `.env.local`, 비밀번호와 Supabase `service_role` 키를 사용하지 않는다.
- 새 JavaScript·TypeScript 코드는 Allman 스타일과 모든 줄의 짧은 한글 명사형 주석 규칙을 지킨다.
- `next-env.d.ts`는 Next.js 생성 파일로 유지하되 Git 추적에서 제거하고 `tsconfig.json`의 `include`에는 남긴다.
- pnpm 의존성 빌드는 `sharp: true`, `msw: false`만 명시하고 전체 빌드 허용을 사용하지 않는다.
- 기존 255개 Node 테스트를 보존하고 각 작업 종료 시 관련 검사와 전체 회귀 검사를 실행한다.
- 각 커밋은 이 계획에 명시된 파일만 명시적으로 스테이징한다.

---
## Review Focus

- 루트에 `ChatBot/`과 `Text-Play/`이 동시에 있어도 홈페이지 타입·린트 검사가 해당 파일을 읽지 않아야 한다. Task 1 설정 계약 테스트로 고정한다.
- 새 의존성이 빌드 스크립트를 추가해도 자동 실행되지 않고 검토되지 않은 빌드는 설치를 실패시켜야 한다. Task 2 설정 계약과 frozen install로 검증한다.
- `next dev`, `next build`, `next typegen`이 `next-env.d.ts`를 다시 생성해도 Git 변경으로 나타나지 않아야 한다. Task 1 생성 파일 검사와 Task 4 최종 Git 상태로 검증한다.
- 초기 색상 모드 스크립트와 외부 업로드 이미지를 위한 의도적 구현은 ESLint를 무력화하지 않으면서 파일 단위 예외로만 허용해야 한다. Task 3 ESLint 설정 계약과 `--max-warnings=0`으로 검증한다.
- README와 개발 문서가 서로 다른 명령이나 완료 상태를 안내하지 않아야 한다. Task 4 문서 계약 테스트로 고정한다.

---

## 파일 구조

---
### 생성

- `tests/development-tooling.test.mjs`: 저장소 경계, pnpm 정책, 스크립트, ESLint와 문서의 설정 계약 검사
- `eslint.config.mjs`: Next.js 16 Flat Config와 제한된 파일 단위 예외

---
### 수정

- `.gitignore`: `ChatBot/`과 `next-env.d.ts` 제외
- `tsconfig.json`: `ChatBot/` 타입 검사 제외
- `package.json`: Node·pnpm 버전, ESLint 의존성, `typecheck`·`check` 스크립트
- `pnpm-workspace.yaml`: `hono` override와 의존성 빌드 허용 정책
- `pnpm-lock.yaml`: 패키지 설정과 ESLint 의존성 반영
- `app/admin/login/page.tsx:22`: `// DEVELOPER ACCESS` JSX 텍스트 명시
- `app/admin/news/[id]/edit/page.tsx:34`: `// EDIT NEWS` JSX 텍스트 명시
- `app/admin/news/new/page.tsx:17`: `// WRITE NEWS` JSX 텍스트 명시
- `app/admin/news/page.tsx:35`: `// NEWS CONTROL` JSX 텍스트 명시
- `app/admin/products/[id]/edit/page.tsx:33`: `// EDIT GOODS` JSX 텍스트 명시
- `app/admin/products/new/page.tsx:14`: `// NEW GOODS` JSX 텍스트 명시
- `app/admin/products/page.tsx:31`: `// GOODS CONTROL` JSX 텍스트 명시
- `app/age-verification/page.tsx:20`: `// AGE CHECK` JSX 텍스트 명시
- `app/login/page.tsx:21`: `// MEMBER ACCESS` JSX 텍스트 명시
- `app/news/[id]/comments-panel.tsx:222`: `// COMMUNITY TALK` JSX 텍스트 명시
- `tests/device-preview.test.mjs:12-17`: 사용하지 않는 표현식 경고가 없는 명시적 분기
- `README.md`: 공식 설치·검증 명령
- `docs/DEVELOPMENT-GUIDE.md`: 도구 버전, 검사 순서, 저장소 경계와 완료 기능
- `docs/DEVELOPMENT-NOTES.md`: L1~L3와 L9 상태, 후속 우선순위
- `TRANSFER-GUIDE.md`: 새 환경 검증 명령

---
### Git 추적 제거

- `next-env.d.ts`: 작업 파일은 Next.js가 생성하고 유지하지만 저장소에서는 추적하지 않음

---

### Task 1: 홈페이지 저장소와 생성 파일 경계 고정

**Files:**
- Create: `tests/development-tooling.test.mjs`
- Modify: `.gitignore`
- Modify: `tsconfig.json`
- Untrack: `next-env.d.ts`

**Interfaces:**
- Consumes: 현재 Git 무시 규칙과 TypeScript 설정
- Produces: 별도 프로젝트를 읽지 않는 홈페이지 검사 범위와 Git에서 무시되는 Next.js 생성 타입 파일

- [ ] **Step 1: 저장소 경계 실패 테스트 작성**

`tests/development-tooling.test.mjs`를 다음 공통 설정으로 시작한다.

```javascript
import test from "node:test"; // 테스트 함수 가져오기
import assert from "node:assert/strict"; // 엄격한 검증 함수 가져오기
import { access, readFile } from "node:fs/promises"; // 파일 접근 함수 가져오기
import path from "node:path"; // 경로 함수 가져오기
import { fileURLToPath } from "node:url"; // URL 변환 함수 가져오기

const currentFile = fileURLToPath(import.meta.url); // 현재 파일 경로 계산
const currentDirectory = path.dirname(currentFile); // 현재 폴더 경로 계산
const projectRoot = path.resolve(currentDirectory, ".."); // 프로젝트 루트 계산
```

같은 파일에 다음 계약을 추가한다.

```javascript
test("홈페이지 도구는 별도 프로젝트와 Next 생성 파일을 제외한다", async () => // 저장소 경계 검사
{ // 테스트 시작
    const gitignore = await readFile(path.join(projectRoot, ".gitignore"), "utf8"); // Git 제외 규칙 읽기
    const tsconfig = JSON.parse(await readFile(path.join(projectRoot, "tsconfig.json"), "utf8")); // 타입 설정 읽기
    assert.match(gitignore, /^ChatBot\/$/m); // ChatBot Git 제외 확인
    assert.match(gitignore, /^Text-Play\/$/m); // Text-Play Git 제외 확인
    assert.match(gitignore, /^next-env\.d\.ts$/m); // 생성 타입 Git 제외 확인
    assert.equal(tsconfig.exclude.includes("ChatBot"), true); // ChatBot 타입 제외 확인
    assert.equal(tsconfig.exclude.includes("Text-Play"), true); // Text-Play 타입 제외 확인
    assert.equal(tsconfig.include.includes("next-env.d.ts"), true); // 생성 타입 포함 확인
}); // 테스트 종료
```

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/development-tooling.test.mjs`

Expected: FAIL. `.gitignore`의 `ChatBot/`, `next-env.d.ts` 또는 `tsconfig.exclude`의 `ChatBot` 계약이 없음.

- [ ] **Step 3: 최소 경계 설정 적용**

- `.gitignore`의 별도 작업 공간 목록에 `ChatBot/` 추가
- `.gitignore`의 생성 파일 목록에 `next-env.d.ts` 추가
- `tsconfig.json`의 `exclude`에 `ChatBot` 추가
- `next-env.d.ts`를 작업 폴더에 남긴 상태로 Git 인덱스에서만 제거
- `tsconfig.json`의 `include`에서 `next-env.d.ts` 유지

- [ ] **Step 4: 경계 테스트와 타입 검사 통과 확인**

Run: `node --test tests/development-tooling.test.mjs`

Expected: PASS 1, FAIL 0.

Run: `node node_modules/typescript/bin/tsc --noEmit --incremental false`

Expected: 종료 코드 0. `ChatBot/`과 `Text-Play/` 진단 없음.

- [ ] **Step 5: Next.js 생성 파일 안정성 확인**

Run: `node node_modules/next/dist/bin/next typegen`

Expected: `next-env.d.ts` 생성 또는 갱신 성공.

Run: `git status --short -- next-env.d.ts ChatBot Text-Play`

Expected: 출력 없음.

- [ ] **Step 6: 작업 커밋**

```bash
git add .gitignore tsconfig.json tests/development-tooling.test.mjs
git rm --cached next-env.d.ts
git commit -m "chore: 홈페이지 개발 범위 분리"
```

---

### Task 2: pnpm 11 설치 정책과 버전 고정

**Files:**
- Modify: `tests/development-tooling.test.mjs`
- Modify: `package.json`
- Modify: `pnpm-workspace.yaml`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: Task 1의 저장소 경계
- Produces: Node `>=20.9.0`, pnpm `11.19.0`, `hono` `4.12.25`, `sharp` 허용과 `msw` 거부가 고정된 설치 계약

- [ ] **Step 1: pnpm 정책 실패 테스트 작성**

`tests/development-tooling.test.mjs`에 다음 계약을 추가한다.

```javascript
test("pnpm 11 설치 정책은 작업 공간 설정에서 관리한다", async () => // 패키지 정책 검사
{ // 테스트 시작
    const packageJson = JSON.parse(await readFile(path.join(projectRoot, "package.json"), "utf8")); // 패키지 설정 읽기
    const workspace = await readFile(path.join(projectRoot, "pnpm-workspace.yaml"), "utf8"); // 작업 공간 설정 읽기
    assert.equal(packageJson.packageManager, "pnpm@11.19.0"); // pnpm 버전 확인
    assert.equal(packageJson.engines.node, ">=20.9.0"); // Node 하한 확인
    assert.equal("pnpm" in packageJson, false); // 무시되는 설정 제거 확인
    assert.match(workspace, /overrides:\s+[\s\S]*hono: 4\.12\.25/); // hono 고정 확인
    assert.match(workspace, /allowBuilds:\s+[\s\S]*msw: false[\s\S]*sharp: true/); // 빌드 정책 확인
}); // 테스트 종료
```

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/development-tooling.test.mjs`

Expected: FAIL. `packageManager`, `engines`, 작업 공간 `overrides` 또는 불리언 `allowBuilds` 계약이 없음.

- [ ] **Step 3: pnpm 정책 최소 변경**

- `package.json`에 `packageManager: "pnpm@11.19.0"` 추가
- `package.json`에 `engines.node: ">=20.9.0"` 추가
- `package.json`의 `pnpm.overrides` 제거
- `pnpm-workspace.yaml`에 `overrides.hono: 4.12.25` 이동
- `pnpm-workspace.yaml`에 `allowBuilds.msw: false`, `allowBuilds.sharp: true` 설정
- `dangerouslyAllowAllBuilds`는 추가하지 않음

- [ ] **Step 4: 잠금 파일과 설치 상태 갱신**

Run: `pnpm install --lockfile-only`

Expected: 종료 코드 0. `package.json`의 `pnpm` 필드 무시 경고와 빌드 정책 자리표시자 없음.

Run: `pnpm install --frozen-lockfile`

Expected: 종료 코드 0. `ERR_PNPM_IGNORED_BUILDS` 없음.

- [ ] **Step 5: 관련 검사 통과 확인**

Run: `node --test tests/development-tooling.test.mjs`

Expected: PASS 2, FAIL 0.

Run: `node --test tests/*.test.mjs`

Expected: 기존 255개와 새 설정 테스트 전체 통과.

- [ ] **Step 6: 작업 커밋**

```bash
git add package.json pnpm-workspace.yaml pnpm-lock.yaml tests/development-tooling.test.mjs
git commit -m "chore: pnpm 11 설치 정책 고정"
```

---

### Task 3: Next.js 16 ESLint와 통합 검사 진입점 구축

**Files:**
- Create: `eslint.config.mjs`
- Modify: `tests/development-tooling.test.mjs`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `app/admin/login/page.tsx:22`
- Modify: `app/admin/news/[id]/edit/page.tsx:34`
- Modify: `app/admin/news/new/page.tsx:17`
- Modify: `app/admin/news/page.tsx:35`
- Modify: `app/admin/products/[id]/edit/page.tsx:33`
- Modify: `app/admin/products/new/page.tsx:14`
- Modify: `app/admin/products/page.tsx:31`
- Modify: `app/age-verification/page.tsx:20`
- Modify: `app/login/page.tsx:21`
- Modify: `app/news/[id]/comments-panel.tsx:222`
- Modify: `tests/device-preview.test.mjs:12-17`

**Interfaces:**
- Consumes: Task 2의 재현 가능한 설치 계약
- Produces: `pnpm typecheck`, `pnpm lint`, `pnpm check` 명령과 경고 0개의 ESLint 계약

- [ ] **Step 1: 검사 스크립트와 ESLint 실패 테스트 작성**

`tests/development-tooling.test.mjs`에 다음 계약을 추가한다.

```javascript
test("공식 품질 검사 명령과 ESLint 버전이 고정되어 있다", async () => // 검사 명령 계약
{ // 테스트 시작
    const packageJson = JSON.parse(await readFile(path.join(projectRoot, "package.json"), "utf8")); // 패키지 설정 읽기
    assert.equal(packageJson.scripts.typecheck, "tsc --noEmit --incremental false"); // 타입 명령 확인
    assert.equal(packageJson.scripts.lint, "eslint app lib scripts tests proxy.ts next.config.mjs postcss.config.mjs eslint.config.mjs --max-warnings=0"); // 린트 명령 확인
    assert.equal(packageJson.scripts.check, "pnpm test && pnpm typecheck && pnpm lint && pnpm build"); // 통합 명령 확인
    assert.equal(packageJson.devDependencies.eslint, "9.39.5"); // ESLint 버전 확인
    assert.equal(packageJson.devDependencies["eslint-config-next"], "16.2.6"); // Next 규칙 버전 확인
    await access(path.join(projectRoot, "eslint.config.mjs")); // Flat Config 존재 확인
}); // 테스트 종료
```

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/development-tooling.test.mjs`

Expected: FAIL. `typecheck`, `check`, ESLint 의존성 또는 `eslint.config.mjs`가 없음.

- [ ] **Step 3: ESLint 의존성과 명령 추가**

- `devDependencies.eslint`을 `9.39.5`로 고정
- `devDependencies.eslint-config-next`를 Next.js와 같은 `16.2.6`으로 고정
- `typecheck`, `lint`, `check` 스크립트를 테스트의 정확한 문자열로 추가
- `pnpm install --lockfile-only`로 잠금 파일 갱신

- [ ] **Step 4: Flat Config 작성**

`eslint.config.mjs`는 `defineConfig`, `globalIgnores`, `eslint-config-next/core-web-vitals`, `eslint-config-next/typescript`를 사용한다. 전체 검사에서 다음 경로를 제외한다.

- `.next/**`, `node_modules/**`, `internal/**`
- `ChatBot/**`, `Text-Play/**`, `ChatBot-text-play-download/**`
- `imported-chatbot/**`, `imports/chatbot-session-snapshot/**`
- `.pnpm-store/**`, `.worktrees/**`, `google-docs-trusted-read-*/**`

파일 단위 예외는 다음 세 묶음만 허용한다.

- `app/layout.tsx`: `@next/next/no-sync-scripts`, `@next/next/no-css-tags` 끄기
- `app/admin/products/page.tsx`, `app/news/[id]/comments-panel.tsx`, `app/news/[id]/page.tsx`: `@next/next/no-img-element` 끄기
- `app/news/[id]/comments-panel.tsx`: `react-hooks/set-state-in-effect` 끄기

각 예외 줄에는 초기 색상 모드 선적용, 외부 업로드 이미지, 세션 저장소 복원이라는 한글 명사형 사유 주석을 단다. 다른 규칙은 끄지 않는다.

- [ ] **Step 5: JSX 텍스트 오류를 동작 변경 없이 수정**

위 Files 목록의 10개 TSX 위치에서 `// ...` 텍스트를 JSX 표현식 문자열인 `{"// ..."}` 형태로 변경한다. 표시 문구, 요소 구조와 CSS 클래스는 유지한다.

- [ ] **Step 6: 테스트의 사용하지 않는 표현식 경고 수정**

`tests/device-preview.test.mjs`의 삼항 표현식을 `if`/`else` Allman 분기로 바꾸고 `Set.add`와 `Set.delete` 동작을 유지한다.

- [ ] **Step 7: ESLint와 관련 테스트 통과 확인**

Run: `pnpm lint`

Expected: 오류 0, 경고 0.

Run: `node --test tests/development-tooling.test.mjs tests/device-preview.test.mjs tests/root-layout.test.mjs`

Expected: 모든 테스트 통과.

Run: `pnpm typecheck`

Expected: 종료 코드 0.

- [ ] **Step 8: 작업 커밋**

```bash
git add eslint.config.mjs package.json pnpm-lock.yaml tests/development-tooling.test.mjs tests/device-preview.test.mjs app/admin/login/page.tsx "app/admin/news/[id]/edit/page.tsx" app/admin/news/new/page.tsx app/admin/news/page.tsx "app/admin/products/[id]/edit/page.tsx" app/admin/products/new/page.tsx app/admin/products/page.tsx app/age-verification/page.tsx app/login/page.tsx "app/news/[id]/comments-panel.tsx"
git commit -m "chore: Next.js 품질 검사 통합"
```

---

### Task 4: 개발 문서 동기화와 전체 검증

**Files:**
- Modify: `tests/development-tooling.test.mjs`
- Modify: `README.md`
- Modify: `docs/DEVELOPMENT-GUIDE.md`
- Modify: `docs/DEVELOPMENT-NOTES.md`
- Modify: `TRANSFER-GUIDE.md`

**Interfaces:**
- Consumes: Task 3의 `pnpm check` 명령과 고정된 개발 도구 계약
- Produces: 새 작업자가 같은 명령으로 재현할 수 있는 문서와 1단계 완료 기록

- [ ] **Step 1: 문서 일치 실패 테스트 작성**

`tests/development-tooling.test.mjs`에 다음 계약을 추가한다.

```javascript
test("개발 문서는 공식 통합 검사 명령을 동일하게 안내한다", async () => // 문서 계약 검사
{ // 테스트 시작
    const documentPaths = ["README.md", "docs/DEVELOPMENT-GUIDE.md", "docs/DEVELOPMENT-NOTES.md", "TRANSFER-GUIDE.md"]; // 검사 문서 목록
    for (const documentPath of documentPaths) // 문서 반복
    { // 반복 시작
        const content = await readFile(path.join(projectRoot, documentPath), "utf8"); // 문서 읽기
        assert.match(content, /pnpm check/, `${documentPath}: 통합 검사 명령 누락`); // 통합 명령 확인
    } // 반복 종료
}); // 테스트 종료
```

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/development-tooling.test.mjs`

Expected: FAIL. 네 문서 가운데 하나 이상에서 `pnpm check` 누락.

- [ ] **Step 3: README와 인수인계 문서 갱신**

- Node.js `>=20.9.0`, pnpm `11.19.0` 기록
- `pnpm install --frozen-lockfile`, `pnpm dev`, `pnpm check`를 공식 순서로 기록
- 외부 키가 없어도 로컬 검사 가능함을 기록
- `ChatBot/`과 `Text-Play/`가 홈페이지 검사·커밋에서 제외됨을 기록
- 기존 개별 test/typecheck/lint/build 명령은 문제 해결용 하위 명령으로 유지

- [ ] **Step 4: 개발 가이드와 노트 상태 갱신**

- `docs/DEVELOPMENT-GUIDE.md`의 테스트 장을 `pnpm check` 기준으로 변경
- ESLint 미완성 제한을 제거하고 Next.js 16 CLI 검사 방식을 기록
- Next.js 화면의 다크 모드 복원 미연결 문구를 구현 완료 상태로 교정
- `docs/DEVELOPMENT-NOTES.md`의 L1~L3을 완료 항목으로 유지하고 권장 순서에서 제거
- L9를 `2026년 9월 29일 로컬 구현 완료`로 기록
- 후속 로컬 우선순위를 L4, L5, L6, L7, L8, L10 순서로 기록

- [ ] **Step 5: 문서 계약과 전체 품질 검사 실행**

Run: `node --test tests/development-tooling.test.mjs`

Expected: 설정·문서 계약 전체 통과.

Run: `pnpm check`

Expected: 테스트, 타입 검사, ESLint와 운영 빌드가 모두 종료 코드 0.

- [ ] **Step 6: 생성 파일과 저장소 경계 최종 확인**

Run: `node node_modules/next/dist/bin/next typegen`

Expected: 타입 생성 성공.

Run: `git status --short`

Expected: 이번 Task의 문서와 테스트 변경만 표시되고 `next-env.d.ts`, `ChatBot/`, `Text-Play/`, `.next/`, `node_modules/`은 표시되지 않음.

- [ ] **Step 7: 작업 커밋**

```bash
git add README.md TRANSFER-GUIDE.md docs/DEVELOPMENT-GUIDE.md docs/DEVELOPMENT-NOTES.md tests/development-tooling.test.mjs
git commit -m "docs: 로컬 개발 검증 절차 동기화"
```

---

## 완료 후 검증 기록

구현 완료 보고에는 다음 실제 결과를 포함한다.

- `pnpm install --frozen-lockfile` 종료 코드와 빌드 허용 결과
- `pnpm check`의 테스트 개수, 타입 검사, ESLint와 빌드 결과
- `next typegen` 뒤 Git 상태
- 방문자 화면과 API를 변경하지 않았다는 diff 확인
- 커밋 목록과 각 커밋의 변경 범위
