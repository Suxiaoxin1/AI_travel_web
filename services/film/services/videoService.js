const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const exifParser = require('exif-parser');

// Helper to get image metadata (rotation) via exif-parser
function getImageOrientation(filePath) {
    try {
        const buffer = fs.readFileSync(filePath);
        const parser = exifParser.create(buffer);
        const result = parser.parse();
        return result.tags.Orientation; // 1=Normal, 3=180, 6=90CW, 8=270CW
    } catch (e) {
        return null;
    }
}

// Stitch images and audio into a video
async function createVideo(imagePaths, audioPath, outputPath) {
    console.log('Starting video creation with Blurred Backgrounds + Ken Burns...');
    return new Promise(async (resolve, reject) => {
        try {
            // 1. Get Audio Duration
            const audioMetadata = await new Promise((res, rej) => {
                ffmpeg.ffprobe(audioPath, (err, data) => err ? rej(err) : res(data));
            });
            const audioDuration = audioMetadata.format.duration;

            if (!audioDuration || isNaN(audioDuration)) throw new Error("Invalid audio duration");
            console.log(`Audio Duration: ${audioDuration}s`);

            const numImages = imagePaths.length;
            const transitionDuration = 1.0;

            // Calculate base display time per image
            const rawDisplayDuration = (audioDuration + (numImages - 1) * transitionDuration) / numImages;
            const displayDuration = Math.max(rawDisplayDuration, transitionDuration + 0.5);

            console.log(`DEBUG: Display Duration per Image: ${displayDuration}s`);

            const command = ffmpeg();

            // Image Inputs (Standard inputs, NO loop, NO duration here - zoompan handles it)
            for (let i = 0; i < numImages; i++) {
                command.input(imagePaths[i]);
                // We don't use -noautorotate here because we aren't using video options yet? 
                // Actually, for image inputs, -noautorotate is valid if we handle rotation manually.
                command.inputOptions(['-noautorotate']);
            }
            // Audio Input
            command.input(audioPath);

            const complexFilter = [];
            const streamNames = [];

            // Phase 1: Prepare each Image 
            // Frame -> Rotate -> Split -> (BG + FG) -> Overlay -> ZoomPan -> Output

            for (let i = 0; i < numImages; i++) {
                // A. Rotation
                const orientation = getImageOrientation(imagePaths[i]);
                let rotateFilter = '';
                if (orientation === 6) rotateFilter = ',transpose=1';
                else if (orientation === 3) rotateFilter = ',hflip,vflip';
                else if (orientation === 8) rotateFilter = ',transpose=2';

                const rotName = `rot${i}`;
                complexFilter.push({
                    filter: `null${rotateFilter}`,
                    inputs: `${i}:v`,
                    outputs: rotName
                });

                // B. Split
                const bgIn = `bg_in${i}`;
                const fgIn = `fg_in${i}`;
                complexFilter.push({
                    filter: `split`,
                    inputs: rotName,
                    outputs: [bgIn, fgIn]
                });

                // C. Background Chain (Cover -> Blur -> Darken)
                const bgOut = `bg_out${i}`;
                complexFilter.push({
                    filter: `scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,boxblur=20:10,eq=brightness=-0.1`,
                    inputs: bgIn,
                    outputs: bgOut
                });

                // D. Foreground Chain (Fit)
                const fgOut = `fg_out${i}`;
                complexFilter.push({
                    filter: `scale=1280:720:force_original_aspect_ratio=decrease`,
                    inputs: fgIn,
                    outputs: fgOut
                });

                // E. Overlay
                const mergedName = `merged${i}`;
                complexFilter.push({
                    filter: `overlay=(W-w)/2:(H-h)/2`, // Center FG on BG
                    inputs: [bgOut, fgOut],
                    outputs: mergedName
                });

                // F. ZoomPan (Generates the duration)
                const frameCount = Math.ceil(displayDuration * 25);
                const zoomExpr = `min(zoom+0.0005,1.15)`;
                const zoomName = `v${i}`;

                // d=frameCount sets the duration. s=1280x720 sets output size.
                complexFilter.push({
                    filter: `zoompan=z='${zoomExpr}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frameCount}:s=1280x720:fps=25`,
                    inputs: mergedName,
                    outputs: zoomName
                });

                streamNames.push(zoomName);
            }

            // Phase 2: Chain Xfades
            let finalVideo = streamNames[0];

            if (numImages > 1) {
                for (let i = 0; i < numImages - 1; i++) {
                    const nextStream = streamNames[i + 1];
                    const outStream = `m${i}`;

                    const offset = (i + 1) * (displayDuration - transitionDuration);

                    complexFilter.push({
                        filter: `xfade=transition=fade:duration=${transitionDuration}:offset=${offset}`,
                        inputs: [finalVideo, nextStream],
                        outputs: outStream
                    });

                    finalVideo = outStream;
                }
            }

            command
                .complexFilter(complexFilter, finalVideo)
                .outputOptions([
                    `-map ${numImages}:a`,
                    '-c:v libx264',
                    '-pix_fmt yuv420p',
                    '-shortest',
                    '-preset ultrafast',
                    '-map_metadata -1',
                    '-metadata:s:v:0 rotate=0',
                    '-movflags +faststart'
                ])
                .save(outputPath)
                .on('end', () => {
                    console.log('Video creation finished:', outputPath);
                    resolve(outputPath);
                })
                .on('error', (e) => {
                    console.error('FFmpeg Error:', e);
                    reject(e);
                });

        } catch (e) {
            console.error('Video creation failed:', e);
            reject(e);
        }
    });
}

module.exports = { createVideo };
