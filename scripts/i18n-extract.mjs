import fs from "node:fs"; // 파일 읽기 도구
import path from "node:path"; // 경로 처리 도구
import { fileURLToPath } from "node:url"; // 모듈 주소 변환 도구
import ts from "typescript"; // 자바스크립트 구문 분석 도구

export const PUBLIC_ROOT = fileURLToPath(new URL("../public/", import.meta.url)); // 공개 폴더 위치
export const PROJECT_ROOT = fileURLToPath(new URL("../", import.meta.url)); // 저장소 위치
export const NEXT_BUNDLE = "next"; // Next 화면 사전 이름
const NEXT_SOURCE_DIRECTORIES = ["app", "lib/member", "lib/comments", "lib/age-gate"]; // Next 화면 문구 폴더
const NEXT_SOURCE_FILES = ["lib/forms/validation.ts", "lib/news/demo-posts.ts"]; // Next 화면 문구 개별 파일
const SHARED_SERVER_FILES = ["lib/http/json.ts"]; // 정적 페이지 양식에도 보이는 서버 안내 파일(공통 사전)
const NEXT_EXCLUDED = [/^app\/admin\//, /^lib\/comments\/moderation\.ts$/]; // 관리자 전용 제외
export const DICTIONARY_ROOT = path.join(PUBLIC_ROOT, "i18n", "en"); // 영어 사전 위치
export const SITE_BUNDLE = "site"; // 공통 사전 이름
const HANGUL = /[가-힣ㄱ-ㆎ]/; // 한글 판별 규칙
const EXCLUDED_FILES = new Set(["device-preview.html", "device-preview.mjs"]); // 개발용 미리보기 제외
const SKIPPED_ATTRIBUTES = new Set(["href", "src", "srcset", "class", "id", "style", "lang"]); // 문구가 아닌 속성
const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", middot: "·", hellip: "…", mdash: "—", ndash: "–", rarr: "→", larr: "←", copy: "©" }; // 이름 문자 참조

export function normalizeText(value) // 비교용 문구 정리
{ // 함수 시작
    return String(value).replace(/\s+/g, " ").trim(); // 공백 정리 반환
} // 함수 끝

export function hasHangul(value) // 한글 포함 확인
{ // 함수 시작
    return HANGUL.test(value); // 포함 여부 반환
} // 함수 끝

export function decodeEntities(value) // 문자 참조 해석
{ // 함수 시작
    return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code) => // 참조 반복
    { // 해석 시작
        if (code[0] === "#") // 숫자 참조 확인
        { // 조건 시작
            const number = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10); // 문자 번호
            return Number.isFinite(number) ? String.fromCodePoint(number) : match; // 문자 반환
        } // 조건 끝
        return ENTITIES[code.toLowerCase()] ?? match; // 이름 참조 반환
    }); // 해석 끝
} // 함수 끝

export function bundleForFile(relativePath) // 파일별 사전 묶음
{ // 함수 시작
    const parts = relativePath.split(/[\\/]/); // 경로 조각
    return parts.length > 1 && /^project_[a-z]+$/.test(parts[0]) ? parts[0] : SITE_BUNDLE; // 프로젝트 폴더 또는 공통
} // 함수 끝

export function bundleForPath(pathname) // 주소별 사전 묶음
{ // 함수 시작
    const match = /^\/(project_[a-z]+)\//.exec(pathname); // 프로젝트 폴더 확인
    return match ? match[1] : SITE_BUNDLE; // 사전 이름 반환
} // 함수 끝

function addEntry(target, text) // 추출 문구 추가
{ // 함수 시작
    const key = normalizeText(text); // 비교용 문구
    if (key && hasHangul(key)) // 한글 문구 확인
    { // 조건 시작
        target.entries.add(key); // 문구 기록
    } // 조건 끝
} // 함수 끝

