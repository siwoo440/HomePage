import assert from "node:assert/strict"; // 엄격 비교 도구
import fs from "node:fs"; // 파일 읽기 도구
import test from "node:test"; // 테스트 실행 도구
import { sanitizeMemberReturnTo } from "../lib/member/config.ts"; // 복귀 주소 정리
import { ConnectionError, getLoginLabel, listLinkableProviders, readAccountSummary, readLinkedLogins, removeLoginLink, startLoginLink, toConnectionError } from "../lib/member/connections.ts"; // 로그인 연동 도구
import { buildConsentReturnTo, ConsentError, decideConsent, describeScopes, loadConsentRequest, readHost, sanitizeAuthorizationId, toConsentError } from "../lib/member/oauth-consent.ts"; // 로그인 허용 도구
import { buildConnectedServices, disconnectService, HOMEPAGE_SERVICE_ID, loadConnectedServices, readServiceSummary, ServiceError } from "../lib/member/services.ts"; // 서비스 연결 도구
import { CRAWL_BLOCKED_PATHS } from "../lib/site-url.ts"; // 검색 수집 제외 경로
import { VERSE_SERVICES } from "../scripts/verse-services.mjs"; // Verse 계열 서비스 목록

const read = (file) => fs.readFileSync(file, "utf8"); // 원본 읽기 도구
const EMAIL_IDENTITY = { identity_id: "i-email", user_id: "u1", provider: "email", identity_data: { email: "me@example.com" }, created_at: "2026-10-01T00:00:00Z", last_sign_in_at: "2026-10-05T00:00:00Z" }; // 이메일 로그인 연결
const GOOGLE_IDENTITY = { identity_id: "i-google", user_id: "u1", provider: "google", identity_data: { email: "me@gmail.com" }, created_at: "2026-10-03T00:00:00Z" }; // Google 로그인 연결
const KAKAO_IDENTITY = { identity_id: "i-kakao", user_id: "u1", provider: "kakao", identity_data: {}, created_at: "2026-10-02T00:00:00Z" }; // 카카오 로그인 연결
const MATE = VERSE_SERVICES.find((service) => service.id === "mate-verse"); // 주소가 있는 서비스
const ATELIER = VERSE_SERVICES.find((service) => service.id === "atelier-verse"); // 주소가 없는 서비스

function createAuthClient({ identities = [EMAIL_IDENTITY, GOOGLE_IDENTITY], linkError = null, unlinkError = null } = {}) // 시험 인증 연결
{ // 함수 시작
    const calls = []; // 호출 기록
    let current = identities; // 현재 연결 목록
    const auth = // 인증 도구 대체
    { // 도구 시작
        linkIdentity: async (credentials) => { calls.push(["link", credentials]); return { data: { provider: credentials.provider, url: "https://example.com" }, error: linkError }; }, // 연결 요청
        getUserIdentities: async () => ({ data: { identities: current }, error: null }), // 연결 목록 조회
        unlinkIdentity: async (identity) => { calls.push(["unlink", identity.identity_id]); if (!unlinkError) { current = current.filter((item) => item !== identity); } return { data: {}, error: unlinkError }; }, // 연결 해제
        getUser: async () => ({ data: { user: { id: "u1", email: "me@example.com", identities: current } }, error: null }), // 회원 조회
    }; // 도구 끝
    return { client: { auth }, calls }; // 시험 도구 반환
} // 함수 끝

function createServiceClient({ registrations = [], links = [], grants = [], failTables = false, grantsError = null, revokeError = null } = {}) // 시험 서비스 연결
{ // 함수 시작
    const calls = []; // 호출 기록
    const from = (table) => // 테이블 요청
    { // 요청 시작
        const chain = { filters: [] }; // 조건 기록
        const rows = table === "account_services" ? registrations : links; // 표별 응답 자료
        const builder = // 연결 요청 도구
        { // 도구 시작
            select: () => builder, // 열 선택
            delete: () => { chain.delete = true; return builder; }, // 삭제 요청
            eq: (column, value) => { chain.filters.push([column, value]); return builder; }, // 같음 조건
            then: (resolve) => { calls.push([chain.delete ? "delete" : "select", table, chain.filters]); return Promise.resolve(failTables ? { data: null, error: { message: "relation does not exist" } } : { data: rows, error: null }).then(resolve); }, // 요청 실행
        }; // 도구 끝
        return builder; // 도구 반환
    }; // 요청 끝
    const oauth = // OAuth 도구 대체
    { // 도구 시작
        listGrants: async () => ({ data: grantsError ? null : grants, error: grantsError }), // 허용 기록 조회
        revokeGrant: async (options) => { calls.push(["revoke", options.clientId]); return { data: {}, error: revokeError }; }, // 허용 취소
    }; // 도구 끝
    return { client: { from, auth: { oauth } }, calls }; // 시험 도구 반환
} // 함수 끝

