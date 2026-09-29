const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { randomUUID } = require('crypto');

const MODELS = ['wan2.7-r2v-2026-06-12', 'wan2.7-r2v'];
const RESOLUTIONS = ['1080P', '720P'];
const RATIOS = ['16:9', '9:16', '1:1', '4:3', '3:4'];
const DURATION = { default: 8, min: 2, max: 15 };

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function clampDuration(value) {
    const duration = Number(value || DURATION.default);
    if (!Number.isFinite(duration)) return DURATION.default;
    return Math.max(DURATION.min, Math.min(DURATION.max, Math.round(duration)));
}

function authHeaders(apiKey) {
    return {
        Authorization: `Bearer ${apiKey}`,
    };
}

function buildBailianEndpoint({ workspaceId, region }) {
    const safeWorkspaceId = String(workspaceId || '').trim();
    const safeRegion = String(region || 'cn-beijing').trim();
    if (!safeWorkspaceId) return '';
    return `https://${safeWorkspaceId}.${safeRegion}.maas.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis`;
}

function buildBailianStatusEndpoint({ workspaceId, region }) {
    const safeWorkspaceId = String(workspaceId || '').trim();
    const safeRegion = String(region || 'cn-beijing').trim();
    if (!safeWorkspaceId) return '';
    return `https://${safeWorkspaceId}.${safeRegion}.maas.aliyuncs.com/api/v1/tasks/{task_id}`;
}

function fillTemplate(template, values) {
    return String(template || '').replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
}

function pickVideoUrl(payload) {
    return (
        payload?.output?.video_url ||
        payload?.video_url ||
        payload?.videoUrl ||
        payload?.download_url ||
        payload?.downloadUrl ||
        payload?.url ||
        payload?.data?.video_url ||
        payload?.data?.videoUrl ||
        payload?.data?.download_url ||
        payload?.data?.url ||
        null
    );
}

function pickTaskId(payload) {
    return (
        payload?.output?.task_id ||
        payload?.task_id ||
        payload?.taskId ||
        payload?.id ||
        payload?.data?.task_id ||
        payload?.data?.taskId ||
        null
    );
}

function pickTaskStatus(payload) {
    return String(
        payload?.output?.task_status ||
            payload?.task_status ||
            payload?.status ||
            payload?.data?.task_status ||
            payload?.data?.status ||
            ''
    ).toUpperCase();
}

async function fetchJson(url, options = {}, timeoutMs = 120000) {
    let data = options.data;
    if (data === undefined && options.body) {
        data = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    }

    const response = await axios({
        url,
        method: options.method || 'GET',
        headers: options.headers || {},
        data,
        timeout: timeoutMs,
        validateStatus: () => true,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
    });

    if (response.status >= 400) {
        const msg =
            response.data?.message ||
            response.data?.error ||
            response.data?.output?.message ||
            JSON.stringify(response.data).slice(0, 300);
        throw new Error(`百炼请求失败 HTTP ${response.status}: ${msg}`);
    }
    return response.data;
}

function buildPrompt({
    image,
    index,
    total,
    sceneName,
    location,
    requirement,
    durationPerImage,
    resolution,
    mood,
    description,
}) {
    const subject = sceneName?.trim() || '画面主体';
    const place = location?.trim() ? `，地点参考：${location.trim()}` : '';
    const moodHint = mood?.trim() ? `氛围：${mood.trim()}。` : '';
    const descHint = description?.trim() ? `画面要点：${description.trim()}。` : '';
    const userNeed = requirement?.trim() ? `用户补充要求：${requirement.trim()}。` : '';
    const fileHint = image?.name ? `参考图片文件名：${image.name}。` : '';
    const sequenceHint = total > 1 ? `这是一组 ${total} 张旅行照片中的第 ${index} 张。` : '';

    return {
        imageIndex: index,
        prompt:
            `参考图片为图1。基于图1生成一段约 ${durationPerImage} 秒、${resolution} 高清旅行短视频。` +
            sequenceHint +
            `保持图1中的${subject}、场景、构图、色彩、光影和空间关系稳定不变${place}。` +
            '摄像机围绕画面主体做缓慢、稳定、柔和的运动，可轻微推进、轻微环绕或横向平移，展示景点特色和空间层次。' +
            '加入自然环境动态，例如云层缓慢移动、水面轻微波动、树叶轻摆、光影柔和变化、衣物或发丝轻微飘动。' +
            '整体风格自然、治愈、有电影感，适合拼接成旅行短视频。不要旁白、不要字幕、不要音乐、不要音效、不要人物说话。' +
            `${moodHint}${descHint}${userNeed}${fileHint}`,
        negativePrompt:
            '低分辨率、错误、最差质量、低质量、残缺、多余的手指、主体变形、人物脸部扭曲、建筑结构错乱、画面闪烁、过度运动、快速旋转、镜头抖动、文字乱码、风格漂移、出现与图1无关的新主体、图片内容被大幅改写、旁白、字幕、音乐、音效、人物说话。',
    };
}

