const multer = require('multer');
const path = require('path');

const uploadsPath = path.resolve(__dirname, '../uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsPath); // Set destination folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Create unique filename based on timestamp
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // Set file size limit (5MB)
});

module.exports = upload;
