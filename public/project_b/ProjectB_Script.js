const mergeData = [ // 감정 구슬 합성 단계 데이터를 저장한다.
    { key: "투하", title: "감정 구슬 투하", desc: "상단에서 감정 구슬을 좌우 조준해 컨테이너에 떨어뜨립니다. 물리 기반으로 낙하·충돌합니다." }, // 투하 단계 설명을 저장한다.
    { key: "합성", title: "감정 합성", desc: "같은 감정 구슬 두 개가 충돌하면 상위 감정으로 자동 합성됩니다. 7단계 트리를 따릅니다." }, // 합성 단계 설명을 저장한다.
    { key: "연쇄", title: "연쇄 합성", desc: "합성 후 새로 생성된 구슬이 같은 구슬과 닿으면 즉시 추가 합성이 발생합니다." }, // 연쇄 합성 설명을 저장한다.
    { key: "스킬", title: "감정 스킬", desc: "EP가 충전되면 정리·교체·축소 등의 특수 스킬을 사용해 위기를 돌파합니다." } // 감정 스킬 설명을 저장한다.
]; // 합성 단계 데이터 선언을 끝낸다.

const characterData = [ // 캐릭터 카드 데이터를 저장한다.
    {
        name: "이유", // 캐릭터 이름을 저장한다.
        role: "챕터 1 — 이별", // 캐릭터 역할을 저장한다.
        desc: "끝내 전하지 못한 마음을 간직한 채 병동에 머문다. 빗소리, 편지, 흐릿한 사진이 가득한 감정 공간.", // 캐릭터 설명을 저장한다.
        stats: { 그리움: 5, 향수: 4, 상실감: 3, 미련: 4, 사우다지: 1 } // 캐릭터 감정 단계를 저장한다.
    },
    {
        name: "준", // 캐릭터 이름을 저장한다.
        role: "챕터 2 — 야망", // 캐릭터 역할을 저장한다.
        desc: "이루지 못한 꿈과 반복된 실패. 무너진 무대와 꺼진 스포트라이트의 공간에서 스스로를 부정한다.", // 캐릭터 설명을 저장한다.
        stats: { 열정: 5, 야망: 4, 투지: 3, 분노: 4, 용기: 1 } // 캐릭터 감정 단계를 저장한다.
    },
    {
        name: "소아", // 캐릭터 이름을 저장한다.
        role: "챕터 3 — 달관", // 캐릭터 역할을 저장한다.
        desc: "너무 오래 버티다 감정을 닫아버린 삶. 텅 빈 병실과 멈춘 시계, 겨울 호수의 공간.", // 캐릭터 설명을 저장한다.
        stats: { 무기력: 5, 냉소: 4, 고독: 3, 달관: 3, 평온: 1 } // 캐릭터 감정 단계를 저장한다.
    },
    {
        name: "주인공", // 캐릭터 이름을 저장한다.
        role: "숨겨진 챕터 — 해탈", // 캐릭터 역할을 저장한다.
        desc: "기억을 잃은 채 병동에서 깨어난 인물. 감정 도감 90% 수집 달성 시 자신의 감정 공간이 열린다.", // 캐릭터 설명을 저장한다.
        stats: { 상실감: 4, 공포: 3, 자비: 3, 평온: 2, 해탈: 1 } // 캐릭터 감정 단계를 저장한다.
    }
]; // 캐릭터 카드 데이터 선언을 끝낸다.

