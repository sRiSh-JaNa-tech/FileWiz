const express = require("express");
const path = require("path");
const fs = require('fs');
const { exec } = require('child_process');

const rootDir = require('../utils/pathUtils');
const uploadRedactionPDF = require('../config/redactionUpload');

const router = express.Router();

router.get('/', (req, res) => {
  res.render('redactPDF/redaction', { 'title': 'RedactPDF', 'error': null });
});

router.post(
  '/upload',
  uploadRedactionPDF.single('pdf'),
  (req, res) => {
    try {
      if (!req.file) {
        return res.render('redactPDF/redaction', {
          title: 'Redact PDF',
          error: 'No file uploaded'
        });
      }

      // For now: just confirm upload worked
      // Next step → redirect to preview UI
      res.redirect(
        `/redaction/preview/${req.file.filename}`
      );

    } catch (err) {
      console.error(err);
      res.render('redactPDF/redaction', {
        title: 'Redact PDF',
        error: err.message || 'Upload failed'
      });
    }
  }
);

router.get('/preview/:filename', (req, res) => {
  const { filename } = req.params;

  const filePath = path.join(
    __dirname,
    '../temp/uploads',
    filename
  );

  if (!fs.existsSync(filePath)) {
    return res.redirect('/redaction');
  }

  res.render('redactPDF/preview', {
    title: 'Preview PDF',
    pdfUrl: `/temp/uploads/${filename}`
  });
});

router.post('/apply', (req, res) => {
  const { filename, keywords, regex } = req.body;

  if (!filename) {
    return res.redirect('/redaction');
  }

  const inputPath = path.join(
    __dirname,
    '../temp/uploads',
    filename
  );

  if (!fs.existsSync(inputPath)) {
    return res.redirect('/redaction');
  }

  const outputName = `redacted-${Date.now()}.pdf`;
  const outputPath = path.join(
    __dirname,
    '../temp/redacted',
    outputName
  );

  // Ensure output dir exists
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const pythonScript = path.join(
    __dirname,
    '../python/scripts/pdf_redact.py'
  );

  const safeKeywords = keywords || '';
  const safeRegex = regex || '';

  const command = `py "${pythonScript}" "${inputPath}" "${outputPath}" "${safeKeywords}" "${safeRegex}"`;

  exec(command, (error, stdout, stderr) => {
    if (error || stderr) {
      console.error(error || stderr);
      return res.redirect('/redaction');
    }

    // Send redacted PDF
    res.download(outputPath, 'redacted.pdf', () => {
      // Cleanup
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
    });
  });
});

router.post("/execute", express.json(), (req, res) => {
  const { filename, redactions } = req.body;

  if (!filename || !Array.isArray(redactions) || redactions.length === 0) {
    return res.status(400).send("Invalid redaction request");
  }

  const inputPath = path.join(__dirname, "../temp/uploads", filename);
  if (!fs.existsSync(inputPath)) {
    return res.status(404).send("File not found");
  }

  const outDir = path.join(__dirname, "../temp/redacted");
  fs.mkdirSync(outDir, { recursive: true });

  const outputName = `redacted-${Date.now()}.pdf`;
  const outputPath = path.join(outDir, outputName);

  const scriptPath = path.join(
    __dirname,
    "../python/scripts/pdf_redact_coords.py"
  );

  const redactionsBase64 = Buffer.from(JSON.stringify(redactions)).toString('base64');
  const command = `py "${scriptPath}" "${inputPath}" "${outputPath}" "${redactionsBase64}"`;

  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error(stderr || err);
      return res.status(500).send("Redaction failed");
    }

    res.download(outputPath, "redacted.pdf", () => {
      // optional cleanup
      fs.unlink(outputPath, () => { });
    });
  });
});



module.exports = router;