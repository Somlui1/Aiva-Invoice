import { Fragment } from 'react'
import { Icon, IconName } from '../common/Icon'
import { useAuth } from '../../context/AuthContext'
import { useInvoices } from '../../context/InvoiceContext'
import { useToastModal } from '../../context/ToastModalContext'

export type PageKey = 'queue' | 'ap' | 'rbac' | 'cases' | 'audit' | 'settings' | 'std' | 'sim'

interface SidebarProps {
  currentPage: PageKey
  onNavigate: (page: PageKey) => void
  onToggleNav: () => void
}

interface NavItemConfig {
  key: PageKey
  label: string
  icon: IconName
  isAllowed: boolean
  count?: number
  tag?: string
}

export function Sidebar({ currentPage, onNavigate, onToggleNav }: SidebarProps) {
  const { currentUser, can } = useAuth()
  const { visibleDocs, docs } = useInvoices()
  const { toast } = useToastModal()


  // Calculate dynamic badge counts
  const qn = visibleDocs.filter(d =>
    currentUser.role === 'EU'
      ? d.assigned === 'eu' &&
        !['Posted', 'Rejected', 'Confirmed', 'Sent', 'Superseded', 'Duplicate'].includes(d.status)
      : !['Posted', 'Rejected', 'Confirmed', 'Sent', 'Import Failed', 'Auto-pass'].includes(d.status)
  ).length

  const apCount = visibleDocs.filter(d => d.status === 'Confirmed').length
  const unboundCount = 0 // IT admin unbound indicator

  const sections: Array<{
    title: string
    isSpecial?: boolean
    items: NavItemConfig[]
  }> = [
    {
      title: 'งานหลัก',
      items: [
        {
          key: 'queue',
          label: currentUser.role === 'EU' ? 'งานของฉัน' : 'คิวตรวจสอบ',
          icon: 'inbox',
          isAllowed: currentUser.role !== 'ADM',
          count: qn
        },
        {
          key: 'ap',
          label: 'ส่งเข้า AP Interface',
          icon: 'send',
          isAllowed: can('VIEW_AP'),
          count: can('VIEW_AP') ? apCount : undefined
        }
      ]
    },
    {
      title: 'การกำกับดูแล',
      items: [
        {
          key: 'rbac',
          label: 'สิทธิ์และการเชื่อมบัญชี',
          icon: 'shield',
          isAllowed: true
        },
        {
          key: 'cases',
          label: 'ชุดเอกสารทดสอบ',
          icon: 'layers',
          isAllowed: true,
          count: docs.length
        },
        {
          key: 'audit',
          label: 'บันทึกการเข้าถึง',
          icon: 'log',
          isAllowed: can('AUDIT')
        },
        {
          key: 'settings',
          label: 'ตั้งค่า',
          icon: 'sliders',
          isAllowed: true,
          count: currentUser.role === 'ADM' && unboundCount ? unboundCount : undefined
        }
      ]
    },
    {
      title: 'สำหรับนักพัฒนา',
      items: [
        {
          key: 'std',
          label: 'มาตรฐาน Payload',
          icon: 'code',
          isAllowed: true,
          tag: 'API'
        }
      ]
    },
    {
      title: 'เครื่องมือพิเศษ',
      isSpecial: true,
      items: [
        {
          key: 'sim',
          label: 'Document Simulation',
          icon: 'flask',
          isAllowed: true,
          tag: 'SIM'
        }
      ]
    }
  ]

  const handleClick = (item: NavItemConfig) => {
    if (!item.isAllowed) {
      toast('ไม่มีสิทธิ์เข้าหน้านี้', true)
      return
    }
    onNavigate(item.key)
  }

  return (
    <aside className="nav" aria-label="เมนูหลัก">
      <div className="nav-org">
        <span className="av">AP</span>
        <div>
          <b>AAPICO AP Hub</b>
          <span>ระบบตรวจสอบใบแจ้งหนี้อัตโนมัติ</span>
        </div>
      </div>

      <nav className="nav-list">
        {sections.map(sec => (
          <Fragment key={sec.title}>
            <div className={`nav-sec ${sec.isSpecial ? 'sp' : ''}`}>{sec.title}</div>
            {sec.items.map(it => {
              const isActive = currentPage === it.key
              return (
                <button
                  key={it.key}
                  type="button"
                  className={`nav-it ${it.key === 'sim' ? 'sim' : ''} ${isActive ? 'on' : ''} ${
                    it.isAllowed ? '' : 'dis'
                  } ${it.count ? 'has-cnt' : ''}`}
                  title={`${it.label}${it.isAllowed ? '' : ' (ไม่มีสิทธิ์)'}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => handleClick(it)}
                >
                  <Icon name={it.icon} size="lg" />
                  <span className="lbl">{it.label}</span>
                  {!it.isAllowed && (
                    <span className="lock">
                      <Icon name="lock" size="sm" />
                    </span>
                  )}
                  {it.tag === 'SIM' && <span className="tagsim">SIM</span>}
                  {it.tag === 'API' && <span className="tagdev">API</span>}
                  {!!it.count && <span className="cnt">{it.count}</span>}
                </button>
              )
            })}
          </Fragment>
        ))}
      </nav>


      <div className="nav-foot">
        <span className="lbl grow">
          <b style={{ color: '#CBD5E1' }}>Standard</b> v6.10 · schema 1.7
        </span>
        <button
          type="button"
          className="ibtn"
          onClick={onToggleNav}
          title="ย่อ / ขยาย"
          aria-label="ย่อ / ขยาย"
        >
          <Icon name="chevsL" />
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
