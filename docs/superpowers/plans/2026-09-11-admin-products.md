---

# DEVFORGE 상품·재고 관리 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자가 상품과 수동 재고를 관리하고 방문자가 메인 화면과 굿즈 전용 페이지에서 정확한 판매 상태를 확인하는 기능 구축

**Architecture:** 기존 Supabase 관리자 인증과 서버 액션 패턴을 상품 영역에 재사용한다. 상품 상태 계산과 카드 DOM 생성은 독립 모듈로 분리하여 메인 화면과 `goods.html`이 동일한 표현을 사용하고, 재고 공급자 인터페이스는 향후 공식 판매처 API를 서버에서 연결할 수 있게 한다.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.7, Supabase Auth/Postgres/Storage, 정적 HTML/CSS/ES modules, Node test runner, built-in ImageGen

**Spec:** `docs/superpowers/specs/2026-09-11-admin-products-design.md`

---

## Global Constraints

- 모든 TypeScript, JavaScript, JSX, CSS, SQL 변경은 기존 프로젝트의 줄별 한글 주석 규칙 유지
- 함수와 제어문은 Allman 스타일 사용
- 가격·재고는 0 이상의 정수만 허용
- 판매 주소는 빈 값 또는 `https://` 주소만 허용
- 상품 이미지 형식은 JPG, PNG, WebP이며 최대 5MB
- 공개 사용자는 공개 상품만 조회
- 상품 변경과 비공개 상품 조회는 관리자 역할만 허용
- 외부 판매처 인증 정보는 서버에서만 사용
- Supabase 미설정 또는 조회 실패 시 기존 임시 상품 유지
- 실제 판매처 HTML 스크래핑 금지

---

### Task 1: 상품 자료형·입력 검증·판매 상태 계산

**Files:**

- Create: `lib/products/types.ts`
- Create: `lib/products/validation.ts`
- Create: `lib/products/status.ts`
- Test: `tests/admin-product-validation.test.mjs`
- Test: `tests/product-status.test.mjs`

**Interfaces:**

- Produces: `ProductEditorInitialValue`, `ProductActionState`, `ProductRecord`, `ProductSaleState`
- Produces: `validateProduct(values): ProductValidationResult`
- Produces: `validateProductImage(file): string | null`
- Produces: `getProductSaleState(product): ProductSaleState`

- [ ] **Step 1: 상품 입력 검증 실패 테스트 작성**

빈 상품명, 음수 가격, 소수 가격, 음수 재고, 현재 가격 이하의 기존 가격, `http://` 판매 주소가 각각 정확한 한글 오류를 반환하는 테스트를 작성한다.

```javascript
test("HTTP 판매 주소를 거부한다", () => // 판매 주소 검증
{ // 테스트 시작
    const result = validateProduct(validProduct({ salesUrl: "http://shop.example.com/item" })); // 검증 실행
    assert.equal(result.errors.salesUrl, "판매 주소는 https://로 시작해야 합니다."); // 오류 확인
}); // 테스트 끝
```

- [ ] **Step 2: 검증 테스트가 올바른 이유로 실패하는지 확인**

Run: `pnpm test -- tests/admin-product-validation.test.mjs`

Expected: `lib/products/validation.ts` 모듈이 없어 실패

- [ ] **Step 3: 최소 상품 자료형과 검증 구현**

상품명 1~120자, 분류 1~40자, 관련 게임명 0~80자, 설명 0~500자, 정수 가격과 재고, 배지 허용값, 공개 상태 허용값, 판매 주소를 검증한다. 이미지 검증은 기존 뉴스 이미지 규칙과 같은 MIME·5MB 제한을 사용한다.

- [ ] **Step 4: 판매 상태 계산 실패 테스트 작성**

판매 주소 없음은 `preparing`, 재고 0은 `sold_out`, 재고 1~5는 `low_stock`, 재고 6 이상은 `in_stock`, 외부 재고 오류는 `checking`이 되는 테스트를 작성한다.

