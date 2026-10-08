import type { Course, CourseProgress } from '@/data/types';

/** Whole days from one YYYY-MM-DD to another. */
export function daysBetween(from: string, to: string): number {
  const ms = (d: string) => {
    const [y, m, day] = d.split('-').map(Number) as [number, number, number];
    return Date.UTC(y, m - 1, day);
  };
  return Math.round((ms(to) - ms(from)) / 86_400_000);
}

export function startCourse(course: Pick<Course, 'slug' | 'title' | 'days'>, today: string): CourseProgress {
  return { slug: course.slug, title: course.title, days: course.days, startedOn: today, daysDone: 0, lastDoneOn: null, reminderTime: null };
}

/** The day to read next (the last day once finished). */
export function nextDay(progress: CourseProgress): number {
  return Math.min(progress.days, progress.daysDone + 1);
}

export function isFinished(progress: CourseProgress): boolean {
  return progress.daysDone >= progress.days;
}

/**
 * Days missed before today, counting one day per calendar day since the start. Only used for a
 * gentle note: the plan never moves on without you.
 */
export function daysBehind(progress: CourseProgress, today: string): number {
  if (isFinished(progress)) return 0;
  const expectedBeforeToday = Math.min(progress.days, daysBetween(progress.startedOn, today));
  return Math.max(0, expectedBeforeToday - progress.daysDone);
}

/** Progress after finishing `day`. Days are read in order, so only the next one counts. */
export function afterReading(progress: CourseProgress, day: number, today: string): CourseProgress {
  if (day !== progress.daysDone + 1) return progress;
  return { ...progress, daysDone: day, lastDoneOn: today };
}

/** XP for finishing a day of a reading plan. */
export const COURSE_DAY_XP = 10;
