---

# DEVFORGE Community Social Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and connect a responsive `community.html` that separates six social platforms with light brand-color backgrounds, filters demo content by game hashtag, and switches YouTube to live API data when a server-side key is configured.

**Architecture:** Keep the public experience as static HTML, CSS, and ES modules, matching the existing goods and development-news pages. Add a small Next.js server route and isolated YouTube adapter so the API key remains private, while normalized demo content keeps every platform usable before credentials exist.

**Tech Stack:** Next.js 16 App Router, TypeScript, static HTML/CSS, browser ES modules, Node.js test runner, YouTube Data API v3

**Spec:** `docs/superpowers/specs/2026-09-12-community-social-hub-design.md`

---

## Global Constraints

- Preserve the existing DEVFORGE dark neon visual system and shared header structure.
- Use light platform backgrounds with these exact base colors: Discord `rgba(88, 101, 242, 0.09)`, YouTube `rgba(255, 0, 0, 0.07)`, X `rgba(255, 255, 255, 0.04)`, Instagram `rgba(225, 48, 108, 0.07)`, Facebook `rgba(24, 119, 242, 0.08)`, TikTok `rgba(105, 201, 208, 0.07)`.
- Never expose `YOUTUBE_API_KEY` to browser code or commit a real credential.
- Never send an arbitrary browser search string to YouTube; accept only configured game IDs.
- Keep all platform content on the page when one external API fails.
- Label fallback content as `시연 화면` or `연동 준비 중` so it cannot be mistaken for live data.
- Do not add external libraries or modify the package lockfile.
- Use Allman style and short Korean comments on every added code line.
- Preserve the untracked user file `WORK-HANDOFF.md`.

---

## File Map

- Create `lib/community/types.ts`: normalized platform and YouTube response types.
- Create `lib/community/games.ts`: allowed game IDs, labels, hashtags, and resolver.
- Create `lib/community/youtube.ts`: YouTube requests, duration parsing, content classification, and response normalization.
- Create `app/api/community/youtube/route.ts`: validated public API route and safe error responses.
- Create `public/community-data.mjs`: browser-safe platform configuration and labeled demo content.
- Create `public/community.mjs`: game filter, URL state, rendering, and YouTube request handling.
- Create `public/community.css`: page layout, six light brand backgrounds, cards, states, and responsive rules.
- Create `public/community.html`: common header, filter, featured content, six platform regions, contact dialog.
- Modify `public/main.html`: community header link, section detail button, and six platform anchor links.
- Modify `public/devlog.html`: community header link.
- Modify `public/goods.html`: community header link.
- Modify `.env.example`: server-only YouTube key name.
- Create `tests/community-games.test.mjs`: game allowlist contract.
- Create `tests/community-youtube.test.mjs`: adapter and route contract.
- Create `tests/community-page.test.mjs`: page structure, colors, navigation, and fallback contract.

---

### Task 1: Lock the game hashtag and normalized content contracts

**Files:**

- Create: `lib/community/types.ts`
- Create: `lib/community/games.ts`
- Create: `tests/community-games.test.mjs`

**Interfaces:**

- Produces: `COMMUNITY_GAMES: readonly CommunityGame[]`
- Produces: `resolveCommunityGame(gameId: string): CommunityGame | null`
- Produces: `CommunityContentItem` and `YouTubeFeedResponse`

- [ ] **Step 1: Write the failing allowlist test**

```javascript
import assert from "node:assert/strict"; // 엄격 검증 도구
import test from "node:test"; // 테스트 실행 도구
import { COMMUNITY_GAMES, resolveCommunityGame } from "../lib/community/games.ts"; // 게임 설정 도구

test("커뮤니티 게임은 고유 식별자와 해시태그를 제공한다", () => // 게임 설정 검증
{ // 테스트 시작
    assert.ok(COMMUNITY_GAMES.length >= 35); // 전체 게임 수 확인
    assert.equal(new Set(COMMUNITY_GAMES.map((game) => game.id)).size, COMMUNITY_GAMES.length); // 식별자 중복 확인
    assert.ok(COMMUNITY_GAMES.every((game) => game.hashtag.startsWith("#"))); // 해시태그 형식 확인
}); // 테스트 끝

test("허용되지 않은 게임은 검색 설정으로 변환하지 않는다", () => // 임의 검색 차단 검증
{ // 테스트 시작
    assert.equal(resolveCommunityGame("../../secret"), null); // 위험 식별자 차단 확인
    assert.equal(resolveCommunityGame("unknown-game"), null); // 미등록 식별자 차단 확인
}); // 테스트 끝
```

