alter table public.member_profiles -- 회원 동의 기록 열 추가
    add column if not exists terms_agreed_at timestamptz, -- 이용약관 동의 시각
    add column if not exists privacy_agreed_at timestamptz, -- 개인정보 수집·이용 동의 시각
    add column if not exists age_confirmed_at timestamptz; -- 만 14세 이상 확인 시각

revoke select on public.member_profiles from anon, authenticated; -- 프로필 전체 열 읽기 회수
grant select (id, nickname, avatar_path, created_at, updated_at) on public.member_profiles to anon, authenticated; -- 공개 열만 읽기 허용

create function public.guard_comment_status_change() -- 댓글 공개 상태 변경 보호 함수
returns trigger -- 트리거 결과 형식
language plpgsql -- 절차형 함수 형식
security invoker -- 호출자 권한 사용
set search_path = '' -- 고정 검색 경로
as $$ -- 함수 본문 시작
begin -- 처리 블록 시작
    if new.status is distinct from old.status and not (select public.is_admin()) then raise exception 'COMMENT_STATUS_ADMIN_ONLY'; end if; -- 관리자 외 상태 변경 차단
    return new; -- 정상 변경 반환
end; -- 처리 블록 끝
$$; -- 함수 본문 끝

create trigger guard_comment_status_change_before_update -- 댓글 상태 보호 트리거
before update of status on public.news_comments -- 상태 변경 전 실행
for each row execute function public.guard_comment_status_change(); -- 행별 보호 실행

grant update (status) on public.comment_reports to authenticated; -- 신고 처리 상태 변경 권한
create policy "admins update reports" on public.comment_reports for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin())); -- 관리자 신고 처리 정책