const chapterData = { // 챕터별 상세 설명 데이터를 저장한다.
    ch1:
    { // 챕터 1 데이터를 시작한다.
        title: "챕터 1 — 이별", // 챕터 제목을 저장한다.
        desc: "이유는 첫 번째 병실에 머무는 망자입니다. 생전에 누군가를 오래 그리워했지만 끝내 마음을 전하지 못했습니다. 플레이어는 그리움과 슬픔의 감정 구슬을 합성하며 이유의 잊힌 기억을 되찾습니다.", // 챕터 설명을 저장한다.
        target: "사우다지 (6단계)", // 최종 목표 감정을 저장한다.
        stages: 12 // 스테이지 수를 저장한다.
    },
    ch2:
    { // 챕터 2 데이터를 시작한다.
        title: "챕터 2 — 야망", // 챕터 제목을 저장한다.
        desc: "준은 큰 꿈을 품었지만 실패를 반복했고, 죽음 이후에도 자신이 아무것도 이루지 못했다고 느낍니다. 열정과 분노, 야망의 구슬을 합성해 준이 실패 속에서도 버텼던 자신을 기억하게 합니다.", // 챕터 설명을 저장한다.
        target: "용기 (6단계)", // 최종 목표 감정을 저장한다.
        stages: 14 // 스테이지 수를 저장한다.
    },
    ch3:
    { // 챕터 3 데이터를 시작한다.
        title: "챕터 3 — 달관", // 챕터 제목을 저장한다.
        desc: "소아는 너무 오래 버티며 살아왔고 끝내 자신의 감정을 느끼지 못하는 상태가 되었습니다. 무기력과 냉소, 달관의 구슬을 합성해 소아가 감정을 억눌러온 이유를 마주하게 합니다.", // 챕터 설명을 저장한다.
        target: "평온 (7단계)", // 최종 목표 감정을 저장한다.
        stages: 15 // 스테이지 수를 저장한다.
    },
    hidden:
    { // 숨겨진 챕터 데이터를 시작한다.
        title: "숨겨진 챕터 — 해탈", // 챕터 제목을 저장한다.
        desc: "감정 도감 90% 수집 또는 전 챕터 클리어 시 해금됩니다. 주인공 자신의 병실이 열리며, 다른 망자들을 돕는 과정이 자신의 진실을 마주하기 위한 준비였음이 드러납니다.", // 챕터 설명을 저장한다.
        target: "해탈 (7단계)", // 최종 목표 감정을 저장한다.
        stages: 10 // 스테이지 수를 저장한다.
    }
}; // 챕터별 상세 설명 데이터 선언을 끝낸다.

