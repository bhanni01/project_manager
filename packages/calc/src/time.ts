/**
 * Revised completion date = latest EoT date, or intended completion when no
 * EoT has been recorded yet. CLAUDE.md §6.
 */
export function totalRevisedCompletionDate(args: {
  intendedCompletionDate: Date;
  latestEoTDate?: Date | null;
}): Date {
  return args.latestEoTDate ?? args.intendedCompletionDate;
}

/**
 * Whole-day delta between intended and revised completion. Zero when no EoT
 * exists. Rounded to the nearest day.
 */
export function totalEoTDays(args: {
  intendedCompletionDate: Date;
  latestEoTDate?: Date | null;
}): number {
  if (!args.latestEoTDate) return 0;
  const ms = args.latestEoTDate.getTime() - args.intendedCompletionDate.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}
