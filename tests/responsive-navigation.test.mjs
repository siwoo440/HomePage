import assert from "node:assert/strict"; // 엄격 비교 도구
import test from "node:test"; // 테스트 실행 도구
import { getLoginUrl, initializeResponsiveNavigation, isDrawerViewport, RESPONSIVE_NAV_ITEMS } from "../public/responsive-nav.mjs"; // 내비게이션 도구
import { createNavigationEnvironment } from "./helpers/navigation-environment.mjs"; // 내비게이션 문서 대역

test("960px 미만에서만 서랍 메뉴를 사용한다", () => // 화면 구간 테스트
{ // 테스트 시작
    assert.equal(isDrawerViewport(767), true); // 모바일 서랍 확인
    assert.equal(isDrawerViewport(959), true); // 좁은 태블릿 서랍 확인
    assert.equal(isDrawerViewport(960), false); // 가로 메뉴 전환 확인
    assert.equal(isDrawerViewport(1280), false); // PC 가로 메뉴 확인
}); // 테스트 끝

test("중첩 페이지도 루트 절대 메뉴 주소를 사용한다", () => // 메뉴 주소 테스트
{ // 테스트 시작
    assert.equal(RESPONSIVE_NAV_ITEMS.find((item) => item.id === "goods")?.href, "/goods.html"); // 굿즈 주소 확인
    assert.equal(RESPONSIVE_NAV_ITEMS.find((item) => item.id === "games")?.href, "/main.html#games"); // 게임 주소 확인
    assert.equal(getLoginUrl("/project_eta/ProjectEta_Main.html"), "/login?returnTo=%2Fproject_eta%2FProjectEta_Main.html"); // 로그인 복귀 주소 확인
}); // 테스트 끝

test("반복 초기화에도 메뉴 요소를 한 번만 만든다", () => // 중복 초기화 테스트
{ // 테스트 시작
    const environment = createNavigationEnvironment(); // 문서 대역 생성
    const first = initializeResponsiveNavigation(environment.root, environment.view); // 첫 초기화
    const second = initializeResponsiveNavigation(environment.root, environment.view); // 반복 초기화
    assert.equal(first, second); // 제어기 재사용 확인
    assert.equal(environment.createdByRole("toggle").length, 1); // 버튼 한 개 확인
    assert.equal(environment.createdByRole("drawer").length, 1); // 메뉴 한 개 확인
    assert.equal(environment.createdByRole("overlay").length, 1); // 배경 한 개 확인
}); // 테스트 끝

test("메인 주소에서는 홈 메뉴만 현재 페이지로 표시한다", () => // 홈 현재 상태 테스트
{ // 테스트 시작
    const environment = createNavigationEnvironment({ pathname: "/main.html", hash: "" }); // 메인 환경 생성
    initializeResponsiveNavigation(environment.root, environment.view); // 메뉴 초기화
    const currentItems = environment.createdByRole("drawer-control").filter((control) => control.getAttribute("aria-current") === "page"); // 현재 메뉴 조회
    assert.deepEqual(currentItems.map((control) => control.dataset.navId), ["home"]); // 홈 단일 상태 확인
}); // 테스트 끝

test("게임 해시에서는 게임 메뉴만 현재 페이지로 표시한다", () => // 게임 현재 상태 테스트
{ // 테스트 시작
    const environment = createNavigationEnvironment({ pathname: "/main.html", hash: "#games" }); // 게임 환경 생성
    initializeResponsiveNavigation(environment.root, environment.view); // 메뉴 초기화
    const currentItems = environment.createdByRole("drawer-control").filter((control) => control.getAttribute("aria-current") === "page"); // 현재 메뉴 조회
    assert.deepEqual(currentItems.map((control) => control.dataset.navId), ["games"]); // 게임 단일 상태 확인
}); // 테스트 끝

test("960px 전환 시 메뉴와 스크롤 잠금을 해제한다", () => // 너비 변경 테스트
{ // 테스트 시작
    const environment = createNavigationEnvironment({ width: 390 }); // 모바일 환경 생성
    const controller = initializeResponsiveNavigation(environment.root, environment.view); // 메뉴 초기화
    controller.open(); // 메뉴 열기
    environment.resizeTo(960); // 태블릿 가로 전환
    assert.equal(environment.root.body.classList.contains("responsive-nav-open"), false); // 스크롤 잠금 해제 확인
    assert.equal(environment.drawer.hidden, true); // 메뉴 닫힘 확인
}); // 테스트 끝

