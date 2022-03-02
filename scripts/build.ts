import fs from 'fs'
import path from 'path'
import { readFile, renderPDF } from '../src'

async function build() {
  if (process.argv.includes('--help') || process.argv.includes('-h') || process.argv.length < 4) {
    help();
    return;
  }

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

function help() {
  process.stdout.write(`\
Generator for résumés

USAGE
  ${process.argv[1]} INPUT OUTPUT

OPTIONS
  -h, --help  Show this help
`)
}

build().catch(console.error)
