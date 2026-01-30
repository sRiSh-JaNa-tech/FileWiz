const path = require('path');
const rootDir = require('./pathUtils');

function resolveWorkspacePath(ws, relativePath = '') {
  if (relativePath.includes('..')) {
    throw new Error('Invalid path');
  }

  return path.join(
    rootDir,
    'temp',
    'workspaces',
    ws,
    'extracted',
    relativePath
  );
}

module.exports = resolveWorkspacePath;