test("Escape와 닫기 동작은 메뉴 버튼으로 초점을 돌려준다", () => // 닫기 초점 테스트
{ // 테스트 시작
    const environment = createNavigationEnvironment(); // 문서 대역 생성
    const controller = initializeResponsiveNavigation(environment.root, environment.view); // 메뉴 초기화
    controller.open(); // 메뉴 열기
    environment.pressKey("Escape"); // 닫기 키 입력
    assert.equal(environment.drawer.hidden, true); // 메뉴 닫힘 확인
    assert.equal(environment.root.activeElement, environment.toggle); // 버튼 초점 확인
}); // 테스트 끝

test("Tab 키는 열린 메뉴의 첫 요소와 마지막 요소 사이를 순환한다", () => // 초점 순환 테스트
{ // 테스트 시작
    const environment = createNavigationEnvironment(); // 문서 대역 생성
    const controller = initializeResponsiveNavigation(environment.root, environment.view); // 메뉴 초기화
    controller.open(); // 메뉴 열기
    const focusable = environment.createdByRole("drawer-control"); // 메뉴 조작 요소 조회
    const first = focusable[0]; // 첫 조작 요소
    const last = focusable.at(-1); // 마지막 조작 요소
    last.focus(); // 마지막 요소 초점
    environment.pressKey("Tab"); // 다음 초점 입력
    assert.equal(environment.root.activeElement, first); // 첫 요소 순환 확인
    first.focus(); // 첫 요소 초점
    environment.pressKey("Tab", true); // 이전 초점 입력
    assert.equal(environment.root.activeElement, last); // 마지막 요소 순환 확인
}); // 테스트 끝

test("내비게이션 헤더가 없으면 요소를 만들지 않는다", () => // 헤더 누락 테스트
{ // 테스트 시작
    const environment = createNavigationEnvironment({ withRoot: false }); // 헤더 없는 환경 생성
    const controller = initializeResponsiveNavigation(environment.root, environment.view); // 메뉴 초기화
    assert.equal(controller, null); // 안전 종료 확인
    assert.equal(environment.createdByRole("toggle").length, 0); // 버튼 미생성 확인
}); // 테스트 끝

test("문의 모달이 없으면 contact 해시를 유지하고 오류 없이 종료한다", () => // 문의창 누락 테스트
{ // 테스트 시작
    const environment = createNavigationEnvironment({ pathname: "/main.html", hash: "#contact" }); // 문의 해시 환경 생성
    assert.doesNotThrow(() => initializeResponsiveNavigation(environment.root, environment.view)); // 안전 초기화 확인
    assert.equal(environment.view.location.hash, "#contact"); // 문의 해시 유지 확인
    assert.equal(environment.historyCalls.length, 0); // 주소 미변경 확인
}); // 테스트 끝

test("문의 모달이 있으면 contact 해시로 창을 열고 해시를 정리한다", () => // 문의창 열기 테스트
{ // 테스트 시작
    const environment = createNavigationEnvironment({ pathname: "/main.html", hash: "#contact", withContact: true }); // 문의창 환경 생성
    initializeResponsiveNavigation(environment.root, environment.view); // 메뉴 초기화
    assert.equal(environment.contactModal.classList.contains("open"), true); // 문의창 열림 확인
    assert.equal(environment.view.location.hash, "#"); // 해시 정리 확인
}); // 테스트 끝

test("플레이풀 랩 메뉴는 시스템 다크 선호를 초기 모드로 사용한다", () => // 초기 다크 모드 테스트
{ // 테스트 시작
    const environment = createNavigationEnvironment({ theme: "playful-lab", prefersDark: true }); // 다크 선호 환경 생성
    initializeResponsiveNavigation(environment.root, environment.view); // 메뉴 초기화
    const themeToggle = environment.createdByRole("theme-toggle")[0]; // 테마 버튼 조회
    assert.equal(environment.root.body.dataset.colorMode, "dark"); // 다크 모드 적용 확인
    assert.equal(themeToggle?.textContent, "다크 모드 끄기"); // 버튼 문구 확인
    assert.equal(themeToggle?.getAttribute("aria-pressed"), "true"); // 버튼 상태 확인
}); // 테스트 끝

