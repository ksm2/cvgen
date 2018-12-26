import fs from 'fs'
import path from 'path'
import { readFile, renderPDF } from '../src'

async function build() {
  const filename = path.resolve(process.cwd(), process.argv[2])
  const output = path.resolve(process.cwd(), process.argv[3])
  const document = await readFile(filename)

  try {
    await fs.promises.unlink(output)
  } catch (e) {
  }
  const stream = fs.createWriteStream(output)
  renderPDF(document, stream)
}

build().catch(console.error)
