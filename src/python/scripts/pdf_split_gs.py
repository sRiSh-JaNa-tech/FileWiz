import os
import sys
import math
import subprocess

# 🔧 Your Ghostscript executable (confirm this path)
GS_PATH = r"C:\Program Files\gs\gs10.06.0\bin\gswin64c.exe"

# ⚡ Fast split flags (NO recompression)
SPLIT_FLAGS = [
    "-dNOSAFER",
    "-dNOPAUSE",
    "-dBATCH",
    "-dQUIET",
]

# -------------------------------
# Get total page count (WINDOWS SAFE)
# -------------------------------
def get_page_count(pdf_path):
    # Convert Windows path → Ghostscript-safe path
    gs_pdf = pdf_path.replace("\\", "/")

    cmd = [
        GS_PATH,
        "-dNOSAFER",
        "-q",
        "-dNODISPLAY",
        "-c",
        f"({gs_pdf}) (r) file runpdfbegin pdfpagecount = quit"
    ]

    output = subprocess.check_output(cmd, universal_newlines=True)
    return int(output.strip())


# -------------------------------
# Split pages using Ghostscript
# -------------------------------
def split_pages(input_pdf, start, end, output_pdf):
    in_pdf = input_pdf.replace("\\", "/")
    out_pdf = output_pdf.replace("\\", "/")

    cmd = (
        [GS_PATH, "-sDEVICE=pdfwrite"]
        + SPLIT_FLAGS
        + [
            f"-dFirstPage={start}",
            f"-dLastPage={end}",
            f"-sOutputFile={out_pdf}",
            in_pdf
        ]
    )
    
    subprocess.run(cmd, check=True)


# -------------------------------
# Split into N equal parts
# -------------------------------
def split_by_count(input_pdf, output_dir, parts):
    total_pages = get_page_count(input_pdf)

    if parts > total_pages:
        parts = total_pages  # prevent invalid ranges

    pages_per_part = math.ceil(total_pages / parts)

    current_page = 1
    index = 1

    while current_page <= total_pages:
        end_page = current_page + pages_per_part - 1

        # 🔑 HARD CLAMP (this prevents GS crash)
        if end_page > total_pages:
            end_page = total_pages

        output_file = os.path.join(output_dir, f"part_{index}.pdf")

        split_pages(input_pdf, current_page, end_page, output_file)

        current_page = end_page + 1
        index += 1


# -------------------------------
# Split by page ranges
# -------------------------------
def split_by_ranges(input_pdf, output_dir, ranges):
    for i, r in enumerate(ranges):
        start, end = map(int, r.split("-"))
        out = os.path.join(output_dir, f"part_{i + 1}.pdf")
        split_pages(input_pdf, start, end, out)


# -------------------------------
# ENTRY POINT
# -------------------------------
if __name__ == "__main__":
    """
    Usage:
    python pdf_split_gs.py input.pdf output_dir count 3
    python pdf_split_gs.py input.pdf output_dir range 1-3,4-6
    """

    if len(sys.argv) < 5:
        print("Usage error")
        sys.exit(1)

    input_pdf = sys.argv[1]
    output_dir = sys.argv[2]
    mode = sys.argv[3]

    os.makedirs(output_dir, exist_ok=True)

    if mode == "count":
        split_by_count(input_pdf, output_dir, int(sys.argv[4]))

    elif mode == "range":
        split_by_ranges(input_pdf, output_dir, sys.argv[4].split(","))

    else:
        print("Invalid split mode")
        sys.exit(1)