```javascript
test("재고가 다섯 개 이하면 재고 부족으로 판정한다", () => // 재고 부족 판정
{ // 테스트 시작
    const result = getProductSaleState({ stockQuantity: 5, salesUrl: "https://shop.example.com/item", stockSyncStatus: "fresh" }); // 상태 계산
    assert.equal(result, "low_stock"); // 상태 확인
}); // 테스트 끝
```

- [ ] **Step 5: 상태 테스트 실패 확인 후 최소 계산 구현**

Run: `pnpm test -- tests/product-status.test.mjs`

Expected: `getProductSaleState`가 없어 실패한 뒤 구현 후 PASS

- [ ] **Step 6: 두 테스트 파일 통과 확인**

Run: `pnpm test -- tests/admin-product-validation.test.mjs tests/product-status.test.mjs`

Expected: 두 테스트 파일 PASS

- [ ] **Step 7: 변경 기록**

Commit: `feat: 상품 입력 검증과 판매 상태 계산 추가`

---

### Task 2: Supabase 상품 테이블·이미지 버킷·권한 정책

**Files:**

- Create: `supabase/migrations/202609110001_admin_products.sql`
- Test: `tests/admin-products-config.test.mjs`

**Interfaces:**

- Produces: `public.products` 테이블
- Produces: `product-images` 공개 Storage 버킷
- Reuses: `public.is_admin()` 함수

- [ ] **Step 1: 마이그레이션 구조 검사 테스트 작성**

테이블 필드, 다섯 가지 체크 제약, RLS 활성화, 공개 조회 정책, 관리자 CRUD 정책, 이미지 버킷과 Storage 정책이 SQL에 존재하는지 검사한다.

- [ ] **Step 2: 구조 검사 테스트 실패 확인**

Run: `pnpm test -- tests/admin-products-config.test.mjs`

Expected: 상품 마이그레이션 파일이 없어 실패

- [ ] **Step 3: 최소 마이그레이션 작성**

`products`에 설계 문서의 필드를 만들고 `publication_status = 'published'`인 행만 익명 조회하도록 한다. 로그인 관리자는 `public.is_admin()`으로 전체 조회와 쓰기를 허용한다. `product-images` 버킷은 공개 읽기와 관리자 업로드·수정·삭제만 허용한다.

- [ ] **Step 4: 수정 시각 트리거와 초기 임시 상품 8개 추가**

초기 상품은 판매 주소 없이 `manual` 재고와 `published` 상태로 삽입하여 모두 `판매 준비 중`으로 나타나게 한다. 이미지 경로는 `/images/goods/`의 정적 목업과 일치하는 파일명을 사용한다.

- [ ] **Step 5: 마이그레이션 구조 검사 통과 확인**

Run: `pnpm test -- tests/admin-products-config.test.mjs`

Expected: PASS

- [ ] **Step 6: 변경 기록**

Commit: `feat: 상품 데이터베이스와 보안 정책 추가`

---

### Task 3: 공개 상품 API와 재고 공급자 경계

**Files:**

- Create: `lib/products/stock-provider.ts`
- Create: `app/api/products/route.ts`
- Test: `tests/products-api.test.mjs`
- Modify: `README.md`

**Interfaces:**

- Produces: `StockProvider.getStock(externalProductId): Promise<StockSnapshot>`
- Produces: `ManualStockProvider`
- Produces: `GET /api/products`
- Consumes: `ProductRecord`, `getProductSaleState`, Supabase 설정 판정 함수

- [ ] **Step 1: 수동 재고 공급자 테스트 작성**

저장된 재고와 현재 시각을 `fresh` 상태로 반환하고 음수 재고를 0으로 보정하는 실제 동작 테스트를 작성한다.

- [ ] **Step 2: 공개 API 계약 테스트 작성**

소스 검사와 순수 변환 함수를 통해 공개 상품만 노출하고, 내부 이미지 경로를 공개 URL로 바꾸며, Supabase 미설정 응답이 `{ configured: false, products: [] }`인지 확인한다.

