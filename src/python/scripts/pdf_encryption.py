import os
import subprocess
import re
import sys
import base64

def validate_password(password: str, label: str) -> None:
    if not password.isdigit():
        raise ValueError(f"{label} password must only contain digits (0-9)")


def encrypt_pdf(
    input_pdf: str,
    user_password: str,
    owner_password: str,
    encryption_level: str = "medium", 
    output_pdf: str = "encrypted.pdf"
) -> bool:

    print(f"Checking input path: {os.path.abspath(input_pdf)}")
    if not os.path.exists(input_pdf):
        raise FileNotFoundError(f"Input file not found: {input_pdf}")

    validate_password(user_password, "User")
    validate_password(owner_password, "Owner")

    # Ghostscript path resolution
    gs_path = r"C:\Program Files\gs\gs10.06.0\bin\gswin64c.exe"
    gs_command = [gs_path] if os.path.exists(gs_path) else ["gswin64c"]

    base_flags = [
        "-q",
        "-dBATCH",
        "-dNOPAUSE",
        "-sDEVICE=pdfwrite"
    ]

    if encryption_level == "low":
        encryption_flags = ["-dEncryptionR=2", "-dKeyLength=40"]
        permissions = 4

    elif encryption_level == "medium":
        # R=3 supports 128-bit RC4, which works with this GS version
        encryption_flags = ["-dEncryptionR=3", "-dKeyLength=128"]
        permissions = -16

    elif encryption_level == "high":
        # R=5 (AES) not supported by this GS build, falling back to max supported (R=3, 128-bit)
        encryption_flags = ["-dEncryptionR=3", "-dKeyLength=128"]
        permissions = -44

    else:
        raise ValueError("encryption_level must be: low | medium | high")

    command = (
        gs_command
        + base_flags
        + encryption_flags
        + [f"-sUserPassword={user_password}"]
        + [f"-sOwnerPassword={owner_password}"]
        + [f"-dPermissions={permissions}"]
        + ["-o", output_pdf, input_pdf]
    )

    safe_log_command = [
        "***" if "Password" in arg else arg for arg in command
    ]
    print("Running Ghostscript:", " ".join(safe_log_command))

    try:
        result = subprocess.run(command, capture_output=True, text=True)
        if result.returncode != 0:
            print("Ghostscript encryption failed")
            print("STDOUT:", result.stdout)
            print("STDERR:", result.stderr)
            return False
        return True
    except Exception as e:
        print(f"Subprocess execution error: {e}")
        return False

if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            print("Usage: py pdf_encryption.py <base64_payload>")
            sys.exit(1)
        
        # Decode Base64 JSON
        import json
        payload_str = base64.b64decode(sys.argv[1]).decode('utf-8')
        payload = json.loads(payload_str)

        input_file = payload.get("inputPath")
        user_pw = payload.get("user_password")
        owner_pw = payload.get("owner_password")
        enc_level = payload.get("encryption_lvl")
        output_file = payload.get("outputPath")

        if not all([input_file, user_pw, owner_pw, enc_level, output_file]):
            print("Error: Missing required parameters in payload")
            sys.exit(1)

        success = encrypt_pdf(input_file, user_pw, owner_pw, enc_level, output_file)
        if not success:
            sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)