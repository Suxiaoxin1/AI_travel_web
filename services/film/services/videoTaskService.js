const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const bailian = require('./bailianVideoService');
const ttsService = require('./ttsService');

const tasks = new Map();

function getUploadDir() {
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    if (path.isAbsolute(uploadDir)) return uploadDir;
    return path.join(__dirname, '..', uploadDir);
}

function resolveToStorage(p) {
    const basename = path.basename(String(p || ''));
    return path.join(getUploadDir(), basename);
}

function fileToDataUrl(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeType =
        ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.gif' ? 'image/gif' : 'image/jpeg';
    const base64 = fs.readFileSync(filePath).toString('base64');
    return `data:${mimeType};base64,${base64}`;
}

function updateTask(id, patch) {
    const previous = tasks.get(id);
    if (!previous) return;
    tasks.set(id, {
        ...previous,
        ...patch,
        updatedAt: new Date().toISOString(),
    });
}

function addLog(taskId, message) {
    const task = tasks.get(taskId);
    if (!task) return;
    updateTask(taskId, {
        logs: [...(task.logs || []), `[${new Date().toLocaleTimeString()}] ${message}`],
    });
}

function getPublicTask(taskId) {
    const task = tasks.get(taskId);
    if (!task) return null;
    return {
        task_id: task.id,
        status: task.status,
        stage: task.stage,
        progress: task.progress,
        logs: task.logs || [],
        clips: (task.clips || []).map((c) => ({
            imageIndex: c.imageIndex,
            status: c.status,
            videoUrl: c.videoUrl,
            mock: Boolean(c.mock),
            prompt: c.prompt,
        })),
        errors: task.errors || [],
        videoUrl: task.videoUrl || null,
        finalUrl: task.videoUrl || null,
        downloadUrl: task.videoUrl || null,
        audioUrl: task.audioUrl || null,
        mergeNote: task.mergeNote || null,
        alignment: task.alignment || null,
        error: task.error || null,
        mock: Boolean(task.mock),
        engine: task.engine,
        withNarration: Boolean(task.withNarration),
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
    };
}

function buildImagesFromPaths(imagePaths, descriptions = []) {
    return imagePaths.map((rawPath, idx) => {
        const absolute = resolveToStorage(rawPath);
        if (!fs.existsSync(absolute)) {
            throw new Error(`找不到图片文件：${path.basename(String(rawPath))}`);
        }
        const meta = descriptions[idx] || {};
        return {
            name: path.basename(absolute),
            type: path.extname(absolute).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg',
            size: fs.statSync(absolute).size,
            dataUrl: fileToDataUrl(absolute),
            location: meta.location || meta.city || '',
            mood: meta.mood || '',
            description: meta.description || meta.visualDescription || '',
            sceneName: meta.location || meta.city || '',
            localPath: absolute,
        };
    });
}

function buildStoryRequirement(body, descriptions) {
    const parts = [];
    if (body.requirement) parts.push(String(body.requirement).trim());
    if (body.storyText) {
        const story = String(body.storyText).trim().replace(/\s+/g, ' ');
        if (story) parts.push(`旁白故事要点：${story.slice(0, 280)}`);
    }
    const moods = (descriptions || []).map((d) => d?.mood).filter(Boolean);
    if (moods.length) parts.push(`整体氛围：${[...new Set(moods)].join('、')}`);
    if (!parts.length) parts.push('治愈风，镜头慢一点，适合旅行短视频');
    return parts.join('。');
}

async function generateClipsParallel(taskId, images, config) {
    const settled = await Promise.allSettled(
        images.map((image, idx) =>
            bailian.generateClip({
                image,
                index: idx + 1,
                total: images.length,
                config,
                onProgress: ({ status, attempt }) => {
                    if (!status) return;
                    updateTask(taskId, {
                        stage: `等待百炼：第 ${idx + 1} 张 ${status}${attempt ? ` (#${attempt})` : ''}`,
                        progress: Math.min(70, 25 + (attempt || 1)),
                    });
                },
            })
        )
    );

    const clips = [];
    const errors = [];
    settled.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
            clips.push(result.value);
        } else {
            errors.push({
                imageIndex: idx + 1,
                message: result.reason?.message || '未知错误',
            });
        }
    });

    if (clips.length === 0) {
        throw new Error(
            `所有视频片段均生成失败：${errors.map((e) => `第${e.imageIndex}张 ${e.message}`).join('；')}`
        );
    }

    return {
        clips: clips.sort((a, b) => a.imageIndex - b.imageIndex),
        errors,
    };
}

