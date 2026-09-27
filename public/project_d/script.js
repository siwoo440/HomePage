const loreData = [ // 세계관 카드 데이터를 배열로 저장한다.
    { // 게이트 카드 데이터를 시작한다.
        type: "핵심 개념", // 카드의 분류를 저장한다.
        title: "게이트", // 카드의 제목을 저장한다.
        body: "현실과 이계를 연결하는 불안정한 통로입니다. Project D의 재난, 전투, 자원 갈등이 시작되는 핵심 원인입니다.", // 카드의 설명을 저장한다.
        image: "images/lore/gate.jpg", // 카드에 사용할 이미지 경로를 저장한다.
        tags: ["이계", "재난", "포탈", "전투 원인"] // 검색에 사용할 태그를 저장한다.
    }, // 게이트 카드 데이터를 끝낸다.
    { // 이계화 카드 데이터를 시작한다.
        type: "핵심 개념", // 카드의 분류를 저장한다.
        title: "이계화", // 카드의 제목을 저장한다.
        body: "게이트의 영향으로 지형, 생물, 물질이 기존 세계의 법칙에서 벗어나 변질되는 현상입니다.", // 카드의 설명을 저장한다.
        image: "images/lore/corruption.jpg", // 카드에 사용할 이미지 경로를 저장한다.
        tags: ["변질", "환경", "몬스터", "오염"] // 검색에 사용할 태그를 저장한다.
    }, // 이계화 카드 데이터를 끝낸다.
    { // 각성자 카드 데이터를 시작한다.
        type: "핵심 개념", // 카드의 분류를 저장한다.
        title: "각성자", // 카드의 제목을 저장한다.
        body: "게이트 사태 이후 특별한 능력을 지니게 된 인물입니다. 보호 대상이면서 동시에 군사적 자원으로 취급될 수 있습니다.", // 카드의 설명을 저장한다.
        image: "images/lore/awakened.jpg", // 카드에 사용할 이미지 경로를 저장한다.
        tags: ["능력자", "인권", "전력", "갈등"] // 검색에 사용할 태그를 저장한다.
    }, // 각성자 카드 데이터를 끝낸다.
    { // 바스티온 카드 데이터를 시작한다.
        type: "배경 소재", // 카드의 분류를 저장한다.
        title: "바스티온", // 카드의 제목을 저장한다.
        body: "게이트 위협 속에서 인류가 방어와 생존을 위해 유지하는 핵심 거점입니다. 플레이어의 작전 중심지로 활용하기 좋습니다.", // 카드의 설명을 저장한다.
        image: "images/lore/bastion.jpg", // 카드에 사용할 이미지 경로를 저장한다.
        tags: ["거점", "방어", "생존", "작전 기지"] // 검색에 사용할 태그를 저장한다.
    }, // 바스티온 카드 데이터를 끝낸다.
    { // 게이트 오더 카드 데이터를 시작한다.
        type: "주요 세력", // 카드의 분류를 저장한다.
        title: "게이트 오더", // 카드의 제목을 저장한다.
        body: "게이트 재난을 통제하고 인류 방어선을 유지하려는 조직입니다. 질서와 통제를 중시하는 세력으로 표현할 수 있습니다.", // 카드의 설명을 저장한다.
        image: "images/lore/gate-order.jpg", // 카드에 사용할 이미지 경로를 저장한다.
        tags: ["통제", "군사", "방어선", "질서"] // 검색에 사용할 태그를 저장한다.
    }, // 게이트 오더 카드 데이터를 끝낸다.
    { // 프론티어 카드 데이터를 시작한다.
        type: "주요 세력", // 카드의 분류를 저장한다.
        title: "프론티어", // 카드의 제목을 저장한다.
        body: "위험 지역을 이동하며 생존과 거래를 이어가는 개척자 집단입니다. 거점 밖 세계를 보여주는 세력으로 활용하기 좋습니다.", // 카드의 설명을 저장한다.
        image: "images/lore/frontier.jpg", // 카드에 사용할 이미지 경로를 저장한다.
        tags: ["개척", "생존자", "거래", "외곽 지역"] // 검색에 사용할 태그를 저장한다.
    }, // 프론티어 카드 데이터를 끝낸다.
    { // 아르카나 카드 데이터를 시작한다.
        type: "주요 세력", // 카드의 분류를 저장한다.
        title: "아르카나", // 카드의 제목을 저장한다.
        body: "게이트와 이계 기술을 연구하고 이용하려는 기업형 세력입니다. 기술 발전과 비윤리적 실험의 갈등을 만들 수 있습니다.", // 카드의 설명을 저장한다.
        image: "images/lore/arcana.jpg", // 카드에 사용할 이미지 경로를 저장한다.
        tags: ["기업", "연구", "실험", "이계 기술"] // 검색에 사용할 태그를 저장한다.
    }, // 아르카나 카드 데이터를 끝낸다.
    { // 내부 정치 카드 데이터를 시작한다.
        type: "사건", // 카드의 분류를 저장한다.
        title: "바스티온 내부 정치", // 카드의 제목을 저장한다.
        body: "방어, 자원, 각성자 활용 문제를 두고 바스티온 내부 세력들이 충돌하는 사건 소재입니다.", // 카드의 설명을 저장한다.
        image: "images/lore/bastion-politics.jpg", // 카드에 사용할 이미지 경로를 저장한다.
        tags: ["정치", "권력", "자원", "갈등"] // 검색에 사용할 태그를 저장한다.
    }, // 내부 정치 카드 데이터를 끝낸다.
    { // 각성자 인권 카드 데이터를 시작한다.
        type: "사건", // 카드의 분류를 저장한다.
        title: "각성자 인권 문제", // 카드의 제목을 저장한다.
        body: "각성자를 보호해야 할 시민으로 볼지, 게이트 대응을 위한 전략 자산으로 볼지를 두고 갈등이 발생합니다.", // 카드의 설명을 저장한다.
        image: "images/lore/awakened-rights.jpg", // 카드에 사용할 이미지 경로를 저장한다.
        tags: ["인권", "각성자", "윤리", "전쟁 자원"] // 검색에 사용할 태그를 저장한다.
    }, // 각성자 인권 카드 데이터를 끝낸다.
    { // 암시장 카드 데이터를 시작한다.
        type: "사건", // 카드의 분류를 저장한다.
        title: "게이트 암시장", // 카드의 제목을 저장한다.
        body: "게이트 부산물, 금지 기술, 불법 장비가 거래되는 어두운 경제권입니다. 서브 퀘스트 소재로 사용하기 좋습니다.", // 카드의 설명을 저장한다.
        image: "images/lore/black-market.jpg", // 카드에 사용할 이미지 경로를 저장한다.
        tags: ["암시장", "불법 거래", "장비", "부산물"] // 검색에 사용할 태그를 저장한다.
    } // 암시장 카드 데이터를 끝낸다.
]; // 세계관 카드 데이터 배열을 끝낸다.
const cardGrid = document.querySelector("#cardGrid"); // 카드 슬라이드가 들어갈 영역을 가져온다.
const cardDots = document.querySelector("#cardDots"); // 카드 위치 점 버튼 영역을 가져온다.
const searchInput = document.querySelector("#searchInput"); // 검색 입력칸을 가져온다.
const filterButtons = document.querySelectorAll(".filter-button"); // 모든 필터 버튼을 가져온다.
const resultCount = document.querySelector("#resultCount"); // 결과 개수 표시 영역을 가져온다.
const prevCardButton = document.querySelector("#prevCardButton"); // 이전 카드 버튼을 가져온다.
const nextCardButton = document.querySelector("#nextCardButton"); // 다음 카드 버튼을 가져온다.
let currentFilter = "전체"; // 현재 선택된 필터 값을 저장한다.
let currentSlideIndex = 0; // 현재 보고 있는 카드 번호를 저장한다.
let currentItems = []; // 현재 조건에 맞는 카드 목록을 저장한다.
document.addEventListener("DOMContentLoaded", () => // 문서가 모두 준비되면 실행할 이벤트를 등록한다.
{ // 문서 준비 후 실행할 코드를 시작한다.
    renderCards(loreData); // 처음에는 모든 세계관 카드를 표시한다.
    connectFilterButtons(); // 필터 버튼 클릭 기능을 연결한다.
    connectSearchInput(); // 검색 입력 기능을 연결한다.
    connectCarouselButtons(); // 슬라이더 화살표 버튼 기능을 연결한다.
    connectKeyboardControls(); // 키보드 방향키 기능을 연결한다.
}); // 문서 준비 이벤트 등록을 끝낸다.
function connectFilterButtons() // 필터 버튼에 클릭 기능을 연결하는 함수를 만든다.
{ // 필터 버튼 연결 함수 내용을 시작한다.
    filterButtons.forEach((button) => // 모든 필터 버튼을 하나씩 반복한다.
    { // 각 필터 버튼에서 실행할 코드를 시작한다.
        button.addEventListener("click", () => // 버튼을 클릭했을 때 실행할 이벤트를 등록한다.
        { // 클릭 시 실행할 코드를 시작한다.
            currentFilter = button.dataset.filter; // 클릭한 버튼의 분류 값을 현재 필터로 저장한다.
            updateActiveButton(button); // 선택된 버튼 표시 상태를 갱신한다.
            applyFilterAndSearch(); // 현재 필터와 검색어로 카드를 다시 표시한다.
        }); // 버튼 클릭 이벤트 등록을 끝낸다.
    }); // 필터 버튼 반복을 끝낸다.
} // 필터 버튼 연결 함수를 끝낸다.
function connectSearchInput() // 검색 입력칸에 입력 기능을 연결하는 함수를 만든다.
{ // 검색 입력 연결 함수 내용을 시작한다.
    searchInput.addEventListener("input", () => // 검색창에 글자가 입력될 때 실행할 이벤트를 등록한다.
    { // 입력 시 실행할 코드를 시작한다.
        applyFilterAndSearch(); // 현재 필터와 검색어로 카드를 다시 표시한다.
    }); // 검색 입력 이벤트 등록을 끝낸다.
} // 검색 입력 연결 함수를 끝낸다.
function connectCarouselButtons() // 슬라이더 화살표 버튼에 클릭 기능을 연결하는 함수를 만든다.
{ // 슬라이더 버튼 연결 함수 내용을 시작한다.
    prevCardButton.addEventListener("click", () => // 이전 버튼을 클릭했을 때 실행할 이벤트를 등록한다.
    { // 이전 버튼 클릭 시 실행할 코드를 시작한다.
        goToSlide(currentSlideIndex - 1); // 현재 카드보다 하나 앞의 카드로 이동한다.
    }); // 이전 버튼 클릭 이벤트 등록을 끝낸다.
    nextCardButton.addEventListener("click", () => // 다음 버튼을 클릭했을 때 실행할 이벤트를 등록한다.
    { // 다음 버튼 클릭 시 실행할 코드를 시작한다.
        goToSlide(currentSlideIndex + 1); // 현재 카드보다 하나 뒤의 카드로 이동한다.
    }); // 다음 버튼 클릭 이벤트 등록을 끝낸다.
} // 슬라이더 버튼 연결 함수를 끝낸다.
function connectKeyboardControls() // 키보드 방향키로 슬라이더를 조작하는 함수를 만든다.
{ // 키보드 조작 함수 내용을 시작한다.
    document.addEventListener("keydown", (event) => // 키보드를 눌렀을 때 실행할 이벤트를 등록한다.
    { // 키보드 입력 시 실행할 코드를 시작한다.
        if (event.key === "ArrowLeft") // 왼쪽 방향키를 눌렀는지 확인한다.
        { // 왼쪽 방향키 조건문을 시작한다.
            goToSlide(currentSlideIndex - 1); // 이전 카드로 이동한다.
        } // 왼쪽 방향키 조건문을 끝낸다.
        if (event.key === "ArrowRight") // 오른쪽 방향키를 눌렀는지 확인한다.
        { // 오른쪽 방향키 조건문을 시작한다.
            goToSlide(currentSlideIndex + 1); // 다음 카드로 이동한다.
        } // 오른쪽 방향키 조건문을 끝낸다.
    }); // 키보드 입력 이벤트 등록을 끝낸다.
} // 키보드 조작 함수를 끝낸다.
function updateActiveButton(selectedButton) // 선택된 버튼의 active 상태를 갱신하는 함수를 만든다.
{ // 버튼 상태 갱신 함수 내용을 시작한다.
    filterButtons.forEach((button) => // 모든 필터 버튼을 하나씩 반복한다.
    { // 각 버튼의 상태를 바꾸는 코드를 시작한다.
        button.classList.remove("active"); // 모든 버튼에서 active 클래스를 제거한다.
    }); // 모든 버튼 반복을 끝낸다.
    selectedButton.classList.add("active"); // 클릭한 버튼에 active 클래스를 추가한다.
} // 버튼 상태 갱신 함수를 끝낸다.
function applyFilterAndSearch() // 필터와 검색어를 함께 적용하는 함수를 만든다.
{ // 필터와 검색어 적용 함수 내용을 시작한다.
    const keyword = searchInput.value.trim().toLowerCase(); // 검색어의 앞뒤 공백을 없애고 소문자로 바꾼다.
    const filteredItems = loreData.filter((item) => // 전체 데이터에서 조건에 맞는 항목만 골라낸다.
    { // 각 항목 검사 코드를 시작한다.
        const matchesFilter = currentFilter === "전체" || item.type === currentFilter; // 현재 필터와 카드 분류가 맞는지 확인한다.
        const searchText = `${item.type} ${item.title} ${item.body} ${item.tags.join(" ")}`.toLowerCase(); // 검색할 문장을 하나로 합친다.
        const matchesKeyword = keyword === "" || searchText.includes(keyword); // 검색어가 비었거나 카드 내용에 포함되는지 확인한다.
        return matchesFilter && matchesKeyword; // 두 조건이 모두 맞는 항목만 반환한다.
    }); // 데이터 필터링을 끝낸다.
    renderCards(filteredItems); // 조건에 맞는 카드만 다시 표시한다.
} // 필터와 검색어 적용 함수를 끝낸다.
function renderCards(items) // 카드 목록을 화면에 그리는 함수를 만든다.
{ // 카드 그리기 함수 내용을 시작한다.
    currentItems = items; // 현재 표시 중인 카드 목록을 저장한다.
    currentSlideIndex = 0; // 새 목록을 보여줄 때 첫 번째 카드로 이동한다.
    cardGrid.innerHTML = ""; // 기존에 표시된 카드를 모두 비운다.
    cardDots.innerHTML = ""; // 기존에 표시된 점 버튼을 모두 비운다.
    resultCount.textContent = `${items.length}개의 항목`; // 현재 표시할 카드 개수를 문장으로 표시한다.
    if (items.length === 0) // 표시할 카드가 없는지 확인한다.
    { // 카드가 없을 때 실행할 코드를 시작한다.
        const emptyMessage = document.createElement("p"); // 빈 결과 안내 문장을 만들 요소를 생성한다.
        emptyMessage.className = "empty-message"; // 빈 결과 안내 문장에 CSS 클래스를 붙인다.
        emptyMessage.textContent = "검색 조건에 맞는 세계관 항목이 없습니다."; // 빈 결과 안내 문구를 넣는다.
        cardGrid.appendChild(emptyMessage); // 빈 결과 안내 문장을 카드 영역에 추가한다.
        updateCarouselPosition(); // 슬라이더 위치와 버튼 상태를 갱신한다.
        return; // 더 이상 카드를 만들지 않고 함수를 끝낸다.
    } // 카드가 없을 때의 조건문을 끝낸다.
    items.forEach((item) => // 표시할 카드 데이터를 하나씩 반복한다.
    { // 각 카드 생성 코드를 시작한다.
        const card = document.createElement("article"); // 카드 역할을 할 article 요소를 만든다.
        card.className = "lore-card"; // 카드 요소에 CSS 클래스를 붙인다.
        const image = document.createElement("div"); // 카드 이미지 영역을 만들 div 요소를 생성한다.
        image.className = "card-image"; // 카드 이미지 영역에 CSS 클래스를 붙인다.
        image.style.setProperty("--image", `url('${item.image}')`); // 카드 이미지 경로를 CSS 변수로 전달한다.
        const cardBody = document.createElement("div"); // 카드 글 영역을 만들 div 요소를 생성한다.
        cardBody.className = "card-body"; // 카드 글 영역에 CSS 클래스를 붙인다.
        const type = document.createElement("span"); // 카드 분류를 표시할 span 요소를 만든다.
        type.className = "card-type"; // 분류 요소에 CSS 클래스를 붙인다.
        type.textContent = item.type; // 분류 요소에 카드 분류 이름을 넣는다.
        const title = document.createElement("h3"); // 카드 제목을 표시할 h3 요소를 만든다.
        title.textContent = item.title; // 제목 요소에 카드 제목을 넣는다.
        const body = document.createElement("p"); // 카드 설명을 표시할 p 요소를 만든다.
        body.textContent = item.body; // 설명 요소에 카드 설명을 넣는다.
        const tagList = document.createElement("div"); // 태그 목록을 담을 div 요소를 만든다.
        tagList.className = "tag-list"; // 태그 목록 요소에 CSS 클래스를 붙인다.
        item.tags.forEach((tag) => // 카드 태그를 하나씩 반복한다.
        { // 각 태그 생성 코드를 시작한다.
            const tagItem = document.createElement("span"); // 개별 태그를 표시할 span 요소를 만든다.
            tagItem.textContent = `#${tag}`; // 태그 앞에 샵 기호를 붙여 표시한다.
            tagList.appendChild(tagItem); // 만든 태그를 태그 목록에 추가한다.
        }); // 태그 반복을 끝낸다.
        cardBody.appendChild(type); // 카드 글 영역에 분류 요소를 추가한다.
        cardBody.appendChild(title); // 카드 글 영역에 제목 요소를 추가한다.
        cardBody.appendChild(body); // 카드 글 영역에 설명 요소를 추가한다.
        cardBody.appendChild(tagList); // 카드 글 영역에 태그 목록 요소를 추가한다.
        card.appendChild(image); // 카드에 이미지 영역을 추가한다.
        card.appendChild(cardBody); // 카드에 글 영역을 추가한다.
        cardGrid.appendChild(card); // 완성된 카드를 카드 트랙에 추가한다.
    }); // 카드 데이터 반복을 끝낸다.
    createDots(items.length); // 카드 개수만큼 점 버튼을 만든다.
    updateCarouselPosition(); // 첫 번째 카드 위치로 슬라이더를 갱신한다.
} // 카드 그리기 함수를 끝낸다.
function createDots(count) // 카드 위치를 나타내는 점 버튼을 만드는 함수를 만든다.
{ // 점 버튼 생성 함수 내용을 시작한다.
    for (let index = 0; index < count; index += 1) // 카드 개수만큼 반복한다.
    { // 점 버튼 반복문을 시작한다.
        const dot = document.createElement("button"); // 점 버튼 요소를 만든다.
        dot.className = "card-dot"; // 점 버튼에 CSS 클래스를 붙인다.
        dot.type = "button"; // 점 버튼 타입을 button으로 지정한다.
        dot.setAttribute("aria-label", `${index + 1}번 카드 보기`); // 화면 읽기 도구용 설명을 넣는다.
        dot.addEventListener("click", () => // 점 버튼을 클릭했을 때 실행할 이벤트를 등록한다.
        { // 점 버튼 클릭 시 실행할 코드를 시작한다.
            goToSlide(index); // 클릭한 점에 해당하는 카드로 이동한다.
        }); // 점 버튼 클릭 이벤트 등록을 끝낸다.
        cardDots.appendChild(dot); // 완성된 점 버튼을 점 버튼 영역에 추가한다.
    } // 점 버튼 반복문을 끝낸다.
} // 점 버튼 생성 함수를 끝낸다.
function goToSlide(index) // 원하는 번호의 카드로 이동하는 함수를 만든다.
{ // 카드 이동 함수 내용을 시작한다.
    if (currentItems.length === 0) // 현재 표시할 카드가 없는지 확인한다.
    { // 카드가 없을 때의 조건문을 시작한다.
        return; // 이동할 카드가 없으므로 함수를 끝낸다.
    } // 카드가 없을 때의 조건문을 끝낸다.
    const lastIndex = currentItems.length - 1; // 마지막 카드 번호를 계산한다.
    const nextIndex = Math.max(0, Math.min(index, lastIndex)); // 이동할 번호가 범위를 벗어나지 않게 제한한다.
    currentSlideIndex = nextIndex; // 현재 카드 번호를 새 번호로 저장한다.
    updateCarouselPosition(); // 카드 트랙 위치를 새 번호에 맞게 갱신한다.
} // 카드 이동 함수를 끝낸다.
function updateCarouselPosition() // 슬라이더 위치와 버튼 상태를 갱신하는 함수를 만든다.
{ // 슬라이더 갱신 함수 내용을 시작한다.
    cardGrid.style.transform = `translateX(-${currentSlideIndex * 100}%)`; // 현재 카드 번호만큼 카드 트랙을 왼쪽으로 이동시킨다.
    const dots = cardDots.querySelectorAll(".card-dot"); // 모든 점 버튼을 가져온다.
    dots.forEach((dot, index) => // 점 버튼을 하나씩 반복한다.
    { // 점 버튼 상태 갱신 반복문을 시작한다.
        dot.classList.toggle("active", index === currentSlideIndex); // 현재 카드 번호와 같은 점만 active로 표시한다.
    }); // 점 버튼 반복을 끝낸다.
    prevCardButton.disabled = currentSlideIndex === 0 || currentItems.length === 0; // 첫 카드이거나 카드가 없으면 이전 버튼을 비활성화한다.
    nextCardButton.disabled = currentSlideIndex === currentItems.length - 1 || currentItems.length === 0; // 마지막 카드이거나 카드가 없으면 다음 버튼을 비활성화한다.
} // 슬라이더 갱신 함수를 끝낸다.