- [ ] **Step 3: 테스트 실패 확인**

Run: `pnpm test -- tests/products-api.test.mjs`

Expected: 상품 API와 재고 공급자 모듈이 없어 실패

- [ ] **Step 4: 최소 재고 공급자와 API 구현**

API는 `publication_status = 'published'` 조건과 `display_order` 오름차순을 서버 쿼리에 포함한다. 응답에는 관리자 전용 필드와 Storage 내부 경로를 제외하고 공개 이미지 URL, 계산된 판매 상태만 포함한다.

- [ ] **Step 5: API 테스트 통과 확인**

Run: `pnpm test -- tests/products-api.test.mjs`

Expected: PASS

- [ ] **Step 6: README에 향후 외부 API 연결 조건 기록**

판매처 이름, 공식 API 문서, 서버 인증 정보, 상품 식별자와 동기화 제한이 준비되어야 `external` 공급자를 추가할 수 있음을 기록한다.

- [ ] **Step 7: 변경 기록**

Commit: `feat: 공개 상품 API와 재고 공급자 추가`

---

### Task 4: 관리자 상품 등록·수정·삭제

**Files:**

- Create: `app/admin/products/actions.ts`
- Create: `app/admin/products/product-editor.tsx`
- Create: `app/admin/products/page.tsx`
- Create: `app/admin/products/new/page.tsx`
- Create: `app/admin/products/[id]/edit/page.tsx`
- Modify: `app/admin/news/admin-header.tsx`
- Modify: `app/admin/admin.css`
- Test: `tests/admin-products-actions.test.mjs`
- Test: `tests/admin-products-ui.test.mjs`

**Interfaces:**

- Produces: `createProduct`, `updateProduct`, `deleteProduct`
- Produces: `ProductEditor`
- Consumes: `requireAdmin`, 상품 검증 함수, `product-images` 버킷

- [ ] **Step 1: 관리자 보호와 CRUD 소스 계약 테스트 작성**

모든 서버 액션이 `requireAdmin`을 먼저 호출하고, 생성 실패 시 새 이미지를 제거하며, 수정 성공 후에만 기존 이미지를 제거하고, 삭제 성공 후에만 연결 이미지를 제거하는지 검사한다.

- [ ] **Step 2: 관리자 화면 계약 테스트 작성**

목록·등록·수정 경로, 필수 입력 이름, 공개 상태, 재고 수량, 판매 주소, 상태 미리보기, 삭제 확인, 관리자 메뉴의 상품 링크를 검사한다.

- [ ] **Step 3: 테스트 실패 확인**

Run: `pnpm test -- tests/admin-products-actions.test.mjs tests/admin-products-ui.test.mjs`

Expected: 관리자 상품 파일이 없어 실패

- [ ] **Step 4: 상품 이미지 저장 도우미와 서버 액션 구현**

뉴스 액션 패턴을 재사용하되 `product-images` 버킷을 사용한다. 등록·수정 실패 시 사용자가 입력한 값을 유지하고 내부 오류 세부 정보는 노출하지 않는다.

- [ ] **Step 5: 상품 편집기와 상태 미리보기 구현**

입력값이 바뀔 때 `판매 중`, `재고 부족`, `품절`, `판매 준비 중`, `비공개`를 텍스트와 색상으로 갱신한다. 이미지 입력에는 임시 목업을 실물 사진으로 교체해야 한다는 안내를 표시한다.

- [ ] **Step 6: 목록·등록·수정 화면과 관리자 메뉴 구현**

목록에는 작은 이미지, 상품명, 가격, 재고, 공개 상태, 계산된 판매 상태, 수정과 삭제 작업을 표시한다. 삭제 버튼은 브라우저 확인 후에만 서버 액션을 실행한다.

- [ ] **Step 7: 관리자 스타일 구현**

기존 뉴스 관리자 색상과 간격을 유지하며 상품 행, 상태 칩, 가격 입력, 재고 미리보기, 모바일 한 열 배치를 추가한다.

