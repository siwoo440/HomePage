import type { SupabaseClient } from "@supabase/supabase-js"; // Supabase 연결 형식
import { getGameProject } from "../../public/game-projects.mjs"; // 공개 프로젝트 데이터
import { canMailVisitors, getMailSender, type MailSender } from "../mail/config.ts"; // 메일 보내는 쪽 설정
import { sendMail } from "../mail/sender.ts"; // 메일 발송
import { buildNotifyConfirmation } from "../mail/templates.ts"; // 확인 메일 양식
import { getSiteUrl } from "../site-url.ts"; // 공개 사이트 주소
import { createSecretSupabaseClient } from "../supabase/secret.ts"; // 서버 전용 연결
import type { NotifyInput } from "./domain.ts"; // 출시 알림 신청 형식
import { clearNotifyConfirmationMark, issueNotifyConfirmation } from "./store.ts"; // 확인 값 발급 도구

export type ConfirmationOutcome = "disabled" | "sent" | "skipped" | "failed"; // 확인 메일 처리 결과

export interface ConfirmationDependencies // 확인 메일에 필요한 것
{ // 형식 시작
    sender: MailSender | null; // 메일 보내는 쪽 설정
    secretClient: SupabaseClient | null; // 서버 전용 연결
    siteUrl: string; // 공개 사이트 주소
    send?: typeof sendMail; // 메일 발송 도구(검사용 교체)
} // 형식 끝

export function getConfirmationDependencies(environment: Record<string, string | undefined> = process.env): ConfirmationDependencies // 환경 값으로 준비물 만들기
{ // 함수 시작
    return { sender: getMailSender(environment), secretClient: createSecretSupabaseClient(environment), siteUrl: getSiteUrl(environment) }; // 준비물 반환
} // 함수 끝

export function isConfirmationEnabled(dependencies: ConfirmationDependencies): boolean // 확인 메일을 보낼 수 있는지 확인
{ // 함수 시작
    return dependencies.sender !== null && canMailVisitors(dependencies.sender) && dependencies.secretClient !== null; // 인증한 도메인의 보내는 주소와 서버 전용 키가 모두 있을 때만
} // 함수 끝

export async function sendNotifyConfirmation(value: NotifyInput, dependencies: ConfirmationDependencies): Promise<ConfirmationOutcome> // 확인 메일 보내기
{ // 함수 시작
    const { sender, secretClient } = dependencies; // 보내는 쪽과 서버 전용 연결
    if (!sender || !secretClient || !isConfirmationEnabled(dependencies)) // 준비 여부 확인
    { // 조건 시작
        return "disabled"; // 확인 메일 꺼짐
    } // 조건 끝

    try // 발급·발송 시도
    { // 시도 시작
        const token = await issueNotifyConfirmation(secretClient, value); // 확인 값 발급
        if (!token) // 보낼 필요 없음 확인(이미 확인·최근 발송·하루 한도)
        { // 조건 시작
            return "skipped"; // 발송 생략
        } // 조건 끝
        const projectTitle = getGameProject(value.projectId)?.title ?? "Palettra Games"; // 게임 이름
        const result = await (dependencies.send ?? sendMail)(sender, buildNotifyConfirmation({ email: value.email, projectTitle, token }, dependencies.siteUrl)); // 확인 메일 발송
        if (!result.ok) // 발송 실패 확인
        { // 조건 시작
            console.error("NOTIFY_CONFIRMATION_FAILED", result.reason, result.status); // 이메일 주소 없이 실패 종류만 기록
            await clearNotifyConfirmationMark(secretClient, value); // 다시 신청하면 재발송되도록 발송 표시 지움
            return "failed"; // 발송 실패
        } // 조건 끝
        return "sent"; // 발송 완료
    } // 시도 끝
    catch // 발급 실패 처리
    { // 오류 처리 시작
        console.error("NOTIFY_CONFIRMATION_FAILED", "issue", 0); // 실패 종류만 기록
        return "failed"; // 발급 실패
    } // 오류 처리 끝
} // 함수 끝
