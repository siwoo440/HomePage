"use client"; // 브라우저 편집 모듈

import { useActionState, useEffect, useRef, useState } from "react"; // 폼 상태 도구
import type { ChangeEvent, FormEvent } from "react"; // 폼 이벤트 형식
import { createCompleteFieldErrors, focusFirstInvalidField, getFieldErrorId, hasFieldErrors, preventInvalidFormSubmission } from "@/lib/forms/validation"; // 공용 오류 도구
import { readCoverImage, readNewsValues, validateCoverImage, validateNewsPost } from "@/lib/news/validation"; // 뉴스 검증 도구
import { NEWS_TAGS } from "@/lib/news/types"; // 허용 태그 목록
import type { NewsActionState, NewsEditorInitialValue } from "@/lib/news/types"; // 편집기 자료 형식

interface NewsEditorProps // 편집기 속성
{ // 형식 시작
    action: (state: NewsActionState, formData: FormData) => Promise<NewsActionState>; // 저장 서버 액션
    initialValue?: NewsEditorInitialValue; // 기존 게시물 값
    submitLabel: string; // 제출 버튼 문구
} // 형식 끝

const INITIAL_STATE: NewsActionState = // 초기 폼 상태
{ // 상태 객체 시작
    message: "", // 초기 안내 문구
    errors: {}, // 초기 오류 목록
    values: null, // 초기 입력 값
}; // 상태 객체 끝

const NEWS_FORM_ID = "news-editor"; // 폼 식별자
const NEWS_FIELD_ORDER = ["title", "summary", "content", "tags", "coverImage", "status"] as const; // 화면 필드 순서
type NewsFieldName = typeof NEWS_FIELD_ORDER[number]; // 뉴스 필드 이름
const TAG_LABELS: Record<string, string> = // 태그 표시 이름
{ // 이름 객체 시작
    update: "업데이트", // 업데이트 이름
    feature: "신기능", // 신기능 이름
    devlog: "데브로그", // 데브로그 이름
    fix: "버그픽스", // 버그픽스 이름
}; // 이름 객체 끝

function isNewsFieldName(fieldName: string): fieldName is NewsFieldName // 뉴스 필드 이름 판정
{ // 함수 시작
    return NEWS_FIELD_ORDER.includes(fieldName as NewsFieldName); // 허용 필드 포함 결과
} // 함수 끝

