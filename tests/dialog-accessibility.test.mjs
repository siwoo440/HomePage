import assert from "node:assert/strict"; // 엄격 검증 도구
import test from "node:test"; // 테스트 실행 도구
import { initializeDialogAccessibility } from "../public/dialog-accessibility.mjs"; // 대화상자 제어기
import { createDialogEnvironment } from "./helpers/dialog-environment.mjs"; // 대화상자 환경

test("사용자 정의 대화상자는 열림 상태와 첫 조작 요소 초점을 제공한다", () => // 열기 동작 검사
{ // 테스트 시작
    const environment = createDialogEnvironment(); // 테스트 환경 생성
    const { dialog, first } = environment.addDialog("contact-modal"); // 대화상자 추가
    const trigger = environment.createTrigger("contact-modal"); // 실행 요소 생성
    const controller = initializeDialogAccessibility(environment.root); // 제어기 초기화
    assert.equal(controller.open("contact-modal", trigger), true); // 열기 성공 확인
    assert.equal(dialog.hidden, false); // 표시 상태 확인
    assert.equal(dialog.classList.contains("open"), true); // 열림 클래스 확인
    assert.equal(dialog.getAttribute("role"), "dialog"); // 대화상자 역할 확인
    assert.equal(dialog.getAttribute("aria-modal"), "true"); // 모달 상태 확인
    assert.equal(environment.root.body.classList.contains("dialog-open"), true); // 스크롤 잠금 확인
    environment.assertFocused(first); // 첫 요소 초점 확인
}); // 테스트 종료

test("새 대화상자를 열면 이전 대화상자만 닫는다", () => // 단일 활성 창 검사
{ // 테스트 시작
    const environment = createDialogEnvironment(); // 테스트 환경 생성
    const firstDialog = environment.addDialog("first-modal"); // 첫 창 추가
    const secondDialog = environment.addDialog("second-modal"); // 둘째 창 추가
    const controller = initializeDialogAccessibility(environment.root); // 제어기 초기화
    controller.open("first-modal", environment.createTrigger("first-modal")); // 첫 창 열기
    controller.open("second-modal", environment.createTrigger("second-modal")); // 둘째 창 열기
    assert.equal(firstDialog.dialog.hidden, true); // 첫 창 닫힘 확인
    assert.equal(secondDialog.dialog.hidden, false); // 둘째 창 열림 확인
    environment.assertFocused(secondDialog.first); // 둘째 창 초점 확인
}); // 테스트 종료

test("Escape는 대화상자를 닫고 실행 요소로 초점을 돌려준다", () => // Escape 닫기 검사
{ // 테스트 시작
    const environment = createDialogEnvironment(); // 테스트 환경 생성
    const { dialog } = environment.addDialog("contact-modal"); // 대화상자 추가
    const trigger = environment.createTrigger("contact-modal"); // 실행 요소 생성
    const controller = initializeDialogAccessibility(environment.root); // 제어기 초기화
    controller.open("contact-modal", trigger); // 대화상자 열기
    const event = environment.root.dispatch("keydown", { key: "Escape" }); // Escape 전달
    assert.equal(event.defaultPrevented, true); // 기본 동작 차단 확인
    assert.equal(dialog.hidden, true); // 닫힘 상태 확인
    assert.equal(environment.root.body.classList.contains("dialog-open"), false); // 스크롤 잠금 해제 확인
    environment.assertFocused(trigger); // 실행 요소 초점 확인
}); // 테스트 종료

test("Tab과 Shift Tab은 대화상자 안에서 순환한다", () => // 초점 순환 검사
{ // 테스트 시작
    const environment = createDialogEnvironment(); // 테스트 환경 생성
    const { first, last } = environment.addDialog("contact-modal"); // 대화상자 추가
    const controller = initializeDialogAccessibility(environment.root); // 제어기 초기화
    controller.open("contact-modal", environment.createTrigger("contact-modal")); // 대화상자 열기
    last.focus(); // 마지막 요소 초점
    const forward = environment.root.dispatch("keydown", { key: "Tab" }); // 정방향 이동
    assert.equal(forward.defaultPrevented, true); // 정방향 차단 확인
    environment.assertFocused(first); // 첫 요소 이동 확인
    first.focus(); // 첫 요소 초점
    const backward = environment.root.dispatch("keydown", { key: "Tab", shiftKey: true }); // 역방향 이동
    assert.equal(backward.defaultPrevented, true); // 역방향 차단 확인
    environment.assertFocused(last); // 마지막 요소 이동 확인
}); // 테스트 종료

