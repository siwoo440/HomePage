export const NEWS_TAGS = ["update", "feature", "devlog", "fix"] as const; // 허용 태그 목록
export const NEWS_STATUSES = ["draft", "published"] as const; // 허용 상태 목록

export type NewsTag = typeof NEWS_TAGS[number]; // 뉴스 태그 형식
export type NewsStatus = typeof NEWS_STATUSES[number]; // 뉴스 상태 형식

export interface NewsPostInput // 게시물 입력 형식
{ // 형식 시작
    title: string; // 게시물 제목
    summary: string; // 게시물 요약
    content: string; // 게시물 본문
    tags: string[]; // 게시물 태그
    status: string; // 공개 상태
} // 형식 끝

export interface ValidatedNewsPost // 검증된 게시물 형식
{ // 형식 시작
    title: string; // 정리된 제목
    summary: string; // 정리된 요약
    content: string; // 정리된 본문
    tags: NewsTag[]; // 정리된 태그
    status: NewsStatus; // 정리된 상태
} // 형식 끝

export type NewsValidationErrors = Partial<Record<keyof NewsPostInput, string>>; // 필드 오류 형식

export interface NewsValidationResult // 검증 결과 형식
{ // 형식 시작
    errors: NewsValidationErrors; // 필드 오류 목록
    value: ValidatedNewsPost | null; // 정상 입력 값
} // 형식 끝

export interface ImageLike // 이미지 검사 형식
{ // 형식 시작
    size: number; // 파일 크기
    type: string; // 파일 형식
} // 형식 끝

export interface NewsEditorInitialValue // 편집기 초기값 형식
{ // 형식 시작
    title: string; // 기존 제목
    summary: string; // 기존 요약
    content: string; // 기존 본문
    tags: string[]; // 기존 태그
    status: string; // 기존 상태
} // 형식 끝

export interface NewsActionState // 뉴스 액션 상태 형식
{ // 형식 시작
    message: string; // 전체 안내 문구
    errors: NewsValidationErrors & { coverImage?: string }; // 필드 오류 목록
    values: NewsEditorInitialValue | null; // 복원 입력 값
} // 형식 끝
