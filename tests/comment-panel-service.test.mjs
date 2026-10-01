import assert from "node:assert/strict"; // 엄격 비교 도구
import { readFile } from "node:fs/promises"; // 파일 읽기 도구
import test from "node:test"; // 테스트 실행 도구

const panelUrl = new URL("../app/news/[id]/comments-panel.tsx", import.meta.url); // 댓글 화면 주소
const styleUrl = new URL("../app/news/[id]/news-detail.module.css", import.meta.url); // 댓글 스타일 주소

test("댓글 화면은 로컬 서비스로 조회·작성·반응·신고를 처리한다", async () => // 서비스 연결 계약 테스트
{ // 테스트 시작
    const source = await readFile(panelUrl, "utf8"); // 댓글 화면 읽기
    assert.match(source, /createLocalCommentService/); // 로컬 서비스 생성 확인
    assert.match(source, /commentService\.list\(newsId\)/); // 댓글 조회 호출 확인
    assert.match(source, /commentService\.create\(/); // 댓글 작성 호출 확인
    assert.match(source, /commentService\.toggleReaction\(/); // 반응 전환 호출 확인
    assert.match(source, /commentService\.report\(/); // 댓글 신고 호출 확인
}); // 테스트 끝

test("댓글별 신고 사유 선택값을 실제 신고 요청에 전달한다", async () => // 신고 선택 계약 테스트
{ // 테스트 시작
    const source = await readFile(panelUrl, "utf8"); // 댓글 화면 읽기
    assert.match(source, /reportReasons\[commentId\]/); // 댓글별 신고 사유 읽기 확인
    assert.match(source, /reason:\s*reportReasons\[commentId\]/); // 선택 사유 전달 확인
    assert.match(source, /value=\{reportReasons\[comment\.id\]\}/); // 제어 선택 요소 확인
    assert.doesNotMatch(source, /defaultValue="spam"/); // 고정 기본값 제거 확인
}); // 테스트 끝

test("댓글은 제출 전에 내용과 이미지를 검증하고 첫 오류를 안내한다", async () => // 댓글 검증 계약 테스트
{ // 테스트 시작
    const source = await readFile(panelUrl, "utf8"); // 댓글 화면 읽기
    assert.match(source, /validateCommentContent\(content\)/); // 댓글 내용 검증 확인
    assert.match(source, /validateCommentImage\(imageFile\)/); // 제출 이미지 검증 확인
    assert.match(source, /preventInvalidFormSubmission\(event, COMMENT_FIELD_ORDER, nextErrors\)/); // 제출 차단과 포커스 확인
    assert.match(source, /imageInputRef\.current\?\.focus\(\)/); // 선택 이미지 오류 포커스 확인
    assert.match(source, /aria-busy=\{isSubmitting\}/); // 제출 상태 확인
    assert.match(source, /disabled=\{isSubmitting\}/); // 중복 제출 차단 확인
    assert.match(source, /id="comment-content-error"[^>]*role="alert"/); // 내용 오류 알림 확인
    assert.match(source, /id="comment-image-error"[^>]*role="alert"/); // 이미지 오류 알림 확인
    assert.match(source, /<label[^>]*className=\{styles\.imageButton\}[^>]*>[\s\S]*?<input[^>]*ref=\{imageInputRef\}[\s\S]*?<\/label>/); // 이미지 입력 라벨 포함 확인
    assert.match(source, /textarea[^>]*disabled=\{isSubmitting\}/); // 제출 중 내용 변경 차단 확인
    assert.match(source, /input[^>]*name="image"[^>]*disabled=\{isSubmitting\}/); // 제출 중 이미지 변경 차단 확인
    const style = await readFile(styleUrl, "utf8"); // 댓글 스타일 읽기
    assert.match(style, /\.imageButton:focus-within[\s\S]*?outline:/); // 이미지 포커스 표시 확인
}); // 테스트 끝

test("댓글 화면은 시연 모드에서 로컬 서비스, 실제 모드에서 Supabase 서비스와 회원 닉네임을 사용한다", async () => // 모드별 연결 계약
{ // 테스트 시작
    const source = await readFile(panelUrl, "utf8"); // 댓글 화면 읽기
    const page = await readFile(new URL("../app/news/[id]/page.tsx", import.meta.url), "utf8"); // 뉴스 상세 화면 읽기
    assert.match(source, /demoMode \? createLocalCommentService\([\s\S]*?\) : supabase \? createSupabaseCommentService\(\{ client: supabase \}\) : null/); // 모드별 서비스 선택 확인
    assert.match(source, /ensureMemberProfile\(supabase, user\)/); // 실제 회원 닉네임 조회·생성 확인
    assert.match(source, /닉네임을 정하고 댓글 남기기/); // 닉네임 설정 안내 확인
    assert.match(source, /file: imageFile/); // 실제 업로드 파일 전달 확인
    assert.match(page, /<CommentsPanel newsId=\{post\.id\} demoMode=\{commentsDemoMode\} \/>/); // 상세 화면 연결 확인
}); // 테스트 끝
