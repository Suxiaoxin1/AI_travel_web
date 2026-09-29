const fs = require("fs");
const path = require("path");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const ARK_API_KEY = process.env.ARK_API_KEY;
const ARK_MODEL = process.env.ARK_MODEL || "doubao-seed-1.6-vision-250815";
const ARK_BASE_URL = (process.env.ARK_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3").replace(/\/$/, "");

function assertApiKey() {
    if (!ARK_API_KEY) {
        throw new Error("Missing ARK_API_KEY. Please set it in backend/.env");
    }
}

function fileToDataUrl(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
    const base64 = fs.readFileSync(filePath).toString("base64");
    return `data:${mimeType};base64,${base64}`;
}

function extractJSON(text) {
    try {
        const simpleClean = String(text).replace(/```json|```/g, "").trim();
        if (simpleClean.startsWith("{") || simpleClean.startsWith("[")) {
            return JSON.parse(simpleClean);
        }

        const firstOpenBrace = text.indexOf("{");
        const firstOpenBracket = text.indexOf("[");
        const lastCloseBrace = text.lastIndexOf("}");
        const lastCloseBracket = text.lastIndexOf("]");

        let firstOpen = -1;
        let lastClose = -1;

        if (firstOpenBrace !== -1 && (firstOpenBracket === -1 || firstOpenBrace < firstOpenBracket)) {
            firstOpen = firstOpenBrace;
            lastClose = lastCloseBrace;
        } else if (firstOpenBracket !== -1) {
            firstOpen = firstOpenBracket;
            lastClose = lastCloseBracket;
        }

        if (firstOpen !== -1 && lastClose !== -1) {
            return JSON.parse(text.substring(firstOpen, lastClose + 1));
        }

        return JSON.parse(text);
    } catch (e) {
        throw new Error(`Failed to parse JSON: ${String(text).substring(0, 200)}...`);
    }
}

function extractArkText(data) {
    if (!data) {
        throw new Error("Empty response from Ark API");
    }

    if (typeof data.output_text === "string" && data.output_text.trim()) {
        return data.output_text;
    }

    if (Array.isArray(data.output)) {
        const texts = [];
        for (const item of data.output) {
            if (!item) continue;
            if (typeof item.text === "string") texts.push(item.text);
            if (Array.isArray(item.content)) {
                for (const part of item.content) {
                    if (!part) continue;
                    if (typeof part.text === "string") texts.push(part.text);
                    if (typeof part.output_text === "string") texts.push(part.output_text);
                }
            }
        }
        if (texts.length) return texts.join("\n");
    }

    const chatText = data.choices?.[0]?.message?.content;
    if (typeof chatText === "string" && chatText.trim()) {
        return chatText;
    }

    // Some Ark responses put refusal/error in top-level error
    if (data.error) {
        throw new Error(`Ark API error: ${JSON.stringify(data.error)}`);
    }

    throw new Error(`Unexpected Ark response shape: ${JSON.stringify(data).substring(0, 500)}`);
}

function formatAxiosError(error) {
    if (error?.response?.data) {
        return typeof error.response.data === "string"
            ? error.response.data
            : JSON.stringify(error.response.data);
    }
    return error?.message || String(error);
}

function getStatusCode(error) {
    return error?.response?.status || error?.status || null;
}

async function makeRequestWithRetry(fn, retries = 3, delayMs = 3000) {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            const status = getStatusCode(error);
            const message = formatAxiosError(error);
            console.error(`Ark request failed (attempt ${i + 1}/${retries}):`, message);

            if (status === 429 && i < retries - 1) {
                console.log(`Rate limit hit. Retrying in ${delayMs / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
                delayMs *= 2;
                continue;
            }
            const wrapped = new Error(message);
            wrapped.status = status;
            throw wrapped;
        }
    }
    throw lastError || new Error("Max retries exceeded");
}

async function callArkChat(messages) {
    assertApiKey();
    const response = await axios.post(
        `${ARK_BASE_URL}/chat/completions`,
        {
            model: ARK_MODEL,
            messages,
            temperature: 0.7,
        },
        {
            headers: {
                Authorization: `Bearer ${ARK_API_KEY}`,
                "Content-Type": "application/json",
            },
            timeout: 180000,
            validateStatus: () => true,
        }
    );

    if (response.status >= 400) {
        throw new Error(`Ark chat HTTP ${response.status}: ${JSON.stringify(response.data).slice(0, 500)}`);
    }

    return extractArkText(response.data);
}

async function callArkResponses(contentParts) {
    assertApiKey();
    const response = await axios.post(
        `${ARK_BASE_URL}/responses`,
        {
            model: ARK_MODEL,
            input: [
                {
                    role: "user",
                    content: contentParts,
                },
            ],
        },
        {
            headers: {
                Authorization: `Bearer ${ARK_API_KEY}`,
                "Content-Type": "application/json",
            },
            timeout: 180000,
            validateStatus: () => true,
        }
    );

    if (response.status >= 400) {
        throw new Error(`Ark responses HTTP ${response.status}: ${JSON.stringify(response.data).slice(0, 500)}`);
    }

    return extractArkText(response.data);
}

async function callArk({ text, imagePaths = [] }) {
    // Prefer OpenAI-compatible chat/completions (stable with vision + text).
    const chatContent = [];
    for (const imagePath of imagePaths) {
        chatContent.push({
            type: "image_url",
            image_url: { url: fileToDataUrl(imagePath) },
        });
    }
    chatContent.push({ type: "text", text });

    try {
        return await callArkChat([{ role: "user", content: chatContent }]);
    } catch (chatError) {
        console.warn("Chat Completions failed, falling back to Responses API:", chatError.message);

        const responseParts = [
            ...imagePaths.map((imagePath) => ({
                type: "input_image",
                image_url: fileToDataUrl(imagePath),
            })),
            { type: "input_text", text },
        ];
        return callArkResponses(responseParts);
    }
}

async function analyzeImages(filePaths) {
    const prompt = `按顺序分析这 ${filePaths.length} 张图片，并返回一个 JSON 数组（每张图一个对象）。
每个对象必须包含：
- "description": 简洁中文描述（2-3句）。
- "location": 推断的地点（如"海滩"、"巴黎"、"客厅"）。
- "city": 能识别则写城市/国家，否则为 null。
- "timeOfDay": 推断的时段（如"清晨"、"黄昏"、"夜晚"）。
- "activity": 画面中正在发生什么（中文）。
- "mood": 画面氛围/情绪（中文）。

只返回合法 JSON 数组，不要其他说明。顺序必须与输入图片一致。所有文本字段请使用中文。`;

    try {
        const text = await makeRequestWithRetry(async () => {
            const result = await callArk({ text: prompt, imagePaths: filePaths });
            console.log("DEBUG: Raw Batch Analysis Output:", String(result).slice(0, 800));
            return result;
        }, 2, 3000);

        const data = extractJSON(text);

        if (Array.isArray(data)) {
            return data.map((item, index) => ({
                path: filePaths[index],
                ...item,
            }));
        }

        console.warn("AI didn't return an array, attempting to wrap/parse");
        return filePaths.map((filePath) => ({
            path: filePath,
            description: "图片分析格式异常。",
            location: "",
            city: "",
            timeOfDay: "",
            mood: "",
        }));
    } catch (error) {
        console.error(`Error analyzing batch of images:`, error.message || error);
        // Propagate so /api/analyze returns a useful 500 instead of silent dummy data.
        throw new Error(`图片分析失败: ${error.message || error}`);
    }
}

async function generateStory(descriptions) {
    const numImages = descriptions.length;
    const targetWordsPerImage = 40;
    const totalTargetWords = numImages * targetWordsPerImage;

    let prompt = `根据以下图片描述序列，创作一段适合短视频旁白的中文旅行故事。

关键约束：
1. **总长度**：全文大约 ${totalTargetWords} 个汉字（允许上下浮动约 20 字）。
2. **节奏**：每张图大约对应 ${targetWordsPerImage} 字。
3. **视觉落地**：必须提到图片中可见的具体细节（如“那艘蓝色小船”“码头后面的晚霞”“我的红帽子”），不要空泛地说“我看到了船”。

风格要求：
- 口语化、亲切，像朋友聊天。
- 直接从事件开始（例如“周末我去了……”），避免“有一种节奏……”这类抒情开头。
- 按时间顺序讲述。
- 使用第一人称“我”（多人可用“我们”）。
- 段落短、好念，适合语音旁白。
- 不要出现话题标签或纯视觉符号。
- 全文必须是中文。
- 只返回 JSON 对象，包含：
1. "story": 完整连贯的故事正文。
2. "segments": 数组，每项对应一张图，包含 "image_index" 和 "text"（该图对应的旁白片段）。

图片描述：
`;

    descriptions.forEach((item, index) => {
        prompt += `图片 ${index + 1}:
- 描述: ${item.description}
- 地点: ${item.location || "未知"}
- 城市/地点: ${item.city || "未知"}
- 时段: ${item.timeOfDay || "未知"}
- 氛围: ${item.mood || "未知"}
\n`;
    });

    try {
        const text = await makeRequestWithRetry(async () => {
            const result = await callArk({ text: prompt });
            console.log("DEBUG: Raw Story Output:", String(result).slice(0, 800));
            return result;
        }, 2, 3000);

        return extractJSON(text);
    } catch (error) {
        console.error("Error generating story:", error.message || error);
        throw new Error(`故事生成失败: ${error.message || error}`);
    }
}

module.exports = { analyzeImages, generateStory };
