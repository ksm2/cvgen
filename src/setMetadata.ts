import { CV } from './interfaces';
import { translate } from './utils';

/**
 * Sets PDF metadata from the CV.
 */
export function setMetadata(cv: CV, doc: PDFKit.PDFDocument): void {
  doc.info.Author = cv.fullName;
  doc.info.Title = translate(cv.lang, 'résumé of {}').replace('{}', cv.fullName);
  doc.info.Keywords = 'résumé, cv, info';
  doc.info.CreationDate = new Date();
  doc.info.ModDate = new Date();
  doc.info.Producer = 'https://github.com/ksm2/cvgen';
  doc.info.Creator = 'https://github.com/ksm2/cvgen';
}
