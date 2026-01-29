const express = require('express');
const router = express.Router();
const path = require('path');

const rootDir = require('../utils/pathUtils');
const { title } = require('process');
const upload = require(path.join(rootDir, 'config', 'multer'));

const fileTree = [
  {
    name: "src",
    type: "folder",
    children: [
      { name: "index.js", type: "file" },
      {
        name: "utils",
        type: "folder",
        children: [
          { name: "helper.js", type: "file" }
        ]
      }
    ]
  },
  { name: "README.md", type: "file" }
]


router.get('/display', (req, res) => {
  res.render('peek/peek', { error: null, title : 'Peek Files'});
});

router.post(
  '/result',
  upload.single('archive'), // must match input name
  (req, res) => {
    if (!req.file) {
      return res.render('peek/Peek', {
        error: 'No file uploaded',
        title : 'Peek Files'
      });
    }

    console.log('Uploaded file:', req.file);

    // req.file contains:
    // path → full path
    // filename → stored filename
    // originalname → original file name

    res.render('peek/result', {
        tree: fileTree,     // directory structure
        archiveName: req.file.originalname,
        title : 'Peek Result'
    });
  }
);

module.exports = router;
