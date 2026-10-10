/** ปลายทางหลังล็อกอินต้องเป็น path ภายในเท่านั้น (กัน open redirect) · ใช้ได้ทั้ง server และ client */
export function safeRedirect(to: string | undefined | null, fallback: string): string {
  return to && to.startsWith("/") && !to.startsWith("//") && !to.includes("\\") ? to : fallback;
}
