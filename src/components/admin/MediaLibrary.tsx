"use client";

/**
 * MEDYA KÜTÜPHANESİ
 * Yüklenen tüm görseller. Yükle, açıklama (alt metni) yaz, kaldır.
 */

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Copy, Check, Trash2, Upload } from "lucide-react";
import { deleteMediaAction, updateMediaAltAction } from "@/actions/admin-home";
import { readCsrfCookie } from "./ImageUploader";

export type Asset = {
  id: string;
  url: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  storage: string;
  createdAt: Date;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function MediaLibrary({ assets }: { assets: Asset[] }) {
  const [items, setItems] = useState(assets);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(files: FileList) {
    setBusy(true);
    setError(null);
    for (const file of Array.from(files)) {
      const body = new FormData();
      body.append("file", file);
      body.append("csrf", readCsrfCookie());
      try {
        const response = await fetch("/api/admin/upload", {
          method: "POST",
          body,
          credentials: "same-origin",
        });
        const data = await response.json();
        if (data.ok) setItems((list) => [data.asset, ...list]);
        else setError(data.error ?? "Yüklenemedi.");
      } catch {
        setError("Yükleme sırasında bağlantı hatası oluştu.");
      }
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-[14px] font-semibold">{items.length} görsel</p>
          <p className="text-[12px] text-[color:var(--color-muted)]">
            JPG, PNG, WEBP, AVIF veya GIF · en fazla 6 MB. Dosyanın gerçek türü sunucuda
            denetlenir.
          </p>
        </div>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          className="hidden"
          onChange={(event) => {
            if (event.target.files?.length) upload(event.target.files);
          }}
        />
        <button type="button" className="btn-primary btn-sm" disabled={busy}
          onClick={() => fileRef.current?.click()}>
          <Upload size={14} strokeWidth={1.8} />
          {busy ? "Yükleniyor..." : "Görsel yükle"}
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      {items.length === 0 ? (
        <div className="card p-12 text-center text-[13.5px] text-[color:var(--color-muted)]">
          Kütüphane boş.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((asset) => (
            <div key={asset.id} className="card overflow-hidden">
              <div className="relative aspect-[4/3] bg-[color:var(--color-surface-2)]">
                <Image src={asset.url} alt={asset.alt ?? ""} fill sizes="320px" className="object-cover" />
              </div>
              <div className="space-y-2 p-3">
                <p className="truncate text-[12.5px] font-medium" title={asset.fileName}>
                  {asset.fileName}
                </p>
                <p className="text-[11.5px] text-[color:var(--color-muted)]">
                  {asset.width && asset.height ? `${asset.width}×${asset.height} · ` : ""}
                  {formatSize(asset.sizeBytes)}
                  {asset.storage === "db" ? " · veritabanında" : ""}
                </p>

                <input
                  defaultValue={asset.alt ?? ""}
                  placeholder="Görsel açıklaması"
                  className="field text-[12.5px]"
                  onBlur={(event) =>
                    startTransition(async () => {
                      await updateMediaAltAction(asset.id, event.target.value);
                    })
                  }
                />

                <div className="flex gap-1.5">
                  <button
                    type="button"
                    className="btn-ghost btn-sm flex-1"
                    onClick={() => {
                      navigator.clipboard?.writeText(asset.url);
                      setCopied(asset.id);
                      setTimeout(() => setCopied(null), 1600);
                    }}
                  >
                    {copied === asset.id ? (
                      <><Check size={13} strokeWidth={2} /> Kopyalandı</>
                    ) : (
                      <><Copy size={13} strokeWidth={1.6} /> Adresi kopyala</>
                    )}
                  </button>
                  <DeleteButton
                    disabled={pending}
                    onConfirm={() =>
                      startTransition(async () => {
                        const result = await deleteMediaAction(asset.id);
                        if (result?.ok) setItems((list) => list.filter((a) => a.id !== asset.id));
                      })
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DeleteButton({ onConfirm, disabled }: { onConfirm: () => void; disabled?: boolean }) {
  const [armed, setArmed] = useState(false);
  return (
    <button
      type="button"
      disabled={disabled}
      className={armed ? "btn-sm btn-brand" : "btn-ghost btn-sm"}
      onClick={() => {
        if (armed) onConfirm();
        else {
          setArmed(true);
          setTimeout(() => setArmed(false), 4000);
        }
      }}
    >
      <Trash2 size={13} strokeWidth={1.6} />
      {armed ? "Emin?" : ""}
    </button>
  );
}
