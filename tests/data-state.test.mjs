import assert from "node:assert/strict"; // 엄격 비교 도구
import test from "node:test"; // 테스트 실행 도구
import { DataStateRequestError, createDataStateModel, requestJson, resolveCollectionState } from "../public/data-state.mjs"; // 공통 데이터 상태 도구

class FakeElement // 가짜 문서 요소
{ // 클래스 시작
    constructor(tagName) // 요소 생성자
    { // 생성자 시작
        this.tagName = tagName; // 요소 이름 저장
        this.className = ""; // 클래스 이름 초기값
        this.textContent = ""; // 글자 초기값
        this.dataset = {}; // 데이터 속성 저장소
        this.attributes = {}; // 일반 속성 저장소
        this.children = []; // 자식 요소 저장소
        this.hidden = false; // 숨김 상태 초기값
        this.disabled = false; // 비활성 상태 초기값
        this.listeners = {}; // 이벤트 저장소
    } // 생성자 끝

    setAttribute(name, value) // 속성 저장
    { // 함수 시작
        this.attributes[name] = value; // 속성값 기록
    } // 함수 끝

    append(...children) // 자식 추가
    { // 함수 시작
        this.children.push(...children); // 자식 목록 추가
    } // 함수 끝

    replaceChildren(...children) // 자식 교체
    { // 함수 시작
        this.children = children; // 자식 목록 교체
    } // 함수 끝

    addEventListener(name, listener) // 이벤트 등록
    { // 함수 시작
        this.listeners[name] = listener; // 이벤트 함수 저장
    } // 함수 끝
} // 클래스 끝

test("다섯 데이터 상태를 일관된 화면 모델로 변환한다", () => // 상태 모델 테스트
{ // 테스트 시작
    assert.deepEqual(createDataStateModel("loading"), { kind: "loading", hidden: false, title: "데이터 확인 중", message: "최신 정보를 불러오고 있습니다.", iconUrl: "/images/states/loading.svg", retryLabel: null }); // 로딩 모델 확인
    assert.deepEqual(createDataStateModel("demo"), { kind: "demo", hidden: false, title: "데모 콘텐츠 표시 중", message: "외부 연결 전이라 준비된 데모 정보를 표시합니다.", iconUrl: "/images/states/demo.svg", retryLabel: null }); // 데모 모델 확인
    assert.deepEqual(createDataStateModel("empty"), { kind: "empty", hidden: false, title: "표시할 항목이 없습니다", message: "아직 등록된 정보가 없습니다. 잠시 후 다시 확인해 주세요.", iconUrl: "/images/states/empty.svg", retryLabel: "다시 확인" }); // 빈 결과 모델 확인
    assert.deepEqual(createDataStateModel("error"), { kind: "error", hidden: false, title: "정보를 불러오지 못했습니다", message: "연결 상태를 확인한 뒤 다시 시도해 주세요.", iconUrl: "/images/states/error.svg", retryLabel: "다시 시도" }); // 오류 모델 확인
    assert.deepEqual(createDataStateModel("ready"), { kind: "ready", hidden: true, title: "", message: "", iconUrl: "", retryLabel: null }); // 준비 완료 모델 확인
}); // 테스트 끝

test("페이지가 제공한 제목과 설명으로 기본 상태 모델을 덮어쓴다", () => // 상태 문구 재정의 테스트
{ // 테스트 시작
    const model = createDataStateModel("demo", { title: "상품 데모 표시 중", message: "판매 연결 전 상품입니다." }); // 사용자 문구 모델 생성
    assert.equal(model.title, "상품 데모 표시 중"); // 제목 재정의 확인
    assert.equal(model.message, "판매 연결 전 상품입니다."); // 설명 재정의 확인
    assert.equal(model.iconUrl, "/images/states/demo.svg"); // 기본 아이콘 유지 확인
}); // 테스트 끝