async function runBailianTask(taskId, request) {
    try {
        let config = { ...request.config };
        let audioPath = null;
        let audioUrl = null;
        let alignment = null;

        if (request.withNarration) {
            const storyText = String(request.storyText || '').trim();
            if (!storyText) {
                throw new Error('含旁白成片需要提供 storyText');
            }

            updateTask(taskId, { status: 'processing', stage: '正在生成旁白语音', progress: 8 });
            addLog(taskId, '开始豆包 TTS 旁白合成。');

            const audioName = `speech-ai-${Date.now()}.mp3`;
            audioPath = path.join(getUploadDir(), audioName);
            await ttsService.generateAudio(storyText, audioPath, request.voice || 'Aoede');
            audioUrl = `/uploads/${audioName}`;

            const audioDuration = await bailian.probeDuration(audioPath);
            const manualDuration = request.durationMode === 'manual';
            const durationPerImage = manualDuration
                ? bailian.clampDuration(config.durationPerImage)
                : bailian.durationPerImageFromAudio(audioDuration, request.images.length);
            config = { ...config, durationPerImage };
            alignment = {
                strategy: manualDuration ? 'manual-duration' : 'narration-first',
                audioDuration,
                imageCount: request.images.length,
                durationPerImage,
                estimatedVideoDuration: durationPerImage * request.images.length,
                resolution: config.resolution,
                ratio: config.ratio,
            };

            updateTask(taskId, {
                audioUrl,
                alignment,
                stage: manualDuration
                    ? `手动每图 ${durationPerImage}s（旁白 ${audioDuration.toFixed(1)}s）`
                    : `旁白 ${audioDuration.toFixed(1)}s → 每图 ${durationPerImage}s`,
                progress: 18,
            });
            addLog(
                taskId,
                manualDuration
                    ? `手动时长：每段 ${durationPerImage}s，旁白 ${audioDuration.toFixed(1)}s，分辨率 ${config.resolution}，比例 ${config.ratio}。`
                    : `旁白时长 ${audioDuration.toFixed(1)}s，${request.images.length} 张图 → 每段 ${durationPerImage}s（夹在 2–15s），分辨率 ${config.resolution}，比例 ${config.ratio}。`
            );
        } else {
            updateTask(taskId, { status: 'processing', stage: '并行调用万相参考生视频', progress: 15 });
            addLog(
                taskId,
                `无声模式：每段约 ${config.durationPerImage}s，分辨率 ${config.resolution}，比例 ${config.ratio}。`
            );
        }

        if (!config.apiKey || !config.workspaceId) {
            addLog(taskId, '未配置 DASHSCOPE_API_KEY / BAILIAN_WORKSPACE_ID（请求体或 .env），将使用 Mock 片段联通流程。');
        }

        updateTask(taskId, { stage: '并行调用万相参考生视频', progress: 22 });
        addLog(taskId, `开始处理 ${request.images.length} 张图片，每段约 ${config.durationPerImage}s。`);

        const { clips, errors } = await generateClipsParallel(taskId, request.images, config);

        updateTask(taskId, {
            clips,
            errors,
            stage: '合并视频片段',
            progress: 78,
            mock: clips.some((c) => c.mock),
        });
        addLog(taskId, `已完成 ${clips.length}/${request.images.length} 个视频片段，开始合并。`);

        const silentName = `ai-silent-${Date.now()}.mp4`;
        const silentPath = path.join(getUploadDir(), silentName);
        const merged = await bailian.mergeClipsLocally({
            clips,
            resolution: config.resolution,
            ratio: config.ratio,
            outputPath: silentPath,
        });

        if (!request.withNarration || !audioPath) {
            updateTask(taskId, {
                status: 'completed',
                stage: '已完成',
                progress: 100,
                videoUrl: `/uploads/${silentName}`,
                mergeNote: merged.note,
            });
            addLog(taskId, `无声成品已生成：/uploads/${silentName}`);
            return;
        }

        updateTask(taskId, { stage: '混入旁白音轨', progress: 90 });
        addLog(taskId, '正在将旁白混入成片（以旁白时长为准对齐）。');

        const finalName = `ai-story-${Date.now()}.mp4`;
        const finalPath = path.join(getUploadDir(), finalName);
        const muxed = await bailian.muxNarrationAudio({
            videoPath: silentPath,
            audioPath,
            outputPath: finalPath,
        });

        alignment = {
            ...(alignment || {}),
            videoDurationBeforePad: muxed.videoDuration,
            audioDuration: muxed.audioDuration,
            padSeconds: muxed.padSeconds,
        };

        updateTask(taskId, {
            status: 'completed',
            stage: '已完成',
            progress: 100,
            videoUrl: `/uploads/${finalName}`,
            audioUrl,
            alignment,
            mergeNote: `${merged.note} ${muxed.note}`,
        });
        addLog(taskId, `含旁白成品已生成：/uploads/${finalName}`);
    } catch (error) {
        updateTask(taskId, {
            status: 'failed',
            stage: '失败',
            progress: 100,
            error: error.message || String(error),
        });
        addLog(taskId, `任务失败：${error.message || String(error)}`);
    }
}

