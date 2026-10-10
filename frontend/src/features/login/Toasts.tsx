"use client";

import { useCallback, useRef, useState } from "react";
import { Icon } from "./ui/Icon";

export interface ToastItem {
  id: number;
  msg: string;
  error: boolean;
}

/** ข้อความแจ้งสั้น ๆ มุมขวาล่าง (หายเองใน 2.6 วินาที) · ถ้า project มีระบบ toast อยู่แล้วให้เปลี่ยน push() ไปเรียกของเดิมได้ */
export function useToasts() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const push = useCallback((msg: string, error = false) => {
    const id = ++seq.current;
    setItems((l) => [...l, { id, msg, error }]);
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), 2600);
  }, []);
  return { items, push };
}

export function Toasts({ items }: { items: ToastItem[] }) {
  return (
    <div className="lgx-toasts" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast${t.error ? " e" : ""}`} role="status">
          <Icon name={t.error ? "alert" : "checkc"} />
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
