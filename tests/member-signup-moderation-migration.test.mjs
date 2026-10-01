import assert from "node:assert/strict"; // 엄격 비교 도구
import fs from "node:fs"; // 파일 읽기 도구
import test from "node:test"; // 테스트 실행 도구
import { SUPABASE_MIGRATIONS } from "../scripts/check-supabase-env.mjs"; // 마이그레이션 적용 순서

const migration = fs.readFileSync("supabase/migrations/202610010001_member_signup_moderation.sql", "utf8"); // 가입·관리 마이그레이션

test("가입 동의 시각을 저장하되 공개 프로필 조회에서는 동의 열을 숨긴다", () => // 동의 기록 테스트
{ // 테스트 시작
    for (const column of ["terms_agreed_at", "privacy_agreed_at", "age_confirmed_at"]) // 동의 열 반복
    { // 반복 시작
        assert.match(migration, new RegExp(`add column if not exists ${column} timestamptz`)); // 동의 열 추가 확인
    } // 반복 끝
    assert.match(migration, /revoke select on public\.member_profiles from anon, authenticated/); // 전체 열 읽기 회수 확인
    assert.match(migration, /grant select \(id, nickname, avatar_path, created_at, updated_at\) on public\.member_profiles to anon, authenticated/); // 공개 열만 허용 확인
}); // 테스트 끝

test("관리자만 댓글 공개 상태와 신고 처리 상태를 바꿀 수 있다", () => // 관리 권한 테스트
{ // 테스트 시작
    assert.match(migration, /new\.status is distinct from old\.status and not \(select public\.is_admin\(\)\) then raise exception 'COMMENT_STATUS_ADMIN_ONLY'/); // 회원 상태 변경 차단 확인
    assert.match(migration, /before update of status on public\.news_comments/); // 상태 변경 전 실행 확인
    assert.match(migration, /grant update \(status\) on public\.comment_reports to authenticated/); // 신고 상태 열만 허용 확인
    assert.match(migration, /create policy "admins update reports" on public\.comment_reports for update to authenticated using \(\(select public\.is_admin\(\)\)\) with check \(\(select public\.is_admin\(\)\)\)/); // 관리자 정책 확인
}); // 테스트 끝

test("연결 점검 도구와 README가 네 번째 마이그레이션까지 순서대로 안내한다", () => // 적용 순서 테스트
{ // 테스트 시작
    const files = fs.readdirSync("supabase/migrations").filter((name) => name.endsWith(".sql")).sort(); // 저장소 마이그레이션
    const readme = fs.readFileSync("README.md", "utf8"); // 안내 문서
    assert.deepEqual(SUPABASE_MIGRATIONS, files); // 점검 도구 순서 확인
    assert.match(readme, new RegExp(files.map((name) => name.replace(/\./g, "\\.")).join("[\\s\\S]*"))); // 안내 순서 확인
}); // 테스트 끝