test("계정 기본 정보는 이메일·가입일·마지막 로그인·이메일 인증 여부를 읽는다", () => // 기본 정보 검사
{ // 테스트 시작
    assert.deepEqual(readAccountSummary({ id: "u1", email: " me@example.com ", created_at: "2026-10-01T00:00:00Z", last_sign_in_at: "2026-10-05T00:00:00Z", email_confirmed_at: "2026-10-01T00:10:00Z" }), { email: "me@example.com", joinedAt: "2026-10-01T00:00:00Z", lastSignInAt: "2026-10-05T00:00:00Z", emailVerified: true }); // 정상 정보
    assert.deepEqual(readAccountSummary({ id: "u1", created_at: "나중에" }), { email: null, joinedAt: null, lastSignInAt: null, emailVerified: false }); // 빠졌거나 잘못된 값 처리
}); // 테스트 끝

test("연결된 로그인은 이메일을 먼저 보이고 간편 로그인은 다른 방법이 남을 때만 해제할 수 있다", () => // 로그인 목록 검사
{ // 테스트 시작
    const logins = readLinkedLogins({ id: "u1", identities: [GOOGLE_IDENTITY, KAKAO_IDENTITY, EMAIL_IDENTITY] }); // 세 가지 로그인
    assert.deepEqual(logins.map((login) => [login.provider, login.label, login.removable]), [["email", "이메일·비밀번호", false], ["kakao", "카카오", true], ["google", "Google", true]]); // 순서·이름·해제 가능 여부
    assert.equal(logins[2].account, "me@gmail.com"); // 로그인 서비스 쪽 계정
    assert.equal(logins[1].account, null); // 계정 정보 없음 처리
    assert.equal(readLinkedLogins({ id: "u1", identities: [GOOGLE_IDENTITY] })[0].removable, false); // 하나뿐인 로그인은 해제 불가
    assert.deepEqual(readLinkedLogins({ id: "u1", identities: null }), []); // 연결 없음 처리
    assert.equal(getLoginLabel("custom:other"), "custom:other"); // 모르는 서비스는 이름 그대로
    assert.deepEqual(listLinkableProviders(["google", "kakao", "discord"], logins).map((provider) => provider.id), ["discord"]); // 켜져 있고 연결하지 않은 것만
}); // 테스트 끝

test("간편 로그인 연결은 내 정보로 돌아오는 주소로 요청하고 서버 오류를 안내 문구로 바꾼다", async () => // 연결 검사
{ // 테스트 시작
    const { client, calls } = createAuthClient(); // 시험 연결
    await startLoginLink(client, "kakao", "https://example.com/auth/callback?returnTo=%2Faccount"); // 연결 요청
    assert.deepEqual(calls[0], ["link", { provider: "kakao", options: { redirectTo: "https://example.com/auth/callback?returnTo=%2Faccount" } }]); // 요청 내용 확인
    await assert.rejects(startLoginLink(createAuthClient({ linkError: { code: "manual_linking_disabled", message: "Manual linking is disabled" } }).client, "kakao", "x"), (error) => error instanceof ConnectionError && error.code === "LINKING_DISABLED"); // 연결 기능 꺼짐 안내
    assert.equal(toConnectionError({ code: "identity_already_exists", message: "Identity is already linked to another user" }).code, "ALREADY_LINKED"); // 다른 계정에 연결됨
    assert.equal(toConnectionError(new Error("boom")).code, "UNKNOWN"); // 기타 오류
}); // 테스트 끝

