export const VERSE_SERVICES_START = "<!-- verse-services:start -->"; // 서비스 홍보 화면 시작 표시
export const VERSE_SERVICES_END = "<!-- verse-services:end -->"; // 서비스 홍보 화면 끝 표시
export const VERSE_SERVICES_PAGE = "main.html"; // 서비스 홍보 화면을 두는 문서
export const VERSE_ACTION_START = "시작하기"; // 이동 버튼 문구
export const VERSE_ACTION_PREPARING = "준비 중"; // 주소 확정 전 버튼 문구
export const VERSE_SISTER_SUFFIX = "의 자매 서비스"; // 같은 계열 안내 문구

export const VERSE_SERVICES = Object.freeze( // Verse 계열 서비스 목록(이름·주소는 이 목록 한 곳에서만 수정)
[ // 목록 시작
    Object.freeze( // 캐릭터 대화 서비스
    { // 서비스 시작
        id: "mate-verse", // 서비스 식별자
        name: "Mate | Verse", // 서비스 이름
        category: "CHARACTER CHAT", // 영문 분류
        url: "http://localhost:3001/", // 이동 주소(임시 로컬 주소, 배포 주소 확정 후 교체)
        sisterOf: "", // 자매 서비스 안내 없음
        titleLines: Object.freeze(["캐릭터와 함께", "이야기를 이어가다"]), // 제목 두 줄
        description: "캐릭터를 고르고 대화를 시작하며 나만의 이야기를 이어가는 캐릭터 대화 서비스의 로컬 시연 페이지입니다.", // 소개 문장
        featuresLabel: "주요 기능", // 특징 목록 이름
        features: Object.freeze(["캐릭터 탐색", "대화 시연", "로컬 보관"]), // 특징 목록
        notice: "임시 로컬 주소 · 배포 주소 확정 후 교체 예정", // 주소 안내
    }), // 서비스 끝
    Object.freeze( // VR 샌드박스 서비스(기획 단계)
    { // 서비스 시작
        id: "atelier-verse", // 서비스 식별자
        name: "Atelier | Verse", // 서비스 이름(가칭, 상표·도메인 확인 전)
        category: "VR SANDBOX", // 영문 분류
        url: "", // 이동 주소(미정, 비워 두면 준비 중 비활성 버튼)
        sisterOf: "mate-verse", // 같은 계열 서비스 식별자
        titleLines: Object.freeze(["나만의 공간을 만들고", "함께 머무르다"]), // 제목 두 줄
        description: "3D 공간에서 자신의 맵을 만들고 꾸민 뒤 다른 사람을 초대해 함께 이용하는 VR 샌드박스 서비스를 기획하고 있습니다.", // 소개 문장
        featuresLabel: "계획 중인 기능", // 특징 목록 이름(주소 확정 전에는 화면에 표시)
        features: Object.freeze(["맵 제작·꾸미기", "아이템 제작·공유", "친구 초대", "새 소식 알림"]), // 계획 중인 특징 목록
        notice: "기획 단계 · 접속 주소 확정 후 연결 예정", // 상태 안내
    }), // 서비스 끝
]); // 목록 끝

function escapeHtml(value) // HTML 특수 문자 처리
{ // 함수 시작
    return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); // 안전 문구 반환
} // 함수 끝

export function isVerseServiceAvailable(service) // 이동 주소 확정 여부
{ // 함수 시작
    return typeof service.url === "string" && service.url.trim() !== ""; // 주소 입력 여부 반환
} // 함수 끝

function renderServiceName(name, className = "") // 번역하지 않는 서비스 이름 표시
{ // 함수 시작
    return `<span${className ? ` class="${className}"` : ""} translate="no">${escapeHtml(name)}</span>`; // 이름 요소 반환
} // 함수 끝

