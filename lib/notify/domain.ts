import { GAME_PROJECTS, getGameProject, getReleaseNotifyState } from "../../public/game-projects.mjs"; // 공개 프로젝트 데이터

export const NOTIFY_FIELD_ORDER = ["email", "consent"] as const; // 화면 입력 순서
export type NotifyField = typeof NOTIFY_FIELD_ORDER[number]; // 출시 알림 입력 이름
export const NOTIFY_EMAIL_MAX_LENGTH = 254; // 이메일 최대 길이
export const NOTIFY_HONEYPOT_FIELD = "website"; // 자동 입력 방지용 숨김 칸
export const NOTIFY_CLOSED_MESSAGE = "출시 알림을 받지 않는 프로젝트입니다."; // 신청 불가 안내

export interface NotifyInput // 검증된 출시 알림 신청
{ // 형식 시작
    projectId: string; // 프로젝트 식별자
    email: string; // 알림 받을 이메일(소문자)
} // 형식 끝

export type NotifyErrors = Partial<Record<NotifyField, string>>; // 입력별 오류 문구

export type NotifyValidation = // 출시 알림 검증 결과
    | { ok: true; value: NotifyInput; spam: boolean } // 통과(자동 입력 의심 여부 포함)
    | { ok: false; message: string; errors: NotifyErrors }; // 입력 오류

export interface NotifyProject // 출시 알림 대상 프로젝트
{ // 형식 시작
    id: string; // 프로젝트 식별자
    symbol: string; // 화면 표시 문자
    title: string; // 공개 제목
} // 형식 끝

function readText(value: unknown): string // 글자 입력 정리
{ // 함수 시작
    return typeof value === "string" ? value.trim() : ""; // 앞뒤 공백 제거 반환
} // 함수 끝

export function isNotifyOpen(projectId: unknown): boolean // 출시 알림 신청 가능 확인
{ // 함수 시작
    return getReleaseNotifyState(getGameProject(projectId)) === "open"; // 신청 가능 여부 반환
} // 함수 끝

export function listNotifyProjects(): NotifyProject[] // 출시 알림 대상 프로젝트 목록
{ // 함수 시작
    return GAME_PROJECTS.filter((project) => getReleaseNotifyState(project) === "open").map((project) => ({ id: project.id, symbol: project.symbol, title: project.title })); // 대상 프로젝트 반환
} // 함수 끝

export function isNotifyToken(value: unknown): value is string // 수신 거부 값 형식 확인
{ // 함수 시작
    return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value); // UUID 형식 여부 반환
} // 함수 끝

export function validateNotify(payload: Record<string, unknown>): NotifyValidation // 출시 알림 입력 검증
{ // 함수 시작
    const projectId = readText(payload.projectId); // 프로젝트 식별자
    const email = readText(payload.email).toLowerCase(); // 이메일(소문자 통일)
    const errors: NotifyErrors = {}; // 오류 목록

    if (!isNotifyOpen(projectId)) // 신청 가능 프로젝트 확인
    { // 조건 시작
        return { ok: false, message: NOTIFY_CLOSED_MESSAGE, errors }; // 신청 불가 반환
    } // 조건 끝
    if (!email) // 이메일 누락 확인
    { // 조건 시작
        errors.email = "알림 받을 이메일을 입력해 주세요."; // 이메일 누락 오류
    } // 조건 끝
    else if (email.length > NOTIFY_EMAIL_MAX_LENGTH || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) // 이메일 형식 확인
    { // 조건 시작
        errors.email = "이메일 형식을 확인해 주세요."; // 이메일 형식 오류
    } // 조건 끝
    if (payload.consent !== true) // 수신 동의 확인
    { // 조건 시작
        errors.consent = "출시 소식 메일 수신에 동의해 주세요."; // 동의 오류
    } // 조건 끝

    if (Object.keys(errors).length > 0) // 오류 존재 확인
    { // 조건 시작
        return { ok: false, message: "입력 내용을 확인해 주세요.", errors }; // 오류 반환
    } // 조건 끝
    return { ok: true, value: { projectId, email }, spam: readText(payload[NOTIFY_HONEYPOT_FIELD]) !== "" }; // 통과 반환
} // 함수 끝
