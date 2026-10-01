import type { MetadataRoute } from "next"; // 검색 규칙 형식
import { CRAWL_BLOCKED_PATHS, getSiteUrl } from "@/lib/site-url"; // 사이트 주소 도구

export default function robots(): MetadataRoute.Robots // 검색엔진 수집 규칙
{ // 함수 시작
    const siteUrl = getSiteUrl(); // 공개 사이트 주소
    return ( // 규칙 반환
    { // 규칙 시작
        rules: { userAgent: "*", allow: "/", disallow: [...CRAWL_BLOCKED_PATHS] }, // 전체 수집기 규칙
        sitemap: `${siteUrl}/sitemap.xml`, // 사이트맵 위치
    }); // 규칙 끝
} // 함수 끝
