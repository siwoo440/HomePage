import assert from "node:assert/strict"; // 엄격 비교 도구
import test from "node:test"; // 테스트 실행 도구
import { createAnalyticsRuntime, findAnalyticsElement, isValidMeasurementId, sanitizeAnalyticsParams } from "../public/site-analytics.mjs"; // 분석 기능 도구

function createDocument() // 문서 대역 생성
{ // 함수 시작
    const elements = new Map(); // 요소 저장소
    const head = // 문서 머리 대역
    { // 객체 시작
        append(element) // 요소 연결
        { // 연결 시작
            elements.set(element.id, element); // 요소 저장
        }, // 연결 끝
    }; // 객체 끝
    const documentRef = // 문서 대역
    { // 객체 시작
        head, // 문서 머리
        createElement(tagName) // 요소 생성
        { // 생성 시작
            return { tagName, id: "", src: "", async: false }; // 요소 반환
        }, // 생성 끝
        getElementById(id) // 요소 조회
        { // 조회 시작
            return elements.get(id) ?? null; // 조회 결과 반환
        }, // 조회 끝
    }; // 객체 끝

    return documentRef; // 문서 대역 반환
} // 함수 끝

function createWindow() // 창 대역 생성
{ // 함수 시작
    const listeners = new Map(); // 이벤트 저장소
    const windowRef = // 창 대역
    { // 객체 시작
        dataLayer: [], // 분석 전송 큐
        addEventListener(name, listener) // 이벤트 등록
        { // 등록 시작
            listeners.set(name, listener); // 이벤트 저장
        }, // 등록 끝
        dispatch(name, detail) // 이벤트 실행
        { // 실행 시작
            listeners.get(name)?.({ detail }); // 등록 이벤트 호출
        }, // 실행 끝
    }; // 객체 끝

    return windowRef; // 창 대역 반환
} // 함수 끝

test("GA4 측정 ID만 허용한다", () => // 측정 ID 테스트
{ // 테스트 시작
    assert.equal(isValidMeasurementId("G-ABC12345"), true); // 정상 ID 허용
    assert.equal(isValidMeasurementId("UA-123-1"), false); // 이전 ID 차단
    assert.equal(isValidMeasurementId("G-ABC<script>"), false); // 삽입 문자열 차단
    assert.equal(isValidMeasurementId(""), false); // 빈 ID 차단
}); // 테스트 끝

test("허용 매개변수만 남기고 민감 정보를 제거한다", () => // 매개변수 정리 테스트
{ // 테스트 시작
    const result = sanitizeAnalyticsParams({ item_id: "project-eta", destination: "steam", email: "blocked@example.com", comment: "blocked" }); // 입력 정리
    assert.deepEqual(result, { item_id: "project-eta", destination: "steam" }); // 안전 값 확인
}); // 테스트 끝

test("동의 전에는 GA4 스크립트를 만들지 않는다", () => // 동의 전 차단 테스트
{ // 테스트 시작
    const documentRef = createDocument(); // 문서 대역 생성
    const windowRef = createWindow(); // 창 대역 생성
    const runtime = createAnalyticsRuntime({ measurementId: "G-ABC12345", documentRef, windowRef, hasConsent: () => false }); // 분석 도구 생성
    assert.equal(runtime.start(), false); // 시작 차단 확인
    assert.equal(documentRef.getElementById("devforge-ga4-script"), null); // 스크립트 없음 확인
    assert.equal(windowRef.dataLayer.length, 0); // 전송 없음 확인
}); // 테스트 끝

test("동의 후 GA4를 한 번만 불러오고 안전한 이벤트만 전송한다", () => // 동의 후 전송 테스트
{ // 테스트 시작
    const documentRef = createDocument(); // 문서 대역 생성
    const windowRef = createWindow(); // 창 대역 생성
    const runtime = createAnalyticsRuntime({ measurementId: "G-ABC12345", documentRef, windowRef, hasConsent: () => true }); // 분석 도구 생성
    assert.equal(runtime.start(), true); // 첫 시작 성공
    assert.equal(runtime.start(), true); // 반복 시작 허용
    assert.equal(documentRef.getElementById("devforge-ga4-script")?.src, "https://www.googletagmanager.com/gtag/js?id=G-ABC12345"); // 스크립트 주소 확인
    assert.equal(runtime.track("select_game", { item_id: "project-eta", email: "blocked@example.com" }), true); // 허용 이벤트 전송
    assert.equal(runtime.track("unknown_event", { item_id: "project-eta" }), false); // 미허용 이벤트 차단
    assert.equal(Object.prototype.toString.call(windowRef.dataLayer.at(-1)), "[object Arguments]"); // Google 명령 형식 확인
    assert.deepEqual(Array.from(windowRef.dataLayer.at(-1)), ["event", "select_game", { item_id: "project-eta" }]); // 안전 전송 확인
}); // 테스트 끝

test("동의를 철회하면 이후 이벤트를 중단한다", () => // 동의 철회 테스트
{ // 테스트 시작
    let consent = true; // 동의 상태
    const documentRef = createDocument(); // 문서 대역 생성
    const windowRef = createWindow(); // 창 대역 생성
    const runtime = createAnalyticsRuntime({ measurementId: "G-ABC12345", documentRef, windowRef, hasConsent: () => consent }); // 분석 도구 생성
    runtime.start(); // 분석 시작
    consent = false; // 동의 철회
    runtime.refresh({ analytics: false }); // 철회 상태 반영
    assert.equal(windowRef["ga-disable-G-ABC12345"], true); // 자동 수집 차단 확인
    assert.deepEqual(Array.from(windowRef.dataLayer.at(-1)), ["consent", "update", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" }]); // Google 동의 철회 확인
    assert.equal(runtime.track("view_goods", { source_page: "/main.html" }), false); // 이벤트 차단 확인
}); // 테스트 끝

test("링크나 버튼을 누른 경우에만 가장 가까운 분석 영역을 찾는다", () => // 클릭 대상 테스트
{ // 테스트 시작
    const tracked = // 분석 영역 대역
    { // 객체 시작
        dataset: // 분석 데이터
        { // 데이터 시작
            analyticsEvent: "view_goods", // 분석 이벤트 이름
        }, // 데이터 끝
    }; // 객체 끝
    const heading = // 제목 대역
    { // 객체 시작
        closest(selector) // 상위 요소 조회
        { // 조회 시작
            return selector === "a, button, [role='button']" ? null : tracked; // 제목 결과 반환
        }, // 조회 끝
    }; // 객체 끝
    const link = // 링크 대역
    { // 객체 시작
        closest(selector) // 상위 요소 조회
        { // 조회 시작
            return selector === "a, button, [role='button']" ? link : tracked; // 링크 결과 반환
        }, // 조회 끝
    }; // 객체 끝

    assert.equal(findAnalyticsElement(heading), null); // 제목 클릭 제외 확인
    assert.equal(findAnalyticsElement(link), tracked); // 링크 클릭 포함 확인
}); // 테스트 끝
