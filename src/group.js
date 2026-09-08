// Groups the visible tasks under date separators.
//
// Past days collapse into a single "Overdue" bucket — mixing them is the point,
// you want them all in front of you — while future days each keep their own
// heading. Undated tasks sink to the bottom.
import { isISODate, dayDiff, formatDue, toISODate } from './dates.js';

const NO_DATE = Number.MAX_SAFE_INTEGER;

function bucket(due, todayIso) {
  if (!isISODate(due)) return { key: 'none', order: NO_DATE, label: 'No date' };

  const diff = dayDiff(due, todayIso);
  if (diff < 0) return { key: 'overdue', order: -1, label: 'Overdue' };
  if (diff === 0) return { key: 'today', order: 0, label: 'Today' };
  if (diff === 1) return { key: 'tomorrow', order: 1, label: 'Tomorrow' };
  return { key: due, order: diff, label: formatDue(due, todayIso) };
}

export function groupByDate(tasks, todayIso = toISODate()) {
  const groups = new Map();

  for (const task of tasks) {
    const { key, order, label } = bucket(task.due, todayIso);
    if (!groups.has(key)) groups.set(key, { key, label, order, tasks: [] });
    groups.get(key).tasks.push(task);
  }

  const ordered = [...groups.values()].sort((a, b) => a.order - b.order);
  for (const group of ordered) {
    // Oldest first inside a bucket; creation order breaks ties.
    group.tasks.sort((a, b) =>
      String(a.due ?? '').localeCompare(String(b.due ?? '')) || a.createdAt - b.createdAt);
  }
  return ordered;
}
