import { getContactCategoryLabel, type ContactInput } from "../contact/domain.ts"; // 문의 내용 형식
import type { MailMessage } from "./sender.ts"; // 메일 형식

export interface NotifyConfirmationInput // 출시 알림 확인 메일 내용
{ // 형식 시작
    email: string; // 신청한 이메일
    projectTitle: string; // 게임 이름
    token: string; // 확인·수신 거부 값
} // 형식 끝

export function buildNotifyConfirmation(input: NotifyConfirmationInput, siteUrl: string): MailMessage // 출시 알림 확인 메일 작성
{ // 함수 시작
    const lines = // 본문 줄 목록
    [ // 목록 시작
        `Palettra Games 홈페이지에서 ${input.projectTitle} 출시 알림을 신청하셨습니다.`, // 신청 안내
        "아래 주소를 열고 확인 버튼을 누르면 신청이 완료됩니다.", // 확인 방법
        "", // 빈 줄
        `${siteUrl}/notify/confirm?token=${input.token}`, // 확인 주소
        "", // 빈 줄
        "신청하신 적이 없다면 이 메일을 무시하셔도 됩니다. 확인하지 않은 주소로는 출시 소식을 보내지 않습니다.", // 잘못 온 메일 안내
        `더 받고 싶지 않으면: ${siteUrl}/notify/unsubscribe?token=${input.token}`, // 수신 거부 주소
        "", // 빈 줄
        "If you did not request this, you can ignore this email. Open the first link and press the button to confirm your release notice sign-up.", // 영어 안내
    ]; // 목록 끝
    return { to: input.email, subject: `[Palettra Games] ${input.projectTitle} 출시 알림 신청을 확인해 주세요`, text: lines.join("\n") }; // 확인 메일 반환
} // 함수 끝

export function buildContactNotice(contact: ContactInput, notifyTo: string, siteUrl: string): MailMessage // 문의 접수 알림 메일 작성
{ // 함수 시작
    const category = getContactCategoryLabel(contact.category); // 문의 분류 이름
    const lines = // 본문 줄 목록
    [ // 목록 시작
        "Palettra Games 홈페이지에 새 문의가 접수되었습니다.", // 안내 문장
        "", // 빈 줄
        `분류: ${category}`, // 문의 분류
        `이메일: ${contact.email}`, // 답변 받을 이메일
        `제목: ${contact.subject}`, // 문의 제목
        "", // 빈 줄
        contact.message, // 문의 내용
        "", // 빈 줄
        `문의함에서 처리하기: ${siteUrl}/admin/contact`, // 관리자 문의함 주소
        "이 메일에 답장하면 문의하신 분의 이메일로 보내집니다.", // 답장 안내
    ]; // 목록 끝
    return { to: notifyTo, subject: `[Palettra Games 문의] ${category} · ${contact.subject}`, text: lines.join("\n"), replyTo: contact.email }; // 알림 메일 반환
} // 함수 끝
