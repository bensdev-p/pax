import {
  AccessoryWidgetBackground,
  Circle,
  HStack,
  Image,
  Rectangle,
  RoundedRectangle,
  Spacer,
  Text,
  VStack,
  ZStack,
} from '@expo/ui/swift-ui';
import {
  aspectRatio,
  containerBackground,
  font,
  foregroundStyle,
  frame,
  kerning,
  lineLimit,
  minimumScaleFactor,
  padding,
  resizable,
  textCase,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { ReactElement } from 'react';

import type { PrayerWidgetProps, TodayWidgetProps, WeekWidgetProps, WordWidgetProps } from './widgetFeed';

/*
 * The four Pax widgets in look A ("Pax cards", chosen with Ben from mockups): a white card (dark
 * surface in dark mode) with Pax's raised bottom edge, the day's color for labels and marks, and
 * the orange streak. Each function below is compiled to a string and run inside the widget
 * extension (the 'widget' directive): it can't see anything outside itself, so the little helpers
 * are repeated in each. Props come from widgets/widgetFeed.ts; they are empty in the widget
 * gallery until Pax has been opened once.
 */

const PaxToday = (given: TodayWidgetProps, environment: WidgetEnvironment) => {
  'widget';
  const FILL = 9999;
  const family = environment.widgetFamily;
  const rounded = (size: number, weight: 'bold' | 'heavy' | 'black' = 'heavy') => font({ design: 'rounded', size, weight });

  const SAMPLE_COLORS = {
    light: { accent: '#24913C', edge: '#1B6E2E', onAccent: '#FFFFFF', tint: '#E5F2E8', text: '#1B6E2E', surface: '#FFFFFF', surfaceMuted: '#F7F7F7', border: '#E5E5E5', divider: '#ECECEC', ink: '#3C3C3C', inkMuted: '#6B6B6B', streak: '#FF9F1C', streakText: '#F08A00' },
    dark: { accent: '#2EA84A', edge: '#238038', onAccent: '#FFFFFF', tint: '#173726', text: '#77C689', surface: '#17222A', surfaceMuted: '#1D2A33', border: '#2E3D47', divider: '#24323B', ink: '#EEF2F5', inkMuted: '#A3B1BA', streak: '#FF9F1C', streakText: '#F08A00' },
  };
  // The widget gallery shows the widget before Pax has filled it: a sample day in Pax's green.
  const today = environment.date ?? new Date();
  const props: TodayWidgetProps = given.colors
    ? given
    : {
        scheme: 'system',
        colors: SAMPLE_COLORS,
        weekday: ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][today.getDay()]!,
        dateLabel: `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][today.getMonth()]} ${today.getDate()}`,
        streak: 7,
        rhythm: { read: true, pray: false, study: false },
        marks: ['read', 'pray', 'study'],
        title: 'Today with God',
        subtitle: 'Read · Pray · Study',
        inline: 'Pax',
        items: [
          { title: 'Today’s readings', detail: 'Read', done: true, url: 'paxapp://readings' },
          { title: 'Time to pray', detail: 'The Rosary today', done: false, url: 'paxapp://pray' },
          { title: 'A reading plan', detail: 'Day 9 of 14', done: false, url: 'paxapp://study' },
        ],
        pax: { line: 'There’s still time to pray with today’s readings.', image: null },
        url: 'paxapp://today',
      };
  const scheme = props.scheme === 'system' ? (environment.colorScheme === 'dark' ? 'dark' : 'light') : props.scheme;
  const c = props.colors[scheme];
  const label = (text: string) => (
    <Text modifiers={[rounded(11, 'black'), kerning(0.6), foregroundStyle(c.text), lineLimit(1)]}>{text}</Text>
  );
  const names = { read: 'READ', pray: 'PRAY', study: 'STUDY' };

  if (family === 'accessoryCircular') {
    return (
      <ZStack modifiers={[containerBackground('#00000000', 'widget'), widgetURL(props.url)]}>
        <AccessoryWidgetBackground />
        <VStack spacing={0}>
          <Image systemName="flame.fill" size={15} />
          <Text modifiers={[rounded(20, 'black'), minimumScaleFactor(0.6), lineLimit(1)]}>{String(props.streak)}</Text>
        </VStack>
      </ZStack>
    );
  }
  if (family === 'accessoryInline') {
    return (
      <Text modifiers={[containerBackground('#00000000', 'widget'), widgetURL(props.url)]}>{props.inline}</Text>
    );
  }
  if (family === 'accessoryRectangular') {
    return (
      <VStack alignment="leading" spacing={2} modifiers={[containerBackground('#00000000', 'widget'), frame({ maxWidth: FILL, alignment: 'leading' }), widgetURL(props.url)]}>
        <Text modifiers={[rounded(14, 'black'), lineLimit(1)]}>{props.inline}</Text>
        <HStack spacing={6}>
          {props.marks.map((mark) => (
            <HStack key={mark} spacing={2}>
              <Image systemName={props.rhythm[mark] ? 'checkmark.circle.fill' : 'circle'} size={11} />
              <Text modifiers={[rounded(11, 'bold')]}>{names[mark]}</Text>
            </HStack>
          ))}
        </HStack>
        <HStack spacing={3}>
          <Image systemName="flame.fill" size={11} />
          <Text modifiers={[rounded(12, 'bold')]}>{`${props.streak} day streak`}</Text>
        </HStack>
      </VStack>
    );
  }

  const card = (content: ReactElement) => (
    <ZStack alignment="bottom" modifiers={[containerBackground(c.surface, 'widget'), widgetURL(props.url)]}>
      {content}
      <Rectangle modifiers={[foregroundStyle(c.border), frame({ height: 4 })]} />
    </ZStack>
  );
  const flame = (size: number) => <Image systemName="flame.fill" size={size} color={c.streak} />;

  if (family === 'systemLarge') {
    return card(
      <VStack alignment="leading" spacing={10} modifiers={[frame({ maxWidth: FILL, maxHeight: FILL, alignment: 'topLeading' }), padding({ top: 16, leading: 16, trailing: 16, bottom: 20 })]}>
        <HStack>
          {label(`${props.weekday} · ${props.dateLabel.toUpperCase()}`)}
          <Spacer />
          <HStack spacing={2}>
            {flame(14)}
            <Text modifiers={[rounded(14, 'black'), foregroundStyle(c.streakText)]}>{String(props.streak)}</Text>
          </HStack>
        </HStack>
        <VStack alignment="leading" spacing={3}>
          <Text modifiers={[rounded(18, 'black'), foregroundStyle(c.ink), lineLimit(2)]}>{props.title}</Text>
          <Text modifiers={[rounded(12, 'bold'), foregroundStyle(c.inkMuted), lineLimit(1)]}>{props.subtitle}</Text>
        </VStack>
        <VStack alignment="leading" spacing={0}>
          {props.items.map((item, i) => (
            <VStack key={item.title} alignment="leading" spacing={0}>
              {i > 0 ? <Rectangle modifiers={[foregroundStyle(c.divider), frame({ height: 1 })]} /> : null}
              <HStack spacing={10} modifiers={[padding({ vertical: 6 })]}>
                <ZStack modifiers={[frame({ width: 20, height: 20 })]}>
                  <Circle modifiers={[foregroundStyle(item.done ? c.accent : c.border)]} />
                  {item.done ? (
                    <Image systemName="checkmark" size={10} color={c.onAccent} />
                  ) : (
                    <Circle modifiers={[foregroundStyle(c.surface), frame({ width: 16, height: 16 })]} />
                  )}
                </ZStack>
                <VStack alignment="leading" spacing={1}>
                  <Text modifiers={[rounded(13, 'heavy'), foregroundStyle(c.ink), lineLimit(1)]}>{item.title}</Text>
                  <Text modifiers={[rounded(11, 'bold'), foregroundStyle(c.inkMuted), lineLimit(1)]}>{item.detail}</Text>
                </VStack>
                <Spacer />
              </HStack>
            </VStack>
          ))}
        </VStack>
        <Spacer />
        <HStack spacing={10}>
          {props.pax.image ? (
            <Image uiImage={props.pax.image} modifiers={[resizable(), aspectRatio({ contentMode: 'fit' }), frame({ width: 44, height: 44 })]} />
          ) : null}
          <Text modifiers={[rounded(13, 'heavy'), foregroundStyle(c.ink), lineLimit(2)]}>{props.pax.line}</Text>
        </HStack>
      </VStack>,
    );
  }

  return card(
    <VStack alignment="leading" spacing={0} modifiers={[frame({ maxWidth: FILL, maxHeight: FILL, alignment: 'topLeading' }), padding({ top: 14, leading: 14, trailing: 14, bottom: 18 })]}>
      <HStack>
        {label(props.weekday)}
        <Spacer />
        <Text modifiers={[rounded(11, 'heavy'), foregroundStyle(c.inkMuted)]}>{props.dateLabel}</Text>
      </HStack>
      <Spacer />
      <HStack spacing={6}>
        {flame(28)}
        <VStack alignment="leading" spacing={0}>
          <Text modifiers={[rounded(34, 'black'), foregroundStyle(c.streakText), lineLimit(1), minimumScaleFactor(0.6)]}>{String(props.streak)}</Text>
          <Text modifiers={[rounded(12, 'heavy'), foregroundStyle(c.inkMuted)]}>day streak</Text>
        </VStack>
      </HStack>
      <Spacer />
      <HStack spacing={6}>
        {props.marks.map((mark) => (
          <ZStack key={mark} modifiers={[frame({ maxWidth: FILL, height: 30 })]}>
            <RoundedRectangle cornerRadius={10} modifiers={[foregroundStyle(props.rhythm[mark] ? c.accent : c.surfaceMuted)]} />
            {/* The filled chip marks it done: no checkmark, so the label stays centered and whole. */}
            <Text modifiers={[rounded(10, 'black'), foregroundStyle(props.rhythm[mark] ? c.onAccent : c.inkMuted), lineLimit(1), minimumScaleFactor(0.7), padding({ horizontal: 4 })]}>
              {names[mark]}
            </Text>
          </ZStack>
        ))}
      </HStack>
    </VStack>,
  );
};

