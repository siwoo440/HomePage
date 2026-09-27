const inputData = [ // 전투 입력 유형 데이터를 저장한다.
    { key: "Tap", type: "탭", title: "기본 공격", guide: "해당 키 단타 입력", desc: "노트가 판정선에 닿는 순간 한 번 눌러 기본 공격을 발동합니다.", image: "assets/tutorial/tutorial_tap.png" }, // Tap 입력 설명과 이미지를 저장한다.
    { key: "Hold", type: "홀드", title: "방어 / 차지 공격", guide: "키를 누른 채 유지", desc: "노트가 활성화된 동안 키를 유지해 방어하거나 차지 공격을 준비합니다.", image: "assets/tutorial/tutorial_hold.png" }, // Hold 입력 설명과 이미지를 저장한다.
    { key: "Flick", type: "플릭", title: "회피기 발동", guide: "빠르게 방향 전환 입력", desc: "지정된 방향으로 빠르게 튕겨 보스의 위협적인 공격을 회피합니다.", image: "assets/tutorial/tutorial_flick.png" }, // Flick 입력 설명과 이미지를 저장한다.
    { key: "Slide", type: "슬라이드", title: "연속 타격", guide: "연속 방향 입력", desc: "경로를 따라 연속으로 입력해 다단 히트 공격을 이어갑니다.", image: "assets/tutorial/tutorial_slide.png" }, // Slide 입력 설명과 이미지를 저장한다.
    { key: "Drag", type: "드래그", title: "스킬 게이지 충전", guide: "길게 끌어당기는 입력", desc: "경로를 누른 채 끌어 스킬 게이지를 채우고 강한 스킬 발동을 준비합니다.", image: "assets/tutorial/tutorial_drag.png" } // Drag 입력 설명과 이미지를 저장한다.
]; // 전투 입력 유형 데이터 선언을 끝낸다.

const characterData = [ // 캐릭터 소개 슬라이드 데이터를 저장한다.
    { code: "Resonant 01", name: "주인공", role: "올라운더", quote: "리듬이 이어지는 한, 아직 전투는 끝나지 않았어.", desc: "공격과 방어가 균형 잡힌 기본형 캐릭터입니다. 초반 조작 학습과 안정적인 스토리 진행에 적합합니다.", symbol: "♪", color: "cyan", stats: { attack: 3, defense: 3, hp: 3, skill: 3, fever: 3 } }, // 주인공 데이터를 저장한다.
    { code: "Resonant 02", name: "캐릭터 2", role: "딜러", quote: "한 박자만 맞으면, 다음 공격은 내가 끝낼게.", desc: "공격력이 높지만 체력이 낮아 정확한 입력이 중요합니다. Perfect 판정과 콤보 유지 보상이 큰 캐릭터입니다.", symbol: "✦", color: "pink", stats: { attack: 5, defense: 1, hp: 2, skill: 4, fever: 3 } }, // 딜러 데이터를 저장한다.
    { code: "Resonant 03", name: "캐릭터 3", role: "서포터", quote: "흐름을 놓치지 마. 내가 박자를 받쳐줄게.", desc: "콤보 유지와 회복에 특화되어 협동 모드에 적합합니다. 아군 보조와 게이지 관리에 강점을 가집니다.", symbol: "◆", color: "violet", stats: { attack: 2, defense: 3, hp: 3, skill: 5, fever: 4 } }, // 서포터 데이터를 저장한다.
    { code: "Resonant 04", name: "캐릭터 4", role: "탱커", quote: "흔들려도 괜찮아. 박자는 내가 버틸게.", desc: "체력과 방어력이 높아 생존 플레이에 강합니다. Miss 이후 피해를 줄이고 보스 패턴을 안정적으로 버팁니다.", symbol: "■", color: "gold", stats: { attack: 2, defense: 5, hp: 5, skill: 2, fever: 2 } } // 탱커 데이터를 저장한다.
]; // 캐릭터 소개 슬라이드 데이터 선언을 끝낸다.

