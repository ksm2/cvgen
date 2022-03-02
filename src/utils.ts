export function formatDateSpan(lang: string, text: string) {
  const [from, to] = text.split(/\s*-\s*/, 2);

  return `${formatDate(lang, from)} – ${formatDate(lang, to)}`;
}

export function formatDate(lang: string, text: string): string {
  return match([
    [empty(), () => ''],
    [equals('today'), (text) => translate(lang, text)],
    [regexp(/^(\d{4})\/(\d{2})$/), (year, month) => formatYearMonth(lang, +year, +month)],
    [regexp(/^(\d{4})$/), (year) => year],
    throws(new TypeError(`Cannot format date "${text}"`)),
  ])(text);
}

export function formatYearMonth(lang: string, year: number, month: number): string {
  const formatter = new Intl.DateTimeFormat(lang, { month: 'short', year: 'numeric' });
  return formatter.format(new Date(year, month - 1, 1, 0, 0, 0, 0));
}

export function translate(lang: string, text: string): string {
  const i18n = require(`../i18n/${lang.substring(0, 2)}.json`);
  return i18n[text.toLowerCase()] || text;
}

export function capitalize(text: string): string {
  return text ? text[0].toUpperCase() + text.substring(1) : '';
}

export function labelPhone(number: string) {
  const { groups = {} } = /^(?<country>\+\d+)-(?<code>\d+)-(?<number>\d+)$/.exec(number)!;
  return `${groups.country} (0)${groups.code} ${groups.number}`;
}

function match<T>(cases: [...Case<T, any>[], CaseValue<T, []>]): (value: string) => T {
  return function matchExec(text: string): T {
    const cs = cases.slice(0, -1) as Case<T, any>[];
    for (const [cond, value] of cs) {
      const match = cond(text);
      if (match !== null) {
        return value(...match);
      }
    }
    const fallback = cases[cases.length - 1] as CaseValue<T, []>;
    return fallback();
  };
}

function empty(): CaseCondition<[]> {
  return function emptyCase(text) {
    return text ? null : [];
  };
}

function equals(str: string): CaseCondition<[string]> {
  return function equalsCase(text) {
    return text === str ? [text] : null;
  };
}

function regexp(re: RegExp): CaseCondition<string[]> {
  return function regexpCase(text) {
    const match = re.exec(text);
    return match ? match.slice(1) : null;
  };
}

function throws(error: Error): CaseValue<any, any> {
  return function throwsCase() {
    throw error;
  };
}

type Case<T, U extends any[]> = [CaseCondition<U>, CaseValue<T, U>];
type CaseCondition<U> = (text: string) => U | null;
type CaseValue<T, U extends any[]> = (...matches: U) => T;
