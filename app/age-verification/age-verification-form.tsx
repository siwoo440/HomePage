"use client"; // 클라이언트 화면 설정

import { useRef, useState } from "react"; // 입력 상태 도구
import type { FormEvent } from "react"; // 입력 이벤트 형식
import styles from "./age-verification.module.css"; // 성인 확인 스타일

interface AgeVerificationFormProps // 입력 화면 속성
{ // 형식 시작
    returnTo: string; // 인증 뒤 복귀 주소
} // 형식 끝

interface VerificationResponse // 인증 응답 형식
{ // 형식 시작
    ok?: boolean; // 성공 표시
    message?: string; // 안내 문구
    returnTo?: string; // 복귀 주소
} // 형식 끝

type InputErrorField = "birthDate" | "agreed" | null; // 입력 오류 필드

export default function AgeVerificationForm({ returnTo }: AgeVerificationFormProps) // 성인 확인 입력 화면
{ // 함수 시작
    const [message, setMessage] = useState(""); // 안내 상태
    const [submitting, setSubmitting] = useState(false); // 제출 상태
    const [inputErrorField, setInputErrorField] = useState<InputErrorField>(null); // 입력 오류 상태
    const birthDateRef = useRef<HTMLInputElement>(null); // 생년월일 입력 참조
    const agreedRef = useRef<HTMLInputElement>(null); // 동의 입력 참조

    async function handleSubmit(event: FormEvent<HTMLFormElement>) // 입력 제출 처리
    { // 함수 시작
        event.preventDefault(); // 기본 제출 차단
        setMessage(""); // 이전 안내 초기화
        setInputErrorField(null); // 이전 입력 오류 제거
        const formData = new FormData(event.currentTarget); // 입력 값 읽기
        const birthDate = String(formData.get("birthDate") ?? ""); // 생년월일 읽기
        const agreed = formData.get("agreed") === "on"; // 동의 값 읽기

        if (!birthDate) // 생년월일 누락 확인
        { // 조건 시작
            setInputErrorField("birthDate"); // 날짜 오류 설정
            setMessage("올바른 생년월일을 입력해 주세요."); // 날짜 오류 안내
            birthDateRef.current?.focus(); // 날짜 입력 포커스
            return; // 제출 중단
        } // 조건 끝

        if (!agreed) // 성인 동의 누락 확인
        { // 조건 시작
            setInputErrorField("agreed"); // 동의 오류 설정
            setMessage("만 19세 이상임에 동의해 주세요."); // 동의 오류 안내
            agreedRef.current?.focus(); // 동의 입력 포커스
            return; // 제출 중단
        } // 조건 끝

        setSubmitting(true); // 제출 상태 시작

        try // 인증 요청 시도
        { // 시도 시작
            const response = await fetch("/api/age/verify", // 인증 API 요청
            { // 요청 설정 시작
                method: "POST", // 요청 방식
                headers: { "Content-Type": "application/json" }, // JSON 본문 설정
                body: JSON.stringify({ birthDate, agreed, returnTo }), // 입력 본문 생성
            }); // 요청 설정 끝
            const result = await response.json() as VerificationResponse; // 응답 본문 읽기

            if (!response.ok || !result.ok || !result.returnTo) // 인증 실패 확인
            { // 조건 시작
                const isInputError = response.status === 400 || response.status === 403; // 입력 응답 오류 판정
                setInputErrorField(isInputError ? "birthDate" : null); // 날짜 오류 상태 설정
                setMessage(result.message ?? "성인 확인을 완료하지 못했습니다."); // 실패 안내 표시

                if (isInputError) // 입력 응답 오류 확인
                { // 조건 시작
                    birthDateRef.current?.focus(); // 날짜 입력 포커스
                } // 조건 끝

                return; // 처리 종료
            } // 조건 끝

            window.location.assign(result.returnTo); // 확인된 주소로 이동
        } // 시도 끝
        catch // 통신 실패 처리
        { // 오류 처리 시작
            setInputErrorField(null); // 통신 오류 분리
            setMessage("서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요."); // 통신 오류 안내
        } // 오류 처리 끝
        finally // 요청 종료 처리
        { // 정리 시작
            setSubmitting(false); // 제출 상태 종료
        } // 정리 끝
    } // 함수 끝

    return ( // 입력 화면 반환
        <form className={styles.form} onSubmit={handleSubmit} noValidate aria-busy={submitting}> {/* 인증 입력 양식 */}
            <label className={styles.label} htmlFor="birthDate">생년월일</label> {/* 날짜 입력 이름 */}
            <input className={styles.input} id="birthDate" ref={birthDateRef} aria-invalid={inputErrorField === "birthDate"} aria-describedby={inputErrorField === "birthDate" ? "age-verification-error" : undefined} name="birthDate" type="date" autoComplete="bday" required /> {/* 날짜 입력 */}
            <label className={styles.checkboxLabel}> {/* 동의 입력 영역 */}
                <input name="agreed" ref={agreedRef} aria-invalid={inputErrorField === "agreed"} aria-describedby={inputErrorField === "agreed" ? "age-verification-error" : undefined} type="checkbox" required /> {/* 성인 동의 입력 */}
                <span>본인은 만 19세 이상이며 성인 콘텐츠 열람에 동의합니다.</span> {/* 성인 동의 문구 */}
            </label> {/* 동의 입력 끝 */}
            {message ? <p id="age-verification-error" className={styles.message} role="alert">{message}</p> : null} {/* 결과 안내 */}
            <button className={styles.submit} type="submit" disabled={submitting}>{submitting ? "확인 중..." : "성인 확인 후 계속"}</button> {/* 인증 제출 버튼 */}
            <p className={styles.privacy}>생년월일은 저장하거나 쿠키에 기록하지 않습니다.</p> {/* 개인정보 안내 */}
        </form> // 인증 입력 양식 끝
    ); // 입력 화면 반환 끝
} // 함수 끝
