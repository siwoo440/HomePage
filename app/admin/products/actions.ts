"use server"; // 서버 액션 모듈

import { redirect } from "next/navigation"; // 서버 이동 도구
import { revalidatePath } from "next/cache"; // 캐시 갱신 도구
import { requireAdmin } from "@/lib/auth/admin"; // 관리자 보호 함수
import { createServerSupabaseClient } from "@/lib/supabase/server"; // 서버 데이터 도구
import { validateProduct, validateProductImage } from "@/lib/products/validation"; // 상품 입력 검증
import type { ProductActionState, ProductEditorInitialValue, ValidatedProduct } from "@/lib/products/types"; // 상품 액션 형식

function readProductValues(formData: FormData): ProductEditorInitialValue // 상품 폼 입력 읽기
{ // 함수 시작
    return { name: String(formData.get("name") ?? ""), category: String(formData.get("category") ?? ""), gameName: String(formData.get("gameName") ?? ""), description: String(formData.get("description") ?? ""), price: String(formData.get("price") ?? ""), originalPrice: String(formData.get("originalPrice") ?? ""), badge: String(formData.get("badge") ?? "none"), salesUrl: String(formData.get("salesUrl") ?? ""), stockMode: String(formData.get("stockMode") ?? "manual"), stockQuantity: String(formData.get("stockQuantity") ?? "0"), externalProvider: String(formData.get("externalProvider") ?? ""), externalProductId: String(formData.get("externalProductId") ?? ""), publicationStatus: String(formData.get("publicationStatus") ?? "hidden"), displayOrder: String(formData.get("displayOrder") ?? "0") }; // 입력 값 반환
} // 함수 끝

function readProductImage(formData: FormData): File | null // 상품 이미지 읽기
{ // 함수 시작
    const value = formData.get("productImage"); // 이미지 값 읽기
    return value instanceof File && value.size > 0 ? value : null; // 실제 이미지 반환
} // 함수 끝

function getImageExtension(type: string): string // 이미지 확장자 판정
{ // 함수 시작
    const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }; // 이미지 확장자 목록
    return extensions[type]; // 확장자 반환
} // 함수 끝

async function uploadProductImage(folder: string, image: File): Promise<{ path: string | null; error: string | null }> // 상품 이미지 업로드
{ // 함수 시작
    const supabase = await createServerSupabaseClient(); // 서버 저장 도구
    const path = `${folder}/${crypto.randomUUID()}.${getImageExtension(image.type)}`; // 고유 저장 경로
    const result = await supabase.storage.from("product-images").upload(path, image, { cacheControl: "3600", contentType: image.type, upsert: false }); // 이미지 저장

    if (result.error) // 업로드 실패 확인
    { // 조건 시작
        return { path: null, error: "상품 이미지 업로드에 실패했습니다." }; // 업로드 실패 반환
    } // 조건 끝

    return { path, error: null }; // 업로드 성공 반환
} // 함수 끝

async function removeProductImage(path: string | null): Promise<void> // 상품 이미지 삭제
{ // 함수 시작
    if (!path || path.startsWith("/")) // 저장 이미지 아님 확인
    { // 조건 시작
        return; // 삭제 처리 종료
    } // 조건 끝

    const supabase = await createServerSupabaseClient(); // 서버 저장 도구
    await supabase.storage.from("product-images").remove([path]); // 저장 이미지 삭제
} // 함수 끝

function failedState(values: ProductEditorInitialValue, message: string, errors: ProductActionState["errors"] = {}): ProductActionState // 실패 상태 생성
{ // 함수 시작
    return { values, message, errors }; // 실패 상태 반환
} // 함수 끝

function toDatabaseValues(product: ValidatedProduct) // 데이터베이스 값 변환
{ // 함수 시작
    return { name: product.name, category: product.category, game_name: product.gameName, description: product.description, price: product.price, original_price: product.originalPrice, badge: product.badge, sales_url: product.salesUrl, stock_mode: product.stockMode, stock_quantity: product.stockQuantity, external_provider: product.externalProvider, external_product_id: product.externalProductId, publication_status: product.publicationStatus, display_order: product.displayOrder }; // 데이터베이스 값 반환
} // 함수 끝

