import os
import sys
import subprocess


REQ_FILE = "requirements.txt"


def install_deps():
    if not os.path.exists(REQ_FILE):
        print("❌ requirements.txt not found")
        sys.exit(1)

    print("⬆ Upgrading pip...")
    subprocess.check_call([
        sys.executable,
        "-m",
        "pip",
        "install",
        "--upgrade",
        "pip"
    ])

    print("⬇ Installing Python dependencies globally...")
    subprocess.check_call([
        sys.executable,
        "-m",
        "pip",
        "install",
        "-r",
        REQ_FILE
    ])

    print("✅ Global Python dependencies installed")


def main():
    try:
        install_deps()
    except subprocess.CalledProcessError as e:
        print("❌ Dependency installation failed")
        sys.exit(e.returncode)


if __name__ == "__main__":
    main()