- [ ] **Step 2: Run the test and confirm the missing-module failure**

Run: `node --test tests/community-games.test.mjs`

Expected: FAIL because `lib/community/games.ts` does not exist.

- [ ] **Step 3: Add the minimal shared types and allowlist**

```typescript
export type CommunityPlatform = "discord" | "youtube" | "x" | "instagram" | "facebook" | "tiktok"; // 플랫폼 이름
export type CommunityContentType = "video" | "short_candidate" | "live" | "image" | "post" | "notice"; // 콘텐츠 종류

export interface CommunityGame // 커뮤니티 게임 형식
{ // 형식 시작
    id: string; // 게임 식별자
    label: string; // 화면 이름
    hashtag: string; // 대표 해시태그
    searchTerms: readonly string[]; // 검색 보조어
} // 형식 끝

export interface CommunityContentItem // 공통 콘텐츠 형식
{ // 형식 시작
    id: string; // 콘텐츠 식별자
    platform: CommunityPlatform; // 플랫폼 이름
    gameId: string; // 게임 식별자
    title: string; // 콘텐츠 제목
    author: string; // 작성자 이름
    publishedAt: string; // 게시 시각
    url: string; // 원본 주소
    thumbnailUrl: string | null; // 썸네일 주소
    contentType: CommunityContentType; // 콘텐츠 종류
    metrics: { views?: number; likes?: number; comments?: number; shares?: number }; // 반응 지표
    isDemo: boolean; // 시연 여부
} // 형식 끝
```

Create `COMMUNITY_GAMES` from every game card currently linked in `public/main.html`. Add a synthetic `all` option only in browser UI; it must not be accepted by the server resolver.

- [ ] **Step 4: Run the allowlist test**

Run: `node --test tests/community-games.test.mjs`

Expected: PASS with 2 tests and 0 failures.

- [ ] **Step 5: Commit the contract**

```powershell
git add -- lib/community/types.ts lib/community/games.ts tests/community-games.test.mjs # 계약 파일 준비
git commit -m "feat: 커뮤니티 게임 해시태그 계약 추가" # 계약 변경 기록
```

---

### Task 2: Build the private YouTube adapter and public route

**Files:**

- Create: `lib/community/youtube.ts`
- Create: `app/api/community/youtube/route.ts`
- Create: `tests/community-youtube.test.mjs`
- Modify: `.env.example`

**Interfaces:**

- Consumes: `resolveCommunityGame(gameId)` and `CommunityContentItem`
- Produces: `parseYouTubeDuration(value: string): number`
- Produces: `classifyYouTubeContent(durationSeconds: number, liveState: string): CommunityContentType`
- Produces: `fetchYouTubeCommunityFeed(gameId: string, apiKey: string): Promise<CommunityContentItem[]>`
- Produces: `GET /api/community/youtube?game={gameId}` returning `{ configured: boolean, items: CommunityContentItem[], message?: string }`

- [ ] **Step 1: Write failing duration, classification, and safety tests**

```javascript
import assert from "node:assert/strict"; // 엄격 검증 도구
import test from "node:test"; // 테스트 실행 도구
import { classifyYouTubeContent, parseYouTubeDuration } from "../lib/community/youtube.ts"; // 유튜브 변환 도구

test("유튜브 길이와 방송 상태를 화면 종류로 변환한다", () => // 콘텐츠 종류 검증
{ // 테스트 시작
    assert.equal(parseYouTubeDuration("PT2M30S"), 150); // 초 단위 변환 확인
    assert.equal(classifyYouTubeContent(150, "none"), "short_candidate"); // 짧은 영상 확인
    assert.equal(classifyYouTubeContent(900, "none"), "video"); // 일반 영상 확인
    assert.equal(classifyYouTubeContent(0, "live"), "live"); // 생방송 확인
}); // 테스트 끝
```

Also read the route source and assert that it uses `process.env.YOUTUBE_API_KEY`, rejects an unknown game with status 400, returns `configured: false` without a key, requests `safeSearch=strict`, and never includes the key in the JSON body.

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `node --test tests/community-youtube.test.mjs`

Expected: FAIL because the adapter and route do not exist.

- [ ] **Step 3: Implement duration parsing and classification**

