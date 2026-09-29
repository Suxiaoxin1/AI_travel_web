const express = require('express');
const router = express.Router();
const videoTaskService = require('../services/videoTaskService');

router.get('/config', (req, res) => {
    res.json(videoTaskService.getEngineStatus());
});

router.post('/tasks', (req, res) => {
    try {
        const videoTaskService = require('../services/videoTaskService');
        const task = videoTaskService.createBailianTask(req.body || {});
        res.status(202).json(task);
    } catch (error) {
        console.error('Create video task error:', error);
        res.status(400).json({ error: error.message || String(error) });
    }
});

router.get('/tasks/:taskId', (req, res) => {
    const task = videoTaskService.getTask(req.params.taskId);
    if (!task) {
        return res.status(404).json({ error: '任务不存在或已过期（服务重启后内存任务会丢失）' });
    }
    res.json(task);
});

module.exports = router;
