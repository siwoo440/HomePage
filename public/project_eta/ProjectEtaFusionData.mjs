function piece(id, nameKo, nameEn, grade, symbol) // 기물 데이터 생성
{ // 함수 시작
    return Object.freeze({ id, nameKo, nameEn, grade, symbol }); // 고정 기물 반환
} // 함수 끝

function recipe(id, materialA, materialB, result, hidden = false) // 합성식 데이터 생성
{ // 함수 시작
    return Object.freeze({ id, materialA, materialB, result, hidden }); // 고정 합성식 반환
} // 함수 끝

export const PIECES = Object.freeze( // 전체 기물 목록
[ // 목록 시작
    piece("king", "킹", "King", 1, "♔"), // 1성 킹
    piece("wazir", "와지르", "Wazir", 1, "◆"), // 1성 와지르
    piece("ferz", "페르즈", "Ferz", 1, "◇"), // 1성 페르즈
    piece("dabbaba", "다바바", "Dabbaba", 1, "▣"), // 1성 다바바
    piece("alfil", "알필", "Alfil", 1, "◈"), // 1성 알필
    piece("pawn", "폰", "Pawn", 1, "♙"), // 1성 폰
    piece("knight", "나이트", "Knight", 1, "♘"), // 1성 나이트
    piece("rook", "룩", "Rook", 1, "♖"), // 1성 룩
    piece("archer", "사수", "Archer", 1, "➹"), // 1성 사수
    piece("queen", "퀸", "Queen", 1, "♕"), // 1성 퀸
    piece("zebra", "제브라", "Zebra", 1, "Z"), // 1성 제브라
    piece("bishop", "비숍", "Bishop", 1, "♗"), // 1성 비숍
    piece("camel", "카멜", "Camel", 1, "C"), // 1성 카멜
    piece("flag-bearer", "깃발병", "Flag Bearer", 1, "⚑"), // 1성 깃발병
    piece("spearman", "창병", "Spearman", 1, "⚔"), // 1성 창병
    piece("shield-bearer", "방패병", "Shield Bearer", 1, "⬟"), // 1성 방패병
    piece("pursuer", "추격병", "Pursuer", 1, "»"), // 1성 추격병
    piece("scout", "척후병", "Scout", 1, "⌖"), // 1성 척후병
    piece("man", "맨", "Man", 2, "M"), // 2성 맨
    piece("waffle", "와플", "Waffle", 2, "W"), // 2성 와플
    piece("centaur", "센타우르", "Centaur", 2, "♞"), // 2성 센타우르
    piece("cannon", "캐논", "Cannon", 2, "◉"), // 2성 캐논
    piece("grasshopper", "그래스호퍼", "Grasshopper", 2, "G"), // 2성 그래스호퍼
    piece("nightrider", "나이트라이더", "Nightrider", 2, "N"), // 2성 나이트라이더
    piece("archbishop", "아크비숍", "Archbishop", 2, "♝"), // 2성 아크비숍
    piece("chancellor", "챈슬러", "Chancellor", 2, "♜"), // 2성 챈슬러
    piece("camel-rider", "카멜라이더", "Camel Rider", 2, "R"), // 2성 카멜라이더
    piece("canvasser", "캔버서", "Canvasser", 2, "V"), // 2성 캔버서
    piece("caliph", "칼리프", "Caliph", 2, "K"), // 2성 칼리프
    piece("squirrel", "스쿼럴", "Squirrel", 2, "S"), // 2성 스쿼럴
    piece("chameleon", "카멜레온", "Chameleon", 2, "H"), // 2성 카멜레온
    piece("amazon", "아마존", "Amazon", 2, "A"), // 2성 아마존
    piece("assault-soldier", "강습병", "Assault Soldier", 2, "⚡"), // 2성 강습병
    piece("sentinel", "파수병", "Sentinel", 2, "⬢"), // 2성 파수병
    piece("breaker", "돌파병", "Breaker", 2, "▶"), // 2성 돌파병
    piece("herald", "전령", "Herald", 2, "✉"), // 2성 전령
    piece("ambusher", "매복병", "Ambusher", 2, "◐"), // 2성 매복병
    piece("paladin", "성기사", "Paladin", 3, "♤"), // 3성 성기사
    piece("chariot", "전차", "Chariot", 3, "▰"), // 3성 전차
    piece("grenadier", "척탄병", "Grenadier", 3, "✹"), // 3성 척탄병
    piece("pikeman", "장창병", "Pikeman", 3, "†"), // 3성 장창병
    piece("crossbowman", "석궁병", "Crossbowman", 3, "➸"), // 3성 석궁병
    piece("guardian-knight", "수호기사", "Guardian Knight", 3, "♧"), // 3성 수호기사
    piece("hunter", "사냥꾼", "Hunter", 3, "◎"), // 3성 사냥꾼
    piece("hawk", "매", "Hawk", 3, "⌃"), // 3성 매
    piece("unicorn", "유니콘", "Unicorn", 3, "U"), // 3성 유니콘
    piece("griffin", "그리폰", "Griffin", 3, "F"), // 3성 그리폰
    piece("dragon-horse", "용마", "Dragon Horse", 3, "D"), // 3성 용마
    piece("dragon-king", "용왕", "Dragon King", 3, "龍"), // 3성 용왕
    piece("artillery", "포병대", "Artillery", 3, "●"), // 3성 포병대
    piece("assault-captain", "돌격대장", "Assault Captain", 3, "▲"), // 3성 돌격대장
    piece("tactician", "전술가", "Tactician", 3, "⌘"), // 3성 전술가
    piece("medic", "의무병", "Medic", 3, "+"), // 3성 의무병
    piece("summoner", "소환사", "Summoner", 3, "◌"), // 3성 소환사
    piece("sniper", "저격수", "Sniper", 3, "⊙"), // 3성 저격수
    piece("grand-general", "대장군", "Grand General", 4, "将"), // 4성 대장군
    piece("heavy-artillery", "대포병", "Heavy Artillery", 4, "◍"), // 4성 대포병
    piece("imperial-knight", "황실기사", "Imperial Knight", 4, "♠"), // 4성 황실기사
    piece("grand-cleric", "대성직자", "Grand Cleric", 4, "✚"), // 4성 대성직자
    piece("war-rider", "전쟁기수", "War Rider", 4, "♨"), // 4성 전쟁기수
    piece("siege-chariot", "공성전차", "Siege Chariot", 4, "▦"), // 4성 공성전차
    piece("guardian-captain", "수호대장", "Guardian Captain", 4, "⬡"), // 4성 수호대장
    piece("grand-unicorn", "그랜드 유니콘", "Grand Unicorn", 4, "Ù"), // 4성 그랜드 유니콘
    piece("grand-griffin", "그랜드 그리폰", "Grand Griffin", 4, "Ǧ"), // 4성 그랜드 그리폰
    piece("archmage", "대마도사", "Archmage", 4, "✦"), // 4성 대마도사
    piece("battle-healer", "전투치유사", "Battle Healer", 4, "✛"), // 4성 전투치유사
    piece("executioner", "처형자", "Executioner", 4, "✕"), // 4성 처형자
    piece("storm-knight", "폭풍기사", "Storm Knight", 4, "ϟ"), // 4성 폭풍기사
    piece("ironwall-knight", "철벽기사", "Ironwall Knight", 4, "▤"), // 4성 철벽기사
    piece("field-commander", "전장지휘관", "Field Commander", 4, "⌘"), // 4성 전장지휘관
    piece("illusionist", "환술사", "Illusionist", 4, "◑"), // 4성 환술사
    piece("grand-sniper", "대저격수", "Grand Sniper", 4, "⊕"), // 4성 대저격수
    piece("gatekeeper", "문지기", "Gatekeeper", 4, "▥"), // 4성 문지기
    piece("siege-commander", "공성대장", "Siege Commander", 5, "♛"), // 5성 공성대장
    piece("grand-paladin", "대성기사", "Grand Paladin", 5, "♚"), // 5성 대성기사
    piece("cavalry-general", "기마장군", "Cavalry General", 5, "♘"), // 5성 기마장군
    piece("phantom-general", "환영장군", "Phantom General", 5, "◉"), // 5성 환영장군
    piece("emperor", "황제", "Emperor", 5, "帝"), // 5성 황제
    piece("sky-commander", "천공대장", "Sky Commander", 5, "☁"), // 5성 천공대장
    piece("sage", "대현자", "Sage", 5, "✧"), // 5성 대현자
    piece("ironwall-lord", "철벽군주", "Ironwall Lord", 5, "▩"), // 5성 철벽군주
]); // 목록 끝

