import { NextRequest, NextResponse } from 'next/server';
import { searchSimilarPlays } from '@/lib/pinecone';

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q');
    const topK = Math.min(20, Math.max(1, Number(req.nextUrl.searchParams.get('topK') ?? '5')));

    if (!q?.trim()) {
      return NextResponse.json({ error: 'q query parameter is required.' }, { status: 400 });
    }

    const matches = await searchSimilarPlays(q, topK);
    return NextResponse.json({ query: q, topK, matches });
  } catch (err) {
    console.error('[api/knowledge/search]', err);
    return NextResponse.json({ error: 'Search failed.' }, { status: 500 });
  }
}
