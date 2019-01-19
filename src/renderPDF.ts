import path from 'path'
import PDFDocument from 'pdfkit'
import { Writable } from 'stream'
import { CV, Kind, Node } from './interfaces'
import { translate } from './translate'

const MM_TO_PT = 2.83465

function labelPhone(number: string) {
  const { groups = {} } = /^(?<country>\+\d+)-(?<code>\d+)-(?<number>\d+)$/.exec(number)!
  return `${groups.country} (0)${groups.code} ${groups.number}`
}

function text(doc: PDFKit.PDFDocument, file: string, size: number, text = '', options: PDFKit.Mixins.TextOptions = { underline: false, continued: false }) {
  return doc.font(file).fillColor('black').fontSize(size).text(text.replace(/\s+/g, ' '), options)
}

function fontBold(doc: PDFKit.PDFDocument, str: string, options: PDFKit.Mixins.TextOptions = { underline: false, continued: false }) {
  return text(doc, 'fonts/SourceSansPro-Semibold.ttf', 12, str, options)
}

function fontItalic(doc: PDFKit.PDFDocument, str: string, options: PDFKit.Mixins.TextOptions = { underline: false, continued: false }) {
  return text(doc, 'fonts/SourceSansPro-It.ttf', 12, str, options)
}

function fontRegular(doc: PDFKit.PDFDocument, str: string, options: PDFKit.Mixins.TextOptions = { underline: false, continued: false }) {
  return text(doc, 'fonts/SourceSansPro-Regular.ttf', 12, str, options)
}

function capitalize(text: string): string {
  if (text)
    return text[0].toUpperCase() + text.substr(1)

  return ''
}

function renderHeading(doc: PDFKit.PDFDocument, lang: string, text: string): void {
  doc.font('fonts/ScopeOne-Regular.ttf')
    .fillColor('#6799cc')
    .fontSize(16)

  const label = capitalize(translate(lang, text))
  doc
    .moveDown(0.5)
    .text(label)

  const w = doc.heightOfString(label) / 2
  doc
    .strokeColor('#6799cc')
    .lineWidth(1)
    .moveTo(doc.x + doc.widthOfString(label) + 10, doc.y - w)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y - w)
    .stroke()
}

function formatDate(lang: string, text: string) {
  if (!text) {
    return ''
  }

  if (text === 'today') {
    return translate(lang, text)
  }

  if (text.match(/(\d{4})\/(\d{2})/)) {
    const formatter = new Intl.DateTimeFormat(lang, { month: 'short', year: 'numeric' })
    return formatter.format(new Date(+RegExp.$1, +RegExp.$2 - 1, 1, 0, 0, 0, 0))
  }

  if (text.match(/(\d{4})/)) {
    return RegExp.$1
  }

  throw new TypeError(`Cannot format date "${text}"`)
}

function formatDateSpan(lang: string, text: string) {
  const [from, to] = text.split(/\s*-\s*/, 2)

  return `${formatDate(lang, from)} – ${formatDate(lang, to)}`
}

function formatSectionTitle(lang: string, text: string) {
  if (text.match(/\s*-\s*/)) {
    try {
      return formatDateSpan(lang, text)
    } catch (e) {
    }
  }

  try {
    return formatDate(lang, text)
  } catch (e) {
    return capitalize(translate(lang, text))
  }
}

function renderSectionTitle(doc: PDFKit.PDFDocument, lang: string, text: string): void {
  doc.font('fonts/SourceSansPro-Semibold.ttf')
    .fillColor('black')
    .fontSize(12)
    .moveDown(0.5)
    .text(formatSectionTitle(lang, text))
    .moveUp(1)
}

function renderParagraph(doc: PDFKit.PDFDocument, node: Node): void {
  const x = doc.x
  for (const [index, child] of node.children.entries()) {
    const continued = index < node.children.length - 1
    switch (child.type) {
      case Kind.Strong: {
        fontBold(doc, child.children[0].value, { underline: false, continued })
        break
      }
      case Kind.Emphasis: {
        fontItalic(doc, child.children[0].value, { underline: false, continued })
        break
      }
      case Kind.Link: {
        const label = child.children[0].value
        doc.font('fonts/SourceSansPro-Regular.ttf')
          .fillColor('#6799cc')
          .fontSize(12)
          .text(label, { continued, link: child.url, underline: true })
        break
      }
      case Kind.Str: {
        fontRegular(doc, child.value, { underline: false, continued })
        break
      }
      default: {
        throw new TypeError('Cannot format text: ' + child.type)
      }
    }
  }
}

