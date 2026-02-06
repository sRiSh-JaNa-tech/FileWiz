const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require("child_process");

const rootDir = require("../utils/pathUtils");
const uploadPDF = require("../config/pdfConfig");

const router = express.Router();

router.get('/', (req, res) => {
    res.render('encrypt/encryption.ejs', {'title': 'Encrypt PDF','error' : null});
});

router.post('/upload',
    uploadPDF.single('pdf'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.render('encrypt/encryption', { title: "Error", error: 'No file uploaded' });
            }

            const inputPath = req.file.path;
            const user_password = req.body.user_password;
            const owner_password = req.body.owner_password;
            const encryption_lvl = req.body.encryption_level;

            const outputFileName = `encrypted-${Date.now()}.pdf`;
            const outDir = path.join(rootDir, 'temp', 'outputs');

            if (!fs.existsSync(outDir)) {
                fs.mkdirSync(outDir, { recursive: true });
            }

            const outputPath = path.join(outDir, outputFileName);

            const pythonScript = path.join(
                rootDir, 'python', 'scripts', 'pdf_encryption.py'
            );

            // Command: py <script> <input> <user_pass> <owner_pass> <level> <output>
            const payload = {
                user_password,
                owner_password,
                encryption_lvl,
                inputPath,
                outputPath
            };
            const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64');

            const command = `py "${pythonScript}" "${payloadBase64}"`;

            exec(command, (error, stdout, stderr) => {
                console.log("Python stdout:", stdout);
                console.log("Python stderr:", stderr);

                // Cleanup input file after processing
                try {
                    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                } catch (e) { console.error("Input clean failed", e); }

                if (error) {
                    console.error("Encryption Execution Error:", error);
                    return res.render('encrypt/encryption', {
                        title: "Error",
                        error: `Encryption failed. Please ensure the PDF is not password protected and try using only digits (0-9).`
                    });
                }

                console.log("Encryption success:", stdout);
                // Redirect back to main page with a success flag and filename
                res.redirect(`/encrypt?success=true&file=${outputFileName}`);
            });

        } catch (err) {
            console.error("Router Error:", err);
            res.render('error/404');
        }
    }
);

router.get('/download', (req, res) => {
    const { fileName } = req.query;
    if (!fileName) {
        return res.redirect('/encrypt');
    }

    // Security check
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
        return res.status(403).send('Invalid file name');
    }

    const filePath = path.join(rootDir, 'temp', 'outputs', fileName);

    if (fs.existsSync(filePath)) {
        res.download(filePath, `protected-${fileName}`, (err) => {
            if (err) {
                console.error("Download Error:", err);
            }
            // Optional: delete output file after download
            // fs.unlink(filePath, () => {});
        });
    } else {
        res.status(404).send('File Not found or expired.');
    }
});

module.exports = router;