export function renderVerseSlide(service, indent = "", services = VERSE_SERVICES) // 서비스 홍보 화면 하나 생성
{ // 함수 시작
    const available = isVerseServiceAvailable(service); // 이동 가능 여부
    const inner = `${indent}    `; // 화면 안쪽 들여쓰기
    const name = escapeHtml(service.name); // 주석용 서비스 이름
    const sister = services.find((candidate) => candidate.id === service.sisterOf); // 같은 계열 서비스
    const captionId = `verse-features-${service.id}`; // 특징 머리말 식별자
    const features = service.features.map((feature) => `${inner}    <span>${escapeHtml(feature)}</span> <!-- 특징 항목 -->`); // 특징 항목 줄
    const action = available // 버튼 종류 선택
        ? `${inner}    <a class="hero-action primary" href="${escapeHtml(service.url.trim())}" data-i18n-context="service-action">${renderServiceName(service.name)} ${VERSE_ACTION_START}</a> <!-- 서비스 이동 -->` // 이동 버튼
        : `${inner}    <span class="hero-action is-disabled" aria-disabled="true">${VERSE_ACTION_PREPARING}</span> <!-- 주소 확정 전 비활성 버튼 -->`; // 준비 중 버튼
    return [ // 화면 줄 목록
        `${indent}<div class="hero-slide hero-service-slide" data-hero-slide data-verse-service="${escapeHtml(service.id)}" aria-hidden="true" inert> <!-- ${name} 홍보 화면 -->`, // 화면 시작
        `${inner}<p class="hero-promo-label">// ${renderServiceName(service.name, "hero-service-name")} · ${escapeHtml(service.category)}</p> <!-- 서비스 분류 -->`, // 분류 문구
        `${inner}<h2 class="hero-title hero-service-title"> <!-- 서비스 제목 -->`, // 제목 시작
        `${inner}    <span class="line1">${escapeHtml(service.titleLines[0])}</span> <!-- 제목 첫 줄 -->`, // 제목 첫 줄
        `${inner}    <span class="line2">${escapeHtml(service.titleLines[1])}</span> <!-- 제목 둘째 줄 -->`, // 제목 둘째 줄
        `${inner}</h2> <!-- 서비스 제목 끝 -->`, // 제목 끝
        `${inner}<p class="hero-subtitle hero-service-description">${escapeHtml(service.description)}</p> <!-- 서비스 설명 -->`, // 설명 문장
        available // 특징 목록 시작 줄 선택
            ? `${inner}<div class="hero-promo-features" aria-label="${escapeHtml(service.featuresLabel)}"> <!-- 특징 목록 -->` // 제공 중인 특징 목록
            : `${inner}<div class="hero-promo-features" aria-labelledby="${captionId}"> <!-- 계획 중인 특징 목록 -->`, // 계획 중인 특징 목록
        ...(available ? [] : [`${inner}    <strong class="hero-promo-features-caption" id="${captionId}">${escapeHtml(service.featuresLabel)}</strong> <!-- 특징 머리말 -->`]), // 주소 확정 전 머리말
        ...features, // 특징 항목
        `${inner}</div> <!-- 특징 목록 끝 -->`, // 특징 목록 끝
        `${inner}<div class="hero-actions"> <!-- 행동 영역 -->`, // 행동 영역 시작
        action, // 버튼
        `${inner}</div> <!-- 행동 영역 끝 -->`, // 행동 영역 끝
        `${inner}<p class="hero-local-notice">${sister ? `${renderServiceName(sister.name)}${VERSE_SISTER_SUFFIX} · ` : ""}${escapeHtml(service.notice)}</p> <!-- 상태 안내 -->`, // 상태 안내
        `${indent}</div> <!-- ${name} 홍보 화면 끝 -->`, // 화면 끝
    ].join("\n"); // 화면 문자열 반환
} // 함수 끝

export function renderVerseSlides(indent = "", services = VERSE_SERVICES) // 서비스 홍보 화면 묶음 생성
{ // 함수 시작
    return [ // 묶음 줄 목록
        `${indent}${VERSE_SERVICES_START}`, // 묶음 시작 표시
        ...services.map((service) => renderVerseSlide(service, indent, services)), // 서비스별 화면
        `${indent}${VERSE_SERVICES_END}`, // 묶음 끝 표시
    ].join("\n"); // 묶음 문자열 반환
} // 함수 끝

export function applyVerseServices(html, file, services = VERSE_SERVICES) // 문서에 서비스 홍보 화면 적용
{ // 함수 시작
    if (file !== VERSE_SERVICES_PAGE || !html.includes(VERSE_SERVICES_START) || !html.includes(VERSE_SERVICES_END)) // 대상 문서·표시 확인
    { // 조건 시작
        return html; // 변경 없음
    } // 조건 끝
    const eol = html.includes("\r\n") ? "\r\n" : "\n"; // 기존 줄바꿈 형식
    const source = html.replace(/\r\n/g, "\n"); // 줄바꿈 정규화
    const start = source.lastIndexOf("\n", source.indexOf(VERSE_SERVICES_START)) + 1; // 묶음 시작 줄
    const end = source.indexOf("\n", source.indexOf(VERSE_SERVICES_END)); // 묶음 끝 줄
    const indent = source.slice(start).match(/^[ \t]*/)[0]; // 기존 들여쓰기
    return `${source.slice(0, start)}${renderVerseSlides(indent, services)}${source.slice(end < 0 ? source.length : end)}`.replace(/\n/g, eol); // 묶음 교체와 줄바꿈 복원
} // 함수 끝
