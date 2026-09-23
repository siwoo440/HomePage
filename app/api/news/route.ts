import { NextResponse } from "next/server"; // JSON 응답 도구
import { getSupabasePublicConfig } from "@/lib/supabase/config"; // Supabase 설정 판정
import { createServerSupabaseClient } from "@/lib/supabase/server"; // 서버 데이터 도구

export const dynamic = "force-dynamic"; // 항상 최신 목록 조회

export async function GET() // 공개 뉴스 목록 요청
{ // 함수 시작
    if (!getSupabasePublicConfig()) // 설정 누락 확인
    { // 조건 시작
        return NextResponse.json({ configured: false, posts: [] }); // 미설정 목록 반환
    } // 조건 끝

    try // 원격 조회 시도
    { // 시도 시작
        const supabase = await createServerSupabaseClient(); // 서버 데이터 도구
        const result = await supabase.from("news_posts").select("id, title, summary, tags, cover_image_path, published_at").eq("status", "published").order("published_at", { ascending: false }); // 공개 게시물 조회

        if (result.error) // 조회 실패 확인
        { // 조건 시작
            return NextResponse.json({ configured: true, posts: [], message: "개발 뉴스를 불러오지 못했습니다." }, { status: 503 }); // 안전한 오류 반환
        } // 조건 끝

        const posts = (result.data ?? []).map((post) => // 게시물 변환 시작
        { // 변환 함수 시작
            const imageResult = post.cover_image_path ? supabase.storage.from("news-images").getPublicUrl(post.cover_image_path) : null; // 공개 이미지 주소 생성
            const publicPost = // 공개 게시물 시작
            { // 공개 게시물 객체
                id: post.id, // 게시물 식별자
                title: post.title, // 게시물 제목
                summary: post.summary, // 게시물 요약
                tags: post.tags, // 게시물 태그
                cover_image_url: imageResult?.data.publicUrl ?? null, // 대표 이미지 주소
                published_at: post.published_at, // 공개 시각
            }; // 공개 게시물 끝
            return publicPost; // 공개 게시물 반환
        }); // 게시물 변환 끝
        return NextResponse.json({ configured: true, posts }, { headers: { "Cache-Control": "no-store" } }); // 공개 목록 반환
    } // 시도 끝
    catch // 설정 또는 통신 오류 처리
    { // 오류 처리 시작
        return NextResponse.json({ configured: true, posts: [], message: "개발 뉴스를 불러오지 못했습니다." }, { status: 503 }); // 안전한 오류 반환
    } // 오류 처리 끝
} // 함수 끝