```typescript
export function parseYouTubeDuration(value: string): number // 영상 길이 변환
{ // 함수 시작
    const match = value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/); // 길이 구성 추출
    if (!match) // 형식 확인
    { // 조건 시작
        return 0; // 안전한 기본값
    } // 조건 끝
    return (Number(match[1] ?? 0) * 3600) + (Number(match[2] ?? 0) * 60) + Number(match[3] ?? 0); // 전체 초 반환
} // 함수 끝

export function classifyYouTubeContent(durationSeconds: number, liveState: string): CommunityContentType // 콘텐츠 종류 판정
{ // 함수 시작
    if (liveState === "live" || liveState === "upcoming") // 방송 상태 확인
    { // 조건 시작
        return "live"; // 방송 종류 반환
    } // 조건 끝
    return durationSeconds > 0 && durationSeconds <= 180 ? "short_candidate" : "video"; // 영상 길이 판정
} // 함수 끝
```

- [ ] **Step 4: Implement the server fetcher and route**

Build `search.list` parameters with `part=snippet`, `type=video`, `order=date`, `safeSearch=strict`, `regionCode=KR`, `relevanceLanguage=ko`, and `maxResults=8`. Fetch `videos.list` with `part=snippet,contentDetails,statistics,liveStreamingDetails` for the returned IDs. Set `next: { revalidate: 900 }` on both server fetches and normalize missing metrics to omitted values.

The route must return status 200 with `{ configured: false, items: [] }` when `YOUTUBE_API_KEY` is absent, status 400 for an invalid game, status 503 with a Korean message for an upstream failure, and status 200 with `Cache-Control: public, s-maxage=900, stale-while-revalidate=1800` on success.

- [ ] **Step 5: Document the server-only environment name**

```dotenv
YOUTUBE_API_KEY= # 유튜브 서버 키
```

- [ ] **Step 6: Run adapter and route tests**

Run: `node --test tests/community-games.test.mjs tests/community-youtube.test.mjs`

Expected: PASS with all focused tests and 0 failures.

- [ ] **Step 7: Commit the YouTube integration**

```powershell
git add -- .env.example lib/community app/api/community/youtube tests/community-youtube.test.mjs # 유튜브 파일 준비
git commit -m "feat: 게임별 유튜브 최신 영상 API 추가" # 유튜브 변경 기록
```

---

### Task 3: Build the six-region community page shell

**Files:**

- Create: `public/community.html`
- Create: `public/community.css`
- Create: `tests/community-page.test.mjs`

**Interfaces:**

- Produces: `#game-filter`, `#featured-community-content`, and platform regions `#discord`, `#youtube`, `#x`, `#instagram`, `#facebook`, `#tiktok`
- Produces: `.platform-region`, `.platform-status`, `.platform-feed`, and `.platform-channel-link`

- [ ] **Step 1: Write the failing page structure and visual contract test**

```javascript
import assert from "node:assert/strict"; // 엄격 검증 도구
import { readFile } from "node:fs/promises"; // 파일 읽기 도구
import test from "node:test"; // 테스트 실행 도구

test("커뮤니티 페이지가 여섯 플랫폼 영역과 게임 선택을 제공한다", async () => // 페이지 구조 검증
{ // 테스트 시작
    const html = await readFile("public/community.html", "utf8"); // 페이지 읽기
    for (const platform of ["discord", "youtube", "x", "instagram", "facebook", "tiktok"]) // 플랫폼 반복
    { // 반복 시작
        assert.match(html, new RegExp(`id="${platform}"`)); // 플랫폼 영역 확인
    } // 반복 끝
    assert.match(html, /id="game-filter"/); // 게임 선택 확인
    assert.match(html, /id="featured-community-content"/); // 대표 콘텐츠 확인
}); // 테스트 끝
```

Add CSS source assertions for all six exact background colors and HTML assertions for common header links, one status element per region, and one channel action per region.

- [ ] **Step 2: Run the focused page test and confirm failure**

Run: `node --test tests/community-page.test.mjs`

Expected: FAIL because `public/community.html` and `public/community.css` do not exist.

- [ ] **Step 3: Create the accessible static page shell**