const modeData = { // 모드별 상세 설명 데이터를 저장한다.
    story: { title: "스토리 모드", desc: "주인공이 리소넌트로 각성하고, 사일런트 존을 정화하며 노이즈의 근원을 추적하는 메인 진행 모드입니다." }, // 스토리 모드 설명을 저장한다.
    battle: { title: "1vs1 배틀", desc: "같은 곡 또는 지정 곡에서 정확도, 콤보, 피버 운용을 겨루는 경쟁형 모드입니다." }, // 배틀 모드 설명을 저장한다.
    coop: { title: "협동 모드", desc: "최대 2인이 각자 캐릭터를 선택하고 동일 스테이지를 함께 공략하며 파티 시너지 보너스를 활용합니다." }, // 협동 모드 설명을 저장한다.
    season: { title: "이벤트 시즌 모드", desc: "시즌 미션, 한정 장비, 이벤트 스킨, 배틀패스 보상으로 장기 플레이 동기를 제공합니다." } // 시즌 모드 설명을 저장한다.
}; // 모드별 상세 설명 데이터 선언을 끝낸다.

const archiveData = [ // 아카이브 카드 데이터를 저장한다.
    { type: "세계관", title: "리소넌트", desc: "소리를 통해 세계의 에너지를 조율하는 존재입니다.", tags: ["리소넌트", "음악", "능력"] }, // 리소넌트 설명을 저장한다.
    { type: "세계관", title: "노이즈", desc: "음악을 왜곡하고 세계를 잠식하는 적대 존재입니다.", tags: ["노이즈", "적", "왜곡"] }, // 노이즈 설명을 저장한다.
    { type: "세계관", title: "사일런트 존", desc: "노이즈에 잠식된 공간이며 리소넌트만 정화할 수 있습니다.", tags: ["사일런트 존", "정화", "스테이지"] }, // 사일런트 존 설명을 저장한다.
    { type: "전투", title: "피버 타임", desc: "게이지가 가득 차면 자동 발동하며 점수 배율과 연출을 강화합니다.", tags: ["피버", "콤보", "게이지"] }, // 피버 타임 설명을 저장한다.
    { type: "전투", title: "보스 2페이즈", desc: "보스 HP가 낮아지면 BPM 변속이나 레인 추가로 패턴이 강화됩니다.", tags: ["보스", "BPM", "패턴"] }, // 보스 2페이즈 설명을 저장한다.
    { type: "성장", title: "스킬 트리", desc: "공격, 방어, 공명 브랜치에 포인트를 투자해 플레이 스타일을 만듭니다.", tags: ["스킬", "공격", "방어", "공명"] }, // 스킬 트리 설명을 저장한다.
    { type: "성장", title: "악기형 무기", desc: "기타, 신시사이저, 드럼 등으로 공격력과 스킬 충전량을 강화합니다.", tags: ["장비", "무기", "악기"] }, // 악기형 무기 설명을 저장한다.
    { type: "성장", title: "코스튬", desc: "능력치 변화 없이 입장 모션, 스킬 이펙트, 히트 이펙트를 바꿉니다.", tags: ["스킨", "코스튬", "이펙트"] } // 코스튬 설명을 저장한다.
]; // 아카이브 카드 데이터 선언을 끝낸다.

let currentArchiveFilter = "전체"; // 현재 선택된 아카이브 필터를 저장한다.
let currentCharacterIndex = 0; // 현재 선택된 캐릭터 순서를 저장한다.
let currentCombatIndex = 0; // 현재 선택된 전투 입력 순서를 저장한다.

