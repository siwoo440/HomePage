import type { CommunityGame } from "@/lib/community/types"; // 게임 형식

export const COMMUNITY_GAMES: readonly CommunityGame[] = Object.freeze( // 게임 목록 시작
[ // 게임 배열 시작
    { id: "project-a", label: "프로젝트 A — 아스트로이아", hashtag: "#DEVFORGEProjectA", searchTerms: ["DEVFORGE 프로젝트 A", "아스트로이아"] }, // 프로젝트 A
    { id: "project-b", label: "프로젝트 B", hashtag: "#DEVFORGEProjectB", searchTerms: ["DEVFORGE 프로젝트 B", "Project B"] }, // 프로젝트 B
    { id: "project-c", label: "프로젝트 C — 카오스폰즈", hashtag: "#DEVFORGEProjectC", searchTerms: ["DEVFORGE 프로젝트 C", "카오스폰즈"] }, // 프로젝트 C
    { id: "project-d", label: "프로젝트 D — 바스티온", hashtag: "#DEVFORGEProjectD", searchTerms: ["DEVFORGE 프로젝트 D", "바스티온"] }, // 프로젝트 D
    { id: "project-e", label: "프로젝트 E", hashtag: "#DEVFORGEProjectE", searchTerms: ["DEVFORGE 프로젝트 E", "Project E"] }, // 프로젝트 E
    { id: "project-f", label: "프로젝트 F", hashtag: "#DEVFORGEProjectF", searchTerms: ["DEVFORGE 프로젝트 F", "Project F"] }, // 프로젝트 F
    { id: "project-g", label: "프로젝트 G", hashtag: "#DEVFORGEProjectG", searchTerms: ["DEVFORGE 프로젝트 G", "Project G"] }, // 프로젝트 G
    { id: "project-h", label: "프로젝트 H", hashtag: "#DEVFORGEProjectH", searchTerms: ["DEVFORGE 프로젝트 H", "Project H"] }, // 프로젝트 H
    { id: "project-i", label: "프로젝트 I", hashtag: "#DEVFORGEProjectI", searchTerms: ["DEVFORGE 프로젝트 I", "Project I"] }, // 프로젝트 I
    { id: "project-j", label: "프로젝트 J", hashtag: "#DEVFORGEProjectJ", searchTerms: ["DEVFORGE 프로젝트 J", "Project J"] }, // 프로젝트 J
    { id: "project-k", label: "프로젝트 K", hashtag: "#DEVFORGEProjectK", searchTerms: ["DEVFORGE 프로젝트 K", "Project K"] }, // 프로젝트 K
    { id: "project-l", label: "프로젝트 L", hashtag: "#DEVFORGEProjectL", searchTerms: ["DEVFORGE 프로젝트 L", "Project L"] }, // 프로젝트 L
    { id: "project-m", label: "프로젝트 M", hashtag: "#DEVFORGEProjectM", searchTerms: ["DEVFORGE 프로젝트 M", "Project M"] }, // 프로젝트 M
    { id: "project-n", label: "프로젝트 N", hashtag: "#DEVFORGEProjectN", searchTerms: ["DEVFORGE 프로젝트 N", "Project N"] }, // 프로젝트 N
    { id: "project-o", label: "프로젝트 O", hashtag: "#DEVFORGEProjectO", searchTerms: ["DEVFORGE 프로젝트 O", "Project O"] }, // 프로젝트 O
    { id: "project-p", label: "프로젝트 P", hashtag: "#DEVFORGEProjectP", searchTerms: ["DEVFORGE 프로젝트 P", "Project P"] }, // 프로젝트 P
    { id: "project-q", label: "프로젝트 Q", hashtag: "#DEVFORGEProjectQ", searchTerms: ["DEVFORGE 프로젝트 Q", "Project Q"] }, // 프로젝트 Q
    { id: "project-r", label: "프로젝트 R", hashtag: "#DEVFORGEProjectR", searchTerms: ["DEVFORGE 프로젝트 R", "Project R"] }, // 프로젝트 R
    { id: "project-s", label: "프로젝트 S", hashtag: "#DEVFORGEProjectS", searchTerms: ["DEVFORGE 프로젝트 S", "Project S"] }, // 프로젝트 S
    { id: "project-t", label: "프로젝트 T", hashtag: "#DEVFORGEProjectT", searchTerms: ["DEVFORGE 프로젝트 T", "Project T"] }, // 프로젝트 T
    { id: "project-u", label: "프로젝트 U", hashtag: "#DEVFORGEProjectU", searchTerms: ["DEVFORGE 프로젝트 U", "Project U"] }, // 프로젝트 U
    { id: "project-v", label: "프로젝트 V", hashtag: "#DEVFORGEProjectV", searchTerms: ["DEVFORGE 프로젝트 V", "Project V"] }, // 프로젝트 V
    { id: "project-w", label: "프로젝트 W", hashtag: "#DEVFORGEProjectW", searchTerms: ["DEVFORGE 프로젝트 W", "Project W"] }, // 프로젝트 W
    { id: "project-x", label: "프로젝트 X — 심야탐정부", hashtag: "#DEVFORGEProjectX", searchTerms: ["DEVFORGE 프로젝트 X", "심야탐정부"] }, // 프로젝트 X
    { id: "project-y", label: "프로젝트 Y", hashtag: "#DEVFORGEProjectY", searchTerms: ["DEVFORGE 프로젝트 Y", "Project Y"] }, // 프로젝트 Y
    { id: "project-z", label: "프로젝트 Z", hashtag: "#DEVFORGEProjectZ", searchTerms: ["DEVFORGE 프로젝트 Z", "Project Z"] }, // 프로젝트 Z
    { id: "project-alpha", label: "프로젝트 α", hashtag: "#DEVFORGEProjectAlpha", searchTerms: ["DEVFORGE 프로젝트 알파", "Project Alpha"] }, // 프로젝트 알파
    { id: "project-beta", label: "프로젝트 β", hashtag: "#DEVFORGEProjectBeta", searchTerms: ["DEVFORGE 프로젝트 베타", "Project Beta"] }, // 프로젝트 베타
    { id: "project-gamma", label: "프로젝트 γ", hashtag: "#DEVFORGEProjectGamma", searchTerms: ["DEVFORGE 프로젝트 감마", "Project Gamma"] }, // 프로젝트 감마
    { id: "project-delta", label: "프로젝트 δ", hashtag: "#DEVFORGEProjectDelta", searchTerms: ["DEVFORGE 프로젝트 델타", "Project Delta"] }, // 프로젝트 델타
    { id: "project-epsilon", label: "프로젝트 ε", hashtag: "#DEVFORGEProjectEpsilon", searchTerms: ["DEVFORGE 프로젝트 엡실론", "Project Epsilon"] }, // 프로젝트 엡실론
    { id: "project-zeta", label: "프로젝트 ζ", hashtag: "#DEVFORGEProjectZeta", searchTerms: ["DEVFORGE 프로젝트 제타", "Project Zeta"] }, // 프로젝트 제타
    { id: "project-eta", label: "프로젝트 η", hashtag: "#DEVFORGEProjectEta", searchTerms: ["DEVFORGE 프로젝트 에타", "Project Eta"] }, // 프로젝트 에타
    { id: "project-theta", label: "프로젝트 θ", hashtag: "#DEVFORGEProjectTheta", searchTerms: ["DEVFORGE 프로젝트 세타", "Project Theta"] }, // 프로젝트 세타
    { id: "project-iota", label: "프로젝트 ι", hashtag: "#DEVFORGEProjectIota", searchTerms: ["DEVFORGE 프로젝트 이오타", "Project Iota"] }, // 프로젝트 이오타
]); // 게임 배열 끝

export function resolveCommunityGame(gameId: string): CommunityGame | null // 게임 설정 조회
{ // 함수 시작
    return COMMUNITY_GAMES.find((game) => game.id === gameId) ?? null; // 허용 게임 반환
} // 함수 끝
