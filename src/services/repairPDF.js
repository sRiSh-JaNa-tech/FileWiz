const fs = require("fs");
const { exec } = require("child_process");

// Absolute paths for Windows stability
const QPDF_PATH = `"C:\\qpdf\\bin\\qpdf.exe"`;
const GS_PATH = `"C:\\Program Files\\gs\\gs10.06.0\\bin\gswin64c.exe"`;

function execCmd(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      // qpdf --check returns exit code 3 for warnings, which we should allow
      if (err && err.code !== 3) {
        reject(stderr || stdout || err);
      } else {
        resolve({ stdout, stderr, code: err ? err.code : 0 });
      }
    });
  });
}

/* 1️⃣ Detect corruption */
async function checkCorruption(pdfPath) {
  try {
    await execCmd(`${QPDF_PATH} --check "${pdfPath}"`);
    return { type: "none", severity: "none" };
  } catch (err) {
    const error = String(err).toLowerCase();

    if (error.includes("xref")) return { type: "xref", severity: "medium" };
    if (error.includes("trailer")) return { type: "trailer", severity: "medium" };
    if (error.includes("unexpected eof")) return { type: "truncated", severity: "critical" };

    return { type: "unknown", severity: "high" };
  }
}

/* 2️⃣ Get Page Count */
async function getPageCount(pdfPath) {
  try {
    const { stdout } = await execCmd(`${QPDF_PATH} --show-npages "${pdfPath}"`);
    return parseInt(stdout.trim()) || 0;
  } catch {
    return 0;
  }
}

/* 3️⃣ Repair using qpdf */
async function repairQPDF(input, output) {
  await execCmd(`${QPDF_PATH} --linearize "${input}" "${output}"`);
  return "qpdf";
}

/* 4️⃣ Repair using Ghostscript */
async function repairGS(input, output) {
  await execCmd(
    `${GS_PATH} -dSAFER -dBATCH -dNOPAUSE -sDEVICE=pdfwrite -sOutputFile="${output}" "${input}"`
  );
  return "gs";
}

/* 5️⃣ Validate repaired file */
async function validatePDF(path) {
  try {
    await execCmd(`${QPDF_PATH} --check "${path}"`);
    return true;
  } catch (err) {
    // If code is 3 (warnings), it's likely still readable
    return (err.code === 3);
  }
}

/* 6️⃣ Confidence + Label Engine */
function calculateResult(method, severity, valid) {
  if (!method || !valid) {
    return { label: "Unrecoverable", confidence: 0 };
  }

  if (method === "qpdf") {
    return { label: "Fully repaired", confidence: 92 };
  }

  // Ghostscript recovery
  let confidence = 70;

  if (severity === "critical") confidence -= 25;
  if (severity === "high") confidence -= 15;

  confidence = Math.max(confidence, 40);

  return {
    label: confidence >= 70 ? "Partially recovered" : "Unrecoverable",
    confidence
  };
}

/* 🚀 MAIN PIPELINE */
async function processPDF(inputPath, outputPath) {
  const detection = await checkCorruption(inputPath);

  // Try qpdf first
  try {
    const method = await repairQPDF(inputPath, outputPath);
    const valid = await validatePDF(outputPath);
    const pages = await getPageCount(valid ? outputPath : inputPath);

    const { label, confidence } = calculateResult(
      method,
      detection.severity,
      valid
    );

    return { detection, method, label, confidence, pages };
  } catch { }

  // Fallback to Ghostscript
  try {
    const method = await repairGS(inputPath, outputPath);
    const valid = await validatePDF(outputPath);
    const pages = await getPageCount(valid ? outputPath : inputPath);

    const { label, confidence } = calculateResult(
      method,
      detection.severity,
      valid
    );

    return { detection, method, label, confidence, pages };
  } catch { }

  return {
    detection,
    method: null,
    label: "Unrecoverable",
    confidence: 0,
    pages: 0
  };
}

module.exports = { processPDF };