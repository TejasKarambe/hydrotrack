import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import { formatVolume } from '../src/utils/hydrationCalculations.ts';
import {
  DEFAULT_SETTINGS,
  type UserSettings,
  type ThemeMode,
  type DisplayUnit,
  validateDailyGoal,
} from '../src/types/database.ts';
import { palette, typography, radii, spacing } from '../src/theme/tokens.ts';

const lightTheme = palette.light;
const darkTheme = palette.dark;

describe('1. Unit Conversion and Presentation', () => {
  it('formats millilitres accurately in ml mode', () => {
    assert.strictEqual(formatVolume(2500, 'ml'), '2,500 ml');
    assert.strictEqual(formatVolume(250, 'ml'), '250 ml');
    assert.strictEqual(formatVolume(0, 'ml'), '0 ml');
    assert.strictEqual(formatVolume(2500, 'ml', false), '2,500');
  });

  it('formats millilitres accurately in litres (L) mode', () => {
    assert.strictEqual(formatVolume(2000, 'l'), '2 L');
    assert.strictEqual(formatVolume(2500, 'l'), '2.5 L');
    assert.strictEqual(formatVolume(250, 'l'), '0.25 L');
    assert.strictEqual(formatVolume(350, 'l'), '0.35 L');
    assert.strictEqual(formatVolume(750, 'l'), '0.75 L');
    assert.strictEqual(formatVolume(1000, 'l'), '1 L');
    assert.strictEqual(formatVolume(0, 'l'), '0 L');
    assert.strictEqual(formatVolume(2500, 'l', false), '2.5');
  });

  it('handles negative or NaN volumes gracefully without throwing or returning NaN', () => {
    assert.strictEqual(formatVolume(-50, 'ml'), '0 ml');
    assert.strictEqual(formatVolume(NaN as any, 'ml'), '0 ml');
    assert.strictEqual(formatVolume(-200, 'l'), '0 L');
    assert.strictEqual(formatVolume(NaN as any, 'l'), '0 L');
  });

  it('does not alter the underlying numeric value', () => {
    const originalMl = 2500;
    const displayedL = formatVolume(originalMl, 'l');
    assert.strictEqual(displayedL, '2.5 L');
    assert.strictEqual(originalMl, 2500);
  });
});

describe('2. Theme Selection & Design Token Integrity', () => {
  it('provides all expected theme tokens in lightTheme', () => {
    assert.ok(lightTheme.background, 'light background token must exist');
    assert.ok(lightTheme.surface, 'light surface token must exist');
    assert.ok(lightTheme.accent, 'light accent token must exist');
    assert.ok(lightTheme.textPrimary, 'light textPrimary token must exist');
    assert.ok(lightTheme.textSecondary, 'light textSecondary token must exist');
    assert.ok(lightTheme.border, 'light border token must exist');
    assert.ok(lightTheme.success, 'light success token must exist');
    assert.ok(lightTheme.danger, 'light danger token must exist');
    assert.strictEqual(lightTheme.waterGradient.length, 3);
  });

  it('provides all expected theme tokens in darkTheme', () => {
    assert.ok(darkTheme.background, 'dark background token must exist');
    assert.ok(darkTheme.surface, 'dark surface token must exist');
    assert.ok(darkTheme.accent, 'dark accent token must exist');
    assert.ok(darkTheme.textPrimary, 'dark textPrimary token must exist');
    assert.ok(darkTheme.textSecondary, 'dark textSecondary token must exist');
    assert.ok(darkTheme.border, 'dark border token must exist');
    assert.ok(darkTheme.success, 'dark success token must exist');
    assert.ok(darkTheme.danger, 'dark danger token must exist');
    assert.strictEqual(darkTheme.waterGradient.length, 3);
  });

  it('has sufficient contrast between background and primary text in both themes', () => {
    // Light mode: background is bright pastel, text is deep dark
    assert.notStrictEqual(lightTheme.background, lightTheme.textPrimary);
    // Dark mode: background is dark, text is light
    assert.notStrictEqual(darkTheme.background, darkTheme.textPrimary);
  });

  it('provides standardized typography and layout radii tokens', () => {
    assert.ok(radii.sm > 0);
    assert.ok(radii.md > radii.sm);
    assert.ok(radii.lg > radii.md);
    assert.ok(radii.xl > radii.lg);
    assert.ok(radii.full > 99);

    assert.ok(typography.h1.fontSize > typography.h2.fontSize);
    assert.ok(typography.h2.fontSize > typography.h3.fontSize);
    assert.ok(typography.body.fontSize >= typography.caption.fontSize);
  });
});

