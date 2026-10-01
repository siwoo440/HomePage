"use client"; // 브라우저 입력 모듈

import { CONSENT_FIELDS, type ConsentField, type ConsentValues } from "@/lib/member/signup"; // 필수 동의 규칙
import styles from "./member-login.module.css"; // 로그인 화면 스타일

const CONSENT_LABELS: Record<ConsentField, { text: string; href: string | null }> = // 동의 문구
{ // 문구 시작
    agreeAge: { text: "[필수] 만 14세 이상입니다", href: null }, // 연령 확인
    agreeTerms: { text: "[필수] 이용약관에 동의합니다", href: "/terms.html" }, // 이용약관 동의
    agreePrivacy: { text: "[필수] 개인정보 수집·이용에 동의합니다", href: "/privacy.html" }, // 개인정보 동의
}; // 문구 끝

interface ConsentFieldsProps // 동의 입력 속성
{ // 형식 시작
    values: ConsentValues; // 동의 값
    errors: Partial<Record<ConsentField, string>>; // 동의 오류
    onChange: (values: ConsentValues) => void; // 값 변경 처리
    disabled?: boolean; // 입력 비활성 여부
} // 형식 끝

export default function ConsentFields({ values, errors, onChange, disabled = false }: ConsentFieldsProps) // 필수 동의 입력
{ // 함수 시작
    const allChecked = CONSENT_FIELDS.every((field) => values[field]); // 전체 동의 여부

    return ( // 동의 입력 반환
        <fieldset className={styles.consents} disabled={disabled}> {/* 동의 묶음 */}
            <legend>약관 동의</legend> {/* 묶음 제목 */}
            <label className={styles.consentAll}> {/* 전체 동의 */}
                <input type="checkbox" checked={allChecked} onChange={(event) => onChange({ agreeAge: event.target.checked, agreeTerms: event.target.checked, agreePrivacy: event.target.checked })} /> {/* 전체 동의 선택 */}
                <span>필수 항목에 모두 동의합니다</span> {/* 전체 동의 문구 */}
            </label> {/* 전체 동의 끝 */}
            {CONSENT_FIELDS.map((field) => ( // 항목 반복
                <div className={styles.consentItem} key={field}> {/* 동의 항목 */}
                    <label> {/* 항목 선택 */}
                        <input type="checkbox" name={field} checked={values[field]} onChange={(event) => onChange({ ...values, [field]: event.target.checked })} aria-invalid={Boolean(errors[field])} aria-describedby={errors[field] ? `${field}-error` : undefined} /> {/* 항목 체크 */}
                        <span>{CONSENT_LABELS[field].text}</span> {/* 항목 문구 */}
                    </label> {/* 항목 선택 끝 */}
                    {CONSENT_LABELS[field].href ? <a href={CONSENT_LABELS[field].href ?? undefined} target="_blank" rel="noopener noreferrer">전문 보기<span className={styles.srOnly}> (새 창)</span></a> : null} {/* 전문 보기 */}
                    {errors[field] ? <small id={`${field}-error`} className={styles.fieldError} role="alert">{errors[field]}</small> : null} {/* 항목 오류 */}
                </div> // 동의 항목 끝
            ))} {/* 항목 반복 끝 */}
        </fieldset> // 동의 묶음 끝
    ); // 동의 입력 반환 끝
} // 함수 끝
