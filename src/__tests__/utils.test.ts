import { capitalize, formatDate, formatDateSpan } from '../utils';

describe('utils', () => {
  test('formatDateSpan', () => {
    expect(formatDateSpan('en-GB', '2018/02 - 2019/11')).toBe('Feb 2018 – Nov 2019');
    expect(formatDateSpan('de-DE', '2018/02 - 2019/11')).toBe('Feb. 2018 – Nov. 2019');
  });

  test('formatDate', () => {
    expect(formatDate('en-GB', '2020/01')).toBe('Jan 2020');
    expect(formatDate('en-GB', '2021/03')).toBe('Mar 2021');
    expect(formatDate('en-GB', '2022/09')).toBe('Sept 2022');
    expect(formatDate('de-DE', '2020/01')).toBe('Jan. 2020');
    expect(formatDate('de-DE', '2021/03')).toBe('März 2021');
    expect(formatDate('de-DE', '2022/09')).toBe('Sept. 2022');
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