export default function NewsEditor({ action, initialValue, submitLabel }: NewsEditorProps) // 뉴스 편집 화면
{ // 함수 시작
    const [state, formAction, isPending] = useActionState(action, INITIAL_STATE); // 서버 액션 상태
    const [clientErrors, setClientErrors] = useState<NewsActionState["errors"]>({}); // 브라우저 오류 상태
    const formRef = useRef<HTMLFormElement>(null); // 폼 참조
    const values = state.values ?? initialValue; // 표시할 입력 값
    const [contentLength, setContentLength] = useState(values?.content.length ?? 0); // 본문 길이 상태
    const serverErrors = isPending ? {} : state.errors; // 제출 중 이전 서버 오류 제외
    const errors = { ...serverErrors, ...clientErrors }; // 통합 오류 목록
    const visibleMessage = hasFieldErrors(errors) ? hasFieldErrors(clientErrors) ? "입력한 내용을 확인해 주세요." : state.message : hasFieldErrors(serverErrors) ? "" : isPending ? "" : state.message; // 현재 오류 안내

    useEffect(() => // 서버 오류 포커스 처리
    { // 효과 시작
        if (hasFieldErrors(state.errors)) // 서버 오류 확인
        { // 조건 시작
            focusFirstInvalidField(formRef.current, NEWS_FIELD_ORDER, state.errors); // 첫 서버 오류 포커스
        } // 조건 끝
    }, [state.errors]); // 서버 오류 변경 감시

    function handleChange(event: ChangeEvent<HTMLFormElement>): void // 입력 변경 처리
    { // 함수 시작
        const fieldName = event.target.name; // 변경 필드 이름

        if (isNewsFieldName(fieldName) && errors[fieldName]) // 기존 오류 확인
        { // 조건 시작
            setClientErrors((current) => ({ ...current, [fieldName]: undefined })); // 변경 필드 오류 해제
        } // 조건 끝
    } // 함수 끝

    function handleSubmit(event: FormEvent<HTMLFormElement>): void // 제출 전 검증
    { // 함수 시작
        const formData = new FormData(event.currentTarget); // 현재 폼 데이터
        const validation = validateNewsPost(readNewsValues(formData)); // 뉴스 입력 검증
        const coverImageError = validateCoverImage(readCoverImage(formData)); // 대표 이미지 검증
        const nextErrors: NewsActionState["errors"] = { ...validation.errors, coverImage: coverImageError ?? undefined }; // 통합 검증 오류

        if (!preventInvalidFormSubmission(event, NEWS_FIELD_ORDER, nextErrors)) // 정상 입력 확인
        { // 조건 시작
            setClientErrors({}); // 브라우저 오류 초기화
            return; // 서버 제출 허용
        } // 조건 끝

        setClientErrors(createCompleteFieldErrors(NEWS_FIELD_ORDER, nextErrors)); // 브라우저 오류 저장
    } // 함수 끝

    return ( // 편집 화면 반환
        <form ref={formRef} className="news-editor" action={formAction} onSubmit={handleSubmit} noValidate aria-busy={isPending} onChange={handleChange}> {/* 뉴스 편집 폼 */}
            <section className="editor-main"> {/* 주요 편집 영역 */}
                <label className="editor-field"> {/* 제목 입력 묶음 */}
                    <span>제목</span> {/* 제목 이름 */}
                    <input name="title" defaultValue={values?.title ?? ""} maxLength={120} placeholder="개발 뉴스 제목" required aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? getFieldErrorId(NEWS_FORM_ID, "title") : undefined} /> {/* 제목 입력 */}
                    {errors.title ? <small className="field-error" id={getFieldErrorId(NEWS_FORM_ID, "title")}>{errors.title}</small> : null} {/* 제목 오류 */}
                </label> {/* 제목 입력 묶음 끝 */}
                <label className="editor-field"> {/* 요약 입력 묶음 */}
                    <span>목록 요약</span> {/* 요약 이름 */}
                    <textarea name="summary" defaultValue={values?.summary ?? ""} maxLength={300} rows={3} placeholder="목록에 표시할 짧은 설명" aria-invalid={Boolean(errors.summary)} aria-describedby={errors.summary ? getFieldErrorId(NEWS_FORM_ID, "summary") : undefined} /> {/* 요약 입력 */}
                    {errors.summary ? <small className="field-error" id={getFieldErrorId(NEWS_FORM_ID, "summary")}>{errors.summary}</small> : null} {/* 요약 오류 */}
                </label> {/* 요약 입력 묶음 끝 */}
                <label className="editor-field editor-content-field"> {/* 본문 입력 묶음 */}
                    <span>본문</span> {/* 본문 이름 */}
                    <textarea name="content" defaultValue={values?.content ?? ""} maxLength={50000} rows={20} placeholder="개발 과정과 변경 내용을 작성하세요." onChange={(event) => setContentLength(event.target.value.length)} required aria-invalid={Boolean(errors.content)} aria-describedby={errors.content ? getFieldErrorId(NEWS_FORM_ID, "content") : undefined} /> {/* 본문 입력 */}
                    <span className="character-count">{contentLength.toLocaleString("ko-KR")} / 50,000자</span> {/* 본문 글자 수 */}
                    {errors.content ? <small className="field-error" id={getFieldErrorId(NEWS_FORM_ID, "content")}>{errors.content}</small> : null} {/* 본문 오류 */}
                </label> {/* 본문 입력 묶음 끝 */}
            </section> {/* 주요 편집 영역 끝 */}
            <aside className="editor-sidebar"> {/* 발행 설정 영역 */}
                <fieldset className="editor-panel" aria-invalid={Boolean(errors.tags)} aria-describedby={errors.tags ? getFieldErrorId(NEWS_FORM_ID, "tags") : undefined}> {/* 태그 선택 묶음 */}
                    <legend>태그</legend> {/* 태그 제목 */}
                    <div className="tag-choice-list"> {/* 태그 목록 */}
                        {NEWS_TAGS.map((tag) => ( // 태그 반복 시작
                            <label className="tag-choice" key={tag}> {/* 태그 선택 */}
                                <input name="tags" type="checkbox" value={tag} defaultChecked={values?.tags.includes(tag) ?? tag === "devlog"} /> {/* 태그 입력 */}
                                <span>{TAG_LABELS[tag]}</span> {/* 태그 표시 이름 */}
                            </label> // 태그 선택 끝
                        ))} {/* 태그 반복 끝 */}
                    </div> {/* 태그 목록 끝 */}
                    {errors.tags ? <small className="field-error" id={getFieldErrorId(NEWS_FORM_ID, "tags")}>{errors.tags}</small> : null} {/* 태그 오류 */}
                </fieldset> {/* 태그 선택 묶음 끝 */}
                <label className="editor-panel editor-field"> {/* 이미지 입력 묶음 */}
                    <span>대표 이미지</span> {/* 이미지 이름 */}
                    <input name="coverImage" type="file" accept="image/jpeg,image/png,image/webp" aria-invalid={Boolean(errors.coverImage)} aria-describedby={errors.coverImage ? getFieldErrorId(NEWS_FORM_ID, "coverImage") : undefined} /> {/* 이미지 입력 */}
                    <small>JPG, PNG, WebP · 최대 5MB</small> {/* 이미지 제한 안내 */}
                    {errors.coverImage ? <small className="field-error" id={getFieldErrorId(NEWS_FORM_ID, "coverImage")}>{errors.coverImage}</small> : null} {/* 이미지 오류 */}
                </label> {/* 이미지 입력 묶음 끝 */}
                <label className="editor-panel editor-field"> {/* 상태 선택 묶음 */}
                    <span>공개 상태</span> {/* 상태 이름 */}
                    <select name="status" defaultValue={values?.status ?? "draft"} aria-invalid={Boolean(errors.status)} aria-describedby={errors.status ? getFieldErrorId(NEWS_FORM_ID, "status") : undefined}> {/* 상태 선택 */}
                        <option value="draft">초안</option> {/* 초안 선택 */}
                        <option value="published">공개</option> {/* 공개 선택 */}
                    </select> {/* 상태 선택 끝 */}
                    {errors.status ? <small className="field-error" id={getFieldErrorId(NEWS_FORM_ID, "status")}>{errors.status}</small> : null} {/* 상태 오류 */}
                </label> {/* 상태 선택 묶음 끝 */}
                {visibleMessage ? <p className="admin-message admin-message-error" role="alert">{visibleMessage}</p> : null} {/* 저장 오류 안내 */}
                <button className="admin-primary-button" type="submit" disabled={isPending}>{isPending ? "저장 중…" : submitLabel}</button> {/* 저장 버튼 */}
            </aside> {/* 발행 설정 영역 끝 */}
        </form> // 뉴스 편집 폼 끝
    ); // 편집 화면 반환 끝
} // 함수 끝
