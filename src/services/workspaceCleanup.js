const fs = require('fs/promises');
const path = require('path');
const rootDir = require('../utils/pathUtils');
const logger = require('./logger');

const WORKSPACES_DIR = path.join(rootDir, 'temp', 'workspaces');

async function cleanupWorkspaces() {
  try {
    const entries = await fs.readdir(WORKSPACES_DIR);

    for (const ws of entries) {
      const metaPath = path.join(
        WORKSPACES_DIR,
        ws,
        'meta.json'
      );

      try {
        const meta = JSON.parse(
          await fs.readFile(metaPath, 'utf8')
        );

        if (new Date(meta.expiresAt) < new Date()) {
          await fs.rm(
            path.join(WORKSPACES_DIR, ws),
            { recursive: true, force: true }
          );

          await logger.log(
            `Workspace expired & deleted: ${ws}`,
            'INFO',
            'cleanup-service'
          );

          console.log(`Cleanup Succeeded for workspace: ${ws}`);
        }
      } catch (err) {
        // Missing or corrupt meta → remove defensively
        await fs.rm(
          path.join(WORKSPACES_DIR, ws),
          { recursive: true, force: true }
        );
      }
    }
  } catch (err) {
    await logger.log(
      `Workspace cleanup failed: ${err.message}`,
      'ERROR',
      'cleanup-service'
    );
  }
}

module.exports = cleanupWorkspaces;
