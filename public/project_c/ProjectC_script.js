/* ============================================================
   ProjectC_script.js — 카오스폰즈 전용 JavaScript
   포함 기능:
     1. 세계관 카드 슬라이더 (worldSlide)
     2. 탐사 구역 슬라이더 (zoneSlide)
     3. 아카이브 카드 슬라이더 (필터 + 검색 + 슬라이더)
============================================================ */

/* ── 카오스폰즈 세계관 카드 데이터 ── */
const loreData = [ /* 세계관 아카이브 카드 데이터 배열을 시작한다. */
    { /* 첫 번째 카드 데이터를 시작한다. */
        type:  "핵심 개념", /* 카드 분류를 저장한다. */
        title: "네크레이트 (Necraite)", /* 카드 제목을 저장한다. */
        body:  "외계 기원의 오염성 광석. 접촉 대상의 물질 구조를 파괴가 아닌 다른 규칙으로 치환하는 변환(Conversion) 성질을 지닌다. 검은/회청색 결정 형태.", /* 카드 설명을 저장한다. */
        image: "", /* 카드 이미지 경로를 저장한다. (추후 추가) */
        tags:  ["외계", "광석", "오염", "변환"] /* 검색 태그를 저장한다. */
    }, /* 첫 번째 카드 데이터를 끝낸다. */
    {
        type:  "핵심 개념",
        title: "침식현상 (Encroachment)",
        body:  "네크레이트 에너지 노출 시 물질·생명·지형이 서서히 변화하는 현상. 암세포처럼 스스로 증식하며 보라/검은빛 은하수 패턴이 징후로 나타난다.",
        image: "",
        tags:  ["침식", "현상", "확산", "변이"]
    },
    {
        type:  "핵심 개념",
        title: "정신력 시스템 (Sanity)",
        body:  "0~100 범위 수치. 기본값 50. 100에서 각성(Awakening) 3턴, 0에서 붕괴(Collapse) 3턴 발동. 종료 후 50으로 복귀. 아군과 몬스터 모두 동일 규칙으로 적용된다.",
        image: "",
        tags:  ["시스템", "정신력", "각성", "붕괴"]
    },
    {
        type:  "주요 세력",
        title: "아르카나 (Arcana)",
        body:  "복원자(Restoration Unit) 중 최강의 정예 22인. 세룰리온을 기반으로 침식지대를 탐사하며 정화 작전을 수행한다. 라틴어 '비밀(arcana)'에서 유래.",
        image: "",
        tags:  ["캐릭터", "22인", "정예", "정화"]
    },
    {
        type:  "주요 세력",
        title: "세룰리온 (Ceruleon)",
        body:  "침식지대 진입·변성체 감지·정화 작전 수행이 가능한 초장거리 함선형 탐사 장치. 아르카나 22인의 거점. 설비 강화로 메타 성장 가능.",
        image: "",
        tags:  ["거점", "탐사", "함선", "이동기체"]
    },
    {
        type:  "주요 세력",
        title: "어비스 (Abyss)",
        body:  "네크레이트를 가져온 외계 기원 고등 생물. 인간이 이해 불가능한 구조의 존재. 접근 시 정신력 치명 손상 발생. 괴생체를 지배하거나 새로운 변이를 만들어낸다.",
        image: "",
        tags:  ["외계", "보스", "코스믹 호러", "정신력"]
    },
    {
        type:  "사건",
        title: "외래 침식 발생",
        body:  "정체불명 외계 물질 네크레이트가 감지되며 세계 붕괴가 시작됨. 현 과학 기술로는 분석·측정·예측 불가. 생명체 감염→변이→괴생체 변화 연쇄.",
        image: "",
        tags:  ["사건", "시작", "침식", "기원"]
    },
    {
        type:  "사건",
        title: "정화 작전 (Operation Purity)",
        body:  "침식지대 내부 진입→오염 확산 차단→침식핵 파괴를 목표로 한 반복적 공세. 한 번의 승리가 아닌 지속적 전쟁이다.",
        image: "",
        tags:  ["작전", "목표", "반복", "침식핵"]
    },
    {
        type:  "배경 소재",
        title: "방벽지대",
        body:  "침식 확산으로부터 인류 생존권을 지키는 최후의 방어 구획. 거대한 방벽과 관문(Gate)으로 외부와 분리. 모든 정화 작전의 출발점.",
        image: "",
        tags:  ["거점", "방어", "안전", "인류"]
    },
    {
        type:  "배경 소재",
        title: "공백지대 (The Void)",
        body:  "퇴색 근원과 밀접한 최고 난이도 탐사 구역. 매 노드 이동 시 정신력 -1 상시 감소. 색이 사라진 저채도 세계. 엔딩 C 조건 달성 후 해금.",
        image: "",
        tags:  ["구역8", "최상위", "히든", "정신력"]
    },
    {
        type:  "배경 소재",
        title: "침식핵 (Erosion Core)",
        body:  "침식지대 내부에서 오염 확산을 유지하는 핵심 구조물. 정화 작전의 최종 목표로, 파괴 시 해당 지역의 침식 고정점이 무너진다.",
        image: "",
        tags:  ["목표", "구조물", "정화", "파괴"]
    },
    {
        type:  "배경 소재",
        title: "찢겨진 기록",
        body:  "탐사 중 발견하는 수집형 스토리 아이템. 세계관의 진실과 아르카나의 과거를 담고 있으며 엔딩 C 조건(80% 이상 수집)에 사용된다.",
        image: "",
        tags:  ["수집", "스토리", "엔딩C", "기록"]
    }
]; /* 세계관 아카이브 카드 데이터 배열을 끝낸다. */