test("닫기 버튼과 배경 클릭은 현재 대화상자만 닫는다", () => // 포인터 닫기 검사
{ // 테스트 시작
    const environment = createDialogEnvironment(); // 테스트 환경 생성
    const first = environment.addDialog("first-modal"); // 첫 대화상자 추가
    const closeButton = environment.createCloseButton(first.dialog); // 닫기 버튼 추가
    const controller = initializeDialogAccessibility(environment.root); // 제어기 초기화
    controller.open("first-modal", environment.createTrigger("first-modal")); // 첫 창 열기
    environment.root.dispatch("click", { target: closeButton }); // 닫기 버튼 클릭
    assert.equal(first.dialog.hidden, true); // 버튼 닫힘 확인
    controller.open("first-modal", environment.createTrigger("first-modal")); // 첫 창 다시 열기
    environment.root.dispatch("click", { target: first.dialog }); // 배경 클릭
    assert.equal(first.dialog.hidden, true); // 배경 닫힘 확인
}); // 테스트 종료

test("실행 요소가 제거되면 닫기 뒤 초점 복원을 생략한다", () => // 제거 요소 검사
{ // 테스트 시작
    const environment = createDialogEnvironment(); // 테스트 환경 생성
    environment.addDialog("contact-modal"); // 대화상자 추가
    const trigger = environment.createTrigger("contact-modal"); // 실행 요소 생성
    const controller = initializeDialogAccessibility(environment.root); // 제어기 초기화
    controller.open("contact-modal", trigger); // 대화상자 열기
    trigger.isConnected = false; // 실행 요소 제거
    assert.equal(controller.close(), true); // 닫기 성공 확인
    assert.notEqual(environment.root.activeElement, trigger); // 초점 복원 생략 확인
}); // 테스트 종료

test("조작 요소가 없으면 대화상자 본체가 초점을 받는다", () => // 대체 초점 검사
{ // 테스트 시작
    const environment = createDialogEnvironment(); // 테스트 환경 생성
    const { dialog } = environment.addDialog("empty-modal", { empty: true }); // 빈 대화상자 추가
    const controller = initializeDialogAccessibility(environment.root); // 제어기 초기화
    controller.open("empty-modal", environment.createTrigger("empty-modal")); // 빈 창 열기
    assert.equal(dialog.getAttribute("tabindex"), "-1"); // 대체 초점 속성 확인
    environment.assertFocused(dialog); // 본체 초점 확인
}); // 테스트 종료

test("네이티브 대화상자는 기본 API와 초점 복원을 사용한다", () => // 네이티브 창 검사
{ // 테스트 시작
    const environment = createDialogEnvironment(); // 테스트 환경 생성
    const { dialog } = environment.addDialog("native-modal", { native: true }); // 네이티브 창 추가
    const trigger = environment.createTrigger("native-modal"); // 실행 요소 생성
    const controller = initializeDialogAccessibility(environment.root); // 제어기 초기화
    controller.open("native-modal", trigger); // 네이티브 창 열기
    assert.equal(dialog.showModalCalls, 1); // 기본 열기 호출 확인
    controller.close("native-modal"); // 네이티브 창 닫기
    assert.equal(dialog.closeCalls, 1); // 기본 닫기 호출 확인
    environment.assertFocused(trigger); // 실행 요소 초점 확인
}); // 테스트 종료

test("네이티브 API가 없으면 open 속성으로 대체한다", () => // 대체 API 검사
{ // 테스트 시작
    const environment = createDialogEnvironment(); // 테스트 환경 생성
    const { dialog } = environment.addDialog("fallback-modal", { native: true }); // 네이티브 창 추가
    dialog.showModal = undefined; // 열기 API 제거
    dialog.close = undefined; // 닫기 API 제거
    const controller = initializeDialogAccessibility(environment.root); // 제어기 초기화
    controller.open("fallback-modal", environment.createTrigger("fallback-modal")); // 대체 창 열기
    assert.equal(dialog.hasAttribute("open"), true); // 열림 속성 확인
    controller.close("fallback-modal"); // 대체 창 닫기
    assert.equal(dialog.hasAttribute("open"), false); // 닫힘 속성 확인
}); // 테스트 종료

