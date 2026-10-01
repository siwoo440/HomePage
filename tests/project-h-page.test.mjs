import assert from "node:assert/strict"; // 엄격 비교 도구
import fs from "node:fs"; // 파일 읽기 도구
import test from "node:test"; // 테스트 실행 도구
import vm from "node:vm"; // 격리 실행 도구

const html = fs.readFileSync("public/project_h/ProjectH_Main.html", "utf8"); // 프로젝트 H 화면
const script = fs.readFileSync("public/project_h/ProjectH_Script.js", "utf8"); // 프로젝트 H 스크립트
const css = fs.readFileSync("public/project_h/ProjectH_Style.css", "utf8"); // 프로젝트 H 스타일

function createScriptContext() // 문서 요소 없는 실행 환경 생성
{ // 함수 시작
    const listeners = {}; // 문서 이벤트 저장소
    const document = { // 최소 문서 대체 객체
        querySelector: () => null, // 단일 요소 조회 결과 없음
        querySelectorAll: () => [], // 복수 요소 조회 결과 없음
        addEventListener: (type, handler) => // 문서 이벤트 등록
        { // 등록 시작
            listeners[type] = handler; // 이벤트 처리기 저장
        }, // 등록 끝
    }; // 문서 대체 객체 끝
    const context = vm.createContext({ document }); // 격리 실행 환경
    vm.runInContext(script, context); // 스크립트 실행
    return { context, listeners }; // 실행 환경과 이벤트 반환
} // 함수 끝

test("프로젝트 H 스크립트가 찾는 식별자와 클래스는 화면에 모두 존재한다", () => // 화면·스크립트 연결 계약
{ // 테스트 시작
    const ids = [...script.matchAll(/querySelector\("#([\w-]+)"\)/g)].map((match) => match[1]); // 스크립트 식별자 목록
    const classes = [...script.matchAll(/querySelector(?:All)?\("\.([\w-]+)"\)/g)].map((match) => match[1]); // 스크립트 조회 클래스 목록
    const htmlClasses = new Set([...html.matchAll(/class="([^"]+)"/g)].flatMap((match) => match[1].split(/\s+/))); // 화면 클래스 목록
    const createdClasses = new Set([...script.matchAll(/className = "([^"]+)"/g)].map((match) => match[1])); // 스크립트 생성 클래스 목록
    assert.ok(ids.includes("companionCard")); // 동료 카드 조회 확인
    for (const id of ids) // 식별자 반복
    { // 반복 시작
        assert.match(html, new RegExp(`id="${id}"`), `화면에 #${id} 없음`); // 화면 식별자 존재 확인
    } // 반복 끝
    for (const className of classes) // 클래스 반복
    { // 반복 시작
        assert.ok(htmlClasses.has(className) || createdClasses.has(className), `화면에 .${className} 없음`); // 화면 또는 생성 클래스 존재 확인
    } // 반복 끝
}); // 테스트 끝

test("프로젝트 H 동료 캐러셀 클래스는 모두 스타일 규칙을 가진다", () => // 캐러셀 스타일 계약
{ // 테스트 시작
    const htmlClasses = [...html.matchAll(/class="([^"]+)"/g)].flatMap((match) => match[1].split(/\s+/)); // 화면 클래스 목록
    const scriptClasses = [...script.matchAll(/className = "([^"]+)"/g)].map((match) => match[1]); // 스크립트 생성 클래스 목록
    const companionClasses = [...new Set([...htmlClasses, ...scriptClasses])].filter((name) => name.startsWith("companion-")); // 동료 클래스 목록
    assert.ok(companionClasses.length >= 15); // 캐러셀 구성 규모 확인
    for (const className of companionClasses) // 동료 클래스 반복
    { // 반복 시작
        if (className === "companion-section") // 섹션 표식 클래스 확인
        { // 조건 시작
            continue; // 스타일 검사 제외
        } // 조건 끝
        assert.match(css, new RegExp(`\\.${className}\\b`), `.${className} 스타일 없음`); // 스타일 규칙 존재 확인
    } // 반복 끝
    assert.doesNotMatch(html, /images\/characters\//); // 없는 캐릭터 이미지 참조 제거 확인
}); // 테스트 끝

test("프로젝트 H 동료 필터는 역할과 한글·영문 검색어를 함께 적용한다", () => // 동료 필터 동작 검사
{ // 테스트 시작
    const { context } = createScriptContext(); // 스크립트 실행 환경
    const companions = vm.runInContext("companions", context); // 동료 데이터
    const names = (role, keyword) => Array.from(context.filterCompanions(companions, role, keyword), (companion) => companion.name); // 현재 실행 영역 배열로 변환한 선별 이름 목록
    assert.equal(companions.length, 12); // 전체 동료 수 확인
    assert.equal(names("전체", "").length, 12); // 전체 표시 확인
    assert.deepEqual(names("탱커", ""), ["엘렌", "티리아"]); // 역할 필터 확인
    assert.deepEqual(names("전체", "  LUCIA "), ["루시아"]); // 영문 대소문자·공백 무시 확인
    assert.deepEqual(names("전체", "치유"), ["세레나"]); // 한글 설명 검색 확인
    assert.deepEqual(names("딜러", "세레나"), []); // 역할·검색 동시 조건 확인
}); // 테스트 끝

test("프로젝트 H 동료 이동은 처음과 끝에서 순환한다", () => // 순환 이동 검사
{ // 테스트 시작
    const { context } = createScriptContext(); // 스크립트 실행 환경
    assert.equal(context.wrapCompanionIndex(-1, 12), 11); // 처음에서 이전 이동
    assert.equal(context.wrapCompanionIndex(12, 12), 0); // 끝에서 다음 이동
    assert.equal(context.wrapCompanionIndex(5, 0), 0); // 빈 목록 기본 위치
}); // 테스트 끝

test("프로젝트 H 초기화는 일부 요소가 없어도 중단되지 않는다", () => // 초기화 안정성 검사
{ // 테스트 시작
    const { listeners } = createScriptContext(); // 스크립트 실행 환경
    assert.equal(typeof listeners.DOMContentLoaded, "function"); // 초기화 처리기 등록 확인
    assert.doesNotThrow(() => listeners.DOMContentLoaded()); // 요소 누락 상태 초기화 확인
}); // 테스트 끝
