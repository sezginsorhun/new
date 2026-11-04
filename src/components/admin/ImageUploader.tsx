"use client";

import { useRef, useState } from "react";
import { Link2, Upload } from "lucide-react";

/**
 * Görsel seçimi: dosya yükle VEYA hazır bir adres yapıştır.
 * Yükleme /api/admin/upload adresine gider (public/uploads klasörüne yazar).
 */
/** httpOnly olmayan csrf çerezini okur. */
export function readCsrfCookie(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export default function ImageUploader({
  onPicked,
  label = "Görsel",
}: {
  onPicked: (url: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [urlValue, setUrlValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      // CSRF jetonu: sunucunun yazdığı çerezden okunur ve formla birlikte
      // gönderilir. Başka bir site bu çerezi okuyamaz.
      body.append("csrf", readCsrfCookie());
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body,
        credentials: "same-origin",
      });
      const data = await response.json();
      if (data.ok) onPicked(data.url);
      else setError(data.error ?? "Yüklenemedi.");
    } catch {
      setError("Yükleme sırasında bağlantı hatası oluştu.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) upload(file);
          }}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="btn-outline btn-sm"
        >
          <Upload size={14} strokeWidth={1.5} />
          {busy ? "Yükleniyor..." : "Dosya Yükle"}
        </button>

        <div className="flex min-w-[240px] flex-1 gap-2">
          <div className="relative flex-1">
            <Link2
              size={14}
              strokeWidth={1.5}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-muted)]"
            />
            <input
              value={urlValue}
              onChange={(event) => setUrlValue(event.target.value)}
              placeholder="veya görsel adresi yapıştır"
              className="field pl-9 text-[13px]"
            />
          </div>
          <button
            type="button"
            disabled={!urlValue.trim()}
            onClick={() => {
              onPicked(urlValue.trim());
              setUrlValue("");
            }}
            className="btn-outline btn-sm shrink-0"
          >
            Ekle
          </button>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}
      <p className="help">JPG, PNG, WEBP veya AVIF — en fazla 6 MB.</p>
    </div>
  );
}
