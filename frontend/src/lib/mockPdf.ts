/**
 * Generates a structurally valid single-page PDF.
 *
 * Lives here rather than in the route file because Next type-checks route
 * modules and rejects any export that is not a route export or route option.
 */

/** Assembles a valid one-page PDF with a caption at the top-left. */
export function buildMockPdf(label: string): Buffer {
  const safe = label.replace(/[\\()]/g, '')
  const content = `BT /F1 18 Tf 60 780 Td (${safe}) Tj ET`
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]

  const chunks: Buffer[] = [Buffer.from('%PDF-1.4\n')]
  let pos = chunks[0].length
  const offsets: number[] = []
  objects.forEach((body, i) => {
    const obj = Buffer.from(`${i + 1} 0 obj\n${body}\nendobj\n`)
    offsets.push(pos)
    pos += obj.length
    chunks.push(obj)
  })

  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const off of offsets) xref += `${String(off).padStart(10, '0')} 00000 n \n`
  chunks.push(
    Buffer.from(xref),
    Buffer.from(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${pos}\n%%EOF\n`),
  )
  return Buffer.concat(chunks)
}
