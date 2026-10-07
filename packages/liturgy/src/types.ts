/** The six liturgical colors Pax themes with (SPEC: Liturgical theming). */
export type LiturgicalColor = 'green' | 'violet' | 'rose' | 'white' | 'red' | 'black';

export type Season =
  | 'ADVENT'
  | 'CHRISTMAS_TIME'
  | 'LENT'
  | 'PASCHAL_TRIDUUM'
  | 'EASTER_TIME'
  | 'ORDINARY_TIME';

export type Rank =
  | 'SOLEMNITY'
  | 'SUNDAY'
  | 'FEAST'
  | 'MEMORIAL'
  | 'OPTIONAL_MEMORIAL'
  | 'WEEKDAY';

export type SundayCycle = 'A' | 'B' | 'C';
export type WeekdayCycle = 'I' | 'II';
export type LectionaryCycle = SundayCycle | WeekdayCycle;

/** Citations only, in the US lectionary's own wording and (Hebrew) Psalm numbering. */
export interface ReadingCitations {
  firstReading: string;
  psalm: string;
  secondReading: string | null;
  gospel: string;
}

export interface DaySnapshot {
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  /** 0 = Sunday … 6 = Saturday. */
  dayOfWeek: number;
  /** romcal key of the celebration, e.g. `ignatius_of_antioch_bishop`. */
  key: string;
  /** Celebration name, e.g. "Saint Ignatius of Antioch, Bishop and Martyr". */
  name: string;
  rank: Rank;
  rankName: string;
  isHolyDayOfObligation: boolean;
  season: Season;
  seasonName: string;
  /** Week of the current season (Advent 1–4, Ordinary Time 1–34, …). */
  weekOfSeason: number;
  /** The color that drives the accent. */
  color: LiturgicalColor;
  /** Every color allowed for the day (e.g. rose then violet on Gaudete Sunday). */
  colors: LiturgicalColor[];
  /** romcal martyrology key of the day's saint, used for `saints.romcal_key`. Null on days without a saint. */
  saintKey: string | null;
  /** All saints honored by the celebration (Peter and Paul has two). */
  saintKeys: string[];
  isMartyr: boolean;
  /** Key of the underlying weekday when a memorial replaces it, e.g. `ordinary_time_28_saturday`. */
  weekdayKey: string | null;
  sundayCycle: SundayCycle;
  weekdayCycle: WeekdayCycle;
  /** The cycle the day's readings were chosen from. */
  lectionaryCycle: LectionaryCycle;
  /** Null when the bundled lectionary has no citations for the day yet. */
  readings: ReadingCitations | null;
  /** USCCB daily readings page for the date (unframed link). */
  usccbUrl: string;
}