/* ============================================================
   1. 세계관 슬라이더 (6칸)
============================================================ */
(function () /* 세계관 슬라이더 IIFE를 시작한다. */
{
    const track    = document.getElementById("worldTrack");    /* 세계관 슬라이드 트랙 요소를 가져온다. */
    const dotsWrap = document.getElementById("worldDots");     /* 세계관 인디케이터 래퍼를 가져온다. */
    if (!track || !dotsWrap) return;                           /* 요소가 없으면 실행을 중단한다. */

    const total   = track.children.length;                    /* 전체 슬라이드 수를 구한다. */
    let   current = 0;                                         /* 현재 슬라이드 인덱스를 초기화한다. */

    /* 인디케이터 점 생성 */
    for (let i = 0; i < total; i++)                            /* 슬라이드 수만큼 반복한다. */
    {
        const dot = document.createElement("div");             /* 점 요소를 생성한다. */
        dot.className = "world-slider-dot" + (i === 0 ? " active" : ""); /* 첫 번째 점을 활성 상태로 만든다. */
        dot.onclick = (function (idx) {                        /* 점 클릭 시 해당 슬라이드로 이동하는 함수를 만든다. */
            return function () { goToWorld(idx); };            /* 클릭 이벤트에 이동 함수를 연결한다. */
        })(i);
        dotsWrap.appendChild(dot);                             /* 점을 래퍼에 추가한다. */
    }

    /* 특정 슬라이드로 이동하는 함수 */
    function goToWorld(idx)                                    /* 세계관 슬라이드 이동 함수를 정의한다. */
    {
        current = (idx + total) % total;                       /* 인덱스를 순환 처리한다. */
        track.style.transform = "translateX(-" + (current * 100) + "%)"; /* 트랙을 이동시킨다. */
        Array.from(dotsWrap.children).forEach(function (d, i) /* 모든 점을 순회한다. */
        {
            d.classList.toggle("active", i === current);       /* 현재 인덱스와 일치하는 점만 활성화한다. */
        });
    }

    /* 전역 함수로 등록 — HTML onclick 속성에서 호출 */
    window.worldSlide = function (dir) { goToWorld(current + dir); }; /* 방향 인자를 받아 이동한다. */
})(); /* 세계관 슬라이더 IIFE를 끝낸다. */


