---
# 공개 게임 소개 페이지 분리 구현 계획

> **에이전트 작업 필수 지침:** 각 작업은 `superpowers:subagent-driven-development` 또는 `superpowers:executing-plans`를 사용해 순서대로 구현한다. 진행 상태는 체크박스(`- [ ]`)로 기록한다.

**목표:** 35개 게임의 공개 정보를 한 곳에서 관리하고, 내부 기획 자료를 웹 공개 경로 밖에 보존하며, 모든 공개 상세 페이지를 방문자용 소개 화면으로 정리한다.

**아키텍처:** `game-projects.mjs`를 공개 정보의 단일 기준으로 사용하고, 공통 페이지는 생성 스크립트로 정적 HTML을 만든다. 전용 기능이 있는 B, C, D, H, L, η 페이지는 기존 구조를 유지하면서 공개 문구만 정리하고, 메인 목록과 커뮤니티도 같은 프로젝트 레지스트리를 참조한다.

**기술 구성:** 정적 HTML5, CSS, JavaScript ES 모듈, Node.js 생성 스크립트, Node.js 테스트 러너, Next.js 16

**설계 문서:** `docs/superpowers/specs/2026-09-22-public-game-pages-design.md`

---
## 전역 제약

- 전체 프로젝트 수는 35개로 유지한다.
- 성인 프로젝트 H, U, V의 기존 인증과 모자이크를 유지한다.
- 대표 프로젝트 순서는 η, A, B, C, D, E를 유지한다.
- B, C, D, H, L, η의 전용 기능과 디자인을 유지한다.
- Project η의 초대장 연출과 합성 도감을 변경하지 않는다.
- 기존 메인 HTML 원본은 `internal/project-archives`에 보존한다.
- `internal` 자료는 공개 페이지에서 링크하지 않는다.
- 새 런타임 의존성을 추가하지 않는다.
- 새 코드에는 Allman 스타일과 짧은 한글 명사형 주석을 적용한다.

---
## 파일 구조

| 경로 | 책임 |
|---|---|
| `internal/project-archives/**/Project*_Main.html` | 변경 전 프로젝트 메인 HTML 원본 보존 |
| `scripts/archive-project-pages.mjs` | 원본 HTML을 한 번만 안전하게 복사 |
| `scripts/generate-project-pages.mjs` | 공통 프로젝트 공개 HTML 생성 |
| `public/game-projects.mjs` | 35개 프로젝트 공개 정보와 조회 함수 |
| `public/project-page.mjs` | 공통 소개 페이지 렌더링과 누락 데이터 복구 |
| `public/project-page.css` | 공통 소개·준비 중 페이지 반응형 디자인 |
| `public/project_*/Project*_Main.html` | 생성된 공통 페이지 또는 보존된 특화 페이지 |
| `public/game-catalog.mjs` | 메인 카드와 공개 데이터 연결 |
| `public/community-data.mjs` | 커뮤니티 게임 이름을 공개 데이터에서 파생 |
| `tests/project-archive.test.mjs` | 원본 보관 및 공개 비연결 검사 |
| `tests/game-projects.test.mjs` | 공개 데이터 35개와 상태 계약 검사 |
| `tests/public-project-pages.test.mjs` | 공통·특화 페이지의 공개 문구 검사 |
| `tests/game-catalog.test.mjs` | 메인 카드 데이터 연결 회귀 검사 |
| `tests/community-page.test.mjs` | 커뮤니티 레지스트리 연결 회귀 검사 |

---
## 검토 중점

- 알 수 없는 프로젝트 ID는 오류 대신 메인 게임 목록 안내 화면을 표시해야 하며 작업 3에서 검사한다.
- 대표 이미지 파일이 누락돼도 제목과 대체 설명을 읽을 수 있어야 하며 작업 3에서 검사한다.
- 생성기를 반복 실행해도 동일한 HTML이 만들어져야 하며 작업 3에서 검사한다.
- H, U, V의 직접 주소 접근은 공통 페이지 전환 후에도 성인 인증을 우회하지 않아야 하며 작업 6에서 검사한다.
- GitHub 저장소가 공개일 때 `internal` 자료가 저장소에서는 보인다는 제한을 README와 설계 문서에서 일관되게 설명해야 하며 작업 6에서 검사한다.