test("중복 초기화는 같은 제어기를 반환하고 destroy는 상태를 정리한다", () => // 수명 주기 검사
{ // 테스트 시작
    const environment = createDialogEnvironment(); // 테스트 환경 생성
    const { dialog } = environment.addDialog("contact-modal"); // 대화상자 추가
    const firstController = initializeDialogAccessibility(environment.root); // 첫 초기화
    const secondController = initializeDialogAccessibility(environment.root); // 중복 초기화
    assert.equal(secondController, firstController); // 같은 제어기 확인
    firstController.open("contact-modal", environment.createTrigger("contact-modal")); // 창 열기
    firstController.destroy(); // 제어기 정리
    assert.equal(dialog.hidden, true); // 창 닫힘 확인
    assert.equal(environment.root.body.classList.contains("dialog-open"), false); // 스크롤 상태 확인
    assert.equal(environment.root.__devforgeDialogController, null); // 참조 정리 확인
}); // 테스트 종료

test("네이티브 대화상자 destroy는 기본 close로 문서 차단을 해제한다", () => // 네이티브 정리 검사
{ // 테스트 시작
    const environment = createDialogEnvironment(); // 테스트 환경 생성
    const { dialog } = environment.addDialog("native-modal", { native: true }); // 네이티브 창 추가
    const controller = initializeDialogAccessibility(environment.root); // 제어기 초기화
    controller.open("native-modal", environment.createTrigger("native-modal")); // 네이티브 창 열기
    controller.destroy(); // 제어기 정리
    assert.equal(dialog.closeCalls, 1); // 기본 닫기 호출 확인
    assert.equal(dialog.hasAttribute("open"), false); // 열림 속성 해제 확인
}); // 테스트 종료

test("이전 네이티브 닫힘 이벤트는 다시 연 창을 닫지 않는다", () => // 지연 이벤트 검사
{ // 테스트 시작
    const environment = createDialogEnvironment(); // 테스트 환경 생성
    const { dialog } = environment.addDialog("native-modal", { native: true }); // 네이티브 창 추가
    const trigger = environment.createTrigger("native-modal"); // 실행 요소 생성
    dialog.close = () => // 지연 닫기 대역
    { // 함수 시작
        dialog.removeAttribute("open"); // 열림 속성 제거
        dialog.closeCalls += 1; // 닫기 호출 기록
    }; // 함수 끝
    const controller = initializeDialogAccessibility(environment.root); // 제어기 초기화
    controller.open("native-modal", trigger); // 첫 창 열기
    controller.close("native-modal"); // 첫 창 닫기 요청
    controller.open("native-modal", trigger); // 같은 창 다시 열기
    dialog.dispatch("close"); // 이전 닫힘 이벤트 전달
    assert.equal(dialog.hidden, false); // 다시 연 창 표시 확인
    assert.equal(dialog.hasAttribute("open"), true); // 다시 연 창 상태 확인
}); // 테스트 종료

test("외부로 이동한 초점은 Tab 입력 때 열린 창으로 돌아온다", () => // 외부 초점 복구 검사
{ // 테스트 시작
    const environment = createDialogEnvironment(); // 테스트 환경 생성
    const { dialog, first, last } = environment.addDialog("contact-modal"); // 대화상자 추가
    const outside = environment.createTrigger("other-modal"); // 외부 요소 생성
    const controller = initializeDialogAccessibility(environment.root); // 제어기 초기화
    controller.open("contact-modal", outside); // 대화상자 열기
    assert.equal(outside.inert, true); // 배경 비활성 확인
    outside.focus(); // 외부 요소 초점
    const forward = environment.root.dispatch("keydown", { key: "Tab" }); // 정방향 이동
    assert.equal(forward.defaultPrevented, true); // 외부 이동 차단 확인
    environment.assertFocused(first); // 첫 요소 복구 확인
    outside.focus(); // 외부 요소 재초점
    environment.root.dispatch("keydown", { key: "Tab", shiftKey: true }); // 역방향 이동
    environment.assertFocused(last); // 마지막 요소 복구 확인
    controller.close(dialog.id); // 대화상자 닫기
    assert.equal(outside.inert, false); // 배경 비활성 해제 확인
}); // 테스트 종료

