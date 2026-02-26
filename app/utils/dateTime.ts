const DEFAULT_BUSINESS_TIMEZONE = 'Asia/Bangkok';

const pad2 = (value: number) => String(value).padStart(2, '0');

export const getDateStringInTimezone = (
  date: Date = new Date(),
  timeZone: string = DEFAULT_BUSINESS_TIMEZONE
): string => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  }

  return `${year}-${month}-${day}`;
};

export const getTimeHHmmInTimezone = (
  date: Date = new Date(),
  timeZone: string = DEFAULT_BUSINESS_TIMEZONE
): string => {
  return date.toLocaleTimeString('en-US', {
    timeZone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });
};

export { DEFAULT_BUSINESS_TIMEZONE };
