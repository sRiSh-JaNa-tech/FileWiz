const multer = require('multer');
const path = require('path');
const rootDir = require("../utils/pathUtils");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(rootDir,"temp","uploads"));
  },
  filename: (req, file, cb) => {
    const unique =
      Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (path.extname(file.originalname).toLowerCase() === '.pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files allowed'));
  }
};

module.exports = multer({ storage, fileFilter });
