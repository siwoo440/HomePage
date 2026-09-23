import { createAgeVerificationToken, isAdultBirthDate, isValidBirthDate, sanitizeAgeReturnTo } from "./verification.ts"; // 인증 규칙 함수

interface AgeVerificationInput // 인증 입력 형식
{ // 형식 시작
    birthDate?: unknown; // 생년월일 입력
    agreed?: unknown; // 성인 동의 입력
    returnTo?: unknown; // 복귀 주소 입력
} // 형식 끝

interface AgeVerificationFailure // 인증 실패 형식
{ // 형식 시작
    ok: false; // 실패 표시
    status: 400 | 403 | 503; // 실패 상태 코드
    message: string; // 실패 안내
} // 형식 끝

interface AgeVerificationSuccess // 인증 성공 형식
{ // 형식 시작
    ok: true; // 성공 표시
    status: 200; // 성공 상태 코드
    token: string; // 서명 토큰
    returnTo: string; // 안전한 복귀 주소
} // 형식 끝

export type AgeVerificationResult = AgeVerificationFailure | AgeVerificationSuccess; // 인증 결과 형식

export async function processAgeVerification(body: unknown, today: Date, secret: string | null): Promise<AgeVerificationResult> // 인증 요청 처리
{ // 함수 시작
    if (!secret) // 서명 키 누락 확인
    { // 조건 시작
        return { ok: false, status: 503, message: "성인 확인 설정이 준비되지 않았습니다." }; // 설정 오류 반환
    } // 조건 끝
    if (!body || typeof body !== "object" || Array.isArray(body)) // 본문 형식 확인
    { // 조건 시작
        return { ok: false, status: 400, message: "요청 내용을 확인해 주세요." }; // 본문 오류 반환
    } // 조건 끝
    const input = body as AgeVerificationInput; // 입력 형식 변환
    if (input.agreed !== true) // 성인 동의 확인
    { // 조건 시작
        return { ok: false, status: 400, message: "만 19세 이상임에 동의해 주세요." }; // 동의 오류 반환
    } // 조건 끝
    if (typeof input.birthDate !== "string" || !isValidBirthDate(input.birthDate)) // 날짜 유효성 확인
    { // 조건 시작
        return { ok: false, status: 400, message: "올바른 생년월일을 입력해 주세요." }; // 날짜 오류 반환
    } // 조건 끝
    if (!isAdultBirthDate(input.birthDate, today)) // 성인 여부 확인
    { // 조건 시작
        return { ok: false, status: 403, message: "만 19세 이상만 열람할 수 있습니다." }; // 미성년 오류 반환
    } // 조건 끝
    const token = await createAgeVerificationToken(today.getTime(), secret); // 서명 토큰 생성
    const returnTo = sanitizeAgeReturnTo(typeof input.returnTo === "string" ? input.returnTo : null); // 복귀 주소 정리
    return { ok: true, status: 200, token, returnTo }; // 인증 성공 반환
} // 함수 끝
