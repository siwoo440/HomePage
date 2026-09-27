const DEVELOPMENT_STATUSES = Object.freeze(["developing", "planning", "paused"]); // 개발 상태 목록
const PUBLICATION_STATUSES = Object.freeze(["featured", "developing", "planning"]); // 공개 상태 목록
const LAYOUT_TYPES = Object.freeze(["common", "special"]); // 레이아웃 목록

function toProjectStem(slug) // 프로젝트 파일명 변환
{ // 함수 시작
    return slug.charAt(0).toLocaleUpperCase("en-US") + slug.slice(1); // 첫 글자 대문자 반환
} // 함수 끝

function createProject(record) // 프로젝트 공개 정보 생성
{ // 함수 시작
    const stem = toProjectStem(record.slug); // 파일명 줄기 생성
    return Object.freeze( // 고정 프로젝트 반환
    { // 객체 시작
        id: `project-${record.slug}`, // 프로젝트 식별자
        symbol: record.symbol, // 화면 표시 문자
        title: record.title, // 공개 제목
        tagline: record.tagline, // 한 문장 소개
        genres: Object.freeze([...record.genres]), // 장르 목록
        developmentStatus: record.developmentStatus ?? "developing", // 개발 상태
        publicationStatus: record.publicationStatus ?? "planning", // 공개 상태
        summary: record.summary ?? record.tagline, // 공개 요약
        features: Object.freeze([...(record.features ?? [])]), // 핵심 특징
        heroImage: `/images/games/project-${record.slug}.png`, // 대표 이미지
        detailPath: `/project_${record.slug}/Project${stem}_Main.html`, // 상세 주소
        adultOnly: record.adultOnly ?? false, // 성인 여부
        layout: record.layout ?? "common", // 페이지 레이아웃
        hashtag: `#DEVFORGEProject${stem}`, // 커뮤니티 해시태그
    }); // 객체 끝
} // 함수 끝

export const FEATURED_PROJECT_IDS = Object.freeze( // 대표 프로젝트 순서
[ // 배열 시작
    "project-eta", // 프로젝트 에타
    "project-a", // 프로젝트 에이
    "project-b", // 프로젝트 비
    "project-c", // 프로젝트 씨
    "project-d", // 프로젝트 디
    "project-e", // 프로젝트 이
]); // 배열 끝

export const SPECIAL_PROJECT_IDS = Object.freeze( // 특화 프로젝트 목록
[ // 배열 시작
    "project-b", // 프로젝트 비
    "project-c", // 프로젝트 씨
    "project-d", // 프로젝트 디
    "project-h", // 프로젝트 에이치
    "project-l", // 프로젝트 엘
    "project-eta", // 프로젝트 에타
]); // 배열 끝

