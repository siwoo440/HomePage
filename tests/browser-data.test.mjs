import assert from "node:assert/strict"; // 엄격 비교 도구
import fs from "node:fs"; // 파일 읽기 도구
import test from "node:test"; // 테스트 실행 도구
import { BROWSER_DATA_ITEMS, describeBrowserDataValue, describeRemovalResult, getClearAllIds, readBrowserDataSnapshot, removeBrowserDataItems, resolveBrowserStorages } from "../public/browser-data.mjs"; // 브라우저 데이터 도구
import { FAVORITE_PROJECTS_KEY, RECENT_PROJECTS_KEY } from "../public/site-experience.mjs"; // 프로젝트 보관 키
import { MEMBER_DEMO_STORAGE_KEY } from "../public/member-session.mjs"; // 시연 회원 키
import { INVITATION_SEEN_KEY } from "../public/project_eta/ProjectEtaInvitation.mjs"; // 초대장 기록 키
import { COLOR_MODE_STORAGE_KEY } from "../public/responsive-nav.mjs"; // 화면 모드 키
import { PRIVACY_CONSENT_STORAGE_KEY } from "../public/privacy-consent.mjs"; // 동의 저장 키

class MemoryStorage // 메모리 저장소 대체
{ // 클래스 시작
    constructor(entries = {}) // 초기값 설정
    { // 생성자 시작
        this.values = new Map(Object.entries(entries)); // 저장값 목록
    } // 생성자 끝
    getItem(key) // 저장값 읽기
    { // 함수 시작
        return this.values.has(key) ? this.values.get(key) : null; // 저장값 반환
    } // 함수 끝
    setItem(key, value) // 저장값 쓰기
    { // 함수 시작
        this.values.set(key, String(value)); // 문자열 저장
    } // 함수 끝
    removeItem(key) // 저장값 삭제
    { // 함수 시작
        this.values.delete(key); // 항목 삭제
    } // 함수 끝
} // 클래스 끝

const item = (id) => BROWSER_DATA_ITEMS.find((candidate) => candidate.id === id); // 항목 조회 도구
const consentValue = (overrides = {}) => JSON.stringify({ version: 1, analytics: true, ads: false, updatedAt: "2026-10-01T01:00:00.000Z", ...overrides }); // 동의 저장값 생성

test("관리 항목의 저장 키는 실제 기능의 저장 키와 일치한다", () => // 저장 키 동기화 검사
{ // 테스트 시작
    assert.equal(item("privacy-consent").key, PRIVACY_CONSENT_STORAGE_KEY); // 동의 키 확인
    assert.equal(item("favorite-projects").key, FAVORITE_PROJECTS_KEY); // 관심 프로젝트 키 확인
    assert.equal(item("recent-projects").key, RECENT_PROJECTS_KEY); // 최근 프로젝트 키 확인
    assert.equal(item("demo-member").key, MEMBER_DEMO_STORAGE_KEY); // 시연 회원 키 확인
    assert.equal(item("eta-invitation").key, INVITATION_SEEN_KEY); // 초대장 키 확인
    assert.equal(item("color-mode").key, COLOR_MODE_STORAGE_KEY); // 화면 모드 키 확인
    assert.deepEqual(BROWSER_DATA_ITEMS.filter((candidate) => candidate.storage === "session").map((candidate) => candidate.id), ["demo-member", "eta-invitation"]); // 세션 저장 항목 확인
}); // 테스트 끝

test("분석 동의는 선택·이전 버전·손상 상태를 구분해 요약한다", () => // 동의 요약 검사
{ // 테스트 시작
    const consent = item("privacy-consent"); // 동의 항목
    const allowed = describeBrowserDataValue(consent, consentValue(), "Asia/Seoul"); // 허용 요약
    assert.equal(allowed.state, "stored"); // 저장 상태 확인
    assert.match(allowed.summary, /^분석 허용 · .*10:00.* 선택$/); // 허용과 시각 확인
    assert.match(describeBrowserDataValue(consent, consentValue({ analytics: false }), "Asia/Seoul").summary, /^분석 거부/); // 거부 요약 확인
    assert.deepEqual(describeBrowserDataValue(consent, consentValue({ version: 0 })), { state: "outdated", summary: "이전 정책 버전 · 다시 선택 필요" }); // 이전 버전 확인
    assert.equal(describeBrowserDataValue(consent, "{깨진값").state, "invalid"); // 손상 JSON 확인
    assert.equal(describeBrowserDataValue(consent, consentValue({ updatedAt: "날짜 아님" })).state, "invalid"); // 잘못된 시각 확인
    assert.deepEqual(describeBrowserDataValue(consent, null), { state: "empty", summary: "저장된 값 없음" }); // 빈 값 확인
}); // 테스트 끝

