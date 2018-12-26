export function translate(lang: string, text: string): string {
  const i18n = require('../i18n/' + lang + '.json');
  return i18n[text.toLowerCase()] || text;
}
