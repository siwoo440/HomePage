import type { SupabaseClient } from "@supabase/supabase-js"; // Supabase 클라이언트 형식

export const NICKNAME_MAX_LENGTH = 20; // 닉네임 최대 글자 수

export interface MemberProfile // 회원 공개 프로필
{ // 형식 시작
    id: string; // 회원 식별자
    nickname: string; // 공개 닉네임
} // 형식 끝

type NicknameResult = { ok: true; value: string } | { ok: false; message: string }; // 닉네임 검증 결과

export class MemberProfileError extends Error // 회원 프로필 오류
{ // 클래스 시작
    constructor(message: string) // 오류 생성자
    { // 생성자 시작
        super(message); // 기본 오류 생성
        this.name = "MemberProfileError"; // 오류 이름 설정
    } // 생성자 끝
} // 클래스 끝

export function validateNickname(value: string): NicknameResult // 닉네임 검증
{ // 함수 시작
    const nickname = value.trim().replace(/\s+/g, " "); // 공백 정리

    if (nickname.length < 1) // 빈 닉네임 확인
    { // 조건 시작
        return { ok: false, message: "닉네임을 입력해 주세요." }; // 빈 값 오류
    } // 조건 끝

    if ([...nickname].length > NICKNAME_MAX_LENGTH) // 글자 수 확인
    { // 조건 시작
        return { ok: false, message: "닉네임은 20자 이하로 입력해 주세요." }; // 길이 오류
    } // 조건 끝

    if (/[\u0000-\u001f\u007f]/.test(nickname)) // 제어 문자 확인
    { // 조건 시작
        return { ok: false, message: "닉네임에 사용할 수 없는 문자가 있습니다." }; // 문자 오류
    } // 조건 끝

    return { ok: true, value: nickname }; // 정상 닉네임 반환
} // 함수 끝

export async function fetchMemberProfile(client: SupabaseClient, userId: string): Promise<MemberProfile | null> // 본인 프로필 조회
{ // 함수 시작
    const result = await client.from("member_profiles").select("id, nickname").eq("id", userId).maybeSingle(); // 프로필 조회

    if (result.error) // 조회 오류 확인
    { // 조건 시작
        throw new MemberProfileError("회원 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."); // 조회 오류 발생
    } // 조건 끝

    const row = result.data as MemberProfile | null; // 프로필 행
    return row ? { id: row.id, nickname: row.nickname } : null; // 프로필 반환
} // 함수 끝

export async function saveMemberNickname(client: SupabaseClient, userId: string, nickname: string, now: () => string = () => new Date().toISOString(), consentAt?: string): Promise<MemberProfile> // 본인 닉네임 저장
{ // 함수 시작
    const checked = validateNickname(nickname); // 닉네임 검증

    if (!checked.ok) // 검증 실패 확인
    { // 조건 시작
        throw new MemberProfileError(checked.message); // 검증 오류 발생
    } // 조건 끝

    const consent = consentAt ? { terms_agreed_at: consentAt, privacy_agreed_at: consentAt, age_confirmed_at: consentAt } : {}; // 첫 가입 동의 기록
    const result = await client.from("member_profiles").upsert({ id: userId, nickname: checked.value, updated_at: now(), ...consent }, { onConflict: "id" }).select("id, nickname").single(); // 프로필 저장

    if (result.error || !result.data) // 저장 실패 확인
    { // 조건 시작
        const expired = result.error?.code === "42501" || (result.error?.code ?? "").startsWith("PGRST30"); // 로그인 만료 여부
        throw new MemberProfileError(expired ? "로그인이 만료되었습니다. 다시 로그인해 주세요." : "닉네임을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요."); // 저장 오류 발생
    } // 조건 끝

    const row = result.data as MemberProfile; // 저장 행
    return { id: row.id, nickname: row.nickname }; // 저장 프로필 반환
} // 함수 끝

export interface ProfileUser // 프로필 확인 회원
{ // 형식 시작
    id: string; // 회원 식별자
    user_metadata?: Record<string, unknown> | null; // 가입 입력 정보
} // 형식 끝

export function readSignupProfile(user: ProfileUser): { nickname: string; consentAt: string } | null // 이메일 가입 입력 읽기
{ // 함수 시작
    const metadata = user.user_metadata ?? {}; // 가입 입력 정보
    const nickname = typeof metadata.nickname === "string" ? validateNickname(metadata.nickname) : null; // 가입 닉네임 검증
    const consentAt = typeof metadata.consent_agreed_at === "string" ? metadata.consent_agreed_at : ""; // 가입 동의 시각

    if (!nickname?.ok || Number.isNaN(Date.parse(consentAt))) // 가입 입력 확인
    { // 조건 시작
        return null; // 가입 입력 없음 반환
    } // 조건 끝

    return { nickname: nickname.value, consentAt }; // 가입 입력 반환
} // 함수 끝

export async function ensureMemberProfile(client: SupabaseClient, user: ProfileUser, now: () => string = () => new Date().toISOString()): Promise<MemberProfile | null> // 회원 프로필 준비
{ // 함수 시작
    const existing = await fetchMemberProfile(client, user.id); // 기존 프로필 조회

    if (existing) // 기존 프로필 확인
    { // 조건 시작
        return existing; // 기존 프로필 반환
    } // 조건 끝

    const signup = readSignupProfile(user); // 이메일 가입 입력 읽기
    return signup ? saveMemberNickname(client, user.id, signup.nickname, now, signup.consentAt) : null; // 가입 입력으로 프로필 생성
} // 함수 끝