export const FUSION_RECIPES = Object.freeze( // 전체 명시 합성식
[ // 목록 시작
    recipe("wazir-ferz-man", "wazir", "ferz", "man"), // 와지르 페르즈 합성
    recipe("dabbaba-alfil-waffle", "dabbaba", "alfil", "waffle"), // 다바바 알필 합성
    recipe("pawn-knight-centaur", "pawn", "knight", "centaur"), // 폰 나이트 합성
    recipe("rook-archer-cannon", "rook", "archer", "cannon"), // 룩 사수 합성
    recipe("queen-dabbaba-grasshopper", "queen", "dabbaba", "grasshopper"), // 퀸 다바바 합성
    recipe("knight-zebra-nightrider", "knight", "zebra", "nightrider"), // 나이트 제브라 합성
    recipe("bishop-knight-archbishop", "bishop", "knight", "archbishop"), // 비숍 나이트 합성
    recipe("rook-knight-chancellor", "rook", "knight", "chancellor"), // 룩 나이트 합성
    recipe("camel-wazir-camel-rider", "camel", "wazir", "camel-rider"), // 카멜 와지르 합성
    recipe("rook-camel-canvasser", "rook", "camel", "canvasser"), // 룩 카멜 합성
    recipe("bishop-camel-caliph", "bishop", "camel", "caliph"), // 비숍 카멜 합성
    recipe("dabbaba-knight-squirrel", "dabbaba", "knight", "squirrel"), // 다바바 나이트 합성
    recipe("queen-flag-bearer-chameleon", "queen", "flag-bearer", "chameleon"), // 퀸 깃발병 합성
    recipe("queen-knight-amazon", "queen", "knight", "amazon"), // 퀸 나이트 합성
    recipe("spearman-alfil-assault-soldier", "spearman", "alfil", "assault-soldier"), // 창병 알필 합성
    recipe("shield-bearer-wazir-sentinel", "shield-bearer", "wazir", "sentinel"), // 방패병 와지르 합성
    recipe("pursuer-rook-breaker", "pursuer", "rook", "breaker"), // 추격병 룩 합성
    recipe("scout-zebra-herald", "scout", "zebra", "herald"), // 척후병 제브라 합성
    recipe("ferz-alfil-ambusher", "ferz", "alfil", "ambusher"), // 페르즈 알필 합성
    recipe("queen-queen-amazon", "queen", "queen", "amazon", true), // 숨김 퀸 중복 합성
    recipe("knight-knight-nightrider", "knight", "knight", "nightrider", true), // 숨김 나이트 중복 합성
    recipe("archbishop-man-paladin", "archbishop", "man", "paladin"), // 아크비숍 맨 합성
    recipe("chancellor-sentinel-chariot", "chancellor", "sentinel", "chariot"), // 챈슬러 파수병 합성
    recipe("cannon-waffle-grenadier", "cannon", "waffle", "grenadier"), // 캐논 와플 합성
    recipe("breaker-assault-soldier-pikeman", "breaker", "assault-soldier", "pikeman"), // 돌파병 강습병 합성
    recipe("cannon-ambusher-crossbowman", "cannon", "ambusher", "crossbowman"), // 캐논 매복병 합성
    recipe("man-sentinel-guardian-knight", "man", "sentinel", "guardian-knight"), // 맨 파수병 합성
    recipe("centaur-ambusher-hunter", "centaur", "ambusher", "hunter"), // 센타우르 매복병 합성
    recipe("herald-nightrider-hawk", "herald", "nightrider", "hawk"), // 전령 나이트라이더 합성
    recipe("archbishop-nightrider-unicorn", "archbishop", "nightrider", "unicorn"), // 아크비숍 나이트라이더 합성
    recipe("grasshopper-canvasser-griffin", "grasshopper", "canvasser", "griffin"), // 그래스호퍼 캔버서 합성
    recipe("caliph-man-dragon-horse", "caliph", "man", "dragon-horse"), // 칼리프 맨 합성
    recipe("chancellor-amazon-dragon-king", "chancellor", "amazon", "dragon-king"), // 챈슬러 아마존 합성
    recipe("cannon-canvasser-artillery", "cannon", "canvasser", "artillery"), // 캐논 캔버서 합성
    recipe("assault-soldier-breaker-assault-captain", "assault-soldier", "breaker", "assault-captain"), // 강습병 돌파병 합성
    recipe("amazon-chameleon-tactician", "amazon", "chameleon", "tactician"), // 아마존 카멜레온 합성
    recipe("sentinel-caliph-medic", "sentinel", "caliph", "medic"), // 파수병 칼리프 합성
    recipe("chameleon-squirrel-summoner", "chameleon", "squirrel", "summoner"), // 카멜레온 스쿼럴 합성
    recipe("ambusher-camel-rider-sniper", "ambusher", "camel-rider", "sniper"), // 매복병 카멜라이더 합성
    recipe("tactician-assault-captain-grand-general", "tactician", "assault-captain", "grand-general"), // 전술가 돌격대장 합성
    recipe("artillery-grenadier-heavy-artillery", "artillery", "grenadier", "heavy-artillery"), // 포병대 척탄병 합성
    recipe("hunter-hawk-imperial-knight", "hunter", "hawk", "imperial-knight"), // 사냥꾼 매 합성
    recipe("paladin-medic-grand-cleric", "paladin", "medic", "grand-cleric"), // 성기사 의무병 합성
    recipe("unicorn-hawk-war-rider", "unicorn", "hawk", "war-rider"), // 유니콘 매 합성
    recipe("chariot-artillery-siege-chariot", "chariot", "artillery", "siege-chariot"), // 전차 포병대 합성
    recipe("guardian-knight-paladin-guardian-captain", "guardian-knight", "paladin", "guardian-captain"), // 수호기사 성기사 합성
    recipe("unicorn-dragon-horse-grand-unicorn", "unicorn", "dragon-horse", "grand-unicorn"), // 유니콘 용마 합성
    recipe("griffin-dragon-king-grand-griffin", "griffin", "dragon-king", "grand-griffin"), // 그리폰 용왕 합성
    recipe("summoner-tactician-archmage", "summoner", "tactician", "archmage"), // 소환사 전술가 합성
    recipe("medic-pikeman-battle-healer", "medic", "pikeman", "battle-healer"), // 의무병 장창병 합성
    recipe("hunter-sniper-executioner", "hunter", "sniper", "executioner"), // 사냥꾼 저격수 합성
    recipe("hawk-assault-captain-storm-knight", "hawk", "assault-captain", "storm-knight"), // 매 돌격대장 합성
    recipe("guardian-knight-chariot-ironwall-knight", "guardian-knight", "chariot", "ironwall-knight"), // 수호기사 전차 합성
    recipe("tactician-guardian-knight-field-commander", "tactician", "guardian-knight", "field-commander"), // 전술가 수호기사 합성
    recipe("summoner-griffin-illusionist", "summoner", "griffin", "illusionist"), // 소환사 그리폰 합성
    recipe("sniper-crossbowman-grand-sniper", "sniper", "crossbowman", "grand-sniper"), // 저격수 석궁병 합성
    recipe("pikeman-dragon-king-gatekeeper", "pikeman", "dragon-king", "gatekeeper"), // 장창병 용왕 합성
    recipe("siege-chariot-heavy-artillery-siege-commander", "siege-chariot", "heavy-artillery", "siege-commander"), // 공성전차 대포병 합성
    recipe("grand-cleric-guardian-captain-grand-paladin", "grand-cleric", "guardian-captain", "grand-paladin"), // 대성직자 수호대장 합성
    recipe("war-rider-imperial-knight-cavalry-general", "war-rider", "imperial-knight", "cavalry-general"), // 전쟁기수 황실기사 합성
    recipe("illusionist-executioner-phantom-general", "illusionist", "executioner", "phantom-general"), // 환술사 처형자 합성
    recipe("grand-general-field-commander-emperor", "grand-general", "field-commander", "emperor"), // 대장군 전장지휘관 합성
    recipe("grand-griffin-storm-knight-sky-commander", "grand-griffin", "storm-knight", "sky-commander"), // 그랜드 그리폰 폭풍기사 합성
    recipe("archmage-battle-healer-sage", "archmage", "battle-healer", "sage"), // 대마도사 전투치유사 합성
    recipe("ironwall-knight-gatekeeper-ironwall-lord", "ironwall-knight", "gatekeeper", "ironwall-lord"), // 철벽기사 문지기 합성
    recipe("grand-unicorn-grand-sniper-sky-commander", "grand-unicorn", "grand-sniper", "sky-commander", true), // 숨김 천공대장 합성
]); // 목록 끝

