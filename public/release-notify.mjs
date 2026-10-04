import { connectJsonForm } from "./form-submit.mjs"; // 공통 양식 전송 도구
import { getGameProject, getReleaseNotifyState } from "./game-projects.mjs"; // 프로젝트 공개 데이터

export const NOTIFY_FORM_FIELDS = Object.freeze(["email", "consent"]); // 화면 입력 순서
export const NOTIFY_STYLESHEET = "/release-notify.css"; // 출시 알림 스타일 주소

export function collectNotifyForm(form) // 양식 값 모으기
{ // 함수 시작
    const read = (name) => String(form.elements.namedItem(name)?.value ?? ""); // 글자 입력 읽기
    return { projectId: form.dataset.projectId ?? "", email: read("email"), consent: form.elements.namedItem("consent")?.checked === true, website: read("website") }; // 전송 내용 반환
} // 함수 끝

export function validateNotifyForm(payload) // 화면 입력 검증(서버 규칙과 같은 문구)
{ // 함수 시작
    const errors = {}; // 오류 목록
    const email = String(payload.email ?? "").trim(); // 이메일
    if (!email) // 이메일 누락 확인
    { // 조건 시작
        errors.email = "알림 받을 이메일을 입력해 주세요."; // 이메일 누락 오류
    } // 조건 끝
    else if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) // 이메일 형식 확인
    { // 조건 시작
        errors.email = "이메일 형식을 확인해 주세요."; // 이메일 형식 오류
    } // 조건 끝
    if (payload.consent !== true) // 수신 동의 확인
    { // 조건 시작
        errors.consent = "출시 소식 메일 수신에 동의해 주세요."; // 동의 오류
    } // 조건 끝
    return errors; // 오류 목록 반환
} // 함수 끝

function createElement(root, tagName, className, text) // 화면 요소 생성
{ // 함수 시작
    const element = root.createElement(tagName); // 새 요소
    if (className) // 클래스 확인
    { // 조건 시작
        element.className = className; // 디자인 클래스
    } // 조건 끝
    if (text !== undefined) // 문구 확인
    { // 조건 시작
        element.textContent = text; // 안전한 글자 지정
    } // 조건 끝
    return element; // 요소 반환
} // 함수 끝

function createFieldError(root, name) // 입력 오류 문구 요소 생성
{ // 함수 시작
    const error = createElement(root, "p", "release-notify-error"); // 오류 문구
    error.id = `release-notify-${name}-error`; // 오류 식별자
    error.dataset.fieldError = name; // 대상 입력 이름
    error.setAttribute("role", "alert"); // 오류 알림 역할
    error.hidden = true; // 처음에는 숨김
    return error; // 오류 요소 반환
} // 함수 끝

function createNotifyForm(root, project) // 출시 알림 양식 생성
{ // 함수 시작
    const form = createElement(root, "form", "release-notify-form"); // 신청 양식
    form.noValidate = true; // 브라우저 기본 검증 대신 같은 안내 사용
    form.dataset.releaseNotifyForm = ""; // 양식 표시
    form.dataset.projectId = project.id; // 신청 대상 프로젝트

    const emailField = createElement(root, "div", "release-notify-field"); // 이메일 입력 묶음
    const emailLabel = createElement(root, "label", "", "알림 받을 이메일"); // 이메일 이름
    emailLabel.htmlFor = "release-notify-email"; // 입력 연결
    const email = createElement(root, "input"); // 이메일 입력칸
    email.id = "release-notify-email"; // 입력 식별자
    email.name = "email"; // 전송 이름
    email.type = "email"; // 이메일 입력 형식
    email.autocomplete = "email"; // 자동 완성 종류
    email.maxLength = 254; // 최대 길이
    email.setAttribute("aria-describedby", "release-notify-email-error"); // 오류 문구 연결
    emailField.append(emailLabel, email, createFieldError(root, "email")); // 이메일 묶음 조립

    const trap = createElement(root, "div", "release-notify-trap"); // 자동 입력 방지 칸(사람에게 보이지 않음)
    trap.setAttribute("aria-hidden", "true"); // 보조 기기에서 숨김
    const trapLabel = createElement(root, "label", "", "이 칸은 비워 두세요"); // 숨김 칸 이름
    trapLabel.htmlFor = "release-notify-website"; // 입력 연결
    const website = createElement(root, "input"); // 숨김 입력칸
    website.id = "release-notify-website"; // 입력 식별자
    website.name = "website"; // 전송 이름
    website.type = "text"; // 글자 입력 형식
    website.tabIndex = -1; // 키보드 이동 제외
    website.autocomplete = "off"; // 자동 완성 끔
    trap.append(trapLabel, website); // 숨김 칸 조립

    const consentField = createElement(root, "div", "release-notify-field release-notify-consent"); // 수신 동의 묶음
    const consentLabel = createElement(root, "label"); // 동의 선택 줄
    consentLabel.htmlFor = "release-notify-consent"; // 입력 연결
    const consent = createElement(root, "input"); // 동의 체크 상자
    consent.id = "release-notify-consent"; // 입력 식별자
    consent.name = "consent"; // 전송 이름
    consent.type = "checkbox"; // 체크 상자 형식
    consent.setAttribute("aria-describedby", "release-notify-consent-error"); // 오류 문구 연결
    consentLabel.append(consent, " ", createElement(root, "span", "", "[필수] 이 게임의 출시 소식 메일 수신과 이를 위한 이메일 수집·이용에 동의합니다.")); // 동의 문구 조립
    const policy = createElement(root, "a", "", "개인정보처리방침 보기"); // 처리방침 링크
    policy.href = "/privacy.html"; // 처리방침 주소
    policy.target = "_blank"; // 새 창 열기
    policy.rel = "noopener noreferrer"; // 새 창 보안 설정
    policy.append(createElement(root, "span", "release-notify-hidden", " (새 창)")); // 새 창 안내(화면 낭독용)
    consentField.append(consentLabel, policy, createFieldError(root, "consent")); // 동의 묶음 조립

    const submit = createElement(root, "button", "release-notify-submit", "출시 알림 신청"); // 제출 버튼
    submit.type = "submit"; // 제출 형식
    const status = createElement(root, "p", "release-notify-status"); // 결과 안내
    status.dataset.formStatus = ""; // 공통 전송 도구의 안내 위치
    status.tabIndex = -1; // 결과 안내로 초점 이동 허용
    status.hidden = true; // 처음에는 숨김
    form.append(emailField, trap, consentField, submit, status); // 양식 조립
    return form; // 양식 반환
} // 함수 끝

