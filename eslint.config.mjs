import { defineConfig, globalIgnores } from "eslint/config"; // Flat Config 도구 가져오기
import nextVitals from "eslint-config-next/core-web-vitals"; // Next 핵심 규칙 가져오기
import nextTypeScript from "eslint-config-next/typescript"; // Next 타입 규칙 가져오기

const eslintConfig = defineConfig( // ESLint 설정 생성
[ // 설정 목록 시작
    ...nextVitals, // 핵심 웹 규칙 적용
    ...nextTypeScript, // 타입스크립트 규칙 적용
    globalIgnores( // 전체 제외 경로 설정
    [ // 제외 목록 시작
        ".next/**", // Next 빌드 결과 제외
        "node_modules/**", // 설치 패키지 제외
        "internal/**", // 내부 보관 자료 제외
        "ChatBot/**", // 별도 ChatBot 프로젝트 제외
        "Text-Play/**", // 별도 Text-Play 프로젝트 제외
        "ChatBot-text-play-download/**", // 다운로드 작업 공간 제외
        "imported-chatbot/**", // 가져온 ChatBot 자료 제외
        "imports/chatbot-session-snapshot/**", // ChatBot 세션 자료 제외
        ".pnpm-store/**", // 로컬 패키지 저장소 제외
        ".worktrees/**", // 로컬 작업트리 제외
        "google-docs-trusted-read-*/**", // Google Docs 캐시 제외
    ]), // 제외 목록 끝
    { // 루트 레이아웃 예외 시작
        files: ["app/layout.tsx"], // 루트 레이아웃 대상
        rules: // 파일 규칙 시작
        { // 규칙 객체 시작
            "@next/next/no-sync-scripts": "off", // 초기 색상 모드 선적용 스크립트
            "@next/next/no-css-tags": "off", // 공통 정적 스타일 선적용 링크
        }, // 규칙 객체 끝
    }, // 루트 레이아웃 예외 끝
    { // 외부 이미지 예외 시작
        files: ["app/admin/products/page.tsx", "app/admin/demo/admin-demo.tsx", "app/news/*/comments-panel.tsx", "app/news/*/page.tsx"], // 외부 업로드·선택 이미지 대상
        rules: // 파일 규칙 시작
        { // 규칙 객체 시작
            "@next/next/no-img-element": "off", // 외부 업로드 이미지 주소 지원
        }, // 규칙 객체 끝
    }, // 외부 이미지 예외 끝
    { // 세션 복원 예외 시작
        files: ["app/news/*/comments-panel.tsx"], // 댓글 패널 대상
        rules: // 파일 규칙 시작
        { // 규칙 객체 시작
            "react-hooks/set-state-in-effect": "off", // 세션 저장소 프로필 복원
        }, // 규칙 객체 끝
    }, // 세션 복원 예외 끝
]); // 설정 목록 끝

export default eslintConfig; // ESLint 설정 내보내기
