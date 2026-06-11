import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { generateText, embed } from 'ai';
import type { ExtractedFrame } from './ffmpeg';

export interface PlayAnnotation {
  timestamp: number;
  playType: string;
  description: string;
  players: string[];
  confidence: number;
}

export interface AnalysisResult {
  teamTag: string;
  annotations: PlayAnnotation[];
  summary: string;
}

const SYSTEM_PROMPT = `You are an expert basketball analyst with deep knowledge of NBA and college tactics.
When given video frames, identify plays, formations, and tactical patterns with precision.
Always respond with valid JSON only — no markdown fences, no explanation outside the JSON object.`;

export async function analyzeFrames(
  frames: ExtractedFrame[],
  teamTag: string,
): Promise<AnalysisResult> {
  const { text } = await generateText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyse these ${frames.length} frames from a game tagged: "${teamTag}".
Return a JSON object with this exact shape:
{
  "annotations": [
    { "timestamp": 0, "playType": "string", "description": "string", "players": ["string"], "confidence": 0.0 }
  ],
  "summary": "string"
}`,
          },
          ...frames.map(f => ({
            type: 'image' as const,
            image: f.base64,
            mimeType: f.mimeType,
          })),
        ],
      },
    ],
  });

  const parsed = JSON.parse(text) as Omit<AnalysisResult, 'teamTag'>;
  return { teamTag, ...parsed };
}

export async function embedText(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: text,
  });
  return embedding;
}
