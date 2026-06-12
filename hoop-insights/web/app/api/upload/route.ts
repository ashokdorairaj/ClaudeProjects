import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import os from 'os';
import { extractFrames } from '@/lib/ffmpeg';

// Allow up to 60s for FFmpeg extraction on Vercel
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let tmpPath: string | null = null;

  try {
    const form = await req.formData();
    const file = form.get('video') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'video field is required.' }, { status: 400 });
    }
    if (!file.type.startsWith('video/')) {
      return NextResponse.json({ error: 'Uploaded file must be a video.' }, { status: 400 });
    }

    // Write to /tmp — the only writable path in serverless environments
    const bytes = await file.arrayBuffer();
    tmpPath = join(os.tmpdir(), `${randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`);
    await writeFile(tmpPath, Buffer.from(bytes));

    const frames = await extractFrames(tmpPath);

    return NextResponse.json({ frames, frameCount: frames.length });
  } catch (err) {
    console.error('[api/upload]', err);
    return NextResponse.json({ error: 'Frame extraction failed.' }, { status: 500 });
  } finally {
    if (tmpPath) unlink(tmpPath).catch(() => null);
  }
}
