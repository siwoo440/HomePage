export type FieldErrors = Record<string, string | undefined>; // 필드 오류 형식

type FocusTarget = // 포커스 대상 형식
{ // 형식 시작
    focus: () => void; // 포커스 함수
}; // 형식 끝

type FocusForm = // 폼 탐색 형식
{ // 형식 시작
    querySelector: (selector: string) => FocusTarget | null; // 입력 탐색 함수
}; // 형식 끝

type FormSubmissionEvent = // 폼 제출 이벤트 형식
{ // 형식 시작
    currentTarget: FocusForm; // 제출 폼 대상
    preventDefault: () => void; // 기본 제출 차단
}; // 형식 끝

export function hasFieldErrors(errors: FieldErrors): boolean // 오류 존재 확인
{ // 함수 시작
    return Object.values(errors).some(Boolean); // 실제 오류 존재 결과
} // 함수 끝

export function createCompleteFieldErrors<T extends string>(fieldOrder: readonly T[], errors: Partial<Record<T, string | undefined>>): Record<T, string | undefined> // 완전 오류 맵 생성
{ // 함수 시작
    return Object.fromEntries(fieldOrder.map((fieldName) => [fieldName, errors[fieldName]])) as Record<T, string | undefined>; // 전체 필드 오류 반환
} // 함수 끝

export function getFirstInvalidField(fieldOrder: readonly string[], errors: FieldErrors): string | null // 첫 오류 필드 탐색
{ // 함수 시작
    return fieldOrder.find((fieldName) => Boolean(errors[fieldName])) ?? null; // 화면 순서 첫 오류 반환
} // 함수 끝

export function getFieldErrorId(formId: string, fieldName: string): string // 오류 식별자 생성
{ // 함수 시작
    const kebabFieldName = fieldName.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(); // 필드 이름 변환
    return `${formId}-${kebabFieldName}-error`; // 오류 식별자 반환
} // 함수 끝

export function focusFirstInvalidField(form: FocusForm | null, fieldOrder: readonly string[], errors: FieldErrors): string | null // 첫 오류 포커스 이동
{ // 함수 시작
    const fieldName = getFirstInvalidField(fieldOrder, errors); // 첫 오류 이름

    if (!form || !fieldName) // 포커스 불가 확인
    { // 조건 시작
        return fieldName; // 탐색 결과 반환
    } // 조건 끝

    const target = form.querySelector(`[name="${fieldName}"]`); // 오류 입력 탐색
    target?.focus(); // 입력 포커스 이동
    return fieldName; // 포커스 필드 반환
} // 함수 끝

export function preventInvalidFormSubmission(event: FormSubmissionEvent, fieldOrder: readonly string[], errors: FieldErrors): boolean // 잘못된 제출 차단
{ // 함수 시작
    if (!hasFieldErrors(errors)) // 정상 입력 확인
    { // 조건 시작
        return false; // 제출 허용 결과
    } // 조건 끝

    event.preventDefault(); // 기본 제출 차단
    focusFirstInvalidField(event.currentTarget, fieldOrder, errors); // 첫 오류 포커스
    return true; // 제출 차단 결과
} // 함수 끝