---
### Task 1: 기존 프로젝트 페이지 원본 보관

**파일:**
- 생성: `scripts/archive-project-pages.mjs`
- 생성: `tests/project-archive.test.mjs`
- 생성: `internal/project-archives/**/Project*_Main.html`

**인터페이스:**
- 입력: `public` 아래 `project_*` 디렉터리의 `Project*_Main.html`
- 출력: `collectProjectMainPages(root): string[]`
- 출력: `archiveProjectPages(sourceRoot, targetRoot): Promise<number>`
- 보장: 이미 존재하는 보관 파일은 덮어쓰지 않음

- [ ] **1단계: 실패하는 원본 보관 테스트 작성**

`tests/project-archive.test.mjs`에 다음 계약을 작성한다.

```js
import assert from "node:assert/strict"; // 엄격 비교 도구
import fs from "node:fs"; // 파일 읽기 도구
import path from "node:path"; // 경로 처리 도구
import test from "node:test"; // 테스트 실행 도구
import { collectProjectMainPages } from "../scripts/archive-project-pages.mjs"; // 페이지 수집 도구

test("프로젝트 메인 원본 35개를 보존한다", () => // 원본 보관 테스트
{ // 테스트 시작
    const publicPages = collectProjectMainPages("public"); // 공개 원본 수집
    const archivedPages = collectProjectMainPages("internal/project-archives"); // 보관 원본 수집
    assert.equal(publicPages.length, 35); // 공개 페이지 수 확인
    assert.deepEqual(archivedPages.map(path.basename).sort(), publicPages.map(path.basename).sort()); // 보관 파일명 확인
}); // 테스트 끝

test("공개 문서는 내부 보관 경로를 연결하지 않는다", () => // 내부 링크 차단 테스트
{ // 테스트 시작
    const mainHtml = fs.readFileSync("public/main.html", "utf8"); // 메인 문서 읽기
    assert.doesNotMatch(mainHtml, /internal\/project-archives/); // 내부 경로 미노출 확인
}); // 테스트 끝
```

- [ ] **2단계: 테스트가 실패하는지 확인**

실행:

```powershell
node --test tests/project-archive.test.mjs # 원본 보관 테스트
```

예상 결과: `scripts/archive-project-pages.mjs`가 없어 실패.

- [ ] **3단계: 보관 스크립트 최소 구현**

스크립트는 디렉터리를 정렬해 탐색하고 `COPYFILE_EXCL`을 사용한다. 대상 파일이 이미 있으면 내용을 덮어쓰지 않고 건너뛴다.

```js
export function collectProjectMainPages(root) // 프로젝트 메인 수집
{ // 함수 시작
    if (!fs.existsSync(root)) // 루트 존재 확인
    { // 조건 시작
        return []; // 빈 목록 반환
    } // 조건 끝
    return fs.readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory() && entry.name.startsWith("project_")).flatMap((entry) => // 프로젝트 폴더 반복
    { // 변환 시작
        const directory = path.join(root, entry.name); // 프로젝트 경로 생성
        return fs.readdirSync(directory).filter((name) => /^Project.*_Main\.html$/.test(name)).map((name) => path.join(directory, name)); // 메인 파일 반환
    }).sort(); // 안정된 순서 반환
} // 함수 끝
```

- [ ] **4단계: 35개 원본 복사와 테스트 통과 확인**

실행:

```powershell
node scripts/archive-project-pages.mjs # 원본 보관 실행
node --test tests/project-archive.test.mjs # 보관 결과 검사
```

예상 결과: 35개 원본 생성, 테스트 통과.

- [ ] **5단계: 원본 보관 커밋**

```powershell
git add scripts/archive-project-pages.mjs tests/project-archive.test.mjs internal/project-archives # 보관 파일 추가
git commit -m "chore: archive original project pages" # 원본 보관 커밋
```

---
### Task 2: 프로젝트 공개 데이터의 단일 기준 생성

**파일:**
- 생성: `public/game-projects.mjs`
- 생성: `tests/game-projects.test.mjs`

