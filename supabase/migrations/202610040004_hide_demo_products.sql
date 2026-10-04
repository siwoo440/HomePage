update public.products -- 두 번째 파일이 넣은 임시 상품 숨김
set publication_status = 'hidden' -- 공개 목록에서 제외(관리자 화면에는 남아 고쳐서 다시 공개할 수 있음)
where publication_status = 'published' -- 공개 중인 상품만
    and sales_url is null -- 판매 주소가 없는 상품만
    and image_path like '/images/goods/%' -- 임시 목업 이미지를 쓰는 상품만
    and description like '%임시%목업입니다.'; -- 임시 목업 설명이 그대로인 상품만(임의 가격·할인·배지가 공개 화면에 나오지 않게 함)
