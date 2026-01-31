const express = require('express');
const path = require('path');
const fs = require('fs');

const rootDir = require("../utils/pathUtils")
const upload = require('../config/pdfConfig');
const compressPdf = require('../services/compress');

const router = express.Router();

router.get('/', (req, res) => {
  res.render('compress/compress', {
    title: 'Compress PDF',
    error: null,
    downloadLink: null
  });
});

router.post(
  '/result',
  upload.single('files'),
  async (req, res) => {
    try {
      const compressionLevel = req.body.compressionLevel;
      const inputPath = req.file.path;

      const outputPath = path.join(
        rootDir,
        'temp', 'outputs',
        `compressed-${Date.now()}.pdf`
      );

      // Call Python
      await compressPdf(inputPath, outputPath, compressionLevel);

      // Auto-download
      res.download(outputPath, 'compressed.pdf', () => {
        // Cleanup after download
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
      });

    } catch (err) {
      console.error('Compression Error:', err);
      res.render('compress/compress', {
        title: 'Compress PDF',
        error: 'Compression failed: ' + (err.message || err),
        downloadLink: null
      });
    }
  }
);

module.exports = router;
