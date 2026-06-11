import { NextRequest, NextResponse } from 'next/server';
import { extractFrames, type ExtractedFrame } from '@/lib/ffmpeg';
import { searchSimilarPlays, type PlayMatch } from '@/lib/pinecone';
import { generateGameAnalysis } from '@/lib/ai';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import os from 'os';

export const maxDuration = 60;

// Switch off to use real FFmpeg + Pinecone
const MOCK_MODE = process.env.ANALYZE_MOCK !== 'false';

// ── Mock data ──────────────────────────────────────────────────────────────

// 1x1 grey JPEG as base64 — valid image, minimal payload
const GREY_JPEG_BASE64 =
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U' +
  'HRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgN' +
  'DRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy' +
  'MjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAA' +
  'AAAAAAAAAAAAAP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA' +
  '/9oADAMBAAIRAxEAPwCwABmX/9k=';

const MOCK_FRAMES: ExtractedFrame[] = [0, 8, 16, 24, 32].map((_, i) => ({
  index: i,
  base64: GREY_JPEG_BASE64,
  mimeType: 'image/jpeg',
}));

const MOCK_MATCHES: PlayMatch[] = [
  { id: 'pk-001', score: 0.91, name: 'Pick-and-Roll Coverage',        description: 'Defending the pick-and-roll with drop or hedge coverage.',        category: 'defense',    tags: ['pick-and-roll', 'hedge', 'drop'] },
  { id: 'mo-002', score: 0.88, name: 'Motion Offense — Baseline Cut', description: 'Off-ball movement using baseline cuts to create open looks.',        category: 'offense',    tags: ['motion', 'cut', 'spacing'] },
  { id: 'zd-003', score: 0.84, name: '2-3 Zone Defense Rotation',     description: 'Rotations and responsibilities in a standard 2-3 zone.',            category: 'defense',    tags: ['zone', '2-3', 'rotation'] },
  { id: 'tr-004', score: 0.79, name: 'Press Break — Middle Release',  description: 'Breaking a full-court press via the middle release valve.',         category: 'transition', tags: ['press-break', 'transition', 'outlet'] },
  { id: 'hs-005', score: 0.73, name: 'Horns Set — Elbow Entry',       description: 'Initiating the horns set with an elbow entry pass for isolation.', category: 'offense',    tags: ['horns', 'elbow', 'iso'] },
];

// ── Route handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let tmpPath: string | null = null;

  try {
    const form = await req.formData();
    const file = form.get('video') as File | null;
    const teamTag = (form.get('teamTag') as string | null)?.trim();

    if (!file) {
      return NextResponse.json({ error: 'video field is required.' }, { status: 400 });
    }
    if (!file.type.startsWith('video/')) {
      return NextResponse.json({ error: 'Uploaded file must be a video.' }, { status: 400 });
    }
    if (!teamTag) {
      return NextResponse.json({ error: 'teamTag field is required.' }, { status: 400 });
    }

    // ── Step 2: Frame extraction (mock or real) ──────────────────────────
    let frames: ExtractedFrame[];

    if (MOCK_MODE) {
      frames = MOCK_FRAMES;
    } else {
      const bytes = await file.arrayBuffer();
      tmpPath = join(os.tmpdir(), `${randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`);
      await writeFile(tmpPath, Buffer.from(bytes));
      frames = await extractFrames(tmpPath, 5);
    }

    // ── Step 3: Pinecone knowledge base query (mock or real) ─────────────
    const matches: PlayMatch[] = MOCK_MODE
      ? MOCK_MATCHES
      : await searchSimilarPlays(`${teamTag} basketball plays`, 5);

    // ── Step 4: Generate structured analysis via Claude 3.5 Sonnet ───────
    const analysis = await generateGameAnalysis(teamTag, frames.length, matches);

    // ── Step 5: Return final response ────────────────────────────────────
    return NextResponse.json({
      teamTag,
      framesAnalysed: frames.length,
      mockMode: MOCK_MODE,
      matchedPlays: matches,
      playsExecutedWell: analysis.playsExecutedWell,
      missedOpportunities: analysis.missedOpportunities,
      recommendedDrillsToPractice: analysis.recommendedDrillsToPractice,
    });
  } catch (err) {
    console.error('[api/analyze-game]', err);
    return NextResponse.json({ error: 'Analysis failed.' }, { status: 500 });
  } finally {
    if (tmpPath) unlink(tmpPath).catch(() => null);
  }
}
