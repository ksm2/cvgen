import path from 'path'
import PDFDocument from 'pdfkit'
import { Writable } from 'stream'
import { formatDate } from './formatDate'
import { formatDateSpan } from './formatDateSpan'
import { icon } from './icon'
import { CV, Entry, Kind, Node } from './interfaces'
import { setMetadata } from './setMetadata'
import { translate } from './translate'

const MM_TO_PT = 2.83465
const DEFAULT_COLOR = '#212529'
const DEFAULT_FONTSIZE = 11
const ACCENT_COLOR = '#6ca66c'

let lastTimeline: number | null = null

function labelPhone(number: string) {
  const { groups = {} } = /^(?<country>\+\d+)-(?<code>\d+)-(?<number>\d+)$/.exec(number)!
  return `${groups.country} (0)${groups.code} ${groups.number}`
}

function text(doc: PDFKit.PDFDocument, file: string, size: number, text = '', options: PDFKit.Mixins.TextOptions = { underline: false, continued: false }) {
  return doc.font(file).fillColor(DEFAULT_COLOR).fontSize(size).text(text.replace(/\s+/g, ' '), options)
}

function fontBold(doc: PDFKit.PDFDocument, str: string, options: PDFKit.Mixins.TextOptions = { underline: false, continued: false }) {
  return text(doc, 'fonts/SourceSansPro-Semibold.ttf', DEFAULT_FONTSIZE, str, options)
}

function fontItalic(doc: PDFKit.PDFDocument, str: string, options: PDFKit.Mixins.TextOptions = { underline: false, continued: false }) {
  return text(doc, 'fonts/SourceSansPro-It.ttf', DEFAULT_FONTSIZE, str, options)
}

function fontRegular(doc: PDFKit.PDFDocument, str: string, options: PDFKit.Mixins.TextOptions = { underline: false, continued: false }) {
  return text(doc, 'fonts/SourceSansPro-Regular.ttf', DEFAULT_FONTSIZE, str, options)
}

function capitalize(text: string): string {
  if (text)
    return text[0].toUpperCase() + text.substr(1)

  return ''
}

function renderHeading(doc: PDFKit.PDFDocument, lang: string, text: string): void {
  doc.font('fonts/ScopeOne-Regular.ttf')
    .fillColor(DEFAULT_COLOR)
    .fontSize(14)

  const label = capitalize(translate(lang, text))
  doc
    // .moveDown(0.5)
    .text(label)

  const w = doc.heightOfString(label) / 2
  doc
    .strokeColor(DEFAULT_COLOR)
    .lineWidth(1)
    .moveTo(doc.x + doc.widthOfString(label) + 10, doc.y - w)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y - w)
    .stroke()
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

function renderPosition(doc: PDFKit.PDFDocument, text: string): void {
  doc.font('fonts/SourceSansPro-Semibold.ttf')
    .fillColor(ACCENT_COLOR)
    .fontSize(DEFAULT_FONTSIZE)
    .moveDown(0.5)
    .text(text, { characterSpacing: 1.0 })
}

function renderInstitutionDate(doc: PDFKit.PDFDocument, institution: string, from: string, to: string): void {
  doc.font('fonts/ScopeOne-Regular.ttf')
    .fillColor(DEFAULT_COLOR)
    .fontSize(10)

    .text(institution)
    .moveUp(1)
    .text(`${from} – ${to}`, { align: 'right' })
}

