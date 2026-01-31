const path = require('path');
const { exec } = require('child_process');

const rootDir = require("../utils/pathUtils");

const pythonScript = path.join(
  rootDir,
  'python', 'scripts', 'pdf_Compress.py'
);

function compressPdf(inputPath, outputPath, level) {
  return new Promise((resolve, reject) => {
    const cmd = `python "${pythonScript}" "${inputPath}" "${outputPath}" "${level}"`;

    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error('Exec Error:', err);
        return reject(err);
      }
      if (stderr) {
        console.warn('Ghostscript Stderr:', stderr); // Ghostscript often writes to stderr even on success
      }
      console.log('Ghostscript Stdout:', stdout);
      resolve(stdout);
    });
  });
}

module.exports = compressPdf;