function getBailianConfig(overrides = {}) {
    const apiKey = String(overrides.apiKey || process.env.DASHSCOPE_API_KEY || '').trim();
    const workspaceId = String(overrides.workspaceId || process.env.BAILIAN_WORKSPACE_ID || '').trim();
    const region = String(overrides.region || process.env.BAILIAN_REGION || 'cn-beijing').trim();
    const model = String(overrides.model || process.env.BAILIAN_MODEL || MODELS[0]).trim();
    const resolution = String(overrides.resolution || process.env.BAILIAN_RESOLUTION || '1080P').trim();
    const ratio = String(overrides.ratio || process.env.BAILIAN_RATIO || '16:9').trim();
    const durationPerImage = clampDuration(overrides.durationPerImage ?? process.env.BAILIAN_DURATION_PER_IMAGE);
    const promptExtend = overrides.promptExtend === undefined ? false : Boolean(overrides.promptExtend);
    const watermark = Boolean(overrides.watermark);

    if (model && !MODELS.includes(model)) {
        throw new Error(`暂不支持模型 ${model}，请使用：${MODELS.join('、')}`);
    }
    if (resolution && !RESOLUTIONS.includes(resolution)) {
        throw new Error(`暂不支持分辨率 ${resolution}，请使用：${RESOLUTIONS.join('、')}`);
    }
    if (ratio && !RATIOS.includes(ratio)) {
        throw new Error(`暂不支持画幅比例 ${ratio}，请使用：${RATIOS.join('、')}`);
    }

    return {
        provider: 'aliyun-bailian',
        apiKey,
        workspaceId,
        region,
        model,
        resolution,
        ratio,
        durationPerImage,
        promptExtend,
        watermark,
        sceneName: String(overrides.sceneName || '').trim(),
        location: String(overrides.location || '').trim(),
        requirement: String(overrides.requirement || '').trim(),
        providerEndpoint: String(overrides.providerEndpoint || '').trim(),
        statusEndpoint: String(overrides.statusEndpoint || '').trim(),
    };
}

function buildProviderEndpoint(config) {
    if (config.providerEndpoint) return config.providerEndpoint;
    return buildBailianEndpoint(config);
}

function buildStatusEndpoint(config) {
    if (config.statusEndpoint) return config.statusEndpoint;
    return buildBailianStatusEndpoint(config);
}

function buildProviderPayload({ image, index, config, promptPack }) {
    const mediaUrl = image.url || image.dataUrl;
    if (!mediaUrl) {
        throw new Error(`第 ${index} 张图片缺少图片数据。`);
    }

    return {
        model: config.model,
        input: {
            prompt: promptPack.prompt,
            negative_prompt: promptPack.negativePrompt,
            media: [
                {
                    type: 'reference_image',
                    url: mediaUrl,
                },
            ],
        },
        parameters: {
            resolution: config.resolution,
            duration: config.durationPerImage,
            ratio: config.ratio,
            prompt_extend: config.promptExtend,
            watermark: config.watermark,
        },
    };
}