**인터페이스:**
- 출력: `GAME_PROJECTS: readonly GameProject[]`
- 출력: `FEATURED_PROJECT_IDS: readonly string[]`
- 출력: `SPECIAL_PROJECT_IDS: readonly string[]`
- 출력: `getGameProject(id): GameProject | null`
- 출력: `validateGameProjects(projects): readonly string[]`

`GameProject`는 `id`, `symbol`, `title`, `tagline`, `genres`, `developmentStatus`, `publicationStatus`, `summary`, `features`, `heroImage`, `detailPath`, `adultOnly`, `layout`, `hashtag`를 가진다.

공개 데이터 행렬은 다음 값으로 고정한다.

| 구분 | 프로젝트 |
|---|---|
| 대표 순서 | η, A, B, C, D, E |
| 특화 레이아웃 | B, C, D, H, L, η |
| 성인 인증 | H, U, V |
| 보류 | γ, ζ |
| 기획 | ι |
| 소개 내용 보유 | A, B, C, D, H, L, η |
| 콘셉트 초안 | γ, δ, ε, ζ, θ, ι |
| 준비 중 | E, F, G, I, J, K, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z, α, β |

나머지 프로젝트의 개발 상태는 `developing`으로 기록한다. 장르, 제목, 대표 이미지, 상세 주소는 현재 `main.html` 카드 값을 그대로 옮긴다.

- [ ] **1단계: 실패하는 레지스트리 계약 테스트 작성**

```js
import assert from "node:assert/strict"; // 엄격 비교 도구
import test from "node:test"; // 테스트 실행 도구
import { FEATURED_PROJECT_IDS, GAME_PROJECTS, getGameProject, validateGameProjects } from "../public/game-projects.mjs"; // 프로젝트 공개 데이터

test("35개 프로젝트가 고유 식별자와 필수 공개 정보를 가진다", () => // 데이터 계약 테스트
{ // 테스트 시작
    assert.equal(GAME_PROJECTS.length, 35); // 전체 수 확인
    assert.equal(new Set(GAME_PROJECTS.map((project) => project.id)).size, 35); // 식별자 중복 확인
    assert.deepEqual(validateGameProjects(GAME_PROJECTS), []); // 유효성 오류 없음 확인
}); // 테스트 끝

test("대표 프로젝트 순서를 유지한다", () => // 대표 순서 테스트
{ // 테스트 시작
    assert.deepEqual(FEATURED_PROJECT_IDS, ["project-eta", "project-a", "project-b", "project-c", "project-d", "project-e"]); // 승인 순서 확인
}); // 테스트 끝

test("성인 프로젝트와 알 수 없는 프로젝트를 안전하게 판정한다", () => // 안전 조회 테스트
{ // 테스트 시작
    assert.equal(getGameProject("project-h")?.adultOnly, true); // 프로젝트 H 성인 확인
    assert.equal(getGameProject("project-u")?.adultOnly, true); // 프로젝트 U 성인 확인
    assert.equal(getGameProject("project-v")?.adultOnly, true); // 프로젝트 V 성인 확인
    assert.equal(getGameProject("missing-project"), null); // 미등록 프로젝트 확인
}); // 테스트 끝
```

- [ ] **2단계: 테스트가 실패하는지 확인**

실행:

```powershell
node --test tests/game-projects.test.mjs # 공개 데이터 테스트
```

예상 결과: `public/game-projects.mjs`가 없어 실패.

- [ ] **3단계: 데이터와 유효성 검사 구현**

`validateGameProjects`는 빈 문자열, 잘못된 상태, 중복 ID, 외부 상세 주소, 존재하지 않는 이미지 경로를 오류 문자열로 반환한다. 허용 상태는 다음과 같다.

```js
const DEVELOPMENT_STATUSES = Object.freeze(["developing", "planning", "paused"]); // 개발 상태 목록
const PUBLICATION_STATUSES = Object.freeze(["featured", "developing", "planning"]); // 공개 상태 목록
const LAYOUT_TYPES = Object.freeze(["common", "special"]); // 레이아웃 목록
```

프로젝트 객체와 내부 배열은 모두 `Object.freeze`로 고정한다. `getGameProject`는 ID가 없거나 문자열이 아니면 `null`을 반환한다.