const menuToggle = document.querySelector("#menuToggle"); // 모바일 메뉴 버튼을 가져온다.
const topNav = document.querySelector("#topNav"); // 상단 메뉴 영역을 가져온다.
const combatStep = document.querySelector("#combatStep"); // 전투 페이지 번호 영역을 가져온다.
const combatType = document.querySelector("#combatType"); // 전투 입력 타입 영역을 가져온다.
const combatImage = document.querySelector("#combatImage"); // 전투 튜토리얼 이미지 영역을 가져온다.
const combatKey = document.querySelector("#combatKey"); // 전투 입력 키 라벨 영역을 가져온다.
const combatTitle = document.querySelector("#combatTitle"); // 전투 입력 제목 영역을 가져온다.
const combatGuide = document.querySelector("#combatGuide"); // 전투 입력 요약 영역을 가져온다.
const combatDesc = document.querySelector("#combatDesc"); // 전투 입력 설명 영역을 가져온다.
const combatDots = document.querySelector("#combatDots"); // 전투 페이지 점 목록 영역을 가져온다.
const combatPrev = document.querySelector("#combatPrev"); // 이전 전투 입력 버튼을 가져온다.
const combatNext = document.querySelector("#combatNext"); // 다음 전투 입력 버튼을 가져온다.
const characterSymbol = document.querySelector("#characterSymbol"); // 캐릭터 상징 영역을 가져온다.
const characterPortrait = document.querySelector("#characterPortrait"); // 캐릭터 비주얼 영역을 가져온다.
const characterThumbnails = document.querySelector("#characterThumbnails"); // 캐릭터 썸네일 영역을 가져온다.
const characterCode = document.querySelector("#characterCode"); // 캐릭터 코드명 영역을 가져온다.
const characterName = document.querySelector("#characterName"); // 캐릭터 이름 영역을 가져온다.
const characterRole = document.querySelector("#characterRole"); // 캐릭터 역할 영역을 가져온다.
const characterQuote = document.querySelector("#characterQuote"); // 캐릭터 대사 영역을 가져온다.
const characterDesc = document.querySelector("#characterDesc"); // 캐릭터 설명 영역을 가져온다.
const characterStats = document.querySelector("#characterStats"); // 캐릭터 능력치 영역을 가져온다.
const characterPrev = document.querySelector("#characterPrev"); // 이전 캐릭터 버튼을 가져온다.
const characterNext = document.querySelector("#characterNext"); // 다음 캐릭터 버튼을 가져온다.
const modeDetail = document.querySelector("#modeDetail"); // 모드 상세 설명 영역을 가져온다.
const modeTabs = document.querySelectorAll(".mode-tab"); // 모든 모드 탭 버튼을 가져온다.
const filterGroup = document.querySelector("#filterGroup"); // 필터 버튼 영역을 가져온다.
const archiveSearch = document.querySelector("#archiveSearch"); // 아카이브 검색 입력칸을 가져온다.
const archiveGrid = document.querySelector("#archiveGrid"); // 아카이브 카드 목록 영역을 가져온다.
const archiveCount = document.querySelector("#archiveCount"); // 아카이브 결과 개수 영역을 가져온다.

document.addEventListener("DOMContentLoaded", () => // 문서가 모두 준비되면 실행할 이벤트를 등록한다.
{ // 문서 준비 후 실행할 코드를 시작한다.
    renderCombatDots(); // 전투 페이지 점 목록을 화면에 출력한다.
    renderCombatSlide(); // 현재 전투 입력 소개를 화면에 출력한다.
    connectCombatCarousel(); // 전투 슬라이드 기능을 연결한다.
    renderCharacterThumbnails(); // 캐릭터 썸네일을 화면에 출력한다.
    renderCharacterSlide(); // 선택된 캐릭터 소개를 화면에 출력한다.
    connectCharacterCarousel(); // 캐릭터 슬라이드 기능을 연결한다.
    renderMode("story"); // 기본 모드 설명을 스토리 모드로 출력한다.
    renderFilters(); // 아카이브 필터 버튼을 화면에 출력한다.
    renderArchive(); // 아카이브 카드를 화면에 출력한다.
    connectMenu(); // 모바일 메뉴 기능을 연결한다.
    connectModeTabs(); // 모드 탭 기능을 연결한다.
    connectArchiveSearch(); // 아카이브 검색 기능을 연결한다.
    connectRevealAnimation(); // 스크롤 등장 애니메이션을 연결한다.
}); // 문서 준비 이벤트 등록을 끝낸다.

function connectMenu() // 모바일 메뉴 버튼 기능을 연결한다.
{ // 모바일 메뉴 연결 함수 내용을 시작한다.
    menuToggle.addEventListener("click", () => // 메뉴 버튼을 클릭했을 때 실행할 이벤트를 등록한다.
    { // 메뉴 버튼 클릭 시 실행할 코드를 시작한다.
        topNav.classList.toggle("open"); // 메뉴의 열린 상태를 켜거나 끈다.
    }); // 메뉴 버튼 클릭 이벤트 등록을 끝낸다.
} // 모바일 메뉴 연결 함수를 끝낸다.

function connectCombatCarousel() // 전투 슬라이드 버튼 기능을 연결한다.
{ // 전투 슬라이드 연결 함수 내용을 시작한다.
    combatPrev.addEventListener("click", () => // 이전 버튼 클릭 이벤트를 등록한다.
    { // 이전 버튼 클릭 시 실행할 코드를 시작한다.
        currentCombatIndex = (currentCombatIndex - 1 + inputData.length) % inputData.length; // 이전 입력 순서를 계산한다.
        renderCombatSlide(); // 변경된 전투 입력 소개를 다시 출력한다.
    }); // 이전 버튼 클릭 이벤트 등록을 끝낸다.
    combatNext.addEventListener("click", () => // 다음 버튼 클릭 이벤트를 등록한다.
    { // 다음 버튼 클릭 시 실행할 코드를 시작한다.
        currentCombatIndex = (currentCombatIndex + 1) % inputData.length; // 다음 입력 순서를 계산한다.
        renderCombatSlide(); // 변경된 전투 입력 소개를 다시 출력한다.
    }); // 다음 버튼 클릭 이벤트 등록을 끝낸다.
} // 전투 슬라이드 연결 함수를 끝낸다.

