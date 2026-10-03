export interface RateLimitOptions // 요청 제한 설정
{ // 형식 시작
    limit: number; // 허용 횟수
    windowMs: number; // 기준 시간(밀리초)
    now?: () => number; // 현재 시각 함수
    maxKeys?: number; // 기억할 최대 요청자 수
} // 형식 끝

export interface RateLimitResult // 요청 제한 판정
{ // 형식 시작
    allowed: boolean; // 허용 여부
    remaining: number; // 남은 횟수
    retryAfterSeconds: number; // 다시 시도까지 남은 초
} // 형식 끝

export interface RateLimiter // 요청 제한 도구
{ // 형식 시작
    check(key: string): RateLimitResult; // 요청 한 번 기록과 판정
    reset(): void; // 기록 초기화
} // 형식 끝

interface WindowRecord // 요청자별 기록
{ // 형식 시작
    count: number; // 기준 시간 안 요청 수
    resetAt: number; // 기록 만료 시각
} // 형식 끝

export function createRateLimiter(options: RateLimitOptions): RateLimiter // 요청 제한 도구 생성
{ // 함수 시작
    const now = options.now ?? Date.now; // 현재 시각 함수
    const maxKeys = options.maxKeys ?? 5_000; // 기억 한도
    const records = new Map<string, WindowRecord>(); // 요청자별 기록

    function prune(current: number): void // 오래된 기록 정리
    { // 함수 시작
        for (const [key, record] of records) // 기록 반복
        { // 반복 시작
            if (record.resetAt <= current) // 만료 확인
            { // 조건 시작
                records.delete(key); // 만료 기록 삭제
            } // 조건 끝
        } // 반복 끝
        while (records.size >= maxKeys) // 새 요청자 자리 확보
        { // 반복 시작
            const oldest = records.keys().next().value; // 가장 오래된 요청자
            if (oldest === undefined) // 빈 기록 확인
            { // 조건 시작
                break; // 정리 종료
            } // 조건 끝
            records.delete(oldest); // 오래된 기록 삭제
        } // 반복 끝
    } // 함수 끝

    function check(key: string): RateLimitResult // 요청 판정
    { // 함수 시작
        const current = now(); // 현재 시각
        const record = records.get(key); // 기존 기록
        if (!record || record.resetAt <= current) // 새 기준 시간 확인
        { // 조건 시작
            if (records.size >= maxKeys) // 기억 한도 확인
            { // 조건 시작
                prune(current); // 오래된 기록 정리
            } // 조건 끝
            records.delete(key); // 순서 갱신을 위한 삭제
            records.set(key, { count: 1, resetAt: current + options.windowMs }); // 새 기록 저장
            return { allowed: true, remaining: Math.max(0, options.limit - 1), retryAfterSeconds: 0 }; // 허용 반환
        } // 조건 끝
        if (record.count >= options.limit) // 허용 횟수 초과 확인
        { // 조건 시작
            return { allowed: false, remaining: 0, retryAfterSeconds: Math.max(1, Math.ceil((record.resetAt - current) / 1_000)) }; // 거부 반환
        } // 조건 끝
        record.count += 1; // 요청 수 증가
        return { allowed: true, remaining: options.limit - record.count, retryAfterSeconds: 0 }; // 허용 반환
    } // 함수 끝

    return { check, reset: () => records.clear() }; // 도구 반환
} // 함수 끝

export function getClientKey(request: Request): string // 요청자 구분 값
{ // 함수 시작
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(); // 프록시가 전달한 첫 주소
    const direct = request.headers.get("x-real-ip")?.trim(); // 직접 전달 주소
    const address = forwarded || direct || "unknown"; // 요청자 주소
    return address.slice(0, 64); // 길이 제한 반환
} // 함수 끝
