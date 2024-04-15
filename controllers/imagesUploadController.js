const path = require("path");
const multer = require("multer");

// multer storage configration

const uploadDirectory = path.join(__dirname, "../public/img/posts");

const imagesStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (req, file, cb) => {
    if (file) {
      cb(null, new Date().toISOString().replace(/:/g, "-") + file.originalname);
    } else {
      cb(null, false);
    }
  },
});

// Multer filter to test if the uploaded file is an images
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new Error("Not an image! Please upload images only."), false);
  }
};

// multer middleware for upload images
const uploadImages = multer({
  storage: imagesStorage,
  fileFilter: multerFilter,
});

module.exports = uploadImages;
