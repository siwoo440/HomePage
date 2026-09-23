from pathlib import Path  # 경로 도구
from PIL import Image  # 이미지 도구

PROJECT_ROOT = Path(__file__).resolve().parent.parent  # 프로젝트 경로
IMAGE_ROOT = PROJECT_ROOT / "public" / "images" / "goods"  # 상품 이미지 경로
REFERENCE_PATHS = [  # 참조 파일 목록
    PROJECT_ROOT / "public" / "main.html",  # 메인 화면 파일
    PROJECT_ROOT / "public" / "goods.html",  # 굿즈 화면 파일
    PROJECT_ROOT / "supabase" / "migrations" / "202609110001_admin_products.sql",  # 초기 상품 파일
]  # 참조 파일 목록 끝
IMAGE_NAMES = [  # 상품 이미지 이름
    "abyss-keyring",  # 키링 이미지
    "neon-pulse-hoodie",  # 후드집업 이미지
    "luna-jump-posters",  # 포스터 이미지
    "devforge-mug",  # 머그컵 이미지
    "all-games-stickers",  # 스티커 이미지
    "echo-void-mousepad",  # 마우스패드 이미지
    "abyss-pin-set",  # 핀뱃지 이미지
    "neon-pulse-ost",  # 음반 이미지
]  # 상품 이미지 이름 끝


def optimize_image(image_name: str) -> None:  # 이미지 최적화 함수
    source_path = IMAGE_ROOT / f"{image_name}.png"  # 원본 이미지 경로
    output_path = IMAGE_ROOT / f"{image_name}.webp"  # 변환 이미지 경로

    with Image.open(source_path) as source_image:  # 원본 이미지 열기
        converted_image = source_image.convert("RGB")  # 웹 색상 형식 변환
        converted_image.thumbnail((960, 960), Image.Resampling.LANCZOS)  # 최대 크기 축소
        converted_image.save(output_path, "WEBP", quality=78, method=6)  # WebP 이미지 저장

    source_path.unlink()  # 원본 PNG 삭제


def update_references() -> None:  # 이미지 경로 갱신 함수
    for reference_path in REFERENCE_PATHS:  # 참조 파일 반복
        content = reference_path.read_text(encoding="utf-8")  # 참조 파일 읽기

        for image_name in IMAGE_NAMES:  # 이미지 이름 반복
            content = content.replace(f"{image_name}.png", f"{image_name}.webp")  # 확장자 교체

        reference_path.write_text(content, encoding="utf-8", newline="")  # 참조 파일 저장


for name in IMAGE_NAMES:  # 상품 이미지 반복
    optimize_image(name)  # 상품 이미지 최적화

update_references()  # 전체 참조 경로 갱신
