create table public.news_posts ( -- 뉴스 게시물 테이블
    id uuid primary key default gen_random_uuid(), -- 게시물 식별자
    title text not null check (char_length(title) between 1 and 120), -- 제목 제한
    summary text not null default '' check (char_length(summary) <= 300), -- 요약 제한
    content text not null check (char_length(content) between 1 and 50000), -- 본문 제한
    tags text[] not null default '{}' check (tags <@ array['update', 'feature', 'devlog', 'fix']::text[]), -- 태그 제한
    cover_image_path text, -- 이미지 경로
    status text not null check (status in ('draft', 'published')), -- 공개 상태
    author_id uuid not null references auth.users(id), -- 작성자 식별자
    created_at timestamptz not null default now(), -- 생성 시각
    updated_at timestamptz not null default now(), -- 수정 시각
    published_at timestamptz -- 공개 시각
); -- 테이블 끝

alter table public.news_posts enable row level security; -- 행 보안 활성화
revoke all on public.news_posts from anon, authenticated; -- 기본 권한 회수
grant select on public.news_posts to anon; -- 공개 읽기 권한
grant select, insert, update, delete on public.news_posts to authenticated; -- 로그인 사용자 기본 권한

create function public.is_admin() -- 관리자 판정 함수
returns boolean -- 판정 결과 형식
language sql -- SQL 함수 형식
stable -- 요청 중 안정 함수
security invoker -- 호출자 권한 사용
set search_path = '' -- 고정 검색 경로
as $$ -- 함수 본문 시작
    select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false); -- 관리자 역할 확인
$$; -- 함수 본문 끝

revoke all on function public.is_admin() from public; -- 공개 실행 권한 회수
grant execute on function public.is_admin() to authenticated; -- 로그인 실행 권한

create policy "published news is public" -- 공개 뉴스 읽기 정책
on public.news_posts -- 대상 테이블
for select -- 읽기 작업
to anon, authenticated -- 공개 대상 역할
using (status = 'published'); -- 공개 상태 조건

create policy "admins can read all news" -- 관리자 전체 읽기 정책
on public.news_posts -- 대상 테이블
for select -- 읽기 작업
to authenticated -- 로그인 대상 역할
using ((select public.is_admin())); -- 관리자 조건

create policy "admins can create news" -- 관리자 작성 정책
on public.news_posts -- 대상 테이블
for insert -- 작성 작업
to authenticated -- 로그인 대상 역할
with check ((select public.is_admin()) and author_id = (select auth.uid())); -- 관리자와 작성자 조건

create policy "admins can update news" -- 관리자 수정 정책
on public.news_posts -- 대상 테이블
for update -- 수정 작업
to authenticated -- 로그인 대상 역할
using ((select public.is_admin()) and author_id = (select auth.uid())) -- 기존 행 조건
with check ((select public.is_admin()) and author_id = (select auth.uid())); -- 변경 행 조건

create policy "admins can delete news" -- 관리자 삭제 정책
on public.news_posts -- 대상 테이블
for delete -- 삭제 작업
to authenticated -- 로그인 대상 역할
using ((select public.is_admin()) and author_id = (select auth.uid())); -- 관리자와 작성자 조건

create function public.set_news_updated_at() -- 수정 시각 함수
returns trigger -- 트리거 결과 형식
language plpgsql -- 절차형 함수 형식
security invoker -- 호출자 권한 사용
set search_path = '' -- 고정 검색 경로
as $$ -- 함수 본문 시작
begin -- 처리 블록 시작
    new.updated_at = now(); -- 수정 시각 갱신
    return new; -- 변경 행 반환
end; -- 처리 블록 끝
$$; -- 함수 본문 끝

create trigger set_news_updated_at -- 수정 시각 트리거
before update on public.news_posts -- 수정 전 실행
for each row -- 행별 실행
execute function public.set_news_updated_at(); -- 갱신 함수 호출

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) -- 이미지 버킷 생성
values ('news-images', 'news-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']) -- 버킷 설정값
on conflict (id) do update -- 기존 버킷 갱신
set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types; -- 제한 설정 갱신

create policy "admins can upload news images" -- 관리자 이미지 작성 정책
on storage.objects -- 저장 객체 테이블
for insert -- 업로드 작업
to authenticated -- 로그인 대상 역할
with check (bucket_id = 'news-images' and (select public.is_admin())); -- 버킷과 관리자 조건

create policy "admins can update news images" -- 관리자 이미지 수정 정책
on storage.objects -- 저장 객체 테이블
for update -- 수정 작업
to authenticated -- 로그인 대상 역할
using (bucket_id = 'news-images' and (select public.is_admin())) -- 기존 객체 조건
with check (bucket_id = 'news-images' and (select public.is_admin())); -- 변경 객체 조건

create policy "admins can delete news images" -- 관리자 이미지 삭제 정책
on storage.objects -- 저장 객체 테이블
for delete -- 삭제 작업
to authenticated -- 로그인 대상 역할
using (bucket_id = 'news-images' and (select public.is_admin())); -- 버킷과 관리자 조건