/* ============================================================
   2. 탐사 구역 슬라이더 (8칸)
============================================================ */
(function () /* 탐사 구역 슬라이더 IIFE를 시작한다. */
{
    const track    = document.getElementById("zoneTrack");     /* 구역 슬라이드 트랙 요소를 가져온다. */
    const dotsWrap = document.getElementById("zoneDots");      /* 구역 인디케이터 래퍼를 가져온다. */
    if (!track || !dotsWrap) return;                           /* 요소가 없으면 실행을 중단한다. */

    const total   = track.children.length;                    /* 전체 슬라이드 수를 구한다. */
    let   current = 0;                                         /* 현재 슬라이드 인덱스를 초기화한다. */

    /* 인디케이터 점 생성 */
    for (let i = 0; i < total; i++)                            /* 슬라이드 수만큼 반복한다. */
    {
        const dot = document.createElement("div");             /* 점 요소를 생성한다. */
        dot.className = "world-slider-dot" + (i === 0 ? " active" : ""); /* 첫 번째 점을 활성화한다. */
        dot.onclick = (function (idx) {                        /* 점 클릭 이동 함수를 만든다. */
            return function () { goToZone(idx); };
        })(i);
        dotsWrap.appendChild(dot);                             /* 점을 래퍼에 추가한다. */
    }

    /* 구역 슬라이드 이동 함수 */
    function goToZone(idx)                                     /* 구역 슬라이드 이동 함수를 정의한다. */
    {
        current = (idx + total) % total;                       /* 인덱스를 순환 처리한다. */
        track.style.transform = "translateX(-" + (current * 100) + "%)"; /* 트랙을 이동시킨다. */
        Array.from(dotsWrap.children).forEach(function (d, i)
        {
            d.classList.toggle("active", i === current);       /* 현재 점을 활성화한다. */
        });
    }

    /* 전역 함수로 등록 */
    window.zoneSlide = function (dir) { goToZone(current + dir); }; /* 방향 인자를 받아 이동한다. */
})(); /* 탐사 구역 슬라이더 IIFE를 끝낸다. */