- [ ] **4단계: 데이터 테스트 통과 확인**

실행:

```powershell
node --test tests/game-projects.test.mjs # 공개 데이터 테스트
```

예상 결과: 전체 테스트 통과.

- [ ] **5단계: 공개 데이터 커밋**

```powershell
git add public/game-projects.mjs tests/game-projects.test.mjs # 데이터 파일 추가
git commit -m "feat: add public game project registry" # 공개 데이터 커밋
```

---
### Task 3: 공통 소개 페이지 생성기와 화면 구현

**파일:**
- 생성: `scripts/generate-project-pages.mjs`
- 생성: `public/project-page.mjs`
- 생성: `public/project-page.css`
- 생성: `tests/public-project-pages.test.mjs`
- 수정: 특화 6개를 제외한 29개 `public/project_*/Project*_Main.html`

**인터페이스:**
- 입력: `GAME_PROJECTS` 중 `layout === "common"`
- 출력: `renderProjectHtml(project): string`
- 출력: `generateProjectPages(outputRoot): Promise<number>`
- 출력: `resolveProjectView(project): { mode, title, features, heroImage }`
- 공통 HTML 계약: `data-public-project-page`, `data-project-id`, `data-project-mode`

- [ ] **1단계: 실패하는 생성 페이지 테스트 작성**

```js
import assert from "node:assert/strict"; // 엄격 비교 도구
import fs from "node:fs"; // 파일 읽기 도구
import test from "node:test"; // 테스트 실행 도구
import { GAME_PROJECTS } from "../public/game-projects.mjs"; // 프로젝트 공개 데이터
import { renderProjectHtml } from "../scripts/generate-project-pages.mjs"; // 페이지 생성 도구

test("공통 프로젝트는 공개 소개 문서만 생성한다", () => // 공통 페이지 생성 테스트
{ // 테스트 시작
    const project = GAME_PROJECTS.find((item) => item.id === "project-e"); // 준비 중 프로젝트 조회
    const html = renderProjectHtml(project); // 공개 HTML 생성
    assert.match(html, /data-public-project-page/); // 공개 루트 확인
    assert.match(html, /data-project-mode="planning"/); // 준비 중 상태 확인
    assert.doesNotMatch(html, /기획서|기획 초안|메인 아카이브|기획 준비 중/); // 내부 문구 제거 확인
    assert.match(html, /새로운 정보가 준비되는 대로 공개됩니다/); // 공개 안내 확인
}); // 테스트 끝

test("생성기는 같은 입력에 같은 문서를 반환한다", () => // 결정적 생성 테스트
{ // 테스트 시작
    const project = GAME_PROJECTS.find((item) => item.id === "project-a"); // 소개 프로젝트 조회
    assert.equal(renderProjectHtml(project), renderProjectHtml(project)); // 동일 결과 확인
}); // 테스트 끝
```

알 수 없는 ID의 `resolveProjectView(null)`은 제목 `프로젝트를 찾을 수 없습니다`, 모드 `missing`, 복귀 주소 `/main.html#games`를 반환하도록 별도 테스트한다.

- [ ] **2단계: 테스트가 실패하는지 확인**

실행:

```powershell
node --test tests/public-project-pages.test.mjs # 공개 페이지 생성 테스트
```

예상 결과: 생성기와 공통 모듈이 없어 실패.

- [ ] **3단계: 공통 페이지 렌더러 구현**

`public/project-page.mjs`는 `data-project-id`로 프로젝트를 조회한다. `publicationStatus === "planning"`이면 특징 영역을 숨기고 준비 중 안내를 표시한다. 이미지 로드 오류가 발생하면 이미지 영역을 숨기고 제목 기반 대체 블록을 표시한다.

```js
export function resolveProjectView(project) // 프로젝트 화면 계산
{ // 함수 시작
    if (!project) // 프로젝트 누락 확인
    { // 조건 시작
        return Object.freeze({ mode: "missing", title: "프로젝트를 찾을 수 없습니다", features: Object.freeze([]), heroImage: "" }); // 누락 화면 반환
    } // 조건 끝
    const mode = project.publicationStatus === "planning" ? "planning" : "published"; // 공개 모드 판정
    return Object.freeze({ mode, title: project.title, features: project.features, heroImage: project.heroImage }); // 프로젝트 화면 반환
} // 함수 끝
```