const archiveData = [ // 아카이브 카드 데이터를 저장한다.
    { type: "핵심 개념", title: "감정 구슬 합성", desc: "같은 감정 구슬 두 개가 충돌하면 상위 감정으로 자동 합성됩니다. 기쁨+슬픔=그리움처럼 감정의 논리가 퍼즐의 규칙이 됩니다.", tags: ["합성", "퍼즐", "트리"] }, // 합성 카드를 저장한다.
    { type: "핵심 개념", title: "7단계 감정 트리", desc: "기쁨·슬픔·분노·공포 4개의 뿌리 감정에서 출발해 해탈·아가페·모노노아와레 같은 초월 감정까지 이어지는 합성 구조.", tags: ["감정 트리", "수집", "핵심"] }, // 7단계 트리 카드를 저장한다.
    { type: "핵심 개념", title: "오버플로우", desc: "감정 구슬이 컨테이너 붕괴선을 3초 이상 초과하면 스테이지 실패. 경고 단계에서 선이 점멸하고 위험 단계에서 화면이 흔들립니다.", tags: ["실패 조건", "긴장감", "시스템"] }, // 오버플로우 카드를 저장한다.
    { type: "핵심 개념", title: "레이어드 BGM", desc: "합성 성공 시마다 멜로디 레이어가 추가됩니다. 고차 감정 생성 시 현악기·코러스가 더해지며 플레이어의 행동이 음악을 완성합니다.", tags: ["사운드", "반응형", "감성"] }, // BGM 카드를 저장한다.
    { type: "핵심 개념", title: "감정 도감", desc: "처음 합성한 감정은 도감에 자동 등록됩니다. 5회 발견 시 조합식이 완전 해금되고, 전체 수집 시 숨겨진 챕터가 열립니다.", tags: ["수집", "해금", "도감"] }, // 도감 카드를 저장한다.
    { type: "주요 인물", title: "여성 저승사자", desc: "경계 병동에서 상담사처럼 행동하는 저승사자. 망자를 강제로 데려가지 않고 스스로 감정을 받아들이도록 안내하는 관찰자적 존재.", tags: ["저승사자", "안내자", "핵심 인물"] }, // 저승사자 카드를 저장한다.
    { type: "주요 인물", title: "주인공", desc: "기억을 잃은 채 경계 병동에서 깨어난 인물. 망자들의 감정을 정리하는 과정이 곧 자신의 진실을 마주하는 여정입니다.", tags: ["주인공", "기억 상실", "숨겨진 진실"] }, // 주인공 카드를 저장한다.
    { type: "주요 인물", title: "이유", desc: "끝내 전하지 못한 마음을 간직한 망자. 그리움→향수→미련→사우다지. 감정 공간은 비 오는 방과 오래된 편지로 구성됩니다.", tags: ["챕터 1", "그리움", "사우다지"] }, // 이유 카드를 저장한다.
    { type: "주요 인물", title: "준", desc: "이루지 못한 꿈과 반복된 실패를 안고 있는 망자. 열정→야망→투지→용기. 무너진 무대, 꺼진 조명의 공간.", tags: ["챕터 2", "야망", "용기"] }, // 준 카드를 저장한다.
    { type: "주요 인물", title: "소아", desc: "감정을 닫아버린 삶을 산 망자. 무기력→냉소→달관→평온. 감정 공간은 겨울 호수와 멈춘 시계로 구성됩니다.", tags: ["챕터 3", "무기력", "평온"] }, // 소아 카드를 저장한다.
    { type: "배경 소재", title: "경계 병동", desc: "이승도 저승도 아닌 중간 지대. 하얀 병실, 긴 복도, 상담실, 대기실로 구성되며 각 병실은 망자의 내면 감정 공간과 연결됩니다.", tags: ["공간", "중간 세계", "병동"] }, // 병동 카드를 저장한다.
    { type: "배경 소재", title: "대기실", desc: "자신의 죽음을 받아들이지 못한 망자들이 머무는 공간. 감정 공간이 안정화되지 않은 망자들이 배회합니다.", tags: ["공간", "미수용", "대기"] }, // 대기실 카드를 저장한다.
    { type: "배경 소재", title: "기록실", desc: "감정과 기억이 정리되어 저장되는 장소. 감정 도감의 세계관적 배경으로, 주인공이 다른 망자의 기록을 열람하며 단서를 얻는 공간.", tags: ["공간", "기록", "도감"] }, // 기록실 카드를 저장한다.
    { type: "사건", title: "병동에서의 첫 각성", desc: "주인공이 경계 병동에서 눈을 뜨는 순간. 자신이 왜 이곳에 있는지 알지 못한 채 저승사자를 만나며 이야기가 시작됩니다.", tags: ["서막", "주인공", "시작"] }, // 첫 각성 카드를 저장한다.
    { type: "사건", title: "이유의 감정 해소", desc: "챕터 1의 결말. 사우다지를 완성하며 이유는 자신의 그리움이 삶의 일부였음을 받아들이고 저승으로 향합니다.", tags: ["챕터 1", "결말", "치유"] }, // 이유 결말 카드를 저장한다.
    { type: "사건", title: "주인공의 진실", desc: "숨겨진 챕터에서 드러나는 사건. 다른 망자를 도운 것이 자신의 해탈을 위한 준비였음이 드러납니다.", tags: ["숨겨진 챕터", "반전", "해탈"] } // 주인공 진실 카드를 저장한다.
]; // 아카이브 카드 데이터 선언을 끝낸다.

let currentArchiveFilter = "전체"; // 현재 선택된 아카이브 필터를 저장한다.
let currentArchiveIndex = 0; // 현재 표시 중인 차트 인덱스를 저장한다.
let currentFilteredItems = []; // 현재 필터·검색 결과 배열을 저장한다.

const menuToggle = document.querySelector("#menuToggle"); // 모바일 메뉴 버튼을 가져온다.
const topNav = document.querySelector("#topNav"); // 상단 메뉴 영역을 가져온다.
const inputList = document.querySelector("#inputList"); // 합성 카드 목록 영역을 가져온다.
const characterGrid = document.querySelector("#characterGrid"); // 캐릭터 카드 목록 영역을 가져온다.
const chapterDetail = document.querySelector("#modeDetail"); // 챕터 상세 설명 영역을 가져온다.
const chapterTabs = document.querySelectorAll(".mode-tab"); // 모든 챕터 탭 버튼을 가져온다.
const filterGroup = document.querySelector("#filterGroup"); // 필터 버튼 영역을 가져온다.
const archiveSearch = document.querySelector("#archiveSearch"); // 아카이브 검색 입력칸을 가져온다.
const archiveGrid = document.querySelector("#archiveGrid"); // 아카이브 차트 표시 영역을 가져온다.
const archiveCount = document.querySelector("#archiveCount"); // 아카이브 결과 개수 영역을 가져온다.
const archivePrev = document.querySelector("#archivePrev"); // 이전 차트 화살표 버튼을 가져온다.
const archiveNext = document.querySelector("#archiveNext"); // 다음 차트 화살표 버튼을 가져온다.
const archiveProgressFill = document.querySelector("#archiveProgressFill"); // 진행 채움 막대를 가져온다.

