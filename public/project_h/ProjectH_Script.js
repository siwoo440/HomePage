const companions = [ // 동료 캐러셀 데이터 목록
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
]; // 동료 데이터 목록 끝
const systems = { // 시스템 탭에 표시할 데이터를 객체로 저장한다.
    stamina: { title: "활력 시스템", body: "모든 캐릭터는 하루 동안 사용할 수 있는 활력을 가지고 있으며, 활력이 0이 되면 해당 날짜에는 탐험에 투입할 수 없다.", points: ["캐릭터별 최대 활력 3", "탐험 1회당 활력 1 소모", "날짜가 지나면 활력 1 회복", "온천, 여관, 아이템으로 추가 회복 가능"] }, // 활력 탭 데이터를 저장한다.
    gold: { title: "골드 경제", body: "골드는 전투와 탐험 보상으로 획득하며 장비 강화, 장비 초월, 룬 구매, 룬 합성, 선물 구매에 사용된다.", points: ["장비 강화 단계는 +1부터 +5까지 구성", "초월은 장비 등급 상승에 사용", "룬 구매와 합성에 골드 소모", "초반 플레이에서 강화와 선물 구매 선택이 갈림"] }, // 골드 탭 데이터를 저장한다.
    rune: { title: "룬 세팅", body: "룬은 캐릭터의 공격, 방어, 회복, 속도, 부활 같은 전투 방향을 바꾸는 성장 장치다.", points: ["힘의 룬으로 공격력 증가", "수비의 룬으로 방어력 증가", "흡혈의 룬으로 공격 적중 시 회복", "궁극의 룬과 스킬의 룬은 특수 성장 방향 제공"] }, // 룬 탭 데이터를 저장한다.
    bond: { title: "친밀도 성장", body: "선물, 대화, 이벤트를 통해 캐릭터와의 관계를 높이면 전투 보너스, 전용 모션, 서브 시나리오, 의상 콘텐츠가 열린다.", points: ["호감도 아이템은 등급과 선호도에 따라 상승량 변화", "캐릭터별 선호 선물이 존재", "레벨 상승으로 대화와 이벤트 해금", "관계 성장이 전투 성장과 연결"] } // 친밀도 탭 데이터를 저장한다.
}; // 시스템 탭 데이터 객체를 끝낸다.
const ALL_COMPANION_ROLE = "전체"; // 전체 역할 필터 값
const companionSearch = document.querySelector("#companionSearch"); // 동료 검색 입력칸
const companionFilterButtons = document.querySelectorAll(".companion-filter-button"); // 동료 역할 필터 버튼 목록
const companionCount = document.querySelector("#companionCount"); // 동료 수 안내 영역
const companionCarousel = document.querySelector(".companion-carousel"); // 동료 캐러셀 영역
const companionCard = document.querySelector("#companionCard"); // 동료 카드 영역
const prevCompanionButton = document.querySelector("#prevCompanionButton"); // 이전 동료 버튼
const nextCompanionButton = document.querySelector("#nextCompanionButton"); // 다음 동료 버튼
const companionDots = document.querySelector("#companionDots"); // 동료 위치 점 영역
const tabButtons = document.querySelectorAll(".tab-button"); // 시스템 탭 버튼들을 가져온다.
const systemPanel = document.querySelector("#systemPanel"); // 시스템 설명 패널을 가져온다.
const navToggle = document.querySelector(".nav-toggle"); // 모바일 메뉴 버튼을 가져온다.
const navLinks = document.querySelector(".nav-links"); // 상단 메뉴 링크 묶음을 가져온다.
let currentRole = ALL_COMPANION_ROLE; // 현재 역할 필터
let visibleCompanions = companions; // 현재 표시 대상 동료 목록
let currentCompanionIndex = 0; // 현재 동료 위치
document.addEventListener("DOMContentLoaded", () => // 문서가 준비되면 초기 기능을 실행한다.
{ // 초기 실행 블록을 시작한다.
    connectCompanionSearch(); // 동료 검색 연결
    connectCompanionFilters(); // 동료 역할 필터 연결
    connectCompanionCarousel(); // 동료 캐러셀 조작 연결
    applyCompanionFilter(); // 첫 동료 목록 표시
    renderSystem("stamina"); // 처음에는 활력 시스템을 표시한다.
    connectSystemTabs(); // 시스템 탭 이벤트를 연결한다.
    connectMobileNavigation(); // 모바일 메뉴 이벤트를 연결한다.
    startStarCanvas(); // 배경 별빛 애니메이션을 실행한다.
}); // 문서 준비 이벤트 등록을 끝낸다.
function filterCompanions(items, role, keyword) // 역할·검색어 기준 동료 선별
{ // 함수 시작
    const normalizedKeyword = String(keyword ?? "").trim().toLowerCase(); // 비교용 검색어
    return items.filter((companion) => // 조건 일치 동료 선별
    { // 선별 조건 시작
        const roleMatched = role === ALL_COMPANION_ROLE || companion.role === role; // 역할 일치 여부
        const searchTarget = `${companion.name} ${companion.english} ${companion.job} ${companion.role} ${companion.description} ${companion.keywords.join(" ")}`.toLowerCase(); // 검색 대상 문자열
        const keywordMatched = normalizedKeyword === "" || searchTarget.includes(normalizedKeyword); // 검색어 일치 여부
        return roleMatched && keywordMatched; // 두 조건 동시 충족 여부
    }); // 선별 조건 끝
} // 함수 끝
function wrapCompanionIndex(index, length) // 순환 동료 위치 계산
{ // 함수 시작
    if (length <= 0) // 빈 목록 확인
    { // 조건 시작
        return 0; // 기본 위치
    } // 조건 끝
    return ((index % length) + length) % length; // 목록 범위 안 위치
} // 함수 끝
function connectCompanionSearch() // 동료 검색 입력 연결
{ // 함수 시작
    if (!companionSearch) // 검색 입력칸 누락 확인
    { // 조건 시작
        return; // 연결 생략
    } // 조건 끝
    companionSearch.addEventListener("input", applyCompanionFilter); // 입력 시 필터 적용
} // 함수 끝
function connectCompanionFilters() // 동료 역할 필터 연결
{ // 함수 시작
    companionFilterButtons.forEach((button) => // 필터 버튼 반복
    { // 반복 시작
        button.setAttribute("aria-pressed", String(button.classList.contains("active"))); // 초기 선택 상태
        button.addEventListener("click", () => // 필터 선택 처리
        { // 클릭 처리 시작
            currentRole = button.dataset.role ?? ALL_COMPANION_ROLE; // 선택 역할 저장
            companionFilterButtons.forEach((item) => // 전체 필터 버튼 반복
            { // 상태 갱신 시작
                const selected = item === button; // 선택 버튼 여부
                item.classList.toggle("active", selected); // 활성 표시 갱신
                item.setAttribute("aria-pressed", String(selected)); // 보조 기술 선택 상태 갱신
            }); // 상태 갱신 끝
            applyCompanionFilter(); // 필터 결과 반영
        }); // 클릭 처리 끝
    }); // 반복 끝
} // 함수 끝
function connectCompanionCarousel() // 동료 캐러셀 조작 연결
{ // 함수 시작
    prevCompanionButton?.addEventListener("click", () => showCompanion(currentCompanionIndex - 1)); // 이전 동료 이동
    nextCompanionButton?.addEventListener("click", () => showCompanion(currentCompanionIndex + 1)); // 다음 동료 이동
    companionCarousel?.addEventListener("keydown", (event) => // 방향키 이동 처리
    { // 키 처리 시작
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") // 좌우 방향키 확인
        { // 조건 시작
            event.preventDefault(); // 기본 스크롤 방지
            showCompanion(currentCompanionIndex + (event.key === "ArrowLeft" ? -1 : 1)); // 방향별 동료 이동
        } // 조건 끝
    }); // 키 처리 끝
} // 함수 끝
function applyCompanionFilter() // 검색어·역할 필터 적용
{ // 함수 시작
    visibleCompanions = filterCompanions(companions, currentRole, companionSearch?.value ?? ""); // 표시 대상 갱신
    currentCompanionIndex = 0; // 첫 동료 위치 초기화
    if (companionCount) // 동료 수 영역 확인
    { // 조건 시작
        companionCount.textContent = `${visibleCompanions.length}명의 동료`; // 표시 동료 수
    } // 조건 끝
    renderCompanionDots(); // 위치 점 다시 생성
    renderCompanion(false); // 첫 동료 카드 표시
} // 함수 끝
function showCompanion(index) // 지정 위치 동료 표시
{ // 함수 시작
    if (visibleCompanions.length <= 1) // 이동 불필요 확인
    { // 조건 시작
        return; // 이동 생략
    } // 조건 끝
    currentCompanionIndex = wrapCompanionIndex(index, visibleCompanions.length); // 순환 위치 저장
    renderCompanion(true); // 선택 동료 카드 표시
} // 함수 끝
function renderCompanion(animate) // 현재 동료 카드 출력
{ // 함수 시작
    if (!companionCard) // 카드 영역 누락 확인
    { // 조건 시작
        return; // 출력 생략
    } // 조건 끝
    const total = visibleCompanions.length; // 표시 동료 수
    const navigable = total > 1; // 이동 가능 여부
    if (prevCompanionButton) // 이전 버튼 확인
    { // 조건 시작
        prevCompanionButton.disabled = !navigable; // 이전 버튼 사용 가능 상태
    } // 조건 끝
    if (nextCompanionButton) // 다음 버튼 확인
    { // 조건 시작
        nextCompanionButton.disabled = !navigable; // 다음 버튼 사용 가능 상태
    } // 조건 끝
    updateCompanionDots(); // 현재 위치 점 강조
    if (total === 0) // 결과 없음 확인
    { // 조건 시작
        const empty = document.createElement("p"); // 빈 결과 안내 요소
        empty.className = "companion-empty"; // 빈 결과 스타일
        empty.textContent = "조건에 맞는 동료가 없습니다. 검색어나 역할 필터를 바꿔 보세요."; // 빈 결과 안내 문구
        companionCard.replaceChildren(empty); // 빈 결과 안내 표시
        return; // 출력 종료
    } // 조건 끝
    const companion = visibleCompanions[currentCompanionIndex]; // 현재 동료 데이터
    companionCard.replaceChildren(createCompanionImageSlot(companion), createCompanionInfoSlot(companion)); // 카드 내용 교체
    if (animate) // 전환 효과 사용 여부
    { // 조건 시작
        companionCard.classList.remove("is-entering"); // 이전 전환 효과 제거
        void companionCard.offsetWidth; // 전환 효과 재시작용 배치 계산
        companionCard.classList.add("is-entering"); // 새 전환 효과 적용
    } // 조건 끝
} // 함수 끝
function createCompanionImageSlot(companion) // 동료 이미지 자리 생성
{ // 함수 시작
    const slot = document.createElement("div"); // 이미지 자리 요소
    slot.className = "companion-image-slot"; // 이미지 자리 스타일
    slot.setAttribute("aria-hidden", "true"); // 장식 영역 표시
    if (companion.image) // 실제 이미지 경로 확인
    { // 조건 시작
        slot.style.setProperty("--companion-image", `url("${companion.image}")`); // 캐릭터 이미지 적용
        slot.classList.add("has-image"); // 이미지 보유 표시
    } // 조건 끝
    const label = document.createElement("span"); // 이미지 자리 안내 요소
    label.className = "companion-image-label"; // 안내 문구 스타일
    label.textContent = "CHARACTER IMAGE"; // 이미지 자리 안내 문구
    const initial = document.createElement("span"); // 대체 이니셜 요소
    initial.className = "companion-image-initial"; // 이니셜 스타일
    initial.textContent = companion.english.charAt(0); // 영문 이름 첫 글자
    slot.append(label, initial); // 이미지 자리 내용 연결
    return slot; // 이미지 자리 반환
} // 함수 끝
function createCompanionInfoSlot(companion) // 동료 설명 자리 생성
{ // 함수 시작
    const info = document.createElement("div"); // 설명 자리 요소
    info.className = "companion-info-slot"; // 설명 자리 스타일
    const role = document.createElement("span"); // 역할 배지 요소
    role.className = "companion-role"; // 역할 배지 스타일
    role.textContent = companion.role; // 동료 역할
    const name = document.createElement("h3"); // 이름 제목 요소
    name.textContent = companion.name; // 동료 이름
    const job = document.createElement("p"); // 직군 문구 요소
    job.className = "companion-job"; // 직군 문구 스타일
    job.textContent = `${companion.english} · ${companion.job}`; // 영문 이름과 직군
    const description = document.createElement("p"); // 설명 문구 요소
    description.className = "companion-description"; // 설명 문구 스타일
    description.textContent = companion.description; // 동료 설명
    const tags = document.createElement("div"); // 키워드 묶음 요소
    tags.className = "companion-tags"; // 키워드 묶음 스타일
    companion.keywords.forEach((keyword) => // 키워드 반복
    { // 반복 시작
        const tag = document.createElement("span"); // 키워드 요소
        tag.textContent = `#${keyword}`; // 해시태그 형식 키워드
        tags.append(tag); // 키워드 연결
    }); // 반복 끝
    info.append(role, name, job, description, tags); // 설명 자리 내용 연결
    return info; // 설명 자리 반환
} // 함수 끝
function renderCompanionDots() // 동료 위치 점 생성
{ // 함수 시작
    if (!companionDots) // 위치 점 영역 누락 확인
    { // 조건 시작
        return; // 생성 생략
    } // 조건 끝
    const dots = visibleCompanions.map((companion, index) => // 동료별 위치 점 생성
    { // 생성 시작
        const dot = document.createElement("button"); // 위치 점 버튼
        dot.type = "button"; // 일반 버튼 형식
        dot.className = "companion-dot"; // 위치 점 스타일
        dot.setAttribute("aria-label", `${companion.name} 보기`); // 위치 점 접근성 이름
        dot.addEventListener("click", () => showCompanion(index)); // 위치 점 선택 이동
        return dot; // 위치 점 반환
    }); // 생성 끝
    companionDots.replaceChildren(...dots); // 위치 점 교체
    companionDots.hidden = dots.length <= 1; // 단일 결과 위치 점 숨김
} // 함수 끝
function updateCompanionDots() // 현재 위치 점 강조
{ // 함수 시작
    companionDots?.querySelectorAll(".companion-dot").forEach((dot, index) => // 위치 점 반복
    { // 반복 시작
        const active = index === currentCompanionIndex; // 현재 위치 여부
        dot.classList.toggle("active", active); // 강조 표시 갱신
        if (active) // 현재 위치 확인
        { // 조건 시작
            dot.setAttribute("aria-current", "true"); // 현재 위치 표시
        } // 조건 끝
        else // 다른 위치 처리
        { // 조건 시작
            dot.removeAttribute("aria-current"); // 현재 위치 표시 제거
        } // 조건 끝
    }); // 반복 끝
} // 함수 끝
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
    if (!systemPanel || !system) // 패널 또는 데이터 누락 확인
    { // 조건 시작
        return; // 출력 생략
    } // 조건 끝
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
    if (!navToggle || !navLinks) // 메뉴 요소 누락 확인
    { // 조건 시작
        return; // 연결 생략
    } // 조건 끝
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
    const context = canvas?.getContext("2d"); // 2D 그리기 도구
    if (!canvas || !context) // 캔버스 사용 가능 여부 확인
    { // 조건 시작
        return; // 별빛 효과 생략
    } // 조건 끝
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
