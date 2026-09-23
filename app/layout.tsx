import type { Metadata, Viewport } from "next"; // 문서 정보 형식
import "./globals.css"; // 전체 공통 스타일

export const metadata: Metadata = // 문서 정보 시작
{ // 문서 정보 객체
    title: "DEVFORGE", // 브라우저 제목
    description: "DEVFORGE 프로젝트와 개발 뉴스를 소개하는 공식 사이트", // 검색 설명
    generator: "Next.js", // 생성 도구 정보
    icons: // 사이트 아이콘 시작
    { // 사이트 아이콘 객체
        icon: // 기본 아이콘 목록 시작
        [ // 기본 아이콘 배열
            { // 밝은 화면 아이콘
                url: "/icon-light-32x32.png", // 밝은 아이콘 주소
                media: "(prefers-color-scheme: light)", // 밝은 화면 조건
            }, // 밝은 화면 아이콘 끝
            { // 어두운 화면 아이콘
                url: "/icon-dark-32x32.png", // 어두운 아이콘 주소
                media: "(prefers-color-scheme: dark)", // 어두운 화면 조건
            }, // 어두운 화면 아이콘 끝
            { // 벡터 아이콘
                url: "/icon.svg", // 벡터 아이콘 주소
                type: "image/svg+xml", // 벡터 아이콘 형식
            }, // 벡터 아이콘 끝
        ], // 기본 아이콘 목록 끝
        apple: "/apple-icon.png", // 애플 기기 아이콘
    }, // 사이트 아이콘 끝
}; // 문서 정보 끝

export const viewport: Viewport = // 화면 정보 시작
{ // 화면 정보 객체
    colorScheme: "light dark", // 화면 색상 모드
    themeColor: // 브라우저 색상 목록 시작
    [ // 브라우저 색상 배열
        { media: "(prefers-color-scheme: light)", color: "white" }, // 밝은 화면 색상
        { media: "(prefers-color-scheme: dark)", color: "black" }, // 어두운 화면 색상
    ], // 브라우저 색상 목록 끝
}; // 화면 정보 끝

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) // 전체 문서 틀
{ // 함수 시작
    return ( // 전체 문서 반환
        /* 한국어 문서와 공통 테마 */ <html lang="ko"><head><link rel="stylesheet" href="/playful-lab-theme.css" /></head><body className="font-sans antialiased" data-theme="playful-lab">
                {children} {/* 현재 페이지 내용 */}
                <script type="module" src="/privacy-consent.mjs"></script> {/* 개인정보 동의 연결 */}
                <script type="module" src="/site-analytics.mjs"></script> {/* 동의 기반 분석 연결 */}
        </body></html> // 한국어 문서와 공통 테마 끝
    ); // 전체 문서 반환 끝
} // 함수 끝