test("설정과 목록 내용에 따라 준비·데모·빈 결과·오류를 구분한다", () => // 응답 상태 분류 테스트
{ // 테스트 시작
    assert.equal(resolveCollectionState({ configured: true, posts: [{ id: "news-1" }] }, "posts"), "ready"); // 정상 목록 확인
    assert.equal(resolveCollectionState({ configured: false, posts: [] }, "posts"), "demo"); // 미설정 응답 확인
    assert.equal(resolveCollectionState({ configured: true, posts: [] }, "posts"), "empty"); // 빈 목록 확인
    assert.equal(resolveCollectionState({ configured: true, posts: null }, "posts"), "error"); // 잘못된 목록 확인
    assert.equal(resolveCollectionState(null, "posts"), "error"); // 잘못된 응답 확인
}); // 테스트 끝

test("정상 JSON 응답을 반환한다", async () => // 정상 요청 테스트
{ // 테스트 시작
    const fetchImpl = async () => ({ ok: true, json: async () => ({ configured: true, posts: [] }) }); // 정상 요청 대역
    const result = await requestJson("/api/news", { fetchImpl, timeoutMs: 50 }); // JSON 요청 실행
    assert.deepEqual(result, { configured: true, posts: [] }); // 정상 응답 확인
}); // 테스트 끝

test("HTTP 실패와 JSON 해석 실패를 안전한 요청 오류로 정규화한다", async () => // 요청 오류 테스트
{ // 테스트 시작
    const httpFailure = async () => ({ ok: false, json: async () => ({ message: "내부 오류" }) }); // HTTP 실패 대역
    const jsonFailure = async () => ({ ok: true, json: async () => { throw new SyntaxError("bad json"); } }); // JSON 실패 대역
    await assert.rejects(requestJson("/api/news", { fetchImpl: httpFailure, timeoutMs: 50 }), (error) => error instanceof DataStateRequestError && error.code === "DATA_REQUEST_FAILED"); // HTTP 실패 확인
    await assert.rejects(requestJson("/api/news", { fetchImpl: jsonFailure, timeoutMs: 50 }), (error) => error instanceof DataStateRequestError && error.code === "DATA_REQUEST_FAILED"); // JSON 실패 확인
}); // 테스트 끝

test("지정 시간이 지나면 요청을 중단하고 시간 초과 오류를 반환한다", async () => // 시간 초과 테스트
{ // 테스트 시작
    const pendingFetch = (url, options) => new Promise((resolve, reject) => // 중단 대기 요청
    { // 약속 시작
        options.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError"))); // 중단 오류 발생
    }); // 약속 끝
    await assert.rejects(requestJson("/api/news", { fetchImpl: pendingFetch, timeoutMs: 5 }), (error) => error instanceof DataStateRequestError && error.code === "DATA_TIMEOUT"); // 시간 초과 확인
}); // 테스트 끝

test("오류 상태 옵션의 재시도 함수로 버튼을 만들고 한 번 실행한다", async () => // 재시도 버튼 테스트
{ // 테스트 시작
    const originalDocument = globalThis.document; // 기존 문서 저장
    globalThis.document = { createElement: (tagName) => new FakeElement(tagName) }; // 가짜 문서 연결

    try // 가짜 문서 사용 시도
    { // 시도 시작
        const { createDataStateController } = await import("../public/data-state.mjs"); // 상태 제어기 불러오기
        const host = new FakeElement("section"); // 상태 호스트 생성
        let retryCount = 0; // 재시도 횟수
        const controller = createDataStateController(host); // 상태 제어기 생성
        controller.show("error", { onRetry: async () => // 오류 상태 표시
        { // 재시도 함수 시작
            retryCount += 1; // 재시도 횟수 증가
        } }); // 오류 상태 표시 끝
        assert.equal(host.children.length, 3); // 재시도 버튼 포함 확인
        const retryButton = host.children[2]; // 재시도 버튼 조회
        await retryButton.listeners.click(); // 재시도 버튼 실행
        assert.equal(retryCount, 1); // 한 번 실행 확인
        assert.equal(retryButton.disabled, false); // 실행 뒤 버튼 복원 확인
    } // 시도 끝
    finally // 가짜 문서 정리
    { // 정리 시작
        globalThis.document = originalDocument; // 기존 문서 복원
    } // 정리 끝
}); // 테스트 끝