export const GAME_PROJECTS = Object.freeze( // 프로젝트 공개 정보 목록
[ // 배열 시작
    createProject({ slug: "a", symbol: "A", title: "프로젝트 A — 아스트로이아", tagline: "별자리가 전선이 되는 세계에서 펼쳐지는 전략 전쟁", genres: ["strategy", "srpg"], publicationStatus: "featured", features: ["별자리 에너지 전략", "세력별 영토 전쟁", "영웅 중심 전술"] }), // 프로젝트 A
    createProject({ slug: "b", symbol: "B", title: "프로젝트 B", tagline: "망자의 감정을 합성해 잃어버린 자아를 되찾는 퍼즐", genres: ["rpg", "puzzle"], publicationStatus: "featured", layout: "special", features: ["감정 합성 규칙", "기억 조각 서사", "행동과 음악의 연결"] }), // 프로젝트 B
    createProject({ slug: "c", symbol: "C", title: "프로젝트 C — 카오스폰즈", tagline: "정신력에 따라 카드와 전투 방식이 변화하는 로그라이크", genres: ["roguelike", "card"], publicationStatus: "featured", layout: "special", features: ["정신력 기반 카드 변화", "각성과 붕괴 전환", "서사 연계 전투"] }), // 프로젝트 C
    createProject({ slug: "d", symbol: "D", title: "프로젝트 D — 바스티온", tagline: "게이트 이후의 세계에서 거점을 지키는 타워 디펜스", genres: ["strategy", "tower-defense"], publicationStatus: "featured", layout: "special", features: ["거점 방어", "게이트 오염 구역", "세력 선택"] }), // 프로젝트 D
    createProject({ slug: "e", symbol: "E", title: "프로젝트 E", tagline: "카드 조합을 중심으로 준비 중인 전략 프로젝트", genres: ["strategy", "ccg"] }), // 프로젝트 E
    createProject({ slug: "f", symbol: "F", title: "프로젝트 F", tagline: "빠른 전투를 목표로 준비 중인 하이퍼 FPS", genres: ["action", "fps"] }), // 프로젝트 F
    createProject({ slug: "g", symbol: "G", title: "프로젝트 G", tagline: "이야기 중심의 경험을 준비 중인 프로젝트", genres: ["story", "other"] }), // 프로젝트 G
    createProject({ slug: "h", symbol: "H", title: "프로젝트 H", tagline: "전술과 리듬 액션과 친밀도 성장이 이어지는 판타지 RPG", genres: ["rpg", "rhythm"], publicationStatus: "developing", layout: "special", adultOnly: true, features: ["파티 전술", "리듬 입력 전투", "친밀도 성장"] }), // 프로젝트 H
    createProject({ slug: "i", symbol: "I", title: "프로젝트 I", tagline: "탐사와 반복 도전을 결합한 로그라이크 프로젝트", genres: ["roguelike", "exploration"] }), // 프로젝트 I
    createProject({ slug: "j", symbol: "J", title: "프로젝트 J", tagline: "턴제 전략과 액션 RPG를 결합한 프로젝트", genres: ["strategy", "action", "rpg"] }), // 프로젝트 J
    createProject({ slug: "k", symbol: "K", title: "프로젝트 K", tagline: "생존 경쟁을 중심으로 준비 중인 배틀로얄", genres: ["action", "battle-royale"] }), // 프로젝트 K
    createProject({ slug: "l", symbol: "L", title: "프로젝트 L", tagline: "음악 한 곡이 하나의 전투가 되는 리듬 액션 RPG", genres: ["action", "rhythm", "rpg"], publicationStatus: "developing", layout: "special", features: ["곡 구조와 보스 패턴", "다양한 리듬 입력", "캐릭터 성장"] }), // 프로젝트 L
    createProject({ slug: "m", symbol: "M", title: "프로젝트 M", tagline: "새로운 규칙을 준비 중인 퍼즐 프로젝트", genres: ["puzzle"] }), // 프로젝트 M
    createProject({ slug: "n", symbol: "N", title: "프로젝트 N", tagline: "다수의 적과 성장 선택을 다루는 로그라이크", genres: ["roguelike", "survivor"] }), // 프로젝트 N
    createProject({ slug: "o", symbol: "O", title: "프로젝트 O", tagline: "자유로운 탐험을 준비 중인 오픈월드 프로젝트", genres: ["open-world", "other"] }), // 프로젝트 O
    createProject({ slug: "p", symbol: "P", title: "프로젝트 P", tagline: "연쇄 조합을 중심으로 준비 중인 3매치 퍼즐", genres: ["puzzle", "match-three"] }), // 프로젝트 P
    createProject({ slug: "q", symbol: "Q", title: "프로젝트 Q", tagline: "카드 선택과 탄막 슈팅을 결합한 프로젝트", genres: ["action", "card", "shooting"] }), // 프로젝트 Q
    createProject({ slug: "r", symbol: "R", title: "프로젝트 R", tagline: "속도와 경쟁을 중심으로 준비 중인 레이싱", genres: ["action", "racing"] }), // 프로젝트 R
    createProject({ slug: "s", symbol: "S", title: "프로젝트 S", tagline: "제한된 환경에서 살아남는 생존 프로젝트", genres: ["survival", "other"] }), // 프로젝트 S
    createProject({ slug: "t", symbol: "T", title: "프로젝트 T", tagline: "다양한 규칙을 짧게 즐기는 미니게임 프로젝트", genres: ["mini-game", "other"] }), // 프로젝트 T
    createProject({ slug: "u", symbol: "U", title: "프로젝트 U", tagline: "자유로운 선택을 다루는 성인용 샌드박스 프로젝트", genres: ["sandbox", "open-world", "other"], adultOnly: true }), // 프로젝트 U
    createProject({ slug: "v", symbol: "V", title: "프로젝트 V", tagline: "턴제 전략과 카드를 결합한 성인용 프로젝트", genres: ["strategy", "card"], adultOnly: true }), // 프로젝트 V
    createProject({ slug: "w", symbol: "W", title: "프로젝트 W", tagline: "선택과 확장을 다루는 가게 경영 프로젝트", genres: ["management", "other"] }), // 프로젝트 W
    createProject({ slug: "x", symbol: "X", title: "프로젝트 X — 심야탐정부", tagline: "심야의 사건을 추적하는 공포 퍼즐", genres: ["puzzle", "horror"] }), // 프로젝트 X
    createProject({ slug: "y", symbol: "Y", title: "프로젝트 Y", tagline: "새로운 세계와 성장을 준비 중인 RPG", genres: ["rpg"] }), // 프로젝트 Y
    createProject({ slug: "z", symbol: "Z", title: "프로젝트 Z", tagline: "탐험과 능력 확장을 다루는 메트로배니아", genres: ["action", "metroidvania"] }), // 프로젝트 Z
    createProject({ slug: "alpha", symbol: "α", title: "프로젝트 α", tagline: "불확실한 공간을 탐색하는 공포 프로젝트", genres: ["horror", "other"] }), // 프로젝트 알파
    createProject({ slug: "beta", symbol: "β", title: "프로젝트 β", tagline: "모바일 전장을 목표로 준비 중인 전략 RPG", genres: ["strategy", "srpg", "mobile"] }), // 프로젝트 베타
    createProject({ slug: "gamma", symbol: "γ", title: "프로젝트 γ", tagline: "제한된 자금과 선택의 결과를 다루는 주식 시뮬레이션", genres: ["simulation", "other"], developmentStatus: "paused" }), // 프로젝트 감마
    createProject({ slug: "delta", symbol: "δ", title: "프로젝트 δ", tagline: "변화하는 던전에서 선택과 손실을 관리하는 로그라이크", genres: ["roguelike", "dungeon"] }), // 프로젝트 델타
    createProject({ slug: "epsilon", symbol: "ε", title: "프로젝트 ε", tagline: "성장 선택을 조합해 다수의 적을 상대하는 생존 게임", genres: ["roguelike", "survivor"] }), // 프로젝트 엡실론
    createProject({ slug: "zeta", symbol: "ζ", title: "프로젝트 ζ", tagline: "도구로 지형과 이동 경로를 바꾸는 프로젝트", genres: ["digging", "other"], developmentStatus: "paused" }), // 프로젝트 제타
    createProject({ slug: "eta", symbol: "η", title: "프로젝트 η", tagline: "체스와 카드와 합성 전략 뒤에 숨은 방의 미스터리", genres: ["strategy", "chess", "card"], publicationStatus: "featured", layout: "special", features: ["기물 이동과 카드 소환", "기물 합성과 배치 턴", "방과 게임 마스터의 미스터리"] }), // 프로젝트 에타
    createProject({ slug: "theta", symbol: "θ", title: "프로젝트 θ", tagline: "상대의 반응과 시선을 관찰해 선택하는 프로젝트", genres: ["gaze", "other"] }), // 프로젝트 세타
    createProject({ slug: "iota", symbol: "ι", title: "프로젝트 ι", tagline: "제한된 정보 안에서 위험을 판단하는 러시안 룰렛", genres: ["risk", "other"], developmentStatus: "planning" }), // 프로젝트 이오타
]); // 배열 끝

