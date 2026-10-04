create table public.contact_messages ( -- 문의 양식 접수 테이블
    id uuid primary key default gen_random_uuid(), -- 문의 식별자
    category text not null check (category in ('game', 'account', 'goods', 'privacy', 'other')), -- 문의 분류
    email text not null check (char_length(email) between 3 and 254), -- 답변 받을 이메일
    subject text not null check (char_length(subject) between 2 and 100), -- 문의 제목
    message text not null check (char_length(message) between 10 and 2000), -- 문의 내용
    status text not null default 'pending' check (status in ('pending', 'answered')), -- 처리 상태
    admin_note text check (admin_note is null or char_length(admin_note) <= 1000), -- 관리자 메모
    handled_at timestamptz, -- 처리 시각
    handled_by uuid references auth.users(id) on delete set null, -- 처리한 관리자
    created_at timestamptz not null default now() -- 접수 시각
); -- 문의 테이블 끝

create index contact_messages_status_created_idx on public.contact_messages (status, created_at desc); -- 상태별 최신순 조회 색인

alter table public.contact_messages enable row level security; -- 행 단위 보안 사용

revoke all on public.contact_messages from anon, authenticated; -- 기본 권한 회수
grant insert (category, email, subject, message) on public.contact_messages to anon, authenticated; -- 방문자는 문의 내용만 추가
grant select, update on public.contact_messages to authenticated; -- 조회·처리는 로그인 계정(아래 정책으로 관리자만)

create policy "anyone submits contact messages" on public.contact_messages for insert to anon, authenticated with check (status = 'pending' and admin_note is null and handled_at is null and handled_by is null); -- 누구나 대기 상태 문의만 추가
create policy "admins read contact messages" on public.contact_messages for select to authenticated using ((select public.is_admin())); -- 관리자만 문의 조회
create policy "admins update contact messages" on public.contact_messages for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin())); -- 관리자만 문의 처리