function renderCombatDots() // 전투 페이지 점 목록을 출력한다.
{ // 전투 페이지 점 목록 출력 함수 내용을 시작한다.
    combatDots.innerHTML = inputData.map((item, index) => // 전투 입력 목록을 점 버튼 HTML로 바꾼다.
    { // 점 버튼 변환 코드를 시작한다.
        return `<button class="combat-dot" type="button" data-index="${index}" aria-label="${item.type} 페이지 선택"></button>`; // 점 버튼 HTML을 반환한다.
    }).join(""); // 점 버튼 문자열을 하나로 합친다.
    document.querySelectorAll(".combat-dot").forEach((button) => // 모든 점 버튼을 하나씩 반복한다.
    { // 점 버튼 반복 코드를 시작한다.
        button.addEventListener("click", () => // 점 버튼 클릭 이벤트를 등록한다.
        { // 점 버튼 클릭 시 실행할 코드를 시작한다.
            currentCombatIndex = Number(button.dataset.index); // 선택한 입력 순서를 저장한다.
            renderCombatSlide(); // 선택한 전투 입력 소개를 다시 출력한다.
        }); // 점 버튼 클릭 이벤트 등록을 끝낸다.
    }); // 점 버튼 반복을 끝낸다.
} // 전투 페이지 점 목록 출력 함수를 끝낸다.

function renderCombatSlide() // 선택된 전투 입력 소개를 출력한다.
{ // 전투 입력 소개 출력 함수 내용을 시작한다.
    const item = inputData[currentCombatIndex]; // 현재 전투 입력 데이터를 가져온다.
    combatStep.textContent = `${currentCombatIndex + 1} / ${inputData.length}`; // 현재 페이지 번호를 표시한다.
    combatType.textContent = `입력 타입 : ${item.type}`; // 현재 입력 타입을 표시한다.
    combatImage.src = item.image; // 현재 입력의 튜토리얼 이미지를 표시한다.
    combatImage.alt = `${item.type} 튜토리얼 이미지`; // 현재 입력의 이미지 대체 설명을 설정한다.
    combatKey.textContent = item.key; // 현재 입력 키 라벨을 표시한다.
    combatTitle.textContent = item.title; // 현재 입력 제목을 표시한다.
    combatGuide.textContent = item.guide; // 현재 입력 조작 요약을 표시한다.
    combatDesc.textContent = item.desc; // 현재 입력 상세 설명을 표시한다.
    updateCombatDots(); // 점 버튼 활성 상태를 갱신한다.
} // 전투 입력 소개 출력 함수를 끝낸다.

function updateCombatDots() // 전투 페이지 점 활성 상태를 갱신한다.
{ // 전투 페이지 점 갱신 함수 내용을 시작한다.
    document.querySelectorAll(".combat-dot").forEach((button, index) => // 모든 점 버튼을 하나씩 반복한다.
    { // 점 버튼 반복 코드를 시작한다.
        button.classList.toggle("active", index === currentCombatIndex); // 현재 입력 점 버튼만 활성화한다.
    }); // 점 버튼 반복을 끝낸다.
} // 전투 페이지 점 갱신 함수를 끝낸다.

function connectCharacterCarousel() // 캐릭터 슬라이드 버튼 기능을 연결한다.
{ // 캐릭터 슬라이드 연결 함수 내용을 시작한다.
    characterPrev.addEventListener("click", () => // 이전 버튼 클릭 이벤트를 등록한다.
    { // 이전 버튼 클릭 시 실행할 코드를 시작한다.
        currentCharacterIndex = (currentCharacterIndex - 1 + characterData.length) % characterData.length; // 이전 캐릭터 순서를 계산한다.
        renderCharacterSlide(); // 변경된 캐릭터 소개를 다시 출력한다.
    }); // 이전 버튼 클릭 이벤트 등록을 끝낸다.
    characterNext.addEventListener("click", () => // 다음 버튼 클릭 이벤트를 등록한다.
    { // 다음 버튼 클릭 시 실행할 코드를 시작한다.
        currentCharacterIndex = (currentCharacterIndex + 1) % characterData.length; // 다음 캐릭터 순서를 계산한다.
        renderCharacterSlide(); // 변경된 캐릭터 소개를 다시 출력한다.
    }); // 다음 버튼 클릭 이벤트 등록을 끝낸다.
} // 캐릭터 슬라이드 연결 함수를 끝낸다.

