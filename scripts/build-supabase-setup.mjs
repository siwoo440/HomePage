import fs from "node:fs"; // 파일 시스템 도구
import path from "node:path"; // 경로 처리 도구
import { fileURLToPath } from "node:url"; // 모듈 주소 변환 도구
import { SUPABASE_MIGRATIONS } from "./check-supabase-env.mjs"; // 마이그레이션 적용 순서

export const SETUP_SQL_PATH = "supabase/.temp/setup-all.sql"; // 한 번에 붙여 넣을 파일 위치(저장소에 올리지 않음)

export function buildSupabaseSetupSql(root = process.cwd()) // 마이그레이션을 순서대로 하나로 묶기
{ // 함수 시작
    const parts = SUPABASE_MIGRATIONS.map((file) => `-- ===== ${file} =====\n${fs.readFileSync(path.join(root, "supabase", "migrations", file), "utf8").replace(/\r\n/g, "\n").trim()}\n`); // 파일별 내용
    return ["-- DEVFORGE 데이터베이스 설정: 새 Supabase 프로젝트의 SQL Editor에 전체를 붙여 넣고 한 번만 실행합니다.", "-- 중간에 오류가 나면 아무것도 적용되지 않습니다(전부 되돌림).", "begin;", "", ...parts, "commit;", ""].join("\n"); // 전부 성공할 때만 적용되도록 감싼 결과
} // 함수 끝

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) // 직접 실행 확인
{ // 조건 시작
    const target = path.join(process.cwd(), SETUP_SQL_PATH); // 저장 위치
    fs.mkdirSync(path.dirname(target), { recursive: true }); // 폴더 준비
    fs.writeFileSync(target, buildSupabaseSetupSql(), "utf8"); // 묶은 파일 저장
    console.log(`${SETUP_SQL_PATH} 파일을 만들었습니다(마이그레이션 ${SUPABASE_MIGRATIONS.length}개). 새 Supabase 프로젝트의 SQL Editor에 전체를 붙여 넣고 한 번 실행하세요.`); // 결과 안내
    console.log("이미 일부를 적용한 프로젝트에는 쓰지 않습니다. 그때는 supabase/migrations 폴더에서 아직 실행하지 않은 파일만 차례로 실행합니다."); // 주의 안내
} // 조건 끝
