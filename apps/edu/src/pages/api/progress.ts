import type { APIRoute } from 'astro';
import { tracks } from '../../data/tracks';

// Placeholder progress database — in production this would be a real database
const placeholderProgress: Record<string, Record<string, boolean>> = {
  placeholder: {
    'track-01-lesson-01': true,
    'track-01-lesson-02': true,
    'track-01-lesson-03': true,
    'track-01-lesson-04': false,
    'track-01-lesson-05': false,
    'track-01-lesson-06': false,
    'track-01-lesson-07': false,
    'track-01-lesson-08': false,
    'track-01-lesson-09': false,
    'track-01-lesson-10': false,
  },
};

// In-memory store for POST updates (placeholder — no real database)
const progressStore: Record<string, Record<string, boolean>> = JSON.parse(
  JSON.stringify(placeholderProgress)
);

interface LessonProgress {
  slug: string;
  completed: boolean;
}

interface ProgressResponse {
  track: string;
  totalLessons: number;
  completedLessons: number;
  progress: number;
  lessons: LessonProgress[];
}

interface ProgressPostBody {
  userId?: string;
  lessonSlug?: string;
  completed?: boolean;
}

function getTrackLessons(trackId: number): string[] {
  const track = tracks.find((t) => t.id === trackId);
  if (!track) return [];

  return Array.from({ length: track.lessonCount }, (_, i) => {
    const trackNum = String(trackId).padStart(2, '0');
    const lessonNum = String(i + 1).padStart(2, '0');
    return `track-${trackNum}-lesson-${lessonNum}`;
  });
}

function buildProgressResponse(
  trackId: number,
  userId: string
): ProgressResponse | null {
  const track = tracks.find((t) => t.id === trackId);
  if (!track) return null;

  const lessonSlugs = getTrackLessons(trackId);
  const userProgress = progressStore[userId] ?? {};

  const lessons: LessonProgress[] = lessonSlugs.map((slug) => ({
    slug,
    completed: userProgress[slug] ?? false,
  }));

  const completedLessons = lessons.filter((l) => l.completed).length;
  const progress =
    lessons.length > 0
      ? Math.round((completedLessons / lessons.length) * 100)
      : 0;

  return {
    track: track.slug,
    totalLessons: lessons.length,
    completedLessons,
    progress,
    lessons,
  };
}

export const prerender = false;

export const GET: APIRoute = ({ url }) => {
  const trackParam = url.searchParams.get('track');
  const userId = url.searchParams.get('userId') ?? 'placeholder';

  if (!trackParam) {
    return new Response(
      JSON.stringify({
        error: 'Missing required parameter: track. Provide ?track=01',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const trackId = parseInt(trackParam, 10);
  if (isNaN(trackId) || !tracks.find((t) => t.id === trackId)) {
    return new Response(
      JSON.stringify({
        error: `Invalid track: ${trackParam}. Track not found.`,
      }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const result = buildProgressResponse(trackId, userId);
  if (!result) {
    return new Response(
      JSON.stringify({ error: 'Track not found' }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  let body: ProgressPostBody;

  try {
    body = (await request.json()) as ProgressPostBody;
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const { userId, lessonSlug, completed } = body;

  if (!userId || !lessonSlug || typeof completed !== 'boolean') {
    return new Response(
      JSON.stringify({
        error:
          'Missing required fields. Body must include: userId (string), lessonSlug (string), completed (boolean)',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Determine track from lesson slug (format: track-XX-lesson-YY)
  const match = lessonSlug.match(/^track-(\d+)-lesson-\d+$/);
  if (!match) {
    return new Response(
      JSON.stringify({
        error: `Invalid lessonSlug format: ${lessonSlug}. Expected format: track-XX-lesson-YY`,
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const trackId = parseInt(match[1], 10);
  const track = tracks.find((t) => t.id === trackId);
  if (!track) {
    return new Response(
      JSON.stringify({ error: `Invalid track: ${trackId}. Track not found.` }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Update progress store
  if (!progressStore[userId]) {
    progressStore[userId] = {};
  }
  progressStore[userId][lessonSlug] = completed;

  const result = buildProgressResponse(trackId, userId);
  if (!result) {
    return new Response(
      JSON.stringify({ error: 'Track not found' }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