test("프로젝트·회원·초대장·화면 모드 값을 안전하게 요약한다", () => // 기타 항목 요약 검사
{ // 테스트 시작
    assert.equal(describeBrowserDataValue(item("favorite-projects"), JSON.stringify(["project-a", "project-b"])).summary, "프로젝트 2개"); // 관심 프로젝트 수 확인
    assert.equal(describeBrowserDataValue(item("recent-projects"), JSON.stringify(["project-a", "unknown", "project-a"])).summary, "프로젝트 1개 · 알 수 없는 항목 2개 제외"); // 중복·미지 항목 처리 확인
    assert.equal(describeBrowserDataValue(item("recent-projects"), "{}").state, "invalid"); // 목록 형식 오류 확인
    assert.equal(describeBrowserDataValue(item("demo-member"), JSON.stringify({ id: "demo-member", demo: true, nickname: "포지" })).summary, "닉네임 \"포지\""); // 닉네임 요약 확인
    assert.equal(describeBrowserDataValue(item("demo-member"), JSON.stringify({ nickname: 1 })).state, "invalid"); // 회원 형식 오류 확인
    assert.equal(describeBrowserDataValue(item("eta-invitation"), "true").summary, "초대장 확인함"); // 초대장 요약 확인
    assert.equal(describeBrowserDataValue(item("color-mode"), "dark").summary, "다크 모드"); // 다크 모드 확인
    assert.equal(describeBrowserDataValue(item("color-mode"), "blue").state, "invalid"); // 화면 모드 오류 확인
}); // 테스트 끝

test("저장소가 차단되면 항목을 확인 불가로 표시한다", () => // 저장소 차단 검사
{ // 테스트 시작
    const throwingStorage = { getItem() { throw new Error("SecurityError"); } }; // 읽기 차단 저장소
    const snapshot = readBrowserDataSnapshot({ local: null, session: throwingStorage }); // 차단 현황 읽기
    assert.ok(snapshot.every((entry) => entry.available === false && entry.state === "unavailable")); // 전체 차단 표시 확인
    const view = { get localStorage() { throw new Error("SecurityError"); }, sessionStorage: new MemoryStorage() }; // 접근 차단 화면
    const storages = resolveBrowserStorages(view); // 저장소 조회
    assert.equal(storages.local, null); // 차단 저장소 제외 확인
    assert.ok(storages.session); // 사용 가능 저장소 유지 확인
}); // 테스트 끝

test("개별 삭제와 전체 삭제는 대상만 지우고 화면 모드는 전체 삭제에서 제외한다", () => // 삭제 동작 검사
{ // 테스트 시작
    const local = new MemoryStorage({ [PRIVACY_CONSENT_STORAGE_KEY]: consentValue(), [FAVORITE_PROJECTS_KEY]: "[\"project-a\"]", [COLOR_MODE_STORAGE_KEY]: "dark", other_site_key: "keep" }); // 로컬 저장소
    const session = new MemoryStorage({ [MEMBER_DEMO_STORAGE_KEY]: "{}" }); // 세션 저장소
    const storages = { local, session }; // 저장소 묶음
    const single = removeBrowserDataItems(storages, ["favorite-projects"]); // 개별 삭제
    assert.deepEqual(single.map((entry) => entry.id), ["favorite-projects"]); // 개별 삭제 결과 확인
    assert.equal(local.getItem(FAVORITE_PROJECTS_KEY), null); // 대상 삭제 확인
    assert.ok(!getClearAllIds().includes("color-mode")); // 화면 모드 제외 확인
    const all = removeBrowserDataItems(storages, getClearAllIds()); // 전체 삭제
    assert.deepEqual(all.map((entry) => entry.id), ["privacy-consent", "demo-member"]); // 저장된 항목만 삭제 확인
    assert.equal(local.getItem(COLOR_MODE_STORAGE_KEY), "dark"); // 화면 모드 유지 확인
    assert.equal(local.getItem("other_site_key"), "keep"); // 관리 외 항목 유지 확인
    assert.deepEqual(removeBrowserDataItems(storages, getClearAllIds()), []); // 재삭제 빈 결과 확인
}); // 테스트 끝

test("삭제 결과 안내는 삭제 항목과 후속 영향을 알려 준다", () => // 결과 안내 검사
{ // 테스트 시작
    assert.equal(describeRemovalResult([]), "삭제할 저장 항목이 없습니다."); // 빈 결과 안내 확인
    const message = describeRemovalResult([item("privacy-consent"), item("demo-member")]); // 삭제 결과 안내
    assert.match(message, /^분석 동의 선택, 시연 회원 닉네임 2개 항목을 삭제했습니다\./); // 삭제 항목 안내 확인
    assert.match(message, /선택 창이 다시 표시됩니다/); // 동의 후속 안내 확인
    assert.match(message, /시연 로그인이 해제되었습니다/); // 로그인 후속 안내 확인
    assert.match(describeRemovalResult([item("color-mode")]), /기기 설정을 따릅니다/); // 화면 모드 후속 안내 확인
}); // 테스트 끝

test("개인정보 페이지·동의 패널·메인 보관함이 관리 영역과 연결된다", () => // 화면 연결 계약
{ // 테스트 시작
    const privacyHtml = fs.readFileSync("public/privacy.html", "utf8"); // 개인정보 문서
    const consentScript = fs.readFileSync("public/privacy-consent.mjs", "utf8"); // 동의 패널 스크립트
    const mainHtml = fs.readFileSync("public/main.html", "utf8"); // 메인 문서
    assert.match(privacyHtml, /id="browser-data"[^>]*data-browser-data-manager/); // 관리 영역 확인
    assert.match(privacyHtml, /data-browser-data-status/); // 결과 안내 영역 확인
    assert.match(privacyHtml, /role="status"/); // 상태 알림 역할 확인
    assert.match(privacyHtml, /src="\/browser-data\.mjs"/); // 관리 스크립트 확인
    assert.match(privacyHtml, /href="\/browser-data\.css"/); // 관리 스타일 확인
    assert.match(consentScript, /\/privacy\.html#browser-data/); // 동의 패널 링크 확인
    assert.match(mainHtml, /href="\/privacy\.html#browser-data"/); // 메인 보관함 링크 확인
}); // 테스트 끝