document.addEventListener("DOMContentLoaded", () => // 문서가 모두 준비되면 실행할 이벤트를 등록한다.
{ // 문서 준비 후 실행할 코드를 시작한다.
    renderMerges(); // 감정 합성 카드를 화면에 출력한다.
    renderCharacters(); // 캐릭터 카드를 화면에 출력한다.
    renderChapter("ch1"); // 기본 챕터 설명을 챕터 1로 출력한다.
    renderFilters(); // 아카이브 필터 버튼을 화면에 출력한다.
    renderArchive(0); // 아카이브 첫 번째 차트를 화면에 출력한다.
    connectMenu(); // 모바일 메뉴 기능을 연결한다.
    connectChapterTabs(); // 챕터 탭 기능을 연결한다.
    connectArchiveSearch(); // 아카이브 검색 기능을 연결한다.
    connectArchiveNav(); // 아카이브 화살표 버튼 기능을 연결한다.
    connectRevealAnimation(); // 스크롤 등장 애니메이션을 연결한다.
}); // 문서 준비 이벤트 등록을 끝낸다.

function connectMenu() // 모바일 메뉴 버튼 기능을 연결한다.
{ // 모바일 메뉴 연결 함수 내용을 시작한다.
    menuToggle.addEventListener("click", () => // 메뉴 버튼을 클릭했을 때 실행할 이벤트를 등록한다.
    { // 메뉴 버튼 클릭 시 실행할 코드를 시작한다.
        topNav.classList.toggle("open"); // 메뉴의 열린 상태를 켜거나 끈다.
    }); // 메뉴 버튼 클릭 이벤트 등록을 끝낸다.
} // 모바일 메뉴 연결 함수를 끝낸다.

function renderMerges() // 감정 합성 카드를 출력한다.
{ // 합성 카드 출력 함수 내용을 시작한다.
    inputList.innerHTML = mergeData.map((item) => // 합성 데이터 배열을 HTML 문자열로 바꾼다.
    { // 합성 데이터 변환 코드를 시작한다.
        return `<article class="input-card"><span class="input-key">${item.key}</span><h3>${item.title}</h3><p>${item.desc}</p></article>`; // 합성 카드 HTML을 반환한다.
    }).join(""); // 카드 문자열을 하나로 합친다.
} // 합성 카드 출력 함수를 끝낸다.

function renderCharacters() // 캐릭터 카드를 출력한다.
{ // 캐릭터 카드 출력 함수 내용을 시작한다.
    characterGrid.innerHTML = characterData.map((character) => // 캐릭터 데이터 배열을 HTML 문자열로 바꾼다.
    { // 캐릭터 데이터 변환 코드를 시작한다.
        const stats = makeStats(character.stats); // 캐릭터 감정 단계 HTML을 만든다.
        return `<article class="character-card reveal-item"><span class="role-badge">${character.role}</span><h3>${character.name}</h3><p>${character.desc}</p>${stats}</article>`; // 캐릭터 카드 HTML을 반환한다.
    }).join(""); // 카드 문자열을 하나로 합친다.
} // 캐릭터 카드 출력 함수를 끝낸다.

function makeStats(stats) // 감정 단계 막대 HTML을 만든다.
{ // 감정 단계 생성 함수 내용을 시작한다.
    return `<div class="stat-list">${Object.keys(stats).map((key) => // 감정 키 목록을 반복해 HTML로 바꾼다.
    { // 감정 한 줄 변환 코드를 시작한다.
        const width = stats[key] * 20; // 5점 만점을 퍼센트 너비로 변환한다.
        return `<div class="stat-row"><span>${key}</span><div class="stat-bar"><span style="width:${width}%"></span></div></div>`; // 감정 한 줄 HTML을 반환한다.
    }).join("")}</div>`; // 감정 전체 HTML을 반환한다.
} // 감정 단계 생성 함수를 끝낸다.