test("로그인 연결 해제는 고른 연결만 지우고 마지막 로그인 방법은 지키며 바뀐 회원 정보를 돌려준다", async () => // 해제 검사
{ // 테스트 시작
    const { client, calls } = createAuthClient(); // 시험 연결
    const user = await removeLoginLink(client, "i-google"); // Google 연결 해제
    assert.deepEqual(calls, [["unlink", "i-google"]]); // 해제 요청 확인
    assert.deepEqual(user.identities.map((identity) => identity.provider), ["email"]); // 남은 로그인 확인
    await assert.rejects(removeLoginLink(createAuthClient().client, "i-email"), (error) => error.code === "LAST_LOGIN"); // 이메일 로그인은 해제하지 않음
    await assert.rejects(removeLoginLink(createAuthClient({ identities: [GOOGLE_IDENTITY] }).client, "i-google"), (error) => error.code === "LAST_LOGIN"); // 하나뿐인 로그인 보호
    await assert.rejects(removeLoginLink(createAuthClient().client, "i-none"), (error) => error.code === "NOT_FOUND"); // 없는 연결 안내
}); // 테스트 끝

test("서비스 요약은 정해 둔 항목만 읽고 길이를 줄인다", () => // 요약 검사
{ // 테스트 시작
    assert.deepEqual(readServiceSummary({ nickname: " 단풍 ", plan: "무료", adult_verified: false, secret: "x", html: "<b>" }), [{ label: "닉네임", value: "단풍" }, { label: "이용 상품", value: "무료" }, { label: "성인 확인", value: "하지 않음" }]); // 정해 둔 항목만
    assert.equal(readServiceSummary({ nickname: "가".repeat(80) })[0].value.length, 40); // 길이 제한
    assert.deepEqual(readServiceSummary({ nickname: 3, adult_verified: "yes" }), []); // 형식이 다른 값 제외
    assert.deepEqual(readServiceSummary(null), []); // 요약 없음 처리
}); // 테스트 끝

test("연결된 서비스 목록은 홈페이지를 먼저 보이고 서비스마다 준비 중·연결 가능·연결됨을 구분한다", () => // 서비스 상태 검사
{ // 테스트 시작
    const plain = buildConnectedServices({ joinedAt: "2026-10-01T00:00:00Z", nickname: "단풍" }); // 통합 계정 설정 전
    assert.deepEqual(plain.map((service) => [service.id, service.state]), [[HOMEPAGE_SERVICE_ID, "current"], ...VERSE_SERVICES.map((service) => [service.id, "preparing"])]); // 설정 전에는 모두 준비 중
    assert.deepEqual(plain[0].summary, [{ label: "닉네임", value: "단풍" }]); // 홈페이지 요약
    assert.equal(plain[0].revocable, false); // 홈페이지는 해제 대상 아님
    const registrations = [{ id: MATE.id, oauthClientId: "client-mate" }, { id: ATELIER.id, oauthClientId: "client-atelier" }]; // 클라이언트 등록
    const ready = buildConnectedServices({ registrations }); // 등록만 한 상태
    assert.equal(ready.find((service) => service.id === MATE.id).state, "available"); // 주소가 있으면 연결 가능
    assert.equal(ready.find((service) => service.id === ATELIER.id).state, "preparing"); // 주소가 없으면 준비 중
    const used = buildConnectedServices({ registrations, grants: [{ clientId: "client-mate", clientName: "Mate", grantedAt: "2026-10-06T00:00:00Z" }, { clientId: "client-etc", clientName: "다른 앱", grantedAt: null }], links: [{ serviceId: MATE.id, summary: { nickname: "모과" }, firstUsedAt: "2026-10-06T00:00:00Z", lastUsedAt: "2026-10-07T00:00:00Z" }] }); // 이용한 상태
    const mate = used.find((service) => service.id === MATE.id); // 이용한 서비스
    assert.deepEqual([mate.state, mate.grantedAt, mate.lastUsedAt, mate.revocable, mate.summary[0].value], ["connected", "2026-10-06T00:00:00Z", "2026-10-07T00:00:00Z", true, "모과"]); // 연결 정보 확인
    assert.deepEqual(used.at(-1), { id: "client:client-etc", name: "다른 앱", state: "connected", url: null, clientId: "client-etc", grantedAt: null, firstUsedAt: null, lastUsedAt: null, summary: [], revocable: true }); // 목록에 없는 앱도 표시
}); // 테스트 끝

