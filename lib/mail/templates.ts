import { getContactCategoryLabel, type ContactInput } from "../contact/domain.ts"; // 문의 내용 형식
import type { MailMessage } from "./sender.ts"; // 메일 형식

export function buildContactNotice(contact: ContactInput, notifyTo: string, siteUrl: string): MailMessage // 문의 접수 알림 메일 작성
{ // 함수 시작
    const category = getContactCategoryLabel(contact.category); // 문의 분류 이름
    const lines = // 본문 줄 목록
    [ // 목록 시작
        "DEVFORGE 홈페이지에 새 문의가 접수되었습니다.", // 안내 문장
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
    return { to: notifyTo, subject: `[DEVFORGE 문의] ${category} · ${contact.subject}`, text: lines.join("\n"), replyTo: contact.email }; // 알림 메일 반환
} // 함수 끝
