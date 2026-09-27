const characters = [ // 캐릭터 카드에 사용할 데이터를 배열로 저장한다.
    { name: "세레나", english: "Serena", job: "성녀 / 힐러", role: "서포터", keywords: ["온화함", "헌신", "정화"], description: "여신의 계시로 주인공을 처음 맞이한 성녀이며, 치유와 정화 능력으로 파티의 생존을 책임진다." }, // 세레나 데이터를 저장한다.
    { name: "엘렌", english: "Ellen", job: "기사", role: "탱커", keywords: ["강직", "책임감", "보호"], description: "카르니안 제국의 영웅 출신 기사이며, 강철 같은 방어와 도발 능력으로 전면을 지킨다." }, // 엘렌 데이터를 저장한다.
    { name: "릴리아", english: "Lilia", job: "마법사 / 마녀", role: "컨트롤", keywords: ["지적", "냉소", "마법"], description: "마법도시 노아르의 천재 마법사이며, 범위 마법과 디버프를 활용해 전장을 제어한다." }, // 릴리아 데이터를 저장한다.
    { name: "나타샤", english: "Natasha", job: "도적", role: "딜러", keywords: ["복수", "은신", "연속타"], description: "암흑도시 모르가스 출신 잠입자이며, 은신과 출혈 기반의 단일 폭딜에 특화되어 있다." }, // 나타샤 데이터를 저장한다.
    { name: "이브", english: "Eve", job: "엘프 궁수", role: "딜러", keywords: ["정령", "치명타", "지속딜"], description: "실바란 숲의 정령궁수이며, 연속 사격과 치명타 중심의 중거리 지속 화력을 담당한다." }, // 이브 데이터를 저장한다.
    { name: "클레어", english: "Claire", job: "약사·연금술사", role: "서포터", keywords: ["호기심", "연금술", "유틸"], description: "기계도시 메리디안 출신 연금술사이며, 버프와 디버프와 회복을 함께 다루는 만능형 캐릭터다." }, // 클레어 데이터를 저장한다.
    { name: "루시아", english: "Lucia", job: "총사수", role: "딜러", keywords: ["냉정", "관통", "헤드샷"], description: "길드연합의 용병 출신 총사수이며, 관통 사격과 고정 치명타 공격으로 핵심 대상을 제거한다." }, // 루시아 데이터를 저장한다.
    { name: "파이라", english: "Pyra", job: "창병", role: "딜러", keywords: ["열혈", "돌진", "화염"], description: "카르니안 제국의 창기사이며, 폭발적인 돌진기와 화상 피해로 적진을 흔드는 브레이커다." }, // 파이라 데이터를 저장한다.
    { name: "티리아", english: "Tyria", job: "방패병", role: "탱커", keywords: ["과묵", "수호", "반격"], description: "제국 남부 수호대 출신 방패병이며, 보호막과 반격으로 약한 아군을 지키는 서브 탱커다." }, // 티리아 데이터를 저장한다.
    { name: "메르시아", english: "Mercia", job: "승려·무도승", role: "컨트롤", keywords: ["순수", "정령", "속박"], description: "동방 사원의 젊은 수행자이며, 정령 소환과 근접 공격을 겸해 순간 폭딜과 속박을 만든다." }, // 메르시아 데이터를 저장한다.
    { name: "노엘", english: "Noel", job: "탐험가 / 채찍전사", role: "컨트롤", keywords: ["자유", "함정", "상태이상"], description: "길드연합의 자유로운 모험가이며, 함정과 이동속도 디버프와 약점 노출로 전투 흐름을 바꾼다." }, // 노엘 데이터를 저장한다.
    { name: "세피라", english: "Sephira", job: "순례자 / 신관", role: "서포터", keywords: ["신앙", "회복", "부활"], description: "신의 사도단 엘리트 순례자이며, 공격과 회복과 부활을 함께 지닌 하이브리드 전투 성직자다." } // 세피라 데이터를 저장한다.
]; // 캐릭터 데이터 배열을 끝낸다.
const systems = { // 시스템 탭에 표시할 데이터를 객체로 저장한다.
    stamina: { title: "활력 시스템", body: "모든 캐릭터는 하루 동안 사용할 수 있는 활력을 가지고 있으며, 활력이 0이 되면 해당 날짜에는 탐험에 투입할 수 없다.", points: ["캐릭터별 최대 활력 3", "탐험 1회당 활력 1 소모", "날짜가 지나면 활력 1 회복", "온천, 여관, 아이템으로 추가 회복 가능"] }, // 활력 탭 데이터를 저장한다.
    gold: { title: "골드 경제", body: "골드는 전투와 탐험 보상으로 획득하며 장비 강화, 장비 초월, 룬 구매, 룬 합성, 선물 구매에 사용된다.", points: ["장비 강화 단계는 +1부터 +5까지 구성", "초월은 장비 등급 상승에 사용", "룬 구매와 합성에 골드 소모", "초반 플레이에서 강화와 선물 구매 선택이 갈림"] }, // 골드 탭 데이터를 저장한다.
    rune: { title: "룬 세팅", body: "룬은 캐릭터의 공격, 방어, 회복, 속도, 부활 같은 전투 방향을 바꾸는 성장 장치다.", points: ["힘의 룬으로 공격력 증가", "수비의 룬으로 방어력 증가", "흡혈의 룬으로 공격 적중 시 회복", "궁극의 룬과 스킬의 룬은 특수 성장 방향 제공"] }, // 룬 탭 데이터를 저장한다.
    bond: { title: "친밀도 성장", body: "선물, 대화, 이벤트를 통해 캐릭터와의 관계를 높이면 전투 보너스, 전용 모션, 서브 시나리오, 의상 콘텐츠가 열린다.", points: ["호감도 아이템은 등급과 선호도에 따라 상승량 변화", "캐릭터별 선호 선물이 존재", "레벨 상승으로 대화와 이벤트 해금", "관계 성장이 전투 성장과 연결"] } // 친밀도 탭 데이터를 저장한다.
}; // 시스템 탭 데이터 객체를 끝낸다.
const characterGrid = document.querySelector("#characterGrid"); // 캐릭터 카드가 들어갈 영역을 가져온다.
const characterSearch = document.querySelector("#characterSearch"); // 캐릭터 검색 입력칸을 가져온다.
const characterCount = document.querySelector("#characterCount"); // 캐릭터 결과 개수 영역을 가져온다.
const filterButtons = document.querySelectorAll(".filter-button"); // 역할 필터 버튼들을 가져온다.
const tabButtons = document.querySelectorAll(".tab-button"); // 시스템 탭 버튼들을 가져온다.
const systemPanel = document.querySelector("#systemPanel"); // 시스템 설명 패널을 가져온다.
const navToggle = document.querySelector(".nav-toggle"); // 모바일 메뉴 버튼을 가져온다.
const navLinks = document.querySelector(".nav-links"); // 상단 메뉴 링크 묶음을 가져온다.
let currentRole = "전체"; // 현재 선택된 역할 필터를 저장한다.
document.addEventListener("DOMContentLoaded", () => // 문서가 준비되면 초기 기능을 실행한다.
{ // 초기 실행 블록을 시작한다.
    renderCharacters(characters); // 처음에는 모든 캐릭터를 표시한다.
    renderSystem("stamina"); // 처음에는 활력 시스템을 표시한다.
    connectCharacterSearch(); // 검색 입력 이벤트를 연결한다.
    connectRoleFilters(); // 역할 필터 이벤트를 연결한다.
    connectSystemTabs(); // 시스템 탭 이벤트를 연결한다.
    connectMobileNavigation(); // 모바일 메뉴 이벤트를 연결한다.
    startStarCanvas(); // 배경 별빛 애니메이션을 실행한다.
}); // 문서 준비 이벤트 등록을 끝낸다.
function renderCharacters(items) // 캐릭터 카드를 화면에 그리는 함수를 만든다.
{ // 캐릭터 카드 출력 함수 내용을 시작한다.
    characterGrid.innerHTML = ""; // 기존 카드 내용을 비운다.
    characterCount.textContent = `${items.length}명의 캐릭터`; // 현재 표시되는 캐릭터 수를 표시한다.
    items.forEach((character) => // 캐릭터 목록을 하나씩 반복한다.
    { // 캐릭터 반복 블록을 시작한다.
        const card = document.createElement("article"); // 캐릭터 카드 요소를 만든다.
        card.className = "character-card"; // 캐릭터 카드 클래스를 적용한다.
        card.innerHTML = `
            <div class="character-top">
                <div>
                    <h3>${character.name}</h3>
                    <p class="character-job">${character.english} · ${character.job}</p>
                </div>
                <span class="role-badge">${character.role}</span>
            </div>
            <p>${character.description}</p>
            <div class="keyword-row">
                ${character.keywords.map((keyword) => `<span>#${keyword}</span>`).join("")}
            </div>
        `; // 캐릭터 카드 내부 HTML을 만든다.
        characterGrid.appendChild(card); // 캐릭터 카드를 그리드에 추가한다.
    }); // 캐릭터 반복을 끝낸다.
} // 캐릭터 카드 출력 함수를 끝낸다.
function connectCharacterSearch() // 검색 입력 기능을 연결하는 함수를 만든다.
{ // 검색 입력 연결 함수 내용을 시작한다.
    characterSearch.addEventListener("input", () => // 검색어가 입력될 때마다 실행한다.
    { // 검색 입력 이벤트 블록을 시작한다.
        applyCharacterFilter(); // 현재 검색어와 필터를 적용한다.
    }); // 검색 입력 이벤트 등록을 끝낸다.
} // 검색 입력 연결 함수를 끝낸다.
function connectRoleFilters() // 역할 필터 버튼 기능을 연결하는 함수를 만든다.
{ // 역할 필터 연결 함수 내용을 시작한다.
    filterButtons.forEach((button) => // 모든 필터 버튼을 반복한다.
    { // 필터 버튼 반복 블록을 시작한다.
        button.addEventListener("click", () => // 버튼을 클릭하면 실행한다.
        { // 필터 버튼 클릭 블록을 시작한다.
            currentRole = button.dataset.role; // 클릭한 버튼의 역할 값을 저장한다.
            filterButtons.forEach((item) => item.classList.remove("active")); // 모든 필터 버튼의 활성 표시를 제거한다.
            button.classList.add("active"); // 클릭한 버튼에 활성 표시를 추가한다.
            applyCharacterFilter(); // 현재 검색어와 역할 필터를 적용한다.
        }); // 필터 버튼 클릭 이벤트 등록을 끝낸다.
    }); // 필터 버튼 반복을 끝낸다.
} // 역할 필터 연결 함수를 끝낸다.
function applyCharacterFilter() // 캐릭터 검색과 역할 필터를 적용하는 함수를 만든다.
{ // 캐릭터 필터 적용 함수 내용을 시작한다.
    const keyword = characterSearch.value.trim().toLowerCase(); // 검색어를 가져와 비교하기 쉽게 바꾼다.
    const filtered = characters.filter((character) => // 조건에 맞는 캐릭터만 걸러낸다.
    { // 필터 비교 블록을 시작한다.
        const roleMatched = currentRole === "전체" || character.role === currentRole; // 역할 조건이 맞는지 확인한다.
        const searchTarget = `${character.name} ${character.english} ${character.job} ${character.role} ${character.description} ${character.keywords.join(" ")}`.toLowerCase(); // 검색 대상 문자열을 만든다.
        const keywordMatched = keyword === "" || searchTarget.includes(keyword); // 검색어 조건이 맞는지 확인한다.
        return roleMatched && keywordMatched; // 두 조건을 모두 만족하는 캐릭터만 남긴다.
    }); // 캐릭터 필터링을 끝낸다.
    renderCharacters(filtered); // 필터링된 캐릭터를 화면에 다시 그린다.
} // 캐릭터 필터 적용 함수를 끝낸다.
function connectSystemTabs() // 시스템 탭 버튼 기능을 연결하는 함수를 만든다.
{ // 시스템 탭 연결 함수 내용을 시작한다.
    tabButtons.forEach((button) => // 모든 탭 버튼을 반복한다.
    { // 탭 버튼 반복 블록을 시작한다.
        button.addEventListener("click", () => // 탭 버튼을 클릭하면 실행한다.
        { // 탭 버튼 클릭 블록을 시작한다.
            tabButtons.forEach((item) => item.classList.remove("active")); // 모든 탭 버튼의 활성 표시를 제거한다.
            button.classList.add("active"); // 클릭한 탭 버튼에 활성 표시를 추가한다.
            renderSystem(button.dataset.tab); // 선택된 시스템 내용을 표시한다.
        }); // 탭 버튼 클릭 이벤트 등록을 끝낸다.
    }); // 탭 버튼 반복을 끝낸다.
} // 시스템 탭 연결 함수를 끝낸다.
function renderSystem(key) // 선택된 시스템 데이터를 화면에 그리는 함수를 만든다.
{ // 시스템 출력 함수 내용을 시작한다.
    const system = systems[key]; // 선택된 키에 맞는 시스템 데이터를 가져온다.
    systemPanel.innerHTML = `
        <h3>${system.title}</h3>
        <p>${system.body}</p>
        <ul class="system-list">
            ${system.points.map((point) => `<li>${point}</li>`).join("")}
        </ul>
    `; // 시스템 패널 내부 HTML을 만든다.
} // 시스템 출력 함수를 끝낸다.
function connectMobileNavigation() // 모바일 메뉴 기능을 연결하는 함수를 만든다.
{ // 모바일 메뉴 연결 함수 내용을 시작한다.
    navToggle.addEventListener("click", () => // 모바일 메뉴 버튼을 클릭하면 실행한다.
    { // 모바일 메뉴 클릭 블록을 시작한다.
        navLinks.classList.toggle("open"); // 메뉴의 열림 상태를 바꾼다.
    }); // 모바일 메뉴 클릭 이벤트 등록을 끝낸다.
    navLinks.querySelectorAll("a").forEach((link) => // 메뉴 안의 모든 링크를 반복한다.
    { // 메뉴 링크 반복 블록을 시작한다.
        link.addEventListener("click", () => // 메뉴 링크를 클릭하면 실행한다.
        { // 메뉴 링크 클릭 블록을 시작한다.
            navLinks.classList.remove("open"); // 모바일 메뉴를 닫는다.
        }); // 메뉴 링크 클릭 이벤트 등록을 끝낸다.
    }); // 메뉴 링크 반복을 끝낸다.
} // 모바일 메뉴 연결 함수를 끝낸다.
function startStarCanvas() // 배경 별빛 캔버스를 실행하는 함수를 만든다.
{ // 별빛 캔버스 함수 내용을 시작한다.
    const canvas = document.querySelector("#starCanvas"); // 캔버스 요소를 가져온다.
    const context = canvas.getContext("2d"); // 2D 그리기 도구를 가져온다.
    const stars = []; // 별 데이터를 담을 배열을 만든다.
    const starCount = 90; // 별의 개수를 설정한다.
    function resizeCanvas() // 캔버스 크기를 화면에 맞추는 함수를 만든다.
    { // 캔버스 크기 조정 함수 내용을 시작한다.
        canvas.width = window.innerWidth; // 캔버스 너비를 화면 너비로 설정한다.
        canvas.height = window.innerHeight; // 캔버스 높이를 화면 높이로 설정한다.
    } // 캔버스 크기 조정 함수를 끝낸다.
    function createStars() // 별 데이터를 새로 만드는 함수를 만든다.
    { // 별 데이터 생성 함수 내용을 시작한다.
        stars.length = 0; // 기존 별 데이터를 비운다.
        for (let index = 0; index < starCount; index += 1) // 지정된 개수만큼 반복한다.
        { // 별 생성 반복 블록을 시작한다.
            stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, radius: Math.random() * 1.8 + 0.4, speed: Math.random() * 0.25 + 0.08, alpha: Math.random() * 0.7 + 0.25 }); // 별의 위치와 속성과 투명도를 저장한다.
        } // 별 생성 반복 블록을 끝낸다.
    } // 별 데이터 생성 함수를 끝낸다.
    function drawStars() // 별을 그리고 움직이는 함수를 만든다.
    { // 별 그리기 함수 내용을 시작한다.
        context.clearRect(0, 0, canvas.width, canvas.height); // 이전 프레임을 지운다.
        stars.forEach((star) => // 모든 별을 하나씩 반복한다.
        { // 별 반복 블록을 시작한다.
            context.beginPath(); // 새 원 그리기를 시작한다.
            context.arc(star.x, star.y, star.radius, 0, Math.PI * 2); // 별을 작은 원으로 그린다.
            context.fillStyle = `rgba(246, 200, 99, ${star.alpha})`; // 별의 색상과 투명도를 설정한다.
            context.fill(); // 별을 채운다.
            star.y += star.speed; // 별을 아래로 조금 이동시킨다.
            if (star.y > canvas.height) // 별이 화면 아래를 벗어났는지 확인한다.
            { // 화면 밖으로 나간 별 처리 블록을 시작한다.
                star.y = -4; // 별을 화면 위쪽으로 되돌린다.
                star.x = Math.random() * canvas.width; // 별의 가로 위치를 새로 정한다.
            } // 화면 밖으로 나간 별 처리 블록을 끝낸다.
        }); // 별 반복을 끝낸다.
        requestAnimationFrame(drawStars); // 다음 프레임에서도 별을 다시 그린다.
    } // 별 그리기 함수를 끝낸다.
    resizeCanvas(); // 처음 캔버스 크기를 맞춘다.
    createStars(); // 처음 별 데이터를 만든다.
    drawStars(); // 별 애니메이션을 시작한다.
    window.addEventListener("resize", () => // 화면 크기가 바뀔 때 실행한다.
    { // 화면 크기 변경 블록을 시작한다.
        resizeCanvas(); // 캔버스 크기를 다시 맞춘다.
        createStars(); // 별 위치를 다시 만든다.
    }); // 화면 크기 변경 이벤트 등록을 끝낸다.
} // 별빛 캔버스 함수를 끝낸다.
