"use client"; // 브라우저 번역 시작 모듈

import { useEffect } from "react"; // 화면 효과 도구
import { startPageTranslation } from "../public/i18n.mjs"; // 공개 페이지 번역 도구

export default function PageTranslator() // Next 화면 번역 시작
{ // 함수 시작
    useEffect(() => // 화면 연결 뒤 실행
    { // 효과 시작
        void startPageTranslation(document, window); // 선택 언어로 번역(관리자·한국어는 바로 종료)
    }, []); // 처음 한 번 실행
    return null; // 화면 출력 없음
} // 함수 끝