- [ ] **4단계: 공통 HTML 생성기 구현**

생성 HTML에는 다음 자원을 정확히 한 번 포함한다.

- `/project-page.css`
- `/responsive-shell.css`
- `/project-page.mjs`
- `/responsive-nav.mjs`
- `/device-preview-control.mjs`
- `/privacy-consent.mjs`
- `/site-analytics.mjs`

본문에는 공통 헤더, `h1`, 장르와 개발 상태, 소개, 특징, 개발 뉴스 연결, 커뮤니티 연결, 메인 복귀, 공통 푸터를 포함한다. 모든 내부 링크는 루트 절대 경로를 사용한다.

- [ ] **5단계: 반응형 공개 페이지 스타일 구현**

`public/project-page.css`에 다음 구간을 구현한다.

- 1280px 이상: 대표 이미지와 소개를 2열 배치
- 768px~1279px: 축소된 2열과 특징 카드 2열
- 767px 이하: 전체 1열과 44px 이상 버튼
- `prefers-reduced-motion: reduce`: 전환 제거
- `:focus-visible`: 청록색 외곽선
- 이미지 누락 대체 블록: 제목 문자와 그라데이션 배경

- [ ] **6단계: 공통 페이지 29개 생성과 검사**

실행:

```powershell
node scripts/generate-project-pages.mjs # 공통 공개 페이지 생성
node --test tests/public-project-pages.test.mjs # 생성 결과 검사
```

예상 결과: 29개 공통 페이지 생성, 내부 문서형 제목 0개, 테스트 통과.

- [ ] **7단계: 공통 페이지 커밋**

```powershell
git add scripts/generate-project-pages.mjs public/project-page.mjs public/project-page.css public/project_* tests/public-project-pages.test.mjs # 공통 페이지 파일 추가
git commit -m "feat: generate public game introduction pages" # 공통 페이지 커밋
```

---
### Task 4: 특화 프로젝트 6개 공개 문구 정리

**파일:**
- 수정: `public/project_b/ProjectB_Main.html`
- 수정: `public/project_c/ProjectC_Main.html`
- 수정: `public/project_d/ProjectD_Main.html`
- 수정: `public/project_h/ProjectH_Main.html`
- 수정: `public/project_l/ProjectL_Main.html`
- 수정: `public/project_eta/ProjectEta_Main.html`
- 수정: `tests/public-project-pages.test.mjs`

**인터페이스:**
- 입력: 기존 전용 페이지 구조와 스크립트
- 출력: `data-public-project-page`와 `data-project-id`가 있는 공개 페이지
- 보장: 전용 스크립트, 성인 인증 표시, 에타 초대장과 합성 도감 유지

- [ ] **1단계: 실패하는 특화 페이지 계약 테스트 작성**

6개 파일 각각에 대해 다음을 검사한다.

- 브라우저 제목에 `기획서`, `기획 초안`, `메인 아카이브` 없음
- `data-public-project-page`와 정확한 `data-project-id` 존재
- `/responsive-shell.css`, `/responsive-nav.mjs`, `/privacy-consent.mjs` 유지
- B의 아카이브 기능, C의 카드 시스템 링크, D의 캐릭터·세력 링크, H의 성인 표시, L의 리듬 기능, η의 초대장·합성 도감 선택자 유지

- [ ] **2단계: 테스트가 실패하는지 확인**

실행:

```powershell
node --test tests/public-project-pages.test.mjs # 특화 페이지 계약 테스트
```

예상 결과: D와 일부 페이지의 내부 문서형 제목과 공개 루트 누락으로 실패.

- [ ] **3단계: 공개 제목과 소개 문구 수정**

내부 기능명으로 필요한 `아카이브`는 섹션 이름으로 유지할 수 있지만 브라우저 제목과 페이지 대표 문구에서는 제거한다. 공개 제목 형식은 `[게임명 또는 프로젝트명] | 게임 소개`로 통일한다.

