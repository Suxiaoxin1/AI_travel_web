const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
require('dotenv').config();

// Prefer new console API Key; fall back to legacy AppID + Access Token.
const TTS_API_KEY = process.env.VOLC_TTS_API_KEY || process.env.DOUBAO_TTS_API_KEY;
const TTS_APP_ID = process.env.VOLC_TTS_APP_ID || process.env.DOUBAO_TTS_APPID;
const TTS_ACCESS_TOKEN = process.env.VOLC_TTS_ACCESS_TOKEN || process.env.DOUBAO_TTS_TOKEN;
const TTS_RESOURCE_ID = process.env.VOLC_TTS_RESOURCE_ID || 'seed-tts-1.0';
const TTS_URL = process.env.VOLC_TTS_URL || 'https://openspeech.bytedance.com/api/v3/tts/unidirectional';

const DEFAULT_VOICE = process.env.VOLC_TTS_VOICE || 'zh_female_cancan_mars_bigtts';
const VOICE_ALIASES = {
    Aoede: process.env.VOLC_TTS_VOICE_FEMALE || 'zh_female_cancan_mars_bigtts',
    Fenrir: process.env.VOLC_TTS_VOICE_MALE || 'zh_male_M392_conversation_wvae_bigtts',
    female: process.env.VOLC_TTS_VOICE_FEMALE || 'zh_female_cancan_mars_bigtts',
    male: process.env.VOLC_TTS_VOICE_MALE || 'zh_male_M392_conversation_wvae_bigtts',
};

function assertConfig() {
    if (TTS_API_KEY) return;
    if (TTS_APP_ID && TTS_ACCESS_TOKEN) return;
    throw new Error(
        'Missing Doubao TTS credentials. Set VOLC_TTS_API_KEY ' +
        '(from https://console.volcengine.com/speech/new/setting/apikeys) ' +
        'or VOLC_TTS_APP_ID + VOLC_TTS_ACCESS_TOKEN. ' +
        'Note: Ark ARK_API_KEY / Doubao-Seed-Character cannot be used for TTS.'
    );
}

function resolveVoice(voiceName) {
    if (!voiceName) return DEFAULT_VOICE;
    return VOICE_ALIASES[voiceName] || voiceName;
}

function buildAuthHeaders() {
    const headers = {
        'Content-Type': 'application/json',
        'X-Api-Resource-Id': TTS_RESOURCE_ID,
        'X-Api-Request-Id': randomUUID(),
    };

    if (TTS_API_KEY) {
        headers['X-Api-Key'] = TTS_API_KEY;
        return headers;
    }

    headers['X-Api-App-Id'] = TTS_APP_ID;
    headers['X-Api-Access-Key'] = TTS_ACCESS_TOKEN;
    return headers;
}

function splitNdjsonObjects(bufferText) {
    const objects = [];
    let depth = 0;
    let start = -1;
    let inString = false;
    let escaped = false;

    for (let i = 0; i < bufferText.length; i++) {
        const ch = bufferText[i];

        if (inString) {
            if (escaped) {
                escaped = false;
            } else if (ch === '\\') {
                escaped = true;
            } else if (ch === '"') {
                inString = false;
            }
            continue;
        }

        if (ch === '"') {
            inString = true;
            continue;
        }

        if (ch === '{') {
            if (depth === 0) start = i;
            depth += 1;
        } else if (ch === '}') {
            depth -= 1;
            if (depth === 0 && start !== -1) {
                objects.push(bufferText.slice(start, i + 1));
                start = -1;
            }
        }
    }

    return objects;
}

async function synthesizeWithV3(text, speaker) {
    const payload = {
        user: { uid: 'odyssee-backend' },
        req_params: {
            text,
            speaker,
            audio_params: {
                format: 'mp3',
                sample_rate: 24000,
            },
            additions: JSON.stringify({
                disable_markdown_filter: true,
                enable_language_detector: true,
                enable_latex_tn: false,
            }),
        },
    };

    const response = await axios.post(TTS_URL, payload, {
        headers: buildAuthHeaders(),
        responseType: 'text',
        timeout: 180000,
        // Volcengine returns concatenated JSON objects in a chunked stream.
        transformResponse: [(data) => data],
        validateStatus: () => true,
    });

    if (response.status >= 400) {
        throw new Error(
            `Volcengine TTS HTTP ${response.status}: ${String(response.data).slice(0, 400)} ` +
            `logid=${response.headers['x-tt-logid'] || 'n/a'}`
        );
    }

    const raw = typeof response.data === 'string' ? response.data : String(response.data || '');
    const chunks = splitNdjsonObjects(raw);
    if (!chunks.length) {
        throw new Error(`Unexpected empty TTS response. logid=${response.headers['x-tt-logid'] || 'n/a'} body=${raw.slice(0, 300)}`);
    }

    const audioParts = [];
    let finished = false;
    let lastError = null;

    for (const chunk of chunks) {
        let parsed;
        try {
            parsed = JSON.parse(chunk);
        } catch (error) {
            continue;
        }

        if (parsed.code === 0 && parsed.data) {
            audioParts.push(Buffer.from(parsed.data, 'base64'));
            continue;
        }

        // End-of-synthesis success marker for V3 unidirectional API.
        if (parsed.code === 20000000) {
            finished = true;
            continue;
        }

        if (parsed.code && parsed.code !== 0 && parsed.code !== 20000000) {
            lastError = parsed;
        }
    }

    if (!audioParts.length) {
        const detail = lastError ? JSON.stringify(lastError) : raw.slice(0, 300);
        throw new Error(`Volcengine TTS returned no audio: ${detail}`);
    }

    if (!finished && lastError) {
        throw new Error(`Volcengine TTS incomplete: ${JSON.stringify(lastError)}`);
    }

    return Buffer.concat(audioParts);
}

async function generateAudio(text, outputPath, voiceName = 'Aoede') {
    assertConfig();

    const speaker = resolveVoice(voiceName);
    const content = String(text || '').trim();
    if (!content) {
        throw new Error('TTS text is empty');
    }

    console.log(`Generating audio with Doubao TTS V3 speaker=${speaker}, resource=${TTS_RESOURCE_ID}`);
    const audioBuffer = await synthesizeWithV3(content, speaker);

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, audioBuffer);
    console.log(`Audio saved to ${outputPath} (${audioBuffer.length} bytes)`);
    return outputPath;
}

module.exports = { generateAudio };
