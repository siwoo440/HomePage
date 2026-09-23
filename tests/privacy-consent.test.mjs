import assert from "node:assert/strict"; // 엄격 비교 도구
import test from "node:test"; // 테스트 실행 도구
import { CONSENT_POLICY_VERSION, hasAnalyticsConsent, initializePrivacyConsent, readPrivacyConsent, writePrivacyConsent } from "../public/privacy-consent.mjs"; // 동의 기능 도구

function createStorage(initialValue = null) // 저장소 생성 도구
{ // 함수 시작
    let value = initialValue; // 현재 저장 값

    const storage = // 저장소 객체
    { // 객체 시작
        getItem() // 값 읽기
        { // 읽기 시작
            return value; // 현재 값 반환
        }, // 읽기 끝
        setItem(key, nextValue) // 값 저장
        { // 저장 시작
            assert.equal(key, "devforge_privacy_consent_v1"); // 저장 키 확인
            value = nextValue; // 새 값 보관
        }, // 저장 끝
    }; // 객체 끝

    return storage; // 저장소 반환
} // 함수 끝

function createConsentDocument() // 동의 문서 대역 생성
{ // 함수 시작
    const bodyChildren = []; // 본문 요소 저장소
    const headChildren = []; // 머리 요소 저장소
    const createElement = (tagName) => // 요소 생성 도구
    { // 생성 시작
        const element = // 요소 대역
        { // 객체 시작
            tagName, // 태그 이름
            id: "", // 요소 식별자
            dataset: {}, // 데이터 속성
            attributes: {}, // 일반 속성
            children: [], // 하위 요소
            append(...children) // 하위 요소 연결
            { // 연결 시작
                element.children.push(...children); // 하위 요소 저장
            }, // 연결 끝
            setAttribute(name, value) // 속성 설정
            { // 설정 시작
                element.attributes[name] = value; // 속성 값 저장
            }, // 설정 끝
        }; // 요소 끝

        return element; // 생성 요소 반환
    }; // 생성 도구 끝
    const root = // 문서 대역
    { // 객체 시작
        head: // 머리 영역
        { // 머리 시작
            append(...children) // 머리 요소 연결
            { // 연결 시작
                headChildren.push(...children); // 머리 요소 저장
            }, // 연결 끝
        }, // 머리 끝
        body: // 본문 영역
        { // 본문 시작
            append(...children) // 본문 요소 연결
            { // 연결 시작
                bodyChildren.push(...children); // 본문 요소 저장
            }, // 연결 끝
        }, // 본문 끝
        createElement, // 요소 생성 도구
        querySelector() // 요소 조회
        { // 조회 시작
            return null; // 기존 요소 없음
        }, // 조회 끝
        addEventListener() // 이벤트 등록
        { // 등록 시작
        }, // 등록 끝
    }; // 문서 끝

    const result = // 문서 정보
    { // 객체 시작
        root, // 문서 대역
        bodyChildren, // 본문 요소 목록
        headChildren, // 머리 요소 목록
    }; // 객체 끝

    return result; // 문서 정보 반환
} // 함수 끝

test("손상된 동의 값은 미동의 상태로 처리한다", () => // 손상 값 테스트
{ // 테스트 시작
    assert.equal(readPrivacyConsent(createStorage("broken")), null); // 손상 값 차단
}); // 테스트 끝

test("이전 정책 버전의 동의 값은 다시 받아야 한다", () => // 정책 버전 테스트
{ // 테스트 시작
    const stored = JSON.stringify({ version: CONSENT_POLICY_VERSION - 1, analytics: true, ads: true, updatedAt: "2026-09-22T00:00:00.000Z" }); // 이전 값 생성
    assert.equal(readPrivacyConsent(createStorage(stored)), null); // 이전 값 차단
}); // 테스트 끝

test("분석 동의와 광고 동의를 안전한 필드만 저장한다", () => // 안전 저장 테스트
{ // 테스트 시작
    const storage = createStorage(); // 빈 저장소 생성
    const saved = writePrivacyConsent({ analytics: true, ads: false, email: "blocked@example.com" }, storage); // 동의 값 저장
    assert.deepEqual(Object.keys(saved).sort(), ["ads", "analytics", "updatedAt", "version"]); // 저장 필드 확인
    assert.equal(saved.analytics, true); // 분석 동의 확인
    assert.equal(saved.ads, false); // 광고 거부 확인
    assert.equal(hasAnalyticsConsent(storage), true); // 동의 읽기 확인
}); // 테스트 끝

test("분석 거부 상태는 분석 기능을 열지 않는다", () => // 거부 상태 테스트
{ // 테스트 시작
    const storage = createStorage(); // 빈 저장소 생성
    writePrivacyConsent({ analytics: false, ads: false }, storage); // 거부 값 저장
    assert.equal(hasAnalyticsConsent(storage), false); // 분석 차단 확인
}); // 테스트 끝

test("개인정보 설정 버튼은 동의 패널과 연결된다", () => // 접근성 연결 테스트
{ // 테스트 시작
    const { root, bodyChildren } = createConsentDocument(); // 문서 대역 생성
    const view = // 창 대역
    { // 객체 시작
        CustomEvent: null, // 사용자 이벤트 미지원
        dispatchEvent() // 이벤트 전달
        { // 전달 시작
        }, // 전달 끝
    }; // 객체 끝
    const panel = initializePrivacyConsent(root, createStorage(), view); // 동의 화면 생성
    const settings = bodyChildren[1]; // 설정 버튼 조회

    assert.equal(panel.id, "privacy-consent-panel"); // 패널 식별자 확인
    assert.equal(settings.attributes["aria-controls"], panel.id); // 제어 대상 연결 확인
}); // 테스트 끝