async function pollVideoResult({ statusEndpoint, apiKey, remoteTaskId, onProgress }) {
    for (let attempt = 1; attempt <= 80; attempt += 1) {
        await sleep(15000);
        const url = fillTemplate(statusEndpoint, {
            task_id: remoteTaskId,
            taskId: remoteTaskId,
            id: remoteTaskId,
        });
        const data = await fetchJson(
            url,
            {
                method: 'GET',
                headers: authHeaders(apiKey),
            },
            30000
        );

        const status = pickTaskStatus(data);
        const videoUrl = pickVideoUrl(data);
        if (typeof onProgress === 'function') {
            onProgress({ attempt, status, videoUrl });
        }
        if (videoUrl) return videoUrl;
        if (['FAILED', 'ERROR', 'CANCELED', 'CANCELLED', 'UNKNOWN'].includes(status)) {
            throw new Error(data?.output?.message || data?.message || data?.error || '远程视频任务失败。');
        }
    }
    throw new Error('等待远程视频任务超时。');
}

async function generateClip({ image, index, total, config, onProgress }) {
    const promptPack = buildPrompt({
        image,
        index,
        total,
        sceneName: image.sceneName || config.sceneName,
        location: image.location || config.location,
        requirement: config.requirement,
        durationPerImage: config.durationPerImage,
        resolution: config.resolution,
        mood: image.mood,
        description: image.description,
    });

    const providerEndpoint = buildProviderEndpoint(config);
    if (!providerEndpoint || !config.apiKey) {
        // Mock mode for local wiring without Bailian credentials.
        await sleep(800 + index * 200);
        return {
            imageIndex: index,
            status: 'completed',
            videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
            prompt: promptPack.prompt,
            negativePrompt: promptPack.negativePrompt,
            mock: true,
        };
    }

    const data = await fetchJson(providerEndpoint, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'X-DashScope-Async': 'enable',
            ...authHeaders(config.apiKey),
        },
        data: buildProviderPayload({ image, index, config, promptPack }),
    });

    const immediateUrl = pickVideoUrl(data);
    if (immediateUrl) {
        return {
            imageIndex: index,
            status: 'completed',
            videoUrl: immediateUrl,
            prompt: promptPack.prompt,
            negativePrompt: promptPack.negativePrompt,
        };
    }

    const remoteTaskId = pickTaskId(data);
    const statusEndpoint = data?.status_endpoint || data?.statusEndpoint || buildStatusEndpoint(config);
    if (!remoteTaskId || !statusEndpoint) {
        throw new Error('图生视频 API 未返回 video_url，也未返回 task_id + status_endpoint。');
    }

    if (typeof onProgress === 'function') {
        onProgress({ imageIndex: index, remoteTaskId, status: 'QUEUED' });
    }

    const videoUrl = await pollVideoResult({
        statusEndpoint,
        apiKey: config.apiKey,
        remoteTaskId,
        onProgress: (p) => onProgress?.({ imageIndex: index, remoteTaskId, ...p }),
    });

    return {
        imageIndex: index,
        status: 'completed',
        videoUrl,
        prompt: promptPack.prompt,
        negativePrompt: promptPack.negativePrompt,
    };
}

function findFfmpegPath() {
    const candidates = [process.env.FFMPEG_PATH, 'ffmpeg'].filter(Boolean);
    for (const candidate of candidates) {
        if (candidate === 'ffmpeg') {
            const probe = spawnSync(candidate, ['-version'], { windowsHide: true, timeout: 3000 });
            if (probe.status === 0) return candidate;
            continue;
        }
        if (fs.existsSync(candidate)) return candidate;
    }
    return '';
}

function runProcess(command, args, timeoutMs = 180000) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, { windowsHide: true });
        let stdout = '';
        let stderr = '';
        const timer = setTimeout(() => {
            child.kill('SIGKILL');
            reject(new Error(`${path.basename(command)} 执行超时。`));
        }, timeoutMs);

        child.stdout.on('data', (chunk) => {
            stdout += chunk.toString();
        });
        child.stderr.on('data', (chunk) => {
            stderr += chunk.toString();
        });
        child.on('error', (error) => {
            clearTimeout(timer);
            reject(error);
        });
        child.on('close', (code) => {
            clearTimeout(timer);
            if (code === 0) {
                resolve({ stdout, stderr });
                return;
            }
            reject(new Error(stderr.trim() || stdout.trim() || `${path.basename(command)} exited with code ${code}`));
        });
    });
}

