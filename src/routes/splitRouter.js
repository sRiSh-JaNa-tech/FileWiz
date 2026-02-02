const express = require("express");
const path = require("path");
const fs = require('fs/promises');
const { exec } = require("child_process");

const rootDir = require('../utils/pathUtils');
const uploadPDF = require('../config/pdfConfig');

const router = express.Router();

router.get('/', (req, res) => {
  res.render('splits/splitPDF', {
    title: 'SplitPDF',
    error: null,
    stats: null,
    downloadLink: null
  });
});

router.post(
  '/result',
  uploadPDF.single('pdf'),
  async (req, res) => {
    try {
      // 1️⃣ Basic validation
      if (!req.file) {
        return res.render('splits/splitPDF', {
          title: 'SplitPDF',
          error: 'No PDF uploaded',
          stats: null,
          downloadLink: null
        });
      }

      const splitMode = req.body.splitMode;
      const ranges = req.body.ranges;
      const parts = req.body.parts;

      // Paths
      const inputPath = req.file.path;

      const jobId = Date.now().toString();
      const outputDir = path.join(
        rootDir,
        'temp',
        'splits',
        jobId
      );

      await fs.mkdir(outputDir, { recursive: true });

      const pythonScript = path.join(
        rootDir,
        'python',
        'scripts',
        'pdf_split_gs.py'
      );

      // Build command based on split mode
      let command;

      if (splitMode === 'range') {
        if (!ranges) {
          throw new Error('Page ranges not provided');
        }

        command = `py "${pythonScript}" "${inputPath}" "${outputDir}" range "${ranges}"`;
      } else if (splitMode === 'count') {
        if (!parts) {
          throw new Error('Number of parts not provided');
        }

        command = `py "${pythonScript}" "${inputPath}" "${outputDir}" count "${parts}"`;
      } else {
        throw new Error('Invalid split mode');
      }

      // Execute Ghostscript split
      exec(command, async (error, stdout, stderr) => {
        if (error) {
          console.error("Exec error:", error);
          if (stderr) console.error("Stderr:", stderr);
          return res.render('splits/splitPDF', {
            title: 'SplitPDF',
            error: 'Failed to split PDF',
            stats: null,
            downloadLink: null
          });
        }

        if (stderr) {
          console.log("Ghostscript warnings (stderr):", stderr);
        }

        // Read split files for preview
        const files = await fs.readdir(outputDir);
        console.log(outputDir);

        const splitFiles = files
          .filter(f => f.endsWith('.pdf'))
          .map((file) => ({
            name: file,
            path: path.join(outputDir, file),
            previewUrl: `/temp/splits/${jobId}/${file}`
          }));

        // Cleanup original upload
        await fs.unlink(inputPath);

        // 7️⃣ Render result preview page
        res.render('splits/result', {
          title: 'Split Result',
          splitFiles
        });
      });

    } catch (err) {
      console.error(err);
      res.render('splits/splitPDF', {
        title: 'SplitPDF',
        error: err.message || 'Unexpected error',
        stats: null,
        downloadLink: null
      });
    }
  }
);


// POST /download (Download selected files as ZIP)
router.post('/download', async (req, res) => {
  try {
    const selectedFiles = req.body.selectedFiles; // Array of file paths

    if (!selectedFiles || selectedFiles.length === 0) {
      return res.status(400).send("No files selected");
    }

    // Ensure array (if single file selected, it might come as string)
    const filesToZip = Array.isArray(selectedFiles) ? selectedFiles : [selectedFiles];

    const archive = require('archiver')('zip', {
      zlib: { level: 9 } // Sets the compression level.
    });

    res.attachment('split_files.zip');

    // Pipe archive data to the response
    archive.pipe(res);

    // Append files
    filesToZip.forEach(filePath => {
      // Check if file exists to avoid crashes
      // Note: In real app, consider using async exists check, but archiver handles errors too
      archive.file(filePath, { name: path.basename(filePath) });
    });

    // Finalize the archive (ie we are done appending files but streams have to finish yet)
    await archive.finalize();

    // Note: Clean up is tricky here because streams are async. 
    // A robust solution usually involves waiting for stream to finish then cleaning directory.
    // For simplicity, we rely on the periodic cleanup task.

  } catch (err) {
    console.error("Download Error:", err);
    res.status(500).send("Error creating zip");
  }
});


module.exports = router;