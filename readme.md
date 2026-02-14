FileWiz
One-stop solution for file compression, extraction, and optimization

FileWiz is a web-based utility platform that helps users compress, extract, optimize, and manage files such as .zip, .pdf, .pptx, and .docx in one unified interface.

Instead of relying on multiple tools or installing heavy desktop software, FileWiz provides a fast, secure, and developer-friendly solution directly in the browser.


==================== FEATURES ====================

File Compression
- Compress PDF, PPTX, DOCX, and ZIP files
- Multiple compression levels (Low / Normal / Extreme)
- Lossless compression support for PDFs
- Smart handling of file contents

File Extraction & Archive Management
- Extract ZIP files
- Peek inside ZIP archives without extracting
- Edit or create files inside ZIP without opening it
- Download specific files from archive

File Optimization
- PDF compression using Ghostscript
- PPT compression with customizable levels
- Option to remove images from PPT for maximum compression
- Media compression using FFMPEG

Performance & Processing
- Fast server-side processing
- Efficient file handling
- Python-powered processing for heavy tasks

Reliability & Security
- No permanent file storage
- Automatic file cleanup after processing
- Isolated processing for each request
- Safe handling of user uploads


==================== TECH STACK ====================

Frontend
- HTML
- CSS
- EJS (Templating Engine)

Backend
- Node.js
- Express.js

Processing & Tools
- Python (compression and optimization logic)
- Ghostscript (PDF compression and optimization)
- FFMPEG (media compression)


==================== REQUIREMENTS ====================

Make sure the following are installed:

- Python → For compression and optimization logic
- Ghostscript → For PDF compression
- FFMPEG → For media compression

Verify installation using:
python --version
gs --version
ffmpeg -version


==================== ARCHITECTURE ====================

User → Upload File → Express Server → Python Processing Engine
                                       ↓
                              Ghostscript / FFMPEG
                                       ↓
                              Processed File → Response

Node.js handles routing and file management
Python handles heavy processing logic
External tools handle format-specific optimizations


==================== HOW TO RUN ====================

1. Clone the repository
git clone https://github.com/sRiSh-JaNa-tech/FileWiz.git
cd FileWiz

2. Install dependencies
npm install

3. Install system tools
- Install Python
- Install Ghostscript
- Install FFMPEG

4. Start the server
node src/server.js

5. Open in browser
http://localhost:3000


==================== CURRENT FEATURES ====================

- ZIP archive preview and editing without extraction
- PDF compression (lossless)
- PPT compression with multiple levels
- Option to remove images from PPT
- Secure file handling with auto cleanup


==================== UPCOMING FEATURES ====================

- Batch file processing
- Compression analytics dashboard
- User authentication and file history
- Cloud storage integration (AWS S3 / MinIO)
- Public API for developers
- Chunk-based upload for large files
- Smart compression engine (auto algorithm selection)


==================== WHY FILEWIZ ====================

- Multiple file operations in one platform
- No heavy software installation required
- Secure and temporary file processing
- Uses industry-grade tools (Ghostscript, FFMPEG)
- Designed for scalability

==================== REPOSITORY ====================

https://github.com/sRiSh-JaNa-tech/FileWiz


==================== CONCLUSION ====================

FileWiz is not just a file utility tool.
It is a full-stack, production-oriented system that demonstrates:

- Backend engineering
- File processing pipelines
- System integration
- Performance optimization

It solves real-world problems and showcases strong development skills.


==================== SUPPORT ====================

If you like this project, consider giving it a star on GitHub.
