create table public.member_profiles ( -- 회원 공개 프로필 테이블
    id uuid primary key references auth.users(id) on delete cascade, -- 회원 식별자
    nickname text not null check (char_length(nickname) between 1 and 20), -- 공개 닉네임
    avatar_path text, -- 프로필 이미지 경로
    created_at timestamptz not null default now(), -- 생성 시각
    updated_at timestamptz not null default now() -- 수정 시각
); -- 프로필 테이블 끝

create table public.news_comments ( -- 뉴스 댓글 테이블
    id uuid primary key default gen_random_uuid(), -- 댓글 식별자
    news_id uuid not null references public.news_posts(id) on delete cascade, -- 뉴스 식별자
    parent_id uuid references public.news_comments(id) on delete cascade, -- 부모 댓글 식별자
    author_id uuid not null references auth.users(id) on delete cascade, -- 작성자 식별자
    content text not null check (char_length(content) between 1 and 2000), -- 댓글 내용
    image_path text, -- 댓글 이미지 경로
    status text not null default 'visible' check (status in ('visible', 'hidden', 'deleted')), -- 공개 상태
    created_at timestamptz not null default now(), -- 생성 시각
    updated_at timestamptz not null default now() -- 수정 시각
); -- 댓글 테이블 끝

create table public.comment_reactions ( -- 댓글 반응 테이블
    comment_id uuid not null references public.news_comments(id) on delete cascade, -- 댓글 식별자
    user_id uuid not null references auth.users(id) on delete cascade, -- 회원 식별자
    reaction text not null check (reaction in ('like', 'cheer', 'curious')), -- 반응 종류
    created_at timestamptz not null default now(), -- 생성 시각
    primary key (comment_id, user_id) -- 회원별 단일 반응
); -- 반응 테이블 끝

create table public.comment_reports ( -- 댓글 신고 테이블
    id uuid primary key default gen_random_uuid(), -- 신고 식별자
    comment_id uuid not null references public.news_comments(id) on delete cascade, -- 댓글 식별자
    reporter_id uuid not null references auth.users(id) on delete cascade, -- 신고자 식별자
    reason text not null check (reason in ('spam', 'harassment', 'adult', 'privacy', 'other')), -- 신고 사유
    detail text not null default '' check (char_length(detail) <= 500), -- 신고 상세
    status text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed')), -- 처리 상태
    created_at timestamptz not null default now(), -- 생성 시각
    unique (comment_id, reporter_id) -- 중복 신고 차단
); -- 신고 테이블 끝

create table public.moderation_actions ( -- 관리 처리 기록 테이블
    id uuid primary key default gen_random_uuid(), -- 처리 식별자
    comment_id uuid references public.news_comments(id) on delete set null, -- 댓글 식별자
    admin_id uuid not null references auth.users(id), -- 관리자 식별자
    action text not null check (action in ('hide', 'restore', 'delete', 'dismiss_report')), -- 처리 종류
    note text not null default '' check (char_length(note) <= 1000), -- 처리 메모
    created_at timestamptz not null default now() -- 처리 시각
); -- 처리 기록 테이블 끝

alter table public.member_profiles enable row level security; -- 프로필 행 보안 활성화
alter table public.news_comments enable row level security; -- 댓글 행 보안 활성화
alter table public.comment_reactions enable row level security; -- 반응 행 보안 활성화
alter table public.comment_reports enable row level security; -- 신고 행 보안 활성화
alter table public.moderation_actions enable row level security; -- 처리 기록 행 보안 활성화

revoke all on public.member_profiles, public.news_comments, public.comment_reactions, public.comment_reports, public.moderation_actions from anon, authenticated; -- 기본 권한 회수
grant select on public.member_profiles, public.news_comments, public.comment_reactions to anon, authenticated; -- 공개 읽기 권한
grant insert, update on public.member_profiles to authenticated; -- 프로필 변경 권한
grant insert, update, delete on public.news_comments, public.comment_reactions to authenticated; -- 댓글 반응 변경 권한
grant insert, select on public.comment_reports to authenticated; -- 신고 작성 확인 권한
grant select, insert on public.moderation_actions to authenticated; -- 관리자 기록 권한

