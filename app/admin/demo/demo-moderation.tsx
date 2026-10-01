"use client"; // 브라우저 상호작용 모듈

import { useEffect, useMemo, useState } from "react"; // 화면 상태 도구
import { createDemoModerationItems, createLocalModerationService, MODERATION_DONE_MESSAGES, MODERATION_FILTER_LABELS, MODERATION_FILTERS, ModerationError, parseModerationInput, type ModerationActionResult, type ModerationFilter, type ModerationPage } from "@/lib/comments/moderation"; // 댓글 관리 도구
import ModerationBoard from "../comments/moderation-board"; // 댓글 관리 목록

export default function DemoModeration() // 데모 댓글 관리 화면
{ // 함수 시작
    const service = useMemo(() => createLocalModerationService(createDemoModerationItems()), []); // 메모리 관리 서비스
    const [filter, setFilter] = useState<ModerationFilter>("reported"); // 현재 목록 종류
    const [page, setPage] = useState<(ModerationPage & { key: string }) | null>(null); // 현재 목록 결과
    const [version, setVersion] = useState(0); // 목록 새로 읽기 번호
    const currentKey = `${filter}-${version}`; // 현재 목록 식별자

    useEffect(() => // 목록 읽기
    { // 효과 시작
        let active = true; // 화면 유지 여부
        void service.list(filter, 1).then((next) => // 목록 조회
        { // 결과 처리 시작
            if (active) // 화면 유지 확인
            { // 조건 시작
                setPage({ ...next, key: `${filter}-${version}` }); // 목록과 식별자 저장
            } // 조건 끝
        }); // 조회 처리 끝
        return () => // 정리 함수 반환
        { // 정리 시작
            active = false; // 늦은 결과 무시
        }; // 정리 끝
    }, [filter, service, version]); // 목록 종류 변경 시 실행

    async function applyDemo(input: { commentId: string; action: string; note: string }): Promise<ModerationActionResult> // 데모 처리
    { // 함수 시작
        try // 처리 시도
        { // 시도 시작
            const parsed = parseModerationInput(input); // 처리 입력 검증
            const item = await service.apply(parsed, "demo-admin"); // 메모리 처리
            return { ok: true, message: `데모: ${MODERATION_DONE_MESSAGES[parsed.action]} 실제로 저장되지 않았습니다.`, item }; // 성공 결과 반환
        } // 시도 끝
        catch (error: unknown) // 처리 실패
        { // 오류 처리 시작
            return { ok: false, message: error instanceof ModerationError ? error.message : "처리하지 못했습니다." }; // 실패 결과 반환
        } // 오류 처리 끝
    } // 함수 끝

    return ( // 데모 관리 화면 반환
        <> {/* 화면 묶음 */}
            <nav className="moderation-tabs" aria-label="댓글 관리 목록 종류"> {/* 목록 종류 메뉴 */}
                {MODERATION_FILTERS.map((item) => <button key={item} type="button" aria-pressed={item === filter} onClick={() => { setFilter(item); setVersion((current) => current + 1); }}>{MODERATION_FILTER_LABELS[item]}{item === filter && page?.key === currentKey ? ` ${page.total}` : ""}</button>)} {/* 목록 종류 버튼 */}
            </nav> {/* 목록 종류 메뉴 끝 */}
            {page?.key === currentKey ? <ModerationBoard key={page.key} initialItems={page.items} filter={filter} onApply={applyDemo} /> : <p className="admin-empty-state" role="status">시연 목록을 준비하고 있습니다…</p>} {/* 최신 목록만 표시 */}
        </> // 화면 묶음 끝
    ); // 데모 관리 화면 반환 끝
} // 함수 끝
