import zipfile
import os
import shutil
from PIL import Image
import sys

# -------------------------------------------------------------------
IMAGE_EXTS = (".jpg", ".jpeg", ".png")
MEDIA_EXTS = (".mp4", ".mov", ".avi", ".mp3", ".wav")

QUALITY_MAP = {
    "low": 85,
    "normal": 65,
    "extreme": 40
}

MAX_WIDTH_MAP = {
    "low": None,
    "normal": 1600,
    "extreme": 1000
}

#----------------------------------------------------------------------

def compress_image(img_path, level):
    img = Image.open(img_path)
    img = img.convert("RGB")

    max_width = MAX_WIDTH_MAP[level]
    if max_width and img.width > max_width:
        ratio = max_width / img.width
        img = img.resize(
            (max_width, int(img.height * ratio)),
            Image.LANCZOS
        )

    img.save(
        img_path,
        "JPEG",
        quality=QUALITY_MAP[level],
        optimize=True
    )


def compress_pptx(input_pptx, output_pptx, level, remove_media):
    temp_dir = "temp_pptx"

    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)
    os.makedirs(temp_dir)

    # Extract PPTX
    with zipfile.ZipFile(input_pptx, "r") as zip_ref:
        zip_ref.extractall(temp_dir)

    media_dir = os.path.join(temp_dir, "ppt", "media")

    if os.path.exists(media_dir):
        for file in os.listdir(media_dir):
            file_path = os.path.join(media_dir, file)

            # Remove video/audio if selected
            if remove_media and file.lower().endswith(MEDIA_EXTS):
                os.remove(file_path)
                continue

            # Compress images
            if file.lower().endswith(IMAGE_EXTS):
                compress_image(file_path, level)

    # Repack PPTX
    with zipfile.ZipFile(output_pptx, "w", zipfile.ZIP_DEFLATED) as zip_out:
        for folder, _, files in os.walk(temp_dir):
            for file in files:
                full_path = os.path.join(folder, file)
                rel_path = os.path.relpath(full_path, temp_dir)
                zip_out.write(full_path, rel_path)

    shutil.rmtree(temp_dir)


# CLI entry (used by Node.js)
if __name__ == "__main__":
    if len(sys.argv) < 5:
        print("Usage: python pptx_compress.py input.pptx output.pptx level removeMedia")
        sys.exit(1)

    input_pptx = sys.argv[1]
    output_pptx = sys.argv[2]
    level = sys.argv[3]
    remove_media = sys.argv[4].lower() == "true"

    compress_pptx(input_pptx, output_pptx, level, remove_media)