test("서비스 조회가 실패하면 준비 전 상태로 목록만 보이고 연결 해제는 허용 취소와 기록 삭제를 함께 한다", async () => // 조회·해제 검사
{ // 테스트 시작
    const broken = await loadConnectedServices(createServiceClient({ failTables: true, grantsError: { message: "oauth server disabled" } }).client, "u1", { nickname: "단풍" }); // 설정 전 프로젝트
    assert.equal(broken.ready, false); // 준비 전 표시
    assert.equal(broken.services.length, 1 + VERSE_SERVICES.length); // 목록은 그대로 표시
    const { client, calls } = createServiceClient({ registrations: [{ id: MATE.id, oauth_client_id: "client-mate" }], links: [{ service_id: MATE.id, summary: {}, first_used_at: "2026-10-06T00:00:00Z", last_used_at: "2026-10-07T00:00:00Z" }], grants: [{ client: { id: "client-mate", name: "Mate" }, scopes: ["email"], granted_at: "2026-10-06T00:00:00Z" }] }); // 연결된 프로젝트
    const loaded = await loadConnectedServices(client, "u1"); // 정상 조회
    assert.equal(loaded.ready, true); // 준비 완료 표시
    const mate = loaded.services.find((service) => service.id === MATE.id); // 연결된 서비스
    assert.equal(mate.state, "connected"); // 연결됨 확인
    assert.deepEqual(calls.find((call) => call[1] === "member_service_links")[2], [["member_id", "u1"]]); // 본인 기록만 조회
    calls.length = 0; // 호출 기록 비움
    await disconnectService(client, "u1", mate); // 연결 해제
    assert.deepEqual(calls, [["revoke", "client-mate"], ["delete", "member_service_links", [["member_id", "u1"], ["service_id", MATE.id]]]]); // 허용 취소 뒤 기록 삭제
    await assert.rejects(disconnectService(client, "u1", loaded.services[0]), (error) => error instanceof ServiceError); // 홈페이지는 해제 불가
    await assert.rejects(disconnectService(createServiceClient({ revokeError: { message: "server error" } }).client, "u1", mate), (error) => error.code === "UNKNOWN"); // 취소 실패 안내
}); // 테스트 끝

test("로그인 허용 요청은 번호 형식을 확인하고 로그인 뒤 같은 화면으로 돌아온다", () => // 요청 번호 검사
{ // 테스트 시작
    assert.equal(sanitizeAuthorizationId(" abc_DEF-123456 "), "abc_DEF-123456"); // 정상 번호
    assert.equal(sanitizeAuthorizationId("short"), null); // 너무 짧은 번호
    assert.equal(sanitizeAuthorizationId("abc/../def12345"), null); // 주소 조작 문자 거부
    assert.equal(sanitizeAuthorizationId(undefined), null); // 번호 없음 처리
    const returnTo = buildConsentReturnTo("abc_DEF-123456"); // 돌아올 주소
    assert.equal(returnTo, "/oauth/consent?authorization_id=abc_DEF-123456"); // 요청 번호 유지
    assert.equal(sanitizeMemberReturnTo(returnTo), returnTo); // 로그인 화면이 받아들이는 주소
    assert.deepEqual(describeScopes("openid email  email custom"), [{ id: "openid", label: "회원 확인용 식별 번호" }, { id: "email", label: "이메일 주소" }, { id: "custom", label: "custom" }]); // 중복 없이 설명
    assert.equal(readHost("https://mate.example.com/auth/callback"), "mate.example.com"); // 사이트 이름 읽기
    assert.equal(readHost("javascript:alert(1)"), null); // 웹 주소가 아니면 거부
}); // 테스트 끝

