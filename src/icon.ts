import * as fs from 'fs';
import * as path from 'path';

export function icon(name: string): string {
  const iconPath = path.resolve(__dirname, `../icons/glyphicons-basic-${name}.svg`);
  const xml = fs.readFileSync(iconPath, 'utf8');

  const match = xml.match(/\bd="([^"]+)"/);

  return match[1];
}
