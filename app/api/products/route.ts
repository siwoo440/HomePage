import { NextResponse } from "next/server"; // JSON 응답 도구
import { getSupabasePublicConfig } from "@/lib/supabase/config"; // Supabase 설정 판정
import { createServerSupabaseClient } from "@/lib/supabase/server"; // 서버 데이터 도구
import { toPublicProduct } from "@/lib/products/public-product"; // 공개 상품 변환 함수
import type { ProductDatabaseRow } from "@/lib/products/public-product"; // 상품 행 형식

export const dynamic = "force-dynamic"; // 항상 최신 상품 조회

export async function GET() // 공개 상품 목록 요청
{ // 함수 시작
    if (!getSupabasePublicConfig()) // 설정 누락 확인
    { // 조건 시작
        return NextResponse.json({ configured: false, products: [] }); // 미설정 응답 반환
    } // 조건 끝

    try // 원격 조회 시도
    { // 시도 시작
        const supabase = await createServerSupabaseClient(); // 서버 데이터 도구
        const result = await supabase.from("products").select("id, name, category, game_name, description, price, original_price, badge, image_path, sales_url, stock_mode, stock_quantity, external_provider, external_product_id, publication_status, display_order").eq("publication_status", "published").order("display_order", { ascending: true }); // 공개 상품 조회

        if (result.error) // 조회 실패 확인
        { // 조건 시작
            return NextResponse.json({ configured: true, products: [], message: "상품을 불러오지 못했습니다." }, { status: 503 }); // 안전한 오류 반환
        } // 조건 끝

        const products = (result.data ?? []).map((row) => // 상품 변환 시작
        { // 변환 함수 시작
            const resolveStorageImage = (path: string): string => supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl; // 저장 이미지 공개 주소 함수
            return toPublicProduct(row as ProductDatabaseRow, resolveStorageImage); // 공개 상품 변환
        }).filter((product) => product !== null); // 제외 상품 제거
        return NextResponse.json({ configured: true, products }, { headers: { "Cache-Control": "no-store" } }); // 공개 목록 반환
    } // 시도 끝
    catch // 설정 또는 통신 오류 처리
    { // 오류 처리 시작
        return NextResponse.json({ configured: true, products: [], message: "상품을 불러오지 못했습니다." }, { status: 503 }); // 안전한 오류 반환
    } // 오류 처리 끝
} // 함수 끝
