import { Pinecone } from '@pinecone-database/pinecone';
import { embedText } from './ai';

export interface PlayRecord {
  id: string;
  name: string;
  description: string;
  category: 'offense' | 'defense' | 'transition';
  tags: string[];
}

export interface PlayMatch {
  id: string;
  score: number;
  name: string;
  description: string;
  category: string;
  tags: string[];
}

let _client: Pinecone | null = null;

function getClient(): Pinecone {
  if (!_client) {
    if (!process.env.PINECONE_API_KEY) throw new Error('PINECONE_API_KEY is not set');
    _client = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  }
  return _client;
}

function getIndex() {
  const indexName = process.env.PINECONE_INDEX ?? 'hoop-insights';
  return getClient().index(indexName);
}

export async function upsertPlay(play: PlayRecord): Promise<void> {
  const text = `${play.name}: ${play.description}. Tags: ${play.tags.join(', ')}`;
  const embedding = await embedText(text);

  await getIndex().upsert({
    records: [
      {
        id: play.id,
        values: embedding,
        metadata: {
          name: play.name,
          description: play.description,
          category: play.category,
          tags: play.tags.join(','),
        },
      },
    ],
  });
}

export async function searchSimilarPlays(
  query: string,
  topK = 5,
): Promise<PlayMatch[]> {
  const embedding = await embedText(query);
  const results = await getIndex().query({ vector: embedding, topK, includeMetadata: true });

  return (results.matches ?? []).map(m => ({
    id: m.id,
    score: m.score ?? 0,
    name: String(m.metadata?.name ?? ''),
    description: String(m.metadata?.description ?? ''),
    category: String(m.metadata?.category ?? ''),
    tags: String(m.metadata?.tags ?? '').split(',').filter(Boolean),
  }));
}