function renderCharacterThumbnails() // 캐릭터 썸네일 버튼을 출력한다.
{ // 캐릭터 썸네일 출력 함수 내용을 시작한다.
    characterThumbnails.innerHTML = characterData.map((character, index) => // 캐릭터 데이터를 썸네일 HTML로 바꾼다.
    { // 썸네일 변환 코드를 시작한다.
        return `<button class="character-thumb" type="button" data-index="${index}" aria-label="${character.name} 선택"><span>${character.symbol}</span></button>`; // 썸네일 버튼 HTML을 반환한다.
    }).join(""); // 썸네일 문자열을 하나로 합친다.
    document.querySelectorAll(".character-thumb").forEach((button) => // 모든 썸네일 버튼을 하나씩 반복한다.
    { // 썸네일 버튼 반복 코드를 시작한다.
        button.addEventListener("click", () => // 썸네일 클릭 이벤트를 등록한다.
        { // 썸네일 클릭 시 실행할 코드를 시작한다.
            currentCharacterIndex = Number(button.dataset.index); // 선택한 캐릭터 순서를 저장한다.
            renderCharacterSlide(); // 선택한 캐릭터 소개를 다시 출력한다.
        }); // 썸네일 클릭 이벤트 등록을 끝낸다.
    }); // 썸네일 버튼 반복을 끝낸다.
} // 캐릭터 썸네일 출력 함수를 끝낸다.

function renderCharacterSlide() // 선택된 캐릭터 소개를 출력한다.
{ // 캐릭터 소개 출력 함수 내용을 시작한다.
    const character = characterData[currentCharacterIndex]; // 현재 캐릭터 데이터를 가져온다.
    characterSymbol.textContent = character.symbol; // 캐릭터 상징 문양을 표시한다.
    characterPortrait.textContent = character.symbol; // 캐릭터 비주얼 문양을 표시한다.
    characterPortrait.dataset.color = character.color; // 캐릭터 색상 속성을 저장한다.
    characterCode.textContent = character.code; // 캐릭터 코드명을 표시한다.
    characterName.textContent = character.name; // 캐릭터 이름을 표시한다.
    characterRole.textContent = `${character.role} · CV : 미정`; // 캐릭터 역할 정보를 표시한다.
    characterQuote.textContent = `“${character.quote}”`; // 캐릭터 대사를 표시한다.
    characterDesc.textContent = character.desc; // 캐릭터 설명을 표시한다.
    characterStats.innerHTML = makeStats(character.stats); // 캐릭터 능력치를 표시한다.
    updateCharacterThumbnails(); // 썸네일 활성 상태를 갱신한다.
} // 캐릭터 소개 출력 함수를 끝낸다.

function updateCharacterThumbnails() // 캐릭터 썸네일 활성 상태를 갱신한다.
{ // 썸네일 갱신 함수 내용을 시작한다.
    document.querySelectorAll(".character-thumb").forEach((button, index) => // 모든 썸네일 버튼을 하나씩 반복한다.
    { // 썸네일 버튼 반복 코드를 시작한다.
        button.classList.toggle("active", index === currentCharacterIndex); // 현재 캐릭터 버튼만 활성화한다.
    }); // 썸네일 버튼 반복을 끝낸다.
} // 썸네일 갱신 함수를 끝낸다.

function makeStats(stats) // 능력치 막대 HTML을 만든다.
{ // 능력치 생성 함수 내용을 시작한다.
    const labels = { attack: "공격력", defense: "방어력", hp: "체력", skill: "스킬", fever: "피버" }; // 능력치 이름을 저장한다.
    return `<div class="stat-list">${Object.keys(stats).map((key) => // 능력치 키 목록을 반복해 HTML로 바꾼다.
    { // 능력치 한 줄 변환 코드를 시작한다.
        const width = stats[key] * 20; // 5점 만점을 퍼센트 너비로 변환한다.
        return `<div class="stat-row"><span>${labels[key]}</span><div class="stat-bar"><span style="width:${width}%"></span></div></div>`; // 능력치 한 줄 HTML을 반환한다.
    }).join("")}</div>`; // 능력치 전체 HTML을 반환한다.
} // 능력치 생성 함수를 끝낸다.

