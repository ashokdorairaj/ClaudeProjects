import { NextRequest, NextResponse } from 'next/server';
import { analyzeFrames } from '@/lib/ai';
import type { ExtractedFrame } from '@/lib/ffmpeg';

export const maxDuration = 60;

interface AnalyzeBody {
  frames: ExtractedFrame[];
  teamTag: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<AnalyzeBody>;

    if (!body.frames?.length) {
      return NextResponse.json({ error: 'frames array is required.' }, { status: 400 });
    }
    if (!body.teamTag?.trim()) {
      return NextResponse.json({ error: 'teamTag is required.' }, { status: 400 });
    }

    const result = await analyzeFrames(body.frames, body.teamTag);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[api/analyze]', err);
    return NextResponse.json({ error: 'Analysis failed.' }, { status: 500 });
  }
}
