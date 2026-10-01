import assert from "node:assert/strict"; // 엄격 비교 도구
import fs from "node:fs"; // 파일 읽기 도구
import test from "node:test"; // 테스트 실행 도구

const read = (path) => fs.readFileSync(path, "utf8"); // 원본 읽기 도구

test("회원가입은 필수 동의·닉네임과 함께 가입하고 인증 메일 또는 즉시 로그인으로 이어진다", () => // 가입 화면 계약
{ // 테스트 시작
    const page = read("app/signup/page.tsx"); // 가입 화면
    const form = read("app/signup/signup-form.tsx"); // 가입 폼
    assert.match(page, /fetchAuthSettings\(config\)/); // 켜진 로그인 방식 조회 확인
    assert.match(page, /현재 회원가입을 받지 않습니다/); // 가입 중지 안내 확인
    assert.match(page, /<SiteHeader \/>/); // 공통 헤더 확인
    assert.match(form, /validateSignup\(\{ email, password, passwordConfirm, nickname, \.\.\.consents \}\)/); // 가입 검증 확인
    assert.match(form, /preventInvalidFormSubmission\(event, SIGNUP_FIELD_ORDER, nextErrors\)/); // 첫 오류 포커스 확인
    assert.match(form, /auth\.signUp\(\{ email: result\.value\.email, password: result\.value\.password, options: \{ emailRedirectTo: redirect, data: \{ nickname: result\.value\.nickname, consent_agreed_at: new Date\(\)\.toISOString\(\) \} \} \}\)/); // 가입 요청 확인
    assert.match(form, /ensureMemberProfile\(supabase, signup\.data\.user\)/); // 즉시 로그인 프로필 생성 확인
    assert.match(form, /인증 메일을 보냈습니다/); // 인증 메일 안내 확인
    assert.match(form, /시연 모드: 입력 검증을 통과했습니다/); // 시연 안내 확인
    assert.match(form, /<ConsentFields /); // 필수 동의 확인
    assert.match(form, /<SocialLoginButtons mode=\{mode\} providers=\{settings\.providers\} returnTo=\{returnTo\} \/>/); // 간편 가입 확인
    for (const field of ["email", "password", "passwordConfirm", "nickname"]) // 입력 이름 반복
    { // 반복 시작
        assert.match(form, new RegExp(`name="${field}"`), field); // 포커스 대상 이름 확인
    } // 반복 끝
}); // 테스트 끝

test("필수 동의는 전체 동의·개별 오류·약관 전문 새 창 링크를 제공한다", () => // 동의 입력 계약
{ // 테스트 시작
    const consents = read("app/login/consent-fields.tsx"); // 동의 입력
    assert.match(consents, /\[필수\] 만 14세 이상입니다/); // 연령 확인 문구 확인
    assert.match(consents, /href: "\/terms\.html"/); // 이용약관 연결 확인
    assert.match(consents, /href: "\/privacy\.html"/); // 개인정보 연결 확인
    assert.match(consents, /target="_blank" rel="noopener noreferrer"/); // 새 창 보안 속성 확인
    assert.match(consents, /필수 항목에 모두 동의합니다/); // 전체 동의 확인
    assert.match(consents, /role="alert"/); // 항목 오류 알림 확인
    const nickname = read("app/login/member-nickname-form.tsx"); // 닉네임 입력
    assert.match(nickname, /requireConsent \? validateConsents\(consents\) : \{\}/); // 간편 가입 첫 동의 검증 확인
    assert.match(nickname, /saveMemberNickname\(createBrowserSupabaseClient\(\), userId, checked\.value, undefined, consentAt\)/); // 동의 시각 저장 확인
    assert.match(read("app/login/member-access.tsx"), /requireConsent=\{!state\.nickname\}/); // 첫 설정 동의 요구 확인
}); // 테스트 끝

test("로그인 화면은 켜진 간편 로그인·비밀번호 찾기·회원가입으로 이어진다", () => // 로그인 연결 계약
{ // 테스트 시작
    const form = read("app/login/member-login-form.tsx"); // 로그인 폼
    const page = read("app/login/page.tsx"); // 로그인 화면
    assert.match(page, /fetchAuthSettings\(config\)/); // 설정 조회 확인
    assert.match(page, /auth === "failed"/); // 인증 실패 안내 확인
    assert.match(form, /href=\{`\/login\/forgot\$\{query\}`\}/); // 비밀번호 찾기 연결 확인
    assert.match(form, /href=\{`\/signup\$\{query\}`\}/); // 회원가입 연결 확인
    assert.match(form, /<SocialLoginButtons mode=\{mode\} providers=\{\[\]\} returnTo=\{returnTo\} \/>/); // 시연 간편 로그인 미리보기 확인
    const social = read("app/login/social-login-buttons.tsx"); // 간편 로그인 버튼
    assert.match(social, /mode === "demo" \? SOCIAL_PROVIDERS : SOCIAL_PROVIDERS\.filter\(\(provider\) => providers\.includes\(provider\.id\)\)/); // 켜진 로그인만 표시 확인
    assert.match(social, /disabled=\{mode === "demo" \|\| pendingId !== null\}/); // 시연 비활성 확인
    assert.match(social, /\/auth\/callback\?returnTo=/); // 인증 복귀 주소 확인
}); // 테스트 끝

