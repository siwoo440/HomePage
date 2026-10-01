export const LANGUAGE_STORAGE_KEY = "devforge-language"; // 언어 선택 저장 키
export const DEFAULT_LANGUAGE = "ko"; // 기본 언어
export const TRANSLATED_ATTRIBUTES = Object.freeze(["alt", "title", "aria-label", "placeholder", "aria-description"]); // 번역할 표시 속성
const SKIPPED_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "TEMPLATE"]); // 번역 제외 요소
const SKIP_SELECTOR = "[data-i18n-skip], [translate=\"no\"], [contenteditable=\"\"], [contenteditable=\"true\"]"; // 번역 제외 표시
const HANGUL = /[가-힣ㄱ-ㆎ]/; // 한글 판별 규칙

export function normalizeLanguage(value) // 언어 값 정리
{ // 함수 시작
    return value === "en" || value === "ko" ? value : null; // 지원 언어만 반환
} // 함수 끝

export function resolveLanguage(search, storedLanguage) // 현재 언어 결정
{ // 함수 시작
    const requested = normalizeLanguage(new URLSearchParams(search ?? "").get("lang")); // 주소 요청 언어
    return requested ?? normalizeLanguage(storedLanguage) ?? DEFAULT_LANGUAGE; // 요청·저장·기본 순서
} // 함수 끝

export function readStoredLanguage(view) // 저장 언어 읽기
{ // 함수 시작
    try // 저장소 접근 시도
    { // 시도 시작
        return view.localStorage?.getItem(LANGUAGE_STORAGE_KEY) ?? null; // 저장 언어 반환
    } // 시도 끝
    catch // 저장소 차단 처리
    { // 예외 시작
        return null; // 기본 값 반환
    } // 예외 끝
} // 함수 끝

export function saveLanguage(view, language) // 언어 선택 저장
{ // 함수 시작
    try // 저장소 접근 시도
    { // 시도 시작
        view.localStorage?.setItem(LANGUAGE_STORAGE_KEY, language); // 언어 기록
    } // 시도 끝
    catch // 저장소 차단 처리
    { // 예외 시작
        return; // 저장 생략
    } // 예외 끝
} // 함수 끝

export function getPageLocale(view = globalThis) // 날짜·숫자 표기 언어
{ // 함수 시작
    const translatable = view.document?.documentElement?.dataset?.i18nPage === "static"; // 번역 가능 페이지 확인
    return translatable && resolveLanguage(view.location?.search, readStoredLanguage(view)) === "en" ? "en-US" : "ko-KR"; // 표기 언어 반환
} // 함수 끝

export function bundleForPath(pathname) // 주소별 사전 이름
{ // 함수 시작
    const match = /^\/(project_[a-z]+)\//.exec(pathname ?? ""); // 프로젝트 폴더 확인
    return match ? match[1] : "site"; // 사전 이름 반환
} // 함수 끝

export function getLanguageSwitchUrl(href) // 언어 전환 주소
{ // 함수 시작
    const url = new URL(href); // 현재 주소 해석
    url.searchParams.delete("lang"); // 주소 언어 요청 제거
    return url.toString(); // 전환 주소 반환
} // 함수 끝

