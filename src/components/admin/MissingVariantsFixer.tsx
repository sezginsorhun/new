"use client";

/**
 * VARYANTSIZ ÜRÜNLERİ ONAR
 *
 * Tek düğme: seçeneği olmayan her ürüne "Tek seçenek / Standart" diye bir
 * varyant açar, stoğu sıfır bırakır. Sıfırdan başlaması bilinçli — var
 * olmayan stoğu "var" göstermek, karşılanamayacak siparişe yol açar.
 */

import { useState, useTransition } from "react";
import { Wrench } from "lucide-react";
import { createMissingVariantsAction } from "@/actions/admin-products";

export default function MissingVariantsFixer({ count }: { count: number }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await createMissingVariantsAction();
            setMessage(result?.message ?? "İşlem tamamlanamadı.");
            if (result?.ok) window.location.reload();
          })
        }
        className="btn-primary text-[12.5px]"
      >
        <Wrench size={13} strokeWidth={1.6} />
        {pending ? "Oluşturuluyor..." : `${count} ürüne varsayılan seçenek aç`}
      </button>
      {message && <span className="text-[12.5px]">{message}</span>}
    </div>
  );
}