test("비밀번호 찾기·재설정은 계정 존재를 드러내지 않고 링크 세션에서만 바꾼다", () => // 비밀번호 재설정 계약
{ // 테스트 시작
    const forgot = read("app/login/forgot/forgot-password-form.tsx"); // 찾기 폼
    const reset = read("app/login/reset/reset-password-form.tsx"); // 재설정 폼
    assert.match(forgot, /resetPasswordForEmail\(email\.trim\(\), \{ redirectTo \}\)/); // 재설정 메일 요청 확인
    assert.match(forgot, /encodeURIComponent\("\/login\/reset"\)/); // 재설정 화면 복귀 확인
    assert.match(forgot, /가입된 계정이 있으면 비밀번호 재설정 메일을 보냈습니다/); // 공통 안내 확인
    assert.match(reset, /auth\.getUser\(\)/); // 링크 세션 확인
    assert.match(reset, /링크가 만료되었거나 올바르지 않습니다/); // 만료 안내 확인
    assert.match(reset, /auth\.updateUser\(\{ password \}\)/); // 비밀번호 변경 확인
    assert.match(reset, /validatePasswordPair\(password, passwordConfirm\)/); // 비밀번호 규칙 확인
}); // 테스트 끝

test("인증 복귀는 실패 시 안내와 함께 로그인 화면으로 보내고 이메일 링크 확인을 지원한다", () => // 인증 경로 계약
{ // 테스트 시작
    const callback = read("app/auth/callback/route.ts"); // 인증 복귀
    const confirm = read("app/auth/confirm/route.ts"); // 이메일 링크 확인
    assert.match(callback, /target\.searchParams\.set\("auth", "failed"\)/); // 실패 안내 확인
    assert.match(callback, /exchangeCodeForSession\(code\)/); // 코드 교환 확인
    assert.match(confirm, /verifyOtp\(\{ type, token_hash: tokenHash \}\)/); // 링크 확인 요청 확인
    assert.match(confirm, /sanitizeMemberReturnTo/); // 안전한 이동 주소 확인
}); // 테스트 끝

test("관리자 댓글 관리는 관리자 확인 뒤 목록·처리·기록을 연결하고 데모로도 볼 수 있다", () => // 관리 화면 계약
{ // 테스트 시작
    const page = read("app/admin/comments/page.tsx"); // 관리 화면
    const actions = read("app/admin/comments/actions.ts"); // 관리 처리
    const board = read("app/admin/comments/moderation-board.tsx"); // 관리 목록
    assert.match(page, /await requireAdmin\("\/admin\/comments"\)/); // 화면 관리자 확인
    assert.match(page, /<ModerationBoard key=\{`\$\{filter\}-\$\{page\}`\} initialItems=\{result\.items\} filter=\{filter\} onApply=\{moderateComment\} \/>/); // 처리 연결 확인
    assert.match(page, /params=\{\{ filter \}\}/); // 목록 종류 유지 확인
    assert.match(actions, /^"use server";/); // 서버 액션 확인
    assert.match(actions, /const admin = await requireAdmin\("\/admin\/comments"\)/); // 처리 관리자 확인
    assert.match(actions, /parseModerationInput\(input\)/); // 처리 입력 검증 확인
    assert.match(actions, /\.apply\(parsed, admin\.id\)/); // 관리자 기록 연결 확인
    assert.match(board, /window\.confirm\("이 댓글을 삭제할까요\?/); // 삭제 확인 창 확인
    assert.match(board, /getAvailableActions\(item\)/); // 상태별 처리 확인
    assert.match(read("app/admin/news/admin-header.tsx"), /href="\/admin\/comments">댓글 관리</); // 관리자 메뉴 확인
    assert.match(read("app/admin/demo/page.tsx"), /form === "comments" \? <DemoModeration \/>/); // 데모 화면 확인
    assert.match(read("app/admin/demo/demo-moderation.tsx"), /createLocalModerationService\(createDemoModerationItems\(\)\)/); // 메모리 처리 확인
}); // 테스트 끝