const PaxPrayer = (given: PrayerWidgetProps, environment: WidgetEnvironment<{ mode?: string }>) => {
  'widget';
  const FILL = 9999;
  const family = environment.widgetFamily;
  const rounded = (size: number, weight: 'bold' | 'heavy' | 'black' = 'heavy') => font({ design: 'rounded', size, weight });

  const SAMPLE_COLORS = {
    light: { accent: '#24913C', edge: '#1B6E2E', onAccent: '#FFFFFF', tint: '#E5F2E8', text: '#1B6E2E', surface: '#FFFFFF', surfaceMuted: '#F7F7F7', border: '#E5E5E5', divider: '#ECECEC', ink: '#3C3C3C', inkMuted: '#6B6B6B', streak: '#FF9F1C', streakText: '#F08A00' },
    dark: { accent: '#2EA84A', edge: '#238038', onAccent: '#FFFFFF', tint: '#173726', text: '#77C689', surface: '#17222A', surfaceMuted: '#1D2A33', border: '#2E3D47', divider: '#24323B', ink: '#EEF2F5', inkMuted: '#A3B1BA', streak: '#FF9F1C', streakText: '#F08A00' },
  };
  // The widget gallery shows the widget before Pax has filled it: a sample in Pax's green.
  const props: PrayerWidgetProps = given.colors
    ? given
    : {
        scheme: 'system',
        colors: SAMPLE_COLORS,
        now: {
          when: 'Morning',
          title: 'Morning Offering',
          line: 'O Jesus, through the Immaculate Heart of Mary, I offer you my prayers, works, joys, and sufferings of this day.',
          next: 'Next: The Angelus at noon',
          url: 'paxapp://prayer/morning-offering',
        },
        rosary: { title: 'Glorious Mysteries', detail: 'Today’s Rosary', prayed: false, url: 'paxapp://rosary' },
      };
  const rosary = environment.configuration?.mode === 'rosary';
  const scheme = props.scheme === 'system' ? (environment.colorScheme === 'dark' ? 'dark' : 'light') : props.scheme;
  const c = props.colors[scheme];
  const url = rosary ? props.rosary.url : props.now.url;

  if (family === 'accessoryRectangular') {
    return (
      <VStack alignment="leading" spacing={1} modifiers={[containerBackground('#00000000', 'widget'), frame({ maxWidth: FILL, alignment: 'leading' }), widgetURL(url)]}>
        <Text modifiers={[rounded(11, 'bold'), textCase('uppercase'), lineLimit(1)]}>{rosary ? props.rosary.detail : `Pray now · ${props.now.when}`}</Text>
        <Text modifiers={[rounded(14, 'black'), lineLimit(1)]}>{rosary ? props.rosary.title : props.now.title}</Text>
        <Text modifiers={[rounded(11, 'bold'), lineLimit(1)]}>{rosary ? 'Tap to pray' : props.now.next}</Text>
      </VStack>
    );
  }

  const label = (text: string) => (
    <Text modifiers={[rounded(11, 'black'), kerning(0.6), foregroundStyle(c.text), lineLimit(1)]}>{text}</Text>
  );
  const body = rosary ? (
    <VStack alignment="leading" spacing={0} modifiers={[frame({ maxWidth: FILL, maxHeight: FILL, alignment: 'topLeading' }), padding({ top: 14, leading: 14, trailing: 14, bottom: 18 })]}>
      {label('TODAY’S ROSARY')}
      <Spacer />
      <Text modifiers={[rounded(19, 'black'), foregroundStyle(c.ink), lineLimit(2), minimumScaleFactor(0.8)]}>{props.rosary.title}</Text>
      <HStack spacing={5} modifiers={[padding({ top: 8 })]}>
        {[1, 2, 3, 4, 5].map((n) => (
          <ZStack key={n} modifiers={[frame({ width: 12, height: 12 })]}>
            <Circle modifiers={[foregroundStyle(c.accent)]} />
            {props.rosary.prayed ? null : <Circle modifiers={[foregroundStyle(c.surface), frame({ width: 8, height: 8 })]} />}
          </ZStack>
        ))}
      </HStack>
      <Spacer />
      <ZStack modifiers={[frame({ maxWidth: FILL, height: 32 })]}>
        <RoundedRectangle cornerRadius={12} modifiers={[foregroundStyle(c.accent)]} />
        <HStack spacing={3}>
          {props.rosary.prayed ? <Image systemName="checkmark" size={10} color={c.onAccent} /> : null}
          <Text modifiers={[rounded(12, 'black'), kerning(0.6), foregroundStyle(c.onAccent)]}>{props.rosary.prayed ? 'PRAYED' : 'PRAY'}</Text>
        </HStack>
      </ZStack>
    </VStack>
  ) : (
    <VStack alignment="leading" spacing={0} modifiers={[frame({ maxWidth: FILL, maxHeight: FILL, alignment: 'topLeading' }), padding({ top: 14, leading: 14, trailing: 14, bottom: 18 })]}>
      <HStack>
        {label('PRAY NOW')}
        <Spacer />
        <Text modifiers={[rounded(11, 'heavy'), foregroundStyle(c.inkMuted)]}>{props.now.when}</Text>
      </HStack>
      <Spacer />
      <Text modifiers={[rounded(17, 'black'), foregroundStyle(c.ink), lineLimit(2), minimumScaleFactor(0.8)]}>{props.now.title}</Text>
      <Text modifiers={[font({ design: 'serif', size: 12 }), foregroundStyle(c.inkMuted), lineLimit(2), padding({ top: 4 })]}>{props.now.line}</Text>
      <Spacer />
      <Text modifiers={[rounded(11, 'heavy'), foregroundStyle(c.inkMuted), lineLimit(1), minimumScaleFactor(0.8)]}>{props.now.next}</Text>
    </VStack>
  );
  return (
    <ZStack alignment="bottom" modifiers={[containerBackground(c.surface, 'widget'), widgetURL(url)]}>
      {body}
      <Rectangle modifiers={[foregroundStyle(c.border), frame({ height: 4 })]} />
    </ZStack>
  );
};

