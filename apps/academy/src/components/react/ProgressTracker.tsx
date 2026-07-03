import { useState, useEffect, useCallback } from 'react';

interface LessonProgress {
  slug: string;
  completed: boolean;
}

interface ProgressData {
  track: string;
  totalLessons: number;
  completedLessons: number;
  progress: number;
  lessons: LessonProgress[];
}

interface ProgressTrackerProps {
  /** Track ID, e.g. "01" for Track 1 */
  track?: string;
  /** Current lesson slug to highlight */
  currentLessonSlug?: string;
  /** User ID (placeholder for now) */
  userId?: string;
}

const STORAGE_KEY_PREFIX = 'nguyenai-progress-';

export default function ProgressTracker({
  track = '01',
  currentLessonSlug,
  userId = 'placeholder',
}: ProgressTrackerProps) {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingSlug, setUpdatingSlug] = useState<string | null>(null);

  const storageKey = `${STORAGE_KEY_PREFIX}${track}`;

  // Load from localStorage as fallback
  const loadFromStorage = useCallback((): Record<string, boolean> => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }, [storageKey]);

  // Save to localStorage
  const saveToStorage = useCallback(
    (lessons: LessonProgress[]) => {
      try {
        const map: Record<string, boolean> = {};
        lessons.forEach((l) => {
          map[l.slug] = l.completed;
        });
        localStorage.setItem(storageKey, JSON.stringify(map));
      } catch {
        // localStorage might not be available
      }
    },
    [storageKey]
  );

  // Merge API data with localStorage fallback
  const mergeWithStorage = useCallback(
    (apiData: ProgressData): ProgressData => {
      const stored = loadFromStorage();
      const mergedLessons = apiData.lessons.map((l) => ({
        slug: l.slug,
        completed: stored[l.slug] ?? l.completed,
      }));
      const completedLessons = mergedLessons.filter((l) => l.completed).length;
      const progress =
        mergedLessons.length > 0
          ? Math.round((completedLessons / mergedLessons.length) * 100)
          : 0;
      return {
        ...apiData,
        lessons: mergedLessons,
        completedLessons,
        progress,
      };
    },
    [loadFromStorage]
  );

  // Fetch progress on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchProgress() {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/progress?track=${track}&userId=${userId}`
        );
        if (!res.ok) {
          throw new Error(`Failed to fetch progress: ${res.status}`);
        }
        const data: ProgressData = await res.json();
        if (!cancelled) {
          const merged = mergeWithStorage(data);
          setProgressData(merged);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          // Fallback: build from localStorage only
          const stored = loadFromStorage();
          const trackNum = track.padStart(2, '0');
          const lessonSlugs = Array.from({ length: 10 }, (_, i) =>
            `track-${trackNum}-lesson-${String(i + 1).padStart(2, '0')}`
          );
          const lessons = lessonSlugs.map((slug) => ({
            slug,
            completed: stored[slug] ?? false,
          }));
          const completedLessons = lessons.filter((l) => l.completed).length;
          const fallbackData: ProgressData = {
            track: `track-${track}`,
            totalLessons: lessons.length,
            completedLessons,
            progress: Math.round((completedLessons / lessons.length) * 100),
            lessons,
          };
          setProgressData(fallbackData);
          setError('Using local progress (API unavailable)');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchProgress();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track, userId]);

  // Toggle lesson completion
  const toggleLesson = useCallback(
    async (slug: string, currentCompleted: boolean) => {
      if (!progressData) return;

      setUpdatingSlug(slug);
      const newCompleted = !currentCompleted;

      // Optimistic update
      const updatedLessons = progressData.lessons.map((l) =>
        l.slug === slug ? { ...l, completed: newCompleted } : l
      );
      const completedLessons = updatedLessons.filter((l) => l.completed).length;
      const updatedData: ProgressData = {
        ...progressData,
        lessons: updatedLessons,
        completedLessons,
        progress: Math.round((completedLessons / updatedLessons.length) * 100),
      };
      setProgressData(updatedData);
      saveToStorage(updatedLessons);

      // Sync to API (best-effort)
      try {
        await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            lessonSlug: slug,
            completed: newCompleted,
          }),
        });
      } catch {
        // API might not be available in static mode — localStorage is the fallback
      } finally {
        setUpdatingSlug(null);
      }
    },
    [progressData, userId, saveToStorage]
  );

  if (loading) {
    return (
      <div className="academy-card p-6 max-w-3xl">
        <div className="animate-pulse">
          <div className="h-6 bg-academy-border rounded w-1/3 mb-4"></div>
          <div className="h-2 bg-academy-border rounded-full mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-academy-border rounded"></div>
            <div className="h-4 bg-academy-border rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!progressData) {
    return (
      <div className="academy-card p-6 max-w-3xl">
        <p className="text-sm text-academy-muted">
          Không thể tải tiến độ học tập.
        </p>
      </div>
    );
  }

  return (
    <div className="academy-card p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-academy-text">
          Tiến độ học tập
        </h3>
        <span className="text-sm font-semibold text-academy-accent">
          {progressData.completedLessons}/{progressData.totalLessons} bài
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-academy-border rounded-full overflow-hidden mb-2">
        <div
          className="h-2.5 bg-academy-accent rounded-full transition-all duration-500"
          style={{ width: `${progressData.progress}%` }}
        />
      </div>
      <div className="flex justify-between items-center mb-5">
        <span className="text-sm text-academy-muted">
          {progressData.progress}% hoàn thành
        </span>
        {error && (
          <span className="text-xs text-academy-muted italic">{error}</span>
        )}
      </div>

      {/* Lesson list with toggle buttons */}
      <div className="space-y-2">
        {progressData.lessons.map((lesson, idx) => {
          const lessonNum = idx + 1;
          const isCurrent = lesson.slug === currentLessonSlug;
          return (
            <div
              key={lesson.slug}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                isCurrent
                  ? 'border-academy-accent bg-academy-accent/5'
                  : 'border-academy-border'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    lesson.completed
                      ? 'bg-academy-accent text-white'
                      : 'bg-academy-border text-academy-muted'
                  }`}
                >
                  {lesson.completed ? '✓' : lessonNum}
                </span>
                <a
                  href={`/lessons/${lesson.slug}`}
                  className={`text-sm no-underline truncate ${
                    lesson.completed
                      ? 'text-academy-text/60 line-through'
                      : 'text-academy-text hover:text-academy-accent'
                  }`}
                >
                  Bài {lessonNum}
                </a>
              </div>
              <button
                onClick={() => toggleLesson(lesson.slug, lesson.completed)}
                disabled={updatingSlug === lesson.slug}
                className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-md transition-colors disabled:opacity-50 ${
                  lesson.completed
                    ? 'text-academy-muted hover:text-academy-text bg-academy-bg'
                    : 'text-white bg-academy-accent hover:bg-academy-accent/90'
                }`}
              >
                {updatingSlug === lesson.slug
                  ? '...'
                  : lesson.completed
                    ? '✓ Đã hoàn thành'
                    : 'Đánh dấu hoàn thành'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Completion CTA */}
      {progressData.progress === 100 && (
        <div className="mt-5 p-4 rounded-lg bg-academy-accent/10 border border-academy-accent/20 text-center">
          <p className="text-sm font-semibold text-academy-text mb-2">
            🎉 Bạn đã hoàn thành tất cả bài học trong track này!
          </p>
          <a
            href="/certification"
            className="inline-block text-sm font-medium text-academy-accent no-underline hover:underline"
          >
            Làm bài kiểm tra để nhận chứng chỉ →
          </a>
        </div>
      )}
    </div>
  );
}
