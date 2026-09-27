"use server"; // 서버 액션 모듈

import { redirect } from "next/navigation"; // 서버 이동 도구
import { revalidatePath } from "next/cache"; // 캐시 갱신 도구
import { requireAdmin } from "@/lib/auth/admin"; // 관리자 보호 함수
import { createServerSupabaseClient } from "@/lib/supabase/server"; // 서버 데이터 도구
import { validateCoverImage, validateNewsPost } from "@/lib/news/validation"; // 뉴스 입력 검증
import type { NewsActionState, NewsEditorInitialValue } from "@/lib/news/types"; // 뉴스 액션 형식

function readNewsValues(formData: FormData): NewsEditorInitialValue // 폼 입력 읽기
{ // 함수 시작
    const values = // 입력 값 시작
    { // 입력 값 객체
        title: String(formData.get("title") ?? ""), // 제목 읽기
        summary: String(formData.get("summary") ?? ""), // 요약 읽기
        content: String(formData.get("content") ?? ""), // 본문 읽기
        tags: formData.getAll("tags").map(String), // 태그 읽기
        status: String(formData.get("status") ?? "draft"), // 상태 읽기
    }; // 입력 값 끝
    return values; // 입력 값 반환
} // 함수 끝

function readCoverImage(formData: FormData): File | null // 이미지 입력 읽기
{ // 함수 시작
    const value = formData.get("coverImage"); // 이미지 값 읽기
    return value instanceof File && value.size > 0 ? value : null; // 실제 이미지 반환
} // 함수 끝

function getImageExtension(type: string): string // 이미지 확장자 판정
{ // 함수 시작
    const extensions: Record<string, string> = // 이미지 확장자 목록
    { // 확장자 객체 시작
        "image/jpeg": "jpg", // JPEG 확장자
        "image/png": "png", // PNG 확장자
        "image/webp": "webp", // WebP 확장자
    }; // 확장자 객체 끝
    return extensions[type]; // 확장자 반환
} // 함수 끝

async function uploadCoverImage(userId: string, image: File): Promise<{ path: string | null; error: string | null }> // 이미지 업로드
{ // 함수 시작
    const supabase = await createServerSupabaseClient(); // 서버 저장 도구
    const extension = getImageExtension(image.type); // 이미지 확장자
    const path = `${userId}/${crypto.randomUUID()}.${extension}`; // 고유 저장 경로
    const result = await supabase.storage.from("news-images").upload(path, image, // 이미지 저장
    { // 업로드 설정 시작
        cacheControl: "3600", // 이미지 캐시 시간
        contentType: image.type, // 이미지 콘텐츠 형식
        upsert: false, // 기존 파일 덮어쓰기 차단
    }); // 업로드 설정 끝

    if (result.error) // 업로드 실패 확인
    { // 조건 시작
        return { path: null, error: "대표 이미지 업로드에 실패했습니다." }; // 업로드 실패 반환
    } // 조건 끝

    return { path, error: null }; // 업로드 성공 반환
} // 함수 끝

async function removeCoverImage(path: string | null): Promise<void> // 이미지 삭제
{ // 함수 시작
    if (!path) // 이미지 경로 없음 확인
    { // 조건 시작
        return; // 삭제 처리 종료
    } // 조건 끝

    const supabase = await createServerSupabaseClient(); // 서버 저장 도구
    await supabase.storage.from("news-images").remove([path]); // 저장 이미지 삭제
} // 함수 끝

function failedState(values: NewsEditorInitialValue, message: string, errors: NewsActionState["errors"] = {}): NewsActionState // 실패 상태 생성
{ // 함수 시작
    return { values, message, errors }; // 실패 상태 반환
} // 함수 끝

export async function createNewsPost(_previousState: NewsActionState, formData: FormData): Promise<NewsActionState> // 새 뉴스 저장
{ // 함수 시작
    const user = await requireAdmin("/admin/news/new"); // 관리자 사용자 확인
    const values = readNewsValues(formData); // 폼 입력 읽기
    const validation = validateNewsPost(values); // 게시물 입력 검증
    const coverImage = readCoverImage(formData); // 대표 이미지 읽기
    const coverImageError = validateCoverImage(coverImage); // 대표 이미지 검증

    if (!validation.value || coverImageError) // 입력 오류 확인
    { // 조건 시작
        return failedState(values, "입력한 내용을 확인해 주세요.", { ...validation.errors, coverImage: coverImageError ?? undefined }); // 입력 오류 반환
    } // 조건 끝

    let coverImagePath: string | null = null; // 저장 이미지 경로

    if (coverImage) // 대표 이미지 존재 확인
    { // 조건 시작
        const upload = await uploadCoverImage(user.id, coverImage); // 대표 이미지 업로드

        if (upload.error || !upload.path) // 업로드 실패 확인
        { // 조건 시작
            return failedState(values, upload.error ?? "대표 이미지 업로드에 실패했습니다."); // 업로드 오류 반환
        } // 조건 끝

        coverImagePath = upload.path; // 저장 이미지 경로 기록
    } // 조건 끝

    const supabase = await createServerSupabaseClient(); // 서버 데이터 도구
    const result = await supabase.from("news_posts").insert( // 게시물 저장
    { // 게시물 값 시작
        ...validation.value, // 검증된 입력 값
        author_id: user.id, // 로그인 작성자 식별자
        cover_image_path: coverImagePath, // 대표 이미지 경로
        published_at: validation.value.status === "published" ? new Date().toISOString() : null, // 공개 시각
    }); // 게시물 값 끝

    if (result.error) // 저장 실패 확인
    { // 조건 시작
        await removeCoverImage(coverImagePath); // 신규 이미지 정리
        return failedState(values, "뉴스 저장에 실패했습니다. 작성 내용은 유지되었습니다."); // 저장 오류 반환
    } // 조건 끝

    revalidatePath("/api/news"); // 공개 뉴스 캐시 갱신
    redirect("/admin/news?status=created"); // 관리 목록 이동
} // 함수 끝