const PROJECTS_BY_ID = new Map(GAME_PROJECTS.map((project) => [project.id, project])); // 식별자별 프로젝트 저장

export function getGameProject(id) // 프로젝트 공개 정보 조회
{ // 함수 시작
    if (typeof id !== "string" || id.length === 0) // 식별자 형식 확인
    { // 조건 시작
        return null; // 안전한 빈 결과 반환
    } // 조건 끝

    return PROJECTS_BY_ID.get(id) ?? null; // 프로젝트 또는 빈 결과 반환
} // 함수 끝

export function validateGameProjects(projects) // 프로젝트 공개 정보 검사
{ // 함수 시작
    if (!Array.isArray(projects)) // 배열 형식 확인
    { // 조건 시작
        return Object.freeze(["프로젝트 목록은 배열이어야 합니다."]); // 형식 오류 반환
    } // 조건 끝

    const errors = []; // 오류 목록 생성
    const seenIds = new Set(); // 식별자 기록 생성
    const requiredStrings = ["id", "symbol", "title", "tagline", "summary", "heroImage", "detailPath", "hashtag"]; // 필수 문자열 필드

    for (const [index, project] of projects.entries()) // 프로젝트 반복
    { // 반복 시작
        const label = project?.id || `index-${index}`; // 오류 대상 이름

        for (const field of requiredStrings) // 필수 문자열 반복
        { // 반복 시작
            if (typeof project?.[field] !== "string" || project[field].trim().length === 0) // 필수 문자열 확인
            { // 조건 시작
                errors.push(`${label}: ${field} 필수 문자열 누락`); // 누락 오류 추가
            } // 조건 끝
        } // 반복 끝

        if (seenIds.has(project?.id)) // 중복 식별자 확인
        { // 조건 시작
            errors.push(`${label}: 중복 식별자`); // 중복 오류 추가
        } // 조건 끝
        seenIds.add(project?.id); // 식별자 기록

        if (!Array.isArray(project?.genres) || project.genres.length === 0) // 장르 목록 확인
        { // 조건 시작
            errors.push(`${label}: 장르 목록 누락`); // 장르 오류 추가
        } // 조건 끝
        if (!Array.isArray(project?.features)) // 특징 목록 확인
        { // 조건 시작
            errors.push(`${label}: 특징 목록 형식 오류`); // 특징 오류 추가
        } // 조건 끝
        if (!DEVELOPMENT_STATUSES.includes(project?.developmentStatus)) // 개발 상태 확인
        { // 조건 시작
            errors.push(`${label}: 개발 상태 오류`); // 개발 상태 오류 추가
        } // 조건 끝
        if (!PUBLICATION_STATUSES.includes(project?.publicationStatus)) // 공개 상태 확인
        { // 조건 시작
            errors.push(`${label}: 공개 상태 오류`); // 공개 상태 오류 추가
        } // 조건 끝
        if (!LAYOUT_TYPES.includes(project?.layout)) // 레이아웃 확인
        { // 조건 시작
            errors.push(`${label}: 레이아웃 오류`); // 레이아웃 오류 추가
        } // 조건 끝
        if (typeof project?.detailPath !== "string" || !project.detailPath.startsWith("/") || project.detailPath.startsWith("//") || project.detailPath.includes(":")) // 상세 주소 확인
        { // 조건 시작
            errors.push(`${label}: 상세 주소 오류`); // 상세 주소 오류 추가
        } // 조건 끝
        if (typeof project?.heroImage !== "string" || !project.heroImage.startsWith("/images/games/") || !project.heroImage.endsWith(".png")) // 이미지 주소 확인
        { // 조건 시작
            errors.push(`${label}: 대표 이미지 주소 오류`); // 이미지 오류 추가
        } // 조건 끝
        if (typeof project?.adultOnly !== "boolean") // 성인 여부 확인
        { // 조건 시작
            errors.push(`${label}: 성인 여부 형식 오류`); // 성인 여부 오류 추가
        } // 조건 끝
    } // 반복 끝

    return Object.freeze(errors); // 고정 오류 목록 반환
} // 함수 끝