test("이미 열린 창을 다시 열어도 최초 실행 요소를 유지한다", () => // 반복 열기 검사
{ // 테스트 시작
    const environment = createDialogEnvironment(); // 테스트 환경 생성
    const { first } = environment.addDialog("contact-modal"); // 대화상자 추가
    const trigger = environment.createTrigger("contact-modal"); // 최초 실행 요소 생성
    const controller = initializeDialogAccessibility(environment.root); // 제어기 초기화
    controller.open("contact-modal", trigger); // 첫 열기
    controller.open("contact-modal", first); // 반복 열기
    controller.close("contact-modal"); // 대화상자 닫기
    environment.assertFocused(trigger); // 최초 실행 요소 복원 확인
}); // 테스트 종료

test("네이티브 창에서 다른 창으로 전환하면 새 창만 조작 가능하다", () => // 네이티브 전환 검사
{ // 테스트 시작
    const environment = createDialogEnvironment(); // 테스트 환경 생성
    const first = environment.addDialog("native-modal", { native: true }); // 네이티브 창 추가
    const second = environment.addDialog("custom-modal"); // 사용자 정의 창 추가
    first.dialog.close = () => // 지연 닫기 대역
    { // 함수 시작
        first.dialog.removeAttribute("open"); // 열림 속성 제거
        first.dialog.closeCalls += 1; // 닫기 호출 기록
    }; // 함수 끝
    const controller = initializeDialogAccessibility(environment.root); // 제어기 초기화
    controller.open("native-modal", environment.createTrigger("native-modal")); // 네이티브 창 열기
    controller.open("custom-modal", environment.createTrigger("custom-modal")); // 사용자 정의 창 전환
    assert.equal(first.dialog.inert, true); // 이전 창 비활성 확인
    assert.equal(second.dialog.inert, false); // 새 창 조작 가능 확인
    environment.assertFocused(second.first); // 새 창 초점 확인
    first.dialog.dispatch("close"); // 이전 닫힘 이벤트 전달
    environment.assertFocused(second.first); // 새 창 초점 유지 확인
}); // 테스트 종료

test("열린 창 뒤에 추가된 배경 요소도 즉시 비활성화한다", () => // 동적 배경 검사
{ // 테스트 시작
    const environment = createDialogEnvironment(); // 테스트 환경 생성
    environment.addDialog("contact-modal"); // 대화상자 추가
    const controller = initializeDialogAccessibility(environment.root); // 제어기 초기화
    controller.open("contact-modal", environment.createTrigger("contact-modal")); // 대화상자 열기
    const privacyControl = environment.createTrigger("privacy-panel"); // 늦은 개인정보 요소 추가
    assert.equal(privacyControl.inert, true); // 동적 배경 비활성 확인
    controller.close("contact-modal"); // 대화상자 닫기
    assert.equal(privacyControl.inert, false); // 동적 배경 복원 확인
}); // 테스트 종료

test("네이티브 전환 뒤 기본 닫힘은 새 실행 요소로 초점을 복원한다", () => // 복원 설정 초기화 검사
{ // 테스트 시작
    const environment = createDialogEnvironment(); // 테스트 환경 생성
    const native = environment.addDialog("native-modal", { native: true }); // 네이티브 창 추가
    environment.addDialog("custom-modal"); // 사용자 정의 창 추가
    const controller = initializeDialogAccessibility(environment.root); // 제어기 초기화
    controller.open("native-modal", environment.createTrigger("native-modal")); // 네이티브 창 열기
    controller.open("custom-modal", environment.createTrigger("custom-modal")); // 사용자 정의 창 전환
    const newTrigger = environment.createTrigger("native-modal"); // 새 실행 요소 생성
    controller.open("native-modal", newTrigger); // 네이티브 창 다시 열기
    native.dialog.removeAttribute("open"); // 브라우저 기본 닫힘 상태
    native.dialog.dispatch("close"); // 브라우저 닫힘 이벤트
    environment.assertFocused(newTrigger); // 새 실행 요소 초점 복원 확인
}); // 테스트 종료
