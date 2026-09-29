const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const path = require('path');

// Analyze images and generate story
// Body: { filePaths: string[] } (Paths relative to project root, e.g., 'uploads/...')
router.post('/', async (req, res) => {
    try {
        const { filePaths } = req.body;

        if (!filePaths || !Array.isArray(filePaths) || filePaths.length === 0) {
            return res.status(400).json({ error: 'Invalid or empty filePaths provided' });
        }

        const uploadDir = process.env.UPLOAD_DIR || 'uploads';

        // Helper to resolve path to storage location
        const resolveToStorage = (p) => {
            const basename = path.basename(p);
            if (path.isAbsolute(uploadDir)) {
                return path.join(uploadDir, basename);
            }
            return path.join(__dirname, '../', uploadDir, basename);
        };

        const distinctPaths = filePaths.map(p => resolveToStorage(p));

        const descriptions = await aiService.analyzeImages(distinctPaths);

        const storyData = await aiService.generateStory(descriptions);

        res.json({
            descriptions,
            story: storyData
        });

    } catch (error) {
        console.error('Analysis error:', error);
        require('fs').writeFileSync('error.log', `Analysis Error: ${error.message}\nStack: ${error.stack}\n`);
        res.status(500).json({ error: error.message || 'Failed to process images' });
    }
});

// Regenerate Story
// Body: { descriptions: Array<Object> } (Array of image description objects)
router.post('/regenerate', async (req, res) => {
    try {
        const { descriptions } = req.body;

        if (!descriptions || !Array.isArray(descriptions) || descriptions.length === 0) {
            return res.status(400).json({ error: 'Invalid or empty descriptions provided' });
        }
        // descriptions array now contains user-edited metadata
        const story = await aiService.generateStory(descriptions);
        res.json({ story });
    } catch (error) {
        console.error('Regeneration error:', error);
        require('fs').writeFileSync('error.log', `Regeneration Error: ${error.message}\nStack: ${error.stack}\n`);
        res.status(500).json({ error: 'Failed to regenerate story' });
    }
});

module.exports = router;