function renderList(doc: PDFKit.PDFDocument, node: Node): void {
  for (const child of node.children) {
    doc.ellipse(doc.x + 3, doc.y + 8, 2, 2).fill('black')
    doc.x += 15
    child.children.forEach(subchild => renderSubchild(doc, subchild))
    doc.x -= 15
  }
}

function renderSubchild(doc: PDFKit.PDFDocument, child: Node) {
  switch (child.type) {
    case Kind.Paragraph: {
      renderParagraph(doc, child)
      return
    }
    case Kind.List: {
      renderList(doc, child)
      return
    }
    default: {
      throw new TypeError(`${child.loc.start.line}:${child.loc.start.column}, Cannot render ${child.type}`)
    }
  }
}

function renderChild(doc: PDFKit.PDFDocument, lang: string, child: Node): void {
  switch (child.type) {
    case Kind.Header:
      if (child.depth === 1) {
        renderHeading(doc, lang, child.children[0].value)
      } else if (child.depth === 2) {
        renderSectionTitle(doc, lang, child.children[0].value)
      }
      break
    default: {
      const oldX = doc.x
      doc.x = 200
      renderSubchild(doc, child)
      doc.x = oldX
    }
  }
}

function line(doc: PDFKit.PDFDocument, lang: string, key: string, value: string, link?: string) {
  fontBold(doc, capitalize(translate(lang, key)))
    .moveUp(1)
  const x = doc.x
  doc.x = 200

  for (const line of value.split(/\n/g)) {
    fontRegular(doc, line, { underline: false, continued: false, link })
  }

  doc.x = x
  return doc
}

export function renderPDF(cv: CV, stream: Writable) {
  // Create a document
  const margins = { left: 25 * MM_TO_PT, right: 25 * MM_TO_PT, top: 20 * MM_TO_PT, bottom: 20 * MM_TO_PT }
  const doc = new PDFDocument({ size: [210 * MM_TO_PT, 297 * MM_TO_PT], margins })

  doc.pipe(stream)

  const fullName = `${cv.firstName} ${cv.lastName}`
  doc.info.Author = fullName
  doc.info.Title = translate(cv.lang, 'résumé of {}').replace('{}', fullName)
  doc.info.Keywords = 'résumé, cv, info'
  doc.info.CreationDate = new Date()
  doc.info.ModDate = new Date()
  doc.info.Producer = 'https://github.com/ksm2/csvgen'
  doc.info.Creator = 'https://github.com/ksm2/csvgen'

  const y = doc.y
  const x = doc.x
  doc.x = doc.page.width - doc.page.margins.right - 125
  doc.image(path.resolve(path.dirname(cv.filename), cv.picture), {
    fit: [125, 125],
    align: 'right'
  } as any)
  doc.x = x

  const nextY = 210

  doc.y = y
  const formatter = new Intl.DateTimeFormat(cv.lang, { day: '2-digit', month: '2-digit', year: 'numeric' })

  doc.font('fonts/ScopeOne-Regular.ttf')
    .fillColor('#6799cc')
    .fontSize(18)
    .text(fullName)

  if (cv.middleName)
    line(doc, cv.lang, 'complete name', `${cv.firstName} ${cv.middleName} ${cv.lastName}`)
  line(doc, cv.lang, 'birth', `${formatter.format(cv.dateOfBirth)} ${translate(cv.lang, 'in')} ${translate(cv.lang, cv.placeOfBirth)}`)
  line(doc, cv.lang, 'address', cv.address)
  if (cv.citizenship)
    line(doc, cv.lang, 'citizenship', translate(cv.lang, cv.citizenship))

  if (cv.phone)
    line(doc, cv.lang, 'phone', labelPhone(cv.phone), `tel:${cv.phone.replace(/[^\d+]/g, '')}`)
  if (cv.email)
    line(doc, cv.lang, 'email', cv.email, `mailto:${cv.email}`)
  if (cv.github)
    line(doc, cv.lang, 'github', `@${cv.github}`, `https://github.com/${cv.github}`)

  doc.y = nextY
  for (const child of cv.body.children) {
    renderChild(doc, cv.lang, child)
  }

  // Finalize PDF file
  doc.end()
}