/* ============================================================
   3. 아카이브 카드 슬라이더 (필터 + 검색)
============================================================ */
document.addEventListener("DOMContentLoaded", function () /* 문서가 준비되면 아카이브 슬라이더를 초기화한다. */
{
    const cardGrid    = document.querySelector("#cardGrid");     /* 카드 트랙 요소를 가져온다. */
    const cardDots    = document.querySelector("#cardDots");     /* 카드 인디케이터 래퍼를 가져온다. */
    const searchInput = document.querySelector("#searchInput");  /* 검색 입력칸을 가져온다. */
    const filterBtns  = document.querySelectorAll(".filter-button"); /* 모든 필터 버튼을 가져온다. */
    const resultCount = document.querySelector("#resultCount");  /* 결과 개수 표시 요소를 가져온다. */
    const prevBtn     = document.querySelector("#prevCardButton"); /* 이전 버튼을 가져온다. */
    const nextBtn     = document.querySelector("#nextCardButton"); /* 다음 버튼을 가져온다. */

    /* 아카이브 슬라이더가 이 페이지에 없으면 종료한다. */
    if (!cardGrid) return;                                       /* 아카이브 요소 없으면 중단한다. */

    let currentFilter = "전체";                                  /* 현재 필터값을 초기화한다. */
    let currentIndex  = 0;                                       /* 현재 슬라이드 인덱스를 초기화한다. */
    let currentItems  = [];                                      /* 현재 표시 중인 항목 배열을 초기화한다. */

    /* 최초 렌더링 */
    renderCards(loreData);                                       /* 처음에는 모든 카드를 표시한다. */

    /* 필터 버튼 연결 */
    filterBtns.forEach(function (btn)                            /* 모든 필터 버튼을 순회한다. */
    {
        btn.addEventListener("click", function ()                /* 클릭 이벤트를 등록한다. */
        {
            currentFilter = btn.dataset.filter;                  /* 클릭한 버튼의 필터값을 저장한다. */
            filterBtns.forEach(function (b) { b.classList.remove("active"); }); /* 모든 활성 상태를 제거한다. */
            btn.classList.add("active");                         /* 클릭한 버튼을 활성화한다. */
            applyFilter();                                       /* 필터를 적용한다. */
        });
    });

    /* 검색 입력 연결 */
    if (searchInput)                                             /* 검색창이 있을 때만 연결한다. */
    {
        searchInput.addEventListener("input", applyFilter);      /* 입력 시 필터를 적용한다. */
    }

    /* 이전/다음 버튼 연결 */
    if (prevBtn) prevBtn.addEventListener("click", function () { goToCard(currentIndex - 1); }); /* 이전 버튼에 클릭 이벤트를 등록한다. */
    if (nextBtn) nextBtn.addEventListener("click", function () { goToCard(currentIndex + 1); }); /* 다음 버튼에 클릭 이벤트를 등록한다. */

    /* 키보드 방향키 연결 */
    document.addEventListener("keydown", function (e)           /* 키보드 이벤트를 등록한다. */
    {
        if (e.key === "ArrowLeft")  goToCard(currentIndex - 1); /* 왼쪽 방향키 시 이전 카드로 이동한다. */
        if (e.key === "ArrowRight") goToCard(currentIndex + 1); /* 오른쪽 방향키 시 다음 카드로 이동한다. */
    });

    /* 필터 + 검색 적용 함수 */
    function applyFilter()                                       /* 필터와 검색어를 함께 적용하는 함수를 정의한다. */
    {
        const kw = searchInput ? searchInput.value.trim().toLowerCase() : ""; /* 검색어를 소문자로 변환한다. */
        const filtered = loreData.filter(function (item)        /* 조건에 맞는 항목만 추출한다. */
        {
            const matchType = currentFilter === "전체" || item.type === currentFilter; /* 분류 필터를 확인한다. */
            const text = (item.type + " " + item.title + " " + item.body + " " + item.tags.join(" ")).toLowerCase(); /* 검색 대상 문자열을 합친다. */
            const matchKw   = kw === "" || text.includes(kw);   /* 검색어 포함 여부를 확인한다. */
            return matchType && matchKw;                         /* 두 조건 모두 만족하는 항목만 반환한다. */
        });
        renderCards(filtered);                                   /* 필터링된 결과를 렌더링한다. */
    }

    /* 카드 렌더링 함수 */
    function renderCards(items)                                  /* 카드 목록을 화면에 그리는 함수를 정의한다. */
    {
        currentItems = items;                                    /* 현재 항목 배열을 저장한다. */
        currentIndex = 0;                                        /* 첫 번째 카드로 초기화한다. */
        cardGrid.innerHTML = "";                                 /* 기존 카드를 모두 지운다. */
        if (cardDots) cardDots.innerHTML = "";                   /* 기존 인디케이터 점을 지운다. */
        if (resultCount) resultCount.textContent = items.length + "개의 항목"; /* 결과 개수를 표시한다. */

        if (items.length === 0)                                  /* 항목이 없으면 안내 메시지를 표시한다. */
        {
            const msg = document.createElement("p");             /* 안내 메시지 요소를 생성한다. */
            msg.className = "empty-message";                     /* 클래스를 추가한다. */
            msg.textContent = "검색 조건에 맞는 항목이 없습니다."; /* 안내 문구를 넣는다. */
            cardGrid.appendChild(msg);                           /* 메시지를 카드 트랙에 추가한다. */
            updatePosition();                                    /* 슬라이더 상태를 갱신한다. */
            return;                                              /* 함수를 종료한다. */
        }

        items.forEach(function (item)                            /* 각 항목으로 카드를 생성한다. */
        {
            const card     = document.createElement("article"); /* 카드 요소를 생성한다. */
            card.className = "lore-card";                        /* 카드 클래스를 추가한다. */

            const img      = document.createElement("div");     /* 이미지 영역을 생성한다. */
            img.className  = "card-image";                       /* 이미지 클래스를 추가한다. */
            img.style.setProperty("--image", "url('" + item.image + "')"); /* 이미지 경로를 CSS 변수로 전달한다. */

            const body     = document.createElement("div");     /* 본문 영역을 생성한다. */
            body.className = "card-body";                        /* 본문 클래스를 추가한다. */

            const type     = document.createElement("span");    /* 분류 배지를 생성한다. */
            type.className = "card-type";                        /* 분류 클래스를 추가한다. */
            type.textContent = item.type;                        /* 분류 텍스트를 넣는다. */

            const title    = document.createElement("h3");      /* 제목 요소를 생성한다. */
            title.textContent = item.title;                      /* 제목 텍스트를 넣는다. */

            const desc     = document.createElement("p");       /* 설명 요소를 생성한다. */
            desc.textContent = item.body;                        /* 설명 텍스트를 넣는다. */

            const tagList  = document.createElement("div");     /* 태그 목록 요소를 생성한다. */
            tagList.className = "tag-list";                      /* 태그 클래스를 추가한다. */

            item.tags.forEach(function (tag)                     /* 각 태그를 순회한다. */
            {
                const t = document.createElement("span");        /* 개별 태그 요소를 생성한다. */
                t.textContent = "#" + tag;                       /* 태그 앞에 #을 붙여 넣는다. */
                tagList.appendChild(t);                          /* 태그를 목록에 추가한다. */
            });

            body.appendChild(type);                              /* 분류 배지를 본문에 추가한다. */
            body.appendChild(title);                             /* 제목을 본문에 추가한다. */
            body.appendChild(desc);                              /* 설명을 본문에 추가한다. */
            body.appendChild(tagList);                           /* 태그 목록을 본문에 추가한다. */
            card.appendChild(img);                               /* 이미지를 카드에 추가한다. */
            card.appendChild(body);                              /* 본문을 카드에 추가한다. */
            cardGrid.appendChild(card);                          /* 카드를 트랙에 추가한다. */
        });

        /* 인디케이터 점 생성 */
        if (cardDots)                                            /* 인디케이터 래퍼가 있을 때 생성한다. */
        {
            items.forEach(function (_, i)                        /* 항목 수만큼 점을 생성한다. */
            {
                const dot     = document.createElement("button"); /* 점 버튼을 생성한다. */
                dot.className = "card-dot";                      /* 점 클래스를 추가한다. */
                dot.type      = "button";                        /* 버튼 타입을 설정한다. */
                dot.setAttribute("aria-label", (i + 1) + "번 카드 보기"); /* 접근성 레이블을 추가한다. */
                dot.onclick   = (function (idx) { return function () { goToCard(idx); }; })(i); /* 클릭 시 해당 카드로 이동한다. */
                cardDots.appendChild(dot);                       /* 점을 래퍼에 추가한다. */
            });
        }

        updatePosition();                                        /* 슬라이더 위치를 갱신한다. */
    }

    /* 카드 이동 함수 */
    function goToCard(idx)                                       /* 특정 인덱스 카드로 이동하는 함수를 정의한다. */
    {
        if (currentItems.length === 0) return;                   /* 항목이 없으면 중단한다. */
        currentIndex = Math.max(0, Math.min(idx, currentItems.length - 1)); /* 인덱스를 유효 범위로 제한한다. */
        updatePosition();                                        /* 위치를 갱신한다. */
    }

    /* 슬라이더 위치 갱신 함수 */
    function updatePosition()                                    /* 슬라이더 위치와 버튼 상태를 갱신하는 함수를 정의한다. */
    {
        cardGrid.style.transform = "translateX(-" + (currentIndex * 100) + "%)"; /* 트랙을 현재 인덱스만큼 이동시킨다. */

        if (cardDots)                                            /* 인디케이터 점 상태를 갱신한다. */
        {
            Array.from(cardDots.querySelectorAll(".card-dot")).forEach(function (dot, i)
            {
                dot.classList.toggle("active", i === currentIndex); /* 현재 인덱스 점을 활성화한다. */
            });
        }

        if (prevBtn) prevBtn.disabled = currentIndex === 0 || currentItems.length === 0; /* 첫 카드면 이전 버튼을 비활성화한다. */
        if (nextBtn) nextBtn.disabled = currentIndex >= currentItems.length - 1 || currentItems.length === 0; /* 마지막 카드면 다음 버튼을 비활성화한다. */
    }
}); /* DOMContentLoaded 이벤트 핸들러를 끝낸다. */