test("저장된 밝은 모드는 시스템 다크 선호보다 우선한다", () => // 저장 모드 우선 테스트
{ // 테스트 시작
    const environment = createNavigationEnvironment({ theme: "playful-lab", prefersDark: true, storedColorMode: "light" }); // 저장 모드 환경 생성
    initializeResponsiveNavigation(environment.root, environment.view); // 메뉴 초기화
    const themeToggle = environment.createdByRole("theme-toggle")[0]; // 테마 버튼 조회
    assert.equal(environment.root.body.dataset.colorMode, "light"); // 밝은 모드 적용 확인
    assert.equal(themeToggle?.textContent, "다크 모드 켜기"); // 버튼 문구 확인
    assert.equal(themeToggle?.getAttribute("aria-pressed"), "false"); // 버튼 상태 확인
}); // 테스트 끝

test("테마 버튼은 다크 모드를 전환하고 선택을 저장한다", () => // 테마 전환 테스트
{ // 테스트 시작
    const environment = createNavigationEnvironment({ theme: "playful-lab", storedColorMode: "light" }); // 밝은 모드 환경 생성
    initializeResponsiveNavigation(environment.root, environment.view); // 메뉴 초기화
    const themeToggle = environment.createdByRole("theme-toggle")[0]; // 테마 버튼 조회
    themeToggle.dispatch("click"); // 테마 버튼 선택
    assert.equal(environment.root.body.dataset.colorMode, "dark"); // 다크 모드 전환 확인
    assert.equal(themeToggle.textContent, "다크 모드 끄기"); // 전환 문구 확인
    assert.deepEqual(environment.storageWrites.at(-1), { key: "devforge-color-mode", value: "dark" }); // 선택 저장 확인
}); // 테스트 끝

test("테마 버튼은 밝은 모드의 해와 다크 모드의 달을 표시한다", async () => // 테마 아이콘 테스트
{ // 테스트 시작
    const cssUrl = new URL("../public/responsive-shell.css", import.meta.url); // 메뉴 스타일 경로
    const css = await import("node:fs/promises").then(({ readFile }) => readFile(cssUrl, "utf8")); // 메뉴 스타일 읽기
    assert.match(css, /responsive-nav-theme-toggle::after[\s\S]*?content:\s*"☀️"/); // 밝은 모드 해 확인
    assert.match(css, /aria-pressed="true"\]::after[\s\S]*?content:\s*"🌙"/); // 다크 모드 달 확인
}); // 테스트 끝

test("일반 메뉴 여섯 칸은 같은 카드형 배경과 테두리를 사용한다", async () => // 일반 메뉴 통일 테스트
{ // 테스트 시작
    const cssUrl = new URL("../public/responsive-shell.css", import.meta.url); // 메뉴 스타일 경로
    const css = await import("node:fs/promises").then(({ readFile }) => readFile(cssUrl, "utf8")); // 메뉴 스타일 읽기
    assert.match(css, /\.responsive-nav-link \/\* 일반 메뉴 카드 \*\/[\s\S]*?background:\s*rgba\(255, 255, 255, 0\.04\)[\s\S]*?border-color:\s*var\(--responsive-nav-line\)/); // 일반 메뉴 카드 확인
}); // 테스트 끝

test("개별 프로젝트 메뉴에는 테마 버튼을 만들지 않는다", () => // 프로젝트 제외 테스트
{ // 테스트 시작
    const environment = createNavigationEnvironment({ pathname: "/project_eta/ProjectEta_Main.html" }); // 프로젝트 환경 생성
    initializeResponsiveNavigation(environment.root, environment.view); // 메뉴 초기화
    assert.equal(environment.createdByRole("theme-toggle").length, 0); // 테마 버튼 제외 확인
    assert.equal(environment.root.body.dataset.colorMode, undefined); // 색상 모드 미적용 확인
}); // 테스트 끝