export async function createProduct(_previousState: ProductActionState, formData: FormData): Promise<ProductActionState> // 새 상품 저장
{ // 함수 시작
    const user = await requireAdmin("/admin/products/new"); // 관리자 사용자 확인
    const values = readProductValues(formData); // 폼 입력 읽기
    const validation = validateProduct(values); // 상품 입력 검증
    const productImage = readProductImage(formData); // 상품 이미지 읽기
    const productImageError = validateProductImage(productImage); // 상품 이미지 검증

    if (!validation.value || productImageError) // 입력 오류 확인
    { // 조건 시작
        return failedState(values, "입력한 상품 정보를 확인해 주세요.", { ...validation.errors, productImage: productImageError ?? undefined }); // 입력 오류 반환
    } // 조건 끝

    let imagePath: string | null = null; // 저장 이미지 경로

    if (productImage) // 상품 이미지 존재 확인
    { // 조건 시작
        const upload = await uploadProductImage(user.id, productImage); // 상품 이미지 업로드

        if (upload.error || !upload.path) // 업로드 실패 확인
        { // 조건 시작
            return failedState(values, upload.error ?? "상품 이미지 업로드에 실패했습니다."); // 업로드 오류 반환
        } // 조건 끝

        imagePath = upload.path; // 이미지 경로 기록
    } // 조건 끝

    const supabase = await createServerSupabaseClient(); // 서버 데이터 도구
    const result = await supabase.from("products").insert({ ...toDatabaseValues(validation.value), image_path: imagePath }); // 상품 저장

    if (result.error) // 저장 실패 확인
    { // 조건 시작
        await removeProductImage(imagePath); // 신규 이미지 정리
        return failedState(values, "상품 저장에 실패했습니다. 입력 내용은 유지되었습니다."); // 저장 오류 반환
    } // 조건 끝

    revalidatePath("/api/products"); // 공개 상품 API 갱신
    redirect("/admin/products?status=created"); // 상품 목록 이동
} // 함수 끝

export async function updateProduct(id: string, _previousState: ProductActionState, formData: FormData): Promise<ProductActionState> // 상품 수정
{ // 함수 시작
    await requireAdmin(`/admin/products/${id}/edit`); // 관리자 사용자 확인
    const values = readProductValues(formData); // 폼 입력 읽기
    const validation = validateProduct(values); // 상품 입력 검증
    const productImage = readProductImage(formData); // 상품 이미지 읽기
    const productImageError = validateProductImage(productImage); // 상품 이미지 검증

    if (!validation.value || productImageError) // 입력 오류 확인
    { // 조건 시작
        return failedState(values, "입력한 상품 정보를 확인해 주세요.", { ...validation.errors, productImage: productImageError ?? undefined }); // 입력 오류 반환
    } // 조건 끝

    const supabase = await createServerSupabaseClient(); // 서버 데이터 도구
    const existingResult = await supabase.from("products").select("image_path").eq("id", id).single(); // 기존 상품 조회

    if (existingResult.error || !existingResult.data) // 기존 상품 없음 확인
    { // 조건 시작
        return failedState(values, "수정할 상품을 찾을 수 없습니다."); // 조회 오류 반환
    } // 조건 끝

    let nextImagePath = existingResult.data.image_path as string | null; // 변경 이미지 경로
    let uploadedImagePath: string | null = null; // 신규 이미지 경로

    if (productImage) // 새 이미지 존재 확인
    { // 조건 시작
        const upload = await uploadProductImage("products", productImage); // 새 이미지 업로드

        if (upload.error || !upload.path) // 업로드 실패 확인
        { // 조건 시작
            return failedState(values, upload.error ?? "상품 이미지 업로드에 실패했습니다."); // 업로드 오류 반환
        } // 조건 끝

        uploadedImagePath = upload.path; // 신규 이미지 경로 기록
        nextImagePath = upload.path; // 변경 이미지 경로 기록
    } // 조건 끝

    const updateResult = await supabase.from("products").update({ ...toDatabaseValues(validation.value), image_path: nextImagePath }).eq("id", id); // 상품 수정

    if (updateResult.error) // 수정 실패 확인
    { // 조건 시작
        await removeProductImage(uploadedImagePath); // 신규 이미지 정리
        return failedState(values, "상품 수정에 실패했습니다. 입력 내용은 유지되었습니다."); // 수정 오류 반환
    } // 조건 끝

    if (uploadedImagePath && existingResult.data.image_path) // 기존 이미지 교체 확인
    { // 조건 시작
        await removeProductImage(existingResult.data.image_path as string); // 기존 이미지 정리
    } // 조건 끝

    revalidatePath("/api/products"); // 공개 상품 API 갱신
    redirect("/admin/products?status=updated"); // 상품 목록 이동
} // 함수 끝

export async function deleteProduct(formData: FormData): Promise<void> // 상품 삭제
{ // 함수 시작
    await requireAdmin("/admin/products"); // 관리자 사용자 확인
    const id = String(formData.get("id") ?? ""); // 상품 식별자 읽기
    const supabase = await createServerSupabaseClient(); // 서버 데이터 도구
    const existingResult = await supabase.from("products").select("image_path").eq("id", id).single(); // 기존 이미지 조회
    const deleteResult = await supabase.from("products").delete().eq("id", id); // 상품 삭제

    if (!deleteResult.error && existingResult.data?.image_path) // 이미지 정리 가능 확인
    { // 조건 시작
        await removeProductImage(existingResult.data.image_path as string); // 연결 이미지 삭제
    } // 조건 끝

    revalidatePath("/api/products"); // 공개 상품 API 갱신
    redirect(`/admin/products?status=${deleteResult.error ? "delete-error" : "deleted"}`); // 처리 결과 목록 이동
} // 함수 끝
