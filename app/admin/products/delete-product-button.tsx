"use client"; // 브라우저 버튼 모듈

export default function DeleteProductButton() // 상품 삭제 버튼
{ // 함수 시작
    return ( // 버튼 반환
        <button className="admin-delete-button" type="submit" onClick={(event) => // 삭제 확인 이벤트
        { // 클릭 처리 시작
            if (!window.confirm("이 상품을 삭제하시겠습니까? 삭제한 상품은 복구할 수 없습니다.")) // 삭제 취소 확인
            { // 조건 시작
                event.preventDefault(); // 폼 제출 차단
            } // 조건 끝
        }}>삭제</button> // 삭제 버튼 끝
    ); // 버튼 반환 끝
} // 함수 끝
