"use client"; // 브라우저 상호작용 모듈

import Link from "next/link"; // 내부 이동 링크
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react"; // 화면 상태 도구
import { createDemoComments, REPORT_REASONS, REACTION_TYPES, toggleCommentReaction, validateCommentContent, validateCommentImage, type NewsComment, type ReactionType } from "@/lib/comments/domain"; // 댓글 규칙 도구
import { MEMBER_DEMO_STORAGE_KEY, parseDemoMemberProfile, type DemoMemberProfile } from "@/lib/member/demo-session"; // 시연 회원 도구
import styles from "./news-detail.module.css"; // 뉴스 상세 스타일

interface CommentsPanelProps // 댓글 영역 속성
{ // 형식 시작
    newsId: string; // 뉴스 식별자
    demoMode: boolean; // 시연 모드 여부
} // 형식 끝

const REACTION_LABELS: Record<ReactionType, string> = { like: "좋아요", cheer: "응원", curious: "궁금해요" }; // 반응 표시 이름

function readImageAsDataUrl(file: File | null): Promise<string | null> // 시연 이미지 읽기
{ // 함수 시작
    if (!file) // 이미지 없음 확인
    { // 조건 시작
        return Promise.resolve(null); // 빈 이미지 반환
    } // 조건 끝

    return new Promise((resolve, reject) => // 파일 읽기 약속 생성
    { // 약속 시작
        const reader = new FileReader(); // 파일 읽기 도구
        reader.addEventListener("load", () => resolve(typeof reader.result === "string" ? reader.result : null)); // 읽기 완료 처리
        reader.addEventListener("error", () => reject(new Error("IMAGE_READ_FAILED"))); // 읽기 실패 처리
        reader.readAsDataURL(file); // 데이터 주소 읽기
    }); // 약속 끝
} // 함수 끝

