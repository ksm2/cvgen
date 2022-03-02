import { capitalize, formatDate, formatDateSpan, formatYearMonth } from '../utils';

describe('utils', () => {
  test('formatDateSpan', () => {
    expect(formatDateSpan('en-GB', '2018/02 - 2019/11')).toBe('Feb 2018 – Nov 2019');
    expect(formatDateSpan('de-DE', '2018/02 - 2019/11')).toBe('Feb. 2018 – Nov. 2019');
  });

  test('formatDate', () => {
    expect(formatDate('en-GB', '')).toBe('');
    expect(formatDate('en-GB', 'today')).toBe('today');
    expect(formatDate('en-GB', '2020/01')).toBe('Jan 2020');
    expect(formatDate('en-GB', '2021/03')).toBe('Mar 2021');
    expect(formatDate('en-GB', '2022/09')).toBe('Sept 2022');
    expect(formatDate('en-GB', '2022')).toBe('2022');
    expect(() => formatDate('en-GB', 'foo')).toThrow(TypeError);
    expect(formatDate('de-DE', '')).toBe('');
    expect(formatDate('de-DE', 'today')).toBe('heute');
    expect(formatDate('de-DE', '2020/01')).toBe('Jan. 2020');
    expect(formatDate('de-DE', '2021/03')).toBe('März 2021');
    expect(formatDate('de-DE', '2022/09')).toBe('Sept. 2022');
    expect(formatDate('de-DE', '2022')).toBe('2022');
    expect(() => formatDate('de-DE', 'foo')).toThrow(TypeError);
  });

  test('formatYearMonth', () => {
    expect(formatYearMonth('en-GB', 2020, 7)).toBe('Jul 2020');
    expect(formatYearMonth('de-DE', 2020, 7)).toBe('Juli 2020');
  });

  test('capitalize', () => {
    expect(capitalize('')).toBe('');
    expect(capitalize('a')).toBe('A');
    expect(capitalize('A')).toBe('A');
    expect(capitalize('angle')).toBe('Angle');
    expect(capitalize('angle')).toBe('Angle');
    expect(capitalize('ärzte')).toBe('Ärzte');
    expect(capitalize('Ärzte')).toBe('Ärzte');
  });
});
