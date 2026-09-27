const characterData = [ // 캐릭터 정보를 배열로 저장한다.
    { // 윤서하 캐릭터 데이터를 시작한다.
        name: "윤서하", // 캐릭터 이름을 저장한다.
        faction: "게이트 오더", // 캐릭터 소속을 저장한다.
        role: "전술 지휘관", // 캐릭터 역할을 저장한다.
        summary: "바스티온 외곽 방어선을 관리하는 현장 지휘관입니다.", // 카드에 표시할 짧은 설명을 저장한다.
        body: "게이트 오더 소속 지휘관으로, 시민 보호와 방어선 유지를 최우선으로 생각합니다. 명령 체계를 중시하지만, 현장의 희생을 숫자로만 처리하는 상층부와 자주 충돌합니다.", // 상세 설명을 저장한다.
        combat: "방어 지휘, 지원 명령, 위기 대응", // 전투 역할을 저장한다.
        personality: "냉정함, 책임감, 현실주의", // 캐릭터 성격을 저장한다.
        quote: "방어선이 무너지면, 도시도 무너진다.", // 대표 대사를 저장한다.
        image: "images/characters/seoha.jpg", // 캐릭터 이미지 경로를 저장한다.
        tags: ["지휘관", "방어선", "게이트 오더"] // 검색용 태그를 저장한다.
    }, // 윤서하 캐릭터 데이터를 끝낸다.
    { // 강로한 캐릭터 데이터를 시작한다.
        name: "강로한", // 캐릭터 이름을 저장한다.
        faction: "프론티어", // 캐릭터 소속을 저장한다.
        role: "패스파인더", // 캐릭터 역할을 저장한다.
        summary: "오염지대 이동 경로를 개척하는 프론티어 안내자입니다.", // 카드에 표시할 짧은 설명을 저장한다.
        body: "바스티온 바깥의 폐허와 이계화 지형을 누구보다 잘 아는 개척자입니다. 게이트 오더의 통제를 싫어하지만, 도시가 무너지면 외곽도 끝난다는 사실을 알고 있습니다.", // 상세 설명을 저장한다.
        combat: "정찰, 경로 개척, 함정 탐지", // 전투 역할을 저장한다.
        personality: "능청스러움, 생존 본능, 의리", // 캐릭터 성격을 저장한다.
        quote: "지도에 없는 길이 제일 안전할 때도 있어.", // 대표 대사를 저장한다.
        image: "images/characters/rohan.jpg", // 캐릭터 이미지 경로를 저장한다.
        tags: ["정찰", "프론티어", "외곽"] // 검색용 태그를 저장한다.
    }, // 강로한 캐릭터 데이터를 끝낸다.
    { // 이나겸 캐릭터 데이터를 시작한다.
        name: "이나겸", // 캐릭터 이름을 저장한다.
        faction: "아르카나", // 캐릭터 소속을 저장한다.
        role: "게이트 기술 연구원", // 캐릭터 역할을 저장한다.
        summary: "Arc-Cell과 이계 부산물을 연구하는 아르카나 연구원입니다.", // 카드에 표시할 짧은 설명을 저장한다.
        body: "아르카나 연구소에서 게이트 에너지와 방어 장비를 연구합니다. 기술이 인류를 구할 수 있다고 믿지만, 연구소 내부의 비밀 실험에 점점 의문을 품게 됩니다.", // 상세 설명을 저장한다.
        combat: "장비 분석, 에너지 보조, 약점 파악", // 전투 역할을 저장한다.
        personality: "지적 호기심, 조심스러움, 윤리적 갈등", // 캐릭터 성격을 저장한다.
        quote: "기술은 답이 될 수 있어요. 사용자가 문제일 뿐이죠.", // 대표 대사를 저장한다.
        image: "images/characters/nagyeom.jpg", // 캐릭터 이미지 경로를 저장한다.
        tags: ["연구", "아르카나", "Arc-Cell"] // 검색용 태그를 저장한다.
    }, // 이나겸 캐릭터 데이터를 끝낸다.
    { // 백하린 캐릭터 데이터를 시작한다.
        name: "백하린", // 캐릭터 이름을 저장한다.
        faction: "각성자", // 캐릭터 소속을 저장한다.
        role: "전장 지원 각성자", // 캐릭터 역할을 저장한다.
        summary: "게이트 사건 이후 특수한 감응 능력을 얻은 각성자입니다.", // 카드에 표시할 짧은 설명을 저장한다.
        body: "게이트 발생 이후 이계 에너지에 반응하는 능력을 얻었습니다. 보호 대상이자 전투 자원으로 분류되는 현실에 반발하며, 스스로의 선택권을 지키려 합니다.", // 상세 설명을 저장한다.
        combat: "감응 탐지, 보호막 보조, 위험 예측", // 전투 역할을 저장한다.
        personality: "불안함, 결단력, 공감 능력", // 캐릭터 성격을 저장한다.
        quote: "난 무기가 아니야. 그래도 지킬 사람은 있어.", // 대표 대사를 저장한다.
        image: "images/characters/harin.jpg", // 캐릭터 이미지 경로를 저장한다.
        tags: ["각성자", "보호막", "인권"] // 검색용 태그를 저장한다.
    }, // 백하린 캐릭터 데이터를 끝낸다.
    { // 마르코 캐릭터 데이터를 시작한다.
        name: "마르코", // 캐릭터 이름을 저장한다.
        faction: "프론티어", // 캐릭터 소속을 저장한다.
        role: "스캐빈저", // 캐릭터 역할을 저장한다.
        summary: "게이트 부산물과 폐장비를 회수하는 노련한 수집가입니다.", // 카드에 표시할 짧은 설명을 저장한다.
        body: "버려진 전장에서 쓸 수 있는 것은 무엇이든 회수합니다. 암시장과도 연결되어 있지만, 프론티어 사람들을 먹여 살리기 위한 선은 지키려 합니다.", // 상세 설명을 저장한다.
        combat: "자원 회수, 임시 수리, 보급 보조", // 전투 역할을 저장한다.
        personality: "실리적, 농담 많음, 계산적", // 캐릭터 성격을 저장한다.
        quote: "고철도 살아남는 데 쓰이면 자산이지.", // 대표 대사를 저장한다.
        image: "images/characters/marco.jpg", // 캐릭터 이미지 경로를 저장한다.
        tags: ["자원", "수집", "거래"] // 검색용 태그를 저장한다.
    }, // 마르코 캐릭터 데이터를 끝낸다.
    { // 닥터 레온 캐릭터 데이터를 시작한다.
        name: "닥터 레온", // 캐릭터 이름을 저장한다.
        faction: "아르카나", // 캐릭터 소속을 저장한다.
        role: "프로젝트 책임자", // 캐릭터 역할을 저장한다.
        summary: "게이트 무기화 프로젝트를 이끄는 아르카나 핵심 인물입니다.", // 카드에 표시할 짧은 설명을 저장한다.
        body: "인류가 살아남으려면 금지된 기술도 통제해야 한다고 주장합니다. 바스티온 방어에 큰 도움을 주지만, 그 과정에서 사람을 수단으로 보는 위험한 태도를 보입니다.", // 상세 설명을 저장한다.
        combat: "실험 장비 지원, 특수 무기 제공, 위험한 거래", // 전투 역할을 저장한다.
        personality: "냉혹함, 확신, 목적지향", // 캐릭터 성격을 저장한다.
        quote: "윤리는 살아남은 다음에 논의해도 늦지 않다.", // 대표 대사를 저장한다.
        image: "images/characters/leon.jpg", // 캐릭터 이미지 경로를 저장한다.
        tags: ["실험", "무기화", "아르카나"] // 검색용 태그를 저장한다.
    } // 닥터 레온 캐릭터 데이터를 끝낸다.
]; // 캐릭터 정보 배열을 끝낸다.
const characterCardGrid = document.querySelector("#characterCardGrid"); // 캐릭터 카드가 들어갈 영역을 가져온다.
const characterSearchInput = document.querySelector("#characterSearchInput"); // 캐릭터 검색 입력칸을 가져온다.
const characterFilterButtons = document.querySelectorAll(".character-filter-button"); // 캐릭터 필터 버튼을 모두 가져온다.
const characterResultCount = document.querySelector("#characterResultCount"); // 캐릭터 결과 개수 표시 영역을 가져온다.
const characterDetail = document.querySelector("#characterDetail"); // 캐릭터 상세 패널을 가져온다.
const detailFaction = document.querySelector("#detailFaction"); // 상세 패널의 소속 요소를 가져온다.
const detailName = document.querySelector("#detailName"); // 상세 패널의 이름 요소를 가져온다.
const detailRole = document.querySelector("#detailRole"); // 상세 패널의 역할 요소를 가져온다.
const detailBody = document.querySelector("#detailBody"); // 상세 패널의 설명 요소를 가져온다.
const detailCombat = document.querySelector("#detailCombat"); // 상세 패널의 전투 역할 요소를 가져온다.
const detailPersonality = document.querySelector("#detailPersonality"); // 상세 패널의 성격 요소를 가져온다.
const detailQuote = document.querySelector("#detailQuote"); // 상세 패널의 대표 대사 요소를 가져온다.
let currentCharacterFilter = "전체"; // 현재 캐릭터 필터 값을 저장한다.
let selectedCharacterName = characterData[0].name; // 현재 선택된 캐릭터 이름을 저장한다.
document.addEventListener("DOMContentLoaded", () => // 문서가 준비되면 실행할 이벤트를 등록한다.
{ // 문서 준비 후 실행할 코드를 시작한다.
    renderCharacterCards(characterData); // 처음에는 모든 캐릭터 카드를 표시한다.
    updateCharacterDetail(characterData[0]); // 첫 번째 캐릭터를 상세 패널에 표시한다.
    connectCharacterFilters(); // 캐릭터 필터 버튼 기능을 연결한다.
    connectCharacterSearch(); // 캐릭터 검색 기능을 연결한다.
}); // 문서 준비 이벤트 등록을 끝낸다.
function connectCharacterFilters() // 캐릭터 필터 버튼 기능을 연결하는 함수를 만든다.
{ // 캐릭터 필터 연결 함수 내용을 시작한다.
    characterFilterButtons.forEach((button) => // 모든 캐릭터 필터 버튼을 하나씩 반복한다.
    { // 각 필터 버튼의 기능을 설정한다.
        button.addEventListener("click", () => // 필터 버튼을 클릭했을 때 실행할 이벤트를 등록한다.
        { // 필터 버튼 클릭 시 실행할 코드를 시작한다.
            currentCharacterFilter = button.dataset.filter; // 클릭한 버튼의 필터 값을 저장한다.
            characterFilterButtons.forEach((item) => // 모든 필터 버튼을 하나씩 반복한다.
            { // 모든 필터 버튼의 선택 상태를 해제한다.
                item.classList.remove("active"); // 필터 버튼에서 active 클래스를 제거한다.
            }); // 필터 버튼 반복을 끝낸다.
            button.classList.add("active"); // 클릭한 버튼에 active 클래스를 추가한다.
            applyCharacterSearch(); // 변경된 필터와 검색어를 적용한다.
        }); // 필터 버튼 클릭 이벤트 등록을 끝낸다.
    }); // 필터 버튼 반복을 끝낸다.
} // 캐릭터 필터 연결 함수를 끝낸다.
function connectCharacterSearch() // 캐릭터 검색 입력 기능을 연결하는 함수를 만든다.
{ // 캐릭터 검색 연결 함수 내용을 시작한다.
    characterSearchInput.addEventListener("input", () => // 검색어가 입력될 때 실행할 이벤트를 등록한다.
    { // 검색어 입력 시 실행할 코드를 시작한다.
        applyCharacterSearch(); // 현재 필터와 검색어를 적용한다.
    }); // 검색 입력 이벤트 등록을 끝낸다.
} // 캐릭터 검색 연결 함수를 끝낸다.
function applyCharacterSearch() // 캐릭터 필터와 검색어를 함께 적용하는 함수를 만든다.
{ // 캐릭터 검색 적용 함수 내용을 시작한다.
    const keyword = characterSearchInput.value.trim().toLowerCase(); // 검색어의 앞뒤 공백을 제거하고 소문자로 바꾼다.
    const filteredCharacters = characterData.filter((character) => // 캐릭터 데이터에서 조건에 맞는 항목만 고른다.
    { // 캐릭터 검사 코드를 시작한다.
        const matchesFilter = currentCharacterFilter === "전체" || character.faction === currentCharacterFilter; // 선택한 소속과 캐릭터 소속이 맞는지 확인한다.
        const searchText = `${character.name} ${character.faction} ${character.role} ${character.summary} ${character.tags.join(" ")}`.toLowerCase(); // 검색할 문장을 하나로 합친다.
        const matchesKeyword = keyword === "" || searchText.includes(keyword); // 검색어가 비었거나 캐릭터 정보에 포함되는지 확인한다.
        return matchesFilter && matchesKeyword; // 필터와 검색어가 모두 맞는 캐릭터만 반환한다.
    }); // 캐릭터 필터링을 끝낸다.
    renderCharacterCards(filteredCharacters); // 조건에 맞는 캐릭터 카드를 다시 표시한다.
} // 캐릭터 검색 적용 함수를 끝낸다.
function renderCharacterCards(characters) // 캐릭터 카드를 화면에 표시하는 함수를 만든다.
{ // 캐릭터 카드 표시 함수 내용을 시작한다.
    characterCardGrid.innerHTML = ""; // 기존 캐릭터 카드를 모두 비운다.
    characterResultCount.textContent = `${characters.length}명의 인물`; // 현재 표시되는 캐릭터 수를 표시한다.
    if (characters.length === 0) // 표시할 캐릭터가 없는지 확인한다.
    { // 캐릭터가 없을 때 실행할 코드를 시작한다.
        const emptyMessage = document.createElement("p"); // 빈 결과 문장을 담을 요소를 만든다.
        emptyMessage.className = "empty-message"; // 빈 결과 요소에 CSS 클래스를 붙인다.
        emptyMessage.textContent = "조건에 맞는 캐릭터가 없습니다."; // 빈 결과 안내 문구를 넣는다.
        characterCardGrid.appendChild(emptyMessage); // 빈 결과 문구를 카드 영역에 추가한다.
        return; // 더 이상 카드를 만들지 않고 함수를 끝낸다.
    } // 캐릭터 없음 조건문을 끝낸다.
    characters.forEach((character) => // 표시할 캐릭터를 하나씩 반복한다.
    { // 캐릭터 카드 생성 코드를 시작한다.
        const card = document.createElement("button"); // 캐릭터 카드 버튼 요소를 만든다.
        card.type = "button"; // 카드 버튼 타입을 button으로 설정한다.
        card.className = "character-card"; // 캐릭터 카드 CSS 클래스를 붙인다.
        card.style.setProperty("--image", `url('${character.image}')`); // 캐릭터 이미지 경로를 CSS 변수로 전달한다.
        card.classList.toggle("active", character.name === selectedCharacterName); // 선택된 캐릭터 카드에 active 클래스를 적용한다.
        const content = document.createElement("div"); // 카드 글 내용을 담을 요소를 만든다.
        content.className = "character-card-content"; // 카드 글 내용 요소에 CSS 클래스를 붙인다.
        const faction = document.createElement("span"); // 캐릭터 소속 라벨을 만들 요소를 생성한다.
        faction.className = "card-type"; // 소속 라벨에 CSS 클래스를 붙인다.
        faction.textContent = character.faction; // 소속 라벨에 캐릭터 소속을 넣는다.
        const name = document.createElement("h3"); // 캐릭터 이름 요소를 만든다.
        name.textContent = character.name; // 캐릭터 이름을 넣는다.
        const summary = document.createElement("p"); // 캐릭터 요약 요소를 만든다.
        summary.textContent = character.summary; // 캐릭터 요약을 넣는다.
        content.appendChild(faction); // 카드 글 영역에 소속 라벨을 추가한다.
        content.appendChild(name); // 카드 글 영역에 이름을 추가한다.
        content.appendChild(summary); // 카드 글 영역에 요약을 추가한다.
        card.appendChild(content); // 카드에 글 영역을 추가한다.
        card.addEventListener("click", () => // 캐릭터 카드를 클릭했을 때 실행할 이벤트를 등록한다.
        { // 캐릭터 카드 클릭 시 실행할 코드를 시작한다.
            selectedCharacterName = character.name; // 선택한 캐릭터 이름을 저장한다.
            updateCharacterDetail(character); // 선택한 캐릭터 정보를 상세 패널에 표시한다.
            renderCharacterCards(characters); // 카드 선택 상태를 다시 표시한다.
        }); // 캐릭터 카드 클릭 이벤트 등록을 끝낸다.
        characterCardGrid.appendChild(card); // 완성된 캐릭터 카드를 화면에 추가한다.
    }); // 캐릭터 반복을 끝낸다.
} // 캐릭터 카드 표시 함수를 끝낸다.
function updateCharacterDetail(character) // 캐릭터 상세 패널을 갱신하는 함수를 만든다.
{ // 캐릭터 상세 갱신 함수 내용을 시작한다.
    characterDetail.style.setProperty("--image", `url('${character.image}')`); // 상세 패널 배경 이미지를 변경한다.
    detailFaction.textContent = character.faction; // 상세 패널의 소속을 변경한다.
    detailName.textContent = character.name; // 상세 패널의 이름을 변경한다.
    detailRole.textContent = character.role; // 상세 패널의 역할을 변경한다.
    detailBody.textContent = character.body; // 상세 패널의 설명을 변경한다.
    detailCombat.textContent = character.combat; // 상세 패널의 전투 역할을 변경한다.
    detailPersonality.textContent = character.personality; // 상세 패널의 성격을 변경한다.
    detailQuote.textContent = character.quote; // 상세 패널의 대표 대사를 변경한다.
} // 캐릭터 상세 갱신 함수를 끝낸다.