const PIECE_BY_ID = new Map(PIECES.map((item) => [item.id, item])); // 기물 빠른 조회표

export function getPieceById(id) // 식별자 기물 조회
{ // 함수 시작
    return PIECE_BY_ID.get(String(id)) ?? null; // 일치 기물 반환
} // 함수 끝

export function findPieces(query = "", grade = 0) // 기물 검색
{ // 함수 시작
    const normalizedQuery = String(query).trim().toLocaleLowerCase("ko-KR"); // 검색어 정규화
    const normalizedGrade = Number(grade); // 등급 숫자 변환

    return PIECES.filter((item) => // 조건별 기물 필터
    { // 필터 시작
        const matchesGrade = normalizedGrade === 0 || item.grade === normalizedGrade; // 등급 일치 확인
        const searchText = `${item.nameKo} ${item.nameEn} ${item.id}`.toLocaleLowerCase("ko-KR"); // 검색 대상 결합
        const matchesQuery = normalizedQuery === "" || searchText.includes(normalizedQuery); // 검색어 일치 확인
        return matchesGrade && matchesQuery; // 최종 일치 반환
    }); // 필터 끝
} // 함수 끝

function visibleRecipes(includeHidden) // 표시 가능 합성식 조회
{ // 함수 시작
    return FUSION_RECIPES.filter((item) => includeHidden || !item.hidden); // 스포일러 조건 적용
} // 함수 끝