기존 스크립트 태그, ID, 클래스, 데이터 배열은 변경하지 않는다. H 페이지는 기존 성인 인증 대상 경로와 이미지 안전 처리를 유지한다.

- [ ] **4단계: 특화 페이지와 기존 기능 테스트 통과 확인**

실행:

```powershell
node --test tests/public-project-pages.test.mjs tests/project-eta-page.test.mjs tests/project-eta-fusion.test.mjs tests/age-gate.test.mjs # 특화 기능 회귀 검사
```

예상 결과: 전체 테스트 통과.

- [ ] **5단계: 특화 페이지 커밋**

```powershell
git add public/project_b public/project_c public/project_d public/project_h public/project_l public/project_eta tests/public-project-pages.test.mjs # 특화 페이지 추가
git commit -m "feat: present special projects as public pages" # 특화 페이지 커밋
```

---
### Task 5: 메인 게임 목록과 커뮤니티를 공개 데이터에 연결

**파일:**
- 수정: `public/game-catalog.mjs`
- 수정: `public/community-data.mjs`
- 수정: `public/main.html`
- 수정: `tests/game-catalog.test.mjs`
- 수정: `tests/community-page.test.mjs`
- 수정: `tests/website-content.test.mjs`

**인터페이스:**
- 입력: `GAME_PROJECTS`, `FEATURED_PROJECT_IDS`, `getGameProject(id)`
- 출력: 메인 카드의 제목·상태·주소·성인 여부와 커뮤니티 선택 목록
- 보장: 기존 검색, 복합 필터, 12개씩 더 보기 유지

- [ ] **1단계: 실패하는 메인·커뮤니티 연결 테스트 작성**

```js
test("메인과 커뮤니티는 같은 35개 프로젝트 이름을 사용한다", () => // 데이터 공유 테스트
{ // 테스트 시작
    assert.deepEqual(COMMUNITY_GAMES.map((game) => game.id), GAME_PROJECTS.map((project) => project.id)); // 식별자 순서 확인
    assert.deepEqual(COMMUNITY_GAMES.map((game) => game.label), GAME_PROJECTS.map((project) => project.title)); // 제목 공유 확인
}); // 테스트 끝
```

`main.html`에서 `기획서 ✔`, `기획 초안`, `기획 준비 중`이 0회인지 검사하고, `game-catalog.mjs`가 `game-projects.mjs`를 가져오는지 검사한다.

- [ ] **2단계: 테스트가 실패하는지 확인**

실행:

```powershell
node --test tests/game-catalog.test.mjs tests/community-page.test.mjs tests/website-content.test.mjs # 데이터 연결 테스트
```

예상 결과: 중복 데이터와 기존 카드 문구 때문에 실패.

- [ ] **3단계: 게임 목록 모듈 연결**

`game-catalog.mjs`는 `FEATURED_GAME_IDS` 자체 상수를 제거하고 `FEATURED_PROJECT_IDS`를 사용한다. DOM 카드에서 읽던 상태는 `getGameProject(id)`의 `developmentStatus`를 우선하고, 등록 데이터가 없을 때만 기존 DOM 값을 안전한 대체값으로 사용한다.

메인 카드 하단 문구는 공개 상태에 따라 `대표 프로젝트`, `개발 중`, `기획 단계`로 갱신한다. 성인 여부는 기존 `data-adult-game` 속성과 공개 데이터를 함께 검사하되 인증 흐름은 `age-gate.mjs`에 그대로 맡긴다.

- [ ] **4단계: 커뮤니티 게임 목록 파생**

```js
export const COMMUNITY_GAMES = Object.freeze(GAME_PROJECTS.map((project) => // 커뮤니티 게임 변환
{ // 변환 시작
    return Object.freeze({ id: project.id, label: project.title, hashtag: project.hashtag }); // 커뮤니티 항목 반환
})); // 변환 끝
```

`hashtag`는 작업 2에서 기존 35개 값을 그대로 옮긴 필드를 사용하며 이 작업에서는 새 필드를 추가하지 않는다.

- [ ] **5단계: 연결 테스트와 기존 검색 테스트 통과 확인**

실행:

