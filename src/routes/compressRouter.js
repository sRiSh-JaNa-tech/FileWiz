const express = require('express');
const path = require('path');
const fs = require('fs');

const rootDir = require("../utils/pathUtils")
const upload = require('../config/pdfConfig');
const compressPdf = require('../services/compress');
const { getFileSizeInBytes, formatBytes } = require('../utils/fileSize');

const router = express.Router();

router.get('/', (req, res) => {
  res.render('compress/compress', {
    title: 'Compress PDF',
    error: null,
    stats: null,
    downloadLink: null
  });
});

router.post(
  '/result',
  upload.single('files'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.render('compress/compress', { title: 'Compress PDF', error: 'Please select a file.', stats: null, downloadLink: null });
      }

      const compressionLevel = req.body.compressionLevel;
      const inputPath = req.file.path;

      // 📏 SIZE BEFORE
      const originalSizeBytes = getFileSizeInBytes(inputPath);

      const outputFileName = `compressed-${Date.now()}.pdf`;
      const outputPath = path.join(
        rootDir,
        'temp', 'outputs',
        outputFileName
      );

      // Call Python
      await compressPdf(inputPath, outputPath, compressionLevel);

      // Verify output exists
      if (!fs.existsSync(outputPath)) {
        throw new Error("Output file creation failed");
      }

      // 📏 SIZE AFTER
      const compressedSizeBytes = getFileSizeInBytes(outputPath);

      // 📊 STATS
      const stats = {
        before: formatBytes(originalSizeBytes),
        after: formatBytes(compressedSizeBytes),
        reduction: (
          ((originalSizeBytes - compressedSizeBytes) / originalSizeBytes) *
          100
        ).toFixed(2) + '%'
      };

      console.log('PDF Compression stats:', stats);

      // Cleanup input immediately
      try {
        fs.unlinkSync(inputPath);
      } catch (e) { console.error("Input file cleanup failed:", e); }

      // Redirect to download page with stats
      res.redirect(`/compress/pdf/download?file=${outputFileName}&bef=${encodeURIComponent(stats.before)}&aft=${encodeURIComponent(stats.after)}&red=${encodeURIComponent(stats.reduction)}`);

    } catch (err) {
      console.error('Compression Error:', err);
      // Delete input file if it exists and error occurred
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch (e) { }
      }

      res.render('compress/compress', {
        title: 'Compress PDF',
        error: 'Compression failed. Please try again.', // Generic error message
        stats: null,
        downloadLink: null
      });
    }
  }
);

router.get('/download', (req, res) => {
  const { file, bef, aft, red } = req.query;
  if (!file) {
    return res.redirect('/compress/pdf');
  }

  res.render('compress/compress', {
    title: 'Compress PDF',
    error: null,
    stats: {
      before: bef,
      after: aft,
      reduction: red
    },
    downloadLink: `/compress/pdf/download-file/${file}`
  });
});

router.get('/download-file/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  // Basic validation to prevent traversal, though express handles most
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    return res.status(400).send("Invalid filename");
  }

  const filePath = path.join(rootDir, 'temp', 'outputs', fileName);

  if (fs.existsSync(filePath)) {
    res.download(filePath, 'compressed.pdf', (err) => {
      if (err) {
        console.error("Download Error:", err);
      }
      // Note: We are NOT deleting the file here to allow re-downloads/refresh.
      // We rely on periodic cleanup.
    });
  } else {
    res.status(404).send("File expired or not found");
  }
});

module.exports = router;
