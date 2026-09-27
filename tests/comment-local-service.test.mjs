import assert from "node:assert/strict"; // 엄격 비교 도구
import test from "node:test"; // 테스트 실행 도구
import { COMMENT_IMAGE_MAX_BYTES, createDemoComments } from "../lib/comments/domain.ts"; // 댓글 도메인 도구
import { CommentServiceError } from "../lib/comments/service.ts"; // 댓글 서비스 오류
import { createLocalCommentService } from "../lib/comments/local-service.ts"; // 로컬 댓글 서비스

const FIXED_TIME = "2026-09-26T12:00:00.000Z"; // 고정 작성 시각

function createService(newsId = "demo-echo-void") // 테스트 서비스 생성
{ // 함수 시작
    let sequence = 0; // 식별자 순번
    return createLocalCommentService( // 로컬 서비스 반환
    { // 설정 시작
        initialComments: createDemoComments(newsId), // 초기 댓글 목록
        createId: (prefix) => `${prefix}-${++sequence}`, // 고정 식별자 생성
        now: () => FIXED_TIME, // 고정 시각 생성
    }); // 설정 끝
} // 함수 끝

function expectServiceError(code) // 서비스 오류 검사기
{ // 함수 시작
    return (error) => // 오류 판별 함수 반환
    { // 판별 시작
        assert.equal(error instanceof CommentServiceError, true); // 서비스 오류 형식 확인
        assert.equal(error.code, code); // 오류 코드 확인
        return true; // 오류 일치 반환
    }; // 판별 끝
} // 함수 끝

test("뉴스별 댓글을 복제하여 반환하고 외부 변경으로 내부 상태가 바뀌지 않는다", async () => // 조회 격리 테스트
{ // 테스트 시작
    const service = createService(); // 테스트 서비스 생성
    const firstRead = await service.list("demo-echo-void"); // 첫 댓글 조회
    firstRead[0].content = "외부에서 바꾼 내용"; // 반환 댓글 변경
    firstRead[0].reactions.like.selectedBy.push("outside-user"); // 반환 반응 변경
    const secondRead = await service.list("demo-echo-void"); // 둘째 댓글 조회
    const otherNews = await service.list("other-news"); // 다른 뉴스 조회
    assert.equal(secondRead.length, 3); // 댓글 수 확인
    assert.equal(secondRead[0].content, "개발 과정을 상세하게 볼 수 있어 좋네요. 다음 소식도 기대하고 있습니다!"); // 내부 내용 보존 확인
    assert.equal(secondRead[0].reactions.like.selectedBy.includes("outside-user"), false); // 내부 반응 보존 확인
    assert.deepEqual(otherNews, []); // 다른 뉴스 빈 목록 확인
}); // 테스트 끝

test("정상 댓글의 공백을 정리하고 이미지 주소와 생성 정보를 저장한다", async () => // 댓글 작성 테스트
{ // 테스트 시작
    const service = createService(); // 테스트 서비스 생성
    const created = await service.create( // 댓글 작성
    { // 작성 입력 시작
        newsId: "demo-echo-void", // 뉴스 식별자
        parentId: null, // 최상위 댓글
        authorId: "demo-member", // 작성자 식별자
        nickname: "테스트회원", // 작성자 이름
        content: "  새 댓글입니다.  ", // 댓글 내용
        image: { url: "data:image/png;base64,AA==", type: "image/png", size: 1024 }, // 첨부 이미지
    }); // 작성 입력 끝
    assert.equal(created.id, "comment-1"); // 생성 식별자 확인
    assert.equal(created.content, "새 댓글입니다."); // 공백 정리 확인
    assert.equal(created.imageUrl, "data:image/png;base64,AA=="); // 이미지 주소 확인
    assert.equal(created.createdAt, FIXED_TIME); // 작성 시각 확인
    assert.deepEqual(created.reactions, { like: { count: 0, selectedBy: [] }, cheer: { count: 0, selectedBy: [] }, curious: { count: 0, selectedBy: [] } }); // 초기 반응 확인
    assert.equal((await service.list("demo-echo-void")).length, 4); // 저장 결과 확인
}); // 테스트 끝

test("빈 댓글과 길이·이미지 경계값 위반을 거부한다", async () => // 입력 검증 테스트
{ // 테스트 시작
    const service = createService(); // 테스트 서비스 생성
    const baseInput = { newsId: "demo-echo-void", parentId: null, authorId: "demo-member", nickname: "테스트회원", content: "정상 댓글", image: null }; // 기본 입력
    await assert.rejects(service.create({ ...baseInput, content: "   " }), expectServiceError("INVALID_CONTENT")); // 빈 댓글 거부
    await assert.rejects(service.create({ ...baseInput, content: "가".repeat(2001) }), expectServiceError("INVALID_CONTENT")); // 긴 댓글 거부
    await assert.rejects(service.create({ ...baseInput, image: { url: "data:image/svg+xml,AA", type: "image/svg+xml", size: 100 } }), expectServiceError("INVALID_IMAGE")); // 잘못된 형식 거부
    await assert.rejects(service.create({ ...baseInput, image: { url: "data:image/png;base64,AA==", type: "image/png", size: COMMENT_IMAGE_MAX_BYTES + 1 } }), expectServiceError("INVALID_IMAGE")); // 큰 이미지 거부
}); // 테스트 끝

