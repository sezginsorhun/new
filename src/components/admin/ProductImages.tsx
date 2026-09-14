"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import type { ProductImage } from "@/db/schema";
import {
  addProductImageAction,
  deleteProductImageAction,
  reorderProductImageAction,
} from "@/actions/admin-products";
import ImageUploader from "./ImageUploader";

export default function ProductImages({
  productId,
  images,
  colorNames,
}: {
  productId: string;
  images: ProductImage[];
  colorNames: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [colorName, setColorName] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function add(url: string) {
    startTransition(async () => {
      const result = await addProductImageAction(productId, url, colorName || null, null);
      setMessage(result.message ?? null);
      router.refresh();
    });
  }

  return (
    <div className="card p-5">
      <h3 className="text-[15px] font-semibold">Ürün Görselleri</h3>
      <p className="mb-4 text-[12px] text-[color:var(--color-muted)]">
        İlk görsel kapak olarak kullanılır. Bir görseli belirli bir renge bağlarsan,
        müşteri o rengi seçtiğinde o görsel öne çıkar.
      </p>

      {colorNames.length > 0 && (
        <div className="mb-3">
          <label className="label" htmlFor="img-color">Bu görsel hangi renge ait?</label>
          <select
            id="img-color"
            value={colorName}
            onChange={(event) => setColorName(event.target.value)}
            className="field !w-auto text-[13px]"
          >
            <option value="">Renk bağlama (genel görsel)</option>
            {colorNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      )}

      <ImageUploader onPicked={add} label="Yeni görsel ekle" />

      {message && (
        <p className="mt-2 text-[12.5px] text-[color:var(--color-success)]">{message}</p>
      )}

      {images.length === 0 ? (
        <p className="mt-6 py-6 text-center text-[13px] text-[color:var(--color-muted)]">
          Henüz görsel yok.
        </p>
      ) : (
        <div className={`mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 ${pending ? "opacity-60" : ""}`}>
          {images.map((image, index) => (
            <div key={image.id} className="group relative">
              <div className="relative overflow-hidden border border-[color:var(--color-line)] bg-[#f3ece8] aspect-product">
                <Image
                  src={image.url}
                  alt={image.alt ?? ""}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
                {index === 0 && (
                  <span className="absolute left-1.5 top-1.5 badge bg-[color:var(--color-ink)] text-white">
                    Kapak
                  </span>
                )}
              </div>

              <div className="mt-1.5 flex items-center justify-between">
                <span className="truncate text-[11px] text-[color:var(--color-muted)]">
                  {image.colorName ?? "genel"}
                </span>
                <span className="flex">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() =>
                      startTransition(async () => {
                        await reorderProductImageAction(image.id, productId, "up");
                        router.refresh();
                      })
                    }
                    aria-label="Yukarı taşı"
                    className="p-1 text-[color:var(--color-muted)] disabled:opacity-30"
                  >
                    <ArrowUp size={13} strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    disabled={index === images.length - 1}
                    onClick={() =>
                      startTransition(async () => {
                        await reorderProductImageAction(image.id, productId, "down");
                        router.refresh();
                      })
                    }
                    aria-label="Aşağı taşı"
                    className="p-1 text-[color:var(--color-muted)] disabled:opacity-30"
                  >
                    <ArrowDown size={13} strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      startTransition(async () => {
                        await deleteProductImageAction(image.id, productId);
                        router.refresh();
                      })
                    }
                    aria-label="Görseli sil"
                    className="p-1 text-[color:var(--color-muted)] hover:text-[color:var(--color-sale)]"
                  >
                    <Trash2 size={13} strokeWidth={1.5} />
                  </button>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
