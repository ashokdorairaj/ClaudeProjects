import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import { mkdtemp, readFile, readdir, rm } from 'fs/promises';
import path from 'path';
import os from 'os';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

export interface ExtractedFrame {
  index: number;
  base64: string;
  mimeType: 'image/jpeg';
}

function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata.format.duration ?? 0);
    });
  });
}

export async function extractFrames(
  videoPath: string,
  frameCount = 8,
): Promise<ExtractedFrame[]> {
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'hoop-frames-'));

  try {
    const duration = await getVideoDuration(videoPath);
    // Sample evenly: 1 frame every N seconds, capped at frameCount
    const interval = Math.max(1, Math.floor(duration / frameCount));

    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .outputOptions([`-vf fps=1/${interval}`, `-vframes ${frameCount}`])
        .output(path.join(tmpDir, 'frame-%03d.jpg'))
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(err))
        .run();
    });

    const files = (await readdir(tmpDir)).filter(f => f.endsWith('.jpg')).sort();

    return Promise.all(
      files.map(async (file, i) => {
        const buf = await readFile(path.join(tmpDir, file));
        return { index: i, base64: buf.toString('base64'), mimeType: 'image/jpeg' as const };
      }),
    );
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
}