```html
<section class="platform-region platform-youtube" id="youtube" aria-labelledby="youtube-title"> <!-- 유튜브 영역 -->
    <header class="platform-heading"> <!-- 플랫폼 제목 묶음 -->
        <div> <!-- 제목 정보 -->
            <p class="eyebrow">// VIDEO COMMUNITY</p> <!-- 영문 분류 -->
            <h2 id="youtube-title">YouTube</h2> <!-- 플랫폼 제목 -->
        </div> <!-- 제목 정보 끝 -->
        <span class="platform-status" data-platform-status="youtube">연동 준비 중</span> <!-- 연동 상태 -->
    </header> <!-- 플랫폼 제목 끝 -->
    <div class="platform-feed" data-platform-feed="youtube"></div> <!-- 콘텐츠 목록 -->
    <div class="platform-action" data-platform-action="youtube"></div> <!-- 채널 이동 영역 -->
</section> <!-- 유튜브 영역 끝 -->
```

Repeat the complete semantic structure for all six platforms with their own visible Korean descriptions. Include a compact hero, labeled game select, featured content region, common footer, and the existing contact dialog pattern.

- [ ] **Step 4: Add the platform backgrounds and responsive layout**

Use a maximum content width of `1200px`, `1rem` minimum body text, two-column card grids on desktop, and one column below `720px`. Make the region boundary visible with both a light background and a platform-colored left border. Keep all buttons at least `44px` high and ensure focus-visible outlines are not removed.

- [ ] **Step 5: Run the page contract test**

Run: `node --test tests/community-page.test.mjs`

Expected: PASS with all page structure and color assertions.

- [ ] **Step 6: Commit the page shell**

```powershell
git add -- public/community.html public/community.css tests/community-page.test.mjs # 페이지 파일 준비
git commit -m "feat: 여섯 영역 커뮤니티 페이지 추가" # 페이지 변경 기록
```

---

### Task 4: Add demo feeds, game filtering, and YouTube live-data switching

**Files:**

- Create: `public/community-data.mjs`
- Create: `public/community.mjs`
- Modify: `public/community.html`
- Modify: `tests/community-page.test.mjs`

**Interfaces:**

- Consumes: `GET /api/community/youtube?game={gameId}`
- Produces: `COMMUNITY_GAMES`, `PLATFORM_CHANNELS`, and `DEMO_COMMUNITY_ITEMS`
- Produces: `filterItemsByGame(items, gameId)` and `loadYouTubeFeed(gameId)`

- [ ] **Step 1: Write failing browser-module contract tests**

Extend `tests/community-page.test.mjs` to import `community-data.mjs`, assert six platform configurations, require every demo item to have `isDemo: true`, verify that missing channel URLs are `null`, and verify that each known game filter returns only matching or global items.

Also assert that `community.mjs` requests only `/api/community/youtube?game=`, sets the `game` URL parameter, displays the `시연 화면` label on fallback cards, and uses text content rather than HTML injection for external titles.

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `node --test tests/community-page.test.mjs`

Expected: FAIL because the browser modules do not exist.

- [ ] **Step 3: Add clearly labeled demo data and channel configuration**

```javascript
export const PLATFORM_CHANNELS = Object.freeze( // 채널 설정 시작
{ // 설정 객체 시작
    discord: null, // 디스코드 주소 준비 상태
    youtube: null, // 유튜브 주소 준비 상태
    x: null, // X 주소 준비 상태
    instagram: null, // 인스타그램 주소 준비 상태
    facebook: null, // 페이스북 주소 준비 상태
    tiktok: null, // 틱톡 주소 준비 상태
}); // 설정 객체 끝
```

Create at least two demo items per platform, using fictional DEVFORGE-specific copy and local game image thumbnails where relevant. Every item must use `isDemo: true`; do not invent follower counts, usernames, or external URLs.

- [ ] **Step 4: Implement filtering and rendering**

Populate the game select from browser-safe game data. On selection, update `?game=`, re-render all demo lists, and request YouTube only for a concrete game ID. Use `document.createElement`, `textContent`, and explicit attribute setters. A null channel URL must render a disabled `채널 주소 준비 중` control instead of an anchor.

- [ ] **Step 5: Implement YouTube fallback behavior**

When the API returns `configured: true` with items, replace only the YouTube demo list and featured card. When it returns `configured: false`, an empty list, status 400, status 503, or a network error, preserve the demo items and set the YouTube region status to `연동 준비 중`. Announce loading and completion through an `aria-live="polite"` status element.

- [ ] **Step 6: Run all community-focused tests**

Run: `node --test tests/community-games.test.mjs tests/community-youtube.test.mjs tests/community-page.test.mjs`

Expected: PASS with all community tests and 0 failures.

