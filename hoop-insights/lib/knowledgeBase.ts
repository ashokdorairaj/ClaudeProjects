import type { PlayMatch } from './pinecone';

export interface Drill {
  id: string;
  name: string;
  focus_area: string;
  correction_trigger: string;
  category: 'offense' | 'defense' | 'transition';
  tags: string[];
}

export const KNOWLEDGE_BASE: Drill[] = [
  {
    id: 'kb-001',
    name: 'Shell Drill',
    focus_area: 'Help-side defense positioning and rotation',
    correction_trigger:
      'Trigger this drill if the vision model detects poor help-side rotations, ball-side overplaying, or defenders failing to see both ball and man.',
    category: 'defense',
    tags: ['defense', 'rotation', 'help-side', 'positioning', 'zone', '2-3'],
  },
  {
    id: 'kb-002',
    name: '3-Man Weave',
    focus_area: 'Transition passing, court vision, and sprint conditioning',
    correction_trigger:
      'Trigger this drill if the vision model detects missed or late outlet passes, players not filling lanes, or poor ball movement in transition.',
    category: 'transition',
    tags: ['transition', 'passing', 'outlet', 'court-vision', 'press-break'],
  },
  {
    id: 'kb-003',
    name: 'Spain Pick & Roll',
    focus_area: 'Back-screen timing on top of ball-screen actions',
    correction_trigger:
      'Trigger this drill if the vision model detects the roll man being left unguarded or defenders switching late on stacked screen actions.',
    category: 'offense',
    tags: ['pick-and-roll', 'screen', 'horns', 'elbow', 'iso'],
  },
  {
    id: 'kb-004',
    name: 'Closeout Drill',
    focus_area: 'Closing out on perimeter shooters while staying in control',
    correction_trigger:
      'Trigger this drill if the vision model detects defenders sprinting past shooters, leaving feet early, or giving up open corner threes.',
    category: 'defense',
    tags: ['defense', 'closeout', 'perimeter', 'rotation', 'hedge', 'drop'],
  },
  {
    id: 'kb-005',
    name: '4-Out 1-In Motion Drill',
    focus_area: 'Spacing, off-ball movement, and dribble-penetration kick-outs',
    correction_trigger:
      'Trigger this drill if the vision model detects players bunching in the paint, failing to relocate after passes, or poor corner/wing spacing.',
    category: 'offense',
    tags: ['motion', 'spacing', 'cut', 'offense', 'kick-out'],
  },
  {
    id: 'kb-006',
    name: '2-on-1 Fast Break',
    focus_area: 'Decision-making and finishing at speed in transition',
    correction_trigger:
      'Trigger this drill if the vision model detects the ball-handler not reading the defender, turning easy lay-ups into contested shots, or wrong pass/drive decisions.',
    category: 'transition',
    tags: ['transition', 'fast-break', 'outlet', 'finishing', 'press-break'],
  },
  {
    id: 'kb-007',
    name: 'Zig-Zag Defensive Footwork',
    focus_area: 'On-ball lateral quickness, stance, and containment',
    correction_trigger:
      'Trigger this drill if the vision model detects ball-handlers blowing past defenders laterally, poor stance width, or defenders reaching instead of sliding.',
    category: 'defense',
    tags: ['defense', 'on-ball', 'footwork', 'containment', 'pick-and-roll'],
  },
  {
    id: 'kb-008',
    name: 'Horns Set Execution',
    focus_area: 'Elbow-entry timing, screener reads, and shooter curl options',
    correction_trigger:
      'Trigger this drill if the vision model detects mis-timed elbow entries, screeners popping too early, or the ball-handler not reading the defender\'s coverage.',
    category: 'offense',
    tags: ['horns', 'elbow', 'screen', 'iso', 'cut'],
  },
  {
    id: 'kb-009',
    name: 'Zone Offense — Skip-Pass Series',
    focus_area: 'Attacking zone gaps with skip passes and high-low entries',
    correction_trigger:
      'Trigger this drill if the vision model detects the offense settling for contested mid-range shots against zone, failing to skip quickly, or ignoring the short-corner.',
    category: 'offense',
    tags: ['zone', 'offense', 'spacing', 'motion', '2-3'],
  },
  {
    id: 'kb-010',
    name: 'Full-Court Press Break',
    focus_area: 'Inbounding under pressure, middle-man release, and advancement',
    correction_trigger:
      'Trigger this drill if the vision model detects 5-second counts on inbounds, turnover-prone dribbling against traps, or missing the middle-release safety valve.',
    category: 'transition',
    tags: ['press-break', 'transition', 'outlet', 'inbound'],
  },
  {
    id: 'kb-011',
    name: 'Drop Coverage Pick-and-Roll',
    focus_area: 'Big man drop technique and guard \'going under\' on ball-screens',
    correction_trigger:
      'Trigger this drill if the vision model detects the screener\'s defender hedging too aggressively, leaving the roller open, or the ball-handler getting uncontested pull-ups.',
    category: 'defense',
    tags: ['pick-and-roll', 'hedge', 'drop', 'defense', 'rotation'],
  },
  {
    id: 'kb-012',
    name: 'Mikan & Reverse Mikan',
    focus_area: 'Finishing around the basket and post footwork',
    correction_trigger:
      'Trigger this drill if the vision model detects players over-dribbling in the paint, poor drop-step angles, or low-percentage contested layups near the rim.',
    category: 'offense',
    tags: ['finishing', 'post', 'offense', 'motion'],
  },
];

/**
 * Returns drills from the knowledge base that are relevant to the detected play matches.
 * Matches on category first, then tag overlap. Deduplicates and caps at `limit`.
 */
export function getRelevantDrills(matches: PlayMatch[], limit = 5): Drill[] {
  const scores = new Map<string, { drill: Drill; score: number }>();

  for (const match of matches) {
    for (const drill of KNOWLEDGE_BASE) {
      const categoryMatch = drill.category === match.category ? 3 : 0;
      const tagOverlap = match.tags.filter(t => drill.tags.includes(t)).length;
      const total = categoryMatch + tagOverlap;

      if (total === 0) continue;

      const existing = scores.get(drill.id);
      if (!existing || existing.score < total) {
        scores.set(drill.id, { drill, score: total });
      }
    }
  }

  return [...scores.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(v => v.drill);
}
