import type { NotifySummary } from "@/lib/notify/store"; // 출시 알림 집계 형식

interface NotifySummaryTableProps // 집계 표 속성
{ // 형식 시작
    summary: NotifySummary; // 게임별 집계
} // 형식 끝

// 표 안쪽 줄은 태그와 주석 사이에 공백을 두지 않습니다. 공백 글자가 표의 자식으로 들어가면 React가 경고합니다.
export default function NotifySummaryTable({ summary }: NotifySummaryTableProps) // 게임별 출시 알림 집계 표
{ // 함수 시작
    return ( // 집계 표 반환
        <section className="notify-summary" aria-label="게임별 출시 알림 신청 수"> {/* 집계 영역 */}
            <p className="notify-summary-total">수신 중 <strong>{summary.totalActive.toLocaleString("ko-KR")}</strong>건(확인 완료 {summary.totalConfirmed.toLocaleString("ko-KR")}건) · 수신 거부 {summary.totalUnsubscribed.toLocaleString("ko-KR")}건</p> {/* 전체 합계 */}
            <div className="notify-summary-scroll"> {/* 좁은 화면 가로 스크롤 */}
                <table className="notify-summary-table">{/* 집계 표 */}
                    <thead>{/* 표 머리 */}
                        <tr>{/* 머리 줄 */}
                            <th scope="col">게임</th>{/* 게임 열 */}
                            <th scope="col">수신 중</th>{/* 수신 중 열 */}
                            <th scope="col">확인 완료</th>{/* 확인 완료 열 */}
                            <th scope="col">수신 거부</th>{/* 수신 거부 열 */}
                        </tr>{/* 머리 줄 끝 */}
                    </thead>{/* 표 머리 끝 */}
                    <tbody>{/* 표 본문 */}
                        {summary.items.map((item) => ( // 게임 반복
                            <tr key={item.projectId} data-open={item.open}>{/* 게임 줄 */}
                                <th scope="row">{item.title}{item.open ? "" : " (지금은 신청을 받지 않음)"}</th>{/* 게임 이름 */}
                                <td>{item.active.toLocaleString("ko-KR")}</td>{/* 수신 중 수 */}
                                <td>{item.confirmed.toLocaleString("ko-KR")}</td>{/* 확인 완료 수 */}
                                <td>{item.unsubscribed.toLocaleString("ko-KR")}</td>{/* 수신 거부 수 */}
                            </tr> // 게임 줄 끝
                        ))}{/* 게임 반복 끝 */}
                    </tbody>{/* 표 본문 끝 */}
                </table> {/* 집계 표 끝 */}
            </div> {/* 가로 스크롤 끝 */}
            <p className="notify-summary-note">개인정보를 줄이기 위해 이 화면에는 이메일 주소를 표시하지 않습니다. 출시 소식은 확인 메일로 본인 신청임을 확인한 주소(확인 완료)에만 보냅니다. 확인 메일은 인증한 도메인의 보내는 주소와 서버 전용 키를 연결해야 나갑니다.</p> {/* 표시 범위 안내 */}
        </section> // 집계 영역 끝
    ); // 집계 표 반환 끝
} // 함수 끝
