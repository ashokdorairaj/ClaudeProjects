import { NextRequest, NextResponse } from 'next/server';
import { upsertPlay, type PlayRecord } from '@/lib/pinecone';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { plays?: PlayRecord[] };

    if (!Array.isArray(body.plays) || body.plays.length === 0) {
      return NextResponse.json({ error: 'plays array is required.' }, { status: 400 });
    }

    // Validate each play has required fields
    for (const play of body.plays) {
      if (!play.id || !play.name || !play.description || !play.category) {
        return NextResponse.json(
          { error: 'Each play must have id, name, description, and category.' },
          { status: 400 },
        );
      }
    }

    await Promise.all(body.plays.map(upsertPlay));

    return NextResponse.json({ ingested: body.plays.length });
  } catch (err) {
    console.error('[api/knowledge/ingest]', err);
    return NextResponse.json({ error: 'Ingestion failed.' }, { status: 500 });
  }
}