- [ ] **Step 7: Commit the interactive page**

```powershell
git add -- public/community.html public/community-data.mjs public/community.mjs tests/community-page.test.mjs # 상호작용 파일 준비
git commit -m "feat: 커뮤니티 게임 필터와 시연 피드 추가" # 상호작용 변경 기록
```

---

### Task 5: Connect every existing navigation entry

**Files:**

- Modify: `public/main.html`
- Modify: `public/devlog.html`
- Modify: `public/goods.html`
- Modify: `tests/community-page.test.mjs`

**Interfaces:**

- Consumes: anchors `community.html#discord`, `#youtube`, `#x`, `#instagram`, `#facebook`, and `#tiktok`
- Produces: a consistent `community.html` header link on all public top-level pages

- [ ] **Step 1: Write failing navigation tests**

Add assertions that the three existing public pages link their header community item to `community.html`, that the main community heading includes `상세 페이지로 이동 →`, and that all six main community cards use their matching `community.html#{platform}` target instead of `href="#"`.

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `node --test tests/community-page.test.mjs`

Expected: FAIL on the old `main.html#community` and `href="#"` links.

- [ ] **Step 3: Replace the navigation targets**

Change only community-related links. Preserve legal modal links that intentionally use `href="#"` with click handlers. Add the shared `.section-detail-link` button beside the main community heading and link it to `community.html`.

- [ ] **Step 4: Run navigation and existing page tests**

Run: `node --test tests/community-page.test.mjs tests/development-news.test.mjs tests/goods-page.test.mjs tests/site-integrity.test.mjs`

Expected: PASS with 0 failures and no regression in existing headers.

- [ ] **Step 5: Commit the connected navigation**

```powershell
git add -- public/main.html public/devlog.html public/goods.html tests/community-page.test.mjs # 연결 파일 준비
git commit -m "feat: 공통 메뉴를 커뮤니티 허브에 연결" # 연결 변경 기록
```

---

### Task 6: Verify build, runtime states, and responsive presentation

**Files:**

- Modify only files that fail a stated verification criterion.

**Interfaces:**

- Consumes: the complete community page, browser modules, YouTube route, and existing public pages.
- Produces: a tested local deliverable at `http://127.0.0.1:3000/community.html`.

- [ ] **Step 1: Configure the existing project execution profile**

Run: `node C:/Users/user/.codex/plugins/cache/openai-curated-remote/sites/0.1.59/scripts/configure-execution-profile.mjs`

Expected: a portable profile record with the existing project configuration preserved.

- [ ] **Step 2: Run the complete automated suite**

Run: `node --test tests/*.test.mjs`

Expected: all tests pass with 0 failures.

- [ ] **Step 3: Run TypeScript verification**

Run: `node node_modules/typescript/bin/tsc --noEmit`

Expected: exit code 0 with no diagnostics.

- [ ] **Step 4: Run the production build**

Run: `node node_modules/next/dist/bin/next build`

Expected: successful optimized build including `/api/community/youtube`.

- [ ] **Step 5: Verify the no-key runtime state**

Request `http://127.0.0.1:3000/api/community/youtube?game=project-a` without `YOUTUBE_API_KEY`.

Expected: status 200, `{ configured: false, items: [] }`, no credential text, and a working community page with demo cards.

- [ ] **Step 6: Perform browser checks at desktop and mobile widths**

At desktop width, verify the common header, game selector, featured card, six separated light-color regions, and platform buttons. At mobile width near `390px`, verify one-column cards, readable Korean text, no horizontal overflow, and 44px controls. Change the game filter and confirm the URL, hashtag label, visible demo cards, and YouTube loading status update together.

- [ ] **Step 7: Verify all navigation paths**

Click the community link from `main.html`, `goods.html`, and `devlog.html`. From the main page, click at least the YouTube and Discord cards and confirm their matching community anchors. Return the browser to `community.html` for handoff.

- [ ] **Step 8: Inspect the final diff and commit verification fixes**

Run: `git diff --check`

Expected: no whitespace errors. Stage only verified implementation files and leave `WORK-HANDOFF.md` untouched.

```powershell
git add -- app/api/community lib/community public/community.html public/community.css public/community-data.mjs public/community.mjs public/main.html public/devlog.html public/goods.html tests .env.example # 최종 파일 준비
git commit -m "test: 커뮤니티 소셜 허브 검증 완료" # 검증 변경 기록
```

