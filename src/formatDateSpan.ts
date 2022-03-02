import { formatDate } from './formatDate';

export function formatDateSpan(lang: string, text: string) {
  const [from, to] = text.split(/\s*-\s*/, 2);

  return `${formatDate(lang, from)} – ${formatDate(lang, to)}`;
}