function connectModeTabs() // 모드 탭 버튼 기능을 연결한다.
{ // 모드 탭 연결 함수 내용을 시작한다.
    modeTabs.forEach((button) => // 모든 모드 버튼을 하나씩 반복한다.
    { // 모드 버튼 반복 코드를 시작한다.
        button.addEventListener("click", () => // 모드 버튼을 클릭했을 때 실행할 이벤트를 등록한다.
        { // 모드 버튼 클릭 시 실행할 코드를 시작한다.
            modeTabs.forEach((item) => item.classList.remove("active")); // 모든 모드 버튼의 활성 표시를 제거한다.
            button.classList.add("active"); // 클릭한 모드 버튼에 활성 표시를 추가한다.
            renderMode(button.dataset.mode); // 클릭한 모드의 설명을 출력한다.
        }); // 모드 버튼 클릭 이벤트 등록을 끝낸다.
    }); // 모드 버튼 반복을 끝낸다.
} // 모드 탭 연결 함수를 끝낸다.

function renderMode(modeKey) // 선택된 모드 설명을 출력한다.
{ // 모드 설명 출력 함수 내용을 시작한다.
    const mode = modeData[modeKey]; // 선택된 모드 데이터를 가져온다.
    modeDetail.innerHTML = `<h3>${mode.title}</h3><p>${mode.desc}</p>`; // 모드 상세 영역에 제목과 설명을 넣는다.
} // 모드 설명 출력 함수를 끝낸다.

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
            renderFilters(); // 필터 버튼의 활성 상태를 다시 출력한다.
            renderArchive(); // 필터 조건에 맞춰 아카이브를 다시 출력한다.
        }); // 필터 버튼 클릭 이벤트 등록을 끝낸다.
    }); // 필터 버튼 반복을 끝낸다.
} // 필터 출력 함수를 끝낸다.

function connectArchiveSearch() // 아카이브 검색 기능을 연결한다.
{ // 아카이브 검색 연결 함수 내용을 시작한다.
    archiveSearch.addEventListener("input", () => // 검색어가 입력될 때 실행할 이벤트를 등록한다.
    { // 검색어 입력 시 실행할 코드를 시작한다.
        renderArchive(); // 검색어에 맞춰 아카이브를 다시 출력한다.
    }); // 검색 입력 이벤트 등록을 끝낸다.
} // 아카이브 검색 연결 함수를 끝낸다.

function renderArchive() // 아카이브 카드를 출력한다.
{ // 아카이브 출력 함수 내용을 시작한다.
    const keyword = archiveSearch.value.trim().toLowerCase(); // 검색어를 소문자로 정리한다.
    const filteredItems = archiveData.filter((item) => // 아카이브 데이터를 조건에 맞게 거른다.
    { // 아카이브 필터 조건 코드를 시작한다.
        const filterMatched = currentArchiveFilter === "전체" || item.type === currentArchiveFilter; // 현재 분류와 맞는지 확인한다.
        const text = `${item.title} ${item.desc} ${item.tags.join(" ")}`.toLowerCase(); // 검색 대상 문자열을 만든다.
        const keywordMatched = keyword === "" || text.includes(keyword); // 검색어가 비었거나 포함되는지 확인한다.
        return filterMatched && keywordMatched; // 분류와 검색어 조건을 모두 만족하는 항목만 남긴다.
    }); // 아카이브 필터 처리를 끝낸다.
    archiveCount.textContent = `${filteredItems.length}개의 항목`; // 검색 결과 개수를 표시한다.
    archiveGrid.innerHTML = filteredItems.map((item) => // 걸러진 항목을 카드 HTML로 바꾼다.
    { // 아카이브 카드 변환 코드를 시작한다.
        return `<article class="archive-card reveal-item"><small>${item.type}</small><h3>${item.title}</h3><p>${item.desc}</p></article>`; // 아카이브 카드 HTML을 반환한다.
    }).join(""); // 카드 문자열을 하나로 합친다.
    connectRevealAnimation(); // 새로 출력된 카드에 등장 애니메이션을 연결한다.
} // 아카이브 출력 함수를 끝낸다.

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