function createBailianTask(body = {}) {
    const imagePaths = Array.isArray(body.imagePaths) ? body.imagePaths : [];
    if (imagePaths.length === 0) {
        throw new Error('imagePaths is required');
    }
    if (imagePaths.length > 20) {
        throw new Error('单个任务最多支持 20 张图片');
    }

    const withNarration = body.withNarration !== false && Boolean(String(body.storyText || '').trim());
    // Explicit silent mode
    const forceSilent = body.withNarration === false;

    const descriptions = Array.isArray(body.descriptions) ? body.descriptions : [];
    const images = buildImagesFromPaths(imagePaths, descriptions);
    const requirement = buildStoryRequirement(body, descriptions);

    const config = bailian.getBailianConfig({
        sceneName: body.sceneName,
        location: body.location || descriptions.map((d) => d?.location || d?.city).filter(Boolean).join('、'),
        requirement,
        durationPerImage: body.durationPerImage,
        resolution: body.resolution,
        ratio: body.ratio,
        promptExtend: body.promptExtend,
        watermark: body.watermark,
        model: body.model,
        // 允许前端临时传入（覆盖 .env），方便更换万相密钥
        apiKey: body.apiKey || body.dashscopeApiKey,
        workspaceId: body.workspaceId || body.bailianWorkspaceId,
        region: body.region || body.bailianRegion,
    });

    const narrated = !forceSilent && withNarration;
    const id = randomUUID();
    const now = new Date().toISOString();
    tasks.set(id, {
        id,
        engine: narrated ? 'bailian-narrated' : 'bailian-silent',
        withNarration: narrated,
        status: 'queued',
        stage: '排队中',
        progress: 0,
        logs: [],
        clips: [],
        errors: [],
        createdAt: now,
        updatedAt: now,
    });

    setImmediate(() => {
        runBailianTask(id, {
            images,
            config,
            withNarration: narrated,
            storyText: body.storyText,
            voice: body.voice || 'Aoede',
            durationMode: String(body.durationMode || 'auto').trim() === 'manual' ? 'manual' : 'auto',
        });
    });

    return getPublicTask(id);
}

// Backward-compatible alias
function createBailianSilentTask(body = {}) {
    return createBailianTask({ ...body, withNarration: body.withNarration === true ? true : body.withNarration });
}

function getTask(taskId) {
    return getPublicTask(taskId);
}

function getEngineStatus() {
    return {
        bailianConfigured: bailian.isBailianConfigured(),
        ffmpegAvailable: Boolean(bailian.findFfmpegPath()),
        models: bailian.MODELS,
        resolutions: bailian.RESOLUTIONS,
        ratios: bailian.RATIOS,
        duration: bailian.DURATION,
        defaultEngine: 'bailian-narrated',
        alignmentStrategy: 'narration-first',
        slideshowAvailable: true,
        silentAvailable: true,
    };
}

module.exports = {
    createBailianTask,
    createBailianSilentTask,
    getTask,
    getEngineStatus,
};
