const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs/promises');
const AdmZip = require('adm-zip');
const crypto = require('crypto');
const archiver = require('archiver');

const rootDir = require('../utils/pathUtils');
const upload = require(path.join(rootDir, 'config', 'multer'));
const logger = require('../services/logger');
const buildTree = require('../services/buildTree');
const { readZipWithPython } = require('../services/py2js');
const resolveWorkspacePath = require('../utils/resolveWorkspacePath');

const EDITABLE_EXTENSIONS = [
  '.js', '.json', '.txt', '.md',
  '.html', '.css', '.ts'
];


router.get('/display', (req, res) => {
  res.render('peek/peek', { error: null, title: 'Peek Files' });
});

router.get('/view', async (req, res) => {
    const { ws } = req.query;
    if (!ws) {
        return res.redirect('/peek/display');
    }

    const workspaceId = ws;
    const workspacePath = path.join(rootDir, 'temp', 'workspaces', workspaceId);
    const extractPath = path.join(workspacePath, 'extracted');

    try {
        await fs.access(extractPath);
    } catch (err) {
        return res.status(404).render('peek/peek', {
             error: 'Workspace expired or not found',
             title: 'Peek Files'
        });
    }

    try {
        const tree = await buildTree(extractPath);
        res.render('peek/result', {
            tree,
            workspaceId,
            title: 'Peek Result'
        });
    } catch (err) {
        console.error('Error building tree:', err);
        res.status(500).send("Error loading workspace");
    }
});

router.post(
  '/result',
  upload.single('archive'),
  async (req, res) => {
    if (!req.file) {
      return res.render('peek/peek', {
        error: 'No file uploaded',
        title: 'Peek Files'
      });
    }

    await logger.log(
      `User uploaded archive: ${req.file.originalname}`,
      'INFO',
      'peek-service'
    );

    // let pythonOutput;
    // try {
    //   pythonOutput = await readZipWithPython(req.file.path);
    // } catch (err) {
    //   await logger.log(
    //     `Error processing zip: ${err.message}`,
    //     'ERROR',
    //     'peek-service'
    //   );
    //   return res.render('peek/peek', {
    //     error: 'Failed to process archive',
    //     title: 'Peek Files'
    //   });
    // }

    // let fileTree;
    // try {
    //   const jsonData = await fs.readFile(pythonOutput, 'utf8');
    //   fileTree = JSON.parse(jsonData);
    // } catch (err) {
    //   await logger.log(
    //     `Invalid JSON from python: ${err.message}`,
    //     'ERROR',
    //     'peek-service'
    //   );
    //   return res.render('peek/peek', {
    //     error: 'Failed to read archive',
    //     title: 'Peek Files'
    //   });
    // }

    const workspaceId = `ws_${Date.now()}_${crypto.randomInt(100000, 999999)}`;
    const workspacePath = path.join(rootDir, 'temp', 'workspaces', workspaceId);
    const extractPath = path.join(workspacePath, 'extracted');

    await fs.mkdir(extractPath, { recursive: true });

    const zip = new AdmZip(req.file.path); // extract here
    zip.extractAllTo(extractPath, true);

    const tree = await buildTree(extractPath); // Create Tree

    // Metadata
    const meta = {
      workspaceId,
      originalZip: req.file.originalname,
      createdAt: new Date().toISOString()
    };

    await fs.writeFile(
      path.join(workspacePath, 'meta.json'),
      JSON.stringify(meta, null, 2)
    );

    // Temporary tree (placeholder)
    // Redirect to view
    res.redirect(`/peek/view?ws=${workspaceId}`);
  }
);


router.get('/file', async (req, res) => {
  const { ws, path: relativePath } = req.query;

  console.log(req.query);

  if (!ws || !relativePath) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  // 🔒 Block path traversal
  if (relativePath.includes('..')) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  const filePath = path.join(
    rootDir,
    'temp',
    'workspaces',
    ws,
    'extracted',
    relativePath
  );

  // 🔒 Ensure file exists
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      return res.status(400).json({ error: 'Not a file' });
    }
  } catch {
    return res.status(404).json({ error: 'File not found' });
  }

  const ext = path.extname(filePath).toLowerCase();

  // 🔒 Enforce permissions
  if (!EDITABLE_EXTENSIONS.includes(ext)) {
    return res.status(403).json({ error: 'File is read-only' });
  }

  try {
    const content = await fs.readFile(filePath, 'utf8');
    res.json({ content });
  } catch (err) {
    await logger.log(
      `File read failed: ${filePath}`,
      'ERROR',
      'peek-service'
    );
    res.status(500).json({ error: 'Failed to read file' });
  }
});

