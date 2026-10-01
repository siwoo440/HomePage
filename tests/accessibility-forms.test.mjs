import assert from "node:assert/strict"; // 엄격 비교 도구
import { readFile } from "node:fs/promises"; // 파일 읽기 도구
import test from "node:test"; // 테스트 실행 도구

const MEMBER_LOGIN_PATH = new URL("../app/login/member-login-form.tsx", import.meta.url); // 회원 로그인 경로
const ADMIN_LOGIN_PATH = new URL("../app/admin/login/login-form.tsx", import.meta.url); // 관리자 로그인 경로
const AGE_VERIFICATION_PATH = new URL("../app/age-verification/age-verification-form.tsx", import.meta.url); // 성인 확인 경로
const NEWS_EDITOR_PATH = new URL("../app/admin/news/news-editor.tsx", import.meta.url); // 뉴스 편집기 경로
const PRODUCT_EDITOR_PATH = new URL("../app/admin/products/product-editor.tsx", import.meta.url); // 상품 편집기 경로

async function readSource(path) // 소스 읽기
{ // 함수 시작
    return readFile(path, "utf8"); // 소스 반환
} // 함수 끝

test("회원 로그인은 자격 증명 오류와 제출 상태를 입력에 연결한다", async () => // 회원 로그인 계약
{ // 테스트 시작
    const source = await readSource(MEMBER_LOGIN_PATH); // 회원 로그인 읽기
    assert.match(source, /const \[credentialError, setCredentialError\] = useState\(false\)/); // 전용 오류 상태 확인
    assert.match(source, /<form[^>]*aria-busy=\{isSubmitting\}/); // 제출 상태 확인
    assert.match(source, /id="member-email"[^>]*aria-invalid=\{credentialError\}[^>]*aria-describedby=\{credentialError \? "member-login-error" : undefined\}/); // 이메일 오류 연결 확인
    assert.match(source, /id="member-password"[^>]*aria-invalid=\{credentialError\}[^>]*aria-describedby=\{credentialError \? "member-login-error" : undefined\}/); // 비밀번호 오류 연결 확인
    assert.match(source, /id="member-login-error"[^>]*role="alert"/); // 오류 문구 식별자 확인
    assert.match(source, /isCredentialInputError\(result\.error\)/); // 인증 오류 분류 확인
    assert.match(source, /if \(result\.error\)[\s\S]*?setCredentialError\(true\)/); // 인증 실패 상태 확인
    assert.match(source, /emailRef\.current\?\.focus\(\)/); // 이메일 포커스 확인
    assert.match(source, /useEffect\(\(\) =>[\s\S]*?credentialError && !isSubmitting[\s\S]*?emailRef\.current\?\.focus\(\)/); // 제출 종료 뒤 포커스 확인
    assert.match(source, /id="member-email"[^>]*ref=\{emailRef\}/); // 이메일 참조 연결 확인
    assert.match(source, /catch[\s\S]*?setCredentialError\(false\)/); // 통신 오류 분리 확인
    assert.match(source, /<SocialLoginButtons /); // 간편 로그인 분리 연결 확인
    const social = await readFile(new URL("../app/login/social-login-buttons.tsx", import.meta.url), "utf8"); // 간편 로그인 버튼 읽기
    assert.doesNotMatch(social, /setCredentialError/); // 간편 로그인 오류와 이메일 입력 오류 분리 확인
    assert.match(social, /role="alert"/); // 간편 로그인 실패 안내 확인
}); // 테스트 끝

test("관리자 로그인은 자격 증명 오류만 입력 오류로 표시한다", async () => // 관리자 로그인 계약
{ // 테스트 시작
    const source = await readSource(ADMIN_LOGIN_PATH); // 관리자 로그인 읽기
    assert.match(source, /const \[credentialError, setCredentialError\] = useState\(false\)/); // 전용 오류 상태 확인
    assert.match(source, /<form[^>]*aria-busy=\{isSubmitting\}/); // 제출 상태 확인
    assert.match(source, /id="admin-email"[^>]*aria-invalid=\{credentialError\}[^>]*aria-describedby=\{credentialError \? "admin-login-error" : undefined\}/); // 이메일 오류 연결 확인
    assert.match(source, /id="admin-password"[^>]*aria-invalid=\{credentialError\}[^>]*aria-describedby=\{credentialError \? "admin-login-error" : undefined\}/); // 비밀번호 오류 연결 확인
    assert.match(source, /id="admin-login-error"[^>]*role="alert"/); // 오류 문구 식별자 확인
    assert.match(source, /isCredentialInputError\(result\.error\)/); // 인증 오류 분류 확인
    assert.match(source, /if \(!configured\)[\s\S]*?setCredentialError\(false\)/); // 설정 오류 분리 확인
    assert.match(source, /if \(result\.error\)[\s\S]*?setCredentialError\(true\)/); // 인증 실패 상태 확인
    assert.match(source, /emailRef\.current\?\.focus\(\)/); // 이메일 포커스 확인
    assert.match(source, /useEffect\(\(\) =>[\s\S]*?credentialError && !isSubmitting[\s\S]*?emailRef\.current\?\.focus\(\)/); // 제출 종료 뒤 포커스 확인
    assert.match(source, /id="admin-email"[^>]*ref=\{emailRef\}/); // 이메일 참조 연결 확인
    assert.match(source, /catch[\s\S]*?setCredentialError\(false\)/); // 통신 오류 분리 확인
}); // 테스트 끝

test("성인 확인은 제출 전 오류를 구분하고 관련 입력에 포커스한다", async () => // 성인 확인 계약
{ // 테스트 시작
    const source = await readSource(AGE_VERIFICATION_PATH); // 성인 확인 읽기
    assert.match(source, /const \[inputErrorField, setInputErrorField\]/); // 필드 오류 상태 확인
    assert.match(source, /<form[^>]*onSubmit=\{handleSubmit\}[^>]*noValidate[^>]*aria-busy=\{submitting\}/); // 제출 상태 확인
    assert.match(source, /if \(!birthDate\)[\s\S]*?birthDateRef\.current\?\.focus\(\)/); // 날짜 사전 검증 확인
    assert.match(source, /if \(!agreed\)[\s\S]*?agreedRef\.current\?\.focus\(\)/); // 동의 사전 검증 확인
    assert.match(source, /id="birthDate"[^>]*aria-invalid=\{inputErrorField === "birthDate"\}/); // 날짜 오류 연결 확인
    assert.match(source, /name="agreed"[^>]*aria-invalid=\{inputErrorField === "agreed"\}/); // 동의 오류 연결 확인
    assert.match(source, /id="age-verification-error"[^>]*role="alert"/); // 오류 문구 식별자 확인
    assert.match(source, /catch[\s\S]*?setInputErrorField\(null\)/); // 통신 오류 분리 확인
}); // 테스트 끝

test("뉴스 편집기는 제출 전 검증과 첫 오류 안내를 제공한다", async () => // 뉴스 편집기 계약
{ // 테스트 시작
    const source = await readSource(NEWS_EDITOR_PATH); // 뉴스 편집기 읽기
    assert.match(source, /readNewsValues/); // 폼 값 변환 확인
    assert.match(source, /validateNewsPost/); // 도메인 검증 확인
    assert.match(source, /validateCoverImage/); // 이미지 검증 확인
    assert.match(source, /focusFirstInvalidField/); // 첫 오류 포커스 확인
    assert.match(source, /const serverErrors = isPending \? \{\} : state\.errors/); // 제출 중 이전 서버 오류 제외 확인
    assert.match(source, /<form[^>]*className="news-editor"[^>]*action=\{formAction\}[^>]*onSubmit=\{handleSubmit\}[^>]*noValidate[^>]*aria-busy=\{isPending\}/); // 제출 상태 확인
    assert.match(source, /name="title"[^>]*aria-invalid=\{Boolean\(errors\.title\)\}[^>]*aria-describedby=\{errors\.title/); // 제목 오류 연결 확인
    assert.match(source, /id=\{getFieldErrorId\(NEWS_FORM_ID, "title"\)\}/); // 제목 오류 식별자 확인
    assert.match(source, /role="alert"/); // 전체 오류 알림 확인
}); // 테스트 끝

test("상품 편집기는 제출 전 검증과 첫 오류 안내를 제공한다", async () => // 상품 편집기 계약
{ // 테스트 시작
    const source = await readSource(PRODUCT_EDITOR_PATH); // 상품 편집기 읽기
    assert.match(source, /readProductValues/); // 폼 값 변환 확인
    assert.match(source, /validateProduct/); // 도메인 검증 확인
    assert.match(source, /validateProductImage/); // 이미지 검증 확인
    assert.match(source, /focusFirstInvalidField/); // 첫 오류 포커스 확인
    assert.match(source, /const serverErrors = isPending \? \{\} : state\.errors/); // 제출 중 이전 서버 오류 제외 확인
    assert.match(source, /<form[^>]*className="product-editor"[^>]*action=\{formAction\}[^>]*onSubmit=\{handleSubmit\}[^>]*noValidate[^>]*aria-busy=\{isPending\}/); // 제출 상태 확인
    assert.match(source, /name="price"[^>]*aria-invalid=\{Boolean\(errors\.price\)\}[^>]*aria-describedby=\{errors\.price/); // 가격 오류 연결 확인
    assert.match(source, /id=\{getFieldErrorId\(PRODUCT_FORM_ID, "price"\)\}/); // 가격 오류 식별자 확인
    assert.match(source, /role="alert"/); // 전체 오류 알림 확인
}); // 테스트 끝