export function createNotifySection(root, project) // 출시 알림 영역 생성
{ // 함수 시작
    const state = getReleaseNotifyState(project); // 신청 가능 여부
    if (state !== "open" && state !== "paused") // 성인·알 수 없는 프로젝트 확인
    { // 조건 시작
        return null; // 영역을 만들지 않음
    } // 조건 끝
    const section = createElement(root, "section", "release-notify"); // 출시 알림 영역
    section.dataset.releaseNotify = state; // 영역 상태 표시
    section.setAttribute("aria-labelledby", "release-notify-title"); // 제목 연결
    const inner = createElement(root, "div", "release-notify-inner"); // 가운데 정렬 묶음
    const title = createElement(root, "h2", "release-notify-title", "출시 알림 받기"); // 영역 제목
    title.id = "release-notify-title"; // 제목 식별자
    inner.append(createElement(root, "p", "release-notify-kicker", "RELEASE NOTICE"), title); // 영문 분류와 제목
    if (state === "paused") // 보류 프로젝트 확인
    { // 조건 시작
        inner.append(createElement(root, "p", "release-notify-lead", "개발을 잠시 멈춘 프로젝트라 지금은 출시 알림 신청을 받지 않습니다. 개발을 다시 시작하면 개발 뉴스에서 알려 드립니다.")); // 보류 안내
    } // 조건 끝
    else // 신청 가능 프로젝트
    { // 대안 시작
        inner.append(createElement(root, "p", "release-notify-lead", "이 게임의 출시 소식이 준비되면 이메일로 알려 드립니다. 출시 일정은 아직 정해지지 않았습니다."), createNotifyForm(root, project), createElement(root, "p", "release-notify-note", "받은 메일의 수신 거부 주소로 언제든지 그만 받을 수 있습니다.")); // 안내·양식·수신 거부 안내
    } // 대안 끝
    section.append(inner); // 영역 조립
    return section; // 영역 반환
} // 함수 끝

function ensureStylesheet(root) // 출시 알림 스타일 연결
{ // 함수 시작
    if (root.querySelector(`link[href="${NOTIFY_STYLESHEET}"]`) || !root.head) // 이미 연결·문서 머리 없음 확인
    { // 조건 시작
        return; // 연결 생략
    } // 조건 끝
    const link = root.createElement("link"); // 스타일 연결 요소
    link.rel = "stylesheet"; // 스타일 종류
    link.href = NOTIFY_STYLESHEET; // 스타일 주소
    root.head.append(link); // 문서 머리에 연결
} // 함수 끝

export function initializeReleaseNotify(root = document) // 출시 알림 영역 연결
{ // 함수 시작
    const page = root.querySelector("[data-public-project-page]"); // 공개 프로젝트 페이지
    const main = root.querySelector("main"); // 주요 내용 영역
    if (!page || !main || root.querySelector("[data-release-notify]")) // 대상 페이지·중복 확인
    { // 조건 시작
        return null; // 안전 종료
    } // 조건 끝
    const section = createNotifySection(root, getGameProject(page.dataset.projectId)); // 출시 알림 영역
    if (!section) // 영역 없음 확인
    { // 조건 시작
        return null; // 신청을 받지 않는 프로젝트
    } // 조건 끝
    ensureStylesheet(root); // 스타일 연결
    main.after(section); // 주요 내용 바로 뒤(하단 정보 앞)에 배치
    const form = section.querySelector("[data-release-notify-form]"); // 신청 양식
    if (!form) // 양식 없음 확인
    { // 조건 시작
        return Object.freeze({ section, form: null }); // 안내만 있는 영역 반환
    } // 조건 끝
    connectJsonForm(form, // 공통 전송 연결
    { // 연결 설정 시작
        url: "/api/notify", // 신청 접수 주소
        fieldOrder: NOTIFY_FORM_FIELDS, // 오류 표시 순서
        collect: collectNotifyForm, // 값 모으기
        validate: validateNotifyForm, // 화면 검증
        onSuccess: () => // 신청 뒤 처리
        { // 처리 시작
            form.reset(); // 입력 비우기
            form.querySelector("[data-form-status]")?.focus?.(); // 결과 안내로 초점 이동
        }, // 처리 끝
    }); // 연결 설정 끝
    return Object.freeze({ section, form }); // 연결 결과 반환
} // 함수 끝

if (typeof document !== "undefined") // 브라우저 환경 확인
{ // 조건 시작
    if (document.readyState === "loading") // 문서 준비 상태 확인
    { // 조건 시작
        document.addEventListener("DOMContentLoaded", () => initializeReleaseNotify(document), { once: true }); // 준비 뒤 연결
    } // 조건 끝
    else // 준비 완료
    { // 대안 시작
        initializeReleaseNotify(document); // 즉시 연결
    } // 대안 끝
} // 조건 끝
