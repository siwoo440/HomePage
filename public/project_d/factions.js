const factionFrames = Array.from(document.querySelectorAll(".faction-frame")); // 모든 세력 선택 버튼을 배열로 가져온다.
const factionPanels = Array.from(document.querySelectorAll(".faction-detail-panel")); // 모든 세력 상세 패널을 배열로 가져온다.
let currentFactionIndex = 0; // 현재 선택된 세력 번호를 저장한다.
document.addEventListener("DOMContentLoaded", () => // 문서가 준비되면 실행할 이벤트를 등록한다.
{ // 문서 준비 후 실행할 코드를 시작한다.
    connectFactionFrames(); // 세력 선택 버튼의 클릭 기능을 연결한다.
}); // 문서 준비 이벤트 등록을 끝낸다.
function connectFactionFrames() // 세력 선택 버튼의 클릭 기능을 연결하는 함수를 만든다.
{ // 세력 선택 버튼 연결 함수 내용을 시작한다.
    factionFrames.forEach((frame, index) => // 세력 버튼을 하나씩 반복한다.
    { // 각 세력 버튼의 기능을 설정한다.
        frame.addEventListener("click", () => // 세력 버튼을 클릭했을 때 실행할 이벤트를 등록한다.
        { // 세력 버튼 클릭 시 실행할 코드를 시작한다.
            currentFactionIndex = index; // 현재 선택된 세력 번호를 저장한다.
            moveToFaction(frame); // 선택한 세력 상세 영역으로 이동한다.
        }); // 세력 버튼 클릭 이벤트 등록을 끝낸다.
    }); // 세력 버튼 반복을 끝낸다.
} // 세력 선택 버튼 연결 함수를 끝낸다.
function moveToFaction(frame) // 세력 상세 영역으로 부드럽게 이동하는 함수를 만든다.
{ // 세력 상세 이동 함수 내용을 시작한다.
    const targetId = frame.dataset.target; // 버튼에 연결된 상세 패널 아이디를 가져온다.
    const targetPanel = document.querySelector(`#${targetId}`); // 아이디에 해당하는 상세 패널을 찾는다.
    if (!targetPanel) // 상세 패널이 없는지 확인한다.
    { // 상세 패널이 없을 때 실행할 코드를 시작한다.
        return; // 이동할 영역이 없으므로 함수를 끝낸다.
    } // 상세 패널 없음 조건문을 끝낸다.
    updateActiveFrame(frame); // 선택한 세력 버튼을 강조한다.
    updateActivePanel(targetPanel); // 선택한 세력 상세 패널을 강조한다.
    targetPanel.scrollIntoView({ behavior: "smooth", block: "center" }); // 선택한 세력 상세 패널로 부드럽게 이동한다.
} // 세력 상세 이동 함수를 끝낸다.
function updateActiveFrame(selectedFrame) // 선택된 세력 버튼 상태를 갱신하는 함수를 만든다.
{ // 세력 버튼 상태 갱신 함수 내용을 시작한다.
    factionFrames.forEach((frame) => // 모든 세력 버튼을 하나씩 반복한다.
    { // 각 세력 버튼의 선택 상태를 변경한다.
        frame.classList.toggle("active", frame === selectedFrame); // 선택한 버튼에만 active 클래스를 적용한다.
    }); // 세력 버튼 반복을 끝낸다.
} // 세력 버튼 상태 갱신 함수를 끝낸다.
function updateActivePanel(selectedPanel) // 선택된 세력 상세 패널 상태를 갱신하는 함수를 만든다.
{ // 세력 상세 패널 상태 갱신 함수 내용을 시작한다.
    factionPanels.forEach((panel) => // 모든 세력 상세 패널을 하나씩 반복한다.
    { // 각 상세 패널의 선택 상태를 변경한다.
        panel.classList.toggle("active", panel === selectedPanel); // 선택한 상세 패널에만 active 클래스를 적용한다.
    }); // 세력 상세 패널 반복을 끝낸다.
} // 세력 상세 패널 상태 갱신 함수를 끝낸다.
