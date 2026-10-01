import assert from "node:assert/strict"; // 엄격 비교 도구
import fs from "node:fs"; // 파일 읽기 도구
import test from "node:test"; // 테스트 실행 도구
import { clearDemoMemberProfile, getSessionStorage, initializeMemberActions, MEMBER_DEMO_STORAGE_KEY, readDemoMemberProfile } from "../public/member-session.mjs"; // 회원 상태 도구

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
    removeItem(key) // 저장값 삭제
    { // 함수 시작
        this.values.delete(key); // 항목 삭제
    } // 함수 끝
} // 클래스 끝

function createAction() // 회원 버튼 대체 요소
{ // 함수 시작
    return { textContent: "", dataset: {}, attributes: {}, setAttribute(name, value) { this.attributes[name] = value; } }; // 속성 기록 요소 반환
} // 함수 끝

const profileValue = JSON.stringify({ id: "demo-member", nickname: "포지", avatarUrl: null, createdAt: "2026-10-01T00:00:00.000Z", demo: true }); // 시연 회원 저장값
const location = { pathname: "/project_a/ProjectA_Main.html", search: "?tab=1", hash: "#features" }; // 현재 주소 대체

test("시연 로그아웃은 현재 탭의 시연 회원 정보를 삭제한다", () => // 시연 로그아웃 검사
{ // 테스트 시작
    const storage = new MemoryStorage({ [MEMBER_DEMO_STORAGE_KEY]: profileValue, other: "keep" }); // 세션 저장소
    assert.equal(readDemoMemberProfile(storage)?.nickname, "포지"); // 로그인 상태 확인
    assert.equal(clearDemoMemberProfile(storage), true); // 삭제 성공 확인
    assert.equal(readDemoMemberProfile(storage), null); // 로그아웃 상태 확인
    assert.equal(storage.getItem("other"), "keep"); // 다른 값 유지 확인
    assert.equal(clearDemoMemberProfile({ removeItem() { throw new Error("SecurityError"); } }), false); // 차단 저장소 실패 확인
}); // 테스트 끝

test("회원 버튼은 로그인 상태에 따라 닉네임과 회원 메뉴로 바뀐다", () => // 회원 버튼 표시 검사
{ // 테스트 시작
    const actions = [createAction(), createAction()]; // 헤더·서랍 버튼
    const root = { querySelectorAll: () => actions }; // 문서 대체
    initializeMemberActions(root, location, new MemoryStorage({ [MEMBER_DEMO_STORAGE_KEY]: profileValue })); // 로그인 상태 반영
    for (const action of actions) // 버튼 반복
    { // 반복 시작
        assert.equal(action.textContent, "포지"); // 닉네임 표시 확인
        assert.equal(action.attributes["aria-label"], "포지 회원 메뉴 (로그아웃 가능)"); // 회원 메뉴 이름 확인
        assert.equal(action.dataset.memberState, "signed-in"); // 로그인 상태 표시 확인
        assert.equal(action.attributes.href, `/login?returnTo=${encodeURIComponent("/project_a/ProjectA_Main.html?tab=1#features")}`); // 복귀 주소 확인
    } // 반복 끝
    initializeMemberActions(root, location, null); // 저장소 없는 상태 반영
    assert.equal(actions[0].textContent, "로그인"); // 로그인 문구 확인
    assert.equal(actions[0].dataset.memberState, "signed-out"); // 로그아웃 상태 표시 확인
}); // 테스트 끝

test("저장소 접근이 막혀도 회원 상태 조회가 중단되지 않는다", () => // 저장소 차단 검사
{ // 테스트 시작
    const blockedView = { get sessionStorage() { throw new Error("SecurityError"); } }; // 접근 차단 화면
    assert.equal(getSessionStorage(blockedView), null); // 차단 저장소 제외 확인
    assert.equal(readDemoMemberProfile(null), null); // 빈 저장소 회원 없음 확인
    assert.doesNotThrow(() => initializeMemberActions({}, undefined, null)); // 요소 없는 문서 안전 확인
}); // 테스트 끝

test("로그인 화면과 공통 메뉴가 로그아웃 흐름에 연결된다", () => // 화면 연결 계약
{ // 테스트 시작
    const page = fs.readFileSync("app/login/page.tsx", "utf8"); // 로그인 화면
    const access = fs.readFileSync("app/login/member-access.tsx", "utf8"); // 회원 접근 영역
    const navigation = fs.readFileSync("public/responsive-nav.mjs", "utf8"); // 공통 메뉴
    assert.match(page, /<MemberAccess mode=\{mode\} returnTo=\{returnTo\} \/>/); // 회원 접근 영역 사용 확인
    assert.match(access, /sessionStorage\.removeItem\(MEMBER_DEMO_STORAGE_KEY\)/); // 시연 로그아웃 확인
    assert.match(access, /auth\.signOut\(\)/); // 실제 세션 종료 확인
    assert.match(access, /auth\.getUser\(\)/); // 실제 로그인 상태 조회 확인
    assert.match(access, />\{isSigningOut \? "로그아웃 중…" : "로그아웃"\}</); // 로그아웃 버튼 확인
    assert.match(access, /role=\{messageRole\}/); // 결과 안내 역할 확인
    assert.match(navigation, /initializeMemberActions\(root, view\.location, getSessionStorage\(view\)\)/); // 서랍 회원 상태 반영 확인
}); // 테스트 끝