function connectChapterTabs() // 챕터 탭 버튼 기능을 연결한다.
{ // 챕터 탭 연결 함수 내용을 시작한다.
    chapterTabs.forEach((button) => // 모든 챕터 버튼을 하나씩 반복한다.
    { // 챕터 버튼 반복 코드를 시작한다.
        button.addEventListener("click", () => // 챕터 버튼을 클릭했을 때 실행할 이벤트를 등록한다.
        { // 챕터 버튼 클릭 시 실행할 코드를 시작한다.
            chapterTabs.forEach((item) => item.classList.remove("active")); // 모든 챕터 버튼의 활성 표시를 제거한다.
            button.classList.add("active"); // 클릭한 챕터 버튼에 활성 표시를 추가한다.
            renderChapter(button.dataset.mode); // 클릭한 챕터의 설명을 출력한다.
        }); // 챕터 버튼 클릭 이벤트 등록을 끝낸다.
    }); // 챕터 버튼 반복을 끝낸다.
} // 챕터 탭 연결 함수를 끝낸다.

function renderChapter(chapterKey) // 선택된 챕터 설명을 출력한다.
{ // 챕터 설명 출력 함수 내용을 시작한다.
    const ch = chapterData[chapterKey]; // 선택된 챕터 데이터를 가져온다.
    chapterDetail.innerHTML = // 챕터 상세 영역에 HTML을 넣는다.
        `<h3>${ch.title}</h3>` + // 챕터 제목을 출력한다.
        `<p>${ch.desc}</p>` + // 챕터 설명을 출력한다.
        `<span class="chapter-target">최종 목표 감정 · ${ch.target}</span>` + // 목표 감정 배지를 출력한다.
        `<p style="margin-top:12px;color:var(--muted);font-size:14px;">스테이지 수 ${ch.stages}개</p>`; // 스테이지 수를 출력한다.
} // 챕터 설명 출력 함수를 끝낸다.

function renderFilters() // 아카이브 필터 버튼을 출력한다.
{ // 필터 출력 함수 내용을 시작한다.
    const filters = ["전체", ...new Set(archiveData.map((item) => item.type))]; // 전체와 중복 없는 분류 목록을 만든다.
    filterGroup.innerHTML = filters.map((filter) => // 필터 목록을 버튼 HTML로 바꾼다.
    { // 필터 버튼 변환 코드를 시작한다.
        const activeClass = filter === currentArchiveFilter ? " active" : ""; // 현재 필터와 같으면 활성 클래스를 만든다.
        return `<button class="filter-button${activeClass}" type="button" data-filter="${filter}">${filter}</button>`; // 필터 버튼 HTML을 반환한다.
    }).join(""); // 필터 버튼 문자열을 하나로 합친다.
    document.querySelectorAll(".filter-button").forEach((button) => // 출력된 필터 버튼을 하나씩 반복한다.
    { // 필터 버튼 반복 코드를 시작한다.
        button.addEventListener("click", () => // 필터 버튼 클릭 이벤트를 등록한다.
        { // 필터 버튼 클릭 시 실행할 코드를 시작한다.
            currentArchiveFilter = button.dataset.filter; // 클릭한 필터 값을 현재 필터로 저장한다.
            currentArchiveIndex = 0; // 필터 변경 시 첫 번째 항목부터 다시 시작한다.
            renderFilters(); // 필터 버튼의 활성 상태를 다시 출력한다.
            renderArchive(0); // 필터 조건에 맞는 첫 번째 차트를 출력한다.
        }); // 필터 버튼 클릭 이벤트 등록을 끝낸다.
    }); // 필터 버튼 반복을 끝낸다.
} // 필터 출력 함수를 끝낸다.

function connectArchiveSearch() // 아카이브 검색 기능을 연결한다.
{ // 아카이브 검색 연결 함수 내용을 시작한다.
    archiveSearch.addEventListener("input", () => // 검색어가 입력될 때 실행할 이벤트를 등록한다.
    { // 검색어 입력 시 실행할 코드를 시작한다.
        currentArchiveIndex = 0; // 검색어 변경 시 첫 번째 항목부터 다시 시작한다.
        renderArchive(0); // 검색어에 맞는 첫 번째 차트를 출력한다.
    }); // 검색 입력 이벤트 등록을 끝낸다.
} // 아카이브 검색 연결 함수를 끝낸다.

