const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const resolvedUploadDir = path.isAbsolute(uploadDir)
    ? uploadDir
    : path.join(__dirname, '../', uploadDir);
fs.mkdirSync(resolvedUploadDir, { recursive: true });

// Upload multiple photos (max 20)
router.post('/', (req, res) => {
    upload.array('photos', 20)(req, res, (err) => {
        if (err) {
            console.error('Upload middleware error:', err.message);
            return res.status(400).json({ error: err.message });
        }

        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ error: 'No files uploaded' });
            }

            const filePaths = req.files.map(file => ({
                originalName: file.originalname,
                filename: file.filename,
                path: `/uploads/${file.filename}`
            }));

            res.status(200).json({
                message: 'Files uploaded successfully',
                files: filePaths
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
});

module.exports = router;
