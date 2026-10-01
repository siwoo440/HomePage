import type { MetadataRoute } from "next"; // 사이트맵 형식
import { GAME_PROJECTS } from "../public/game-projects.mjs"; // 공개 게임 목록
import { getSiteUrl, PUBLIC_STATIC_PATHS } from "@/lib/site-url"; // 사이트 주소 도구

export default function sitemap(): MetadataRoute.Sitemap // 검색엔진 사이트맵
{ // 함수 시작
    const siteUrl = getSiteUrl(); // 공개 사이트 주소
    const gamePaths = GAME_PROJECTS.filter((project) => !project.adultOnly).map((project) => project.detailPath); // 성인 제외 게임 주소
    return [...PUBLIC_STATIC_PATHS, ...gamePaths].map((pathname) => ( // 주소 목록 변환
    { // 항목 시작
        url: `${siteUrl}${pathname}`, // 전체 주소
        changeFrequency: pathname === "/main.html" || pathname === "/devlog.html" ? "weekly" : "monthly", // 갱신 주기
        priority: pathname === "/main.html" ? 1 : 0.6, // 상대 중요도
    })); // 항목 끝
} // 함수 끝
