import type { DaySnapshot } from '@pax/liturgy';

import type { PaxMood } from '@/components/Pax';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "SATURDAY · OCT 17" as on the canvas (the caller uppercases). */
export function dayLabel(day: Pick<DaySnapshot, 'date' | 'dayOfWeek'>): string {
  const [, m, d] = day.date.split('-').map(Number) as [number, number, number];
  return `${WEEKDAYS[day.dayOfWeek]} · ${MONTHS[m - 1]} ${d}`;
}

/** "Memorial · Year II", or "Year B begins" on the First Sunday of Advent. */
export function cycleLine(day: DaySnapshot): string {
  if (day.key === 'advent_1_sunday') return `Year ${day.sundayCycle} begins`;
  return `${day.rankName} · Year ${day.lectionaryCycle}`;
}

export const MYSTERY_SET_NAMES = {
  joyful: 'Joyful',
  luminous: 'Luminous',
  sorrowful: 'Sorrowful',
  glorious: 'Glorious',
} as const;

export function ordinal(n: number): string {
  return ['First', 'Second', 'Third', 'Fourth', 'Fifth'][n - 1] ?? `${n}th`;
}

/** Pax's greeting on Today. Warm and short, never guilt-driven (SPEC: Notifications rule 3). */
export function paxGreeting(day: DaySnapshot, opts: { doneToday: boolean; hour: number }): string {
  if (opts.doneToday) return 'You prayed with the Church today. That makes me one happy dove!';
  if (day.key === 'advent_1_sunday') return 'A new Church year starts today! Light one candle and keep watch with me.';
  if (day.key === 'easter_sunday') return 'Alleluia! He is risen! This is the biggest feast of the whole year.';
  if (day.key === 'ash_wednesday') return 'Lent begins today. Forty days to make a little more room for God.';
  if (day.key === 'pentecost_sunday') return 'Come, Holy Spirit! Today the Church remembers the day she was sent out.';
  if (day.key === 'advent_3_sunday') return 'Gaudete Sunday! Rejoice, the Lord is near. Even my scarf turned rose.';
  if (day.key === 'lent_4_sunday') return 'Laetare Sunday! Rejoice, Easter is getting closer. Even my scarf turned rose.';
  if (day.rank === 'SOLEMNITY') return `Today is a solemnity: ${day.name}. Let’s celebrate together!`;
  if (day.isMartyr) return `${shortName(day.name)} gave everything for Christ. Let’s pray with today’s readings.`;
  if (day.rank === 'FEAST' || day.rank === 'MEMORIAL') return `Today we remember ${shortName(day.name)}. Want to pray with me?`;
  if (day.dayOfWeek === 0) return 'Happy Sunday! Every Sunday is a little Easter.';
  const morning = opts.hour < 12;
  switch (day.season) {
    case 'ADVENT':
      return 'Keep watch with me. The Lord is near!';
    case 'CHRISTMAS_TIME':
      return 'Christmas lasts more than a day. Still celebrating with me?';
    case 'LENT':
      return 'A few quiet minutes with God go a long way in Lent.';
    case 'PASCHAL_TRIDUUM':
      return 'These are the holiest days of the year. Let’s stay close to Jesus.';
    case 'EASTER_TIME':
      return 'Alleluia! The Easter season is fifty days of joy.';
    default:
      return morning
        ? 'Good morning! Ordinary Time is how the Church grows. Ready for today?'
        : 'There’s still time to pray with today’s readings. I’ll keep you company.';
  }
}

/** "Saint Ignatius of Antioch, Bishop and Martyr" → "Saint Ignatius of Antioch". */
export function shortName(name: string): string {
  return name.split(',')[0]!.trim();
}

/**
 * Pax's mood on Today, matching the widget timeline: hello in the morning, encouraging in the
 * evening, asleep at night, and happy as soon as today is done.
 */
export function paxMoodFor(opts: { doneToday: boolean; hour: number }): PaxMood {
  if (opts.doneToday) return 'happy';
  if (opts.hour >= 22 || opts.hour < 5) return 'asleep';
  if (opts.hour >= 18) return 'encouraging';
  return 'hello';
}
