const express = require('express');
const router = express.Router();
const videoService = require('../services/videoService');
const path = require('path');

router.post('/', async (req, res) => {
    try {
        const { imagePaths, audioPath } = req.body;

        if (!imagePaths || !Array.isArray(imagePaths) || imagePaths.length === 0) {
            return res.status(400).json({ error: 'imagePaths is required' });
        }
        if (!audioPath) {
            return res.status(400).json({ error: 'audioPath is required' });
        }

        const uploadDir = process.env.UPLOAD_DIR || 'uploads';

        // Helper to resolve path to storage location
        const resolveToStorage = (p) => {
            const basename = path.basename(p);
            // If we are in cloud (UPLOAD_DIR is absolute, likely /tmp), rely on basename in UPLOAD_DIR
            // This assumes all inputs for video are recently uploaded files
            if (path.isAbsolute(uploadDir)) {
                return path.join(uploadDir, basename);
            }
            // Local development: 'uploads' relative to project
            return path.join(__dirname, '../', uploadDir, basename);
        };

        const absoluteImagePaths = imagePaths.map(p => resolveToStorage(p));
        const absoluteAudioPath = resolveToStorage(audioPath);

        const filename = `vacation-story-${Date.now()}.mp4`;
        // Just use resolveToStorage for consistency
        const outputPath = resolveToStorage(filename);

        await videoService.createVideo(absoluteImagePaths, absoluteAudioPath, outputPath);

        res.json({
            videoUrl: `/uploads/${filename}`
        });
    } catch (error) {
        console.error("Video Gen Error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
