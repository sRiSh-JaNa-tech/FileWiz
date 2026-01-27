const fs = require("fs");
const path = require("path");
const rootDir = require('./pathUtils');
const logFilePath = path.join(rootDir, "logs", "log.txt");

async function trimmer() {
    try {
        if (!fs.existsSync(logFilePath)) {
            fs.writeFileSync(logFilePath, "");
            return;
        }
        const data = await fs.promises.readFile(logFilePath, "utf8");
        const lines = data.split("\n");
        if (lines.length > 50) {
            const trimmedData = lines.slice(-50).join("\n");
            await fs.promises.writeFile(logFilePath, trimmedData, "utf8");
        }
    } catch (err) {
        logger.log(err.message, "ERROR");
    }
}

const logger = (error, info) => {
    const time = new Date().toISOString();
    const logType = info;
    const logMessage = `[${time}] ${logType}: ${error}\n`;

    fs.appendFile(logFilePath, logMessage, (err) => {
        if (err) console.error("Logging failed:", err);
    });

    trimmer();
};


module.exports = {"log" : logger};
