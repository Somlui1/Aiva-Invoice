export const MENU_CONFIG = [
  {
    title: 'งานหลัก',
    items: [
      { key: 'queue', label: 'คิวตรวจสอบ', icon: 'inbox', action: 'VIEW_QUEUE' },
      { key: 'ap', label: 'ส่งเข้า AP Interface', icon: 'send', action: 'VIEW_AP' }
    ]
  },
  {
    title: 'การกำกับดูแล',
    items: [
      { key: 'rbac', label: 'สิทธิ์และการเชื่อมบัญชี', icon: 'shield', action: 'VIEW_QUEUE' },
      { key: 'audit', label: 'บันทึกการเข้าถึง', icon: 'log', action: 'AUDIT' },
      { key: 'settings', label: 'ตั้งค่า', icon: 'sliders', action: 'VIEW_QUEUE' }
    ]
  },
  {
    title: 'เครื่องมือทดสอบและพัฒนา',
    isSpecial: true,
    items: [
      { key: 'cases', label: 'ชุดเอกสารทดสอบ', icon: 'layers', action: 'VIEW_QUEUE' },
      { key: 'std', label: 'มาตรฐาน Payload', icon: 'code', tag: 'API', action: 'VIEW_QUEUE' },
      { key: 'sim', label: 'Document Simulation', icon: 'flask', tag: 'SIM', action: 'VIEW_QUEUE' }
    ]
  }
];

export default MENU_CONFIG;