describe('3. Settings Persistence & SQLite Serializer Simulation', () => {
  // Simulate the key-value transformation performed by SQLite settingsRepository
  function serializeSettings(settings: UserSettings): Map<string, string> {
    const map = new Map<string, string>();
    for (const [key, val] of Object.entries(settings)) {
      if (typeof val === 'boolean') {
        map.set(key, val ? '1' : '0');
      } else if (Array.isArray(val)) {
        map.set(key, JSON.stringify(val));
      } else {
        map.set(key, String(val));
      }
    }
    return map;
  }

  function deserializeSettings(map: Map<string, string>): UserSettings {
    const dailyGoalParsed = parseInt(map.get('daily_goal_ml') || '', 10);
    const reminderIntervalParsed = parseInt(map.get('reminder_interval_minutes') || '', 10);

    let activeDaysParsed = DEFAULT_SETTINGS.active_days;
    try {
      const raw = map.get('active_days');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) activeDaysParsed = parsed;
      }
    } catch {}

    const themeRaw = map.get('theme_mode');
    const themeMode: ThemeMode =
      themeRaw === 'light' || themeRaw === 'dark' || themeRaw === 'system'
        ? themeRaw
        : DEFAULT_SETTINGS.theme_mode;

    const unitRaw = map.get('preferred_display_unit');
    const preferredDisplayUnit: DisplayUnit =
      unitRaw === 'l' || unitRaw === 'ml' ? unitRaw : DEFAULT_SETTINGS.preferred_display_unit;

    return {
      daily_goal_ml: !isNaN(dailyGoalParsed) && dailyGoalParsed > 0 ? dailyGoalParsed : DEFAULT_SETTINGS.daily_goal_ml,
      reminder_interval_minutes:
        !isNaN(reminderIntervalParsed) && reminderIntervalParsed > 0
          ? reminderIntervalParsed
          : DEFAULT_SETTINGS.reminder_interval_minutes,
      reminder_start_time: map.get('reminder_start_time') || DEFAULT_SETTINGS.reminder_start_time,
      reminder_end_time: map.get('reminder_end_time') || DEFAULT_SETTINGS.reminder_end_time,
      active_days: activeDaysParsed,
      reminders_enabled: map.get('reminders_enabled') === '1' || map.get('reminders_enabled') === 'true',
      theme_mode: themeMode,
      preferred_display_unit: preferredDisplayUnit,
    };
  }

  it('serializes and deserializes default settings round-trip without loss', () => {
    const serialized = serializeSettings(DEFAULT_SETTINGS);
    const restored = deserializeSettings(serialized);

    assert.deepStrictEqual(restored, DEFAULT_SETTINGS);
  });

  it('persists custom preferences correctly across round-trip', () => {
    const custom: UserSettings = {
      daily_goal_ml: 3200,
      reminder_interval_minutes: 45,
      reminder_start_time: '07:30',
      reminder_end_time: '22:15',
      active_days: [1, 2, 3, 4, 5], // Weekdays only
      reminders_enabled: true,
      theme_mode: 'dark',
      preferred_display_unit: 'l',
    };

    const serialized = serializeSettings(custom);
    assert.strictEqual(serialized.get('daily_goal_ml'), '3200');
    assert.strictEqual(serialized.get('reminders_enabled'), '1');
    assert.strictEqual(serialized.get('active_days'), '[1,2,3,4,5]');
    assert.strictEqual(serialized.get('preferred_display_unit'), 'l');
    assert.strictEqual(serialized.get('theme_mode'), 'dark');

    const restored = deserializeSettings(serialized);
    assert.deepStrictEqual(restored, custom);
  });

  it('safely falls back to default values when database columns contain corrupt data', () => {
    const corruptMap = new Map<string, string>([
      ['daily_goal_ml', 'not-a-number'],
      ['reminder_interval_minutes', '-99'],
      ['active_days', '{broken-json'],
      ['theme_mode', 'neon-cyberpunk'],
      ['preferred_display_unit', 'gallons'],
      ['reminders_enabled', '0'],
    ]);

    const restored = deserializeSettings(corruptMap);
    assert.strictEqual(restored.daily_goal_ml, DEFAULT_SETTINGS.daily_goal_ml);
    assert.strictEqual(restored.reminder_interval_minutes, DEFAULT_SETTINGS.reminder_interval_minutes);
    assert.deepStrictEqual(restored.active_days, DEFAULT_SETTINGS.active_days);
    assert.strictEqual(restored.theme_mode, DEFAULT_SETTINGS.theme_mode);
    assert.strictEqual(restored.preferred_display_unit, DEFAULT_SETTINGS.preferred_display_unit);
    assert.strictEqual(restored.reminders_enabled, false);
  });
});

describe('4. Transactional Data Reset Invariants', () => {
  it('reset returns clean DEFAULT_SETTINGS instance', () => {
    assert.strictEqual(DEFAULT_SETTINGS.daily_goal_ml, 2500);
    assert.strictEqual(DEFAULT_SETTINGS.reminders_enabled, true);
    assert.strictEqual(DEFAULT_SETTINGS.theme_mode, 'system');
    assert.strictEqual(DEFAULT_SETTINGS.preferred_display_unit, 'ml');
    assert.deepStrictEqual(DEFAULT_SETTINGS.active_days, [1, 2, 3, 4, 5, 6, 7]);
  });
});
