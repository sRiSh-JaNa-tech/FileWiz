import sys
import json
import base64
import os
import zipfile
import glob
from pdf_converter import convert_png, convert_jpeg, convert_pdf_to_html
import subprocess

def zip_files(file_pattern, output_zip):
    with zipfile.ZipFile(output_zip, 'w') as zf:
        for file in glob.glob(file_pattern):
            zf.write(file, os.path.basename(file))
            os.remove(file) # Cleanup source files

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No arguments provided"}))
        sys.exit(1)

    try:
        payload_str = base64.b64decode(sys.argv[1]).decode('utf-8')
        payload = json.loads(payload_str)
        
        mode = payload.get("mode")
        input_path = payload.get("inputPath")
        output_path = payload.get("outputPath")
        
        # Parse pages
        start_page = payload.get("startPage")
        end_page = payload.get("endPage")

        start = int(start_page) if start_page is not None and start_page != "" else None
        end = int(end_page) if end_page is not None and end_page != "" else None
        
        if not input_path or not output_path:
             print(json.dumps({"error": "Missing input or output path."}))
             sys.exit(1)

        result = {}

        if mode in ["png", "jpeg"]:
            # Check if we need multiple pages
            is_multi_page = (start is None and end is None) or \
                            (start is not None and end is not None and start != end) or \
                            (start is None and end is not None) # Partial range logic
            
            # Since we can't easily know total pages without opening, let's assume if no range or explicit range > 1, 
            # we use %d pattern for Ghostscript.
            # However, GS with %d produces file1.png, file2.png etc.
            
            # To be safe: If output_path ends in .zip, we MUST use %d and zip.
            # If output_path ends in .png/.jpg, we assume single file (and let GS overwrite if multi).
            
            if output_path.endswith(".zip"):
                # Use a temp pattern for generation
                base, _ = os.path.splitext(output_path)
                temp_pattern = f"{base}_%d.{mode}"
                glob_pattern = f"{base}_*.{mode}"
                
                if mode == "png":
                    cmd = convert_png(input_path, temp_pattern, start, end)
                else:
                    cmd = convert_jpeg(input_path, temp_pattern, start, end)
                
                subprocess.run(cmd, check=True, capture_output=True)
                
                # Zip results
                zip_files(glob_pattern, output_path)
                result = {"success": True, "message": f"Converted to {mode.upper()} ZIP"}
            
            else:
                # Single file output
                if mode == "png":
                    cmd = convert_png(input_path, output_path, start, end)
                else:
                    cmd = convert_jpeg(input_path, output_path, start, end)
                
                subprocess.run(cmd, check=True, capture_output=True)
                result = {"success": True, "message": f"Converted to {mode.upper()}"}

        elif mode == "html":
             result = convert_pdf_to_html(input_path, output_path, start, end)

        elif mode == "docx":
             from pdf_converter import convert_pdf_to_docx
             result = convert_pdf_to_docx(input_path, output_path, start, end)

        else:
             result = {"success": False, "message": f"Unknown mode: {mode}"}
        
        print(json.dumps(result))

    except Exception as e:
        # Catch-all
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
