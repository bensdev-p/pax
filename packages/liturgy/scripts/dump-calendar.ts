/**
 * Writes pipeline/seed/generated/romcal_days.json: for every date in the given years, the
 * romcal key, rank, underlying weekday key and cycles. The Python pipeline uses it to key
 * date-based lectionary data by romcal key and cycle, so it never has to run romcal itself.
 *
 *   npm run dump-calendar -w @pax/liturgy -- 2025 2028
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { calendarFor } from '../src/romcal';

const [fromArg, toArg] = process.argv.slice(2);
const from = Number(fromArg ?? 2025);
const to = Number(toArg ?? 2028);

const out = resolve(__dirname, '../../../pipeline/seed/generated/romcal_days.json');

async function main() {
  const days: Record<string, unknown> = {};
  for (let year = from; year <= to; year++) {
    const cal = await calendarFor(year);
    for (const [date, list] of Object.entries(cal)) {
      const day = list[0];
      if (!day) continue;
      days[date] = {
        key: day.id,
        name: day.name,
        rank: day.rank,
        weekdayKey: day.weekday?.id ?? null,
        season: day.seasons[day.seasons.length - 1] ?? null,
        sundayCycle: day.cycles.sundayCycle.replace('YEAR_', ''),
        weekdayCycle: day.cycles.weekdayCycle === 'YEAR_1' ? 'I' : 'II',
        saintKeys: day.martyrology.map((m) => m.id),
      };
    }
  }

  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(
    out,
    JSON.stringify({ generatedBy: '@pax/liturgy dump-calendar', from, to, days }, null, 0) + '\n',
  );
  console.log(`Wrote ${Object.keys(days).length} days (${from}–${to}) to ${out}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
