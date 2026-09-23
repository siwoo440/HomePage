/** @type {import('next').NextConfig} */ // Next.js 설정 형식
const nextConfig = // Next.js 설정 시작
{ // 설정 객체 시작
    allowedDevOrigins: ["127.0.0.1"], // 로컬 미리보기 허용 주소
    images: // 이미지 설정 시작
    { // 이미지 설정 객체
        unoptimized: true, // 원본 이미지 사용
    }, // 이미지 설정 끝
}; // 설정 객체 끝

export default nextConfig; // Next.js 설정 공개