export async function updateNewsPost(id: string, _previousState: NewsActionState, formData: FormData): Promise<NewsActionState> // 뉴스 수정
{ // 함수 시작
    const user = await requireAdmin(`/admin/news/${id}/edit`); // 관리자 사용자 확인
    const values = readNewsValues(formData); // 폼 입력 읽기
    const validation = validateNewsPost(values); // 게시물 입력 검증
    const coverImage = readCoverImage(formData); // 대표 이미지 읽기
    const coverImageError = validateCoverImage(coverImage); // 대표 이미지 검증

    if (!validation.value || coverImageError) // 입력 오류 확인
    { // 조건 시작
        return failedState(values, "입력한 내용을 확인해 주세요.", { ...validation.errors, coverImage: coverImageError ?? undefined }); // 입력 오류 반환
    } // 조건 끝

    const supabase = await createServerSupabaseClient(); // 서버 데이터 도구
    const existingResult = await supabase.from("news_posts").select("cover_image_path, published_at").eq("id", id).single(); // 기존 게시물 조회

    if (existingResult.error || !existingResult.data) // 기존 게시물 없음 확인
    { // 조건 시작
        return failedState(values, "수정할 뉴스를 찾을 수 없습니다."); // 조회 오류 반환
    } // 조건 끝

    let nextCoverImagePath = existingResult.data.cover_image_path as string | null; // 변경 이미지 경로
    let uploadedImagePath: string | null = null; // 신규 이미지 경로

    if (coverImage) // 새 이미지 존재 확인
    { // 조건 시작
        const upload = await uploadCoverImage(user.id, coverImage); // 새 이미지 업로드

        if (upload.error || !upload.path) // 업로드 실패 확인
        { // 조건 시작
            return failedState(values, upload.error ?? "대표 이미지 업로드에 실패했습니다."); // 업로드 오류 반환
        } // 조건 끝

        uploadedImagePath = upload.path; // 신규 이미지 경로 기록
        nextCoverImagePath = upload.path; // 변경 이미지 경로 기록
    } // 조건 끝

    const publishedAt = validation.value.status === "published" ? existingResult.data.published_at ?? new Date().toISOString() : null; // 공개 시각 계산
    const updateResult = await supabase.from("news_posts").update( // 게시물 수정
    { // 변경 값 시작
        ...validation.value, // 검증된 입력 값
        cover_image_path: nextCoverImagePath, // 변경 이미지 경로
        published_at: publishedAt, // 변경 공개 시각
    }).eq("id", id).eq("author_id", user.id); // 관리자 소유 행 제한

    if (updateResult.error) // 수정 실패 확인
    { // 조건 시작
        await removeCoverImage(uploadedImagePath); // 신규 이미지 정리
        return failedState(values, "뉴스 수정에 실패했습니다. 작성 내용은 유지되었습니다."); // 수정 오류 반환
    } // 조건 끝

    if (uploadedImagePath && existingResult.data.cover_image_path) // 기존 이미지 교체 확인
    { // 조건 시작
        await removeCoverImage(existingResult.data.cover_image_path as string); // 기존 이미지 삭제
    } // 조건 끝

    revalidatePath("/api/news"); // 공개 뉴스 캐시 갱신
    revalidatePath(`/news/${id}`); // 상세 뉴스 캐시 갱신
    redirect("/admin/news?status=updated"); // 관리 목록 이동
} // 함수 끝

export async function deleteNewsPost(formData: FormData): Promise<void> // 뉴스 삭제
{ // 함수 시작
    await requireAdmin("/admin/news"); // 관리자 사용자 확인
    const id = String(formData.get("id") ?? ""); // 게시물 식별자 읽기
    const supabase = await createServerSupabaseClient(); // 서버 데이터 도구
    const existingResult = await supabase.from("news_posts").select("cover_image_path").eq("id", id).single(); // 기존 이미지 조회
    const deleteResult = await supabase.from("news_posts").delete().eq("id", id); // 게시물 삭제

    if (!deleteResult.error && existingResult.data?.cover_image_path) // 이미지 정리 가능 확인
    { // 조건 시작
        await removeCoverImage(existingResult.data.cover_image_path as string); // 연결 이미지 삭제
    } // 조건 끝

    revalidatePath("/api/news"); // 공개 뉴스 캐시 갱신
    redirect("/admin/news?status=deleted"); // 관리 목록 이동
} // 함수 끝

export async function signOutAdmin(): Promise<void> // 관리자 로그아웃
{ // 함수 시작
    const supabase = await createServerSupabaseClient(); // 서버 인증 도구
    await supabase.auth.signOut(); // 로그인 세션 종료
    redirect("/admin/login"); // 로그인 화면 이동
} // 함수 끝