export function getFusionRelations(pieceId, includeHidden = false) // 기물 연결 관계 조회
{ // 함수 시작
    const id = String(pieceId); // 식별자 정규화
    const recipes = visibleRecipes(includeHidden); // 표시 가능 합성식
    const createdBy = recipes.filter((item) => item.result === id); // 제작 조합 목록
    const usedIn = recipes.filter((item) => item.materialA === id || item.materialB === id); // 재료 사용 목록
    return Object.freeze({ createdBy: Object.freeze(createdBy), usedIn: Object.freeze(usedIn) }); // 고정 관계 반환
} // 함수 끝

export function getReachablePieceIds(pieceId, includeHidden = false) // 전체 연결 기물 조회
{ // 함수 시작
    const startId = String(pieceId); // 시작 식별자
    const visited = new Set([startId]); // 방문 기물 집합
    const queue = [startId]; // 탐색 대기열
    const recipes = visibleRecipes(includeHidden); // 표시 가능 합성식

    while (queue.length > 0) // 연결 탐색 반복
    { // 반복 시작
        const currentId = queue.shift(); // 현재 기물 꺼내기
        const relatedRecipes = recipes.filter((item) => item.result === currentId || item.materialA === currentId || item.materialB === currentId); // 연결 합성식 필터

        for (const item of relatedRecipes) // 합성식 반복
        { // 합성식 반복 시작
            for (const relatedId of [item.materialA, item.materialB, item.result]) // 연결 기물 반복
            { // 연결 기물 반복 시작
                if (!visited.has(relatedId)) // 미방문 기물 확인
                { // 미방문 조건 시작
                    visited.add(relatedId); // 방문 기물 기록
                    queue.push(relatedId); // 다음 탐색 추가
                } // 미방문 조건 끝
            } // 연결 기물 반복 끝
        } // 합성식 반복 끝
    } // 반복 끝

    return Object.freeze(Array.from(visited)); // 고정 연결 목록 반환
} // 함수 끝