function resolutionToSize(resolution, ratio = '16:9') {
    const high = String(resolution).toUpperCase() === '720P' ? 720 : 1080;
    const [rw, rh] = String(ratio || '16:9')
        .split(':')
        .map((value) => Number(value));
    if (!rw || !rh) return { width: Math.round((high * 16) / 9 / 2) * 2, height: high };
    if (rw >= rh) {
        const width = Math.round((high * rw) / rh / 2) * 2;
        return { width, height: high };
    }
    const width = Math.round((high * rw) / rh / 2) * 2;
    return { width, height: high };
}

function buildConcatFilter(inputCount, resolution, ratio) {
    const { width, height } = resolutionToSize(resolution, ratio);
    const chains = [];
    const labels = [];
    for (let index = 0; index < inputCount; index += 1) {
        chains.push(
            `[${index}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,` +
                `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,format=yuv420p[v${index}]`
        );
        labels.push(`[v${index}]`);
    }
    chains.push(`${labels.join('')}concat=n=${inputCount}:v=1:a=0[outv]`);
    return chains.join(';');
}

async function downloadFile(url, destPath) {
    const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 300000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
    });
    fs.writeFileSync(destPath, Buffer.from(response.data));
    return destPath;
}

async function materializeClipFiles(clips, workDir) {
    fs.mkdirSync(workDir, { recursive: true });
    const ordered = [...clips].sort((a, b) => a.imageIndex - b.imageIndex);
    const localClips = [];

    for (const clip of ordered) {
        if (clip.localPath && fs.existsSync(clip.localPath)) {
            localClips.push({ ...clip, localPath: clip.localPath });
            continue;
        }
        if (!clip.videoUrl) {
            throw new Error(`第 ${clip.imageIndex} 段缺少 videoUrl`);
        }
        if (/^https?:\/\//i.test(clip.videoUrl)) {
            const dest = path.join(workDir, `clip-${clip.imageIndex}-${randomUUID().slice(0, 8)}.mp4`);
            await downloadFile(clip.videoUrl, dest);
            localClips.push({ ...clip, localPath: dest });
        } else if (fs.existsSync(clip.videoUrl)) {
            localClips.push({ ...clip, localPath: clip.videoUrl });
        } else {
            throw new Error(`无法解析第 ${clip.imageIndex} 段视频路径：${clip.videoUrl}`);
        }
    }
    return localClips;
}

async function mergeClipsLocally({ clips, resolution, ratio, outputPath }) {
    const ffmpegPath = findFfmpegPath();
    if (!ffmpegPath) {
        throw new Error('未找到 FFmpeg，请设置 FFMPEG_PATH 或安装到系统 PATH。');
    }

    const workDir = path.join(path.dirname(outputPath), `.tmp-merge-${randomUUID().slice(0, 8)}`);
    try {
        const localClips = await materializeClipFiles(clips, workDir);

        if (localClips.length === 1) {
            fs.copyFileSync(localClips[0].localPath, outputPath);
            return {
                outputPath,
                note: '单段视频无需合并，已落盘到 uploads。',
                clipCount: 1,
            };
        }

        const args = ['-y'];
        for (const clip of localClips) {
            args.push('-i', clip.localPath);
        }
        args.push(
            '-filter_complex',
            buildConcatFilter(localClips.length, resolution, ratio),
            '-map',
            '[outv]',
            '-an',
            '-c:v',
            'libx264',
            '-preset',
            'medium',
            '-crf',
            '20',
            '-movflags',
            '+faststart',
            outputPath
        );

        await runProcess(ffmpegPath, args, Math.max(180000, localClips.length * 90000));
        return {
            outputPath,
            note: `已使用本地 FFmpeg 合并 ${localClips.length} 段无声视频。`,
            clipCount: localClips.length,
        };
    } finally {
        try {
            fs.rmSync(workDir, { recursive: true, force: true });
        } catch {
            // ignore cleanup errors
        }
    }
}

