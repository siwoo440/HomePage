import { COMMENT_BANNED_WORDS } from "./banned-words.ts"; // 댓글 금칙어 목록

export const COMMENT_MIN_INTERVAL_SECONDS = 30; // 연속 작성 최소 간격(초)
export const COMMENT_WINDOW_MINUTES = 10; // 작성 수 제한 구간(분)
export const COMMENT_WINDOW_MAX = 5; // 구간 안 최대 작성 수
export const COMMENT_DUPLICATE_HOURS = 24; // 같은 내용 금지 기간(시간)
export const COMMENT_MAX_LINKS = 2; // 댓글 하나의 최대 링크 수
export const COMMENT_HISTORY_LIMIT = 50; // 확인할 최근 댓글 수

export type CommentBlockReason = "too_fast" | "rate_limited" | "duplicate" | "too_many_links" | "banned_word"; // 자동 차단 사유

export interface CommentHistoryEntry // 회원의 최근 댓글
{ // 형식 시작
    content: string; // 댓글 내용
    createdAt: string; // 작성 시각
} // 형식 끝

export interface CommentBlock // 자동 차단 결과
{ // 형식 시작
    reason: CommentBlockReason; // 차단 사유
    message: string; // 안내 문구
} // 형식 끝

const LINK_PATTERN = /(?:https?:\/\/|www\.)\S+/gi; // 링크 판별 규칙
const INVISIBLE_PATTERN = /[\s​-‍﻿]+/g; // 공백과 보이지 않는 글자

export function countCommentLinks(content: string): number // 댓글 링크 수
{ // 함수 시작
    return (content.match(LINK_PATTERN) ?? []).length; // 링크 수 반환
} // 함수 끝

export function findBannedWord(content: string, words: readonly string[] = COMMENT_BANNED_WORDS): string | null // 금칙어 찾기
{ // 함수 시작
    const compact = content.replace(INVISIBLE_PATTERN, "").toLowerCase(); // 띄어 쓴 금칙어도 찾도록 공백 제거
    return words.find((word) => compact.includes(word)) ?? null; // 처음 걸린 금칙어 반환
} // 함수 끝

export function normalizeForDuplicate(content: string): string // 같은 내용 비교용 정리
{ // 함수 시작
    return content.replace(/\s+/g, " ").trim().toLowerCase(); // 공백과 대소문자 정리
} // 함수 끝

export function getCommentBlockMessage(reason: CommentBlockReason, retryAfterSeconds = 0): string // 차단 안내 문구
{ // 함수 시작
    if (reason === "too_fast") // 연속 작성 확인
    { // 조건 시작
        return retryAfterSeconds > 0 ? `댓글은 ${COMMENT_MIN_INTERVAL_SECONDS}초에 한 번만 쓸 수 있습니다. ${retryAfterSeconds}초 뒤에 다시 시도해 주세요.` : `댓글은 ${COMMENT_MIN_INTERVAL_SECONDS}초에 한 번만 쓸 수 있습니다. 잠시 뒤에 다시 시도해 주세요.`; // 연속 작성 안내
    } // 조건 끝

    if (reason === "rate_limited") // 작성 수 초과 확인
    { // 조건 시작
        return retryAfterSeconds > 0 ? `${COMMENT_WINDOW_MINUTES}분 동안 댓글을 ${COMMENT_WINDOW_MAX}개까지 쓸 수 있습니다. ${Math.ceil(retryAfterSeconds / 60)}분 뒤에 다시 시도해 주세요.` : `${COMMENT_WINDOW_MINUTES}분 동안 댓글을 ${COMMENT_WINDOW_MAX}개까지 쓸 수 있습니다. 잠시 뒤에 다시 시도해 주세요.`; // 작성 수 안내
    } // 조건 끝

    if (reason === "duplicate") // 같은 내용 확인
    { // 조건 시작
        return "같은 내용의 댓글을 이미 남기셨습니다. 내용을 바꿔서 써 주세요."; // 같은 내용 안내
    } // 조건 끝

    if (reason === "too_many_links") // 링크 수 확인
    { // 조건 시작
        return `댓글에는 링크를 ${COMMENT_MAX_LINKS}개까지만 넣을 수 있습니다.`; // 링크 수 안내
    } // 조건 끝

    return "댓글에 사용할 수 없는 표현이 들어 있습니다. 내용을 고쳐 주세요."; // 금칙어 안내
} // 함수 끝

