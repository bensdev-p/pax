import { describe, expect, it } from 'vitest';

import { mix } from '../src/color';
import { resolveTheme, tokens } from '../src/index';

describe('tokens', () => {
  it('keeps the SPEC accent and raised edge for every liturgical color', () => {
    expect(tokens.palettes.green.light).toMatchObject({ accent: '#24913C', edge: '#1B6E2E' });
    expect(tokens.palettes.violet.light).toMatchObject({ accent: '#7C4DDB', edge: '#5E3AA6' });
    expect(tokens.palettes.rose.light).toMatchObject({ accent: '#C2185B', edge: '#931245' });
    expect(tokens.palettes.white.light).toMatchObject({ accent: '#F2B705', onAccent: '#3B2A00' });
    expect(tokens.palettes.red.light).toMatchObject({ accent: '#D12F33', edge: '#9F2427' });
    expect(tokens.palettes.black.light).toMatchObject({ accent: '#3C3C3C', edge: '#1F1F1F' });
  });

  it('derives the tint 88% toward white, matching the canvas', () => {
    expect(tokens.palettes.violet.light.tint).toBe('#EFEAFB');
    expect(tokens.palettes.red.light.tint).toBe('#F9E6E7');
    expect(mix('#000000', '#FFFFFF', 0.5)).toBe('#808080');
  });
});

describe('resolveTheme', () => {
  it('follows the liturgical color by default, in light mode', () => {
    const t = resolveTheme({ liturgicalColor: 'red' });
    expect(t.palette).toBe('red');
    expect(t.scheme).toBe('light');
    expect(t.locked).toBe(false);
    expect(t.accent.accent).toBe('#D12F33');
    expect(t.neutral.background).toBe('#FFFFFF');
  });

  it('a locked palette wins over the day', () => {
    const t = resolveTheme({ liturgicalColor: 'violet', lockedColor: 'green' });
    expect(t.palette).toBe('green');
    expect(t.locked).toBe(true);
  });

  it('dark appearance swaps neutrals and accent variant', () => {
    const t = resolveTheme({ liturgicalColor: 'violet', appearance: 'dark' });
    expect(t.scheme).toBe('dark');
    expect(t.neutral.background).toBe(tokens.neutral.dark.background);
    expect(t.accent.accent).toBe('#8E5CF6');
  });

  it('system appearance follows the phone', () => {
    expect(resolveTheme({ liturgicalColor: 'green', appearance: 'system', systemScheme: 'dark' }).scheme).toBe('dark');
    expect(resolveTheme({ liturgicalColor: 'green', appearance: 'system', systemScheme: null }).scheme).toBe('light');
  });

  it('unknown colors fall back to green', () => {
    expect(resolveTheme({ liturgicalColor: 'gold' }).palette).toBe('green');
  });
});
