export function formatDateSpan(lang: string, text: string) {
  const [from, to] = text.split(/\s*-\s*/, 2);

  return `${formatDate(lang, from)} – ${formatDate(lang, to)}`;
}

export function formatDate(lang: string, text: string): string {
  if (!text) {
    return '';
  }

  if (text === 'today') {
    return translate(lang, text);
  }

  if (text.match(/(\d{4})\/(\d{2})/)) {
    const formatter = new Intl.DateTimeFormat(lang, { month: 'short', year: 'numeric' });
    return formatter.format(new Date(+RegExp.$1, +RegExp.$2 - 1, 1, 0, 0, 0, 0));
  }

  if (text.match(/(\d{4})/)) {
    return RegExp.$1;
  }

  throw new TypeError(`Cannot format date "${text}"`);
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
