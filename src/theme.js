// Theme preference. Absent means "follow the system"; the toggle writes an
// explicit override. Kept in localStorage — a display preference outliving the
// tab is expected, unlike the tasks themselves.
export const THEME_KEY = 'todo-app:theme';

export const isTheme = (v) => v === 'light' || v === 'dark';

export const nextTheme = (theme) => (theme === 'dark' ? 'light' : 'dark');

export const resolveTheme = (stored, prefersDark) =>
  (isTheme(stored) ? stored : (prefersDark ? 'dark' : 'light'));

export function readTheme(storage = globalThis.localStorage) {
  try {
    const v = storage?.getItem(THEME_KEY);
    return isTheme(v) ? v : null;
  } catch {
    return null;
  }
}

export function writeTheme(theme, storage = globalThis.localStorage) {
  if (!isTheme(theme)) return false;
  try {
    storage?.setItem(THEME_KEY, theme);
    return true;
  } catch {
    return false; // private mode: the toggle still works for this page load
  }
}
