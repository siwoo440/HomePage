create table public.release_notifications ( -- 출시 알림 신청 테이블
    id uuid primary key default gen_random_uuid(), -- 신청 식별자
    project_id text not null check (project_id ~ '^project-[a-z]{1,12}$'), -- 게임 식별자
    email text not null check (char_length(email) between 3 and 254 and email = lower(email)), -- 알림 받을 이메일(소문자)
    token uuid not null unique default gen_random_uuid(), -- 수신 거부 주소에 쓰는 값
    status text not null default 'active' check (status in ('active', 'unsubscribed')), -- 수신 상태
    confirmed_at timestamptz, -- 확인 메일로 본인 신청임을 확인한 시각(메일 서비스 연결 뒤 사용)
    created_at timestamptz not null default now(), -- 신청 시각
    unsubscribed_at timestamptz, -- 수신 거부 시각
    unique (project_id, email) -- 같은 게임·같은 이메일은 한 번만 저장
); -- 신청 테이블 끝

create index release_notifications_project_status_idx on public.release_notifications (project_id, status); -- 게임별 집계 색인

alter table public.release_notifications enable row level security; -- 행 단위 보안 사용

revoke all on public.release_notifications from anon, authenticated; -- 기본 권한 회수(방문자는 아래 함수로만 신청)
grant select on public.release_notifications to authenticated; -- 조회는 로그인 계정(아래 정책으로 관리자만)
create policy "admins read release notifications" on public.release_notifications for select to authenticated using ((select public.is_admin())); -- 관리자만 신청 조회

create function public.subscribe_release_notification(p_project_id text, p_email text) -- 출시 알림 신청 함수
returns void -- 결과 없음(이미 신청했는지 알려 주지 않음)
language plpgsql -- 절차형 함수 형식
security definer -- 표를 직접 열지 않고 이 함수로만 추가
set search_path = '' -- 고정 검색 경로
as $$ -- 함수 본문 시작
declare -- 변수 선언 시작
    clean_email text := lower(btrim(coalesce(p_email, ''))); -- 정리한 이메일
begin -- 처리 블록 시작
    if p_project_id is null or p_project_id !~ '^project-[a-z]{1,12}$' then raise exception 'NOTIFY_INVALID_PROJECT'; end if; -- 잘못된 게임 식별자 차단
    if char_length(clean_email) not between 3 and 254 or clean_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' then raise exception 'NOTIFY_INVALID_EMAIL'; end if; -- 잘못된 이메일 차단
    insert into public.release_notifications as existing (project_id, email) values (p_project_id, clean_email) -- 신청 추가
    on conflict (project_id, email) do update set -- 이미 있는 신청 처리
        confirmed_at = case when existing.status = 'unsubscribed' then null else existing.confirmed_at end, -- 다시 신청하면 본인 확인도 다시
        token = case when existing.status = 'unsubscribed' then gen_random_uuid() else existing.token end, -- 다시 신청하면 수신 거부 값 교체
        unsubscribed_at = null, -- 수신 거부 시각 지움
        status = 'active'; -- 수신 상태로 되돌림
end; -- 처리 블록 끝
$$; -- 함수 본문 끝

create function public.unsubscribe_release_notification(p_token uuid) -- 출시 알림 수신 거부 함수
returns boolean -- 대상 신청 존재 여부
language plpgsql -- 절차형 함수 형식
security definer -- 수신 거부 값을 아는 사람만 해당 신청 변경
set search_path = '' -- 고정 검색 경로
as $$ -- 함수 본문 시작
begin -- 처리 블록 시작
    update public.release_notifications set status = 'unsubscribed', unsubscribed_at = coalesce(unsubscribed_at, now()) where token = p_token; -- 수신 거부 표시
    return found; -- 대상 존재 여부 반환
end; -- 처리 블록 끝
$$; -- 함수 본문 끝

create function public.release_notification_counts() -- 게임별 신청 수 집계 함수
returns table (project_id text, active_count bigint, unsubscribed_count bigint) -- 게임별 수신 중·수신 거부 수
language sql -- SQL 함수 형식
stable -- 조회 전용
security invoker -- 호출자 권한 사용(관리자만 행이 보임)
set search_path = '' -- 고정 검색 경로
as $$ -- 함수 본문 시작
    select n.project_id, count(*) filter (where n.status = 'active'), count(*) filter (where n.status = 'unsubscribed') from public.release_notifications as n group by n.project_id; -- 게임별 집계
$$; -- 함수 본문 끝

revoke all on function public.subscribe_release_notification(text, text) from public, anon, authenticated; -- 기본 실행 권한 회수
revoke all on function public.unsubscribe_release_notification(uuid) from public, anon, authenticated; -- 기본 실행 권한 회수
revoke all on function public.release_notification_counts() from public, anon, authenticated; -- 기본 실행 권한 회수
grant execute on function public.subscribe_release_notification(text, text) to anon, authenticated; -- 누구나 신청
grant execute on function public.unsubscribe_release_notification(uuid) to anon, authenticated; -- 누구나 수신 거부
grant execute on function public.release_notification_counts() to authenticated; -- 집계는 로그인 계정(행 보안으로 관리자만 결과)
