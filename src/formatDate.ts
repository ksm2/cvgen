import { translate } from './translate';

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