function hasUntranslated(text) // 남은 한글 확인
{ // 함수 시작
    return HANGUL.test(text.replace(/#[^\s·]+/g, "")); // 원문 유지 해시태그 제외 확인
} // 함수 끝

function escapeRegExp(value) // 정규식 문자 처리
{ // 함수 시작
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // 특수 문자 처리 반환
} // 함수 끝

export function compilePattern(pattern) // 형식 번역 규칙 생성
{ // 함수 시작
    const source = escapeRegExp(normalizeText(pattern.ko)).replace(/\\\{(\d+)\\\}/g, "(?<p$1>.+?)"); // 자리 표시 변환
    return { regex: new RegExp(`^${source}$`, "u"), en: pattern.en, weight: pattern.ko.replace(/\{\d+\}/g, "").length }; // 규칙과 고정 글자 수 반환
} // 함수 끝

export function normalizeText(value) // 비교용 문구 정리
{ // 함수 시작
    return String(value).replace(/\s+/g, " ").trim(); // 공백 정리 반환
} // 함수 끝

export function createTranslator(dictionaries) // 번역기 생성
{ // 함수 시작
    const entries = new Map(); // 문구 사전
    const patterns = []; // 형식 규칙
    for (const dictionary of dictionaries) // 사전 반복
    { // 반복 시작
        for (const [ko, en] of Object.entries(dictionary?.entries ?? {})) // 문구 반복
        { // 반복 시작
            entries.set(normalizeText(ko), en); // 문구 등록
        } // 반복 끝
        for (const pattern of dictionary?.patterns ?? []) // 형식 반복
        { // 반복 시작
            if (typeof pattern?.ko === "string" && typeof pattern?.en === "string" && /\{\d+\}/.test(pattern.ko)) // 형식 확인
            { // 조건 시작
                patterns.push(compilePattern(pattern)); // 형식 등록
            } // 조건 끝
        } // 반복 끝
    } // 반복 끝

    patterns.sort((left, right) => right.weight - left.weight); // 구체적인 형식 먼저 비교

    function translatePiece(value, depth) // 끼워진 값 번역
    { // 함수 시작
        if (value.startsWith("#") || !HANGUL.test(value)) // 해시태그·비한글 확인
        { // 조건 시작
            return value; // 원래 값 유지
        } // 조건 끝
        return translateNormalized(normalizeText(value), depth + 1) ?? value; // 번역 또는 원래 값
    } // 함수 끝

    function translateNormalized(key, depth = 0) // 정리된 문구 번역
    { // 함수 시작
        if (entries.has(key)) // 문구 사전 확인
        { // 조건 시작
            return entries.get(key); // 사전 번역 반환
        } // 조건 끝
        if (depth > 3) // 과도한 반복 방지
        { // 조건 시작
            return null; // 번역 없음
        } // 조건 끝
        for (const pattern of patterns) // 형식 반복
        { // 반복 시작
            const match = pattern.regex.exec(key); // 형식 일치 확인
            if (match) // 일치 확인
            { // 조건 시작
                const result = pattern.en.replace(/\{(\d+)\}/g, (placeholder, index) => translatePiece(match.groups?.[`p${index}`] ?? "", depth)); // 자리 값 채우기
                if (!hasUntranslated(result)) // 완전 번역 확인
                { // 조건 시작
                    return result; // 형식 번역 반환
                } // 조건 끝
            } // 조건 끝
        } // 반복 끝
        const quoted = /^([“"‘'「『(])(.+)([”"’'」』)])$/u.exec(key); // 따옴표·괄호 감싼 문구
        if (quoted) // 감싼 문구 확인
        { // 조건 시작
            const inner = translateNormalized(normalizeText(quoted[2]), depth + 1); // 안쪽 번역
            return inner === null ? null : `${quoted[1]}${inner}${quoted[3]}`; // 감싼 기호 유지 반환
        } // 조건 끝
        if (key.startsWith("#") && key.length > 1) // 태그 문구 확인
        { // 조건 시작
            const inner = translateNormalized(normalizeText(key.slice(1)), depth + 1); // 태그 이름 번역
            return inner === null ? null : `#${inner}`; // 태그 기호 유지 반환
        } // 조건 끝
        if (/ (?:·|\+|→|\/|\|) /.test(key)) // 기호 조합 문구 확인
        { // 조건 시작
            const pieces = key.split(/( (?:·|\+|→|\/|\|) )/).map((piece, index) => (index % 2 === 1 ? piece : translatePiece(piece, depth))); // 조각별 번역
            return pieces.some((piece) => hasUntranslated(piece)) ? null : pieces.join(""); // 모두 번역된 경우만 반환
        } // 조건 끝
        return null; // 번역 없음
    } // 함수 끝

    function translate(text, context = "") // 문구 번역
    { // 함수 시작
        if (typeof text !== "string" || !HANGUL.test(text)) // 번역 대상 확인
        { // 조건 시작
            return null; // 대상 아님
        } // 조건 끝
        const key = normalizeText(text); // 비교용 문구
        const contextual = context ? entries.get(`${context}::${key}`) : undefined; // 문맥별 번역
        const translated = contextual ?? translateNormalized(key); // 번역 결과
        if (translated === null) // 번역 없음 확인
        { // 조건 시작
            return null; // 번역 없음 반환
        } // 조건 끝
        const leading = /^\s*/.exec(text)[0]; // 앞 공백
        const trailing = /\s*$/.exec(text)[0]; // 뒤 공백
        return `${leading ? " " : ""}${translated}${trailing ? " " : ""}`; // 공백 유지 반환
    } // 함수 끝

    return Object.freeze({ translate, size: entries.size + patterns.length }); // 번역기 반환
} // 함수 끝

function isSkipped(element) // 번역 제외 확인
{ // 함수 시작
    return !element || SKIPPED_TAGS.has(element.tagName) || Boolean(element.closest?.(SKIP_SELECTOR)); // 제외 여부 반환
} // 함수 끝

export function translateTextNode(node, translator, missing) // 글자 노드 번역
{ // 함수 시작
    if (isSkipped(node.parentElement)) // 제외 위치 확인
    { // 조건 시작
        return false; // 번역 생략
    } // 조건 끝
    const context = node.parentElement?.closest?.("[data-i18n-context]")?.dataset?.i18nContext ?? ""; // 문맥 표시
    const translated = translator.translate(node.nodeValue, context); // 번역 결과
    if (translated === null) // 번역 없음 확인
    { // 조건 시작
        if (HANGUL.test(node.nodeValue ?? "")) // 남은 한글 확인
        { // 조건 시작
            missing?.add(normalizeText(node.nodeValue)); // 누락 기록
        } // 조건 끝
        return false; // 변경 없음
    } // 조건 끝
    node.nodeValue = translated; // 글자 교체
    return true; // 변경 완료
} // 함수 끝

export function translateAttributes(element, translator, missing) // 속성 번역
{ // 함수 시작
    if (isSkipped(element)) // 제외 위치 확인
    { // 조건 시작
        return; // 번역 생략
    } // 조건 끝
    const names = [...TRANSLATED_ATTRIBUTES]; // 대상 속성
    if (element.tagName === "INPUT" && ["button", "submit", "reset"].includes(element.type)) // 버튼 입력 확인
    { // 조건 시작
        names.push("value"); // 버튼 값 포함
    } // 조건 끝
    for (const name of names) // 속성 반복
    { // 반복 시작
        const value = element.getAttribute(name); // 현재 값
        if (!value || !HANGUL.test(value)) // 한글 확인
        { // 조건 시작
            continue; // 다음 속성
        } // 조건 끝
        const translated = translator.translate(value); // 번역 결과
        if (translated === null) // 번역 없음 확인
        { // 조건 시작
            missing?.add(normalizeText(value)); // 누락 기록
            continue; // 다음 속성
        } // 조건 끝
        element.setAttribute(name, translated.trim()); // 속성 교체
    } // 반복 끝
} // 함수 끝

export function translateTree(root, translator, missing) // 하위 전체 번역
{ // 함수 시작
    if (!root) // 대상 확인
    { // 조건 시작
        return; // 처리 종료
    } // 조건 끝
    if (root.nodeType === 3) // 글자 노드 확인
    { // 조건 시작
        translateTextNode(root, translator, missing); // 글자 번역
        return; // 처리 종료
    } // 조건 끝
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) // 요소·문서 확인
    { // 조건 시작
        return; // 처리 종료
    } // 조건 끝
    const ownerDocument = root.ownerDocument ?? root; // 소속 문서
    if (root.nodeType === 1) // 시작 요소 확인
    { // 조건 시작
        translateAttributes(root, translator, missing); // 시작 요소 속성 번역
    } // 조건 끝
    const walker = ownerDocument.createTreeWalker(root, 1 | 4, { acceptNode: (node) => (node.nodeType === 1 && isSkipped(node) ? 2 : 1) }); // 요소·글자 순회기
    let node = walker.nextNode(); // 첫 노드
    while (node) // 노드 반복
    { // 반복 시작
        if (node.nodeType === 3) // 글자 노드 확인
        { // 조건 시작
            translateTextNode(node, translator, missing); // 글자 번역
        } // 조건 끝
        else // 요소 처리
        { // 대안 시작
            translateAttributes(node, translator, missing); // 속성 번역
        } // 대안 끝
        node = walker.nextNode(); // 다음 노드
    } // 반복 끝
} // 함수 끝

async function loadDictionary(fetchImpl, name) // 사전 파일 불러오기
{ // 함수 시작
    try // 요청 시도
    { // 시도 시작
        const response = await fetchImpl(`/i18n/en/${name}.json`); // 사전 요청
        return response.ok ? await response.json() : null; // 사전 반환
    } // 시도 끝
    catch // 요청 실패 처리
    { // 예외 시작
        return null; // 사전 없음
    } // 예외 끝
} // 함수 끝

export function isTranslatablePage(root) // 번역 대상 문서 확인
{ // 함수 시작
    return root?.documentElement?.dataset?.i18nPage === "static"; // 정적 페이지 표시 확인
} // 함수 끝

export async function startPageTranslation(root = document, view = window) // 페이지 번역 시작
{ // 함수 시작
    const language = resolveLanguage(view.location?.search, readStoredLanguage(view)); // 현재 언어
    const state = { language, missing: new Set(), translator: null }; // 번역 상태
    view.__devforgeI18n = state; // 확인용 상태 공개
    const finish = () => root.documentElement?.classList?.remove("i18n-pending"); // 가림 해제

    if (language !== "en" || !isTranslatablePage(root)) // 영어 정적 페이지 확인
    { // 조건 시작
        finish(); // 가림 해제
        return state; // 번역 생략
    } // 조건 끝

    const bundle = bundleForPath(view.location?.pathname); // 페이지 사전 이름
    const names = bundle === "site" ? ["site"] : ["site", bundle]; // 불러올 사전
    const dictionaries = (await Promise.all(names.map((name) => loadDictionary(view.fetch.bind(view), name)))).filter(Boolean); // 사전 불러오기
    if (dictionaries.length === 0) // 사전 실패 확인
    { // 조건 시작
        finish(); // 원문 그대로 표시
        return state; // 처리 종료
    } // 조건 끝

    const translator = createTranslator(dictionaries); // 번역기 생성
    state.translator = translator; // 번역기 기록
    root.documentElement.lang = "en"; // 문서 언어 변경
    const title = translator.translate(root.title); // 브라우저 제목 번역
    if (title) // 제목 번역 확인
    { // 조건 시작
        root.title = title.trim(); // 제목 교체
    } // 조건 끝
    translateTree(root.body, translator, state.missing); // 본문 번역

    const observer = new view.MutationObserver((records) => // 화면 변경 감시
    { // 감시 시작
        for (const record of records) // 변경 반복
        { // 반복 시작
            if (record.type === "childList") // 추가 노드 확인
            { // 조건 시작
                record.addedNodes.forEach((node) => translateTree(node, translator, state.missing)); // 추가 노드 번역
            } // 조건 끝
            else if (record.type === "characterData") // 글자 변경 확인
            { // 조건 시작
                translateTree(record.target, translator, state.missing); // 바뀐 글자 번역
            } // 조건 끝
            else if (record.type === "attributes" && record.target.nodeType === 1) // 속성 변경 확인
            { // 조건 시작
                translateAttributes(record.target, translator, state.missing); // 바뀐 속성 번역
            } // 조건 끝
        } // 반복 끝
    }); // 감시 끝
    observer.observe(root.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...TRANSLATED_ATTRIBUTES, "value"] }); // 본문 감시 시작
    state.observer = observer; // 감시기 기록
    finish(); // 가림 해제
    return state; // 번역 상태 반환
} // 함수 끝
