const path = require('node:path');
const multer = require('multer');
const config = require('../config/config');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, config.UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `avatar-${req.user ? req.user.id : 'anon'}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image type. Only JPEG, PNG, and WebP are supported.'), false);
  }
};

const uploadAvatar = multer({
  storage: storage,
  limits: { fileSize: config.MAX_FILE_SIZE },
  fileFilter: fileFilter
});

module.exports = {
  uploadAvatar
};