- [ ] **Step 8: 관리자 상품 테스트 통과 확인**

Run: `pnpm test -- tests/admin-products-actions.test.mjs tests/admin-products-ui.test.mjs`

Expected: PASS

- [ ] **Step 9: 변경 기록**

Commit: `feat: 관리자 상품 관리 화면 추가`

---

### Task 5: 공용 상품 카드 모듈과 굿즈 전용 페이지

**Files:**

- Create: `public/goods-card.mjs`
- Create: `public/goods.html`
- Create: `public/goods.css`
- Create: `public/goods.mjs`
- Modify: `public/main.html`
- Modify: `public/script.js`
- Test: `tests/goods-page.test.mjs`
- Test: `tests/site-integrity.test.mjs`

**Interfaces:**

- Produces: `shouldUseRemoteProducts(response): boolean`
- Produces: `createProductCard(product): HTMLElement`
- Produces: `replaceProducts(container, products, limit?): void`
- Consumes: `GET /api/products`

- [ ] **Step 1: 상품 카드 상태 테스트 작성**

판매 중은 외부 링크, 재고 부족은 수량 배지와 외부 링크, 품절·판매 준비 중·재고 확인 중은 비활성 버튼을 생성하는 DOM-independent 표시 모델 테스트를 작성한다.

- [ ] **Step 2: 전용 페이지와 연결 계약 테스트 작성**

공통 헤더, 굿즈 메뉴 현재 페이지 표시, 전체 상품 컨테이너, 로딩·빈 상태, 문의 대화상자, 관리자 로그인 링크를 검사한다. `main.html`의 헤더 굿즈 주소와 섹션 더보기 주소가 모두 `goods.html`인지 검사한다.

- [ ] **Step 3: 테스트 실패 확인**

Run: `pnpm test -- tests/goods-page.test.mjs tests/site-integrity.test.mjs`

Expected: 공용 모듈과 굿즈 페이지가 없어 실패

- [ ] **Step 4: 공용 상품 카드 모듈 구현**

문자열은 `textContent`로만 삽입하고 외부 판매 주소는 검증된 `https://` 값만 사용한다. 가격은 `Intl.NumberFormat("ko-KR")`로 표시한다.

- [ ] **Step 5: 굿즈 전용 HTML과 CSS 구현**

개발 뉴스와 같은 헤더 크기·메뉴 간격·문의 버튼을 적용한다. 상품 목록은 데스크톱 여러 열과 모바일 한 열로 반응하며 상태별 색상, 흐린 품절 이미지, 키보드 초점을 제공한다.

- [ ] **Step 6: 굿즈 페이지 데이터 로딩 구현**

API 성공 시 전체 공개 상품을 표시한다. 설정 누락이나 오류 시 정적 임시 상품을 유지하고 상태 문구만 갱신한다.

- [ ] **Step 7: 메인 화면 연결과 미리보기 구현**

헤더 굿즈 메뉴와 섹션 더보기를 `goods.html`로 변경한다. API 성공 시 공용 카드 모듈을 사용해 앞쪽 상품만 표시하고 실패하면 현재 카드가 남도록 한다.

- [ ] **Step 8: 페이지 테스트 통과 확인**

Run: `pnpm test -- tests/goods-page.test.mjs tests/site-integrity.test.mjs`

Expected: PASS

- [ ] **Step 9: 변경 기록**

Commit: `feat: 굿즈 전용 페이지와 상품 상태 UI 추가`

---

### Task 6: 임시 굿즈 목업 이미지 8종 생성과 연결

**Files:**

- Create: `public/images/goods/abyss-keyring.png`
- Create: `public/images/goods/neon-pulse-hoodie.png`
- Create: `public/images/goods/luna-jump-posters.png`
- Create: `public/images/goods/devforge-mug.png`
- Create: `public/images/goods/all-games-stickers.png`
- Create: `public/images/goods/echo-void-mousepad.png`
- Create: `public/images/goods/abyss-pin-set.png`
- Create: `public/images/goods/neon-pulse-ost.png`
- Modify: `public/main.html`
- Test: `tests/goods-assets.test.mjs`

