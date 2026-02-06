import os
import sys
import subprocess
import shutil
import venv

VENV_DIR = "venv"
REQUIREMENTS_FILE = "requirements.txt"


def venv_python():
    return os.path.join(
        VENV_DIR,
        "Scripts" if os.name == "nt" else "bin",
        "python.exe" if os.name == "nt" else "python"
    )


def is_valid_venv():
    return os.path.exists(os.path.join(VENV_DIR, "pyvenv.cfg"))


def create_venv():
    print("📦 Creating virtual environment...")
    venv.create(VENV_DIR, with_pip=True)
    print("✅ Virtual environment created")


def install_requirements(python):
    print("⬇ Installing Python dependencies...")
    subprocess.check_call([python, "-m", "pip", "install", "--upgrade", "pip"])
    subprocess.check_call([python, "-m", "pip", "install", "-r", REQUIREMENTS_FILE])
    print("✅ Dependencies installed")


def main():
    if os.path.exists(VENV_DIR) and not is_valid_venv():
        print("⚠ Broken venv detected — recreating")
        shutil.rmtree(VENV_DIR)

    if not os.path.exists(VENV_DIR):
        create_venv()
    else:
        print("✔ Virtual environment exists")

    python = venv_python()

    if not os.path.exists(REQUIREMENTS_FILE):
        print("❌ requirements.txt not found")
        sys.exit(1)

    install_requirements(python)


if __name__ == "__main__":
    main()
