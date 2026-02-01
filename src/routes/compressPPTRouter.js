const express = require("express");
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const rootDir = require("../utils/pathUtils");
const uploadPPT = require('../config/pptUpload');
const {
  getFileSizeInBytes,
  formatBytes
} = require('../utils/fileSize');


const router = express.Router();

// 1. GET Upload Page
router.get('/', (req, res) => {
  res.render('Compress/compressPPT', {
    title: 'Compress PPT',
    error: null,
    stats: null,
    downloadLink: null
  });
});

// 2. POST Perform Compression
router.post(
  '/result',
  uploadPPT.single('ppt'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.render('Compress/compressPPT', { title: 'Compress PPT', error: 'Please select a file.', stats: null, downloadLink: null });
      }

      const compressionLevel = req.body.compressionLevel || 'normal';
      const removeMedia = req.body.removeMedia === 'on';

      const inputPath = req.file.path;

      // 📏 SIZE BEFORE
      const originalSizeBytes = getFileSizeInBytes(inputPath);

      const outputFileName = `compressed-${Date.now()}.pptx`;
      const outputPath = path.join(
        rootDir, 'temp', 'outputs',
        outputFileName
      );

      const pythonScript = path.join(
        rootDir, 'python', 'scripts', 'pptxCompress.py'
      );

      const command = `py "${pythonScript}" "${inputPath}" "${outputPath}" "${compressionLevel}" "${removeMedia}"`;

      exec(command, (error, stdout, stderr) => {
        if (error || stderr) {
          console.error(error || stderr);
          // Try to clean up input if it exists
          try { fs.unlinkSync(inputPath); } catch (e) { }
          return res.render('Compress/compressPPT', { title: 'Compress PPT', error: 'PPT compression failed. Please try again.', stats: null, downloadLink: null });
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

        console.log('Compression stats:', stats);

        // Clean input immediately
        try {
          fs.unlinkSync(inputPath);
        } catch (e) { console.error("Input clean failed", e); }

        // Redirect to download page with stats
        res.redirect(`/compress/ppt/download?file=${outputFileName}&bef=${encodeURIComponent(stats.before)}&aft=${encodeURIComponent(stats.after)}&red=${encodeURIComponent(stats.reduction)}`);
      });

    } catch (err) {
      console.error(err);
      res.render('Compress/compressPPT', { title: 'Compress PPT', error: 'Unexpected server error.', stats: null, downloadLink: null });
    }
  }
);

// 3. GET Download Page (Success Screen)
router.get('/download', (req, res) => {
  const { file, bef, aft, red } = req.query;
  if (!file) {
    return res.redirect('/compress/ppt');
  }

  res.render('Compress/compressPPT', {
    title: 'Compress PPT',
    error: null,
    stats: {
      before: bef,
      after: aft,
      reduction: red
    },
    downloadLink: `/compress/ppt/download-file/${file}`
  });
});

// 4. GET Serve File
router.get('/download-file/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(rootDir, 'temp', 'outputs', fileName);

  // Security check to prevent path traversal
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    return res.status(403).send('Invalid file name');
  }

  if (fs.existsSync(filePath)) {
    res.download(filePath, 'compressed.pptx', (err) => {
      if (err) {
        console.error("Download Error:", err);
      }
      // We do NOT delete immediately here, relying on periodic cleanup
    });
  } else {
    res.status(404).send('File not found or expired.');
  }
});

module.exports = router;