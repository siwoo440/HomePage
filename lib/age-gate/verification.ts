import { AGE_GATE_MAX_AGE_MS } from "./config.ts"; // 인증 유지 시간

const AGE_GATE_TOKEN_VERSION = "v1"; // 토큰 버전
const DEVELOPMENT_SECRET = "devforge-local-age-gate-only"; // 개발 전용 서명 키
const SAFE_RETURN_TO = "/main.html#games"; // 기본 복귀 주소
const textEncoder = new TextEncoder(); // 문자열 변환기

function parseBirthDate(value: string): Date | null // 생년월일 해석
{ // 함수 시작
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value); // 날짜 형식 확인
    if (!match) // 형식 오류 확인
    { // 조건 시작
        return null; // 잘못된 날짜 반환
    } // 조건 끝
    const year = Number(match[1]); // 연도 변환
    const month = Number(match[2]); // 월 변환
    const day = Number(match[3]); // 일 변환
    const date = new Date(Date.UTC(year, month - 1, day)); // UTC 날짜 생성
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) // 실제 날짜 확인
    { // 조건 시작
        return null; // 존재하지 않는 날짜 반환
    } // 조건 끝
    return date; // 유효 날짜 반환
} // 함수 끝

function bytesToHex(bytes: Uint8Array): string // 바이트 문자열 변환
{ // 함수 시작
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(""); // 16진수 결합
} // 함수 끝

function hexToBytes(value: string): Uint8Array | null // 문자열 바이트 변환
{ // 함수 시작
    if (!/^[0-9a-f]{64}$/.test(value)) // 서명 형식 확인
    { // 조건 시작
        return null; // 잘못된 서명 반환
    } // 조건 끝
    const bytes = new Uint8Array(value.length / 2); // 바이트 배열 생성
    for (let index = 0; index < value.length; index += 2) // 문자열 순회
    { // 반복 시작
        bytes[index / 2] = Number.parseInt(value.slice(index, index + 2), 16); // 바이트 저장
    } // 반복 끝
    return bytes; // 바이트 반환
} // 함수 끝

async function importHmacKey(secret: string): Promise<CryptoKey> // 서명 키 준비
{ // 함수 시작
    return crypto.subtle.importKey("raw", textEncoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]); // HMAC 키 생성
} // 함수 끝

export function isValidBirthDate(birthDate: string): boolean // 생년월일 유효성 판정
{ // 함수 시작
    return parseBirthDate(birthDate) !== null; // 날짜 해석 결과 반환
} // 함수 끝

export function isAdultBirthDate(birthDate: string, today: Date): boolean // 만 19세 판정
{ // 함수 시작
    const birth = parseBirthDate(birthDate); // 생년월일 해석
    if (!birth || birth.getTime() > today.getTime()) // 잘못되거나 미래 날짜 확인
    { // 조건 시작
        return false; // 미성년 처리
    } // 조건 끝
    let age = today.getUTCFullYear() - birth.getUTCFullYear(); // 연도 차이 계산
    const birthdayPassed = today.getUTCMonth() > birth.getUTCMonth() || (today.getUTCMonth() === birth.getUTCMonth() && today.getUTCDate() >= birth.getUTCDate()); // 생일 경과 확인
    if (!birthdayPassed) // 생일 이전 확인
    { // 조건 시작
        age -= 1; // 만 나이 조정
    } // 조건 끝
    return age >= 19; // 성인 여부 반환
} // 함수 끝

export function sanitizeAgeReturnTo(value: string | null): string // 복귀 주소 정리
{ // 함수 시작
    if (!value || !value.startsWith("/") || value.startsWith("//") || /[\u0000-\u001f\u007f]/.test(value)) // 위험 주소 확인
    { // 조건 시작
        return SAFE_RETURN_TO; // 안전 주소 반환
    } // 조건 끝
    return value; // 내부 주소 반환
} // 함수 끝

export function resolveAgeGateSecret(nodeEnv: string | undefined, configuredSecret: string | undefined): string | null // 서명 키 선택
{ // 함수 시작
    if (configuredSecret?.trim()) // 설정 키 확인
    { // 조건 시작
        return configuredSecret.trim(); // 설정 키 반환
    } // 조건 끝
    return nodeEnv === "production" ? null : DEVELOPMENT_SECRET; // 환경별 키 반환
} // 함수 끝

export async function createAgeVerificationToken(nowMs: number, secret: string): Promise<string> // 인증 토큰 생성
{ // 함수 시작
    const expiresAt = nowMs + AGE_GATE_MAX_AGE_MS; // 만료 시각 계산
    const payload = `${AGE_GATE_TOKEN_VERSION}.${expiresAt}`; // 서명 내용 생성
    const key = await importHmacKey(secret); // 서명 키 준비
    const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(payload)); // 서명 생성
    return `${payload}.${bytesToHex(new Uint8Array(signature))}`; // 토큰 반환
} // 함수 끝

export async function verifyAgeVerificationToken(token: string | undefined, nowMs: number, secret: string): Promise<boolean> // 인증 토큰 검증
{ // 함수 시작
    if (!token) // 토큰 누락 확인
    { // 조건 시작
        return false; // 인증 실패 반환
    } // 조건 끝
    const parts = token.split("."); // 토큰 분리
    if (parts.length !== 3 || parts[0] !== AGE_GATE_TOKEN_VERSION) // 토큰 구조 확인
    { // 조건 시작
        return false; // 인증 실패 반환
    } // 조건 끝
    const expiresAt = Number(parts[1]); // 만료 시각 변환
    const signature = hexToBytes(parts[2]); // 서명 변환
    if (!Number.isSafeInteger(expiresAt) || !signature || expiresAt <= nowMs || expiresAt > nowMs + AGE_GATE_MAX_AGE_MS) // 만료 범위 확인
    { // 조건 시작
        return false; // 인증 실패 반환
    } // 조건 끝
    const key = await importHmacKey(secret); // 검증 키 준비
    const payload = `${AGE_GATE_TOKEN_VERSION}.${expiresAt}`; // 검증 내용 생성
    return crypto.subtle.verify("HMAC", key, signature, textEncoder.encode(payload)); // 위조 여부 반환
} // 함수 끝
