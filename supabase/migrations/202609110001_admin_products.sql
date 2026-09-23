create table public.products ( -- 상품 테이블 생성
    id uuid primary key default gen_random_uuid(), -- 상품 식별자
    name text not null check (char_length(name) between 1 and 120), -- 상품명 제한
    category text not null check (char_length(category) between 1 and 40), -- 분류 제한
    game_name text not null default '' check (char_length(game_name) <= 80), -- 관련 게임명 제한
    description text not null default '' check (char_length(description) <= 500), -- 상품 설명 제한
    price integer not null check (price >= 0), -- 판매가 제한
    original_price integer check (original_price is null or original_price > price), -- 할인 전 가격 제한
    badge text not null default 'none' check (badge in ('none', 'new', 'hot', 'limited')), -- 배지 제한
    image_path text, -- 상품 이미지 경로
    sales_url text check (sales_url is null or sales_url like 'https://%'), -- 판매 주소 제한
    stock_mode text not null default 'manual' check (stock_mode in ('manual', 'external')), -- 재고 방식 제한
    stock_quantity integer not null default 0 check (stock_quantity >= 0), -- 재고 수량 제한
    external_provider text, -- 외부 판매처 식별자
    external_product_id text, -- 외부 상품 식별자
    publication_status text not null default 'hidden' check (publication_status in ('published', 'hidden')), -- 공개 상태 제한
    display_order integer not null default 0 check (display_order >= 0), -- 노출 순서 제한
    created_at timestamptz not null default now(), -- 생성 시각
    updated_at timestamptz not null default now() -- 수정 시각
); -- 상품 테이블 끝

alter table public.products enable row level security; -- 행 보안 활성화
revoke all on public.products from anon, authenticated; -- 기본 권한 회수
grant select on public.products to anon; -- 공개 읽기 권한
grant select, insert, update, delete on public.products to authenticated; -- 관리자 작업 기본 권한

create policy "published products are public" -- 공개 상품 읽기 정책
on public.products -- 대상 테이블
for select -- 읽기 작업
to anon, authenticated -- 공개 대상 역할
using (publication_status = 'published'); -- 공개 상태 조건

create policy "admins can read all products" -- 관리자 전체 읽기 정책
on public.products -- 대상 테이블
for select -- 읽기 작업
to authenticated -- 로그인 대상 역할
using ((select public.is_admin())); -- 관리자 조건

create policy "admins can create products" -- 관리자 상품 작성 정책
on public.products -- 대상 테이블
for insert -- 작성 작업
to authenticated -- 로그인 대상 역할
with check ((select public.is_admin())); -- 관리자 조건

create policy "admins can update products" -- 관리자 상품 수정 정책
on public.products -- 대상 테이블
for update -- 수정 작업
to authenticated -- 로그인 대상 역할
using ((select public.is_admin())) -- 기존 행 관리자 조건
with check ((select public.is_admin())); -- 변경 행 관리자 조건

create policy "admins can delete products" -- 관리자 상품 삭제 정책
on public.products -- 대상 테이블
for delete -- 삭제 작업
to authenticated -- 로그인 대상 역할
using ((select public.is_admin())); -- 관리자 조건

create function public.set_products_updated_at() -- 상품 수정 시각 함수
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

create trigger set_products_updated_at -- 상품 수정 시각 트리거
before update on public.products -- 수정 전 실행
for each row -- 행별 실행
execute function public.set_products_updated_at(); -- 수정 시각 함수 호출

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) -- 상품 이미지 버킷 생성
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']) -- 상품 버킷 설정
on conflict (id) do update -- 기존 버킷 갱신
set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types; -- 제한 설정 갱신

create policy "admins can upload product images" -- 관리자 상품 이미지 작성 정책
on storage.objects -- 저장 객체 테이블
for insert -- 업로드 작업
to authenticated -- 로그인 대상 역할
with check (bucket_id = 'product-images' and (select public.is_admin())); -- 버킷과 관리자 조건

create policy "admins can update product images" -- 관리자 상품 이미지 수정 정책
on storage.objects -- 저장 객체 테이블
for update -- 수정 작업
to authenticated -- 로그인 대상 역할
using (bucket_id = 'product-images' and (select public.is_admin())) -- 기존 객체 조건
with check (bucket_id = 'product-images' and (select public.is_admin())); -- 변경 객체 조건

create policy "admins can delete product images" -- 관리자 상품 이미지 삭제 정책
on storage.objects -- 저장 객체 테이블
for delete -- 삭제 작업
to authenticated -- 로그인 대상 역할
using (bucket_id = 'product-images' and (select public.is_admin())); -- 버킷과 관리자 조건

insert into public.products (name, category, game_name, description, price, original_price, badge, image_path, stock_quantity, publication_status, display_order) -- 임시 상품 등록
values -- 임시 상품 값 시작
    ('아비스 크로니클 주인공 키링', '아크릴 키링', '아비스 크로니클', '주인공을 담은 임시 아크릴 키링 목업입니다.', 9900, null, 'new', '/images/goods/abyss-keyring.webp', 30, 'published', 1), -- 키링 상품
    ('네온 펄스 후드집업', '의류', '네온 펄스', '네온 색상을 활용한 임시 후드집업 목업입니다.', 39200, 49000, 'hot', '/images/goods/neon-pulse-hoodie.webp', 12, 'published', 2), -- 후드집업 상품
    ('루나 점프 아트 포스터 세트', '포스터', '루나 점프', '게임 아트를 활용한 임시 포스터 세트 목업입니다.', 18000, null, 'limited', '/images/goods/luna-jump-posters.webp', 5, 'published', 3), -- 포스터 상품
    ('DEVFORGE 로고 머그컵', '생활용품', 'DEVFORGE Studio', '스튜디오 색상을 활용한 임시 머그컵 목업입니다.', 14500, null, 'new', '/images/goods/devforge-mug.webp', 0, 'published', 4), -- 머그컵 상품
    ('전 게임 캐릭터 스티커팩', '스티커', '전 타이틀 컬렉션', '여러 프로젝트를 표현한 임시 스티커 목업입니다.', 6300, 7000, 'hot', '/images/goods/all-games-stickers.webp', 24, 'published', 5), -- 스티커 상품
    ('에코 보이드 대형 마우스패드', '데스크 용품', '에코 보이드', '어두운 우주 분위기의 임시 마우스패드 목업입니다.', 22000, null, 'limited', '/images/goods/echo-void-mousepad.webp', 4, 'published', 6), -- 마우스패드 상품
    ('아비스 크로니클 핀뱃지 3종 세트', '핀뱃지', '아비스 크로니클', '세 가지 문양으로 구성한 임시 핀뱃지 목업입니다.', 12000, null, 'new', '/images/goods/abyss-pin-set.webp', 18, 'published', 7), -- 핀뱃지 상품
    ('네온 펄스 OST 한정판 CD', '음반', '네온 펄스', '사이버 음악 콘셉트의 임시 OST CD 목업입니다.', 25000, null, 'limited', '/images/goods/neon-pulse-ost.webp', 3, 'published', 8); -- OST 상품