export function checkCommentContentRules(content: string): CommentBlock | null // 내용 규칙 확인
{ // 함수 시작
    if (countCommentLinks(content) > COMMENT_MAX_LINKS) // 링크 수 확인
    { // 조건 시작
        return { reason: "too_many_links", message: getCommentBlockMessage("too_many_links") }; // 링크 초과 결과
    } // 조건 끝

    if (findBannedWord(content)) // 금칙어 확인
    { // 조건 시작
        return { reason: "banned_word", message: getCommentBlockMessage("banned_word") }; // 금칙어 결과
    } // 조건 끝

    return null; // 통과
} // 함수 끝

export function checkCommentRate(content: string, history: readonly CommentHistoryEntry[], nowMs: number): CommentBlock | null // 작성 빈도·반복 확인
{ // 함수 시작
    const entries = history.map((entry) => ({ content: entry.content, time: Date.parse(entry.createdAt) })).filter((entry) => Number.isFinite(entry.time)); // 시각을 읽을 수 있는 최근 댓글
    const sinceLatest = entries.length > 0 ? nowMs - Math.max(...entries.map((entry) => entry.time)) : Number.POSITIVE_INFINITY; // 마지막 댓글 뒤 지난 시간
    const intervalMs = COMMENT_MIN_INTERVAL_SECONDS * 1000; // 최소 간격

    if (sinceLatest >= 0 && sinceLatest < intervalMs) // 연속 작성 확인(기기 시계가 늦으면 서버 판단에 맡김)
    { // 조건 시작
        return { reason: "too_fast", message: getCommentBlockMessage("too_fast", Math.ceil((intervalMs - sinceLatest) / 1000)) }; // 연속 작성 결과
    } // 조건 끝

    const windowMs = COMMENT_WINDOW_MINUTES * 60 * 1000; // 제한 구간
    const recent = entries.map((entry) => entry.time).filter((time) => time > nowMs - windowMs).sort((left, right) => left - right); // 구간 안 작성 시각

    if (recent.length >= COMMENT_WINDOW_MAX) // 작성 수 초과 확인
    { // 조건 시작
        const freeAt = recent[recent.length - COMMENT_WINDOW_MAX] + windowMs; // 다시 쓸 수 있는 시각
        return { reason: "rate_limited", message: getCommentBlockMessage("rate_limited", Math.max(1, Math.ceil((freeAt - nowMs) / 1000))) }; // 작성 수 결과
    } // 조건 끝

    const target = normalizeForDuplicate(content); // 비교용 새 댓글
    const duplicateMs = COMMENT_DUPLICATE_HOURS * 60 * 60 * 1000; // 같은 내용 금지 기간

    if (entries.some((entry) => entry.time > nowMs - duplicateMs && normalizeForDuplicate(entry.content) === target)) // 같은 내용 확인
    { // 조건 시작
        return { reason: "duplicate", message: getCommentBlockMessage("duplicate") }; // 같은 내용 결과
    } // 조건 끝

    return null; // 통과
} // 함수 끝

export function describeCommentFlags(content: string): string[] // 관리자용 자동 감지 사유
{ // 함수 시작
    const flags: string[] = []; // 감지 사유 목록
    const links = countCommentLinks(content); // 링크 수

    if (links > COMMENT_MAX_LINKS) // 링크 초과 확인
    { // 조건 시작
        flags.push(`링크 ${links}개(허용 ${COMMENT_MAX_LINKS}개)`); // 링크 사유 추가
    } // 조건 끝

    if (findBannedWord(content)) // 금칙어 확인
    { // 조건 시작
        flags.push("금칙어 포함"); // 금칙어 사유 추가
    } // 조건 끝

    return flags; // 감지 사유 반환
} // 함수 끝
