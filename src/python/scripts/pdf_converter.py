from pdf2docx import Converter
import fitz  # PyMuPDF
import os

GS_PATH = r"C:\Program Files\gs\gs10.06.0\bin\gswin64c.exe"

gs_command = [GS_PATH] if os.path.exists(GS_PATH) else ["gswin64c"]

base_flags = ["-dSAFER", "-dBATCH", "-dNOPAUSE"]

def convert_png(
    input_path: str,
    output_path: str,
    first_page: int | None = None,
    last_page: int | None = None,
    dpi: int = 300
):
    command = (
        gs_command
        + base_flags
        + ["-sDEVICE=png16m", f"-r{dpi}"]
    )

    if first_page is not None:
        command.append(f"-dFirstPage={first_page}")
    if last_page is not None:
        command.append(f"-dLastPage={last_page}")

    command += [f"-sOutputFile={output_path}", input_path]
    return command


def convert_jpeg(
    input_path: str,
    output_path: str,
    first_page: int | None = None,
    last_page: int | None = None,
    dpi: int = 300,
    quality: int = 90
):

    command = (
        gs_command
        + base_flags
        + ["-sDEVICE=jpeg", f"-r{dpi}", f"-dJPEGQ={quality}"]
    )

    if first_page is not None:
        command.append(f"-dFirstPage={first_page}")
    if last_page is not None:
        command.append(f"-dLastPage={last_page}")

    command += [f"-sOutputFile={output_path}", input_path]
    return command

def is_scanned_pdf(pdf_path: str, text_threshold: int = 50) -> bool:
    doc = fitz.open(pdf_path)
    try:
        for page in doc:
            text = page.get_text().strip()
            images = page.get_images(full=True)
            if len(text) < text_threshold and images:
                return True
        return False
    finally:
        doc.close()


def convert_pdf_to_docx(
    input_pdf: str,
    output_docx: str,
    start_page: int | None = None,
    end_page: int | None = None
):
    # ---------- Basic validation ----------
    if not os.path.exists(input_pdf):
        return {
            "success": False,
            "message": "Input PDF does not exist",
            "warning": None
        }

    if not input_pdf.lower().endswith(".pdf"):
        return {
            "success": False,
            "message": "Input file is not a PDF",
            "warning": None
        }

    # ---------- Detect scanned PDF ----------
    scanned = is_scanned_pdf(input_pdf)

    if scanned:
        return {
            "success": False,
            "message": "Scanned PDF detected",
            "warning": "This PDF appears to be image-based. OCR is required for accurate DOCX conversion."
        }

    # ---------- Page range validation ----------
    if start_page is not None and start_page < 0:
        return {
            "success": False,
            "message": "start_page must be >= 0",
            "warning": None
        }

    if end_page is not None and end_page < 0:
        return {
            "success": False,
            "message": "end_page must be >= 0",
            "warning": None
        }

    if start_page is not None and end_page is not None:
        if start_page > end_page:
            return {
                "success": False,
                "message": "start_page cannot be greater than end_page",
                "warning": None
            }

    # ---------- Conversion ----------
    warning_msg = (
        "PDF to DOCX conversion is best-effort. "
        "Complex layouts, columns, and fonts may not be preserved exactly."
    )

    cv = Converter(input_pdf)

    try:
        cv.convert(
            output_docx,
            start=start_page,
            end=end_page
        )
    except Exception as e:
        return {
            "success": False,
            "message": f"Conversion failed: {str(e)}",
            "warning": None
        }
    finally:
        cv.close()

    return {
        "success": True,
        "message": "PDF successfully converted to DOCX",
        "warning": warning_msg
    }

def convert_pdf_to_html(
    input_pdf: str,
    output_html: str,
    start_page: int | None = None,
    end_page: int | None = None
):
    """
    Fool-proof PDF → HTML conversion.

    Returns:
    {
        success: bool,
        message: str,
        warning: str | None
    }
    """

    # ---------- Validation ----------
    if not os.path.exists(input_pdf):
        return {
            "success": False,
            "message": "Input PDF does not exist",
            "warning": None
        }

    if not input_pdf.lower().endswith(".pdf"):
        return {
            "success": False,
            "message": "Input file is not a PDF",
            "warning": None
        }

    # ---------- Detect scanned PDF ----------
    if is_scanned_pdf(input_pdf):
        return {
            "success": False,
            "message": "Scanned PDF detected",
            "warning": "This PDF appears to be image-based. OCR is required for accurate HTML output."
        }

    # ---------- Open PDF ----------
    try:
        doc = fitz.open(input_pdf)
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to open PDF: {str(e)}",
            "warning": None
        }

    total_pages = doc.page_count

    # ---------- Page range handling ----------
    start = start_page if start_page is not None else 0
    end = end_page if end_page is not None else total_pages - 1

    if start < 0 or end >= total_pages or start > end:
        return {
            "success": False,
            "message": "Invalid page range",
            "warning": None
        }

    # ---------- HTML generation ----------
    html_parts = [
        "<!DOCTYPE html>",
        "<html>",
        "<head>",
        "<meta charset='utf-8'>",
        "<style>",
        "body { font-family: Arial, sans-serif; line-height: 1.5; }",
        ".page { margin-bottom: 40px; }",
        "</style>",
        "</head>",
        "<body>"
    ]

    try:
        for page_number in range(start, end + 1):
            page = doc.load_page(page_number)
            page_html = page.get_text("html")

            html_parts.append(f"<div class='page'>")
            html_parts.append(f"<h3>Page {page_number + 1}</h3>")
            html_parts.append(page_html)
            html_parts.append("</div>")

        html_parts.append("</body></html>")

        with open(output_html, "w", encoding="utf-8") as f:
            f.write("\n".join(html_parts))

    except Exception as e:
        return {
            "success": False,
            "message": f"HTML conversion failed: {str(e)}",
            "warning": None
        }
    finally:
        doc.close()

    return {
        "success": True,
        "message": "PDF successfully converted to HTML",
        "warning": (
            "PDF to HTML conversion is best-effort. "
            "Exact layout, columns, and fonts may not be preserved."
        )
    }