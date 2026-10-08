export const IMAGE_CACHE_CONTROL = "public, max-age=86400, stale-while-revalidate=604800"; // 공개 이미지 보관 기간(하루, 이후 일주일은 뒤에서 새로 받음)
export const ADULT_IMAGE_CACHE_CONTROL = "private, no-store"; // 성인 게임 이미지는 매번 확인
export const ADULT_IMAGE_SOURCE = "/images/:folder(games|share)/:file(project-(?:h|u|v)\\.(?:webp|jpg))"; // 성인 게임 대표·공유 이미지 주소

/** @type {import('next').NextConfig} */ // Next.js 설정 형식
const nextConfig = // Next.js 설정 시작
{ // 설정 객체 시작
    allowedDevOrigins: ["127.0.0.1"], // 로컬 미리보기 허용 주소
    images: // 이미지 설정 시작
    { // 이미지 설정 객체
        unoptimized: true, // 원본 이미지 사용
    }, // 이미지 설정 끝
    async headers() // 응답 머리말 설정
    { // 함수 시작
        return [ // 머리말 규칙 목록
            { source: "/images/:path*", headers: [{ key: "Cache-Control", value: IMAGE_CACHE_CONTROL }] }, // 공개 이미지 보관 규칙
            { source: ADULT_IMAGE_SOURCE, headers: [{ key: "Cache-Control", value: ADULT_IMAGE_CACHE_CONTROL }] }, // 성인 게임 이미지는 보관하지 않음(뒤 규칙이 앞 규칙을 덮어씀)
        ]; // 머리말 규칙 목록 끝
    }, // 함수 끝
}; // 설정 객체 끝

export default nextConfig; // Next.js 설정 공개
