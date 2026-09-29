const multer = require('multer');
const path = require('path');

const uploadDir = process.env.UPLOAD_DIR || 'uploads/';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.isAbsolute(uploadDir)
            ? uploadDir
            : path.join(__dirname, '../', uploadDir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname || '') || '.jpg';
        cb(null, uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const originalName = file.originalname || 'photo.jpg';
    const ext = path.extname(originalName).toLowerCase().replace(/^\./, '') || 'jpg';
    const extOk = allowedTypes.test(ext);
    const mimeOk = !file.mimetype
        || allowedTypes.test(file.mimetype)
        || file.mimetype === 'application/octet-stream';

    if (extOk && mimeOk) {
        return cb(null, true);
    }
    cb(new Error('Only images are allowed (jpeg, jpg, png, webp)!'));
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: fileFilter
});

module.exports = upload;
