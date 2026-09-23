import assert from "node:assert/strict"; // 엄격 비교 도구
import { readFile } from "node:fs/promises"; // 파일 읽기 도구
import test from "node:test"; // 테스트 실행 도구

const migrationUrl = new URL("../supabase/migrations/202609120001_member_comments.sql", import.meta.url); // 마이그레이션 주소

test("회원 프로필과 댓글 관련 테이블을 제공한다", async () => // 댓글 데이터 구조 테스트
{ // 테스트 시작
    const sql = await readFile(migrationUrl, "utf8"); // 마이그레이션 읽기
    for (const table of ["member_profiles", "news_comments", "comment_reactions", "comment_reports", "moderation_actions"]) // 필수 테이블 반복
    { // 반복 시작
        assert.match(sql, new RegExp(`create table public\\.${table}`)); // 테이블 생성 확인
        assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`)); // 행 보안 확인
    } // 반복 끝
}); // 테스트 끝

test("댓글 이미지 제한과 사용자 소유권 정책을 제공한다", async () => // 저장소 권한 테스트
{ // 테스트 시작
    const sql = await readFile(migrationUrl, "utf8"); // 마이그레이션 읽기
    assert.match(sql, /comment-images/); // 댓글 이미지 버킷 확인
    assert.match(sql, /5242880/); // 이미지 용량 제한 확인
    assert.match(sql, /image\/gif/); // GIF 형식 확인
    assert.match(sql, /author_id = \(select auth\.uid\(\)\)/); // 작성자 권한 확인
    assert.match(sql, /reporter_id = \(select auth\.uid\(\)\)/); // 신고자 권한 확인
}); // 테스트 끝
