import frontMatter from 'front-matter'
import fs from 'fs'
import markdownToAst from 'markdown-to-ast'
import { formatDate } from './formatDate'
import { CV, Entry, FrontMatter, Kind, Node } from './interfaces';

function readNodes(body: Node[], section: string): [Node[], Node[]] {
  const nodes: Node[] = []
  const newBody: Node[] = []
  let inside = false
  for (const node of body) {
    if (node.type === Kind.Header && node.depth === 1) {
      if (node.children[0].value.toLowerCase() === section) {
        inside = true
        continue
      } else {
        inside = false
      }
    } else if (inside) {
      nodes.push(node)
      continue
    }

    newBody.push(node)
  }

  return [nodes, newBody]
}

function readDateRange(lang: string, text: string): [string, string] {
  if (!text.match(/\s*-\s*/)) {
    throw new TypeError(`Invalid date range: ${text}`)
  }

  const [from, to] = text.split(/\s*-\s*/, 2)

  return [formatDate(lang, from), formatDate(lang, to)]
}

function readEntries(lang: string, body: Node[], section: string): [Entry[], Node[]] {
  const entries: Entry[] = []
  const [nodes, newBody] = readNodes(body, section)

  let entry: Entry | null = null
  for (const node of nodes) {
    switch (node.type) {
      case Kind.Header: {
        entry = Object.create(null);
        entry.description = []
        entries.push(entry);
        [entry.startedAt, entry.endsAt] = readDateRange(lang, node.children[0].value)

        break
      }

      case Kind.Paragraph: {
        if (entry) {
          const child = node.children[0]
          if (child.type === Kind.Strong && !entry.position) {
            entry.position = child.children[0].value
            break
          } else if (!entry.institution) {
            entry.institution = child.value
            break
          }
        }
      }

      default: {
        entry.description.push(node)
      }
    }
  }

  return [entries, newBody]
}

export async function readFile(filename: string): Promise<CV> {
  const file = await fs.promises.readFile(filename, 'utf8')
  const { attributes, body: markdown } = frontMatter<FrontMatter>(file)

  const body = markdownToAst.parse(markdown)
  const fullName = `${attributes.firstName} ${attributes.lastName}`

  const [experience, newBody1] = readEntries(attributes.lang, body.children, 'experience')
  const [education, newBody2] = readEntries(attributes.lang, newBody1, 'education')
  body.children = newBody2

  return { ...attributes, filename, fullName, experience, education, body }
}