function collectMarkup(markup, target) // HTML 조각 문구 수집
{ // 함수 시작
    const source = markup.replace(/<!--[\s\S]*?-->/g, " "); // 주석 제거
    const tagPattern = /<(\/?)([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g; // 태그 규칙
    let cursor = 0; // 읽은 위치
    let match; // 태그 일치 결과
    while ((match = tagPattern.exec(source))) // 태그 반복
    { // 반복 시작
        addEntry(target, decodeEntities(source.slice(cursor, match.index))); // 태그 앞 글자 수집
        const [, closing, rawName, attributes] = match; // 태그 정보
        const name = rawName.toLowerCase(); // 태그 이름
        cursor = tagPattern.lastIndex; // 읽은 위치 갱신
        if (closing) // 닫는 태그 확인
        { // 조건 시작
            continue; // 다음 태그
        } // 조건 끝
        for (const attribute of attributes.matchAll(/([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) // 속성 반복
        { // 반복 시작
            const attributeName = attribute[1].toLowerCase(); // 속성 이름
            if (!SKIPPED_ATTRIBUTES.has(attributeName) && !attributeName.startsWith("data-analytics") && (name !== "meta" || attributeName === "content")) // 문구가 될 수 있는 속성 확인
            { // 조건 시작
                addEntry(target, decodeEntities(attribute[3] ?? attribute[4] ?? "")); // 속성 문구 수집
            } // 조건 끝
        } // 반복 끝
        if (name === "script" || name === "style") // 원문 요소 확인
        { // 조건 시작
            const end = source.toLowerCase().indexOf(`</${name}`, cursor); // 닫는 위치
            const body = source.slice(cursor, end < 0 ? source.length : end); // 원문 내용
            if (name === "script" && !/\bsrc\s*=/.test(attributes) && !/type\s*=\s*["']application\/(ld\+)?json/.test(attributes)) // 문서 안 스크립트 확인
            { // 조건 시작
                collectScript(body, target); // 스크립트 문구 수집
            } // 조건 끝
            cursor = end < 0 ? source.length : end; // 원문 건너뛰기
            tagPattern.lastIndex = cursor; // 태그 검색 위치 갱신
        } // 조건 끝
    } // 반복 끝
    addEntry(target, decodeEntities(source.slice(cursor))); // 남은 글자 수집
} // 함수 끝

function collectLiteral(text, target) // 문자열 문구 수집
{ // 함수 시작
    if (!hasHangul(text)) // 한글 없음 확인
    { // 조건 시작
        return; // 수집 생략
    } // 조건 끝
    if (/<[a-zA-Z/][^>]*>/.test(text)) // HTML 조각 확인
    { // 조건 시작
        collectMarkup(text, target); // 조각 문구 수집
        return; // 처리 종료
    } // 조건 끝
    addEntry(target, text); // 일반 문구 수집
} // 함수 끝

function isPlus(node) // 더하기 연결 확인
{ // 함수 시작
    return ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken; // 더하기 여부 반환
} // 함수 끝

function isConcatenationRoot(node) // 연결식 시작점 확인
{ // 함수 시작
    return isPlus(node) && !isPlus(node.parent); // 가장 바깥 더하기 확인
} // 함수 끝

function flattenConcatenation(node) // 연결 조각 펼치기
{ // 함수 시작
    if (isPlus(node)) // 더하기 확인
    { // 조건 시작
        return [...flattenConcatenation(node.left), ...flattenConcatenation(node.right)]; // 양쪽 펼치기
    } // 조건 끝
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) // 고정 문자열 확인
    { // 조건 시작
        return [node.text]; // 문자열 조각
    } // 조건 끝
    return [node]; // 값 조각
} // 함수 끝

function collectTemplate(template, target) // 형식 문구 기록
{ // 함수 시작
    if (!/<[a-zA-Z/][^>]*>/.test(template)) // HTML 없는 형식 확인
    { // 조건 시작
        target.templates.add(normalizeText(template)); // 형식 그대로 기록
        return; // 처리 종료
    } // 조건 끝
    const pieces = { entries: new Set(), templates: new Set() }; // HTML 안 조각
    collectMarkup(template, pieces); // 글자·속성 조각 수집
    for (const piece of pieces.entries) // 조각 반복
    { // 반복 시작
        (/\{\d+\}/.test(piece) ? target.templates : target.entries).add(piece); // 자리 표시 여부로 분류
    } // 반복 끝
} // 함수 끝

export function collectScript(code, target, kind = ts.ScriptKind.JS) // 스크립트 문구 수집
{ // 함수 시작
    const file = ts.createSourceFile(kind === ts.ScriptKind.TSX ? "inline.tsx" : kind === ts.ScriptKind.TS ? "inline.ts" : "inline.js", code, ts.ScriptTarget.Latest, true, kind); // 구문 분석
    const visit = (node) => // 노드 방문
    { // 방문 시작
        if (ts.isJsxText(node)) // JSX 글자 확인
        { // 조건 시작
            addEntry(target, decodeEntities(node.text)); // 화면 글자 수집(문자 참조 해석)
        } // 조건 끝
        if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) // 모듈 경로 확인
        { // 조건 시작
            return; // 경로 문자열 제외
        } // 조건 끝
        if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) // 일반 문자열 확인
        { // 조건 시작
            collectLiteral(node.text, target); // 문자열 수집
        } // 조건 끝
        else if (isConcatenationRoot(node)) // 더하기로 이은 문구 확인
        { // 조건 시작
            const parts = flattenConcatenation(node); // 연결 조각
            if (parts.some((part) => typeof part === "string" && hasHangul(part)) && parts.some((part) => typeof part !== "string")) // 한글과 값 혼합 확인
            { // 조건 시작
                let index = 0; // 자리 번호
                collectTemplate(parts.map((part) => (typeof part === "string" ? part : `{${index++}}`)).join(""), target); // 형식 문구 기록
            } // 조건 끝
        } // 조건 끝
        else if (ts.isIdentifier(node) && hasHangul(node.text)) // 한글 이름 키 확인
        { // 조건 시작
            addEntry(target, node.text); // 화면에 쓰이는 키 이름 수집
        } // 조건 끝
        else if (ts.isTemplateExpression(node)) // 값이 끼워진 문자열 확인
        { // 조건 시작
            const parts = [node.head.text, ...node.templateSpans.map((span) => span.literal.text)]; // 고정 조각
            const template = parts.map((part, index) => (index === 0 ? part : `{${index - 1}}${part}`)).join(""); // 자리 표시 문구
            if (hasHangul(template)) // 한글 포함 확인
            { // 조건 시작
                collectTemplate(template, target); // 형식 문구 기록
                for (const part of parts) // 조각 반복
                { // 반복 시작
                    collectLiteral(part, target); // 고정 조각 수집
                } // 반복 끝
            } // 조건 끝
        } // 조건 끝
        ts.forEachChild(node, visit); // 하위 노드 방문
    }; // 방문 끝
    visit(file); // 전체 방문
} // 함수 끝

export function listSourceFiles(root = PUBLIC_ROOT) // 번역 대상 파일 목록
{ // 함수 시작
    const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => // 폴더 반복
    { // 반복 시작
        const fullPath = path.join(directory, entry.name); // 전체 경로
        if (entry.isDirectory()) // 하위 폴더 확인
        { // 조건 시작
            return entry.name === "images" || entry.name === "i18n" ? [] : walk(fullPath); // 이미지·사전 제외
        } // 조건 끝
        return /\.(html|mjs|js)$/.test(entry.name) && !EXCLUDED_FILES.has(entry.name) ? [fullPath] : []; // 대상 파일 선택
    }); // 반복 끝
    return walk(root).map((file) => path.relative(root, file).replaceAll("\\", "/")).sort(); // 상대 경로 반환
} // 함수 끝

export function extractFile(relativePath, root = PUBLIC_ROOT) // 파일 하나 추출
{ // 함수 시작
    const target = { entries: new Set(), templates: new Set() }; // 결과 묶음
    const source = fs.readFileSync(path.join(root, relativePath), "utf8"); // 파일 읽기
    if (relativePath.endsWith(".html")) // 문서 확인
    { // 조건 시작
        collectMarkup(source, target); // 문서 수집
    } // 조건 끝
    else // 스크립트 처리
    { // 대안 시작
        collectScript(source, target); // 스크립트 수집
    } // 대안 끝
    return target; // 결과 반환
} // 함수 끝

export function listNextSourceFiles(root = PROJECT_ROOT) // Next 화면 문구 파일 목록
{ // 함수 시작
    const walk = (directory) => fs.readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap((entry) => // 폴더 반복
    { // 반복 시작
        const relative = `${directory}/${entry.name}`; // 저장소 기준 경로
        return entry.isDirectory() ? walk(relative) : /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".d.ts") ? [relative] : []; // 대상 파일 선택
    }); // 반복 끝
    return [...NEXT_SOURCE_DIRECTORIES.flatMap(walk), ...NEXT_SOURCE_FILES].filter((file) => !NEXT_EXCLUDED.some((pattern) => pattern.test(file))).sort(); // 관리자 제외 목록 반환
} // 함수 끝

export function extractNextFile(relativePath, root = PROJECT_ROOT) // Next 화면 파일 추출
{ // 함수 시작
    const target = { entries: new Set(), templates: new Set() }; // 결과 묶음
    collectScript(fs.readFileSync(path.join(root, relativePath), "utf8"), target, relativePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS); // 문구 수집
    return target; // 결과 반환
} // 함수 끝

export function extractAll(root = PUBLIC_ROOT) // 전체 묶음 추출
{ // 함수 시작
    const bundles = new Map(); // 묶음별 결과
    const nextBundle = { entries: new Map(), templates: new Map() }; // Next 화면 묶음
    for (const file of root === PUBLIC_ROOT ? listNextSourceFiles() : []) // Next 파일 반복
    { // 반복 시작
        const result = extractNextFile(file); // 파일 결과
        result.entries.forEach((entry) => nextBundle.entries.set(entry, [...(nextBundle.entries.get(entry) ?? []), file])); // 출처 기록
        result.templates.forEach((template) => nextBundle.templates.set(template, [...(nextBundle.templates.get(template) ?? []), file])); // 출처 기록
    } // 반복 끝
    if (nextBundle.entries.size > 0) // Next 문구 확인
    { // 조건 시작
        bundles.set(NEXT_BUNDLE, nextBundle); // Next 묶음 저장
    } // 조건 끝
    for (const file of listSourceFiles(root)) // 파일 반복
    { // 반복 시작
        const bundle = bundleForFile(file); // 사전 묶음
        const result = extractFile(file, root); // 파일 결과
        const current = bundles.get(bundle) ?? { entries: new Map(), templates: new Map() }; // 기존 묶음
        for (const entry of result.entries) // 문구 반복
        { // 반복 시작
            current.entries.set(entry, [...(current.entries.get(entry) ?? []), file]); // 출처 기록
        } // 반복 끝
        for (const template of result.templates) // 형식 반복
        { // 반복 시작
            current.templates.set(template, [...(current.templates.get(template) ?? []), file]); // 출처 기록
        } // 반복 끝
        bundles.set(bundle, current); // 묶음 저장
    } // 반복 끝
    const site = bundles.get(SITE_BUNDLE); // 공통 묶음
    for (const file of root === PUBLIC_ROOT && site ? SHARED_SERVER_FILES : []) // 정적·Next 화면이 함께 받는 서버 안내 반복
    { // 반복 시작
        const result = extractNextFile(file); // 파일 결과
        result.entries.forEach((entry) => site.entries.set(entry, [...(site.entries.get(entry) ?? []), file])); // 공통 사전에 출처 기록
        result.templates.forEach((template) => site.templates.set(template, [...(site.templates.get(template) ?? []), file])); // 공통 사전에 형식 기록
    } // 반복 끝
    for (const [name, bundle] of bundles) // 프로젝트 묶음 반복
    { // 반복 시작
        if (name !== SITE_BUNDLE && site) // 공통 중복 확인
        { // 조건 시작
            for (const entry of [...bundle.entries.keys()].filter((key) => site.entries.has(key))) // 공통 문구 반복
            { // 반복 시작
                bundle.entries.delete(entry); // 공통 사전 사용
            } // 반복 끝
        } // 조건 끝
    } // 반복 끝
    return bundles; // 묶음 반환
} // 함수 끝

export function readDictionary(bundle, root = DICTIONARY_ROOT) // 영어 사전 읽기
{ // 함수 시작
    const file = path.join(root, `${bundle}.json`); // 사전 파일
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : { entries: {}, patterns: [] }; // 사전 반환
} // 함수 끝

export function findMissing(bundles = extractAll()) // 빠진 번역 찾기
{ // 함수 시작
    const site = readDictionary(SITE_BUNDLE); // 공통 사전
    const missing = []; // 빠진 목록
    for (const [name, bundle] of bundles) // 묶음 반복
    { // 반복 시작
        const own = name === SITE_BUNDLE ? site : readDictionary(name); // 묶음 사전
        for (const [entry, files] of bundle.entries) // 문구 반복
        { // 반복 시작
            if (!(entry in own.entries) && !(entry in site.entries)) // 번역 누락 확인
            { // 조건 시작
                missing.push({ bundle: name, entry, files }); // 누락 기록
            } // 조건 끝
        } // 반복 끝
    } // 반복 끝
    return missing; // 누락 반환
} // 함수 끝

export function findPatternIssues(bundles = extractAll()) // 형식 번역 누락·잔여 찾기
{ // 함수 시작
    const site = readDictionary(SITE_BUNDLE); // 공통 사전
    const missing = []; // 빠진 형식
    const stale = []; // 오래된 형식
    for (const [name, bundle] of bundles) // 묶음 반복
    { // 반복 시작
        const own = name === SITE_BUNDLE ? site : readDictionary(name); // 묶음 사전
        const known = new Set([...own.patterns, ...site.patterns].map((pattern) => pattern.ko)); // 번역된 형식
        for (const template of bundle.templates.keys()) // 형식 반복
        { // 반복 시작
            if (!known.has(template)) // 형식 번역 확인
            { // 조건 시작
                missing.push({ bundle: name, template }); // 누락 기록
            } // 조건 끝
        } // 반복 끝
        for (const pattern of own.patterns) // 사전 형식 반복
        { // 반복 시작
            if (hasHangul(pattern.ko) && !pattern.compound && !bundle.templates.has(pattern.ko)) // 원문 형식 확인(기호 전용·조합 규칙 제외)
            { // 조건 시작
                stale.push({ bundle: name, template: pattern.ko }); // 오래된 형식 기록
            } // 조건 끝
        } // 반복 끝
    } // 반복 끝
    return { missing, stale }; // 형식 점검 결과
} // 함수 끝

export function findStale(bundles = extractAll()) // 원문에서 사라진 번역 찾기
{ // 함수 시작
    const stale = []; // 오래된 목록
    for (const [name, bundle] of bundles) // 묶음 반복
    { // 반복 시작
        for (const entry of Object.keys(readDictionary(name).entries)) // 사전 문구 반복
        { // 반복 시작
            const base = entry.includes("::") ? entry.slice(entry.indexOf("::") + 2) : entry; // 문맥 표시 뺀 원문
            if (!bundle.entries.has(base) && !(entry.includes("::") && bundles.get(SITE_BUNDLE)?.entries.has(base))) // 원문 존재 확인
            { // 조건 시작
                stale.push({ bundle: name, entry }); // 오래된 번역 기록
            } // 조건 끝
        } // 반복 끝
    } // 반복 끝
    return stale; // 오래된 번역 반환
} // 함수 끝

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) // 직접 실행 확인
{ // 조건 시작
    const output = process.argv.slice(2).find((argument) => !argument.startsWith("--")); // 결과 저장 위치(옵션 제외)
    const bundles = extractAll(); // 전체 추출
    const missing = findMissing(bundles); // 누락 확인
    if (output) // 저장 요청 확인
    { // 조건 시작
        const data = Object.fromEntries([...bundles].map(([name, bundle]) => [name, { entries: [...bundle.entries.keys()], templates: [...bundle.templates.keys()] }])); // 저장 형식
        fs.writeFileSync(output, JSON.stringify({ bundles: data, missing }, null, 2)); // 결과 저장
    } // 조건 끝
    for (const [name, bundle] of bundles) // 묶음 요약 반복
    { // 반복 시작
        console.log(`${name}: 문구 ${bundle.entries.size}개, 형식 ${bundle.templates.size}개`); // 묶음 요약 출력
    } // 반복 끝
    console.log(`번역 누락 ${missing.length}개`); // 누락 수 출력
    process.exitCode = missing.length > 0 && process.argv.includes("--strict") ? 1 : 0; // 엄격 모드 종료 코드
} // 조건 끝
