const express = require('express');
const router = express.Router();
const ttsService = require('../services/ttsService');
const path = require('path');

router.post('/', async (req, res) => {
    try {
        const { text, voice } = req.body;
        if (!text) return res.status(400).json({ error: 'Text is required' });

        const uploadDir = process.env.UPLOAD_DIR || 'uploads';
        const filename = `speech-${Date.now()}.mp3`;

        // Resolve output path
        let outputPath;
        if (path.isAbsolute(uploadDir)) {
            outputPath = path.join(uploadDir, filename);
        } else {
            outputPath = path.join(__dirname, '../', uploadDir, filename);
        }

        await ttsService.generateAudio(text, outputPath, voice);

        res.json({
            audioUrl: `/uploads/${filename}`,
            audioPath: outputPath // Returning internal path for ffmpeg later
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
