"use client"; // 브라우저 입력 모듈

import { useRef, useState, type FormEvent } from "react"; // 입력 상태 도구
import { MemberProfileError, NICKNAME_MAX_LENGTH, saveMemberNickname, validateNickname } from "@/lib/member/profile"; // 회원 프로필 도구
import { CONSENT_FIELDS, EMPTY_CONSENTS, validateConsents, type ConsentField, type ConsentValues } from "@/lib/member/signup"; // 필수 동의 규칙
import { createBrowserSupabaseClient } from "@/lib/supabase/client"; // 브라우저 인증 도구
import ConsentFields from "./consent-fields"; // 필수 동의 입력
import styles from "./member-login.module.css"; // 로그인 화면 스타일

interface MemberNicknameFormProps // 닉네임 입력 속성
{ // 형식 시작
    userId: string; // 회원 식별자
    nickname: string | null; // 현재 닉네임
    requireConsent?: boolean; // 첫 가입 동의 필요 여부
    onSaved: (nickname: string) => void; // 저장 완료 처리
} // 형식 끝

export default function MemberNicknameForm({ userId, nickname, requireConsent = false, onSaved }: MemberNicknameFormProps) // 회원 닉네임 입력
{ // 함수 시작
    const [value, setValue] = useState(nickname ?? ""); // 닉네임 입력 상태
    const [consents, setConsents] = useState<ConsentValues>(EMPTY_CONSENTS); // 필수 동의 상태
    const [consentErrors, setConsentErrors] = useState<Partial<Record<ConsentField, string>>>({}); // 동의 오류 상태
    const [error, setError] = useState(""); // 입력 오류 상태
    const [message, setMessage] = useState(""); // 저장 결과 상태
    const [isSaving, setIsSaving] = useState(false); // 저장 진행 상태
    const inputRef = useRef<HTMLInputElement>(null); // 닉네임 입력 참조
    const formRef = useRef<HTMLFormElement>(null); // 입력 폼 참조

    async function handleSubmit(event: FormEvent<HTMLFormElement>) // 닉네임 저장 처리
    { // 함수 시작
        event.preventDefault(); // 기본 제출 차단
        setMessage(""); // 이전 결과 제거
        const checked = validateNickname(value); // 닉네임 검증
        const nextConsentErrors = requireConsent ? validateConsents(consents) : {}; // 첫 가입 동의 검증
        setError(checked.ok ? "" : checked.message); // 입력 오류 표시
        setConsentErrors(nextConsentErrors); // 동의 오류 표시

        if (!checked.ok) // 닉네임 오류 확인
        { // 조건 시작
            inputRef.current?.focus(); // 입력 포커스 이동
            return; // 저장 중단
        } // 조건 끝

        const firstConsentError = CONSENT_FIELDS.find((field) => nextConsentErrors[field]); // 첫 동의 오류

        if (firstConsentError) // 동의 누락 확인
        { // 조건 시작
            formRef.current?.querySelector<HTMLInputElement>(`input[name="${firstConsentError}"]`)?.focus(); // 동의 항목 포커스
            return; // 저장 중단
        } // 조건 끝

        setIsSaving(true); // 저장 시작

        try // 저장 시도
        { // 시도 시작
            const consentAt = requireConsent ? new Date().toISOString() : undefined; // 첫 가입 동의 시각
            const profile = await saveMemberNickname(createBrowserSupabaseClient(), userId, checked.value, undefined, consentAt); // 닉네임 저장
            setValue(profile.nickname); // 저장 값 반영
            setMessage(nickname ? "닉네임을 바꿨습니다." : "닉네임을 저장했습니다. 이제 댓글을 남길 수 있습니다."); // 저장 완료 안내
            onSaved(profile.nickname); // 상위 상태 갱신
        } // 시도 끝
        catch (saveError: unknown) // 저장 실패 처리
        { // 오류 처리 시작
            setError(saveError instanceof MemberProfileError ? saveError.message : "닉네임을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요."); // 실패 안내
            inputRef.current?.focus(); // 입력 포커스 이동
        } // 오류 처리 끝
        finally // 저장 종료 처리
        { // 정리 시작
            setIsSaving(false); // 저장 종료
        } // 정리 끝
    } // 함수 끝

    return ( // 닉네임 입력 반환
        <form ref={formRef} className={styles.form} onSubmit={handleSubmit} noValidate aria-busy={isSaving}> {/* 닉네임 입력 폼 */}
            <label htmlFor="member-nickname">댓글에 표시할 닉네임</label> {/* 닉네임 입력 이름 */}
            {!nickname ? <p className={styles.description}>댓글을 남기려면 먼저 닉네임을 정해 주세요. 닉네임은 댓글 작성자 이름으로 공개됩니다.</p> : null} {/* 첫 설정 안내 */}
            <input id="member-nickname" ref={inputRef} value={value} onChange={(event) => { setValue(event.target.value); setError(""); }} maxLength={NICKNAME_MAX_LENGTH * 2} autoComplete="nickname" aria-invalid={Boolean(error)} aria-describedby={error ? "member-nickname-error" : undefined} disabled={isSaving} /> {/* 닉네임 입력 */}
            {error ? <p id="member-nickname-error" className={styles.error} role="alert">{error}</p> : null} {/* 입력 오류 */}
            {requireConsent ? <ConsentFields values={consents} errors={consentErrors} onChange={(next) => { setConsents(next); setConsentErrors({}); }} disabled={isSaving} /> : null} {/* 첫 가입 필수 동의 */}
            <button className={styles.primaryButton} type="submit" disabled={isSaving}>{isSaving ? "저장 중…" : nickname ? "닉네임 바꾸기" : requireConsent ? "동의하고 시작하기" : "닉네임 저장"}</button> {/* 저장 버튼 */}
            {message ? <p className={styles.success} role="status">{message}</p> : null} {/* 저장 결과 */}
        </form> // 닉네임 입력 폼 끝
    ); // 닉네임 입력 반환 끝
} // 함수 끝
