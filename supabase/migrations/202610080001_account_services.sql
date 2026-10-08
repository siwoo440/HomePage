create table public.account_services ( -- 통합 계정으로 로그인할 수 있는 서비스 목록
    id text primary key check (id ~ '^[a-z0-9-]{2,40}$'), -- 서비스 식별자
    oauth_client_id text unique, -- 서비스에 발급한 OAuth 클라이언트 식별자(등록 전에는 비워 둠)
    created_at timestamptz not null default now() -- 등록 시각
); -- 서비스 목록 끝

insert into public.account_services (id) values ('mate-verse'), ('atelier-verse'); -- 연결할 서비스 등록(클라이언트 식별자는 OAuth 앱 등록 뒤 SQL Editor에서 입력)

create table public.member_service_links ( -- 회원별 서비스 연결 기록
    member_id uuid not null references auth.users(id) on delete cascade, -- 회원 식별자
    service_id text not null references public.account_services(id) on delete cascade, -- 서비스 식별자
    summary jsonb not null default '{}'::jsonb check (jsonb_typeof(summary) = 'object' and octet_length(summary::text) <= 2000), -- 서비스가 알려 준 요약 정보
    first_used_at timestamptz not null default now(), -- 처음 이용 시각
    last_used_at timestamptz not null default now(), -- 마지막 이용 시각
    primary key (member_id, service_id) -- 회원과 서비스마다 한 줄
); -- 연결 기록 끝

create function public.current_account_service() -- 요청한 OAuth 클라이언트의 서비스 판정
returns text -- 서비스 식별자 반환
language sql -- SQL 함수
stable -- 같은 요청 안에서 같은 결과
security definer -- 서비스 목록 조회 권한으로 실행
set search_path = '' -- 검색 경로 고정
as $$ -- 함수 본문 시작
    select id from public.account_services where oauth_client_id = nullif((select auth.jwt()) ->> 'client_id', ''); -- 로그인 토큰의 클라이언트와 일치하는 서비스
$$; -- 함수 본문 끝

create function public.record_service_use(service_summary jsonb default '{}'::jsonb) -- 서비스 이용 기록 함수
returns void -- 반환 값 없음
language plpgsql -- 절차형 SQL
security definer -- 연결 기록 쓰기 권한으로 실행
set search_path = '' -- 검색 경로 고정
as $$ -- 함수 본문 시작
declare -- 변수 선언
    current_user_id uuid := (select auth.uid()); -- 요청 회원 식별자
    current_service text := (select public.current_account_service()); -- 요청 서비스 식별자
begin -- 처리 시작
    if current_user_id is null then -- 로그인 확인
        raise exception 'SIGN_IN_REQUIRED'; -- 비로그인 거부
    end if; -- 로그인 확인 끝
    if current_service is null then -- 등록된 서비스 확인
        raise exception 'UNKNOWN_SERVICE'; -- 등록된 서비스의 로그인으로만 기록
    end if; -- 서비스 확인 끝
    insert into public.member_service_links (member_id, service_id, summary) values (current_user_id, current_service, coalesce(service_summary, '{}'::jsonb)) -- 첫 이용 기록
    on conflict (member_id, service_id) do update set summary = excluded.summary, last_used_at = now(); -- 다시 이용하면 요약과 마지막 이용 시각 갱신
end; -- 처리 끝
$$; -- 함수 본문 끝

alter table public.account_services enable row level security; -- 서비스 목록 행 보안 사용
alter table public.member_service_links enable row level security; -- 연결 기록 행 보안 사용
revoke all on public.account_services from anon, authenticated; -- 기본 권한 회수
revoke all on public.member_service_links from anon, authenticated; -- 기본 권한 회수
grant select on public.account_services to authenticated; -- 로그인 회원은 서비스 목록 조회
grant select, delete on public.member_service_links to authenticated; -- 로그인 회원은 본인 기록 조회·삭제(쓰기는 함수로만)
create policy "members read account services" on public.account_services for select to authenticated using (true); -- 서비스 목록은 로그인 회원 모두 조회
create policy "members read own service links" on public.member_service_links for select to authenticated using ((select auth.uid()) = member_id and (((select auth.jwt()) ->> 'client_id') is null or service_id = (select public.current_account_service()))); -- 본인 기록만 조회(서비스 로그인은 자기 서비스 기록만)
create policy "members delete own service links" on public.member_service_links for delete to authenticated using ((select auth.uid()) = member_id and ((select auth.jwt()) ->> 'client_id') is null); -- 기록 삭제는 홈페이지 로그인으로만

revoke all on function public.current_account_service() from public, anon, authenticated; -- 기본 실행 권한 회수
revoke all on function public.record_service_use(jsonb) from public, anon, authenticated; -- 기본 실행 권한 회수
grant execute on function public.current_account_service() to authenticated; -- 조회 정책에서 사용
grant execute on function public.record_service_use(jsonb) to authenticated; -- 서비스 로그인 회원이 이용 기록

create or replace function public.delete_own_account() -- 회원 본인 탈퇴 함수(서비스 로그인 차단 추가)
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
    if ((select auth.jwt()) ->> 'client_id') is not null then -- 다른 서비스의 로그인 확인
        raise exception 'HOMEPAGE_ONLY'; -- 탈퇴는 홈페이지에서 직접 로그인한 때에만 허용
    end if; -- 서비스 로그인 확인 끝
    if (select public.is_admin()) then -- 관리자 계정 확인
        raise exception 'ADMIN_ACCOUNT'; -- 관리자 탈퇴는 Supabase 대시보드에서 처리
    end if; -- 관리자 확인 끝
    if exists (select 1 from storage.objects where bucket_id = 'comment-images' and (storage.foldername(name))[1] = current_user_id::text) then -- 남은 댓글 이미지 확인
        raise exception 'IMAGES_REMAIN'; -- 이미지 먼저 삭제 요구
    end if; -- 이미지 확인 끝
    delete from auth.users where id = current_user_id; -- 계정 삭제(프로필·댓글·반응·신고·서비스 연결 기록은 연결 규칙으로 함께 삭제)
end; -- 처리 끝
$$; -- 함수 본문 끝
