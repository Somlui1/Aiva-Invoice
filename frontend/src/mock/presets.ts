export interface PresetItem {
  id: string
  title: string
  getPayload?: () => Record<string, unknown>
}

export interface PresetGroup {
  group: string
  presets: PresetItem[]
}

export const PRESETS: PresetGroup[] = [
  {
    group: 'เอกสารใหม่ (ไม่ซ้ำ)',
    presets: [
      {
        id: 'new_ap',
        title: 'RESOLVED · 1 ใบรับ 1 PO · AUTO_PASS',
        getPayload: () => ({
          rid: 'RCV-530340200',
          inv: 'TS-2610-0010',
          stax: '0105536012345',
          org: 103,
          receiver: 'SOMSAK JAIDEE',
          pos: ['40130201'],
          total: 20415.6,
          upl: 'SOMSAK.J'
        })
      },
      {
        id: 'new_multi',
        title: 'RESOLVED · 1 ใบรับ 2 PO · AUTO_PASS',
        getPayload: () => ({
          rid: 'RCV-530340210',
          inv: 'TS-2610-0020',
          stax: '0105536012345',
          org: 103,
          receiver: 'SOMSAK JAIDEE',
          pos: ['40130211', '40130212'],
          total: 38500,
          upl: 'SOMSAK.J'
        })
      },
      {
        id: 'new_rev_eu',
        title: 'RESOLVED · REVIEW (E10 ผู้ใช้งานแก้)',
        getPayload: () => ({
          rid: 'RCV-530340220',
          inv: 'SA-2610-0030',
          stax: '0105539044556',
          org: 376,
          receiver: 'THANAKORN MANKONG',
          pos: ['40130221'],
          codes: ['E10'],
          total: 12198,
          upl: 'THANAKORN.M'
        })
      },
      {
        id: 'new_rev_acc',
        title: 'RESOLVED · REVIEW (E11 ฝ่ายบัญชีตัดสิน)',
        getPayload: () => ({
          rid: 'RCV-530340230',
          inv: 'TS-2610-0040',
          stax: '0105536012345',
          org: 103,
          receiver: 'SOMSAK JAIDEE',
          pos: ['40130231'],
          codes: ['E11'],
          total: 3852,
          upl: 'SOMSAK.J'
        })
      },
      {
        id: 'new_hold',
        title: 'RESOLVED · HOLD (E09 + E03)',
        getPayload: () => ({
          rid: 'RCV-530340240',
          inv: 'PT-2610-0050',
          stax: '0105548077777',
          org: 352,
          receiver: 'WILAIWAN SRISUK',
          pos: ['40130241'],
          codes: ['E09', 'E03'],
          total: 13910,
          upl: 'WILAIWAN.S'
        })
      },
      {
        id: 'new_unmapped',
        title: 'RESOLVED · Receiver ยังไม่เชื่อมบัญชี (E10)',
        getPayload: () => ({
          rid: 'RCV-530340250',
          inv: 'PL-2610-0060',
          stax: '0105546011116',
          org: 103,
          receiver: 'PRAPHAN KAEWKLA',
          pos: ['40130251'],
          codes: ['E10'],
          total: 14552,
          upl: 'PRAPHAN.K'
        })
      },
      {
        id: 'new_mr_known',
        title: 'RESOLVED · MANUAL_REVIEW (ORG_ID ไม่ทราบ · ทราบเจ้าของ)',
        getPayload: () => ({
          rid: 'RCV-530340260',
          inv: 'MG-2610-0070',
          stax: '0105546011116',
          org: 556,
          receiver: 'NARONG PHOLSRI',
          pos: ['48000131'],
          rec: 'MANUAL_REVIEW',
          total: 5778,
          upl: 'NARONG.P',
          ctax: null
        })
      },
      {
        id: 'new_nf',
        title: 'NOT_FOUND · ไม่พบใบรับ (E05) → Hold ไม่มี Receiver',
        getPayload: () => ({
          idStatus: 'NOT_FOUND',
          inv: 'SW-2610-0080',
          stax: '0105537011111',
          co: 'AHT',
          codes: ['E05'],
          total: 19688,
          upl: 'WILAIWAN.S'
        })
      },
      {
        id: 'new_e02',
        title: 'NOT_FOUND · E02 หยุดก่อนค้น Oracle → Hold ไม่มี Receiver',
        getPayload: () => ({
          idStatus: 'NOT_FOUND',
          inv: 'SR-2610-0090',
          stax: '0103554001122',
          co: 'AH',
          codes: ['E02'],
          total: 599.2,
          upl: 'SOMSAK.J'
        })
      },
      {
        id: 'new_unres',
        title: 'UNRESOLVED · อ่าน Invoice + PO ไม่ได้ → Manual Review (ไม่ทราบเจ้าของ)',
        getPayload: () => ({
          idStatus: 'UNRESOLVED',
          missing: ['invoice_num', 'po_number'],
          stax: '0105546011116',
          co: 'AH',
          upl: 'SOMSAK.J',
          total: 6152.5
        })
      }
    ]
  },
  {
    group: 'สแกนซ้ำ · receive_id / Invoice เดิม',
    presets: [
      {
        id: 'dup_better',
        title: 'RCV530340501 (Hold) ← ใหม่ REVIEW · ดีกว่า → DR-01',
        getPayload: () => ({
          rid: 'RCV530340501',
          inv: 'DT-2610-0501',
          stax: '0105546011116',
          org: 103,
          receiver: 'SOMSAK JAIDEE',
          pos: ['40130101'],
          codes: ['E11'],
          total: 9095,
          upl: 'SOMSAK.J'
        })
      },
      {
        id: 'dup_worse',
        title: 'RCV530340502 (Review) ← ใหม่ HOLD · แย่กว่า → DR-03',
        getPayload: () => ({
          rid: 'RCV530340502',
          inv: 'PT-2610-0502',
          stax: '0105548077777',
          org: 352,
          receiver: 'WILAIWAN SRISUK',
          pos: ['40130102'],
          codes: ['E14', 'E03'],
          total: 8346,
          upl: 'WILAIWAN.S'
        })
      }
    ]
  }
]
