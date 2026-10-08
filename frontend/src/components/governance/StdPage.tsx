import { Icon } from '../common/Icon'
import { useToastModal } from '../../context/ToastModalContext'

const SPEC_FIELDS = [
  ['contract', 'string', 'Y', 'รุ่นของสัญญาข้อมูล', 'const = aiva.portal.ingest/1.0'],
  ['message_id', 'string', 'Y', 'รหัสข้อความไม่ซ้ำทุกครั้งที่ส่ง', 'unique'],
  ['sent_at', 'datetime', 'Y', 'เวลาที่ Engine ส่ง (ISO 8601 +07:00)', ''],
  ['source.engine', 'string', 'Y', 'ชื่อ Engine', 'system_a'],
  ['source.engine_version', 'string', 'Y', 'เวอร์ชันโค้ด Engine', '3.0.4'],
  ['source.standard_version', 'string', 'Y', 'Standard ที่ใช้ตรวจ', '6.7'],
  ['source.validation_id', 'string', 'Y', 'อ้างอิงผลเต็ม aiva.system_a.result/3.0', ''],
  ['source.result_sha256', 'string', 'Y', 'hash ของผลเต็ม', '^[a-f0-9]{64}$'],
  ['document.dms_doc_id', 'string', 'Y', 'รหัสเอกสารใน DMS (ไม่ส่ง URL)', ''],
  ['document.file_sha256', 'string', 'Y', 'hash ไฟล์ PDF', '^[a-f0-9]{64}$'],
  ['document.page_count', 'integer', 'Y', 'จำนวนหน้า', '≥ 1'],
  ['document.uploaded_by', 'string', 'Y', 'ผู้สแกน · ใช้ติดต่อนอกระบบเมื่อไม่มี Receiver', ''],
  ['document.uploaded_at', 'datetime', 'Y', 'เวลาที่เข้า DMS · ใช้นับอายุเอกสาร', ''],
  ['identity.status', 'enum', 'Y', 'ผลการระบุตัวตนของรายการ', 'RESOLVED | NOT_FOUND | UNRESOLVED'],
  ['identity.reason', 'enum', 'Y', 'เหตุผล', 'FOUND | RECEIPT_NOT_FOUND | HALTED_BEFORE_LOOKUP | KEYS_UNREADABLE'],
  ['identity.receive_id', 'string|null', 'R', 'Receipt Number = Unique key ของรายการใน Portal', 'RESOLVED: ^[A-Z0-9-]{4,30}$ · อื่น ๆ: null'],
  ['identity.lookup_path', 'string|null', 'N', 'เส้นทางที่ค้นเจอใน Oracle', 'TAX-INV | PO-INV | PO-TAX'],
  ['identity.missing_keys', 'string[]', 'Y', 'คีย์ที่ OCR อ่านไม่ได้', 'invoice_num | po_number | supplier_tax_id'],
  ['invoice.invoice_num', 'string|null', 'Y', 'เลขที่ใบแจ้งหนี้', 'null เมื่อ OCR อ่านไม่ได้'],
  ['invoice.invoice_date', 'string|null', 'N', 'วันที่ใบแจ้งหนี้ (YYYY-MM-DD)', ''],
  ['invoice.supplier_tax_id', 'string|null', 'Y', 'Tax ID ผู้ขาย', '^\\d{13}$ หรือ null'],
  ['invoice.customer_tax_id', 'string|null', 'Y', 'Tax ID ลูกค้า', '^\\d{13}$ หรือ null'],
  ['decision.recommendation', 'enum', 'Y', 'ข้อเสนอแนะจาก Engine', 'AUTO_PASS | REVIEW | HOLD | MANUAL_REVIEW | SYSTEM_ERROR'],
  ['decision.max_severity', 'enum', 'Y', 'ระดับความรุนแรงสูงสุด', 'None | Low | Medium | High'],
  ['rules', 'RuleResult[]', 'Y', 'ผลตรวจกฎ 9 ข้อ', 'Array of 9 items']
]

export function StdPage() {
  const { toast } = useToastModal()

  const handleDownloadSchema = () => {
    const jsonStr = JSON.stringify(
      {
        $schema: 'http://json-schema.org/draft-07/schema#',
        title: 'AIVAPortalIngestPayload',
        contract: 'aiva.portal.ingest/1.0',
        properties: Object.fromEntries(
          SPEC_FIELDS.map(([name, type, req, desc]) => [
            name,
            { type, description: desc, required: req === 'Y' }
          ])
        )
      },
      null,
      2
    )

    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'aiva-portal-ingest-schema-1.0.json'
    a.click()
    URL.revokeObjectURL(url)
    toast('ดาวน์โหลด Schema เรียบร้อยแล้ว')
  }

  return (
    <div className="pg">
      <div className="tbar">
        <span className="lab">มาตรฐาน Payload Engine → Portal</span>
        <span className="scope-note">
          สัญญาข้อมูล aiva.portal.ingest/1.0 · รองรับระบบ OCR System-A
        </span>
        <span className="grow" />
        <button
          type="button"
          className="btn btn-primary sm"
          onClick={handleDownloadSchema}
        >
          <Icon name="dl" size="sm" />
          ดาวน์โหลด JSON Schema
        </button>
      </div>

      <div className="pg-scroll">
        <div className="panel">
          <div className="panel-h">
            <h3>พจนานุกรมฟิลด์ (Field Dictionary)</h3>
            <span className="muted sm">{SPEC_FIELDS.length} ฟิลด์</span>
          </div>

          <div className="tbl-wrap">
            <table className="t">
              <thead>
                <tr>
                  <th>ฟิลด์ (Path)</th>
                  <th>ประเภทข้อมูล</th>
                  <th>ความจำเป็น</th>
                  <th>คำอธิบาย</th>
                  <th>ข้อจำกัด / Format</th>
                </tr>
              </thead>
              <tbody>
                {SPEC_FIELDS.map(([path, type, req, desc, format]) => (
                  <tr key={path}>
                    <td className="mono">
                      <b>{path}</b>
                    </td>
                    <td className="mono">{type}</td>
                    <td>
                      <span className={`req${req}`}>
                        {req === 'Y' ? 'บังคับ (Y)' : req === 'R' ? 'บังคับตามเงื่อนไข (R)' : 'ไม่บังคับ (N)'}
                      </span>
                    </td>
                    <td>{desc}</td>
                    <td className="mono sm">{format}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StdPage