function renderArchive(direction) // 단일 차트를 슬라이드 애니메이션과 함께 출력한다.
{ // 아카이브 출력 함수 내용을 시작한다.
    const keyword = archiveSearch.value.trim().toLowerCase(); // 검색어를 소문자로 정리한다.
    currentFilteredItems = archiveData.filter((item) => // 필터·검색 조건으로 항목을 거른다.
    { // 필터 조건 코드를 시작한다.
        const filterMatched = currentArchiveFilter === "전체" || item.type === currentArchiveFilter; // 분류 조건을 확인한다.
        const text = `${item.title} ${item.desc} ${item.tags.join(" ")}`.toLowerCase(); // 검색 대상 문자열을 만든다.
        const keywordMatched = keyword === "" || text.includes(keyword); // 검색어 조건을 확인한다.
        return filterMatched && keywordMatched; // 두 조건을 모두 만족하는 항목만 남긴다.
    }); // 필터 처리를 끝낸다.

    const total = currentFilteredItems.length; // 총 항목 수를 저장한다.

    if (currentArchiveIndex >= total) { currentArchiveIndex = 0; } // 인덱스가 범위를 벗어나면 처음으로 돌린다.
    if (currentArchiveIndex < 0) { currentArchiveIndex = total - 1; } // 인덱스가 음수면 마지막으로 돌린다.

    if (archivePrev) { archivePrev.disabled = total <= 1; } // 항목이 하나 이하면 이전 버튼을 비활성화한다.
    if (archiveNext) { archiveNext.disabled = total <= 1; } // 항목이 하나 이하면 다음 버튼을 비활성화한다.

    archiveCount.textContent = total > 0 // 카운터 텍스트를 현재/전체 형식으로 표시한다.
        ? `${currentArchiveIndex + 1} / ${total}` // 현재 번호와 전체 수를 보여준다.
        : "0개의 항목"; // 결과가 없으면 안내 문구를 보여준다.

    if (archiveProgressFill) // 진행 채움 막대가 있으면 너비를 업데이트한다.
    { // 진행 막대 업데이트 코드를 시작한다.
        const pct = total > 1 ? ((currentArchiveIndex + 1) / total) * 100 : 100; // 진행률을 퍼센트로 계산한다.
        archiveProgressFill.style.width = `${pct}%`; // 채움 막대 너비를 설정한다.
    } // 진행 막대 업데이트 코드를 끝낸다.

    if (total === 0) // 항목이 없으면 빈 상태를 표시한다.
    { // 빈 상태 처리 코드를 시작한다.
        archiveGrid.innerHTML = `<p style="color:var(--muted);text-align:center;padding:60px 0;font-size:15px;">검색 결과가 없습니다</p>`; // 빈 안내 문구를 넣는다.
        return; // 함수를 종료한다.
    } // 빈 상태 처리 코드를 끝낸다.

    const item = currentFilteredItems[currentArchiveIndex]; // 현재 표시할 항목을 가져온다.
    const animClass = direction === undefined ? "" : direction >= 0 ? "anim-next" : "anim-prev"; // 슬라이드 방향에 맞는 클래스를 결정한다.
    const safeType = item.type.replace(/ /g, "\\ "); // CSS 클래스명에서 공백을 이스케이프한다.

    archiveGrid.innerHTML = // 단일 차트 클립보드 HTML을 출력한다.
        `<article class="archive-card ${animClass}">` + // 카드 외부 컨테이너를 시작한다.
            `<div class="chart-clip"></div>` + // 금속 클립을 만든다.
            `<div class="chart-board">` + // 클립보드 판을 시작한다.
                `<div class="chart-paper">` + // 종이 영역을 시작한다.
                    `<div class="chart-paper-header">` + // 상단 헤더를 시작한다.
                        `<div class="chart-cross">✚</div>` + // 빨간 십자 아이콘을 만든다.
                        `<div class="chart-header-lines">` + // 헤더 장식 줄을 시작한다.
                            `<div class="hline"></div>` + // 첫 번째 장식 줄을 만든다.
                            `<div class="hline"></div>` + // 두 번째 장식 줄을 만든다.
                        `</div>` + // 헤더 장식 줄을 끝낸다.
                    `</div>` + // 상단 헤더를 끝낸다.
                    `<span class="chart-type-badge type-${safeType}">${item.type}</span>` + // 분류 배지를 만든다.
                    `<h3 class="chart-title">${item.title}</h3>` + // 차트 제목을 만든다.
                    `<div class="chart-divider"></div>` + // 구분선을 만든다.
                    `<p class="chart-desc">${item.desc}</p>` + // 차트 설명을 만든다.
                    `<div class="chart-lines-deco">` + // 하단 장식 줄 묶음을 시작한다.
                        `<span></span><span></span><span></span><span></span>` + // 장식 줄 4개를 만든다.
                    `</div>` + // 하단 장식 줄 묶음을 끝낸다.
                `</div>` + // 종이 영역을 끝낸다.
            `</div>` + // 클립보드 판을 끝낸다.
        `</article>`; // 카드 외부 컨테이너를 끝낸다.
} // 아카이브 출력 함수를 끝낸다.

