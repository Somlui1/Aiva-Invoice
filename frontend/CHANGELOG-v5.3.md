# AIVA Portal v5.3 — ปรับดีไซน์ให้เหมือน aiva-react (Dark / Light Premium)

**ขอบเขต:** เปลี่ยนเฉพาะ UX และสไตล์ · business logic, RBAC, workflow, API, Prisma และ server **ไม่เปลี่ยน**

## สิ่งที่เปลี่ยน

| ส่วน | รายละเอียด | ไฟล์ |
|---|---|---|
| ธีม Dark/Light | ค่าเริ่มต้น Dark · จำค่าใน `localStorage["aiva.theme"]` · index.html ตั้งธีมก่อนวาดหน้าแรก (ไม่กะพริบ) · สลับด้วย View Transition วงกลมขยายจากปุ่ม + bloom/sparks/ring/HUD | `src/lib/theme.ts`, `src/components/shell/ThemeSwitch.tsx`, `index.html` |
| Design layer | `theme.css` = style-15 ของ aiva-react (token Graphite/Porcelain) · `fx.css` = style-16 (icon duotone, แอนิเมชันเข้าแอป, splash, cmdk) | `src/styles/aiva/theme.css`, `fx.css` |
| Dark compat | สร้างอัตโนมัติ: แปลงสีตายตัวใน CSS เดิมเป็นโหมดมืด ใช้ค่าจริงจาก style คู่ light/dark ของ aiva-react ก่อน (selector ตรงกัน) ไม่งั้นแปลงตามค่าความสว่าง · ใช้ `:where()` จึงไม่ชนะ theme.css · **ไม่แตะหน้า PDF / canvas / bbox** (หน้าเอกสารยังขาว) | `src/styles/aiva/dark-compat.css` (`tools/gendark.py`) |
| หน้า Intro | Splash แบบ aiva-react ทุกครั้งที่โหลดหน้า (~2.1 วิ · คลิกข้ามได้) · มีเซสชัน → "Welcome back" + ชื่อ/บทบาท · ไม่แสดงใน `/viewer/*` และตอนรัน test · `?nosplash` เพื่อปิด | `src/components/shell/SplashScreen.tsx` |
| เอฟเฟกต์เข้าแอป | หลัง splash: เมนู/แถบบน/KPI/แถวตารางค่อย ๆ ซูม-เลื่อนเข้าตำแหน่ง (`html.fx-in`) + การ์ดต้อนรับ · หลังกดเข้าสู่ระบบ: วาร์ปจากโลโก้ → reload → ข้าม splash แล้วเล่นเอฟเฟกต์ + "เข้าสู่ระบบสำเร็จ" · ออกจากระบบ: shell เบลอ-ย่อหายก่อน logout | `src/lib/fx.ts` |
| ขนาด/สเกล | ใช้ token ของ aiva-react ทั้งหมด (ฟอนต์ Bai Jamjuree, `--hdr-h:52px`, `--nav-w:236px`, radius, ขนาดตัวอักษร) ให้หน้าจอมีสเกลเท่ากัน | `theme.css`, `index.html` |
| ค้นหา Ctrl K | Command Palette: หมวด ทั้งหมด/หน้า/เอกสาร/ระบบ · ↑↓ Enter Tab Esc · เอกสารมาจาก `visibleDocs` (กรองสิทธิ์แล้ว) · ADM ไม่เห็นเอกสาร · เปิดเอกสารที่ถูกตัวกรองซ่อน → ล้าง/ปรับตัวกรองให้เห็น + toast | `src/components/shell/CommandPalette.tsx` |
| Topbar | breadcrumb (AIVA › หน้า) · ปุ่มค้นหา · สถานะ Engine (เดิม) · สวิตช์ธีม · ปุ่มโปรไฟล์ (เดิม + avatar) · ออกจากระบบ (เดิม + FX) | `src/components/layout/Topbar.tsx` |
| Sidebar | หัวเมนูแบบ aiva-react (โลโก้ + wordmark + ปุ่มย่อเมนู) · เงื่อนไขเมนูตามบทบาทเหมือนเดิม (แยกเป็น `useNavSections()` ใช้ร่วมกับ Ctrl K) · คีย์ลัด `[` คงเดิม | `src/components/layout/Sidebar.tsx` |
| Login | `id="lg"` + พื้นหลัง aurora/grid + โลโก้ wordmark + สวิตช์ธีม · ขั้นตอน LDAP/M365 และแผง HowItWorks เหมือนเดิม | `LoginPage.tsx`, `LoginForm.tsx`, `styles/aiva/login-*.css` (`tools/genlogin.py`) |
| ไอคอน | ชุด Prism (duotone) จาก aiva-react · ชื่อเดิมใช้ได้ทั้งหมด (ไม่มีใน Prism → ใช้ path เดิม) | `src/components/common/prismIcons.ts`, `Icon.tsx`, `features/login/ui/Icon.tsx` |
| สี inline | สีตายตัวใน ROLES / KPI / Modal / MyProfileModal / action config → token (`var(--t-*)`, `var(--s-*)`) เพื่อรองรับทั้งสองธีม | `mock/users.ts`, `mock/rules.ts`, `QueueKpiCards.tsx`, `Modal.tsx`, `MyProfileModal.tsx`, `features/login/data/*` |