```powershell
node --test tests/game-projects.test.mjs tests/game-catalog.test.mjs tests/community-page.test.mjs tests/website-content.test.mjs # 프로젝트 데이터 회귀 검사
```

예상 결과: 전체 테스트 통과.

- [ ] **6단계: 데이터 연결 커밋**

```powershell
git add public/game-projects.mjs public/game-catalog.mjs public/community-data.mjs public/main.html tests/game-projects.test.mjs tests/game-catalog.test.mjs tests/community-page.test.mjs tests/website-content.test.mjs # 연결 파일 추가
git commit -m "refactor: share public project data across pages" # 데이터 연결 커밋
```

---
### Task 6: 전체 보안·화면·배포 검증

**파일:**
- 수정: `README.md`
- 수정: `tests/project-archive.test.mjs`
- 수정: `tests/public-project-pages.test.mjs`

**인터페이스:**
- 입력: 작업 1~5의 전체 결과
- 출력: 배포 가능한 공개 페이지와 검증 기록

- [ ] **1단계: 최종 공개 범위 테스트 추가**

다음 조건을 자동 검사한다.

- 공개 프로젝트 메인 35개 모두 존재
- 29개 공통 페이지와 6개 특화 페이지 구분 일치
- 공개 제목의 내부 문서형 문구 0개
- `public` 안에 `internal/project-archives` 경로 없음
- 메인 카드 상세 주소 35개 모두 실제 파일 존재
- H, U, V가 성인 보호 경로 목록에 존재
- 공통 페이지의 이미지 `alt`, `h1`, 키보드 링크 존재
- 모든 공개 HTML의 공통 반응형 자원 유지

- [ ] **2단계: README 공개 범위 설명 추가**

README에 다음 사실을 기록한다.

- 공개 페이지는 `public`의 방문자용 정보만 제공
- 변경 전 기획 HTML은 `internal/project-archives`에 보존
- `internal`은 웹 배포 대상이 아니지만 공개 GitHub 저장소에서는 열람 가능
- 실제 기밀 자료는 비공개 저장소로 이동 필요
- 공통 페이지 재생성 명령은 `node scripts/generate-project-pages.mjs`

- [ ] **3단계: 전체 자동 검증**

실행:

```powershell
node --test tests/*.test.mjs # 전체 Node 테스트
node node_modules/typescript/bin/tsc --noEmit # 타입 검사
node node_modules/next/dist/bin/next build # 운영 빌드
git diff --check # 공백 오류 검사
```

예상 결과: 모든 테스트 통과, TypeScript 종료 코드 0, Next.js 빌드 성공, 공백 오류 0개.

- [ ] **4단계: 브라우저 화면 검사**

다음 화면을 PC, 태블릿 가로, 모바일에서 검사한다.

- 메인 대표 프로젝트와 검색·필터
- 공통 소개형 Project A
- 공통 준비 중 Project E
- 특화 Project B
- 성인 공통 Project U의 인증 전 화면
- 성인 특화 Project H의 인증 전 화면
- Project η 초대장과 합성 도감

확인 항목은 가로 스크롤 없음, 상태 문구 표시, 이미지 대체 처리, 메인 복귀, 뉴스·커뮤니티 이동, 성인 모자이크 유지다.

- [ ] **5단계: 최종 커밋과 저장소 상태 확인**

```powershell
git add README.md tests public scripts internal/project-archives # 최종 파일 추가
git commit -m "docs: document public game page workflow" # 최종 문서 커밋
git status --short # 작업 상태 확인
git log --oneline -8 # 최근 커밋 확인
```

예상 결과: 빈 작업 상태와 설계·계획 이후 6개 구현 커밋 확인.

---
## 실행 방향

이 계획은 앞 작업의 출력이 다음 작업의 입력이 되는 순차 구조다. 원본 보관을 먼저 완료하지 않으면 공개 페이지 변환을 시작하지 않는다. 각 작업은 실패 테스트, 최소 구현, 통과 테스트, 커밋 순서로 진행한다.

독립 하위 작업보다 파일 간 연결 의존성이 크므로 동일 작업자가 순서대로 구현하는 네이티브 실행이 적합하다. 마지막에 전체 변경을 한 번 더 검토하고 `master`에 반영한다.
