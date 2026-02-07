const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const rootDir = require("../utils/pathUtils");
const uploadPDF = require("../config/pdfConfig");

const router = express.Router();

const PYTHON_SCRIPT = path.join(rootDir, 'python', 'scripts', 'convert_bridge.py');

router.get('/', (req, res) => {
    res.render('convertPDF/convert', {
        title: 'Convert PDF',
        error: null,
        result: null
    });
});

router.post('/upload', uploadPDF.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.render('convertPDF/convert', { title: "Error", error: 'No file uploaded', result: null });
        }

        if (req.file.mimetype !== 'application/pdf') {
            fs.unlinkSync(req.file.path);
            return res.render('convertPDF/convert', { title: "Error", error: 'Only PDF files allowed', result: null });
        }

        const inputPath = req.file.path;
        const mode = req.body.format || 'png';
        const startPage = req.body.startPage || null;
        const endPage = req.body.endPage || null;

        // Determine output filename and extension
        const timestamp = Date.now();
        const outDir = path.join(rootDir, 'temp', 'outputs');
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

        let outputFilename;

        // Logic: specific range of 1 page -> image. Full or multi -> zip (if image). HTML -> html.
        if (mode === 'html') {
            outputFilename = `converted-${timestamp}.html`;
        } else if (mode === 'docx') {
            outputFilename = `converted-${timestamp}.docx`;
        } else {
            // Check if single page requested
            const isSinglePage = (startPage && endPage && startPage === endPage);
            if (isSinglePage) {
                outputFilename = `converted-${timestamp}.${mode}`;
            } else {
                outputFilename = `converted-${timestamp}.zip`;
            }
        }

        const outputPath = path.join(outDir, outputFilename);

        // Prepare Payload
        const payload = {
            inputPath,
            outputPath,
            mode,
            startPage,
            endPage
        };

        const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64');
        const command = `py "${PYTHON_SCRIPT}" "${payloadBase64}"`;

        // Execute Python
        exec(command, (error, stdout, stderr) => {
            // Cleanup input
            if (fs.existsSync(inputPath)) fs.unlink(inputPath, () => { });

            if (error) {
                console.error("Conversion Error:", stderr);
                return res.render('convertPDF/convert', {
                    title: 'Conversion Failed',
                    error: 'Conversion process failed. Please check inputs.',
                    result: null
                });
            }

            try {
                const response = JSON.parse(stdout);
                if (response.success) {
                    res.render('convertPDF/convert', {
                        title: 'Conversion Success',
                        error: null,
                        result: {
                            status: 'Success',
                            downloadUrl: `/convert/download?fileName=${outputFilename}`,
                            fileName: outputFilename,
                            mode: mode.toUpperCase()
                        }
                    });
                } else {
                    res.render('convertPDF/convert', {
                        title: 'Conversion Failed',
                        error: response.message || 'Unknown error',
                        result: null
                    });
                }
            } catch (jsonErr) {
                console.error("JSON Parse Error:", jsonErr, stdout);
                res.render('convertPDF/convert', {
                    title: 'Error',
                    error: 'Invalid response from conversion engine.',
                    result: null
                });
            }
        });

    } catch (err) {
        console.error("Router Error:", err);
        res.render('convertPDF/convert', { title: "Error", error: "Server Error", result: null });
    }
});

router.get('/download', (req, res) => {
    const { fileName } = req.query;
    if (!fileName || fileName.includes('..')) return res.redirect('/convert');

    const filePath = path.join(rootDir, 'temp', 'outputs', fileName);
    if (!fs.existsSync(filePath)) return res.status(404).send('File not found');

    res.download(filePath, fileName, () => {
        // Cleanup after delay
        setTimeout(() => { if (fs.existsSync(filePath)) fs.unlink(filePath, () => { }); }, 120000);
    });
});

module.exports = router;
