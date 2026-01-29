const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs/promises');

const rootDir = require('../utils/pathUtils');
const upload = require(path.join(rootDir, 'config', 'multer'));
const logger = require('../services/logger');
const { readZipWithPython } = require('../services/py2js');

router.get('/display', (req, res) => {
  res.render('peek/peek', { error: null, title: 'Peek Files' });
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

    let pythonOutput;
    try {
      pythonOutput = await readZipWithPython(req.file.path);
    } catch (err) {
      await logger.log(
        `Error processing zip: ${err.message}`,
        'ERROR',
        'peek-service'
      );
      return res.render('peek/peek', {
        error: 'Failed to process archive',
        title: 'Peek Files'
      });
    }

    let fileTree;
    try {
      const jsonData = await fs.readFile(pythonOutput, 'utf8');
      fileTree = JSON.parse(jsonData);
    } catch (err) {
      await logger.log(
        `Invalid JSON from python: ${err.message}`,
        'ERROR',
        'peek-service'
      );
      return res.render('peek/peek', {
        error: 'Failed to read archive',
        title: 'Peek Files'
      });
    }

    res.render('peek/result', {
      tree: fileTree,
      title: 'Peek Result'
    });
  }
);

module.exports = router;
