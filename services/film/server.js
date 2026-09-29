const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const uploadsPath = path.isAbsolute(uploadDir) ? uploadDir : path.join(__dirname, uploadDir);
app.use('/uploads', express.static(uploadsPath, {
    setHeaders(res, filePath) {
        if (filePath.toLowerCase().endsWith('.mp4')) {
            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Content-Disposition', `inline; filename="${path.basename(filePath)}"`);
            res.setHeader('Accept-Ranges', 'bytes');
        }
    },
}));

// Routes
const uploadRoutes = require('./routes/uploadRoutes');
const analyzeRoutes = require('./routes/analyzeRoutes');
const ttsRoutes = require('./routes/ttsRoutes');
const videoRoutes = require('./routes/videoRoutes');
const videoTaskRoutes = require('./routes/videoTaskRoutes');

app.use('/api/upload', uploadRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/tts', ttsRoutes);
app.use('/api/video', videoRoutes); // legacy slideshow + TTS mux
app.use('/api/video-engine', videoTaskRoutes); // Bailian silent AI clips

app.get('/', (req, res) => {
    res.send('AI Vacation Video App Backend is running');
});

app.get('/api/health', (req, res) => {
    const videoTaskService = require('./services/videoTaskService');
    res.json({
        ok: true,
        ...videoTaskService.getEngineStatus(),
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
