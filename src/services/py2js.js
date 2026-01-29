const path = require("path");
const { exec } = require("child_process");
const rootDir = require("../utils/pathUtils");
const logger = require("./logger");

const pythonScriptPath = path.join(
  rootDir,
  "python",
  "scripts",
  "read_zip.py"
);

function readZipWithPython(zipPath) {
  return new Promise((resolve, reject) => {
    const command = `python "${pythonScriptPath}" "${zipPath}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        logger.log(error.message, "ERROR", "python_exec");
        return reject(error);
      }

      if (stderr) {
        logger.log(stderr, "ERROR", "python_script");
        return reject(new Error(stderr));
      }

      const result = stdout.trim();

      if (!result) {
        logger.log("Python returned empty output", "WARNING", "python_exec");
        return reject(new Error("Empty Python output"));
      }

      logger.log(
        `Python processed zip successfully: ${zipPath}`,
        "INFO",
        "python_exec"
      );

      resolve(result);
    });
  });
}

module.exports = { readZipWithPython };