test("로그인 허용은 서비스 이름과 받는 정보를 보여 주고 결정한 뒤 서비스 주소를 돌려준다", async () => // 허용 처리 검사
{ // 테스트 시작
    const calls = []; // 호출 기록
    const details = { authorization_id: "auth-12345678", redirect_uri: "https://mate.example.com/auth/callback", client: { id: "c1", name: " Mate | Verse " }, user: { id: "u1", email: "me@example.com" }, scope: "openid email" }; // 허용 요청 정보
    const oauth = // OAuth 도구 대체
    { // 도구 시작
        getAuthorizationDetails: async (id) => { calls.push(["details", id]); return { data: details, error: null }; }, // 요청 조회
        approveAuthorization: async (id, options) => { calls.push(["approve", id, options]); return { data: { redirect_url: "https://mate.example.com/auth/callback?code=1" }, error: null }; }, // 허용
        denyAuthorization: async (id, options) => { calls.push(["deny", id, options]); return { data: { redirect_url: "https://mate.example.com/auth/callback?error=access_denied" }, error: null }; }, // 거부
    }; // 도구 끝
    const client = { auth: { oauth } }; // 시험 연결
    assert.deepEqual(await loadConsentRequest(client, "auth-12345678"), { status: "consent", authorizationId: "auth-12345678", clientName: "Mate | Verse", redirectHost: "mate.example.com", email: "me@example.com", scopes: [{ id: "openid", label: "회원 확인용 식별 번호" }, { id: "email", label: "이메일 주소" }] }); // 허용 확인 정보
    assert.equal(await decideConsent(client, "auth-12345678", true), "https://mate.example.com/auth/callback?code=1"); // 허용 뒤 주소
    assert.equal(await decideConsent(client, "auth-12345678", false), "https://mate.example.com/auth/callback?error=access_denied"); // 거부 뒤 주소
    assert.deepEqual(calls.slice(1), [["approve", "auth-12345678", { skipBrowserRedirect: true }], ["deny", "auth-12345678", { skipBrowserRedirect: true }]]); // 화면이 직접 이동하도록 요청
    oauth.getAuthorizationDetails = async () => ({ data: { redirect_url: "https://mate.example.com/auth/callback?code=2" }, error: null }); // 이미 허용한 서비스
    assert.deepEqual(await loadConsentRequest(client, "auth-12345678"), { status: "redirect", url: "https://mate.example.com/auth/callback?code=2" }); // 바로 이동
    oauth.getAuthorizationDetails = async () => ({ data: null, error: { status: 404, message: "authorization not found" } }); // 만료된 요청
    await assert.rejects(loadConsentRequest(client, "auth-12345678"), (error) => error instanceof ConsentError && error.code === "INVALID_REQUEST"); // 다시 시도 안내
    oauth.approveAuthorization = async () => ({ data: { redirect_url: "javascript:alert(1)" }, error: null }); // 잘못된 이동 주소
    await assert.rejects(decideConsent(client, "auth-12345678", true), ConsentError); // 웹 주소가 아니면 이동하지 않음
    assert.equal(toConsentError({ message: "OAuth server is disabled" }).code, "UNAVAILABLE"); // 기능 꺼짐 안내
}); // 테스트 끝

test("내 정보 화면은 계정 정보·로그인 연동·연결된 서비스를 보여 주고 허용 화면은 검색에서 빠진다", () => // 화면 연결 검사
{ // 테스트 시작
    const panel = read("app/account/account-panel.tsx"); // 내 정보 영역
    const connections = read("app/account/account-connections.tsx"); // 계정 연결 영역
    const consent = read("app/oauth/consent/consent-panel.tsx"); // 로그인 허용 영역
    assert.match(panel, /<AccountConnections mode=\{mode\} user=\{state\.user\} nickname=\{state\.nickname\} providers=\{providers\}/); // 계정 연결 영역 포함
    assert.match(read("app/account/page.tsx"), /<AccountPanel mode=\{mode\} providers=\{settings\.providers\} \/>/); // 켜진 간편 로그인 전달
    for (const title of ["계정 기본 정보", "로그인 연동", "연결된 서비스"]) // 새 영역 제목 반복
    { // 반복 시작
        assert.ok(connections.includes(`>${title}</h2>`), title); // 영역 제목 확인
    } // 반복 끝
    assert.match(connections, /\/auth\/callback\?returnTo=\$\{encodeURIComponent\("\/account"\)\}/); // 연결 뒤 내 정보로 복귀
    assert.match(connections, /<span translate="no">\{service\.name\}<\/span>/); // 서비스 이름은 번역하지 않음
    assert.match(connections, /service\.revocable && mode === "supabase"/); // 시연 모드에서는 해제 버튼 없음
    assert.match(consent, /href=\{`\/login\?returnTo=\$\{encodeURIComponent\(returnTo\)\}`\}/); // 로그인 뒤 허용 화면으로 복귀
    assert.match(consent, /fetchMemberProfile\(supabase, user\.id\)/); // 가입을 마친 회원만 허용
    assert.match(consent, /<span translate="no">\{state\.request\.clientName\}<\/span>/); // 요청한 서비스 이름 표시
    assert.match(read("app/oauth/consent/page.tsx"), /robots: \{ index: false \}/); // 검색 제외 확인
    assert.ok(CRAWL_BLOCKED_PATHS.includes("/oauth/")); // 검색 수집 제외 확인
}); // 테스트 끝
