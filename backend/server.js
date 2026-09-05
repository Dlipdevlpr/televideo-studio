import express from 'express';
import cors from 'cors';
import { createCanvas } from 'canvas';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PassThrough } from 'stream';

// Import the exact same rendering engine used by the frontend!
import { renderTeleprompterCanvas } from '../src/utils/teleprompterEngine.js';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
// Need a large limit for incoming base64 audio data
app.use(express.json({ limit: '50mb' }));

app.post('/api/export', async (req, res) => {
  try {
    const { config, audioBase64, bgmBase64, bgmUrl, bgmVolume = 0.20, durationSec } = req.body;
    
    console.log(`Starting export: ${durationSec} seconds...`);
    
    // 1. Save main speech audio to a temp file
    let audioPath = null;
    if (audioBase64) {
      const base64Data = audioBase64.indexOf(',') !== -1 ? audioBase64.split(',')[1] : audioBase64;
      const audioBuffer = Buffer.from(base64Data, 'base64');
      audioPath = path.join(__dirname, `temp_audio_${Date.now()}.mp3`);
      fs.writeFileSync(audioPath, audioBuffer);
    }

    // 2. Save or Download BGM audio to a temp file
    let bgmPath = null;
    if (bgmBase64) {
      const base64Data = bgmBase64.indexOf(',') !== -1 ? bgmBase64.split(',')[1] : bgmBase64;
      const bgmBuffer = Buffer.from(base64Data, 'base64');
      bgmPath = path.join(__dirname, `temp_bgm_${Date.now()}.mp3`);
      fs.writeFileSync(bgmPath, bgmBuffer);
    } else if (bgmUrl) {
      try {
        const bgmResponse = await fetch(bgmUrl);
        if (bgmResponse.ok) {
          const arrayBuffer = await bgmResponse.arrayBuffer();
          bgmPath = path.join(__dirname, `temp_bgm_${Date.now()}.mp3`);
          fs.writeFileSync(bgmPath, Buffer.from(arrayBuffer));
        }
      } catch (bgmErr) {
        console.warn('BGM fetch error:', bgmErr);
      }
    }
    
    // 3. Set up FFmpeg stream and process
    const outputPath = path.join(__dirname, `output_${Date.now()}.mp4`);
    
    const fps = 30;
    const totalFrames = Math.ceil(durationSec * fps);
    
    const imageStream = new PassThrough();

    const command = ffmpeg()
      .input(imageStream)
      .inputFormat('image2pipe')
      .inputOption('-vcodec mjpeg')
      .inputFps(fps);

    if (audioPath) {
      command.input(audioPath);
    }

    if (bgmPath) {
      command.input(bgmPath).inputOption('-stream_loop -1');
    }

    command.outputOptions([
      '-c:v libx264',
      '-pix_fmt yuv420p',
      '-preset veryfast'
    ]);

    // Handle Audio Mixing
    if (audioPath && bgmPath) {
      const vol = Math.max(0, Math.min(1, parseFloat(bgmVolume)));
      command.complexFilter([
        `[1:a]volume=1.0[voice]`,
        `[2:a]volume=${vol}[bgm]`,
        `[voice][bgm]amix=inputs=2:duration=longest:dropout_transition=2[aout]`
      ], ['aout']);
      command.outputOptions(['-c:a aac', '-b:a 128k', `-t ${durationSec}`]);
    } else if (audioPath) {
      command.outputOptions(['-c:a aac', '-b:a 128k', `-t ${durationSec}`]);
    } else if (bgmPath) {
      const vol = Math.max(0, Math.min(1, parseFloat(bgmVolume)));
      command.complexFilter([
        `[1:a]volume=${vol}[aout]`
      ], ['aout']);
      command.outputOptions(['-c:a aac', '-b:a 128k', `-t ${durationSec}`]);
    } else {
      command.outputOptions([`-t ${durationSec}`]);
    }

    command.save(outputPath);
      
    let isFinished = false;

    const cleanup = () => {
      if (audioPath && fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
      if (bgmPath && fs.existsSync(bgmPath)) fs.unlinkSync(bgmPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    };
    
    // 4. Handle FFmpeg events
    command.on('end', () => {
      isFinished = true;
      console.log('Export finished! Sending file to client...');
      res.download(outputPath, 'teleprompt_reel.mp4', () => {
        cleanup();
      });
    });
    
    command.on('error', (err) => {
      console.error('FFmpeg Error:', err);
      if (!isFinished) {
        res.status(500).json({ error: 'Video generation failed: ' + err.message });
        cleanup();
      }
    });

    // 4. Generate frames and pipe to FFmpeg
    console.log(`Generating ${totalFrames} frames...`);
    const canvas = createCanvas(config.canvasWidth, config.canvasHeight);
    const ctx = canvas.getContext('2d');
    
    // We write frames asynchronously to handle backpressure
    const writeFrames = async () => {
      for (let i = 0; i < totalFrames; i++) {
        const currentTime = i / fps;
        const progress = Math.min(1, currentTime / durationSec);
        
        const frameConfig = {
          ...config,
          progress,
          currentTime,
          width: config.canvasWidth,
          height: config.canvasHeight
        };
        
        // Draw the frame mathematically
        renderTeleprompterCanvas(ctx, frameConfig);
        
        // Extract raw bytes
        const buffer = canvas.toBuffer('image/jpeg', { quality: 0.85 });
        const canWrite = imageStream.write(buffer);
        
        // Handle stream backpressure so we don't overload memory
        if (!canWrite) {
          await new Promise(resolve => imageStream.once('drain', resolve));
        }

        if (i % 30 === 0) {
          console.log(`Rendered frame ${i}/${totalFrames}`);
        }
      }
      
      console.log('All frames generated, closing stream...');
      imageStream.end();
    };

    // Start frame generation loop
    writeFrames().catch(err => {
      console.error("Frame generation error:", err);
      imageStream.end(); // close stream so ffmpeg fails cleanly
    });

  } catch (error) {
    console.error('Export Request Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`For mobile testing, connect to your computer's local IP address on port ${PORT}`);
});
