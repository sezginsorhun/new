"use client";

/**
 * GÖRSEL SEÇİCİ
 *
 * Üç yol sunar:
 *   1) Bilgisayardan dosya yükle (medya kütüphanesine de kaydedilir)
 *   2) Daha önce yüklenmiş görsellerden seç
 *   3) Dış bir adres yapıştır (S3/Cloudinary kullanıyorsan)
 *
 * Seçilen değer gizli bir input'a yazılır, böylece normal form gönderimiyle
 * sunucuya gider.
 */

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Trash2, Upload, X } from "lucide-react";
import { readCsrfCookie } from "./ImageUploader";

type Asset = {
  id: string;
  url: string;
  fileName: string;
  alt: string | null;
  width: number | null;
  height: number | null;
};

export default function MediaPicker({
  name,
  label,
  value,
  hint,
  required,
}: {
  name: string;
  label: string;
  value?: string | null;
  hint?: string;
  required?: boolean;
}) {
  const [url, setUrl] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  /** Kütüphaneyi açarken listeyi tazeler. */
  async function openLibrary() {
    setOpen(true);
    setLoading(true);
    try {
      const response = await fetch("/api/admin/upload", { credentials: "same-origin" });
      const data = await response.json();
      setAssets(data.ok ? data.items : []);
    } catch {
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("csrf", readCsrfCookie());
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body,
        credentials: "same-origin",
      });
      const data = await response.json();
      if (data.ok) {
        setUrl(data.url);
        setAssets((list) => [data.asset, ...list]);
        setOpen(false);
      } else {
        setError(data.error ?? "Yüklenemedi.");
      }
    } catch {
      setError("Yükleme sırasında bağlantı hatası oluştu.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div>
      <span className="label">
        {label}
        {required && <span className="text-[color:var(--color-sale)]"> *</span>}
      </span>

      <input type="hidden" name={name} value={url} />

      <div className="flex items-start gap-3">
        <div className="relative h-[72px] w-[108px] shrink-0 overflow-hidden border border-[color:var(--color-line)] bg-[color:var(--color-surface-2)]">
          {url ? (
            <Image src={url} alt="" fill sizes="108px" className="object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center text-[11px] text-[color:var(--color-muted)]">
              Görsel yok
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) upload(file);
            }}
          />
          <button
            type="button"
            className="btn-outline btn-sm"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={14} strokeWidth={1.6} />
            {busy ? "Yükleniyor..." : "Yükle"}
          </button>
          <button type="button" className="btn-outline btn-sm" onClick={openLibrary}>
            <ImagePlus size={14} strokeWidth={1.6} />
            Kütüphaneden seç
          </button>
          {url && (
            <button type="button" className="btn-ghost btn-sm" onClick={() => setUrl("")}>
              <Trash2 size={14} strokeWidth={1.6} />
              Kaldır
            </button>
          )}
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}
      {hint && <p className="help">{hint}</p>}

      {/* Kütüphane */}
      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Kapat"
            className="absolute inset-0 bg-black/45"
            onClick={() => setOpen(false)}
          />
          <div className="relative flex max-h-[85vh] w-full max-w-[760px] flex-col bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[18px]">Medya kütüphanesi</h3>
              <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
                <X size={16} strokeWidth={1.6} />
              </button>
            </div>

            <div className="mb-4 flex gap-2">
              <input
                value={manual}
                onChange={(event) => setManual(event.target.value)}
                placeholder="veya görsel adresi yapıştır (https://...)"
                className="field text-[13px]"
              />
              <button
                type="button"
                className="btn-outline btn-sm shrink-0"
                disabled={!manual.trim()}
                onClick={() => {
                  setUrl(manual.trim());
                  setManual("");
                  setOpen(false);
                }}
              >
                Kullan
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {loading ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="skeleton aspect-square" />
                  ))}
                </div>
              ) : assets.length === 0 ? (
                <p className="py-10 text-center text-[13px] text-[color:var(--color-muted)]">
                  Kütüphane boş. Önce bir görsel yükle.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {assets.map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => {
                        setUrl(asset.url);
                        setOpen(false);
                      }}
                      title={asset.fileName}
                      className="relative aspect-square overflow-hidden border border-[color:var(--color-line)] transition hover:border-[color:var(--color-ink)]"
                    >
                      <Image src={asset.url} alt={asset.alt ?? ""} fill sizes="150px" className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