export function findPathToGradeFive(pieceId, includeHidden = false) // 5성 최단 경로 조회
{ // 함수 시작
    const startPiece = getPieceById(pieceId); // 시작 기물 조회

    if (!startPiece) // 시작 기물 없음 확인
    { // 조건 시작
        return Object.freeze([]); // 빈 경로 반환
    } // 조건 끝

    const queue = [[startPiece.id]]; // 경로 탐색 대기열
    const visited = new Set([startPiece.id]); // 방문 기물 집합
    const recipes = visibleRecipes(includeHidden); // 표시 가능 합성식

    while (queue.length > 0) // 경로 탐색 반복
    { // 반복 시작
        const path = queue.shift(); // 현재 경로 꺼내기
        const currentId = path[path.length - 1]; // 현재 기물 식별자
        const currentPiece = getPieceById(currentId); // 현재 기물 조회

        if (currentPiece?.grade === 5) // 5성 도달 확인
        { // 도달 조건 시작
            return Object.freeze(path); // 최단 경로 반환
        } // 도달 조건 끝

        const nextIds = recipes.filter((item) => item.materialA === currentId || item.materialB === currentId).map((item) => item.result); // 다음 결과 목록

        for (const nextId of nextIds) // 다음 결과 반복
        { // 다음 결과 반복 시작
            if (!visited.has(nextId)) // 미방문 결과 확인
            { // 미방문 조건 시작
                visited.add(nextId); // 방문 결과 기록
                queue.push([...path, nextId]); // 확장 경로 추가
            } // 미방문 조건 끝
        } // 다음 결과 반복 끝
    } // 반복 끝

    return Object.freeze([]); // 도달 불가 경로 반환
} // 함수 끝
