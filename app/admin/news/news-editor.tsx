"use client"; // 브라우저 편집 모듈

import { useActionState, useState } from "react"; // 폼 상태 도구
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

const TAG_LABELS: Record<string, string> = // 태그 표시 이름
{ // 이름 객체 시작
    update: "업데이트", // 업데이트 이름
    feature: "신기능", // 신기능 이름
    devlog: "데브로그", // 데브로그 이름
    fix: "버그픽스", // 버그픽스 이름
}; // 이름 객체 끝

export default function NewsEditor({ action, initialValue, submitLabel }: NewsEditorProps) // 뉴스 편집 화면
{ // 함수 시작
    const [state, formAction, isPending] = useActionState(action, INITIAL_STATE); // 서버 액션 상태
    const values = state.values ?? initialValue; // 표시할 입력 값
    const [contentLength, setContentLength] = useState(values?.content.length ?? 0); // 본문 길이 상태

    return ( // 편집 화면 반환
        <form className="news-editor" action={formAction}> {/* 뉴스 편집 폼 */}
            <section className="editor-main"> {/* 주요 편집 영역 */}
                <label className="editor-field"> {/* 제목 입력 묶음 */}
                    <span>제목</span> {/* 제목 이름 */}
                    <input name="title" defaultValue={values?.title ?? ""} maxLength={120} placeholder="개발 뉴스 제목" required /> {/* 제목 입력 */}
                    {state.errors.title ? <small className="field-error">{state.errors.title}</small> : null} {/* 제목 오류 */}
                </label> {/* 제목 입력 묶음 끝 */}
                <label className="editor-field"> {/* 요약 입력 묶음 */}
                    <span>목록 요약</span> {/* 요약 이름 */}
                    <textarea name="summary" defaultValue={values?.summary ?? ""} maxLength={300} rows={3} placeholder="목록에 표시할 짧은 설명" /> {/* 요약 입력 */}
                    {state.errors.summary ? <small className="field-error">{state.errors.summary}</small> : null} {/* 요약 오류 */}
                </label> {/* 요약 입력 묶음 끝 */}
                <label className="editor-field editor-content-field"> {/* 본문 입력 묶음 */}
                    <span>본문</span> {/* 본문 이름 */}
                    <textarea name="content" defaultValue={values?.content ?? ""} maxLength={50000} rows={20} placeholder="개발 과정과 변경 내용을 작성하세요." onChange={(event) => setContentLength(event.target.value.length)} required /> {/* 본문 입력 */}
                    <span className="character-count">{contentLength.toLocaleString("ko-KR")} / 50,000자</span> {/* 본문 글자 수 */}
                    {state.errors.content ? <small className="field-error">{state.errors.content}</small> : null} {/* 본문 오류 */}
                </label> {/* 본문 입력 묶음 끝 */}
            </section> {/* 주요 편집 영역 끝 */}
            <aside className="editor-sidebar"> {/* 발행 설정 영역 */}
                <fieldset className="editor-panel"> {/* 태그 선택 묶음 */}
                    <legend>태그</legend> {/* 태그 제목 */}
                    <div className="tag-choice-list"> {/* 태그 목록 */}
                        {NEWS_TAGS.map((tag) => ( // 태그 반복 시작
                            <label className="tag-choice" key={tag}> {/* 태그 선택 */}
                                <input name="tags" type="checkbox" value={tag} defaultChecked={values?.tags.includes(tag) ?? tag === "devlog"} /> {/* 태그 입력 */}
                                <span>{TAG_LABELS[tag]}</span> {/* 태그 표시 이름 */}
                            </label> // 태그 선택 끝
                        ))} {/* 태그 반복 끝 */}
                    </div> {/* 태그 목록 끝 */}
                    {state.errors.tags ? <small className="field-error">{state.errors.tags}</small> : null} {/* 태그 오류 */}
                </fieldset> {/* 태그 선택 묶음 끝 */}
                <label className="editor-panel editor-field"> {/* 이미지 입력 묶음 */}
                    <span>대표 이미지</span> {/* 이미지 이름 */}
                    <input name="coverImage" type="file" accept="image/jpeg,image/png,image/webp" /> {/* 이미지 입력 */}
                    <small>JPG, PNG, WebP · 최대 5MB</small> {/* 이미지 제한 안내 */}
                    {state.errors.coverImage ? <small className="field-error">{state.errors.coverImage}</small> : null} {/* 이미지 오류 */}
                </label> {/* 이미지 입력 묶음 끝 */}
                <label className="editor-panel editor-field"> {/* 상태 선택 묶음 */}
                    <span>공개 상태</span> {/* 상태 이름 */}
                    <select name="status" defaultValue={values?.status ?? "draft"}> {/* 상태 선택 */}
                        <option value="draft">초안</option> {/* 초안 선택 */}
                        <option value="published">공개</option> {/* 공개 선택 */}
                    </select> {/* 상태 선택 끝 */}
                    {state.errors.status ? <small className="field-error">{state.errors.status}</small> : null} {/* 상태 오류 */}
                </label> {/* 상태 선택 묶음 끝 */}
                {state.message ? <p className="admin-message admin-message-error" role="alert">{state.message}</p> : null} {/* 저장 오류 안내 */}
                <button className="admin-primary-button" type="submit" disabled={isPending}>{isPending ? "저장 중…" : submitLabel}</button> {/* 저장 버튼 */}
            </aside> {/* 발행 설정 영역 끝 */}
        </form> // 뉴스 편집 폼 끝
    ); // 편집 화면 반환 끝
} // 함수 끝
