import type { RateLimitResult } from "./rate-limit.ts"; // 요청 제한 판정 형식

export const JSON_BODY_MAX_BYTES = 10_000; // 기본 요청 본문 한도
const NO_STORE = { "Cache-Control": "no-store" }; // 캐시 금지 머리말

export type JsonBodyResult = // JSON 본문 읽기 결과
    | { ok: true; value: Record<string, unknown> } // 정상 본문
    | { ok: false; status: number; message: string }; // 실패 사유

export function jsonNoStore(body: unknown, status = 200, headers: Record<string, string> = {}): Response // 캐시하지 않는 JSON 응답
{ // 함수 시작
    return Response.json(body, { status, headers: { ...NO_STORE, ...headers } }); // 응답 반환
} // 함수 끝

export function rateLimitedResponse(result: RateLimitResult): Response // 요청 제한 응답
{ // 함수 시작
    return jsonNoStore({ ok: false, message: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." }, 429, { "Retry-After": String(result.retryAfterSeconds) }); // 제한 안내 반환
} // 함수 끝

export async function readJsonBody(request: Request, maxBytes = JSON_BODY_MAX_BYTES): Promise<JsonBodyResult> // JSON 본문 읽기
{ // 함수 시작
    const declared = Number(request.headers.get("content-length") ?? "0"); // 알려 준 본문 크기
    if (Number.isFinite(declared) && declared > maxBytes) // 큰 본문 확인
    { // 조건 시작
        return { ok: false, status: 413, message: "보낸 내용이 너무 깁니다." }; // 크기 초과 반환
    } // 조건 끝
    let text = ""; // 본문 글자
    try // 본문 읽기 시도
    { // 시도 시작
        text = await request.text(); // 본문 읽기
    } // 시도 끝
    catch // 읽기 실패 처리
    { // 오류 처리 시작
        return { ok: false, status: 400, message: "요청 내용을 확인해 주세요." }; // 잘못된 요청 반환
    } // 오류 처리 끝
    if (new TextEncoder().encode(text).length > maxBytes) // 실제 크기 확인
    { // 조건 시작
        return { ok: false, status: 413, message: "보낸 내용이 너무 깁니다." }; // 크기 초과 반환
    } // 조건 끝
    try // 해석 시도
    { // 시도 시작
        const value: unknown = JSON.parse(text); // JSON 해석
        if (value === null || typeof value !== "object" || Array.isArray(value)) // 객체 형식 확인
        { // 조건 시작
            return { ok: false, status: 400, message: "요청 내용을 확인해 주세요." }; // 잘못된 형식 반환
        } // 조건 끝
        return { ok: true, value: value as Record<string, unknown> }; // 정상 본문 반환
    } // 시도 끝
    catch // 해석 실패 처리
    { // 오류 처리 시작
        return { ok: false, status: 400, message: "요청 내용을 확인해 주세요." }; // 잘못된 요청 반환
    } // 오류 처리 끝
} // 함수 끝
