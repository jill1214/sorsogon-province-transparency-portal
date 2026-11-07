/**
 * Encode a CSV field for spreadsheet consumers.
 *
 * The API supplies text values; quoting commas is not enough when a cell starts
 * with a spreadsheet formula marker. Prefix risky text with an apostrophe so
 * spreadsheet software treats it as data. Keep numeric budget amounts numeric.
 */
export function csvCell(value: string | number | null | undefined): string {
  if (value == null) return '';
  if (typeof value === 'number') return String(value);

  // Also catch leading whitespace before formula characters and tab/newline
  // prefixes, which spreadsheet applications can treat specially.
  const unsafe = /^(?:\s*[=+\-@]|[\t\r\n])/.test(value);
  const safe = unsafe ? `'${value}` : value;
  return unsafe || /[",\r\n]/.test(safe)
    ? `"${safe.replace(/"/g, '""')}"`
    : safe;
}