test("같은 뉴스의 최상위 댓글에만 한 단계 답글을 허용한다", async () => // 답글 깊이 테스트
{ // 테스트 시작
    const service = createService(); // 테스트 서비스 생성
    const baseInput = { newsId: "demo-echo-void", authorId: "demo-member", nickname: "테스트회원", content: "답글입니다.", image: null }; // 기본 답글 입력
    const reply = await service.create({ ...baseInput, parentId: "demo-comment-1" }); // 정상 답글 작성
    assert.equal(reply.parentId, "demo-comment-1"); // 부모 식별자 확인
    await assert.rejects(service.create({ ...baseInput, parentId: "demo-comment-2" }), expectServiceError("INVALID_PARENT")); // 중첩 답글 거부
    await assert.rejects(service.create({ ...baseInput, parentId: "missing-comment" }), expectServiceError("INVALID_PARENT")); // 없는 부모 거부
    await assert.rejects(service.create({ ...baseInput, newsId: "other-news", parentId: "demo-comment-1" }), expectServiceError("INVALID_PARENT")); // 다른 뉴스 부모 거부
}); // 테스트 끝

test("반응을 추가·취소·전환하고 없는 댓글 반응을 거부한다", async () => // 반응 서비스 테스트
{ // 테스트 시작
    const service = createService(); // 테스트 서비스 생성
    const liked = await service.toggleReaction("demo-comment-1", "demo-member", "like"); // 좋아요 추가
    const cancelled = await service.toggleReaction("demo-comment-1", "demo-member", "like"); // 좋아요 취소
    await service.toggleReaction("demo-comment-1", "demo-member", "like"); // 좋아요 재추가
    const cheered = await service.toggleReaction("demo-comment-1", "demo-member", "cheer"); // 응원 전환
    assert.equal(liked.reactions.like.count, 13); // 좋아요 증가 확인
    assert.equal(cancelled.reactions.like.count, 12); // 좋아요 취소 확인
    assert.equal(cheered.reactions.like.count, 12); // 이전 반응 감소 확인
    assert.equal(cheered.reactions.cheer.count, 7); // 새 반응 증가 확인
    await assert.rejects(service.toggleReaction("missing-comment", "demo-member", "like"), expectServiceError("COMMENT_NOT_FOUND")); // 없는 댓글 거부
}); // 테스트 끝

test("신고 사유와 상세 길이를 검증하고 동일 사용자의 중복 신고를 막는다", async () => // 신고 서비스 테스트
{ // 테스트 시작
    const service = createService(); // 테스트 서비스 생성
    const report = await service.report({ commentId: "demo-comment-1", reporterId: "demo-member", reason: "spam", detail: "  반복 광고  " }); // 정상 신고
    assert.equal(report.id, "report-1"); // 신고 식별자 확인
    assert.equal(report.reason, "spam"); // 신고 사유 확인
    assert.equal(report.detail, "반복 광고"); // 상세 공백 정리 확인
    await assert.rejects(service.report({ commentId: "demo-comment-1", reporterId: "demo-member", reason: "spam", detail: "" }), expectServiceError("DUPLICATE_REPORT")); // 중복 신고 거부
    await assert.rejects(service.report({ commentId: "demo-comment-3", reporterId: "demo-member", reason: "unknown", detail: "" }), expectServiceError("INVALID_REPORT_REASON")); // 잘못된 사유 거부
    await assert.rejects(service.report({ commentId: "demo-comment-3", reporterId: "other-member", reason: "other", detail: "가".repeat(501) }), expectServiceError("REPORT_DETAIL_TOO_LONG")); // 긴 상세 내용 거부
    await assert.rejects(service.report({ commentId: "missing-comment", reporterId: "demo-member", reason: "spam", detail: "" }), expectServiceError("COMMENT_NOT_FOUND")); // 없는 댓글 거부
}); // 테스트 끝

test("새 서비스 인스턴스는 변경 전 데모 상태로 시작한다", async () => // 새로고침 정책 테스트
{ // 테스트 시작
    const firstService = createService(); // 첫 서비스 생성
    await firstService.create({ newsId: "demo-echo-void", parentId: null, authorId: "demo-member", nickname: "테스트회원", content: "임시 댓글", image: null }); // 임시 댓글 작성
    await firstService.toggleReaction("demo-comment-1", "demo-member", "like"); // 임시 반응 추가
    const refreshedService = createService(); // 새 서비스 생성
    const refreshedComments = await refreshedService.list("demo-echo-void"); // 초기 댓글 조회
    assert.equal(refreshedComments.length, 3); // 초기 댓글 수 확인
    assert.equal(refreshedComments[0].reactions.like.count, 12); // 초기 반응 수 확인
}); // 테스트 끝