create policy "public profiles are readable" on public.member_profiles for select to anon, authenticated using (true); -- 공개 프로필 읽기 정책
create policy "members create own profile" on public.member_profiles for insert to authenticated with check (id = (select auth.uid())); -- 본인 프로필 생성 정책
create policy "members update own profile" on public.member_profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid())); -- 본인 프로필 수정 정책

create policy "visible comments are readable" on public.news_comments for select to anon, authenticated using (status = 'visible'); -- 공개 댓글 읽기 정책
create policy "members read own comments" on public.news_comments for select to authenticated using (author_id = (select auth.uid()) or (select public.is_admin())); -- 본인 댓글 읽기 정책
create policy "members create own comments" on public.news_comments for insert to authenticated with check (author_id = (select auth.uid()) and status = 'visible'); -- 본인 댓글 생성 정책
create policy "members update own comments" on public.news_comments for update to authenticated using (author_id = (select auth.uid()) or (select public.is_admin())) with check (author_id = (select auth.uid()) or (select public.is_admin())); -- 본인 댓글 수정 정책
create policy "members delete own comments" on public.news_comments for delete to authenticated using (author_id = (select auth.uid()) or (select public.is_admin())); -- 본인 댓글 삭제 정책

create policy "reactions are readable" on public.comment_reactions for select to anon, authenticated using (true); -- 반응 읽기 정책
create policy "members create own reactions" on public.comment_reactions for insert to authenticated with check (user_id = (select auth.uid())); -- 본인 반응 생성 정책
create policy "members update own reactions" on public.comment_reactions for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid())); -- 본인 반응 수정 정책
create policy "members delete own reactions" on public.comment_reactions for delete to authenticated using (user_id = (select auth.uid())); -- 본인 반응 삭제 정책

create policy "members create own reports" on public.comment_reports for insert to authenticated with check (reporter_id = (select auth.uid())); -- 본인 신고 생성 정책
create policy "members read own reports" on public.comment_reports for select to authenticated using (reporter_id = (select auth.uid()) or (select public.is_admin())); -- 본인 신고 읽기 정책
create policy "admins read moderation actions" on public.moderation_actions for select to authenticated using ((select public.is_admin())); -- 관리자 처리 기록 읽기 정책
create policy "admins create moderation actions" on public.moderation_actions for insert to authenticated with check ((select public.is_admin()) and admin_id = (select auth.uid())); -- 관리자 처리 기록 생성 정책

create function public.validate_comment_parent() -- 답글 단계 검증 함수
returns trigger -- 트리거 결과 형식
language plpgsql -- 절차형 함수 형식
security invoker -- 호출자 권한 사용
set search_path = '' -- 고정 검색 경로
as $$ -- 함수 본문 시작
declare parent_comment public.news_comments; -- 부모 댓글 변수
begin -- 처리 블록 시작
    if new.parent_id is null then return new; end if; -- 최상위 댓글 통과
    select * into parent_comment from public.news_comments where id = new.parent_id; -- 부모 댓글 조회
    if parent_comment.id is null or parent_comment.news_id <> new.news_id or parent_comment.parent_id is not null then raise exception 'INVALID_COMMENT_PARENT'; end if; -- 잘못된 부모 차단
    return new; -- 정상 댓글 반환
end; -- 처리 블록 끝
$$; -- 함수 본문 끝

create trigger validate_comment_parent_before_write -- 답글 단계 검증 트리거
before insert or update of parent_id, news_id on public.news_comments -- 댓글 저장 전 실행
for each row execute function public.validate_comment_parent(); -- 행별 검증 실행

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) -- 댓글 이미지 버킷 생성
values ('comment-images', 'comment-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']) -- 버킷 제한 값
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types; -- 기존 버킷 갱신

create policy "members upload own comment images" on storage.objects for insert to authenticated with check (bucket_id = 'comment-images' and (storage.foldername(name))[1] = (select auth.uid())::text); -- 본인 이미지 업로드 정책
create policy "members update own comment images" on storage.objects for update to authenticated using (bucket_id = 'comment-images' and (storage.foldername(name))[1] = (select auth.uid())::text) with check (bucket_id = 'comment-images' and (storage.foldername(name))[1] = (select auth.uid())::text); -- 본인 이미지 수정 정책
create policy "members delete own comment images" on storage.objects for delete to authenticated using (bucket_id = 'comment-images' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin()))); -- 본인 이미지 삭제 정책