function connectArchiveNav() // 아카이브 화살표 버튼 기능을 연결한다.
{ // 화살표 연결 함수 내용을 시작한다.
    if (archivePrev) // 이전 버튼이 있으면 클릭 이벤트를 등록한다.
    { // 이전 버튼 이벤트 블록을 시작한다.
        archivePrev.addEventListener("click", () => // 이전 버튼 클릭 이벤트를 등록한다.
        { // 이전 버튼 클릭 시 실행할 코드를 시작한다.
            currentArchiveIndex--; // 인덱스를 하나 줄인다.
            if (currentArchiveIndex < 0) { currentArchiveIndex = currentFilteredItems.length - 1; } // 첫 항목 이전은 마지막으로 돌아간다.
            renderArchive(-1); // 왼쪽 슬라이드 방향으로 차트를 다시 출력한다.
        }); // 이전 버튼 클릭 이벤트 등록을 끝낸다.
    } // 이전 버튼 이벤트 블록을 끝낸다.
    if (archiveNext) // 다음 버튼이 있으면 클릭 이벤트를 등록한다.
    { // 다음 버튼 이벤트 블록을 시작한다.
        archiveNext.addEventListener("click", () => // 다음 버튼 클릭 이벤트를 등록한다.
        { // 다음 버튼 클릭 시 실행할 코드를 시작한다.
            currentArchiveIndex++; // 인덱스를 하나 늘린다.
            if (currentArchiveIndex >= currentFilteredItems.length) { currentArchiveIndex = 0; } // 마지막 항목 다음은 처음으로 돌아간다.
            renderArchive(1); // 오른쪽 슬라이드 방향으로 차트를 다시 출력한다.
        }); // 다음 버튼 클릭 이벤트 등록을 끝낸다.
    } // 다음 버튼 이벤트 블록을 끝낸다.
} // 화살표 연결 함수를 끝낸다.

function connectRevealAnimation() // 스크롤 등장 애니메이션을 연결한다.
{ // 등장 애니메이션 연결 함수 내용을 시작한다.
    const targets = document.querySelectorAll(".reveal-item:not(.visible)"); // 아직 보이지 않는 등장 대상을 가져온다.
    const observer = new IntersectionObserver((entries) => // 화면 진입을 감지하는 관찰자를 만든다.
    { // 관찰자 콜백 내용을 시작한다.
        entries.forEach((entry) => // 감지된 요소를 하나씩 반복한다.
        { // 감지 요소 반복 코드를 시작한다.
            if (entry.isIntersecting) // 요소가 화면에 들어왔는지 확인한다.
            { // 화면에 들어온 경우 실행할 코드를 시작한다.
                entry.target.classList.add("visible"); // 요소에 표시 클래스를 추가한다.
                observer.unobserve(entry.target); // 한 번 표시된 요소는 더 이상 관찰하지 않는다.
            } // 화면에 들어온 경우 실행할 코드를 끝낸다.
        }); // 감지 요소 반복을 끝낸다.
    }, { threshold: 0.12 }); // 요소가 12퍼센트 보이면 콜백을 실행한다.
    targets.forEach((target) => observer.observe(target)); // 모든 등장 대상을 관찰자에 등록한다.
} // 등장 애니메이션 연결 함수를 끝낸다.