**Interfaces:**

- Produces: 가로형 상품 카드에 사용할 8개 PNG 목업
- Consumes: 설계 문서의 상품명과 네온 시각 규칙

- [ ] **Step 1: 상품 이미지 존재와 참조 테스트 작성**

여덟 파일이 모두 존재하고 비어 있지 않으며 `main.html`, 초기 상품 데이터와 일치하는지 검사한다.

- [ ] **Step 2: 이미지 테스트 실패 확인**

Run: `pnpm test -- tests/goods-assets.test.mjs`

Expected: 이미지 파일이 없어 실패

- [ ] **Step 3: built-in ImageGen으로 이미지별 목업 생성**

각 호출은 `product-mockup` 용도로 지정한다. 공통 프롬프트는 어두운 스튜디오 배경, 청록·보라 네온 가장자리 조명, 중앙 제품, 전자상거래 카드용 여백, 글자·로고·워터마크 없음으로 고정하고 상품 종류만 변경한다.

- [ ] **Step 4: 생성 결과 육안 검사**

제품 종류, 잘린 부분, 읽을 수 없는 가짜 글자, 원치 않는 워터마크와 여덟 이미지 간 조명 일관성을 확인한다. 문제가 있는 이미지만 한 가지 수정 사항으로 다시 생성한다.

- [ ] **Step 5: 최종 이미지를 프로젝트 폴더로 복사하고 연결**

ImageGen 기본 저장 위치에서 선택한 파일을 `public/images/goods/`로 복사한다. 기존 이모지 영역을 실제 `<img>` 요소로 바꾸고 `임시 상품 목업`을 포함한 대체 텍스트를 지정한다.

- [ ] **Step 6: 이미지 테스트 통과 확인**

Run: `pnpm test -- tests/goods-assets.test.mjs`

Expected: PASS

- [ ] **Step 7: 변경 기록**

Commit: `feat: 임시 굿즈 목업 이미지 추가`

---

### Task 7: 문서화·전체 자동 검증·브라우저 확인

**Files:**

- Modify: `README.md`
- Modify: `.env.example` if present
- Modify: `WORK-HANDOFF.md`

**Interfaces:**

- Documents: Supabase 마이그레이션 적용, 상품 관리자 사용법, 수동 재고 관리, 실제 판매처 연결 전 준비 항목

- [ ] **Step 1: 설정 문서 갱신**

새 마이그레이션 실행 순서, `/admin/products`, `/admin/products/new`, 이미지 버킷, 수동 재고 기준과 임시 이미지 교체 필요성을 기록한다.

- [ ] **Step 2: 전체 테스트 실행**

Run: `pnpm test`

Expected: 모든 테스트 PASS, 경고와 실패 없음

- [ ] **Step 3: TypeScript 검사 실행**

Run: `pnpm exec tsc --noEmit`

Expected: 종료 코드 0

- [ ] **Step 4: 프로덕션 빌드 실행**

Run: `pnpm build`

Expected: 종료 코드 0, `/api/products`와 관리자 상품 경로 생성 확인

- [ ] **Step 5: 로컬 브라우저 시각 검증**

`main.html#goods`, `goods.html`, `/admin/login`, Supabase 연결 후 `/admin/products`를 데스크톱과 좁은 화면에서 확인한다. 다섯 가지 판매 상태, 더보기 이동, 공통 헤더, 이미지 비율과 키보드 초점을 확인한다.

- [ ] **Step 6: 작업 범위 검토**

`git diff --check`, `git status --short`, 변경 파일 목록을 확인하고 사용자 소유의 기존 미추적 파일이 포함되지 않았는지 검사한다.

- [ ] **Step 7: 최종 변경 기록**

Commit: `docs: 상품 관리 설정과 검증 방법 추가`
