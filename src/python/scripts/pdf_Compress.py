import subprocess
import sys
import os

def compress_pdf(input_pdf, output_pdf, level="normal"):
    if not os.path.exists(input_pdf):
        raise FileNotFoundError(f"Input file not found: {input_pdf}")

    # Ghostscript path found on system
    gs_path = r"C:\Program Files\gs\gs10.06.0\bin\gswin64c.exe"
    if os.path.exists(gs_path):
        gs_command = [gs_path]
    else:
        gs_command = ["gswin64c"] # Fallback to PATH

    # Base Ghostscript flags
    base_flags = [
        "-sDEVICE=pdfwrite",
        "-dNOPAUSE",
        "-dQUIET",
        "-dBATCH",
        "-dCompatibilityLevel=1.4",
    ]

    # Compression profiles
    if level == "low":
        compression_flags = [
            "-dPDFSETTINGS=/printer",
            "-dDownsampleColorImages=false",
            "-dDownsampleGrayImages=false",
            "-dDownsampleMonoImages=false",
        ]

    elif level == "extreme":
        compression_flags = [
            "-dPDFSETTINGS=/screen",
            "-dDownsampleColorImages=true",
            "-dColorImageResolution=72",
            "-dDownsampleGrayImages=true",
            "-dGrayImageResolution=72",
            "-dDownsampleMonoImages=true",
            "-dMonoImageResolution=100",
        ]

    else:  # normal
        compression_flags = [
            "-dPDFSETTINGS=/ebook",
            "-dDownsampleColorImages=true",
            "-dColorImageResolution=96",
            "-dDownsampleGrayImages=true",
            "-dGrayImageResolution=96",
            "-dDownsampleMonoImages=true",
            "-dMonoImageResolution=150",
        ]

    command = (
        gs_command
        + base_flags
        + compression_flags
        + [f"-sOutputFile={output_pdf}", input_pdf]
    )

    try:
        subprocess.run(command, check=True)
        return True
    except subprocess.CalledProcessError as e:
        print("Ghostscript compression failed")
        print(e)
        return False


# CLI support (optional but useful)
if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage:")
        print("python pdf_compress.py input.pdf output.pdf [low|normal|extreme]")
        sys.exit(1)

    input_pdf = sys.argv[1]
    output_pdf = sys.argv[2]
    level = sys.argv[3].lower()

    success = compress_pdf(input_pdf, output_pdf, level)

    if success:
        print("PDF compressed successfully")