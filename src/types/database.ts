export type ThemeMode = 'system' | 'light' | 'dark';
export type DisplayUnit = 'ml' | 'l';

export interface WaterLog {
  id: string;
  amount_ml: number;
  consumed_at: string; // ISO 8601 UTC string
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  daily_goal_ml: number;
  reminder_interval_minutes: number;
  reminder_start_time: string; // "HH:MM" 24h
  reminder_end_time: string;   // "HH:MM" 24h
  active_days: number[];       // 1 (Mon) - 7 (Sun)
  reminders_enabled: boolean;
  theme_mode: ThemeMode;
  preferred_display_unit: DisplayUnit;
}

export const DEFAULT_SETTINGS: UserSettings = {
  daily_goal_ml: 2500,
  reminder_interval_minutes: 60,
  reminder_start_time: '09:00',
  reminder_end_time: '21:00',
  active_days: [1, 2, 3, 4, 5, 6, 7],
  reminders_enabled: true,
  theme_mode: 'system',
  preferred_display_unit: 'ml',
};

export interface ValidationResult<T> {
  isValid: boolean;
  error?: string;
  value?: T;
}

export function validateWaterAmount(amount: unknown): ValidationResult<number> {
  if (amount === undefined || amount === null || amount === '') {
    return { isValid: false, error: 'Please enter an intake amount.' };
  }

  const num = typeof amount === 'number' ? amount : Number(amount);

  if (isNaN(num)) {
    return { isValid: false, error: 'Amount must be a valid number.' };
  }

  if (!Number.isInteger(num)) {
    return { isValid: false, error: 'Amount must be a whole number in millilitres.' };
  }

  if (num <= 0) {
    return { isValid: false, error: 'Amount must be greater than 0 ml.' };
  }

  if (num > 5000) {
    return { isValid: false, error: 'Maximum single intake is 5,000 ml (5 litres).' };
  }

  return { isValid: true, value: num };
}

export function validateDailyGoal(goal: unknown): ValidationResult<number> {
  const result = validateWaterAmount(goal);
  if (!result.isValid) return result;
  if (result.value! < 500) {
    return { isValid: false, error: 'Daily goal must be at least 500 ml.' };
  }
  if (result.value! > 10000) {
    return { isValid: false, error: 'Daily goal cannot exceed 10,000 ml.' };
  }
  return result;
}