router.post('/file/save', async (req, res) => {
  const { ws, path: relativePath, content } = req.body;

  if (!ws || !relativePath) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  // 🔒 Block path traversal
  if (relativePath.includes('..')) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  const filePath = path.join(
    rootDir,
    'temp',
    'workspaces',
    ws,
    'extracted',
    relativePath
  );

  const ext = path.extname(filePath).toLowerCase();

  // 🔒 Permission check
  if (!EDITABLE_EXTENSIONS.includes(ext)) {
    return res.status(403).json({ error: 'File is read-only' });
  }

  try {
    await fs.writeFile(filePath, content, 'utf8');

    await logger.log(
      `File saved: ${filePath}`,
      'INFO',
      'peek-service'
    );

    res.json({ success: true });
  } catch (err) {
    await logger.log(
      `File save failed: ${err.message}`,
      'ERROR',
      'peek-service'
    );
    res.status(500).json({ error: 'Failed to save file' });
  }
});

router.get('/download', async (req, res) => {
  const { ws } = req.query;

  if (!ws) {
    return res.status(400).send('Missing workspace id');
  }

  const workspacePath = path.join(
    rootDir,
    'temp',
    'workspaces',
    ws
  );
  const extractPath = path.join(workspacePath, 'extracted');
  const metaPath = path.join(workspacePath, 'meta.json');

  // 🔒 Ensure workspace exists
  try {
    await fs.access(extractPath);
  } catch {
    return res.status(404).send('Workspace not found');
  }

  // Read original filename for download name
  let zipName = 'updated.zip';
  try {
    const meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
    zipName = meta.originalZip || zipName;
  } catch {
    // fallback is fine
  }

  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${zipName}"`
  );
  res.setHeader('Content-Type', 'application/zip');

  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.on('error', async (err) => {
    await logger.log(
      `ZIP archive error: ${err.message}`,
      'ERROR',
      'peek-service'
    );
    res.status(500).end();
  });

  // Pipe ZIP stream to response
  archive.pipe(res);

  // Add workspace files
  archive.directory(extractPath, false);

  await archive.finalize();
});

router.post('/file/create', async (req, res) => {
  const { ws, path: relativePath } = req.body;
  console.log('CREATE FILE BODY:', req.body);

  try {
    const filePath = resolveWorkspacePath(ws, relativePath);

    await fs.writeFile(filePath, '', { flag: 'wx' });

    await logger.log(
      `File created: ${filePath}`,
      'INFO',
      'peek-service'
    );

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/folder/create', async (req, res) => {
  const { ws, path: relativePath } = req.body;

  console.log('CREATE FOLDER BODY:', req.body);

  try {
    const folderPath = resolveWorkspacePath(ws, relativePath);

    await fs.mkdir(folderPath, { recursive: false });

    await logger.log(
      `Folder created: ${folderPath}`,
      'INFO',
      'peek-service'
    );

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/rename', async (req, res) => {
  const { ws, oldPath, newPath } = req.body;

  console.log('RENAME BODY:', req.body);

  try {
    const oldAbs = resolveWorkspacePath(ws, oldPath);
    const newAbs = resolveWorkspacePath(ws, newPath);

    await fs.rename(oldAbs, newAbs);

    await logger.log(
      `Renamed: ${oldAbs} → ${newAbs}`,
      'INFO',
      'peek-service'
    );

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/delete', async (req, res) => {
  const { ws, path: relativePath } = req.body;

  console.log('DELETE BODY:', req.body);

  try {
    const targetPath = resolveWorkspacePath(ws, relativePath);

    await fs.rm(targetPath, { recursive: true, force: true });

    await logger.log(
      `Deleted: ${targetPath}`,
      'INFO',
      'peek-service'
    );

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
