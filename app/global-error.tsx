"use client"; // 전체 오류 경계 모듈

interface GlobalErrorProps // 전체 오류 화면 속성
{ // 형식 시작
    error: Error & { digest?: string }; // 발생한 오류
    reset: () => void; // 다시 시도 함수
} // 형식 끝

const linkStyle = { color: "#5746D9", fontWeight: 700 }; // 이동 링크 모양

export default function GlobalError({ error, reset }: GlobalErrorProps) // 공통 틀 오류 안내
{ // 함수 시작
    return ( // 문서 반환
        <html lang="ko"> {/* 한국어 문서 */}
            <body style={{ margin: 0, minHeight: "100dvh", display: "grid", placeItems: "center", padding: "24px", boxSizing: "border-box", background: "#F7FBFF", color: "#172A49", fontFamily: "system-ui, sans-serif" }}> {/* 단독 안내 본문 */}
                <main style={{ maxWidth: "520px", textAlign: "center" }}> {/* 안내 영역 */}
                    <p style={{ fontFamily: "Consolas, monospace", letterSpacing: "0.18em", color: "#7768F8" }}>DEVFORGE</p> {/* 브랜드 표시 */}
                    <h1>사이트를 불러오지 못했습니다</h1> {/* 화면 제목 */}
                    <p>일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요. (Something went wrong. Please try again.)</p> {/* 화면 설명 */}
                    {error.digest ? <p>오류 번호: {error.digest}</p> : null} {/* 문의용 오류 번호 */}
                    <p style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}> {/* 동작 묶음 */}
                        <button type="button" onClick={reset} style={{ minHeight: "44px", padding: "0 18px", border: "1px solid #5746D9", borderRadius: "12px", background: "#5746D9", color: "#FFFFFF", fontWeight: 700, cursor: "pointer" }}>다시 시도</button> {/* 다시 불러오기 */}
                        <a href="/main.html" style={{ ...linkStyle, alignSelf: "center" }}>메인으로 이동</a> {/* 메인 이동 */}
                    </p> {/* 동작 묶음 끝 */}
                </main> {/* 안내 영역 끝 */}
            </body> {/* 단독 안내 본문 끝 */}
        </html> // 문서 끝
    ); // 문서 반환 끝
} // 함수 끝
