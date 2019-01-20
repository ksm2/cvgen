export function translate(lang: string, text: string): string {
  const i18n = require('../i18n/' + lang.substring(0, 2) + '.json');
  return i18n[text.toLowerCase()] || text;
}
