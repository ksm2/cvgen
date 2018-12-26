import frontMatter from 'front-matter'
import fs from 'fs'
import markdownToAst from 'markdown-to-ast'
import { CV } from './interfaces'

export async function readFile(filename: string): Promise<CV> {
  const file = await fs.promises.readFile(filename, 'utf8')
  const { attributes, body: markdown } = frontMatter(file)
  const body = markdownToAst.parse(markdown)

  attributes.dateOfBirth = new Date(attributes.dateOfBirth)

  return { ...attributes, filename, body }
}