const PaxWord = (given: WordWidgetProps, environment: WidgetEnvironment) => {
  'widget';
  const FILL = 9999;
  const rounded = (size: number, weight: 'bold' | 'heavy' | 'black' = 'heavy') => font({ design: 'rounded', size, weight });

  const SAMPLE_COLORS = {
    light: { accent: '#24913C', edge: '#1B6E2E', onAccent: '#FFFFFF', tint: '#E5F2E8', text: '#1B6E2E', surface: '#FFFFFF', surfaceMuted: '#F7F7F7', border: '#E5E5E5', divider: '#ECECEC', ink: '#3C3C3C', inkMuted: '#6B6B6B', streak: '#FF9F1C', streakText: '#F08A00' },
    dark: { accent: '#2EA84A', edge: '#238038', onAccent: '#FFFFFF', tint: '#173726', text: '#77C689', surface: '#17222A', surfaceMuted: '#1D2A33', border: '#2E3D47', divider: '#24323B', ink: '#EEF2F5', inkMuted: '#A3B1BA', streak: '#FF9F1C', streakText: '#F08A00' },
  };
  // The widget gallery shows the widget before Pax has filled it: a sample in Pax's green.
  const props: WordWidgetProps = given.colors
    ? given
    : {
        scheme: 'system',
        colors: SAMPLE_COLORS,
        label: 'A verse for today',
        text: 'Thy word is a lamp to my feet, and a light to my paths.',
        source: 'Psalm 118:105 · Douay-Rheims',
        url: 'paxapp://today',
      };
  const scheme = props.scheme === 'system' ? (environment.colorScheme === 'dark' ? 'dark' : 'light') : props.scheme;
  const c = props.colors[scheme];
  return (
    <ZStack alignment="bottom" modifiers={[containerBackground(c.surface, 'widget'), widgetURL(props.url)]}>
      <VStack alignment="leading" spacing={0} modifiers={[frame({ maxWidth: FILL, maxHeight: FILL, alignment: 'topLeading' }), padding({ top: 14, leading: 16, trailing: 16, bottom: 18 })]}>
        <Text modifiers={[rounded(11, 'black'), kerning(0.6), textCase('uppercase'), foregroundStyle(c.text), lineLimit(1)]}>{props.label}</Text>
        <Spacer />
        <Text modifiers={[font({ design: 'serif', size: 17 }), foregroundStyle(c.ink), lineLimit(4), minimumScaleFactor(0.75)]}>{props.text}</Text>
        <Spacer />
        <Text modifiers={[rounded(11, 'bold'), foregroundStyle(c.inkMuted), lineLimit(1), minimumScaleFactor(0.8)]}>{props.source}</Text>
      </VStack>
      <Rectangle modifiers={[foregroundStyle(c.border), frame({ height: 4 })]} />
    </ZStack>
  );
};