async function probeDuration(filePath) {
    const ffmpegPath = findFfmpegPath();
    if (!ffmpegPath) {
        throw new Error('未找到 FFmpeg，无法探测媒体时长。');
    }
    // Prefer ffprobe next to ffmpeg; fall back to ffmpeg -i parsing.
    const ffprobePath = ffmpegPath.toLowerCase().endsWith('ffmpeg.exe')
        ? ffmpegPath.replace(/ffmpeg\.exe$/i, 'ffprobe.exe')
        : ffmpegPath === 'ffmpeg'
          ? 'ffprobe'
          : path.join(path.dirname(ffmpegPath), process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe');

    try {
        const { stdout } = await runProcess(
            ffprobePath,
            ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', filePath],
            30000
        );
        const duration = Number(String(stdout).trim());
        if (Number.isFinite(duration) && duration > 0) return duration;
    } catch {
        // fall through
    }

    try {
        await runProcess(ffmpegPath, ['-i', filePath], 15000);
    } catch (error) {
        const text = String(error.message || '');
        const match = text.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
        if (match) {
            const hours = Number(match[1]);
            const minutes = Number(match[2]);
            const seconds = Number(match[3]);
            return hours * 3600 + minutes * 60 + seconds;
        }
        throw new Error(`无法读取媒体时长：${path.basename(filePath)}`);
    }
    throw new Error(`无法读取媒体时长：${path.basename(filePath)}`);
}

/**
 * Mux narration onto a silent video.
 * Strategy A: keep full narration; pad video last frame if video is shorter.
 */
async function muxNarrationAudio({ videoPath, audioPath, outputPath }) {
    const ffmpegPath = findFfmpegPath();
    if (!ffmpegPath) {
        throw new Error('未找到 FFmpeg，无法混入旁白。');
    }
    if (!fs.existsSync(videoPath)) throw new Error('无声成片不存在，无法混音。');
    if (!fs.existsSync(audioPath)) throw new Error('旁白音频不存在，无法混音。');

    const videoDuration = await probeDuration(videoPath);
    const audioDuration = await probeDuration(audioPath);
    const padSeconds = Math.max(0, audioDuration - videoDuration + 0.12);

    const args = ['-y', '-i', videoPath, '-i', audioPath];

    if (padSeconds > 0.05) {
        args.push(
            '-filter_complex',
            `[0:v]tpad=stop_mode=clone:stop_duration=${padSeconds.toFixed(3)}[v]`,
            '-map',
            '[v]',
            '-map',
            '1:a',
            '-c:v',
            'libx264',
            '-preset',
            'medium',
            '-crf',
            '20',
            '-c:a',
            'aac',
            '-b:a',
            '192k',
            '-shortest',
            '-movflags',
            '+faststart',
            outputPath
        );
    } else {
        // Video >= audio: cut to narration length.
        args.push(
            '-map',
            '0:v:0',
            '-map',
            '1:a:0',
            '-c:v',
            'copy',
            '-c:a',
            'aac',
            '-b:a',
            '192k',
            '-shortest',
            '-movflags',
            '+faststart',
            outputPath
        );
    }

    await runProcess(ffmpegPath, args, 300000);
    return {
        outputPath,
        videoDuration,
        audioDuration,
        padSeconds,
        note:
            padSeconds > 0.05
                ? `已混入旁白；视频短于旁白 ${padSeconds.toFixed(1)}s，已定格补齐。`
                : '已混入旁白；以旁白时长为准裁切画面。',
    };
}

function durationPerImageFromAudio(audioDurationSec, imageCount) {
    const n = Math.max(1, Number(imageCount) || 1);
    const raw = Number(audioDurationSec) / n;
    return clampDuration(Math.round(raw));
}

function isBailianConfigured() {
    const apiKey = String(process.env.DASHSCOPE_API_KEY || '').trim();
    const workspaceId = String(process.env.BAILIAN_WORKSPACE_ID || '').trim();
    return Boolean(apiKey && workspaceId);
}

module.exports = {
    MODELS,
    RESOLUTIONS,
    RATIOS,
    DURATION,
    getBailianConfig,
    buildPrompt,
    generateClip,
    mergeClipsLocally,
    muxNarrationAudio,
    probeDuration,
    durationPerImageFromAudio,
    findFfmpegPath,
    isBailianConfigured,
    clampDuration,
};
