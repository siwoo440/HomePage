create table public.comment_banned_words ( -- 댓글 금칙어 테이블
    word text primary key check (word = lower(word) and char_length(word) between 1 and 50), -- 띄어쓰기 없는 소문자 금칙어
    created_at timestamptz not null default now() -- 등록 시각
); -- 금칙어 테이블 끝

alter table public.comment_banned_words enable row level security; -- 금칙어 행 보안 활성화
revoke all on public.comment_banned_words from anon, authenticated; -- 기본 권한 회수
grant select, insert, delete on public.comment_banned_words to authenticated; -- 관리자 정책용 권한
create policy "admins read banned words" on public.comment_banned_words for select to authenticated using ((select public.is_admin())); -- 관리자 금칙어 읽기 정책
create policy "admins add banned words" on public.comment_banned_words for insert to authenticated with check ((select public.is_admin())); -- 관리자 금칙어 추가 정책
create policy "admins remove banned words" on public.comment_banned_words for delete to authenticated using ((select public.is_admin())); -- 관리자 금칙어 삭제 정책

insert into public.comment_banned_words (word) values -- 기본 금칙어(lib/comments/banned-words.ts와 같은 목록)
    ('씨발'), -- 욕설
    ('시발놈'), -- 욕설
    ('병신'), -- 욕설
    ('개새끼'), -- 욕설
    ('좆같'), -- 욕설
    ('지랄'), -- 욕설
    ('fuck'), -- 영어 욕설
    ('토토사이트'), -- 도박 광고
    ('카지노사이트'), -- 도박 광고
    ('바카라사이트'), -- 도박 광고
    ('출장안마'), -- 불법 광고
    ('대출문의') -- 대출 광고
on conflict (word) do nothing; -- 이미 있는 낱말 유지

create function public.enforce_comment_limits() -- 댓글 작성 제한 함수
returns trigger -- 트리거 결과 형식
language plpgsql -- 절차형 함수 형식
security definer -- 숨긴 댓글과 금칙어 표까지 읽도록 소유자 권한 사용
set search_path = '' -- 고정 검색 경로
as $$ -- 함수 본문 시작
declare -- 변수 선언 시작
    recent_count integer; -- 최근 작성 수
    last_created timestamptz; -- 마지막 작성 시각
    compact_content text; -- 공백을 뺀 소문자 내용
begin -- 처리 블록 시작
    if tg_op = 'INSERT' then -- 새 댓글만 빈도 확인
        perform pg_advisory_xact_lock(hashtextextended(new.author_id::text, 0)); -- 같은 회원의 동시 작성을 차례로 처리
        select count(*), max(created_at) into recent_count, last_created from public.news_comments where author_id = new.author_id and created_at > now() - interval '10 minutes'; -- 최근 작성 기록 조회
        if last_created is not null and last_created > now() - interval '30 seconds' then raise exception 'COMMENT_TOO_FAST'; end if; -- 연속 작성 차단
        if recent_count >= 5 then raise exception 'COMMENT_RATE_LIMITED'; end if; -- 작성 수 초과 차단
        if exists (select 1 from public.news_comments where author_id = new.author_id and created_at > now() - interval '24 hours' and lower(btrim(regexp_replace(content, '\s+', ' ', 'g'))) = lower(btrim(regexp_replace(new.content, '\s+', ' ', 'g')))) then raise exception 'COMMENT_DUPLICATE'; end if; -- 같은 내용 반복 차단
    end if; -- 빈도 확인 끝
    if (select count(*) from regexp_matches(new.content, '(?:https?://|www\.)\S+', 'gi')) > 2 then raise exception 'COMMENT_TOO_MANY_LINKS'; end if; -- 링크 수 초과 차단
    compact_content := lower(regexp_replace(translate(new.content, U&'\200B\200C\200D\FEFF', ''), '\s+', '', 'g')); -- 띄어 쓴 금칙어도 찾도록 공백 제거
    if exists (select 1 from public.comment_banned_words where position(word in compact_content) > 0) then raise exception 'COMMENT_BANNED_WORD'; end if; -- 금칙어 차단
    return new; -- 정상 댓글 반환
end; -- 처리 블록 끝
$$; -- 함수 본문 끝

revoke all on function public.enforce_comment_limits() from public, anon, authenticated; -- 직접 실행 권한 회수

create trigger enforce_comment_limits_before_write -- 댓글 작성 제한 트리거
before insert or update of content on public.news_comments -- 댓글 작성·내용 수정 전 실행
for each row execute function public.enforce_comment_limits(); -- 행별 제한 실행

create index news_comments_author_created_idx on public.news_comments (author_id, created_at desc); -- 회원별 최근 댓글 조회용 색인
