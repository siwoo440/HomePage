import assert from "node:assert/strict"; // 엄격 비교 도구
import { readFile } from "node:fs/promises"; // 파일 읽기 도구
import test from "node:test"; // 테스트 실행 도구

const panelUrl = new URL("../app/news/[id]/comments-panel.tsx", import.meta.url); // 댓글 화면 주소

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
