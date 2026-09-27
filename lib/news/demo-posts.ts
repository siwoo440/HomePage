export interface PublicNewsPost // 공개 뉴스 형식
{ // 형식 시작
    id: string; // 게시물 식별자
    title: string; // 뉴스 제목
    summary: string; // 뉴스 요약
    content: string; // 뉴스 본문
    tags: string[]; // 뉴스 태그
    publishedAt: string; // 공개 시각
    coverImageUrl: string | null; // 대표 이미지 주소
} // 형식 끝

export const DEMO_NEWS_POSTS: PublicNewsPost[] = // 시연 뉴스 목록
[ // 목록 시작
    { id: "demo-echo-void", title: "에코 보이드 v0.8 — 음향 엔진 전면 재설계 완료", summary: "실시간 3D HRTF 처리 방식과 신규 레벨을 소개합니다.", content: "3개월간의 작업 끝에 에코 보이드의 핵심 음향 공간화 엔진을 재구성했습니다.\n\n기존 2D 기반 사운드 처리에서 실시간 3D HRTF 처리 방식으로 전환했으며, 새로운 음향 경험을 점검할 신규 레벨 12개도 함께 준비했습니다.\n\n이 글은 실제 뉴스 등록 서버를 연결하기 전 상세 화면과 댓글 기능을 확인하기 위한 시연 콘텐츠입니다.", tags: ["update", "feature"], publishedAt: "2025-04-28T09:00:00+09:00", coverImageUrl: null }, // 에코 보이드 뉴스
    { id: "demo-star-vagrant", title: "스타 베이그런트 — 절차적 생성 은하계 알고리즘 공개", summary: "씨앗 기반 우주 생성 구조를 소개합니다.", content: "스타 베이그런트는 같은 규칙을 사용하더라도 매번 다른 은하계를 만들도록 설계하고 있습니다.\n\n씨앗 값, 노이즈 함수와 Voronoi 다이어그램을 조합해 성계의 위치와 특성을 정합니다. 플레이 흐름이 반복되지 않도록 탐험 밀도도 함께 조정하고 있습니다.\n\n현재 내용은 알고리즘 소개 화면을 위한 시연 개발 기록입니다.", tags: ["devlog"], publishedAt: "2025-04-15T09:00:00+09:00", coverImageUrl: null }, // 스타 베이그런트 뉴스
    { id: "demo-neon-pulse", title: "네온 펄스 v2.1.3 패치 — 주요 버그 수정 및 성능 개선", summary: "전투 오류 수정과 GPU 최적화 내용을 정리했습니다.", content: "플레이어가 제보한 스킬 겹침 현상과 일부 보스 패턴이 나타나지 않던 문제를 수정했습니다.\n\n이펙트 표시 단계를 줄여 낮은 사양의 GPU에서도 더 안정적인 프레임을 유지하도록 조정했습니다.\n\n실제 패치 노트가 등록되기 전 화면 구성을 확인하기 위한 시연 뉴스입니다.", tags: ["fix"], publishedAt: "2025-04-03T09:00:00+09:00", coverImageUrl: null }, // 네온 펄스 뉴스
    { id: "demo-blade-rift", title: "블레이드 리프트 — 패링 피드백 시스템 새로 설계", summary: "시각·진동·음향 피드백 선택 구조를 검토합니다.", content: "패링 타이밍을 더 분명하게 전달하기 위해 시각, 진동과 음향 피드백을 각각 조절할 수 있는 구조를 설계했습니다.\n\n접근성 설정에서는 효과 강도를 낮추거나 특정 종류의 안내만 사용할 수 있도록 구성할 예정입니다.\n\n이 글은 기능 소개 형식을 검증하기 위한 시연 콘텐츠입니다.", tags: ["feature"], publishedAt: "2025-03-22T09:00:00+09:00", coverImageUrl: null }, // 블레이드 리프트 뉴스
]; // 목록 끝

export function resolveDemoNewsPost(id: string): PublicNewsPost | null // 시연 뉴스 찾기
{ // 함수 시작
    return DEMO_NEWS_POSTS.find((post) => post.id === id) ?? null; // 일치 뉴스 반환
} // 함수 끝