export default function CommentsPanel({ newsId, demoMode }: CommentsPanelProps) // 댓글 상호작용 영역
{ // 함수 시작
    const [profile, setProfile] = useState<DemoMemberProfile | null>(null); // 현재 시연 회원
    const [comments, setComments] = useState<NewsComment[]>(() => createDemoComments(newsId)); // 댓글 목록 상태
    const [content, setContent] = useState(""); // 댓글 입력 상태
    const [replyTo, setReplyTo] = useState<string | null>(null); // 답글 대상 상태
    const [imageFile, setImageFile] = useState<File | null>(null); // 첨부 이미지 상태
    const [imagePreview, setImagePreview] = useState<string | null>(null); // 이미지 미리보기 주소
    const [message, setMessage] = useState(""); // 입력 안내 상태
    const [reportedIds, setReportedIds] = useState<string[]>([]); // 신고 완료 목록

    useEffect(() => // 회원 상태 읽기
    { // 효과 시작
        setProfile(parseDemoMemberProfile(window.sessionStorage.getItem(MEMBER_DEMO_STORAGE_KEY))); // 시연 회원 복원
    }, []); // 최초 한 번 실행

    useEffect(() => // 이미지 주소 정리
    { // 효과 시작
        return () => // 정리 함수 반환
        { // 정리 시작
            if (imagePreview) // 미리보기 존재 확인
            { // 조건 시작
                URL.revokeObjectURL(imagePreview); // 임시 주소 해제
            } // 조건 끝
        }; // 정리 끝
    }, [imagePreview]); // 이미지 변경 시 실행

    const rootComments = useMemo(() => comments.filter((comment) => comment.parentId === null), [comments]); // 최상위 댓글 목록

    function handleImageChange(event: ChangeEvent<HTMLInputElement>) // 이미지 선택 처리
    { // 함수 시작
        const nextFile = event.target.files?.[0] ?? null; // 선택 파일 읽기
        const result = validateCommentImage(nextFile); // 이미지 검증

        if (!result.ok) // 검증 실패 확인
        { // 조건 시작
            setMessage(result.message); // 오류 안내 설정
            event.target.value = ""; // 파일 선택 초기화
            return; // 변경 처리 종료
        } // 조건 끝

        setMessage(""); // 이전 안내 제거
        setImageFile(nextFile); // 이미지 상태 저장
        setImagePreview(nextFile ? URL.createObjectURL(nextFile) : null); // 미리보기 주소 생성
    } // 함수 끝

    async function handleSubmit(event: FormEvent<HTMLFormElement>) // 댓글 등록 처리
    { // 함수 시작
        event.preventDefault(); // 기본 제출 차단

        if (!profile || !demoMode) // 작성 가능 상태 확인
        { // 조건 시작
            setMessage("시연 로그인 후 댓글 화면을 확인할 수 있습니다."); // 로그인 안내 설정
            return; // 등록 처리 종료
        } // 조건 끝

        const contentResult = validateCommentContent(content); // 댓글 내용 검증
        const imageResult = validateCommentImage(imageFile); // 댓글 이미지 검증

        if (!contentResult.ok) // 내용 오류 확인
        { // 조건 시작
            setMessage(contentResult.message); // 내용 오류 안내
            return; // 등록 처리 종료
        } // 조건 끝

        if (!imageResult.ok) // 이미지 오류 확인
        { // 조건 시작
            setMessage(imageResult.message); // 이미지 오류 안내
            return; // 등록 처리 종료
        } // 조건 끝

        const parent = replyTo ? comments.find((comment) => comment.id === replyTo && comment.parentId === null) : null; // 정상 부모 댓글 찾기
        const storedImageUrl = await readImageAsDataUrl(imageFile); // 시연 이미지 데이터 읽기
        const nextComment: NewsComment = { id: `demo-user-${Date.now()}`, newsId, parentId: parent?.id ?? null, authorId: profile.id, nickname: profile.nickname, content: contentResult.value, imageUrl: storedImageUrl, createdAt: new Date().toISOString(), reactions: { like: { count: 0, selectedBy: [] }, cheer: { count: 0, selectedBy: [] }, curious: { count: 0, selectedBy: [] } } }; // 새 댓글 생성
        setComments((current) => [...current, nextComment]); // 댓글 목록 추가
        setContent(""); // 댓글 입력 초기화
        setReplyTo(null); // 답글 대상 초기화
        setImageFile(null); // 이미지 파일 초기화
        setImagePreview(null); // 이미지 미리보기 초기화
        setMessage("시연 댓글이 현재 화면에 추가되었습니다. 새로고침하면 초기화됩니다."); // 등록 안내 설정
    } // 함수 끝

    function handleReaction(commentId: string, reaction: ReactionType) // 반응 선택 처리
    { // 함수 시작
        if (!profile) // 회원 없음 확인
        { // 조건 시작
            setMessage("반응을 남기려면 먼저 로그인해 주세요."); // 로그인 안내 설정
            return; // 반응 처리 종료
        } // 조건 끝

        setComments((current) => current.map((comment) => comment.id === commentId ? toggleCommentReaction(comment, profile.id, reaction) : comment)); // 반응 상태 갱신
    } // 함수 끝

    function renderComment(comment: NewsComment) // 댓글 카드 생성
    { // 함수 시작
        const isReply = comment.parentId !== null; // 답글 여부
        const reportDone = reportedIds.includes(comment.id); // 신고 완료 여부
        return ( // 댓글 카드 반환
            <article className={`${styles.commentCard} ${isReply ? styles.replyCard : ""}`} key={comment.id}> {/* 댓글 카드 */}
                <header className={styles.commentHeader}> {/* 작성 정보 */}
                    <strong>{comment.nickname}</strong> {/* 작성자 이름 */}
                    <time dateTime={comment.createdAt}>{new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(comment.createdAt))}</time> {/* 작성 시각 */}
                </header> {/* 작성 정보 끝 */}
                <p className={styles.commentContent}>{comment.content}</p> {/* 댓글 내용 */}
                {comment.imageUrl ? <img className={styles.commentImage} src={comment.imageUrl} alt="댓글 첨부 이미지" /> : null} {/* 댓글 이미지 */}
                <div className={styles.commentActions}> {/* 댓글 작업 묶음 */}
                    {REACTION_TYPES.map((reaction) => <button type="button" key={reaction} onClick={() => handleReaction(comment.id, reaction)} aria-pressed={profile ? comment.reactions[reaction].selectedBy.includes(profile.id) : false}>{REACTION_LABELS[reaction]} {comment.reactions[reaction].count}</button>)} {/* 반응 버튼 목록 */}
                    {!isReply ? <button type="button" onClick={() => setReplyTo(comment.id)}>답글</button> : null} {/* 답글 버튼 */}
                    <button type="button" onClick={() => setReportedIds((current) => current.includes(comment.id) ? current : [...current, comment.id])} disabled={reportDone}>{reportDone ? "신고 접수됨" : "신고"}</button> {/* 신고 버튼 */}
                </div> {/* 댓글 작업 묶음 끝 */}
                {!reportDone ? <select className={styles.reportSelect} aria-label={`${comment.nickname} 댓글 신고 사유`} defaultValue="spam">{REPORT_REASONS.map((reason) => <option key={reason.value} value={reason.value}>{reason.label}</option>)}</select> : null} {/* 신고 사유 선택 */}
            </article> // 댓글 카드 끝
        ); // 댓글 카드 반환 끝
    } // 함수 끝

    return ( // 댓글 영역 반환
        <section className={styles.comments} aria-labelledby="comments-title"> {/* 댓글 전체 영역 */}
            <div className={styles.commentsHeading}> {/* 댓글 제목 묶음 */}
                <div> {/* 제목 내용 */}
                    <p className={styles.commentEyebrow}>// COMMUNITY TALK</p> {/* 영문 분류 */}
                    <h2 id="comments-title">댓글과 반응</h2> {/* 댓글 제목 */}
                </div> {/* 제목 내용 끝 */}
                <span>{comments.length}개</span> {/* 댓글 개수 */}
            </div> {/* 댓글 제목 묶음 끝 */}
            <p className={styles.demoNotice}>{demoMode ? "시연 모드 · 입력 내용은 서버에 저장되지 않으며 새로고침하면 초기화됩니다." : "댓글 서버 연결 준비 중"}</p> {/* 저장 상태 안내 */}
            {profile ? <form className={styles.commentForm} onSubmit={handleSubmit}> {/* 댓글 입력 폼 */}
                <label htmlFor="comment-content">{replyTo ? "답글 작성" : `${profile.nickname} 이름으로 댓글 작성`}</label> {/* 댓글 입력 이름 */}
                {replyTo ? <button className={styles.cancelReply} type="button" onClick={() => setReplyTo(null)}>답글 취소</button> : null} {/* 답글 취소 버튼 */}
                <textarea id="comment-content" value={content} onChange={(event) => setContent(event.target.value)} maxLength={2000} placeholder="서로 존중하는 댓글을 남겨 주세요." /> {/* 댓글 내용 입력 */}
                <div className={styles.formActions}> {/* 입력 작업 묶음 */}
                    <label className={styles.imageButton} htmlFor="comment-image">이미지 추가</label> {/* 이미지 선택 이름 */}
                    <input className={styles.hiddenInput} id="comment-image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageChange} /> {/* 이미지 파일 입력 */}
                    <button className={styles.submitButton} type="submit">{replyTo ? "답글 등록" : "댓글 등록"}</button> {/* 댓글 등록 버튼 */}
                </div> {/* 입력 작업 묶음 끝 */}
                {imagePreview ? <img className={styles.imagePreview} src={imagePreview} alt="첨부할 이미지 미리보기" /> : null} {/* 이미지 미리보기 */}
            </form> : <Link className={styles.loginPrompt} href={`/login?returnTo=${encodeURIComponent(`/news/${newsId}`)}`}>로그인하고 댓글 남기기</Link>} {/* 로그인 상태 입력 */}
            {message ? <p className={styles.commentMessage} role="status">{message}</p> : null} {/* 입력 안내 */}
            <div className={styles.commentList}> {/* 댓글 목록 */}
                {rootComments.map((comment) => <div className={styles.commentThread} key={comment.id}>{renderComment(comment)}{comments.filter((reply) => reply.parentId === comment.id).map(renderComment)}</div>)} {/* 댓글과 답글 목록 */}
            </div> {/* 댓글 목록 끝 */}
        </section> // 댓글 전체 영역 끝
    ); // 댓글 영역 반환 끝
} // 함수 끝