## Bug fix
- `App.tsx` (PortalShell): `useEffect` ของคีย์ลัดถูกเรียกหลัง `return` ก่อนกำหนดตอนยังไม่เข้าสู่ระบบ (ผิด Rules of Hooks → React error ตอนสถานะ login เปลี่ยน) · ย้าย hook ขึ้นก่อน return และให้ทำงานเฉพาะตอนเข้าสู่ระบบแล้ว

## Test
- เพิ่ม `src/test/aivaShellV53.test.tsx` (ธีม · Ctrl K · breadcrumb · ADM ไม่เห็นเอกสาร)
- `dockFocus.test.tsx`: แก้เฉพาะคอมเมนต์ (ปุ่ม "ย่อ / ขยายเมนู" ย้ายจาก Topbar ไปหัว Sidebar · aria-label เดิม)
- test อื่นไม่ได้แก้

## สิ่งที่ยังไม่ได้ตรวจ (ข้อจำกัดของเครื่องที่ใช้แปลง)
- ไม่มี npm registry / browser: **ยังไม่ได้รัน `npm run build`, `vitest`, และยังไม่ได้ดูหน้าจอจริง**
- ตรวจแล้ว: `tsc` เฉพาะไฟล์ที่แก้ (ไม่พบ error ที่ไม่เกี่ยวกับ type ของ package ที่ไม่ได้ติดตั้ง) · CSS ทุกไฟล์ parse ผ่าน postcss
- ควรตรวจหลังติดตั้ง: `npm ci && npm run typecheck && npm test && npm run dev` แล้วดูทั้ง 2 ธีม โดยเฉพาะหน้า Permission Excel grid, Evidence dock, Simulator และ `/viewer/:id` (standalone viewer ยังใช้สไตล์เดิม)
- Google Fonts เป็น external dependency (เหมือน aiva-react) · ถ้าเครือข่ายภายในบล็อก จะ fallback เป็น Noto Sans Thai / Segoe UI

## สร้างไฟล์ที่ generate ใหม่ (ถ้าแก้ CSS เดิม)
```bash
python3 tools/gendark.py src/styles/aiva/dark-compat.css src/styles/base.css src/styles/layout.css src/styles/queue.css src/styles/evidence.css src/styles/components.css src/styles/permissionGrid.css src/features/login/login.css
python3 tools/genlogin.py
```
(รันจากโฟลเดอร์ root ของ project · สไตล์ต้นฉบับ aiva-react อยู่ใน `reference/aiva-styles/`)
