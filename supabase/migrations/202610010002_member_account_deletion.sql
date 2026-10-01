create or replace function public.delete_own_account() -- 회원 본인 탈퇴 함수
returns void -- 반환 값 없음
language plpgsql -- 절차형 SQL
security definer -- 인증 사용자 테이블 삭제 권한으로 실행
set search_path = '' -- 검색 경로 고정
as $$ -- 함수 본문 시작
declare -- 변수 선언
    current_user_id uuid := (select auth.uid()); -- 요청 회원 식별자
begin -- 처리 시작
    if current_user_id is null then -- 로그인 확인
        raise exception 'SIGN_IN_REQUIRED'; -- 비로그인 거부
    end if; -- 로그인 확인 끝
    if (select public.is_admin()) then -- 관리자 계정 확인
        raise exception 'ADMIN_ACCOUNT'; -- 관리자 탈퇴는 Supabase 대시보드에서 처리
    end if; -- 관리자 확인 끝
    if exists (select 1 from storage.objects where bucket_id = 'comment-images' and (storage.foldername(name))[1] = current_user_id::text) then -- 남은 댓글 이미지 확인
        raise exception 'IMAGES_REMAIN'; -- 이미지 먼저 삭제 요구
    end if; -- 이미지 확인 끝
    delete from auth.users where id = current_user_id; -- 계정 삭제(프로필·댓글·반응·신고는 연결 규칙으로 함께 삭제)
end; -- 처리 끝
$$; -- 함수 본문 끝

revoke all on function public.delete_own_account() from public, anon; -- 공개 실행 차단
grant execute on function public.delete_own_account() to authenticated; -- 로그인 회원만 실행
