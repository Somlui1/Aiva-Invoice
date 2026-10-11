# Design Document: PDF Dock Focus Layout, Production Sidebar & Revalidate Removal

## 1. Context & Motivation

During user testing of the AIVA Web Portal v4.18, three key usability and architectural gaps were identified:

1. **PDF Dock Layout Overflow & Unclickable Right Area:**
   When the PDF dock is opened (`pdf-open`), the layout sets `--mc: 60fr` and `--dc: 40fr`. However, the left queue column (`.q47`, width: 360px) and the navigation sidebar (width: 224px) remain expanded. Consequently, the total width exceeds 100% of the viewport (`360px + 60% + 40% = 360px + 100%`), forcing the PDF dock off the right side of the screen. Elements on the right side of the dock (such as "ปิด PDF", zoom controls, and pager) become clipped or unclickable.
   Additionally, opening the PDF should automatically collapse the navigation sidebar to icon mode, and clicking the 3-line hamburger button must force-close the PDF dock.
   When the PDF is displayed, the left queue column should be completely hidden (0px width) to allow a pure 60:40 Split View between Invoice Detail and PDF Evidence Dock.

2. **Unrealistic Sidebar Menu for Business Users:**
   The navigation sidebar currently presents test harnesses and developer documentation (`cases`, `std`, and `sim`) to all users (End Users and Accounting Officers). In a production portal, these developer/testing tools must be isolated and visible only to the IT / Administrator role (`ADM`).

3. **Obsolete "Revalidate" Action:**
   The business concept does not allow revalidation calls from the web portal back to the engine. If an invoice has errors or exceptions, the End User re-uploads an amended document or accounting acts on it (Confirm/Reject). The "Revalidate Engine" button and associated backend endpoints/contexts are dead concepts that must be completely removed from the codebase.

---

## 2. Requirements & Goals

### 2.1 PDF Focus Layout & Auto-Collapse
- When `isEvidenceDockOpen && selectedDoc` (`pdf-open`):
  - `#shell` automatically receives class `.nav-auto` (collapsing the navigation sidebar to 60px mini-icon bar).
  - Container `.work` receives class `pdf-open`.
  - The left queue column `.q47` is completely hidden (`display: none` / width: 0).
  - CSS variables `--qc` and `--rc` are set to `0px`.
  - CSS variables `--mc` and `--dc` scale cleanly to `(1 - splitRatio) * 100 + 'fr'` (60.0fr) and `splitRatio * 100 + 'fr'` (40.0fr).
  - All right-side controls within the dock (DockControls, zoom, page selector, and "ปิด PDF") remain 100% within the visible screen area and fully clickable.
- When the user clicks the 3-line hamburger menu (`onToggleNav`):
  - If `isEvidenceDockOpen` is `true`, it immediately closes the PDF dock (`closeEvidenceDock()`) and toggles navigation state.

### 2.2 Production-Ready Role-Based Sidebar
- **Regular Roles (`EU`, `ACC`, `APR`):**
  - Section "งานหลัก":
    - `queue` (งานของฉัน for EU / คิวตรวจสอบ for ACC/APR)
    - `ap` (ส่งเข้า AP Interface for ACC/APR with `VIEW_AP`)
  - Section "การกำกับดูแล":
    - `rbac` (สิทธิ์และการเชื่อมบัญชี)
    - `audit` (บันทึกการเข้าถึง for users with `AUDIT` permission)
    - `settings` (ตั้งค่า)
  - Completely hide `cases`, `std`, and `sim`.
- **IT / Administrator Role (`ADM`):**
  - Section "การกำกับดูแล": `rbac`, `audit`, `settings`.
  - Section "เครื่องมือทดสอบและพัฒนา" (IT / Dev Tools):
    - `cases` (ชุดเอกสารทดสอบ)
    - `std` (มาตรฐาน Payload)
    - `sim` (Document Simulation)

### 2.3 Complete Purge of "Revalidate"
- Remove the "Revalidate Engine" button from `InvoiceDetailPane.tsx`.
- Remove `revalidateDocWithBackend` from `InvoiceContext.tsx`.
- Remove `revalidateInvoice` from `backendApi.ts`.
- Delete `src/app/api/validations/[id]/revalidate/route.ts`.
- Clean up any tests in `backend-api.test.ts` or similar files referencing revalidate.

---

## 3. Architecture & Component Detailed Design

### 3.1 `App.tsx`
- Bind `.nav-auto` to `#shell` when `isEvidenceDockOpen`:
  ```tsx
  <div className={`shell ${isNavCollapsed ? 'nav-c' : ''} ${isEvidenceDockOpen ? 'nav-auto' : ''}`} id="shell">
  ```
- Update `toggleNav`:
  ```tsx
  const toggleNav = () => {
    if (isEvidenceDockOpen) {
      closeEvidenceDock()
    }
    setIsNavCollapsed(prev => {
      const next = !prev
      try {
        window.localStorage.setItem('aiva.nav', next ? 'c' : 'e')
      } catch {}
      return next
    })
  }
  ```

### 3.2 `QueuePage.tsx` & `queue.css`
- In `QueuePage.tsx`:
  When `dockVisible` is true:
  Set `--qc: 0px` and `--rc: 0px`.
  ```tsx
  style={{
    '--rc': '0px',
    '--qc': dockVisible ? '0px' : 'var(--q-w)',
    '--mc': dockVisible ? `${((1 - dockSplitRatio) * 100).toFixed(1)}fr` : '100fr',
    '--dc': dockVisible ? `${(dockSplitRatio * 100).toFixed(1)}fr` : '0fr',
  } as React.CSSProperties}
  ```
- In `queue.css`:
  Ensure `.work.pdf-open .q47 { display: none; }` so that Track 2 takes 0 width and does not force horizontal scroll or push Column 4 out of the viewport.

### 3.3 `Sidebar.tsx`
- Restructure `sections`:
  - If `currentUser.role === 'ADM'`:
    - Show "การกำกับดูแล" (`rbac`, `audit`, `settings`)
    - Show "เครื่องมือทดสอบและพัฒนา" (`cases`, `std`, `sim`)
  - Else (`EU`, `ACC`, `APR`):
    - Show "งานหลัก" (`queue`, and `ap` if allowed)
    - Show "การกำกับดูแล" (`rbac`, and `audit` if allowed, `settings`)

### 3.4 Removing Revalidation
- In `InvoiceDetailPane.tsx`: Remove the `revalidateDocWithBackend` button and hook import.
- In `InvoiceContext.tsx`: Remove `revalidateDocWithBackend` declaration, callback, and provider value.
- In `backendApi.ts`: Remove `revalidateInvoice`.
- In `src/app/api/validations/[id]/revalidate/route.ts`: Delete file.

---

## 4. Verification Plan

1. **Unit & Integration Tests (`src/test/dockFocusAndSidebar.test.tsx`):**
   - Verify `#shell` has `nav-auto` when dock is open.
   - Verify clicking `onToggleNav` when dock is open calls `closeEvidenceDock`.
   - Verify `.work.pdf-open` has `--qc: 0px` and hides `.q47`.
   - Verify `Sidebar` does not show `cases`, `std`, or `sim` for role `EU`, `ACC`, or `APR`.
   - Verify `Sidebar` shows `cases`, `std`, and `sim` under IT / Dev section for role `ADM`.
   - Verify `InvoiceDetailPane` does not render any Revalidate button.
2. **Regression Test Suite:**
   - Run `npm test` to ensure 100% test pass rate across all suites.
   - Run `npx tsc --noEmit` to verify type safety.
   - Run `npm run build` to confirm clean Next.js production build.
