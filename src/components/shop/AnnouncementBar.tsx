"use client";

/**
 * DUYURU ŞERİDİ
 * Metinler yönetim panelindeki "Ayarlar → Duyuru şeridi" alanından gelir.
 * Birden fazla satır yazılırsa sırayla döner.
 */

import { useEffect, useState } from "react";

export default function AnnouncementBar({
  items,
  background,
  color,
}: {
  items: string[];
  background: string;
  color: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % items.length), 4500);
    return () => clearInterval(timer);
  }, [items.length]);

  if (!items.length) return null;

  return (
    <div style={{ background, color }} role="status" aria-live="polite">
      <div className="container-page flex h-9 items-center justify-center overflow-hidden">
        <p className="animate-fade-up text-center text-[11.5px] font-medium tracking-[0.04em]" key={index}>
          {items[index]}
        </p>
      </div>
    </div>
  );
}
