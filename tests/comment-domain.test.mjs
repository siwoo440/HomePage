import assert from "node:assert/strict"; // 엄격 비교 도구
import test from "node:test"; // 테스트 실행 도구
import { COMMENT_IMAGE_MAX_BYTES, REPORT_REASONS, createDemoComments, toggleCommentReaction, validateCommentContent, validateCommentImage } from "../lib/comments/domain.ts"; // 댓글 규칙 도구

test("빈 댓글과 너무 긴 댓글을 거부한다", () => // 댓글 길이 테스트
{ // 테스트 시작
    assert.equal(validateCommentContent("   ").ok, false); // 빈 댓글 거부
    assert.equal(validateCommentContent("a".repeat(2001)).ok, false); // 긴 댓글 거부
    assert.deepEqual(validateCommentContent("  반가워요  "), { ok: true, value: "반가워요" }); // 정상 댓글 정리
}); // 테스트 끝

test("댓글 이미지는 지정 형식 한 개와 5MB 이하만 허용한다", () => // 이미지 규칙 테스트
{ // 테스트 시작
    assert.equal(validateCommentImage(null).ok, true); // 이미지 없음 허용
    assert.equal(validateCommentImage({ type: "image/webp", size: COMMENT_IMAGE_MAX_BYTES }).ok, true); // 정상 이미지 허용
    assert.equal(validateCommentImage({ type: "image/svg+xml", size: 100 }).ok, false); // SVG 거부
    assert.equal(validateCommentImage({ type: "image/png", size: COMMENT_IMAGE_MAX_BYTES + 1 }).ok, false); // 큰 이미지 거부
}); // 테스트 끝

test("반응은 같은 사용자가 누르면 취소되고 다른 반응으로 바뀐다", () => // 반응 전환 테스트
{ // 테스트 시작
    const comments = createDemoComments("demo-echo-void"); // 시연 댓글 생성
    const liked = toggleCommentReaction(comments[0], "demo-member", "like"); // 좋아요 선택
    const cancelled = toggleCommentReaction(liked, "demo-member", "like"); // 좋아요 취소
    const cheered = toggleCommentReaction(liked, "demo-member", "cheer"); // 응원 전환
    assert.equal(liked.reactions.like.count, comments[0].reactions.like.count + 1); // 좋아요 증가 확인
    assert.equal(cancelled.reactions.like.count, comments[0].reactions.like.count); // 좋아요 취소 확인
    assert.equal(cheered.reactions.like.selectedBy.includes("demo-member"), false); // 이전 반응 해제 확인
    assert.equal(cheered.reactions.cheer.selectedBy.includes("demo-member"), true); // 새 반응 선택 확인
}); // 테스트 끝

test("신고 사유와 한 단계 답글 시연 데이터를 제공한다", () => // 신고와 답글 테스트
{ // 테스트 시작
    const comments = createDemoComments("demo-echo-void"); // 시연 댓글 생성
    assert.deepEqual(REPORT_REASONS.map((item) => item.value), ["spam", "harassment", "adult", "privacy", "other"]); // 신고 사유 확인
    assert.equal(comments.some((comment) => comment.parentId !== null), true); // 답글 존재 확인
    assert.equal(comments.every((comment) => comment.parentId === null || comments.some((parent) => parent.id === comment.parentId && parent.parentId === null)), true); // 한 단계 답글 확인
}); // 테스트 끝