const PaxWeek = (given: WeekWidgetProps, environment: WidgetEnvironment) => {
  'widget';
  const FILL = 9999;
  const rounded = (size: number, weight: 'bold' | 'heavy' | 'black' = 'heavy') => font({ design: 'rounded', size, weight });

  const SAMPLE_COLORS = {
    light: { accent: '#24913C', edge: '#1B6E2E', onAccent: '#FFFFFF', tint: '#E5F2E8', text: '#1B6E2E', surface: '#FFFFFF', surfaceMuted: '#F7F7F7', border: '#E5E5E5', divider: '#ECECEC', ink: '#3C3C3C', inkMuted: '#6B6B6B', streak: '#FF9F1C', streakText: '#F08A00' },
    dark: { accent: '#2EA84A', edge: '#238038', onAccent: '#FFFFFF', tint: '#173726', text: '#77C689', surface: '#17222A', surfaceMuted: '#1D2A33', border: '#2E3D47', divider: '#24323B', ink: '#EEF2F5', inkMuted: '#A3B1BA', streak: '#FF9F1C', streakText: '#F08A00' },
  };
  // The widget gallery shows the widget before Pax has filled it: this week, in Pax's green.
  const today = environment.date ?? new Date();
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7));
  const props: WeekWidgetProps = given.colors
    ? given
    : {
        scheme: 'system',
        colors: SAMPLE_COLORS,
        header: 'ORDINARY TIME',
        streak: 7,
        days: ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((letter, i) => {
          const day = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
          const offset = i - ((today.getDay() + 6) % 7);
          return {
            letter,
            day: day.getDate(),
            dot: { light: '#24913C', dark: '#2EA84A' },
            done: offset < 0 ? true : offset === 0 ? false : null,
            today: offset === 0,
          };
        }),
        next: null,
        url: 'paxapp://today',
      };
  const scheme = props.scheme === 'system' ? (environment.colorScheme === 'dark' ? 'dark' : 'light') : props.scheme;
  const c = props.colors[scheme];
  return (
    <ZStack alignment="bottom" modifiers={[containerBackground(c.surface, 'widget'), widgetURL(props.url)]}>
      <VStack alignment="leading" spacing={0} modifiers={[frame({ maxWidth: FILL, maxHeight: FILL, alignment: 'topLeading' }), padding({ top: 14, leading: 14, trailing: 14, bottom: 18 })]}>
        <HStack>
          <Text modifiers={[rounded(11, 'black'), kerning(0.6), foregroundStyle(c.text), lineLimit(1), minimumScaleFactor(0.8)]}>{props.header}</Text>
          <Spacer />
          <HStack spacing={2}>
            <Image systemName="flame.fill" size={13} color={c.streak} />
            <Text modifiers={[rounded(13, 'black'), foregroundStyle(c.streakText)]}>{String(props.streak)}</Text>
          </HStack>
        </HStack>
        <Spacer />
        <HStack spacing={4}>
          {props.days.map((d) => (
            <ZStack key={d.day} modifiers={[frame({ maxWidth: FILL, height: 62 })]}>
              {d.today ? <RoundedRectangle cornerRadius={10} modifiers={[foregroundStyle(c.tint)]} /> : null}
              <VStack spacing={4}>
                <Text modifiers={[rounded(10, 'black'), foregroundStyle(d.today ? c.text : c.inkMuted)]}>{d.letter}</Text>
                <Text modifiers={[rounded(16, 'black'), foregroundStyle(d.today ? c.text : c.ink)]}>{String(d.day)}</Text>
                <ZStack modifiers={[frame({ width: 16, height: 16 })]}>
                  {d.done ? (
                    <Circle modifiers={[foregroundStyle(d.dot[scheme])]} />
                  ) : d.today ? (
                    <Circle modifiers={[foregroundStyle(c.accent)]} />
                  ) : (
                    <Circle modifiers={[foregroundStyle(d.dot[scheme]), frame({ width: 10, height: 10 })]} />
                  )}
                  {d.done ? <Image systemName="checkmark" size={8} color="#FFFFFF" /> : null}
                  {d.today && !d.done ? <Circle modifiers={[foregroundStyle(c.tint), frame({ width: 10, height: 10 })]} /> : null}
                </ZStack>
              </VStack>
            </ZStack>
          ))}
        </HStack>
        <Spacer />
        {props.next ? (
          <HStack spacing={6}>
            <Circle modifiers={[foregroundStyle('#F2B705'), frame({ width: 8, height: 8 })]} />
            <Text modifiers={[rounded(12, 'heavy'), foregroundStyle(c.inkMuted), lineLimit(1), minimumScaleFactor(0.8)]}>{props.next}</Text>
          </HStack>
        ) : null}
      </VStack>
      <Rectangle modifiers={[foregroundStyle(c.border), frame({ height: 4 })]} />
    </ZStack>
  );
};

export const PaxTodayWidget = createWidget('PaxToday', PaxToday);
export const PaxPrayerWidget = createWidget<PrayerWidgetProps, { mode?: string }>('PaxPrayer', PaxPrayer);
export const PaxWordWidget = createWidget('PaxWord', PaxWord);
export const PaxWeekWidget = createWidget('PaxWeek', PaxWeek);