function renderSectionTitle(doc: PDFKit.PDFDocument, lang: string, text: string): void {
  doc.font('fonts/SourceSansPro-Semibold.ttf')
    .fillColor(DEFAULT_COLOR)
    .fontSize(DEFAULT_FONTSIZE)
    .moveDown(0.5)
    .text(formatSectionTitle(lang, text))
    .moveUp(1.0)
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
          .fillColor(ACCENT_COLOR)
          .fontSize(DEFAULT_FONTSIZE)
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
    doc.ellipse(doc.x + 3, doc.y + 8, 2, 2).fill(DEFAULT_COLOR)
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

function renderChild(doc: PDFKit.PDFDocument, lang: string, child: Node, first = false): void {
  const left = doc.x
  switch (child.type) {
    case Kind.Header:
      if (child.depth === 1) {
        if (!first) {
          doc.y += 20
        }
        renderHeading(doc, lang, child.children[0].value)
      } else if (child.depth === 2) {
        renderSectionTitle(doc, lang, child.children[0].value)
      }
      break
    default: {
      const oldX = doc.x
      doc.x = left + 100
      renderSubchild(doc, child)
      doc.x = oldX
    }
  }
}

function renderEntries(doc: PDFKit.PDFDocument, lang: string, entries: Entry[], heading: string) {
  renderHeading(doc, lang, heading)
  for (const entry of entries) {
    const x = doc.x
    const y = doc.y

    if (lastTimeline) {
      doc
        .moveTo(x + 3, lastTimeline + 3)
        .lineTo(x + 3, y + 9)
        .dash(3, { space: 3 })
        .lineWidth(0.5)
        .stroke(DEFAULT_COLOR)
        .lineWidth(1)
        .undash()
    }

    doc.x += 12
    doc.y = y

    renderPosition(doc, entry.position)
    doc.ellipse(x + 3, doc.y - 7, 2).stroke(DEFAULT_COLOR)
    lastTimeline = doc.y - 5

    renderInstitutionDate(doc, entry.institution, entry.startedAt, entry.endsAt)
    doc.y += 2

    for (const node of entry.description) {
      renderSubchild(doc, node)
    }

    doc.x = x
    doc.y += 5
  }

  if (lastTimeline) {
    doc
      .moveTo(doc.x + 3, lastTimeline + 3)
      .lineTo(doc.x + 3, doc.y)
      .dash(3, { space: 3 })
      .lineWidth(0.5)
      .stroke(DEFAULT_COLOR)
      .lineWidth(1)
      .undash()
    lastTimeline = null
  }
}

function line(doc: PDFKit.PDFDocument, lang: string, width: number, key: string, iconName: string, value: string, link?: string) {
  doc
    .save()
    .translate(doc.x, doc.y)
    .scale(0.4)
    .path(icon(iconName))
    .fill(ACCENT_COLOR)
    .restore()

  doc.x += 16
  fontBold(doc, capitalize(translate(lang, key)))

  for (const line of value.split(/\n/g)) {
    fontRegular(doc, line, { underline: false, continued: false, link })
  }
  doc.x -= 16

  doc.y += 8

  return doc
}

function renderLeftColumn(cv: CV, doc: PDFKit.PDFDocument, width: number) {
  const lang = cv.lang
  const formatter = new Intl.DateTimeFormat(lang, { day: '2-digit', month: '2-digit', year: 'numeric' })

  if (cv.middleName)
    line(doc, lang, width, 'complete name', '4-user', `${cv.firstName} ${cv.middleName} ${cv.lastName}`)
  line(doc, lang, width, 'birth', '270-cake', `${formatter.format(cv.dateOfBirth)} ${translate(lang, 'in')} ${translate(lang, cv.placeOfBirth)}`)
  line(doc, lang, width, 'address', '21-home', cv.address)
  if (cv.citizenship)
    line(doc, lang, width, 'citizenship', '264-flag-waving', translate(lang, cv.citizenship))

  if (cv.phone)
    line(doc, lang, width, 'phone', '166-mobile-phone', labelPhone(cv.phone), `tel:${cv.phone.replace(/[^\d+]/g, '')}`)
  if (cv.email)
    line(doc, lang, width, 'email', '11-envelope', cv.email, `mailto:${cv.email}`)
  if (cv.github)
    line(doc, lang, width, 'github', 'github', `@${cv.github}`, `https://github.com/${cv.github}`)
  if (cv.linkedin)
    line(doc, lang, width, 'linkedin', 'linkedin', `linkedin.com/in/${cv.linkedin}`, `https://www.linkedin.com/in/${cv.linkedin}`)

  const offsetX = doc.x
  const offsetY = doc.y + 20
  doc.x = offsetX
  doc.y = offsetY
  doc.font('fonts/SourceSansPro-Semibold.ttf')
    .fillColor(DEFAULT_COLOR)
    .fontSize(DEFAULT_FONTSIZE)
    .text(capitalize(translate(lang, 'language skills')))

  let i = 0
  for (const [language, skill] of Object.entries(cv.languageSkills)) {
    doc.x = offsetX + (i % 2) * (width / 2)
    doc.y = offsetY + 16 + Math.floor(i / 2) * 32

    doc.font('fonts/SourceSansPro-Regular.ttf')
      .fillColor(ACCENT_COLOR)
      .fontSize(DEFAULT_FONTSIZE)
      .text(capitalize(translate(lang, language)))

    for (let s = 0; s < 5; s += 1) {
      doc.ellipse(doc.x + s * 10 + 4, doc.y + 7, 3).stroke()
    }

    let s
    for (s = 0; s < Math.floor(skill / 2); s += 1) {
      doc.ellipse(doc.x + s * 10 + 4, doc.y + 7, 3).fillColor(DEFAULT_COLOR).fill()
    }

    if (skill % 2 === 1) {
      doc.save()
        .rect(doc.x + s * 10 + 1, doc.y + 4, 3, 6).clip()
        .ellipse(doc.x + s * 10 + 4, doc.y + 7, 3).fillColor(DEFAULT_COLOR).fill()
        .restore()
    }

    i += 1
  }
}

export function renderPDF(cv: CV, stream: Writable) {
  // Create a document
  const margins = { left: 20 * MM_TO_PT, right: 20 * MM_TO_PT, top: 20 * MM_TO_PT, bottom: 20 * MM_TO_PT }
  const doc = new PDFDocument({ size: [210 * MM_TO_PT, 297 * MM_TO_PT], margins })
  const { page } = doc

  doc.pipe(stream)

  // PDF metadata
  setMetadata(cv, doc)

  // Width calculation
  const columnGap = 10 * MM_TO_PT
  // page.width = page.margins.left + page.margins.right + columnGap + 3*column1
  const column1 = (page.width - (page.margins.left + page.margins.right + columnGap)) / 3
  const column2 = column1 * 2

  const x = doc.x
  doc.x = page.margins.left
  doc.y = page.margins.top

  // Render Name
  doc.font('fonts/SourceSansPro-Semibold.ttf')
    .fillColor(DEFAULT_COLOR)
    .fontSize(14)
    .text(cv.fullName.toUpperCase(), { align: 'center', width: column1, characterSpacing: 0.5 })
  doc.font('fonts/SourceSansPro-Semibold.ttf')
    .fillColor(ACCENT_COLOR)
    .fontSize(DEFAULT_FONTSIZE)
    .text(cv.title, { align: 'center', width: column1 })

  // Render picture
  const picturePath = path.resolve(path.dirname(cv.filename), cv.picture)
  doc.x = x
  doc.y = page.margins.top + 45
  const radius = column1 / 2
  doc
    .save()
    .ellipse(doc.x + radius, doc.y + radius, radius)
    .clip()
    .image(picturePath, { fit: [column1, column1] })
    .restore()

  doc.x = x
  doc.y = page.margins.top + column1 + 70
  renderLeftColumn(cv, doc, column1)

  doc.x = page.margins.left + column1 + columnGap
  doc.y = page.margins.top
  renderEntries(doc, cv.lang, cv.experience, 'experience')
  doc.y += 20
  renderEntries(doc, cv.lang, cv.education, 'education')

  doc.x = page.margins.left
  let first = true
  for (const child of cv.body.children) {
    renderChild(doc, cv.lang, child, first)
    first = false
  }

  // Finalize PDF file
  doc.end()
}
